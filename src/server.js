require('dotenv').config();

const express = require('express');
const userRoutes = require('./routes/userRoutes');
const { verifyConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json())

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/users', userRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
  try {
    await verifyConnection();
    app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server due to database connection error.');
    process.exit(1);
  }
};

start();

module.exports = app;
