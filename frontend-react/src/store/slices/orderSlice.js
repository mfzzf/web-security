import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Now using relative paths since baseURL is configured in api.js
const ORDERS_ENDPOINT = '/orders';
const PAYMENTS_ENDPOINT = '/payments';

// Async thunks
export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${ORDERS_ENDPOINT}/user/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch user orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`${ORDERS_ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch order');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post(ORDERS_ENDPOINT, orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${ORDERS_ENDPOINT}/${id}/status`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update order status');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.put(`${ORDERS_ENDPOINT}/${id}/status`, { status: 'cancelled' });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to cancel order');
    }
  }
);

export const createPaymentSession = createAsyncThunk(
  'orders/createPaymentSession',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.post(`${PAYMENTS_ENDPOINT}/orders/${orderId}/checkout`, {});
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create payment session');
    }
  }
);

export const checkPaymentStatus = createAsyncThunk(
  'orders/checkPaymentStatus',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${PAYMENTS_ENDPOINT}/orders/${orderId}/payment-status`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to check payment status');
    }
  }
);

const initialState = {
  orders: [],
  order: null,
  loading: false,
  error: null,
  paymentSession: null,
  paymentStatus: null,
  paymentLoading: false,
  paymentError: null
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.order = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch single order
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.push(action.payload);
        state.order = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update order status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.order = action.payload;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex(o => o.id === parseInt(action.payload.order_id));
        if (index !== -1) {
          state.orders[index].status = 'cancelled';
        }
        if (state.order && state.order.id === parseInt(action.payload.order_id)) {
          state.order.status = 'cancelled';
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create payment session
      .addCase(createPaymentSession.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(createPaymentSession.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentSession = action.payload;
      })
      .addCase(createPaymentSession.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })
      
      // Check payment status
      .addCase(checkPaymentStatus.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(checkPaymentStatus.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentStatus = action.payload;
      })
      .addCase(checkPaymentStatus.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      });
  }
});

export const { clearOrderError, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
