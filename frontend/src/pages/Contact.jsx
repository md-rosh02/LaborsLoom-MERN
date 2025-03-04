import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MapPin, Phone, Mail, MessageSquare } from 'lucide-react';
import { db } from '../components/firebase'; // Assuming firebase.js exports db
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null, 'success', or 'error'

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Store the form data in Firestore
      await addDoc(collection(db, 'ContactMessages'), {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        timestamp: serverTimestamp(),
      });

      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' }); // Reset form
      setTimeout(() => setSubmitStatus(null), 3000); // Clear status after 3 seconds
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="h-[50vh] relative overflow-hidden bg-indigo-700"
      >
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"
          alt="Office"
          className="w-full h-full object-cover mix-blend-overlay opacity-30"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">Get in Touch</h1>
            <div className="h-1 w-24 bg-white mx-auto"></div>
          </motion.div>
        </div>
      </motion.div>

      {/* Contact Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid md:grid-cols-2 gap-16">
        {/* Contact Information */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          <motion.div variants={fadeIn} className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Contact Information</h2>
            <p className="text-gray-600 text-lg">We're here to help and answer any questions you might have.</p>
          </motion.div>

          <motion.div variants={fadeIn} className="space-y-8">
            <div className="flex items-center space-x-6 group">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Our Location</h3>
                <p className="text-gray-600">123 Business Avenue, Suite 100</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 group">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Phone Number</h3>
                <p className="text-gray-600">+1 (555) 123-4567</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 group">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Email Address</h3>
                <p className="text-gray-600">contact@company.com</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white p-12 rounded-2xl shadow-2xl relative"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-900">Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-4 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all outline-none text-gray-900 placeholder-gray-500"
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-4 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all outline-none text-gray-900 placeholder-gray-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-medium text-gray-900">Message</label>
              <textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-4 py-4 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all outline-none text-gray-900 placeholder-gray-500"
                placeholder="Your message..."
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 transition-colors ${
                isSubmitting ? 'bg-indigo-300 text-white cursor-not-allowed' : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              <Send className="w-5 h-5" />
            </motion.button>
          </form>

          {/* Success/Error Feedback */}
          <AnimatePresence>
            {submitStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute -bottom-16 left-0 right-0 bg-green-500 text-white text-center py-2 rounded-b-lg"
              >
                Message sent successfully!
              </motion.div>
            )}
            {submitStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute -bottom-16 left-0 right-0 bg-red-500 text-white text-center py-2 rounded-b-lg"
              >
                Failed to send message. Please try again.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-indigo-600 transition-colors"
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>
    </div>
  );
}

export default Contact;