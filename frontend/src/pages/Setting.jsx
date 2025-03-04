import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const [newName, setNewName] = useState('John Doe');
  const [newSkills, setNewSkills] = useState(['Carpentry', 'Masonry']);
  const [newExperience, setNewExperience] = useState('5 years');
  const [availability, setAvailability] = useState(true);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const handleSaveSettings = () => {
    // You can integrate API calls or state management to save these settings.
    console.log("Settings Saved:", { newName, newSkills, newExperience, availability });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white pt-20"
    >
      <div className="container mx-auto py-8 px-4">
        <motion.div 
          {...fadeIn}
          className="bg-white/10 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden"
        >
          <div className="p-8">
            <motion.h1 
              {...fadeIn} 
              className="text-3xl font-bold mb-8"
            >
              Settings
            </motion.h1>
            
            <motion.div {...fadeIn} className="space-y-6">
              <div>
                <label className="block font-semibold mb-2 text-white/80">Name</label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 text-white transition-all duration-300"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white/80">Skills</label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={newSkills.join(', ')}
                  onChange={(e) => setNewSkills(e.target.value.split(', '))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 text-white transition-all duration-300"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white/80">Experience</label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={newExperience}
                  onChange={(e) => setNewExperience(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 text-white transition-all duration-300"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white/80">Availability</label>
                <div className="flex items-center space-x-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availability}
                      onChange={() => setAvailability(!availability)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/40"></div>
                  </label>
                  <span className="text-white/80">{availability ? 'Available' : 'Not Available'}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.15)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveSettings}
                className="w-full px-6 py-3 bg-white/10 text-white font-semibold rounded-lg border border-white/10 transition-all duration-300 mt-8"
              >
                Save Settings
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer 
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="bg-white/10 backdrop-blur-md text-white text-center py-4 border-t border-white/10 mt-8"
      >
        <p className="text-white/80">&copy; 2025 LaborLoom. All Rights Reserved.</p>
      </motion.footer>
    </motion.div>
  );
};

export default SettingsPage;