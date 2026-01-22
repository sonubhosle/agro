import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Async thunks
export const fetchPriceHistory = createAsyncThunk(
  'prices/fetchPriceHistory',
  async ({ cropId, period = '7d' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/prices/history/${cropId}?period=${period}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch price history');
    }
  }
);

export const fetchDistrictPrices = createAsyncThunk(
  'prices/fetchDistrictPrices',
  async ({ cropId, district }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/prices/district/${cropId}/${district}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch district prices');
    }
  }
);

export const fetchStatePrices = createAsyncThunk(
  'prices/fetchStatePrices',
  async ({ cropId, state }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/prices/state/${cropId}/${state}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch state prices');
    }
  }
);

export const fetchNationalPrices = createAsyncThunk(
  'prices/fetchNationalPrices',
  async (cropId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/prices/national/${cropId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch national prices');
    }
  }
);

export const createPriceAlert = createAsyncThunk(
  'prices/createPriceAlert',
  async (alertData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(`${API_URL}/prices/alerts`, alertData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create price alert');
    }
  }
);

const initialState = {
  priceHistory: [],
  districtPrices: [],
  statePrices: [],
  nationalPrices: [],
  priceAlerts: [],
  loading: false,
  error: null,
  currentPeriod: '7d',
  comparisonData: {
    district: null,
    state: null,
    national: null,
  },
};

const priceSlice = createSlice({
  name: 'prices',
  initialState,
  reducers: {
    updatePriceInRealTime: (reduxState, action) => {
      const { cropId, price, district, state, national } = action.payload;
      
      // Update in price history if current crop matches
      reduxState.priceHistory = reduxState.priceHistory.map(item => 
        item.cropId === cropId 
          ? { ...item, currentPrice: price, updatedAt: new Date().toISOString() }
          : item
      );
      
      // Update district prices
      if (district) {
        reduxState.districtPrices = reduxState.districtPrices.map(item =>
          item.cropId === cropId && item.district === district
            ? { ...item, price, updatedAt: new Date().toISOString() }
            : item
        );
      }
      
      // Update state prices
      if (state) {
        reduxState.statePrices = reduxState.statePrices.map(item =>
          item.cropId === cropId && item.state === state
            ? { ...item, price, updatedAt: new Date().toISOString() }
            : item
        );
      }
      
      // Update national prices
      if (national) {
        reduxState.nationalPrices = reduxState.nationalPrices.map(item =>
          item.cropId === cropId
            ? { ...item, price, updatedAt: new Date().toISOString() }
            : item
        );
      }
    },
    setCurrentPeriod: (reduxState, action) => {
      reduxState.currentPeriod = action.payload;
    },
    clearPriceData: (reduxState) => {
      reduxState.priceHistory = [];
      reduxState.districtPrices = [];
      reduxState.statePrices = [];
      reduxState.nationalPrices = [];
      reduxState.comparisonData = initialState.comparisonData;
    },
    addPriceAlertLocal: (reduxState, action) => {
      reduxState.priceAlerts.push(action.payload);
    },
    removePriceAlertLocal: (reduxState, action) => {
      reduxState.priceAlerts = reduxState.priceAlerts.filter(alert => alert._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch price history
      .addCase(fetchPriceHistory.pending, (reduxState) => {
        reduxState.loading = true;
        reduxState.error = null;
      })
      .addCase(fetchPriceHistory.fulfilled, (reduxState, action) => {
        reduxState.loading = false;
        reduxState.priceHistory = action.payload;
        reduxState.error = null;
      })
      .addCase(fetchPriceHistory.rejected, (reduxState, action) => {
        reduxState.loading = false;
        reduxState.error = action.payload;
      })
      // Fetch district prices
      .addCase(fetchDistrictPrices.pending, (reduxState) => {
        reduxState.loading = true;
        reduxState.error = null;
      })
      .addCase(fetchDistrictPrices.fulfilled, (reduxState, action) => {
        reduxState.loading = false;
        reduxState.districtPrices = action.payload;
        reduxState.comparisonData.district = action.payload;
        reduxState.error = null;
      })
      .addCase(fetchDistrictPrices.rejected, (reduxState, action) => {
        reduxState.loading = false;
        reduxState.error = action.payload;
      })
      // Fetch state prices
      .addCase(fetchStatePrices.pending, (reduxState) => {
        reduxState.loading = true;
        reduxState.error = null;
      })
      .addCase(fetchStatePrices.fulfilled, (reduxState, action) => {
        reduxState.loading = false;
        reduxState.statePrices = action.payload;
        reduxState.comparisonData.state = action.payload;
        reduxState.error = null;
      })
      .addCase(fetchStatePrices.rejected, (reduxState, action) => {
        reduxState.loading = false;
        reduxState.error = action.payload;
      })
      // Fetch national prices
      .addCase(fetchNationalPrices.pending, (reduxState) => {
        reduxState.loading = true;
        reduxState.error = null;
      })
      .addCase(fetchNationalPrices.fulfilled, (reduxState, action) => {
        reduxState.loading = false;
        reduxState.nationalPrices = action.payload;
        reduxState.comparisonData.national = action.payload;
        reduxState.error = null;
      })
      .addCase(fetchNationalPrices.rejected, (reduxState, action) => {
        reduxState.loading = false;
        reduxState.error = action.payload;
      })
      // Create price alert
      .addCase(createPriceAlert.pending, (reduxState) => {
        reduxState.loading = true;
        reduxState.error = null;
      })
      .addCase(createPriceAlert.fulfilled, (reduxState, action) => {
        reduxState.loading = false;
        reduxState.priceAlerts.push(action.payload);
        reduxState.error = null;
      })
      .addCase(createPriceAlert.rejected, (reduxState, action) => {
        reduxState.loading = false;
        reduxState.error = action.payload;
      });
  },
});

export const {
  updatePriceInRealTime,
  setCurrentPeriod,
  clearPriceData,
  addPriceAlertLocal,
  removePriceAlertLocal,
} = priceSlice.actions;

export default priceSlice.reducer;