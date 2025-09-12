require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const pdfRoutes = require('./routes/pdfRoutes');
const mongoose = require('mongoose');
const app = express();

// Kết nối đến MongoDB
mongoose.connect(config.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:6969',
    'https://kanji-maker-frontend.vercel.app',  
    'https://*.vercel.app' 
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/', pdfRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`PDF server đang chạy tại http://localhost:${config.PORT}`);
});