import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import appReducer from './slices/appSlice';
import cropReducer from './slices/cropSlice';
import priceReducer from './slices/priceSlice';
import orderReducer from './slices/orderSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    crops: cropReducer,
    prices: priceReducer,
    orders: orderReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['app/setSocket'],
        ignoredPaths: ['app.socket'],
      },
    }),
});

export default store;