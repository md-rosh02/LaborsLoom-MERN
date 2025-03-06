const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const jobRouter = require('./routes/jobs');
const uploadRoutes = require('./routes/uploadRoutes');
const Job = require('./models/Job');
const User = require('./models/User');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Allowed origins
const allowedOrigins = [
  'http://localhost:5173', // Local dev
  'http://localhost:3000', // Optional local dev
  'https://labors-loom-mern.vercel.app', // Production frontend
  'https://laborsloom-mern-1.onrender.com', // Backend self-reference
];

// CORS middleware for Express
app.use(cors({
  origin: (origin, callback) => {
    console.log(`CORS check - Origin: ${origin}`);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked - Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      console.log(`Socket.IO CORS check - Origin: ${origin}`);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`Socket.IO CORS blocked - Origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/socket.io', // Explicit path
  transports: ['polling'], // Force polling for Render free tier
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', uploadRoutes);
app.use('/api/jobs', jobRouter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Get user details
app.get('/api/user/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user details
app.put('/api/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const updatedUser = await User.findOneAndUpdate({ uid }, req.body, { new: true });
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Job Search Endpoint
app.get('/api/jobs/search', async (req, res) => {
  const { q, category } = req.query;
  console.log('Search request:', { q, category });

  const searchCategory = category || q;
  if (!searchCategory) {
    console.log('No category provided');
    return res.json([]);
  }

  try {
    const query = { category: { $regex: searchCategory, $options: 'i' } };
    console.log('MongoDB query:', query);
    const jobs = await Job.find(query).limit(10);
    console.log('Search results:', jobs);
    res.json(jobs);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// Get All Jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().lean();
    if (!jobs || jobs.length === 0) {
      return res.status(404).json({ message: 'No jobs found' });
    }
    const jobsWithImages = await Promise.all(jobs.map(async (job) => {
      const user = await User.findOne({ uid: job.contractorId });
      const profileImage = user?.profileImage || '';
      return { ...job, profileImage };
    }));
    res.json(jobsWithImages);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Job by ID
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    let contractorName = job.contractorName;
    if (!contractorName && job.contractorId) {
      const contractor = await User.findOne({ uid: job.contractorId });
      contractorName = contractor ? contractor.fname : 'Unknown';
    }

    res.json({ ...job.toObject(), contractorName });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Serve Profile Images
app.get('/api/get-image/:imageId', (req, res) => {
  const { imageId } = req.params;
  const imagePath = path.join(__dirname, 'uploads', imageId);

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error(`Error serving image ${imageId}:`, err);
        res.status(500).json({ message: 'Error serving image', error: err.message });
      }
    });
  } else {
    const defaultImagePath = path.join(__dirname, 'uploads', 'default-profile.png');
    if (fs.existsSync(defaultImagePath)) {
      res.sendFile(defaultImagePath);
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  }
});

// Stats Endpoint
app.get('/api/stats', async (req, res) => {
  try {
    console.log('Fetching stats...');
    const jobsPosted = await Job.countDocuments().catch(err => {
      throw new Error(`Jobs count failed: ${err.message}`);
    });
    const successRate = 95; // Placeholder
    const citiesCovered = await Job.distinct('location')
      .then(locations => locations?.length || 0)
      .catch(err => {
        throw new Error(`Cities count failed: ${err.message}`);
      });
    const activeUsers = await User.countDocuments({ status: 'active' }).catch(err => {
      throw new Error(`Users count failed: ${err.message}`);
    });

    const stats = { jobsPosted, successRate, citiesCovered, activeUsers };
    console.log('Stats fetched:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

// Socket.IO Setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} registered`);
  });

  socket.on('sendMessage', async (message) => {
    console.log('Message received:', message);
    try {
      if (!message.senderProfile) {
        const sender = await User.findOne({ uid: message.senderId });
        message.senderProfile = sender?.profileImage || '';
      }
      io.to(message.receiverId).emit('newMessage', message);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});