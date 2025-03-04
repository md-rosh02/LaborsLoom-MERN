import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, Calendar, DollarSign, Trash2, Plus, MessageCircle, Edit, User, Mail, Phone, Home, X, Bell } from 'lucide-react';
import { doc, getDoc, getDocs, collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../components/firebase';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:5000', { withCredentials: true });

const ContractorProfile = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [userDetails, setUserDetails] = useState(null);
  const [uid, setUid] = useState(null);
  const [contractorJobs, setContractorJobs] = useState([]);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [tempNotification, setTempNotification] = useState(null);
  const chatInputRef = useRef(null);

  const initialFormState = {
    fname: '',
    age: '',
    location: '',
    email: '',
    phone: '',
    address: '',
    profileImage: '',
  };
  const [editForm, setEditForm] = useState(initialFormState);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
        fetchUserDetails(user.uid);
        fetchContractorJobs(user.uid);
        listenForMessages(user.uid);
        socket.emit('register', user.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    socket.on('connect', () => console.log('Connected to Socket.IO server'));
    socket.on('connect_error', (err) => console.error('Socket.IO connection error:', err.message));

    socket.on('newMessage', (message) => {
      if (message.receiverId === uid || message.senderId === uid) {
        setTempNotification({
          senderName: message.senderName || 'Unknown',
          message: message.message || 'No message content',
          timestamp: new Date(),
        });
        setTimeout(() => setTempNotification(null), 5000);

        setNotifications((prev) => [
          ...prev,
          { id: message.id, senderName: message.senderName, jobTitle: message.jobTitle || 'Chat', timestamp: new Date() },
        ]);

        // Update message list in real-time
        setMessages((prev) => {
          const existing = prev.find((m) => m.senderId === message.senderId);
          if (existing) {
            return [
              { ...existing, lastMessage: message.message, timestamp: message.timestamp, unread: existing.unread + (message.receiverId === uid ? 1 : 0) },
              ...prev.filter((m) => m.senderId !== message.senderId),
            ];
          } else {
            return [{
              senderId: message.senderId,
              senderName: message.senderName,
              senderProfile: message.senderProfile,
              lastMessage: message.message,
              timestamp: message.timestamp,
              unread: message.receiverId === uid ? 1 : 0,
            }, ...prev];
          }
        });

        // Update chat messages if the chat is open
        if (selectedChat?.senderId === message.senderId || message.senderId === uid) {
          setChatMessages((prev) => [...prev, message]);
        }
      }
    });

    return () => {
      socket.off('newMessage');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [uid, selectedChat]);

  const fetchUserDetails = async (userId) => {
    try {
      const docRef = doc(db, 'Users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserDetails(data);
        setEditForm({
          ...initialFormState,
          ...data,
          age: data.age?.toString() || '',
          phone: data.phone?.toString() || '',
        });
      }
    } catch (error) {
      setError('Error loading profile details');
      console.error('Fetch user details error:', error);
    }
  };

  const fetchContractorJobs = async (contractorId) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/jobs/contractor/${contractorId}`);
      setContractorJobs(data);
    } catch (error) {
      setError('Error fetching job postings');
      console.error('Fetch jobs error:', error);
    }
  };

  const listenForMessages = (contractorId) => {
    const q = query(
      collection(db, 'Messages'),
      where('receiverId', '==', contractorId),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const messagesMap = new Map();
      const senderIds = new Set();

      snapshot.docs.forEach((doc) => {
        const msg = { id: doc.id, ...doc.data() };
        senderIds.add(msg.senderId);
        if (!messagesMap.has(msg.senderId)) {
          messagesMap.set(msg.senderId, {
            senderId: msg.senderId,
            senderName: msg.senderName || 'Unknown',
            senderProfile: msg.senderProfile || '',
            lastMessage: msg.message,
            timestamp: msg.timestamp,
            unread: msg.read ? 0 : 1,
          });
        } else if (!msg.read) {
          const existing = messagesMap.get(msg.senderId);
          messagesMap.set(msg.senderId, { ...existing, unread: existing.unread + 1 });
        }
      });

      // Fetch missing sender details
      for (const senderId of senderIds) {
        if (!messagesMap.get(senderId).senderName || !messagesMap.get(senderId).senderProfile) {
          const senderDocRef = doc(db, 'Users', senderId);
          const senderDocSnap = await getDoc(senderDocRef);
          if (senderDocSnap.exists()) {
            const senderData = senderDocSnap.data();
            messagesMap.set(senderId, {
              ...messagesMap.get(senderId),
              senderName: senderData.fname || 'Unknown',
              senderProfile: senderData.profileImage || '',
            });
          }
        }
      }

      setMessages(Array.from(messagesMap.values()));
    });
  };

  const openChatDialog = useCallback(async (message) => {
    const q = query(
      collection(db, 'Messages'),
      where('senderId', '==', message.senderId),
      where('receiverId', '==', uid),
      where('read', '==', false)
    );

    const unreadSnapshot = await getDocs(q);
    const batch = writeBatch(db);
    unreadSnapshot.forEach((doc) => batch.update(doc.ref, { read: true }));
    await batch.commit();

    setSelectedChat(message);
    loadChatMessages(message.senderId);
    setShowChat(true);

    // Reset unread count
    setMessages((prev) =>
      prev.map((m) => (m.senderId === message.senderId ? { ...m, unread: 0 } : m))
    );
  }, [uid]);

  const loadChatMessages = useCallback((senderId) => {
    const q = query(
      collection(db, 'Messages'),
      where('senderId', 'in', [senderId, uid]),
      where('receiverId', 'in', [senderId, uid]),
      orderBy('timestamp')
    );

    return onSnapshot(q, async (snapshot) => {
      let chatMsgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      // Fetch sender details if missing
      const senderIds = [...new Set(chatMsgs.map((msg) => msg.senderId))].filter(id => id !== uid);
      for (const senderId of senderIds) {
        if (!chatMsgs.some((msg) => msg.senderId === senderId && msg.senderName && msg.senderProfile)) {
          const senderDocRef = doc(db, 'Users', senderId);
          const senderDocSnap = await getDoc(senderDocRef);
          if (senderDocSnap.exists()) {
            const senderData = senderDocSnap.data();
            chatMsgs = chatMsgs.map((msg) =>
              msg.senderId === senderId
                ? { ...msg, senderName: senderData.fname || 'Unknown', senderProfile: senderData.profileImage || '' }
                : msg
            );
          }
        }
      }

      setChatMessages(chatMsgs);
    });
  }, [uid]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageData = {
      senderId: uid,
      receiverId: selectedChat.senderId,
      message: newMessage.trim(),
      timestamp: serverTimestamp(),
      read: false,
      senderName: userDetails.fname || 'Unknown',
      senderProfile: userDetails.profileImage || '',
    };

    try {
      const docRef = await addDoc(collection(db, 'Messages'), messageData);
      socket.emit('sendMessage', { ...messageData, id: docRef.id });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [newMessage, selectedChat, uid, userDetails]);

  const handleDeleteJob = async () => {
    if (!jobToDelete || confirmationTitle !== jobToDelete.jobTitle) return;

    try {
      await axios.delete(`http://localhost:5000/api/jobs/${jobToDelete._id}`);
      setContractorJobs((prev) => prev.filter((job) => job._id !== jobToDelete._id));
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting job:', error);
      setError('Error deleting job. Please try again.');
    }
  };

  const closeDeleteDialog = () => {
    setJobToDelete(null);
    setShowDeleteDialog(false);
    setConfirmationTitle('');
  };

  const handleEditChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let updatedForm = { ...editForm };

      if (selectedFile) {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });

        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`,
          },
          body: JSON.stringify({
            userId: uid,
            image: base64Data,
            oldImage: userDetails.profileImage,
          }),
        });

        if (!uploadResponse.ok) throw new Error('Image upload failed');
        const { imageId } = await uploadResponse.json();
        updatedForm.profileImage = imageId;
      }

      const userRef = doc(db, 'Users', uid);
      await updateDoc(userRef, updatedForm);
      setUserDetails(updatedForm);
      setIsEditing(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error updating document: ', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [editForm, selectedFile, uid, userDetails]);

  const handleDeleteChat = useCallback(async (senderId) => {
    try {
      const q = query(
        collection(db, 'Messages'),
        where('senderId', 'in', [senderId, uid]),
        where('receiverId', 'in', [senderId, uid])
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      setMessages((prev) => prev.filter((msg) => msg.senderId !== senderId));
      setChatMessages([]);
      setSelectedChat(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat');
    }
  }, [uid]);

  const clearNotifications = () => setNotifications([]);

  const testNotification = () => {
    setTempNotification({
      senderName: 'Test User',
      message: 'This is a test notification!',
      timestamp: new Date(),
    });
    setTimeout(() => setTempNotification(null), 5000);
  };

  if (!userDetails) return <div className="min-h-screen bg-gray-50"></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <img
                src={
                  selectedFile
                    ? URL.createObjectURL(selectedFile)
                    : userDetails.profileImage
                    ? `http://localhost:5000/api/get-image/${userDetails.profileImage}`
                    : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400'
                }
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
              />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-700"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="fname"
                      value={editForm.fname}
                      onChange={handleEditChange}
                      className="p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-400"
                      placeholder="Full Name"
                    />
                    <input
                      type="number"
                      name="age"
                      value={editForm.age}
                      onChange={handleEditChange}
                      className="p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-400"
                      placeholder="Age"
                    />
                    <input
                      type="text"
                      name="location"
                      value={editForm.location}
                      onChange={handleEditChange}
                      className="p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-400"
                      placeholder="Location"
                    />
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      className="p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-400"
                      placeholder="Email"
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      className="p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-400"
                      placeholder="Phone"
                    />
                    <input
                      type="text"
                      name="address"
                      value={editForm.address}
                      onChange={handleEditChange}
                      className="p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-400"
                      placeholder="Address"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedFile(null);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:bg-indigo-300"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </motion.button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-indigo-700">{userDetails.fname}</h1>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowChat(true)}
                        className="text-indigo-600 hover:text-indigo-800 p-2"
                      >
                        <MessageCircle className="w-6 h-6" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(true)}
                        className="text-indigo-600 hover:text-indigo-800 p-2"
                      >
                        <Edit className="w-6 h-6" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={testNotification}
                        className="text-indigo-600 hover:text-indigo-800 p-2"
                      >
                        <Bell className="w-6 h-6" />
                      </motion.button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600">
                    <p className="flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-500" /> {userDetails.location}</p>
                    <p className="flex items-center gap-2"><User className="w-5 h-5 text-indigo-500" /> {userDetails.age} years</p>
                    <p className="flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-500" /> {userDetails.email}</p>
                    <p className="flex items-center gap-2"><Phone className="w-5 h-5 text-indigo-500" /> {userDetails.phone}</p>
                    <p className="flex items-center gap-2 col-span-2"><Home className="w-5 h-5 text-indigo-500" /> {userDetails.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Jobs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-indigo-700">Job Postings</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/post-job')}
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-600 transition"
            >
              <Plus className="w-5 h-5" /> Post New Job
            </motion.button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {contractorJobs.map((job) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="relative p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        {userDetails.profileImage ? (
                          <img
                            src={`http://localhost:5000/api/get-image/${userDetails.profileImage}`}
                            alt={`${userDetails.fname}'s profile`}
                            className="h-8 w-8 rounded-full object-cover border border-gray-300"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
                            {userDetails.fname?.charAt(0) || 'C'}
                          </div>
                        )}
                        <span className="text-sm text-gray-600">{userDetails.fname || 'Unknown Contractor'}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(job.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800 truncate">{job.jobTitle}</h2>
                    <span className="inline-block px-2 py-1 mt-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full">
                      {job.category || 'Uncategorized'}
                    </span>
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      <p className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-gray-500" /> {job.location}
                      </p>
                      <p className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-green-500" /> {job.payment}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setJobToDelete(job);
                        setShowDeleteDialog(true);
                      }}
                      className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-all duration-200"
                    >
                      <Trash2 className="w-5 h-5" /> Delete
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {contractorJobs.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">No active job postings found</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Temporary Notification Popup */}
      <AnimatePresence>
        {tempNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 right-4 z-50 bg-indigo-600 text-white rounded-lg shadow-lg p-4 max-w-sm"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <div>
                <p className="font-semibold">{tempNotification.senderName}</p>
                <p className="text-sm truncate">{tempNotification.message}</p>
                <p className="text-xs opacity-75">{tempNotification.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat and Notification Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="p-4 bg-indigo-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
                <MessageCircle className="w-6 h-6" /> Messages
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowChat(false);
                  setSelectedChat(null);
                }}
                className="text-indigo-600 hover:text-indigo-800"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Persistent Notifications */}
            {notifications.length > 0 && (
              <div className="p-4 bg-yellow-50 border-b border-yellow-100">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                    <Bell className="w-5 h-5" /> New Messages ({notifications.length})
                  </h3>
                  <button onClick={clearNotifications} className="text-yellow-600 hover:text-yellow-800 text-sm">Clear</button>
                </div>
                <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-200 scrollbar-track-yellow-50">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => openChatDialog({ senderId: notif.senderId, senderName: notif.senderName })}
                      className="p-2 bg-yellow-100 rounded-lg mb-2 cursor-pointer hover:bg-yellow-200 transition"
                    >
                      <p className="text-sm text-yellow-800">
                        <strong>{notif.senderName}</strong> about "{notif.jobTitle}" - {notif.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-indigo-100">
              {!selectedChat ? (
                <div className="p-4 border-b border-gray-200 bg-indigo-50 flex items-center gap-3">
                  <img
                    src={
                      userDetails.profileImage
                        ? `http://localhost:5000/api/get-image/${userDetails.profileImage}`
                        : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400'
                    }
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <h3 className="font-semibold text-indigo-700">{userDetails.fname} (You)</h3>
                </div>
              ) : null}
              {!selectedChat ? (
                messages.map((msg) => (
                  <motion.div
                    key={msg.senderId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => openChatDialog(msg)}
                    className="flex items-center p-4 border-b border-gray-100 hover:bg-indigo-50 cursor-pointer transition"
                  >
                    <img
                      src={
                        msg.senderProfile
                          ? `http://localhost:5000/api/get-image/${msg.senderProfile}`
                          : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400'
                      }
                      alt={`${msg.senderName}'s Profile`}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{msg.senderName}</h3>
                      <p className="text-sm text-gray-600 truncate">{msg.lastMessage}</p>
                    </div>
                    {msg.unread > 0 && (
                      <span className="bg-indigo-500 text-white text-xs rounded-full px-2 py-1">{msg.unread}</span>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-indigo-50">
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedChat(null)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <X className="w-6 h-6" />
                      </motion.button>
                      <img
                        src={
                          selectedChat.senderProfile
                            ? `http://localhost:5000/api/get-image/${selectedChat.senderProfile}`
                            : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400'
                        }
                        alt={`${selectedChat.senderName}'s Profile`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <h3 className="font-semibold text-indigo-700">{selectedChat.senderName}</h3>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteChat(selectedChat.senderId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-6 h-6" />
                    </motion.button>
                  </div>
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-indigo-100">
                    {chatMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${
                          msg.senderId === uid ? 'justify-end' : 'justify-start'
                        } items-start gap-2`}
                      >
                        {msg.senderId !== uid && (
                          <img
                            src={
                              msg.senderProfile
                                ? `http://localhost:5000/api/get-image/${msg.senderProfile}`
                                : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400'
                            }
                            alt={`${msg.senderName || 'Unknown'}'s Profile`}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <div
                          className={`max-w-[60%] rounded-lg p-3 flex flex-col ${
                            msg.senderId === uid
                              ? 'bg-indigo-500 text-white items-end'
                              : 'bg-gray-100 text-gray-800 items-start'
                          }`}
                        >
                          <p className="text-sm font-semibold">
                            {msg.senderName || (msg.senderId === uid ? userDetails.fname : 'Unknown')}
                          </p>
                          <p className="text-sm break-words">{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {msg.timestamp?.toDate().toLocaleTimeString()}
                          </p>
                        </div>
                        {msg.senderId === uid && (
                          <img
                            src={
                              userDetails.profileImage
                                ? `http://localhost:5000/api/get-image/${userDetails.profileImage}`
                                : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400'
                            }
                            alt="Your Profile"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 border-t border-gray-200 bg-indigo-50">
                    <div className="flex gap-2">
                      <input
                        ref={chatInputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Type your message..."
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={sendMessage}
                        className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
                      >
                        Send
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-4">
              Type <span className="font-semibold text-indigo-700">"{jobToDelete?.jobTitle}"</span> to confirm
            </p>
            <input
              type="text"
              value={confirmationTitle}
              onChange={(e) => setConfirmationTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-center text-gray-700 focus:ring-2 focus:ring-indigo-400"
              autoFocus
            />
            <div className="flex gap-3 justify-end mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteJob}
                disabled={confirmationTitle !== jobToDelete?.jobTitle}
                className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white transition"
              >
                Delete
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeDeleteDialog}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ContractorProfile;