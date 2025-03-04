import React, { useState, useEffect } from 'react';
import { MapPin, DollarSign, Search, X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { auth, db } from '../components/firebase';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// ErrorPage Component
const ErrorPage = ({ errorMessage = 'Something went wrong', actionText = 'Try Again', actionPath = '/', showAction = true }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-indigo-100 px-4"
    >
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 120 }} className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Oops! An Error Occurred</h2>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        {showAction && (
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(79, 70, 229, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(actionPath)}
            className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold"
          >
            {actionText}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

function AvailableJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contactModalOpen, setContactModalOpen] = useState(null);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const jobsPerPage = 30;

  // Base URL for fetching images from the backend
  const IMAGE_BASE_URL = 'http://localhost:5000/api/get-image/';

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const cachedJobs = localStorage.getItem('cachedJobs');
        const cacheTimestamp = localStorage.getItem('cacheTimestamp');
        const cacheValidDuration = 1000 * 60 * 60; // 1 hour

        const now = Date.now();
        const isCacheValid = cacheTimestamp && (now - parseInt(cacheTimestamp, 10)) < cacheValidDuration;

        let jobsData;
        if (cachedJobs && isCacheValid) {
          console.log('Using cached jobs');
          jobsData = JSON.parse(cachedJobs);
        } else {
          console.log('Fetching jobs from API');
          const response = await axios.get('http://localhost:5000/api/jobs');
          jobsData = response.data;
          console.log('Jobs fetched:', jobsData);

          // Cache data
          localStorage.setItem('cachedJobs', JSON.stringify(jobsData));
          localStorage.setItem('cacheTimestamp', now.toString());
        }

        setJobs(jobsData);
        setFilteredJobs(jobsData);

        // Extract unique categories
        const uniqueCategories = [...new Set(jobsData.map((job) => job.category || 'Uncategorized'))];
        setCategories(uniqueCategories);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load jobs. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Get logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  // Filter jobs based on search query and selected category
  useEffect(() => {
    let filtered = jobs;
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      filtered = jobs.filter((job) => {
        const titleMatch = job.jobTitle.toLowerCase().includes(queryLower);
        const locationMatch = job.location.toLowerCase().includes(queryLower);
        const paymentMatch = String(job.payment).toLowerCase().includes(queryLower);
        const categoryMatch = (job.category || 'Uncategorized').toLowerCase().includes(queryLower);
        return titleMatch || locationMatch || paymentMatch || categoryMatch;
      });
    } else if (selectedCategory) {
      filtered = jobs.filter((job) => (job.category || 'Uncategorized') === selectedCategory);
    }
    setFilteredJobs(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, jobs]);

  // Pagination logic
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContact = (jobId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setContactModalOpen(jobId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user || !contactModalOpen) return;

    setIsSubmitting(true);
    try {
      const job = jobs.find((j) => j._id === contactModalOpen);
      if (!job) throw new Error('Job not found');

      await addDoc(collection(db, 'Messages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Labor User',
        senderEmail: user.email,
        receiverId: job.contractorId,
        receiverName: job.contractorName || 'Contractor',
        jobTitle: job.jobTitle,
        jobId: job._id,
        message,
        timestamp: serverTimestamp(),
      });

      setMessageSent(true);
      setContactModalOpen(null);
      setMessage('');
      setTimeout(() => setMessageSent(false), 3000);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeContactModal = () => {
    setContactModalOpen(null);
    setMessage('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredJobs(selectedCategory ? jobs.filter((job) => (job.category || 'Uncategorized') === selectedCategory) : jobs);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return <ErrorPage errorMessage={error} actionText="Back to Home" actionPath="/" />;
  }

  if (jobs.length === 0) {
    return <ErrorPage errorMessage="No jobs available at the moment." actionText="Go Back" actionPath="/" />;
  }

  const isFilterApplied = searchQuery.trim() || selectedCategory;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filter Section */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs by title, location, payment, or category..."
              className="w-full pl-12 pr-10 py-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all duration-300"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedCategory === category
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                {category}
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
            >
              Clear Filter
            </motion.button>
          </div>
        </div>

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No jobs found matching your search or filter.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {currentJobs.map((job) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    <div className="relative p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          {job.profileImage ? (
                            <img
                              src={`${IMAGE_BASE_URL}${job.profileImage}`}
                              alt={`${job.contractorName || 'Contractor'}'s profile`}
                              className="h-8 w-8 rounded-full object-cover border border-gray-300"
                              onError={(e) => {
                                console.log(`Image failed to load: ${job.profileImage}`);
                                e.target.src = '/default-profile.png';
                              }}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
                              {job.contractorName?.charAt(0) || 'C'}
                            </div>
                          )}
                          <span className="text-sm text-gray-600">{job.contractorName || 'Unknown Contractor'}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(job.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800 truncate">{job.jobTitle}</h2>
                      {isFilterApplied && (
                        <span className="inline-block px-2 py-1 mt-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full">
                          {job.category || 'Uncategorized'}
                        </span>
                      )}
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-500" /> {job.location}
                        </p>
                        <p className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-green-500" /> {job.payment}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleContact(job._id)}
                        className="mt-4 w-full bg-black text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-all duration-200"
                      >
                        Details
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 bg-indigo-100 text-indigo-700 rounded-full disabled:bg-gray-200 disabled:text-gray-400"
                >
                  <ChevronLeft className="h-6 w-6" />
                </motion.button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                    .map((page) => (
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          currentPage === page
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        {page}
                      </motion.button>
                    ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-indigo-100 text-indigo-700 rounded-full disabled:bg-gray-200 disabled:text-gray-400"
                >
                  <ChevronRight className="h-6 w-6" />
                </motion.button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Contact Modal */}
      <AnimatePresence>
        {contactModalOpen !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Employer</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 resize-none focus:ring-2 focus:ring-indigo-400 outline-none"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  required
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeContactModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:bg-indigo-300"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {messageSent && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            Message sent successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AvailableJobs;