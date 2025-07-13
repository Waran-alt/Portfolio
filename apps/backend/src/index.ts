import { API, HTTP } from '@portfolio/shared';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { DATABASE_CONFIG, INTERNAL_URLS } from './config/const';
import { envVar } from './config/env';

const app = express();

// Security and logging middleware
app.use(helmet());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration using validated environment variables
app.use(cors({
  origin: envVar.cors.origin,
  credentials: envVar.cors.credentials,
}));

// Health check endpoint using shared constants
app.get(API.ENDPOINTS.HEALTH, (_req, res) => {
  res.status(HTTP.STATUS.OK).json({
    status: 'healthy',
    service: API.TITLE,
    version: API.VERSION,
    timestamp: new Date().toISOString(),
    environment: envVar.isDevelopment ? 'development' : 'production',
    internalUrls: INTERNAL_URLS,
    database: {
      host: DATABASE_CONFIG.HOST,
      port: DATABASE_CONFIG.PORT,
      connected: true, // This would be checked in a real app
    },
  });
});

// API routes using constants
app.get(`${API.PREFIX}/projects`, (_req, res) => {
  res.status(HTTP.STATUS.OK).json({
    message: 'Projects endpoint',
    apiPrefix: API.PREFIX,
  });
});

// Start server using validated environment variables
const PORT = envVar.server.port;
const HOST = envVar.server.host;

app.listen(PORT, HOST, () => {
  console.log(`🚀 ${API.TITLE} v${API.VERSION} running on ${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}${API.ENDPOINTS.HEALTH}`);
  console.log(`🔗 Internal URLs:`, INTERNAL_URLS);
  console.log(`🔗 API Base URL: ${envVar.cors.origin}${API.PREFIX}`);
});

export default app;