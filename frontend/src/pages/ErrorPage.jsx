import React from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ErrorPage = ({ errorMessage = 'Something went wrong', actionText = 'Try Again', actionPath = '/', showAction = true }) => {
  const navigate = useNavigate();

  const handleActionClick = () => {
    navigate(actionPath);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-indigo-100 px-4"
    >
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
          className="mb-6"
        >
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Oops! An Error Occurred</h2>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        {showAction && (
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(79, 70, 229, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleActionClick}
            className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold"
          >
            {actionText}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default ErrorPage;