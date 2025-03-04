const express = require('express');
const Job = require('../models/Job');

console.log('Imported Job:', Job); // Debug import

const router = express.Router();

// Create a new job (Only for contractors)
router.post('/', async (req, res) => {
  try {
    console.log('Received POST /api/jobs with payload:', req.body);
    const {
      jobTitle, category, location, payment, date, image,
      contractorId, contractorName, contractorUsername
    } = req.body;

    if (!Job) {
      throw new Error('Job model is not defined');
    }

    const newJob = new Job({
      jobTitle,
      category,
      location,
      payment,
      date,
      image,
      contractorId,
      contractorName,
      contractorUsername
    });

    console.log('Attempting to save job:', newJob);
    const savedJob = await newJob.save();
    console.log('Job saved successfully:', savedJob);
    res.status(201).json({ message: 'Job created successfully', job: savedJob });
  } catch (error) {
    console.error('Error creating job:', error.message, error.stack);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Get all jobs (For listing all jobs)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching jobs' });
  }
});

// Get jobs posted by a specific contractor (Filtered by contractorId)
router.get('/contractor/:contractorId', async (req, res) => {
  try {
    const jobs = await Job.find({ contractorId: req.params.contractorId });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching contractor jobs' });
  }
});

router.delete('/:jobId', async (req, res) => { // Changed from '/api/jobs/:jobId' to '/:jobId' since it's mounted at '/api/jobs'
  try {
    console.log(`Attempting to delete job with ID: ${req.params.jobId}`);
    const job = await Job.findByIdAndDelete(req.params.jobId);
    if (!job) {
      console.log(`Job with ID ${req.params.jobId} not found`);
      return res.status(404).json({ error: 'Job not found' });
    }
    console.log(`Job deleted: ${job._id}`);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error.message, error.stack);
    res.status(500).json({ error: 'Error deleting job' });
  }
});

// Note: This route should also be adjusted if it’s meant to be /api/jobs/search
router.get('api/jobs/search', async (req, res) => {
  const { q, category } = req.query;

  try {
    console.log('Search query:', q, 'Category:', category);
    if (category) {
      const jobs = await Job.find({ category: category })
        .limit(10)
        .sort({ createdAt: -1 });
      console.log('Category search results:', jobs);
      return res.json(jobs);
    }

    if (!q) return res.json([]);

    const jobs = await Job.aggregate([
      {
        $search: {
          index: 'default',
          text: {
            query: q,
            path: ['jobTitle', 'location', 'payment'],
            fuzzy: { maxEdits: 2 },
          },
        },
      },
      { $limit: 10 },
    ]);
    console.log('Text search results:', jobs);
    res.json(jobs);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Error searching jobs', details: error.message });
  }
});

module.exports = router;