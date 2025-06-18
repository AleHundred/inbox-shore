import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { initializeData } from './models/data.js';
import routes from './routes/index.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('server');
const app = express();

(async () => {
  try {
    const { users, customers, tickets, messages } = await initializeData();
    logger.info('Data initialized successfully', {
      userCount: users.length,
      customerCount: customers.length,
      ticketCount: tickets.length,
      messageCount: messages.length,
    });

    const corsOptions = {
      origin: ['http://localhost:3000', 'https://inbox-shore.vercel.app/api', /\.vercel\.app$/],
      credentials: true,
      optionsSuccessStatus: 200,
    };

    app.use(helmet());
    app.use(cors(corsOptions));
    app.use(bodyParser.json());

    app.use((req, res, next) => {
      logger.info(`${req.method} ${req.originalUrl}`);
      next();
    });

    // API Routes
    app.use('/api', routes);

    app.use((err, req, res, _next) => {
      logger.error(`Error: ${err.message}`);
      return res.status(err.status || 500).json({
        success: false,
        error: err.message || 'An unexpected error occurred',
        code: err.code || 'server_error',
      });
    });

    app.use((_req, res, _next) => {
      return res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        code: 'not_found',
      });
    });

    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Server startup failed', { error: error.message });
    process.exit(1);
  }
})();

export default app;
