import cors from 'cors';
import express, { Request, Response } from 'express';

const app = express();
const PORT = parseInt(process.env.PORT || '4010', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    service: 'test-client-backend',
    timestamp: new Date().toISOString()
  });
});

// Simple API endpoint
app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ 
    message: 'Hello from test-client backend!',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test client backend running on port ${PORT}`);
});
