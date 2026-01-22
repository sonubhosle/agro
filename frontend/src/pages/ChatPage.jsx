import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  Paperclip,
  Smile,
  Image as ImageIcon,
  File,
  Mic,
} from 'lucide-react';

const ChatPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const chats = [
    {
      id: 1,
      user: {
        id: 'farmer1',
        name: 'Green Valley Farm',
        role: 'farmer',
        online: true,
        lastSeen: '2 min ago',
      },
      lastMessage: 'The crops will be ready by tomorrow.',
      timestamp: '10:30 AM',
      unread: 2,
    },
    {
      id: 2,
      user: {
        id: 'buyer1',
        name: 'Fresh Mart',
        role: 'buyer',
        online: false,
        lastSeen: '1 hour ago',
      },
      lastMessage: 'Can we schedule delivery for Friday?',
      timestamp: 'Yesterday',
      unread: 0,
    },
    {
      id: 3,
      user: {
        id: 'farmer2',
        name: 'Organic Farms',
        role: 'farmer',
        online: true,
        lastSeen: 'Online',
      },
      lastMessage: 'Received your payment, thank you!',
      timestamp: '2 days ago',
      unread: 0,
    },
  ];

  const messages = activeChat === 1 ? [
    { id: 1, sender: 'farmer1', text: 'Hello! The tomato crop is ready for harvest.', timestamp: '9:45 AM', read: true },
    { id: 2, sender: 'user', text: 'Great! What is the current price per kg?', timestamp: '9:46 AM', read: true },
    { id: 3, sender: 'farmer1', text: '₹45/kg for grade A quality.', timestamp: '9:47 AM', read: true },
    { id: 4, sender: 'user', text: 'Can you share some photos of the crop?', timestamp: '9:48 AM', read: true },
    { id: 5, sender: 'farmer1', text: 'Sure, I will send them shortly.', timestamp: '9:50 AM', read: true },
    { id: 6, sender: 'farmer1', text: 'The crops will be ready by tomorrow.', timestamp: '10:30 AM', read: false },
  ] : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      // Send message logic
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-gray-50 rounded-xl shadow">
      <div className="flex h-full">
        {/* Sidebar - Chat List */}
        <div className="w-full md:w-80 border-r border-gray-200 bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`w-full p-4 flex items-start border-b border-gray-100 hover:bg-gray-50 ${
                  activeChat === chat.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="font-semibold text-primary-600">
                      {chat.user.name.charAt(0)}
                    </span>
                  </div>
                  {chat.user.online && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-3 flex-1 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{chat.user.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{chat.user.role}</div>
                    </div>
                    <div className="text-xs text-gray-500">{chat.timestamp}</div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                      <span className="ml-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <span className="font-semibold text-primary-600">
                        {chats.find(c => c.id === activeChat)?.user.name.charAt(0)}
                      </span>
                    </div>
                    {chats.find(c => c.id === activeChat)?.user.online && (
                      <div className="absolute bottom-0 right-2 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {chats.find(c => c.id === activeChat)?.user.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {chats.find(c => c.id === activeChat)?.user.online ? 'Online' : 'Last seen ' + chats.find(c => c.id === activeChat)?.user.lastSeen}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Video className="h-5 w-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Info className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xl rounded-lg p-3 ${
                        msg.sender === 'user'
                          ? 'bg-primary-600 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-200' : 'text-gray-500'}`}>
                        {msg.timestamp}
                        {msg.sender === 'user' && (
                          <span className="ml-2">
                            {msg.read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
                    <Paperclip className="h-5 w-5 text-gray-600" />
                  </button>
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
                    <File className="h-5 w-5 text-gray-600" />
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
                    <Smile className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
                    <Mic className="h-5 w-5 text-gray-600" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                <MessageCircle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                Choose a chat from the sidebar to start messaging with farmers or buyers.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border text-center">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-medium mb-1">Voice Call</h4>
                  <p className="text-sm text-gray-600">Make voice calls to farmers</p>
                </div>
                <div className="bg-white p-4 rounded-lg border text-center">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Video className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-medium mb-1">Video Call</h4>
                  <p className="text-sm text-gray-600">See crops live via video</p>
                </div>
                <div className="bg-white p-4 rounded-lg border text-center">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <File className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-medium mb-1">Share Files</h4>
                  <p className="text-sm text-gray-600">Share documents and images</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;