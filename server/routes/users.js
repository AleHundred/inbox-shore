import express from 'express';

import { getUsers } from '../models/data.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('users-routes');

/**
 * GET /api/users/:id
 * Get a user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const users = await getUsers();
    const user = users.find((u) => u.id === id);

    if (!user) {
      logger.warn('User not found', { userId: id });
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { _passwordHash, ...userData } = user;

    return res.json({
      success: true,
      ...userData,
    });
  } catch (error) {
    logger.error('Error fetching user', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user data',
    });
  }
});

export default router;
