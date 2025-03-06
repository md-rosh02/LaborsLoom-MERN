import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, User, Mail, Phone, Home, Edit, MessageCircle, X, Bell, Send, Trash2 } from 'lucide-react';
import { auth, db } from '../components/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, updateDoc, getDocs, writeBatch } from "firebase/firestore";

const LaborProfile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [uid, setUid] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editForm, setEditForm] = useState({ fname: '', age: '', location: '', email: '', phone: '', address: '', profileImage: '' });
  const [notifications, setNotifications] = useState([]);
  const chatContainerRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserDetails(data);
          setEditForm(data);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "Messages"), where("receiverId", "==", uid), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messagesMap = new Map();
      const newNotifications = [];
      const senderIds = new Set();

      snapshot.docs.forEach(doc => {
        const msg = { id: doc.id, ...doc.data() };
        senderIds.add(msg.senderId);
        if (!msg.read) {
          newNotifications.push({ senderName: msg.senderName || 'Unknown', message: msg.message, timestamp: msg.timestamp });
        }
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

      for (const senderId of senderIds) {
        const msg = messagesMap.get(senderId);
        if (!msg.senderProfile || !msg.senderName || msg.senderName === 'Unknown') {
          const senderDocRef = doc(db, 'Users', senderId);
          const senderDocSnap = await getDoc(senderDocRef);
          if (senderDocSnap.exists()) {
            const senderData = senderDocSnap.data();
            messagesMap.set(senderId, {
              ...msg,
              senderName: senderData.fname || 'Unknown',
              senderProfile: senderData.profileImage ? `https://laborsloom-mern-1.onrender.com/api/get-image/${senderData.profileImage}` : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
            });
          }
        }
      }

      setMessages(Array.from(messagesMap.values()));
      setNotifications(newNotifications);
    });
    return () => unsubscribe();
  }, [uid]);

  const loadChatMessages = useCallback((senderId) => {
    const q = query(collection(db, "Messages"), where("senderId", "in", [senderId, uid]), where("receiverId", "in", [senderId, uid]), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let chatMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const senderIds = [...new Set(chatMsgs.map(msg => msg.senderId))].filter(id => id !== uid);
      for (const senderId of senderIds) {
        if (!chatMsgs.some(msg => msg.senderId === senderId && msg.senderProfile)) {
          const senderDocRef = doc(db, 'Users', senderId);
          const senderDocSnap = await getDoc(senderDocRef);
          if (senderDocSnap.exists()) {
            const senderData = senderDocSnap.data();
            chatMsgs = chatMsgs.map(msg =>
              msg.senderId === senderId
                ? {
                    ...msg,
                    senderName: senderData.fname || 'Unknown',
                    senderProfile: senderData.profileImage ? `https://laborsloom-mern-1.onrender.com/api/get-image/${senderData.profileImage}` : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
                  }
                : msg
            );
          }
        }
      }

      setChatMessages(chatMsgs);
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    });
    return unsubscribe;
  }, [uid]);

  const openChatDialog = useCallback(async (message) => {
    const q = query(collection(db, "Messages"), where("senderId", "==", message.senderId), where("receiverId", "==", uid), where("read", "==", false));
    const unreadSnapshot = await getDocs(q);
    const batch = writeBatch(db);
    unreadSnapshot.forEach(doc => batch.update(doc.ref, { read: true }));
    await batch.commit();
    setSelectedChat(message);
    setShowChat(true);
    loadChatMessages(message.senderId);
  }, [uid, loadChatMessages]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedChat) return;
    const messageData = {
      senderId: uid,
      receiverId: selectedChat.senderId,
      message: newMessage.trim(),
      timestamp: serverTimestamp(),
      read: false,
      senderName: userDetails.fname || 'Unknown',
      senderProfile: userDetails.profileImage ? `https://laborsloom-mern-1.onrender.com/api/get-image/${userDetails.profileImage}` : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
    };
    await addDoc(collection(db, "Messages"), messageData);
    setNewMessage('');
  }, [newMessage, selectedChat, uid, userDetails]);

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
      setShowChat(false); // Close chat panel after deletion
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat');
    }
  }, [uid]);

  const handleEditChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let updatedForm = { ...editForm };
      if (selectedFile) {
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(selectedFile);
        });
        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser.getIdToken()}` },
          body: JSON.stringify({ userId: uid, image: base64Data, oldImage: userDetails.profileImage }),
        });
        const { imageId } = await uploadResponse.json();
        updatedForm.profileImage = imageId;
      }
      await updateDoc(doc(db, "Users", uid), updatedForm);
      setUserDetails(updatedForm);
      setIsEditing(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userDetails) return <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100"></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-gray-100 pt-20 pb-10">
      <div className="container mx-auto px-4">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="max-w-2xl mx-auto"
          >
            {!showChat ? (
              // Profile Section
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 relative">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-semibold text-gray-800">{userDetails.fname}</h1>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowChat(true)}
                      className="bg-indigo-500 text-white p-2 rounded-full hover:bg-indigo-600 shadow-md transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <motion.div className="relative" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <button className="relative p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                        <Bell className="w-5 h-5 text-indigo-600" />
                        {notifications.length > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                          >
                            {notifications.length}
                          </motion.span>
                        )}
                      </button>
                      {notifications.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-72 bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-4 border border-gray-100 z-10"
                        >
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">New Messages</h4>
                          {notifications.map((notif, idx) => (
                            <div key={idx} className="text-sm text-gray-600 mb-2">
                              <p><strong>{notif.senderName}</strong>: {notif.message}</p>
                              <p className="text-xs text-gray-400">{notif.timestamp?.toDate().toLocaleTimeString()}</p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-6">
                  <motion.img
                    src={
                      selectedFile
                        ? URL.createObjectURL(selectedFile)
                        : userDetails.profileImage
                        ? `https://laborsloom-mern-1.onrender.com/api/get-image/${userDetails.profileImage}`
                        : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400'
                    }
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                    whileHover={{ scale: 1.05 }}
                    onError={(e) => console.error('Failed to load profile image:', userDetails.profileImage)}
                  />
                  {isEditing ? (
                    <form onSubmit={handleEditSubmit} className="w-full space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="w-full p-2 border border-gray-200 rounded-lg bg-white/50"
                      />
                      {['fname', 'age', 'location', 'email', 'phone', 'address'].map(field => (
                        <input
                          key={field}
                          type={field === 'age' ? 'number' : field === 'email' ? 'email' : 'text'}
                          name={field}
                          value={editForm[field]}
                          onChange={handleEditChange}
                          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                          className="w-full p-2 border border-gray-200 rounded-lg bg-white/50 focus:ring-2 focus:ring-indigo-400 outline-none"
                        />
                      ))}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => { setIsEditing(false); setSelectedFile(null); }}
                          className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2 text-gray-600 text-center">
                      <p><MapPin className="w-4 h-4 inline mr-1" /> {userDetails.location}</p>
                      <p><User className="w-4 h-4 inline mr-1" /> {userDetails.age} years</p>
                      <p><Mail className="w-4 h-4 inline mr-1" /> {userDetails.email}</p>
                      <p><Phone className="w-4 h-4 inline mr-1" /> {userDetails.phone}</p>
                      <p><Home className="w-4 h-4 inline mr-1" /> {userDetails.address}</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setIsEditing(true)}
                        className="mt-4 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 flex items-center gap-2 mx-auto"
                      >
                        <Edit className="w-4 h-4" /> Edit Profile
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Chat Section
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg h-[600px] flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
                  <h2 className="text-lg font-semibold text-gray-800">{selectedChat ? selectedChat.senderName : 'Messages'}</h2>
                  <div className="flex items-center gap-4">
                    <motion.div className="relative" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <button className="relative p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                        <Bell className="w-5 h-5 text-indigo-600" />
                        {notifications.length > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                          >
                            {notifications.length}
                          </motion.span>
                        )}
                      </button>
                      {notifications.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-72 bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-4 border border-gray-100 z-10"
                        >
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">New Messages</h4>
                          {notifications.map((notif, idx) => (
                            <div key={idx} className="text-sm text-gray-600 mb-2">
                              <p><strong>{notif.senderName}</strong>: {notif.message}</p>
                              <p className="text-xs text-gray-400">{notif.timestamp?.toDate().toLocaleTimeString()}</p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                    {selectedChat ? (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteChat(selectedChat.senderId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    ) : null}
                    <button onClick={() => { setShowChat(false); setSelectedChat(null); }} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {!selectedChat ? (
                  <div className="flex-1 overflow-y-auto">
                    {messages.map(msg => (
                      <motion.div
                        key={msg.senderId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => openChatDialog(msg)}
                        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      >
                        <img
                          src={
                            msg.senderProfile.includes('http')
                              ? msg.senderProfile
                              : `https://laborsloom-mern-1.onrender.com/api/get-image/${msg.senderProfile}`
                          }
                          alt={`${msg.senderName}'s Profile`}
                          className="w-10 h-10 rounded-full object-cover mr-3 shadow-sm"
                          onError={(e) => {
                            console.error(`Failed to load sender image for ${msg.senderName}: ${msg.senderProfile}`);
                            e.target.src = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{msg.senderName}</h3>
                          <p className="text-sm text-gray-500 truncate">{msg.lastMessage}</p>
                        </div>
                        {msg.unread > 0 && <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div ref={chatContainerRef} className="flex-1 max-h-[calc(600px-136px)] overflow-y-auto p-4 space-y-4 bg-gray-50">
                      <AnimatePresence>
                        {chatMessages.map(msg => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex items-start gap-2 ${msg.senderId === uid ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.senderId !== uid && (
                              <img
                                src={
                                  msg.senderProfile.includes('http')
                                    ? msg.senderProfile
                                    : `https://laborsloom-mern-1.onrender.com/api/get-image/${msg.senderProfile}`
                                }
                                alt={`${msg.senderName || 'Unknown'}'s Profile`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  console.error(`Failed to load chat sender image for ${msg.senderName}: ${msg.senderProfile}`);
                                  e.target.src = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400';
                                }}
                              />
                            )}
                            <div
                              className={`max-w-[70%] rounded-xl p-3 shadow-sm flex flex-col ${
                                msg.senderId === uid ? 'bg-indigo-500 text-white items-end' : 'bg-white text-gray-800 items-start'
                              }`}
                            >
                              <p className="text-sm font-semibold">
                                {msg.senderName || (msg.senderId === uid ? userDetails.fname : 'Unknown')}
                              </p>
                              <p className="text-sm break-words">{msg.message}</p>
                              <p className="text-xs mt-1 opacity-70">{msg.timestamp?.toDate().toLocaleTimeString()}</p>
                            </div>
                            {msg.senderId === uid && (
                              <img
                                src={
                                  userDetails.profileImage
                                    ? `https://laborsloom-mern-1.onrender.com/api/get-image/${userDetails.profileImage}`
                                    : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400'
                                }
                                alt="Your Profile"
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                onError={(e) => console.error('Failed to load current user chat image:', userDetails.profileImage)}
                              />
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-white/80">
                      <div className="flex gap-2">
                        <input
                          ref={chatInputRef}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                          placeholder="Type your message..."
                          className="flex-1 rounded-lg border border-gray-200 px-4 py-2 bg-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={sendMessage}
                          className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-600 shadow-md"
                        >
                          <Send className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(LaborProfile);