import React from "react";
import { motion } from "framer-motion";

const JobCard = ({ title, company, description, buttonText }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
    hover: {
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  };

  const contentVariants = {
    hover: {
      y: -3,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="group w-80 h-96 bg-gradient-to-b from-white/10 to-white/5 p-6 
                 rounded-2xl backdrop-blur-sm border border-white/10 
                 flex flex-col justify-between relative overflow-hidden"
    >
      {/* Hover effect overlay */}
      <motion.div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content container with scrolling */}
      <motion.div
        className="flex-1 relative z-10 overflow-hidden"
        variants={contentVariants}
      >
        <motion.h3 className="text-xl font-bold text-white mb-2" layout>
          {title}
        </motion.h3>
        <motion.p className="text-gray-400 text-sm mb-3 font-medium" layout>
          {company}
        </motion.p>
        <motion.p
          className="text-gray-300 text-sm overflow-hidden text-ellipsis"
          style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}
          layout
        >
          {description}
        </motion.p>
      </motion.div>

      {/* Button */}
      <motion.button
        variants={buttonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        className="relative bg-white text-black px-6 py-2 rounded-xl font-bold 
                   shadow-lg hover:shadow-xl transition-shadow duration-300
                   after:absolute after:inset-0 after:bg-black/0 
                   after:hover:bg-black/5 after:transition-colors"
      >
        <span className="relative z-10">{buttonText}</span>
      </motion.button>
    </motion.div>
  );
};

export default JobCard;
