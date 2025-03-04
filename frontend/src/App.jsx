import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar'; // Adjust according to your file structure
import HomePage from './pages/Home'; // Adjust according to your file structure
import LaborerProfile from './pages/LaborerProfile'; // Adjust according to your file structure
import SettingsPage from './pages/Setting'; // Adjust according to your file structure
import Login from './pages/Login';
import Signup from './pages/Signup';
import Contact from './pages/Contact';
import AvailableJobsPage from './pages/AvailableJobs';
import Team from './pages/Team';
import Mission from './pages/MissionVis';
import { AuthProvider } from './context/AuthContext';
import PostJob from './pages/PostJob';
import ContractorProfile from './pages/ContractorProfile';
import 'react-toastify/dist/ReactToastify.css';
import JobDetail from './components/JobDetail';
import AutoNavbar from './components/AutoNavbar';
import AdminPanel from './pages/Admin';
import { ParallaxProvider } from 'react-scroll-parallax';

const App = () => {
  return (
    <ParallaxProvider>
      <Router>
        <AuthProvider>
          {/* App Content */}
          <Navbar />
          <AutoNavbar />

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile/labor" element={<LaborerProfile />} />
            <Route path="/profile/contractor" element={<ContractorProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/available-jobs" element={<AvailableJobsPage />} />
            <Route path="/team" element={<Team />} />
            <Route path="/mission" element={<Mission />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/job/:id" element={<JobDetail />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>

          {/* Uncomment if you want ContactFooter on every page */}
          {/* <ContactFooter /> */}
        </AuthProvider>
      </Router>
    </ParallaxProvider>
  );
};

export default App;