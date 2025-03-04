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
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/jobs', jobRouter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Get user details
app.get('/api/user/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Job Search Endpoint with Category Filtering
app.get('/api/jobs/search', async (req, res) => {
  const { q, category } = req.query;
  console.log('Search request received:', { q, category });

  const searchCategory = category || q;
  if (!searchCategory) {
    console.log('No category provided, returning empty array');
    return res.json([]);
  }

  try {
    const query = {
      category: { $regex: searchCategory, $options: 'i' },
    };

    console.log('MongoDB query:', JSON.stringify(query, null, 2));
    const jobs = await Job.find(query).limit(10);
    console.log('Search results from DB:', jobs);
    res.json(jobs);
  } catch (error) {
    console.error('Search error:', error.message, error.stack);
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
      console.log(`Job ${job._id} - contractorId: ${job.contractorId}, profileImage: ${profileImage}`);
      return { ...job, profileImage };
    }));
    console.log('Jobs with images:', jobsWithImages);
    res.json(jobsWithImages);
  } catch (error) {
    console.error('Error fetching jobs:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Get Job by ID with Contractor Name from Users
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
    res.status(500).json({ message: 'Server error', error });
  }
});

// Serve Profile Images
app.get('/api/get-image/:imageId', (req, res) => {
  const { imageId } = req.params;
  const imagePath = path.join(__dirname, 'uploads', imageId);

  console.log(`Attempting to serve image: ${imagePath}`);
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error(`Error serving image ${imageId}:`, err);
        res.status(500).json({ message: 'Error serving image', error: err.message });
      }
    });
  } else {
    console.error(`Image not found: ${imagePath}`);
    // Serve a default image instead of JSON error
    const defaultImagePath = path.join(__dirname, 'uploads', 'default-profile.png');
    if (fs.existsSync(defaultImagePath)) {
      res.sendFile(defaultImagePath);
    } else {
      res.status(404).json({ message: 'Image not found, and no default image available' });
    }
  }
});

// Stats Endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const jobsPosted = await Job.countDocuments();
    const successRate = 95; // Placeholder: Replace with actual logic if available
    const citiesCovered = await Job.distinct('location').then(locations => locations.length);
    const activeUsers = await User.countDocuments({ status: 'active' });

    res.json({
      jobsPosted,
      successRate,
      citiesCovered,
      activeUsers,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Socket.IO Setup for Real-Time Messaging
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} registered`);
  });

  socket.on('sendMessage', async (message) => {
    console.log('Message received on server:', message);
    if (!message.senderProfile) {
      const sender = await User.findOne({ uid: message.senderId });
      message.senderProfile = sender?.profileImage || '';
    }
    io.to(message.receiverId).emit('newMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});