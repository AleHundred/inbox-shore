import jwt from 'jsonwebtoken';

import { serverConfig } from '../lib/server-config.js';
import { getUsers } from '../models/data.js';
import { createLogger, logEvent } from '../utils/logger.js';

const JWT_SECRET = serverConfig.JWT_SECRET;

const logger = createLogger('auth');

/**
 *  Middleware to verify authentication for protected routes
 */
const verifyAuth = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token not provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await getUsers();
    const user = users.find((u) => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (error) {
    logEvent(logger, 'verify_auth', { error });
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default verifyAuth;
