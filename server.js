import express from 'express';
import cors from 'cors'; // ✅ only one import (remove 'const cors = require...')
import dotenv from 'dotenv';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import userRouter from './routes/userRoute.js';

dotenv.config();

// App config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// ✅ Use CORS before any routes or body parsers
app.use(cors({
  origin: [
    'https://docbook-frontend.vercel.app',
    'https://docbook-admin.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ Optional: respond to preflight for all routes
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API endpoints
app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter);

// Test route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
