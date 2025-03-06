import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useQuery } from '@tanstack/react-query';
import { BoltIcon, ChevronLeftIcon, ChevronRightIcon, Briefcase, MapPin, Trophy, Users, DollarSign, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../components/firebase';
import { addDoc, collection, serverTimestamp, onSnapshot, query, limit, doc, getDoc } from 'firebase/firestore';
import axios from 'axios';
import io from 'socket.io-client';
import about from '../assets/img/about.jpg';

// Base URL for API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://laborsloom-mern-1.onrender.com';
const IMAGE_BASE_URL = `https://laborsloom-mern-1.onrender.com/api/get-image/`;

// Initialize Socket.IO client
const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ['polling'], // Force polling for now
  reconnectionAttempts: 5, // Limit reconnection attempts
  reconnectionDelay: 1000, // Delay between retries
});

// Debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// ErrorPage Component (unchanged)
const ErrorPage = ({ errorMessage = 'Something went wrong', actionText = 'Back to Home', actionPath = '/' }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
    >
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Oops!</h2>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(actionPath)}
          className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold"
        >
          {actionText}
        </motion.button>
      </div>
    </motion.div>
  );
};

// JobSection Component
const JobSection = ({ title, emoji }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(null);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loggedIn } = useAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        socket.emit('register', currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [loggedIn]);

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await axios.get(`/api/jobs`);
      const jobsData = res.data;
      console.log('Jobs fetched for JobSection:', jobsData);
      return jobsData;
    },
    enabled: true,
    staleTime: 1000 * 60 * 60,
    cacheTime: 1000 * 60 * 60 * 24,
  });

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 340;
      const newPosition = direction === 'right' ? scrollPosition + scrollAmount : scrollPosition - scrollAmount;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const finalPosition = Math.max(0, Math.min(newPosition, maxScroll));
      container.scrollTo({ left: finalPosition, behavior: 'smooth' });
      setScrollPosition(finalPosition);
    }
  };

  const handleContact = (jobId) => {
    if (!user) {
      navigate('/signup');
    } else {
      setContactModalOpen(jobId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user || !contactModalOpen) return;

    setIsSubmitting(true);
    try {
      const job = jobs.find((j) => j._id === contactModalOpen);
      const messageData = {
        senderId: user.uid,
        senderName: user.displayName || 'User',
        senderEmail: user.email,
        receiverId: job.contractorId,
        receiverName: job.contractorName || 'Contractor',
        jobTitle: job.jobTitle,
        jobId: job._id,
        message,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, 'Messages'), messageData);
      socket.emit('sendMessage', messageData);

      setMessageSent(true);
      setContactModalOpen(null);
      setMessage('');
      setTimeout(() => setMessageSent(false), 3000);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="py-16 text-center text-gray-500">Loading jobs...</div>;
  if (error) return <ErrorPage errorMessage="Failed to load jobs. Please try again later." />;

  return (
    <div className="py-16 bg-gradient-to-b from-gray-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 relative">
        <motion.h3 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-4xl md:text-5xl font-bold mb-18 text-center text-indigo-700">
          {title} {emoji}
        </motion.h3>
        <div className="absolute right-4 top-4 flex gap-3 z-10">
          <motion.button whileHover={{ scale: 1.2, rotate: 10 }} whileTap={{ scale: 0.9 }} onClick={() => handleScroll('left')} className="bg-indigo-200 text-indigo-900 p-2 rounded-full shadow-lg">
            <ChevronLeftIcon className="h-6 w-6" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.2, rotate: -10 }} whileTap={{ scale: 0.9 }} onClick={() => handleScroll('right')} className="bg-indigo-200 text-indigo-900 p-2 rounded-full shadow-lg">
            <ChevronRightIcon className="h-6 w-6" />
          </motion.button>
        </div>
        <div ref={scrollContainerRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6" style={{ scrollBehavior: 'smooth' }}>
          <AnimatePresence>
            {jobs?.length > 0 ? (
              jobs.map((job) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="snap-start flex-shrink-0 w-80 mx-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="relative p-4 flex-grow">
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
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">{job.contractorName?.charAt(0) || 'C'}</div>
                        )}
                        <span className="text-sm text-gray-600">{job.contractorName || 'Unknown Contractor'}</span>
                      </div>
                      <span className="text-sm text-gray-500">{new Date(job.date).toLocaleDateString()}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800 truncate">{job.jobTitle}</h2>
                    <span className="inline-block px-2 py-1 mt-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full">{job.category || 'Uncategorized'}</span>
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      <p className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-500" /> {job.location}</p>
                      <p className="flex items-center"><DollarSign className="w-4 h-4 mr-1 text-green-500" /> {job.payment}</p>
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
              ))
            ) : (
              <div className="text-center w-full text-gray-500">No jobs available</div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-2 mt-6">
          {jobs?.slice(0, 6).map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full ${scrollPosition / 340 === index ? 'bg-indigo-600' : 'bg-gray-300'}`}
              animate={{ scale: scrollPosition / 340 === index ? 1.3 : 1 }}
            />
          ))}
        </div>
        <div className="text-center mt-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (!user ? navigate('/signup') : navigate('/available-jobs'))}
            className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md"
          >
            See More
          </motion.button>
        </div>
      </div>
      <AnimatePresence>
        {contactModalOpen && user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white text-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <h3 className="text-xl font-semibold mb-4">Contact Employer</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none bg-white border-gray-200 text-gray-800"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  required
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setContactModalOpen(null)} className="bg-gray-200 px-4 py-2 rounded-lg hover:opacity-80">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
    </div>
  );
};

// JourneySection Component
const JourneySection = () => {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [userdetails, setUserDetails] = useState({});
  const [user, setUser] = useState(null);
  const { ref: journeyRef, inView: journeyInView } = useInView({ threshold: 0.2, triggerOnce: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState({ jobsPosted: 0, successRate: 0, cities: 0, users: 0 });
  const [testimonials, setTestimonials] = useState([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Socket.IO setup with detailed logging
  useEffect(() => {
    socket.on('connect', () => console.log('Socket.IO connected successfully'));
    socket.on('connect_error', (err) => console.error('Socket.IO connection error:', err));
    socket.on('newMessage', (message) => console.log('New message received:', message));
    socket.on('reconnect_attempt', (attempt) => console.log('Reconnection attempt:', attempt));
    socket.on('reconnect_failed', () => console.error('Socket.IO reconnection failed'));

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('newMessage');
      socket.off('reconnect_attempt');
      socket.off('reconnect_failed');
    };
  }, []);

  // Auth State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'Users', currentUser.uid);
        getDoc(docRef)
          .then((docSnap) => {
            if (docSnap.exists()) setUserDetails(docSnap.data());
          })
          .catch((err) => console.error('Error fetching user details:', err));
        socket.emit('register', currentUser.uid);
      } else {
        setUserDetails({});
      }
    });
    return () => unsubscribe();
  }, [loggedIn]);

  // Fetch Stats from MongoDB Backend
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await axios.get(`https://laborsloom-mern-1.onrender.com/api/stats`, { withCredentials: true });
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 60,
    refetchInterval: 1000 * 60,
  });

  useEffect(() => {
    if (statsData) {
      setStats({
        jobsPosted: statsData.jobsPosted || 0,
        successRate: statsData.successRate || 0,
        cities: statsData.citiesCovered || 0,
        users: statsData.activeUsers || 0,
      });
    }
  }, [statsData]);

  // Fetch Testimonials from Firebase
  useEffect(() => {
    const q = query(collection(db, 'Testimonials'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const testimonialData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTestimonials(testimonialData);
    }, (err) => console.error('Error fetching testimonials:', err));
    return () => unsubscribe();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length > 0) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [testimonials]);

  // Search Logic
  const fetchSearchResults = debounce(async (category) => {
    if (!category.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/jobs/search`, {
        params: { q: category },
      });
      console.log('Category search results from API:', response.data);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Category search fetch error:', error.response || error.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchSearchResults(query);
  };

  const handleSearchSelect = () => {
    if (!user) {
      navigate('/signup');
    } else {
      navigate('/available-jobs');
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleFindJobClick = () => (!user ? navigate('/signup') : navigate('/available-jobs'));
  const handlePostJobClick = () => (!user ? navigate('/signup') : navigate('/post-job'));
  const handleGetStartedClick = () => (!user ? navigate('/signup') : navigate('/available-jobs'));

  if (statsLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading stats...</div>;
  if (statsError) {
    console.error('Stats fetch error:', statsError);
    return <ErrorPage errorMessage="Failed to load stats. Please try again later." />;
  }

  return (
    <motion.div ref={journeyRef} initial={{ opacity: 0 }} animate={journeyInView ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1 }} className="min-h-screen bg-gray-50 scroll-smooth">
      <div className="max-w-7xl mx-auto px-4 py-0 pt-50 relative">
        <motion.div className="flex items-center mb-5 justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <h1 className="text-5xl md:text-9xl font-extrabold text-indigo-700">LaborLoom</h1>
        </motion.div>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-xl md:text-2xl text-center text-gray-600 max-w-3xl mx-auto mb-20">
          Connecting talent with opportunity in real-time.
        </motion.p>

        <div className="flex flex-col md:flex-row gap-6 justify-center mb-20">
          <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="relative flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search by category (e.g., IT, Design)..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-6 py-4 rounded-xl shadow-lg focus:ring-2 focus:ring-indigo-400 outline-none bg-white border-gray-200 text-gray-800 transition-all duration-300"
            />
            <motion.button whileHover={{ scale: 1.2, rotate: 90 }} whileTap={{ scale: 0.95 }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-200 p-2 rounded-lg">
              <BoltIcon className="h-5 w-5 text-indigo-900" />
            </motion.button>
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-64 overflow-y-auto z-10"
              >
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((job) => (
                    <motion.div
                      key={job._id}
                      whileHover={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}
                      onClick={handleSearchSelect}
                      className="p-4 cursor-pointer border-b border-gray-100 flex items-center gap-3"
                    >
                      <Briefcase className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-gray-800 font-semibold">{job.jobTitle || 'Untitled Job'}</p>
                        <p className="text-sm text-gray-600">
                          {job.category || 'Uncategorized'} | {job.location || 'Unknown Location'} - {job.payment || 'N/A'}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No jobs found for category "{searchQuery}". Try another category.
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="flex gap-4">
            {userdetails.role === 'labor' && (
              <motion.button whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(79, 70, 229, 0.3)' }} whileTap={{ scale: 0.95 }} onClick={handleFindJobClick} className="bg-indigo-500 text-white px-6 py-4 rounded-xl font-semibold">
                Find Job
              </motion.button>
            )}
            {userdetails.role === 'contractor' && (
              <motion.button whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }} whileTap={{ scale: 0.95 }} onClick={handlePostJobClick} className="bg-indigo-500 text-white px-6 py-4 rounded-xl font-semibold">
                Post Job
              </motion.button>
            )}
          </motion.div>
        </div>

        <JobSection title="Nearby Jobs" emoji="⚡️" />

        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }} className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col md:flex-row gap-10 items-center mb-20">
          <motion.img src={about} alt="About" className="w-full md:w-1/2 h-96 object-cover rounded-2xl" whileHover={{ scale: 1.05 }} />
          <div className="flex-1 text-left">
            <span className="inline-block px-4 py-1 rounded-full font-semibold mb-4 bg-indigo-100 text-indigo-700">About Us</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">Empowering Work, Redefining Futures</h2>
            <p className="text-lg mb-6 text-gray-600">LaborLoom fuses technology and talent to create seamless workforce solutions—connecting skilled professionals with opportunities in real-time.</p>
            <ul className="space-y-3 text-lg text-gray-600">
              <li className="flex items-center"><span className="text-indigo-400 mr-2">⚡️</span> Real-Time Matching</li>
              <li className="flex items-center"><span className="text-indigo-400 mr-2">⚡️</span> Verified Talent</li>
              <li className="flex items-center"><span className="text-indigo-400 mr-2">⚡️</span> Transparent Pricing</li>
              <li className="flex items-center"><span className="text-indigo-400 mr-2">⚡️</span> Future-Ready Platform</li>
            </ul>
          </div>
        </motion.div>

        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} className="bg-gradient-to-r from-indigo-100 to-purple-100 p-10 rounded-2xl mb-20">
          <h3 className="text-4xl md:text-5xl font-bold text-center mb-12 text-indigo-700">Shattering Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { Icon: Briefcase, value: stats.jobsPosted.toLocaleString(), label: 'Jobs Posted' },
              { Icon: Trophy, value: `${stats.successRate}%`, label: 'Success Rate' },
              { Icon: MapPin, value: stats.cities.toLocaleString(), label: 'Cities Covered' },
              { Icon: Users, value: stats.users.toLocaleString(), label: 'Active Users' },
            ].map(({ Icon, value, label }, index) => (
              <motion.div
                key={label}
                className="bg-white p-6 rounded-xl shadow-lg text-center"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div whileHover={{ scale: 1.2, rotate: 5 }}>
                  <Icon className="h-8 w-8 mx-auto mb-4 text-indigo-600" />
                </motion.div>
                <h4 className="text-3xl font-bold mb-2 text-gray-800">{value}</h4>
                <p className="text-gray-600">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {testimonials.length > 0 && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="mb-20">
            <h3 className="text-4xl font-bold text-center mb-12 text-indigo-700">What Our Users Say</h3>
            <div className="relative max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white p-6 rounded-xl shadow-lg text-center"
                >
                  <p className="text-lg text-gray-600 mb-4">"{testimonials[currentTestimonial].text}"</p>
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < testimonials[currentTestimonial].rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="font-semibold text-gray-800">{testimonials[currentTestimonial].userName}</p>
                  <p className="text-sm text-gray-500">{testimonials[currentTestimonial].role}</p>
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center gap-2 mt-4">
                {testimonials.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-2 h-2 rounded-full ${currentTestimonial === index ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    animate={{ scale: currentTestimonial === index ? 1.3 : 1 }}
                    onClick={() => setCurrentTestimonial(index)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <motion.footer initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} className="bg-gray-50 py-10 text-center">
          <h4 className="text-2xl font-bold mb-4 text-indigo-700">Ready to Shape the Future?</h4>
          <p className="mb-6 text-gray-600">Join a movement redefining how work gets done.</p>
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(79, 70, 229, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetStartedClick}
            className="bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold"
          >
            Get Started
          </motion.button>
          <div className="mt-6 text-sm text-gray-500">© 2024 LaborLoom. All rights reserved.</div>
        </motion.footer>
      </div>
    </motion.div>
  );
};

export default JourneySection;