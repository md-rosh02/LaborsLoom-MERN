import React, { useRef } from 'react';
import { Briefcase, Github, Linkedin, Mail } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const Team = () => {
  const teamMembers = [
    {
      name: 'Roshan',
      role: 'Project Lead & Full Stack Developer',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
      bio: '10+ years of experience in building scalable platforms. Passionate about creating technology that makes a difference in people’s lives.',
      linkedin: '#',
      github: '#',
      email: 'sarah@projectmestri.com',
    },
    {
      name: 'Manoj',
      role: 'Project Lead & Full Stack Developer',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
      bio: 'Design expert focused on creating intuitive and accessible interfaces. Advocates for user-centered design principles.',
      linkedin: '#',
      github: '#',
      email: 'michael@projectmestri.com',
    },
    {
      name: 'Tayyab',
      role: 'Project Lead & Full Stack Developer',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
      bio: 'Design expert focused on creating intuitive and accessible interfaces. Advocates for user-centered design principles.',
      linkedin: '#',
      github: '#',
      email: 'michael@projectmestri.com',
    },
  ];

  const TeamCard = ({ member }) => {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 400, damping: 25 });
    const springY = useSpring(y, { stiffness: 400, damping: 25 });
    const rotateX = useTransform(springY, [-0.5, 0.5], [15, -15]); // Increased tilt
    const rotateY = useTransform(springX, [-0.5, 0.5], [-15, 15]);
    const glowOpacity = useMotionValue(0);

    const handleMouseMove = (e) => {
      const rect = ref.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
      x.set(mouseX * 1.2); // Slightly amplified movement
      y.set(mouseY * 1.2);
      glowOpacity.set(0.3); // Glow on hover
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
      glowOpacity.set(0);
    };

    return (
      <motion.div
        ref={ref}
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 group"
        style={{ perspective: 1200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: Math.random() * 0.4 }}
        whileHover={{ 
          scale: 1.08, 
          boxShadow: '0 30px 60px -15px rgba(99, 102, 241, 0.5)',
          zIndex: 10, // Bring forward on hover
        }}
      >
        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        />

        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 bg-indigo-500 rounded-2xl blur-3xl opacity-0"
          style={{ opacity: glowOpacity }}
        />

        <motion.div
          style={{ rotateX, rotateY }}
          className="flex flex-col md:flex-row bg-gradient-to-br from-white to-indigo-50/50 backdrop-blur-sm"
        >
          {/* Image Section */}
          <motion.div
            className="md:w-2/5 relative overflow-hidden"
            whileHover={{ scale: 1.15 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/70 to-transparent z-10"></div>
            <img
              src={member.image}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Content Section */}
          <div className="md:w-3/5 p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-gray-900 mb-3 drop-shadow-md">{member.name}</h3>
              <div className="flex items-center mb-4">
                <Briefcase className="h-6 w-6 text-indigo-500 mr-3" />
                <p className="text-gray-600 font-medium">{member.role}</p>
              </div>
              <p className="mb-6 leading-relaxed text-gray-600 text-lg">{member.bio}</p>
            </div>
            <div className="flex space-x-8">
              <motion.a
                href={member.linkedin}
                whileHover={{ scale: 1.3, rotate: 10, y: -5 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-600 hover:text-indigo-600 transition-colors duration-300"
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <Linkedin className="h-7 w-7" />
              </motion.a>
              <motion.a
                href={member.github}
                whileHover={{ scale: 1.3, rotate: 10, y: -5 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-600 hover:text-indigo-600 transition-colors duration-300"
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <Github className="h-7 w-7" />
              </motion.a>
              <motion.a
                href={`mailto:${member.email}`}
                whileHover={{ scale: 1.3, rotate: 10, y: -5 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-600 hover:text-indigo-600 transition-colors duration-300"
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <Mail className="h-7 w-7" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen py-16 pt-26 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Animated Background Gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-gray-50 to-indigo-100/20 opacity-50"
          animate={{ scale: [1, 1.02, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 relative z-10"
        >
          <h1 className="text-6xl font-extrabold mb-3 text-gray-900 drop-shadow-lg">Our Team</h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-32 h-1 bg-indigo-500 mx-auto mb-4"
          ></motion.div>
          <p className="text-gray-600 max-w-2xl mx-auto text-xl font-medium">
            Meet the dedicated professionals behind Project Mestri who are working to revolutionize the labor hiring process.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 relative z-10">
          {teamMembers.map((member, index) => (
            <TeamCard key={index} member={member} />
          ))}
        </div>

        {/* Pulsing Chat Button */}
        <motion.button
          className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-indigo-600 transition-colors"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <Mail className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
};

export default Team;