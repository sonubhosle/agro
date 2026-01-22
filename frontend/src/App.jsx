import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  FarmerDashboard,
  BuyerDashboard,
  AdminDashboard,
  CropListPage,
  CropDetailPage,
  PriceDashboard,
  OrderListPage,
  OrderDetailPage,
  ChatPage,
  ProfilePage,
  SettingsPage
} from './pages';
import { setSocket, addNotification } from './store/slices/appSlice';

function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize Socket.io connection
      const socket = io(import.meta.env.VITE_API_URL, {
        withCredentials: true,
        auth: {
          token: localStorage.getItem('token')
        }
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        dispatch(setSocket(socket));
        
        // Join user room
        socket.emit('join-user', user._id);
      });

      socket.on('new-notification', (notification) => {
        dispatch(addNotification(notification));
        
        // Show toast notification
        import('react-hot-toast').then(({ toast }) => {
          toast.success(notification.title, {
            description: notification.message
          });
        });
      });

      socket.on('price-updated', (data) => {
        console.log('Price updated:', data);
        // Handle price updates
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user, dispatch]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="crops" element={<CropListPage />} />
        <Route path="crops/:id" element={<CropDetailPage />} />
        <Route path="prices" element={<PriceDashboard />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard">
            <Route path="farmer" element={<FarmerDashboard />} />
            <Route path="buyer" element={<BuyerDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
          </Route>
          
          <Route path="orders">
            <Route index element={<OrderListPage />} />
            <Route path=":id" element={<OrderDetailPage />} />
          </Route>
          
          <Route path="chat" element={<ChatPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;