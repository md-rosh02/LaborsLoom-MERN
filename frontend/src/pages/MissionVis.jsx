import React from 'react';
import { Target, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const MissionVis = () => {
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

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen py-16 pt-26">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl font-bold mb-4 text-gray-900">Mission & Vision</h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-24 h-1 bg-indigo-500 mx-auto"
          ></motion.div>
        </motion.div>

        {/* Mission & Vision Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-16"
        >
          <motion.div
            variants={fadeIn}
            className="bg-white p-8 rounded-2xl shadow-2xl hover:bg-indigo-50 transition-all duration-300 group"
          >
            <div className="flex items-center mb-8">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="p-3 bg-indigo-500 rounded-full mr-4 group-hover:bg-indigo-600 transition-colors"
              >
                <Target className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="leading-relaxed text-lg text-gray-600">
              To revolutionize the labor hiring process by creating a transparent, efficient, and fair platform that connects skilled laborers with meaningful work opportunities while ensuring quality, reliability, and fair compensation for all parties involved.
            </p>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="bg-white p-8 rounded-2xl shadow-2xl hover:bg-indigo-50 transition-all duration-300 group"
          >
            <div className="flex items-center mb-8">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="p-3 bg-indigo-500 rounded-full mr-4 group-hover:bg-indigo-600 transition-colors"
              >
                <Users className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
            </div>
            <p className="leading-relaxed text-lg text-gray-600">
              To become the most trusted and comprehensive labor hiring platform, empowering workers to build sustainable careers while helping businesses find the right talent efficiently. We envision a future where quality work meets fair opportunity, creating positive impact in communities worldwide.
            </p>
          </motion.div>
        </motion.div>

        {/* Core Values Section */}
        <div className="mt-20 mb-5">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-900">Our Core Values</h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-3 gap-8"
          >
            <motion.div
              variants={fadeIn}
              className="bg-white p-8 rounded-2xl shadow-2xl hover:bg-indigo-50 transition-all duration-300"
            >
              <h3 className="text-xl font-bold mb-4 text-center text-gray-900">Transparency</h3>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 48 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-12 h-1 bg-indigo-500 mx-auto mb-4"
              ></motion.div>
              <p className="text-center text-gray-600">Clear communication and honest dealings in all interactions</p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="bg-white p-8 rounded-2xl shadow-2xl hover:bg-indigo-50 transition-all duration-300"
            >
              <h3 className="text-xl font-bold mb-4 text-center text-gray-900">Quality</h3>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 48 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-12 h-1 bg-indigo-500 mx-auto mb-4"
              ></motion.div>
              <p className="text-center text-gray-600">Maintaining high standards in service delivery and platform operations</p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="bg-white p-8 rounded-2xl shadow-2xl hover:bg-indigo-50 transition-all duration-300"
            >
              <h3 className="text-xl font-bold mb-4 text-center text-gray-900">Fairness</h3>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 48 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-12 h-1 bg-indigo-500 mx-auto mb-4"
              ></motion.div>
              <p className="text-center text-gray-600">Equal opportunities and fair compensation for all stakeholders</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MissionVis;