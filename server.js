require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const tokenRoutes = require('./routes/tokenRoutes');
const nftRoutes = require('./routes/nftRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(cors({
  // origin: [''], 
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// API Routes
app.use('/api/nfts', nftRoutes); 
app.use('/api/tokens', tokenRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is healthy' });
});

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

app.use(errorHandler);

const PORT = config.port || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
