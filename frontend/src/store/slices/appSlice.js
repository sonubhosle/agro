import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  socket: null,
  notifications: [],
  unreadNotifications: 0,
  isLoading: false,
  theme: 'light',
  language: 'en',
  priceAlerts: [],
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadNotifications += 1;
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(
        (n) => n._id === action.payload
      );
      if (notification) {
        notification.read = true;
        state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
      state.unreadNotifications = 0;
    },
    clearAllNotifications: (state) => { // ADDED THIS
      state.notifications = [];
      state.unreadNotifications = 0;
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload;
      state.unreadNotifications = action.payload.filter(
        (n) => !n.read
      ).length;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    addPriceAlert: (state, action) => {
      state.priceAlerts.push(action.payload);
    },
    removePriceAlert: (state, action) => {
      state.priceAlerts = state.priceAlerts.filter(
        (alert) => alert._id !== action.payload
      );
    },
    clearAllPriceAlerts: (state) => {
      state.priceAlerts = [];
    },
  },
});

export const {
  setSocket,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications, // ADDED TO EXPORTS
  setNotifications,
  setLoading,
  toggleTheme,
  setLanguage,
  addPriceAlert,
  removePriceAlert,
  clearAllPriceAlerts,
} = appSlice.actions;

export default appSlice.reducer;