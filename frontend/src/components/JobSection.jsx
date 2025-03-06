// JobSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon, Briefcase, MapPin, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../components/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

const JobSection = React.memo(({ title, emoji }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(null);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => axios.get('https://laborsloom-mern-1.onrender.com/api/jobs').then(res => res.data),
    enabled: false,
    staleTime: Infinity,
    cacheTime: Infinity,
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
      if (!jobs) refetch();
      setContactModalOpen(jobId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user || !contactModalOpen) return;

    setIsSubmitting(true);
    try {
      const job = jobs.find(j => j._id === contactModalOpen);
      await addDoc(collection(db, 'Messages'), {
        senderId: user.uid,
        senderName: user.displayName || 'User',
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
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(50px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 220, friction: 20 },
  });

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
        <motion.h3
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold mb-12 text-center text-indigo-700"
        >
          {title} {emoji}
        </motion.h3>

        <div className="absolute right-4 top-4 flex gap-2 z-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleScroll('left')}
            className="bg-indigo-100 text-indigo-700 p-2 rounded-full shadow-md hover:bg-indigo-200"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleScroll('right')}
            className="bg-indigo-100 text-indigo-700 p-2 rounded-full shadow-md hover:bg-indigo-200"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </motion.button>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6"
          style={{ scrollBehavior: 'smooth' }}
        >
          <AnimatePresence>
            {isLoading ? (
              <div className="text-center w-full text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-center w-full text-red-500">Error loading jobs</div>
            ) : jobs ? (
              jobs.map((job) => (
                <animated.div key={job._id} style={cardSpring} className="snap-start flex-shrink-0 w-80 mx-3 md:mx-4">
                  <motion.div
                    whileHover={{ scale: 1.03, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
                    className="bg-white border-gray-200 rounded-xl overflow-hidden shadow-md border h-full flex flex-col"
                  >
                    <motion.img
                      src={job.image || 'https://via.placeholder.com/500x300'}
                      alt={job.jobTitle}
                      className="w-full h-40 object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className="p-5 flex flex-col flex-grow">
                      <span className="inline-block px-2 py-1 mb-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full">
                        {job.category || 'Uncategorized'}
                      </span>
                      <h2 className="text-lg font-semibold truncate text-gray-800">{job.jobTitle}</h2>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" /> {job.location}
                        </p>
                        <p className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" /> {job.payment}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: '#4f46e5' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleContact(job._id)}
                        className="bg-indigo-500 text-white py-2 rounded-lg font-medium mt-4"
                      >
                        Contact Employer
                      </motion.button>
                    </div>
                  </motion.div>
                </animated.div>
              ))
            ) : (
              <div className="text-center w-full text-gray-500">Click "See More" to load jobs</div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {jobs?.slice(0, 6).map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full ${scrollPosition / 340 === index ? 'bg-indigo-600' : 'bg-gray-300'}`}
              animate={{ scale: scrollPosition / 340 === index ? 1.2 : 1 }}
            />
          ))}
        </div>

        <div className="text-center mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!user) {
                console.log('User not logged in, redirecting to signup');
                navigate('/signup');
              } else {
                console.log('User logged in, fetching jobs and navigating');
                if (!jobs) refetch();
                navigate('/available-jobs');
              }
            }}
            className="bg-indigo-500 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:bg-indigo-600"
          >
            See More
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {contactModalOpen && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white text-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Contact Employer</h3>
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
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(null)}
                    className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600"
                  >
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
          className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-lg shadow-lg"
        >
          Message sent successfully!
        </motion.div>
      )}
    </div>
  );
});

export default JobSection;