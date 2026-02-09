import cors from 'cors';
import express, { Request, Response } from 'express';

const app = express();
const PORT = parseInt(process.env.PORT || '4011', 10);

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'vat-man-backend',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/vats', (req: Request, res: Response) => {
  res.json({ vats: [], message: 'VatMan API stub - connect DB and implement' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VatMan backend running on port ${PORT}`);
});
