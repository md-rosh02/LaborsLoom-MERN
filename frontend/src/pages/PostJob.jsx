import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Briefcase, MapPin, DollarSign, Calendar, Plus, CheckCircle2, Tags } from 'lucide-react';
import axios from 'axios';
import { auth, db } from '../components/firebase';
import { doc, getDoc } from 'firebase/firestore';

function PostJob() {
  const navigate = useNavigate();
  const location = useLocation();
  const [previousPage, setPreviousPage] = useState('/');

  useEffect(() => {
    if (location.state?.from) {
      setPreviousPage(location.state.from);
    }
  }, [location]);

  const [formData, setFormData] = useState({
    jobTitle: '',
    category: '',
    location: '',
    payment: '',
    date: new Date(),
  });

  const jobCategories = [
    'Village School Teacher',
    'Dairy Farm Worker',
    'Carpenter',
    'Blacksmith',
    'Mason',
    'Electrician',
    'Plumber',
    'Tailor',
    'Shopkeeper',
    'Other'
  ];

  const [uid, setUid] = useState(null);
  const [contractorName, setContractorName] = useState('');
  const [contractorUsername, setContractorUsername] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, 'Users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setContractorName(userData.fname || '');
          setContractorUsername(userData.fname || user.email.split('@')[0]);
        } else {
          setError('User data not found in Firebase.');
        }
      } else {
        setUid(null);
        setContractorName('');
        setContractorUsername('');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid) {
      setError('You must be logged in to post a job.');
      return;
    }
  
    if (!contractorUsername) {
      setError('Contractor username could not be retrieved.');
      return;
    }
  
    setIsSubmitted(false);
    setError('');
  
    try {
      const response = await axios.post('https://laborsloom-mern-1.onrender.com/api/jobs', {
        ...formData,
        contractorId: uid,
        contractorName: contractorName,
        contractorUsername: contractorUsername,
        date: formData.date.toISOString(),
      });
  
      if (response.status === 201) {
        setIsSubmitted(true);
        setTimeout(() => navigate(previousPage), 1500);
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({ jobTitle: '', category: '', location: '', payment: '', date: new Date() });
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while creating the job.');
    }
  };

  const payload = {
    ...formData,
    contractorId: uid,
    contractorName: contractorName,
    contractorUsername: contractorUsername,
    date: formData.date.toISOString(),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-15">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 py-12 max-w-4xl"
      >
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-gray-800 mb-4"
          >
            Create a New Job Posting
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600"
          >
            Fill in the details below to create your job posting
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1,
                }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-gray-800 mb-2"
              >
                Job Posted Successfully!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600"
              >
                Your job posting has been created and is now live.
              </motion.p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.6 }}
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
            >
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  {error}
                </div>
              )}

              {/* Job Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <Briefcase className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. Senior Developer"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                  />
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <Tags className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select a category</option>
                    {jobCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <MapPin className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. New York, NY"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <DollarSign className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Payment
                  </label>
                  <input
                    type="text"
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. $100,000 - $130,000"
                    value={formData.payment}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment: e.target.value }))}
                  />
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative col-span-2"
                >
                  <Calendar className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Start Date
                  </label>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholderText="Select date"
                  />
                </motion.div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200"
              >
                Create Job Posting
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default PostJob;