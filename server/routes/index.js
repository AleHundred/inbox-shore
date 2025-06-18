import express from 'express';

import { login } from '../controllers/authController.js';
import {
  createTicket,
  getTicketDetail,
  getTickets,
  sendReply,
  upsertCustomer,
} from '../controllers/ticketController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { apiLimiter, loginLimiter, strictLimiter } from '../middleware/rateLimitMiddleware.js';
import { createLogger, logEvent } from '../utils/logger.js';

import usersRouter from './users.js';

const router = express.Router();
const logger = createLogger('routes');

/**
 * Creates a logged route handler that captures request events
 */
const createLoggedRouteHandler = (eventType, controllerMethod) => {
  return (req, res, next) => {
    logEvent(logger, eventType, { req });
    controllerMethod(req, res, next);
  };
};

router.post('/login', loginLimiter, createLoggedRouteHandler('login', login));

router.get('/users', apiLimiter, async (req, res) => {
  try {
    const { getUsers } = await import('../models/data.js');
    const users = await getUsers();

    const safeUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));

    res.json({
      success: true,
      users: safeUsers,
      count: safeUsers.length,
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

router.use('/users', authMiddleware, apiLimiter, usersRouter);

router.get(
  '/requests',
  authMiddleware,
  apiLimiter,
  createLoggedRouteHandler('fetch_tickets', getTickets)
);

router.get(
  '/timeline',
  authMiddleware,
  apiLimiter,
  createLoggedRouteHandler('fetch_timeline', getTicketDetail)
);

router.post(
  '/reply',
  authMiddleware,
  apiLimiter,
  createLoggedRouteHandler('send_reply', sendReply)
);

router.post(
  '/contact-form',
  authMiddleware,
  strictLimiter,
  createLoggedRouteHandler('create_ticket', createTicket)
);

router.post(
  '/customer',
  authMiddleware,
  strictLimiter,
  createLoggedRouteHandler('upsert_customer', upsertCustomer)
);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
