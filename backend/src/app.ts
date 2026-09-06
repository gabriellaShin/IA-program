import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import mealPlanRoutes from './routes/mealPlan.js';
import intakeHistoryRoutes from './routes/intakeHistory.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/intake-history', intakeHistoryRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An error occurred on the server.'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

export default app;
