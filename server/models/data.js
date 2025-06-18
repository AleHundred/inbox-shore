import fs from 'fs';
import path from 'path';

import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

import { createLogger } from '../utils/logger.js';

const logger = createLogger('data-model');

const TICKET_STATUSES = ['open', 'resolved', 'in_progress', 'pending'];
const PRIORITY_LEVELS = [0, 1, 2, 3, 4]; // 0 - lowest, 4 - URGENT

/*
Generate fake data for users, customers, tickets, and messages.
Data is persisted to disk to prevent loss on server restarts.
*/

async function generateUsers() {
  const users = [
    {
      id: 'user_1',
      name: 'Lucy Dacus',
      email: 'lucy.dacus@boygenius.music',
      passwordHash: await bcrypt.hash('nightshift', 10),
    },
    {
      id: 'user_2',
      name: 'Julien Baker',
      email: 'julien.baker@boygenius.music',
      passwordHash: await bcrypt.hash('hardline', 10),
    },
    {
      id: 'user_3',
      name: 'Phoebe Bridgers',
      email: 'phoebe.bridgers@boygenius.music',
      passwordHash: await bcrypt.hash('kyoto', 10),
    },
  ];

  return users;
}

function generateCustomers(count = 5) {
  const customers = [];
  for (let i = 0; i < count; i++) {
    customers.push({
      id: uuid(),
      name: faker.person.firstName(),
      email: faker.internet.email(),
      isVerified: faker.datatype.boolean(),
    });
  }

  return customers;
}

function generateTicketsAndMessages(customers, users, ticketCount = 22) {
  const tickets = [];
  const messages = [];

  for (let i = 0; i < ticketCount; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const ticketId = `ticket_${i + 1}`;
    const createdAt = faker.date.recent({ days: 30 });
    const ticket = {
      id: ticketId,
      subject: faker.lorem.sentence({ min: 5, max: 10 }),
      status: faker.helpers.arrayElement(TICKET_STATUSES),
      priority: PRIORITY_LEVELS[faker.helpers.arrayElement(PRIORITY_LEVELS)],
      createdAt: createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
      customerId: customer.id,
      preview: '',
    };
    tickets.push(ticket);
    let lastDate = new Date(createdAt);

    for (let j = 0; j < 5; j++) {
      const isCustomer = j % 2 === 0;
      const sender = isCustomer ? customer : faker.helpers.arrayElement(users);
      const messageDate = faker.date.between({ from: lastDate, to: ticket.updatedAt });

      const message = {
        id: uuid(),
        ticketId,
        content: faker.lorem.sentence({ min: 2, max: 7 }),
        createdAt: messageDate,
        senderId: sender.id,
        senderType: isCustomer ? 'customer' : 'agent',
        senderName: sender.name,
      };
      messages.push(message);
      lastDate = message.createdAt;
    }

    const ticketMessages = messages.filter((m) => m.ticketId === ticketId);
    if (ticketMessages.length > 0) {
      ticketMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const ticket = tickets.find((t) => t.id === ticketId);
      ticket.preview = ticketMessages[0].content.substring(0, 100);
    }
  }

  return { tickets, messages };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info('Created data directory', { path: DATA_DIR });
  } catch (error) {
    logger.error('Failed to create data directory', { error: error.message });
  }
}

let users = [];
let tickets = [];
let customers = [];
let messages = [];

/**
 * Save data to disk
 */
export function persistData() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    logger.info('Data persisted to disk');
    return true;
  } catch (error) {
    logger.error('Failed to persist data', { error: error.message });
    return false;
  }
}

/**
 * Load data from disk or generate new data if files don't exist
 */
async function initializeData() {
  try {
    const hasUsers = fs.existsSync(USERS_FILE);
    const hasCustomers = fs.existsSync(CUSTOMERS_FILE);
    const hasTickets = fs.existsSync(TICKETS_FILE);
    const hasMessages = fs.existsSync(MESSAGES_FILE);

    if (hasUsers && hasCustomers && hasTickets && hasMessages) {
      logger.info('Loading data from disk');

      try {
        users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        customers = JSON.parse(fs.readFileSync(CUSTOMERS_FILE, 'utf8'));
        tickets = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf8'));
        messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));

        tickets.forEach((ticket) => {
          if (ticket.createdAt) ticket.createdAt = new Date(ticket.createdAt);
          if (ticket.updatedAt) ticket.updatedAt = new Date(ticket.updatedAt);
        });

        messages.forEach((message) => {
          if (message.createdAt) message.createdAt = new Date(message.createdAt);
        });

        logger.info('Data loaded successfully', {
          userCount: users.length,
          customerCount: customers.length,
          ticketCount: tickets.length,
          messageCount: messages.length,
        });

        return { users, customers, tickets, messages };
      } catch (error) {
        logger.error('Error parsing data files', { error: error.message });
      }
    }

    logger.info('Generating new data');
    customers = generateCustomers();
    users = await generateUsers();
    const result = generateTicketsAndMessages(customers, users);
    tickets = result.tickets;
    messages = result.messages;

    persistData();

    return { users, customers, tickets, messages };
  } catch (error) {
    logger.error('Failed to initialize data', { error: error.message });
    customers = generateCustomers();
    users = await generateUsers();
    const result = generateTicketsAndMessages(customers, users);
    tickets = result.tickets;
    messages = result.messages;

    return { users, customers, tickets, messages };
  }
}

function findItemById(collection, id) {
  return collection.find((item) => item.id === id);
}

async function getUsers() {
  if (users.length === 0) {
    await initializeData();
  }
  return users;
}

async function getTickets() {
  if (tickets.length === 0) {
    await initializeData();
  }
  return tickets;
}

async function getCustomers() {
  if (customers.length === 0) {
    customers = generateCustomers();
  }
  return customers;
}

async function getUserByEmail(email) {
  const usersList = await getUsers();
  return usersList.find((u) => u.email === email) || null;
}

export { initializeData, findItemById, getUsers, getTickets, getCustomers, getUserByEmail };
