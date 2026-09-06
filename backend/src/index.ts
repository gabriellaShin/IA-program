import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}.`);
  console.log(`http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down server.');
  process.exit(0);
});
