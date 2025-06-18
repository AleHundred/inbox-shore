import type { DateTimeParts } from '@/lib/types/api';

import { getMockRequests } from '../api/mockData/requests';

/**
 * Represents a message component in a chat
 */
interface MessageComponent {
  type: string;
  text: string;
}

/**
 * Represents a message in a conversation
 */
interface Message {
  id: string;
  timestamp: string;
  actorType: 'customer' | 'agent';
  actorName: string;
  entryType: 'chat';
  text: string;
  chatId: string;
  components: MessageComponent[];
}

/**
 * Represents information about a support request
 */
interface RequestInfo {
  title: string;
  customerName: string;
  customerId: string;
  status: 'open' | 'closed';
  priority: number;
}

/**
 * Singleton store for managing messages and request information
 */
export class MessageStore {
  private static instance: MessageStore;
  private messages = new Map<string, Message[]>();
  private requestInfo = new Map<string, RequestInfo>();
  private initialized = false;

  /**
   * Gets the singleton instance of MessageStore
   * @returns The MessageStore instance
   */
  static getInstance(): MessageStore {
    if (!MessageStore.instance) {
      MessageStore.instance = new MessageStore();
    }
    return MessageStore.instance;
  }

  private initializeDefaultMessages(): void {
    if (this.initialized) return;

    const mockRequests = getMockRequests(1, 22, 22);

    mockRequests?.tickets?.forEach((ticket) => {
      const initialMessage: Message = {
        id: `msg-${ticket.id}-1`,
        timestamp:
          typeof ticket.createdAt === 'string'
            ? ticket.createdAt
            : (ticket.createdAt as DateTimeParts)?.iso8601 || new Date().toISOString(),
        actorType: 'customer',
        actorName: ticket.customer?.fullName || 'Unknown Customer',
        entryType: 'chat',
        text: ticket.previewText || 'Initial request message',
        chatId: `chat-${ticket.id}-1`,
        components: [{ type: 'text', text: ticket.previewText || 'Initial request message' }],
      };

      this.messages.set(ticket.id, [initialMessage]);
      const requestInfo: RequestInfo = {
        title: ticket.title || '',
        customerName: ticket.customer?.fullName || 'Unknown Customer',
        customerId: ticket.customer?.id || '',
        status: ticket.status === 'TODO' || ticket.status === 'IN_PROGRESS' ? 'open' : 'closed',
        priority: ticket.priority,
      };
      this.requestInfo.set(ticket.id, requestInfo);
    });

    this.initialized = true;
  }

  /**
   * Adds a new message to a request
   * @param requestId - The ID of the request
   * @param message - The message to add
   */
  addMessage(requestId: string, message: Message): void {
    this.initializeDefaultMessages();

    const existingMessages = this.messages.get(requestId) || [];
    existingMessages.unshift(message);
    this.messages.set(requestId, existingMessages);
  }

  /**
   * Gets all messages for a request
   * @param requestId - The ID of the request
   * @returns Array of messages for the request
   */
  getMessages(requestId: string): Message[] {
    this.initializeDefaultMessages();
    return this.messages.get(requestId) || [];
  }

  /**
   * Gets information about a request
   * @param requestId - The ID of the request
   * @returns Request information
   */
  getRequestInfo(requestId: string): RequestInfo {
    this.initializeDefaultMessages();
    return (
      this.requestInfo.get(requestId) || {
        title: `Request ${requestId}`,
        customerName: 'Unknown Customer',
        customerId: `customer_${requestId.replace('ticket_', '')}`,
        status: 'open',
        priority: 1,
      }
    );
  }

  /**
   * Gets all request IDs
   * @returns Array of request IDs
   */
  getAllRequestIds(): string[] {
    this.initializeDefaultMessages();
    return Array.from(this.messages.keys());
  }

  /**
   * Creates a new request with an initial message
   * @param title - The title of the request
   * @param initialMessage - The initial message text
   * @param customerName - The name of the customer
   * @returns The ID of the new request
   */
  createNewRequest(title: string, initialMessage: string, customerName: string): string {
    this.initializeDefaultMessages();

    const newRequestId = `user_request_${Date.now()}`;
    const customerId = `user_customer_${Date.now()}`;

    const initialMsg: Message = {
      id: `msg-${newRequestId}-1`,
      timestamp: new Date().toISOString(),
      actorType: 'customer' as const,
      actorName: customerName,
      entryType: 'chat' as const,
      text: initialMessage,
      chatId: `chat-${newRequestId}-1`,
      components: [{ type: 'text', text: initialMessage }],
    };

    this.messages.set(newRequestId, [initialMsg]);
    this.requestInfo.set(newRequestId, {
      title,
      customerName,
      customerId,
      status: 'open' as const,
      priority: 1,
    });

    return newRequestId;
  }
}

export const messageStore = MessageStore.getInstance();
