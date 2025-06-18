import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { serverConfig } from '../lib/server-config.js';
import { getUsers } from '../models/data.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth-controller');
const JWT_SECRET = process.env.JWT_SECRET || serverConfig.JWT_SECRET;

/**
 * Handles user login with safe logging
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn('Missing credentials', {
        hasEmail: !!email,
        hasPassword: !!password,
      });
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    logger.info('Login attempt', { email });

    const users = await getUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      logger.warn('User not found', { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logger.warn('Password mismatch', { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '24h',
    });

    logger.info('Login successful', {
      userId: user.id,
      email: user.email,
    });

    const response = {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'There was a server error during authentication',
    });
  }
};
