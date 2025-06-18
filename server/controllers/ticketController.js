import { v4 as uuid } from 'uuid';

import { getTickets as fetchTickets, getCustomers, persistData } from '../models/data.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ticket-controller');

function findItemById(collection, id) {
  return collection.find((item) => item.id === id);
}

/**
 * Gets all tickets with pagination
 */
export const getTickets = async (req, res) => {
  try {
    const tickets = await fetchTickets();
    const customers = await getCustomers();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const sortedTickets = [...tickets].sort(
      (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTickets = sortedTickets.slice(startIndex, endIndex);

    const formattedTickets = paginatedTickets.map((ticket) => {
      const customer = findItemById(customers, ticket.customerId);

      return {
        id: ticket.id,
        title: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        customer: {
          id: customer?.id,
        },
        updatedAt: {
          iso8601: ticket.updatedAt ? ticket.updatedAt.toISOString() : new Date().toISOString(),
        },
        previewText: ticket.preview,
      };
    });

    const customerDataMap = {};
    formattedTickets.forEach((ticket) => {
      const customer = findItemById(customers, ticket.customer.id);
      if (customer) {
        customerDataMap[customer.id] = {
          id: customer.id,
          fullName: customer.name,
          email: customer.email,
        };
      }
    });

    logger.info('Returning tickets', {
      count: formattedTickets.length,
      total: sortedTickets.length,
      firstFew: formattedTickets.slice(0, 3),
    });

    res.json({
      success: true,
      tickets: formattedTickets,
      customerDataMap,
      pagination: {
        page,
        limit,
        total: tickets.length,
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
    });
  }
};

/**
 * Gets ticket details
 */
export const getTicketDetail = (req, res) => {
  try {
    const { tickets = [], customers = [], messages = [] } = global.appData || {};
    const { requestId } = req.query;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Ticket ID is required',
        code: 'missing_parameter',
      });
    }

    const normalizedTicketId = requestId.startsWith('ticket_') ? requestId : `ticket_${requestId}`;

    const ticket = findItemById(tickets, normalizedTicketId);

    if (!ticket) {
      const mockTicket = {
        id: normalizedTicketId,
        subject: 'Mock Ticket for Testing',
        status: 'open',
        priority: 1,
        customerId: 'mock_customer_id',
        createdAt: new Date(),
        updatedAt: new Date(),
        preview: 'This is a mock ticket created for testing purposes.',
      };

      const mockCustomer = {
        id: 'mock_customer_id',
        name: 'Mock Customer',
        email: 'mock@example.com',
      };

      return res.json({
        request: {
          id: mockTicket.id,
          title: mockTicket.subject,
          status: mockTicket.status,
          priority: mockTicket.priority,
          customer: {
            id: mockCustomer.id,
            fullName: mockCustomer.name,
          },
          createdAt: {
            iso8601: mockTicket.createdAt.toISOString(),
          },
          updatedAt: {
            iso8601: mockTicket.updatedAt.toISOString(),
          },
          timelineEntries: {
            items: [
              {
                id: `mock_message_${Date.now()}`,
                timestamp: new Date().toISOString(),
                actorType: 'customer',
                actorName: mockCustomer.name,
                entryType: 'chat',
                text: 'This is a mock message for testing purposes.',
                chatId: `chat_mock_${Date.now()}`,
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              currentPage: 1,
              totalPages: 1,
              totalItems: 1,
            },
          },
        },
      });
    }

    const customer = findItemById(customers, ticket.customerId);

    let ticketMessages = messages.filter(
      (m) =>
        m.ticketId === normalizedTicketId ||
        m.ticketId === normalizedTicketId.replace('ticket_', '')
    );

    if (ticketMessages.length === 0) {
      ticketMessages = [
        {
          id: `mock_message_${Date.now()}`,
          ticketId: normalizedTicketId,
          content: 'This is a mock message for testing purposes.',
          createdAt: new Date(),
          senderType: 'customer',
          senderId: ticket.customerId,
          senderName: 'Test Customer',
        },
      ];
    }

    ticketMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const formattedMessages = ticketMessages.map((message) => {
      const sender =
        message.senderType === 'customer'
          ? findItemById(customers, message.senderId)
          : findItemById(global.appData?.users ?? [], message.senderId);

      return {
        id: message.id,
        timestamp: message.createdAt.toISOString(),
        actorType: message.senderType,
        actorName: sender ? sender.name : message.senderName,
        entryType: 'chat',
        text: message.content,
        chatId: `chat_${message.id}`,
      };
    });

    return res.json({
      request: {
        id: ticket.id,
        title: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        customer: {
          id: customer.id,
          fullName: customer.name,
        },
        createdAt: {
          iso8601: ticket.createdAt.toISOString(),
        },
        updatedAt: {
          iso8601: ticket.updatedAt.toISOString(),
        },
        timelineEntries: {
          items: formattedMessages,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            currentPage: 1,
            totalPages: 1,
            totalItems: formattedMessages.length,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error getting ticket detail:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket details',
    });
  }
};

/**
 * Send a reply to a ticket
 */
export const sendReply = async (req, res) => {
  try {
    const { requestId, message } = req.body;

    if (!requestId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Ticket ID and message are required',
      });
    }

    const tickets = await fetchTickets();

    const normalizedTicketId = requestId.startsWith('ticket_') ? requestId : `ticket_${requestId}`;
    const ticket = findItemById(tickets, normalizedTicketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    const now = new Date();
    const newMessage = {
      id: `msg_${uuid()}`,
      ticketId: normalizedTicketId,
      content: message,
      createdAt: now,
      senderType: 'agent',
      senderId: req.user?.id ?? 'user_anon',
      senderName: req.user?.name ?? 'Anonymous',
    };

    logger.info('Creating reply with data:', {
      ticketId: normalizedTicketId,
      content: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
      senderType: 'agent',
      senderId: req.user?.id ?? 'user_anon',
    });

    const { messages = [] } = global.appData || {};
    if (!global.appData) {
      global.appData = { messages: [] };
    }

    global.appData.messages = [...messages, newMessage];

    ticket.updatedAt = now;

    logger.info('Message added', { messageCount: messages.length });

    try {
      persistData();
      logger.info('Data persisted after sending reply', { ticketId: normalizedTicketId });
    } catch (error) {
      logger.error('Failed to persist data after sending reply', { error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      chatId: newMessage.id,
      data: {
        message: {
          id: newMessage.id,
          content: newMessage.content,
          createdAt: {
            iso8601: now.toISOString(),
          },
        },
      },
    });
  } catch (error) {
    logger.error('Error sending reply:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to send reply',
    });
  }
};

/**
 * Create a new support ticket
 */
export const createTicket = async (req, res) => {
  try {
    const { title, message, customerId } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required',
      });
    }

    const customers = await getCustomers();

    const customer = customerId ? findItemById(customers, customerId) : customers[0];

    const now = new Date();
    const ticketId = `ticket_${uuid()}`;

    const newTicket = {
      id: ticketId,
      subject: title,
      status: 'open',
      priority: 1,
      customerId: customer.id,
      createdAt: now,
      updatedAt: now,
      preview: message.substring(0, 100),
    };

    const newMessage = {
      id: `msg_${uuid()}`,
      ticketId,
      content: message,
      createdAt: now,
      senderId: customer.id,
      senderType: 'customer',
      senderName: customer.name,
    };

    if (!global.appData) {
      global.appData = { tickets: [], messages: [] };
    }

    const { tickets = [], messages = [] } = global.appData;

    global.appData.tickets = [...tickets, newTicket];
    global.appData.messages = [...messages, newMessage];

    logger.info('Creating ticket with data:', {
      subject: title,
      status: 'open',
      priority: 1,
      customerId: customer.id,
    });

    logger.info('Ticket created', { ticketCount: tickets.length });
    logger.info('Data status after ticket creation', {
      ticketCount: tickets.length,
      messageCount: messages.length,
    });

    return res.json({
      success: true,
      requestId: ticketId,
    });
  } catch (error) {
    console.error('Error creating ticket:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to create ticket',
    });
  }
};

/**
 * Creates or updates a customer record
 */
export const upsertCustomer = (req, res) => {
  try {
    const { email, fullName, isVerified = false } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Email and full name are required',
      });
    }

    let customer = null;
    const { customers = [] } = global.appData || {};
    customer = customers.find((c) => c.email === email);

    if (customer) {
      customer.name = fullName;
      customer.isVerified = isVerified;
      customer.updatedAt = new Date();
    } else {
      customer = {
        id: `customer_${uuid()}`,
        name: fullName,
        email,
        isVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      customers.push(customer);
    }

    return res.json({
      id: customer.id,
      fullName: customer.name,
    });
  } catch (error) {
    console.error('Error upserting customer:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to create or update customer',
    });
  }
};
