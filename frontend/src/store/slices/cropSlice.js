import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Async thunks matching your backend API
export const fetchCrops = createAsyncThunk(
  'crops/fetchCrops',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API_URL}/crops?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch crops');
    }
  }
);

export const fetchNearbyCrops = createAsyncThunk(
  'crops/fetchNearbyCrops',
  async ({ lat, lng, radius = 50, ...otherFilters }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        lat,
        lng,
        radius,
        ...otherFilters
      }).toString();
      const response = await axios.get(`${API_URL}/crops/nearby?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch nearby crops');
    }
  }
);

export const fetchCropById = createAsyncThunk(
  'crops/fetchCropById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/crops/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch crop');
    }
  }
);

export const createCrop = createAsyncThunk(
  'crops/createCrop',
  async (cropData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const formData = new FormData();
      
      // Append all crop data to formData
      Object.keys(cropData).forEach(key => {
        if (key === 'images' && cropData[key]) {
          // Handle multiple image files
          cropData[key].forEach((file, index) => {
            formData.append('images', file);
          });
        } else if (key === 'location' && typeof cropData[key] === 'object') {
          // Handle location object
          formData.append('district', cropData[key].district || '');
          formData.append('state', cropData[key].state || '');
        } else if (key === 'tags' && Array.isArray(cropData[key])) {
          // Handle tags array
          formData.append('tags', cropData[key].join(','));
        } else if (cropData[key] !== null && cropData[key] !== undefined) {
          formData.append(key, cropData[key]);
        }
      });

      const response = await axios.post(`${API_URL}/crops`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create crop');
    }
  }
);

export const updateCrop = createAsyncThunk(
  'crops/updateCrop',
  async ({ id, cropData, imagesToDelete = [] }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const formData = new FormData();
      
      // Append all crop data to formData
      Object.keys(cropData).forEach(key => {
        if (key === 'images' && cropData[key]) {
          // Handle new image files
          cropData[key].forEach((file, index) => {
            if (file instanceof File) {
              formData.append('images', file);
            }
          });
        } else if (key === 'location' && typeof cropData[key] === 'object') {
          // Handle location object
          formData.append('district', cropData[key].district || '');
          formData.append('state', cropData[key].state || '');
        } else if (key === 'tags' && Array.isArray(cropData[key])) {
          // Handle tags array
          formData.append('tags', cropData[key].join(','));
        } else if (cropData[key] !== null && cropData[key] !== undefined) {
          formData.append(key, cropData[key]);
        }
      });

      // Append images to delete
      if (imagesToDelete.length > 0) {
        imagesToDelete.forEach((publicId, index) => {
          formData.append('imagesToDelete[]', publicId);
        });
      }

      const response = await axios.put(`${API_URL}/crops/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update crop');
    }
  }
);

export const deleteCrop = createAsyncThunk(
  'crops/deleteCrop',
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.delete(`${API_URL}/crops/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { id, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete crop');
    }
  }
);

export const fetchMyCrops = createAsyncThunk(
  'crops/fetchMyCrops',
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API_URL}/crops/farmer/my-crops?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my crops');
    }
  }
);

export const fetchCropStatistics = createAsyncThunk(
  'crops/fetchCropStatistics',
  async (period = 'month', { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_URL}/crops/farmer/statistics?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch crop statistics');
    }
  }
);

export const searchCrops = createAsyncThunk(
  'crops/searchCrops',
  async (searchQuery, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ q: searchQuery }).toString();
      const response = await axios.get(`${API_URL}/crops/search?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search crops');
    }
  }
);

const initialState = {
  crops: [],
  nearbyCrops: [],
  currentCrop: null,
  myCrops: [],
  cropStatistics: null,
  searchResults: [],
  loading: false,
  error: null,
  filters: {
    cropName: '',
    district: '',
    state: '',
    minPrice: '',
    maxPrice: '',
    qualityGrade: '',
    status: 'available',
    sort: '-createdAt',
    page: 1,
    limit: 10,
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  myCropsPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

const cropSlice = createSlice({
  name: 'crops',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setMyCropsPagination: (state, action) => {
      state.myCropsPagination = { ...state.myCropsPagination, ...action.payload };
    },
    clearCurrentCrop: (state) => {
      state.currentCrop = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    updateCropInList: (state, action) => {
      const index = state.crops.findIndex(crop => crop._id === action.payload._id);
      if (index !== -1) {
        state.crops[index] = action.payload;
      }
    },
    updateMyCropInList: (state, action) => {
      const index = state.myCrops.findIndex(crop => crop._id === action.payload._id);
      if (index !== -1) {
        state.myCrops[index] = action.payload;
      }
    },
    clearAllCrops: (state) => {
      state.crops = [];
      state.nearbyCrops = [];
      state.myCrops = [];
      state.searchResults = [];
      state.currentCrop = null;
      state.cropStatistics = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch crops
      .addCase(fetchCrops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCrops.fulfilled, (state, action) => {
        state.loading = false;
        state.crops = action.payload.data;
        state.pagination = {
          page: action.payload.currentPage,
          limit: state.filters.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchCrops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch nearby crops
      .addCase(fetchNearbyCrops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyCrops.fulfilled, (state, action) => {
        state.loading = false;
        state.nearbyCrops = action.payload.data;
        state.error = null;
      })
      .addCase(fetchNearbyCrops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch crop by ID
      .addCase(fetchCropById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCropById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCrop = action.payload.data;
        state.error = null;
      })
      .addCase(fetchCropById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create crop
      .addCase(createCrop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCrop.fulfilled, (state, action) => {
        state.loading = false;
        state.crops.unshift(action.payload.data.crop);
        state.myCrops.unshift(action.payload.data.crop);
        state.error = null;
      })
      .addCase(createCrop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update crop
      .addCase(updateCrop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCrop.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCrop = action.payload.data.crop;
        
        // Update in crops list
        const index = state.crops.findIndex(crop => crop._id === updatedCrop._id);
        if (index !== -1) {
          state.crops[index] = updatedCrop;
        }
        
        // Update in my crops list
        const myIndex = state.myCrops.findIndex(crop => crop._id === updatedCrop._id);
        if (myIndex !== -1) {
          state.myCrops[myIndex] = updatedCrop;
        }
        
        // Update current crop if it's the same
        if (state.currentCrop && state.currentCrop._id === updatedCrop._id) {
          state.currentCrop = updatedCrop;
        }
        
        state.error = null;
      })
      .addCase(updateCrop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete crop
      .addCase(deleteCrop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCrop.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload.id;
        state.crops = state.crops.filter(crop => crop._id !== deletedId);
        state.myCrops = state.myCrops.filter(crop => crop._id !== deletedId);
        if (state.currentCrop && state.currentCrop._id === deletedId) {
          state.currentCrop = null;
        }
        state.error = null;
      })
      .addCase(deleteCrop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch my crops
      .addCase(fetchMyCrops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyCrops.fulfilled, (state, action) => {
        state.loading = false;
        state.myCrops = action.payload.data;
        state.myCropsPagination = {
          page: action.payload.currentPage,
          limit: state.filters.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchMyCrops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch crop statistics
      .addCase(fetchCropStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCropStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.cropStatistics = action.payload;
        state.error = null;
      })
      .addCase(fetchCropStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Search crops
      .addCase(searchCrops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCrops.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.data;
        state.error = null;
      })
      .addCase(searchCrops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPagination,
  setMyCropsPagination,
  clearCurrentCrop,
  clearSearchResults,
  updateCropInList,
  updateMyCropInList,
  clearAllCrops,
} = cropSlice.actions;

export default cropSlice.reducer;