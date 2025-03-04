import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Briefcase, MessageSquare, Bell, BarChart, Settings, LogOut, X, Send, Edit, Trash, Mail } from 'lucide-react';
import { auth, db } from '../components/firebase';
import { collection, query, onSnapshot, addDoc, getDoc, updateDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const socket = io('http://localhost:5000', { withCredentials: true });

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [userGrowthData, setUserGrowthData] = useState({ labels: [], datasets: [] });
  const [errorMessage, setErrorMessage] = useState(''); // Added for error feedback
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }
      const userDoc = await getDoc(doc(db, 'Users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        navigate('/');
        return;
      }

      // Fetch Users
      const usersQuery = query(collection(db, 'Users'));
      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
        const growthData = processUserGrowth(usersList);
        setUserGrowthData(growthData);
      });

      // Fetch Jobs from API
      const fetchJobs = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/jobs');
          setJobs(response.data);
        } catch (error) {
          console.error('Error fetching jobs:', error);
          setErrorMessage('Failed to fetch jobs');
        }
      };
      fetchJobs();

      // Fetch Messages
      const messagesQuery = query(collection(db, 'Messages'));
      onSnapshot(messagesQuery, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      // Fetch Contact Messages
      const contactMessagesQuery = query(collection(db, 'ContactMessages'));
      onSnapshot(contactMessagesQuery, (snapshot) => {
        setContactMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      // Fetch Notifications
      const notificationsQuery = query(collection(db, 'Messages'), where('read', '==', false));
      onSnapshot(notificationsQuery, (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      // Socket.IO for real-time messaging
      socket.emit('register', user.uid);
      socket.on('newMessage', (message) => {
        setMessages((prev) => [...prev, message]);
        if (!message.read) setNotifications((prev) => [...prev, message]);
      });

      return () => {
        unsubscribeUsers();
        socket.off('newMessage');
      };
    });

    return () => unsubscribe();
  }, [navigate]);

  const processUserGrowth = (users) => {
    const userCountsByDay = {};
    users.forEach((user) => {
      if (user.createdAt) {
        const date = new Date(user.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        userCountsByDay[date] = (userCountsByDay[date] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(userCountsByDay).sort((a, b) => new Date(a) - new Date(b));
    const counts = sortedDates.map(date => userCountsByDay[date]);

    return {
      labels: sortedDates,
      datasets: [
        {
          label: 'Users Registered',
          data: counts,
          fill: false,
          borderColor: '#4f46e5',
          tension: 0.1,
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#4f46e5',
        },
      ],
    };
  };

  const handleLogout = () => {
    auth.signOut().then(() => navigate('/login'));
  };

  const handleEditUser = async (userId, updatedData) => {
    await updateDoc(doc(db, 'Users', userId), updatedData);
    setIsModalOpen(false);
  };

  const handleDeleteJob = async (jobId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/jobs/${jobId}`);
      console.log('Delete response:', response.data);
      setJobs((prev) => prev.filter(job => job._id !== jobId));
      setIsModalOpen(false);
      setErrorMessage(''); // Clear any previous error
    } catch (error) {
      console.error('Error deleting job:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'Failed to delete job');
    }
  };

  const handleMarkAsRead = async (messageId) => {
    await updateDoc(doc(db, 'Messages', messageId), { read: true });
  };

  const openModal = (type, data) => {
    setModalType(type);
    if (type === 'editUser') setSelectedUser(data);
    if (type === 'deleteJob') setSelectedJob(data);
    setIsModalOpen(true);
    setErrorMessage(''); // Reset error message on modal open
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'contactMessages', label: 'Contact Messages', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'User Growth (Day by Day)', font: { size: 18 } },
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Number of Users' }, beginAtZero: true },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-100 mt-20 px-10">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-indigo-900 text-white p-6 flex flex-col justify-between fixed h-screen"
      >
        <div>
          <h1 className="text-2xl font-bold mb-8">LaborLoom Admin</h1>
          <nav className="space-y-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg ${activeTab === tab.id ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center space-x-3 p-3 hover:bg-indigo-800 rounded-lg">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-indigo-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Total Users</h3>
                  <p className="text-2xl">{users.length}</p>
                </div>
                <div className="bg-indigo-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Total Jobs</h3>
                  <p className="text-2xl">{jobs.length}</p>
                </div>
                <div className="bg-indigo-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Unread Messages</h3>
                  <p className="text-2xl">{notifications.length}</p>
                </div>
                <div className="bg-indigo-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Contact Messages</h3>
                  <p className="text-2xl">{contactMessages.length}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <Line data={userGrowthData} options={chartOptions} />
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">User Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-indigo-200">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-3">{user.fname}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">{user.role}</td>
                        <td className="p-3 flex space-x-2">
                          <button onClick={() => openModal('editUser', user)} className="text-indigo-500 hover:text-indigo-700">
                            <Edit className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Job Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-indigo-200">
                      <th className="p-3">Title</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Contractor</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job._id} className="border-b">
                        <td className="p-3">{job.jobTitle}</td>
                        <td className="p-3">{job.location}</td>
                        <td className="p-3">{job.payment}</td>
                        <td className="p-3">{job.contractorName || 'Unknown'}</td>
                        <td className="p-3">{job.category || 'Uncategorized'}</td>
                        <td className="p-3">{new Date(job.date).toLocaleDateString()}</td>
                        <td className="p-3 flex space-x-2">
                          <button onClick={() => openModal('deleteJob', job)} className="text-red-500 hover:text-red-700">
                            <Trash className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">All Messages</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-indigo-200">
                      <th className="p-3">Sender</th>
                      <th className="p-3">Receiver</th>
                      <th className="p-3">Message</th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Read</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((msg) => (
                      <tr key={msg.id} className="border-b">
                        <td className="p-3">{msg.senderName || 'Unknown'}</td>
                        <td className="p-3">{msg.receiverName || users.find(u => u.id === msg.receiverId)?.fname || 'Unknown'}</td>
                        <td className="p-3 truncate max-w-xs">{msg.message}</td>
                        <td className="p-3">{msg.timestamp?.toDate().toLocaleString() || 'N/A'}</td>
                        <td className="p-3">{msg.read ? 'Yes' : 'No'}</td>
                        <td className="p-3">
                          {!msg.read && (
                            <button
                              onClick={() => handleMarkAsRead(msg.id)}
                              className="text-indigo-500 hover:text-indigo-700"
                            >
                              Mark as Read
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {messages.length === 0 && (
                <p className="text-center text-gray-500 mt-4">No messages available</p>
              )}
            </div>
          )}

          {activeTab === 'contactMessages' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Contact Messages</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-indigo-200">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Message</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contactMessages.map((msg) => (
                      <tr key={msg.id} className="border-b">
                        <td className="p-3">{msg.name}</td>
                        <td className="p-3">{msg.email}</td>
                        <td className="p-3 truncate max-w-xs">{msg.message}</td>
                        <td className="p-3">{msg.timestamp?.toDate().toLocaleString() || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {contactMessages.length === 0 && (
                <p className="text-center text-gray-500 mt-4">No contact messages available</p>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Notifications</h2>
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{notif.senderName}</p>
                      <p>{notif.message}</p>
                      <p className="text-sm text-gray-500">{notif.timestamp?.toDate().toLocaleTimeString()}</p>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-indigo-500 hover:text-indigo-700"
                    >
                      Mark as Read
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Settings</h2>
              <p className="text-gray-600">Admin settings coming soon...</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
            >
              {modalType === 'editUser' && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Edit User</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target;
                      handleEditUser(selectedUser.id, {
                        fname: form.fname.value,
                        email: form.email.value,
                        role: form.role.value,
                      });
                    }}
                    className="space-y-4"
                  >
                    <input defaultValue={selectedUser.fname} name="fname" className="w-full p-2 border rounded-lg" placeholder="Name" />
                    <input defaultValue={selectedUser.email} name="email" className="w-full p-2 border rounded-lg" placeholder="Email" />
                    <select defaultValue={selectedUser.role} name="role" className="w-full p-2 border rounded-lg">
                      <option value="labor">Labor</option>
                      <option value="contractor">Contractor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 p-2 rounded-lg">Cancel</button>
                      <button type="submit" className="bg-indigo-500 text-white p-2 rounded-lg">Save</button>
                    </div>
                  </form>
                </div>
              )}

              {modalType === 'deleteJob' && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Delete Job</h3>
                  <p>Are you sure you want to delete "{selectedJob?.jobTitle}"?</p>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 p-2 rounded-lg">Cancel</button>
                    <button onClick={() => handleDeleteJob(selectedJob?._id)} className="bg-red-500 text-white p-2 rounded-lg">Delete</button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;