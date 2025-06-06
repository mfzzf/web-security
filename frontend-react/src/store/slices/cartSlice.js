import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://47.97.51.174:2808/api';

// 异步thunk action - 获取购物车数据
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Fetching cart with token:', token);
      const response = await axios.get(`${API_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Cart data received:', response.data);
      // 确保返回完整的数据结构，包括直接从后端收到的所有字段
      return {
        items: response.data.items || [],
        totalQuantity: response.data.total_quantity || 0,
        totalAmount: response.data.total_amount || 0
      };
    } catch (error) {
      console.error('Error fetching cart:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch cart');
    }
  }
);

// 异步thunk action - 添加商品到购物车
export const addItemToCart = createAsyncThunk(
  'cart/addItemToCart',
  async (item, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/cart`, item, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // 正确解析后端返回的字段名
      return {
        items: response.data.items || [],
        totalQuantity: response.data.total_quantity || 0,
        totalAmount: response.data.total_amount || 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add item to cart');
    }
  }
);

// 异步thunk action - 更新商品数量
export const updateItemQuantity = createAsyncThunk(
  'cart/updateItemQuantity',
  async ({ id, quantity }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(`${API_URL}/cart/${id}`, { quantity }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // 正确解析后端返回的字段名
      return {
        items: response.data.items || [],
        totalQuantity: response.data.total_quantity || 0,
        totalAmount: response.data.total_amount || 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update item quantity');
    }
  }
);

// 异步thunk action - 从购物车移除商品
export const removeItemFromCart = createAsyncThunk(
  'cart/removeItemFromCart',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(`${API_URL}/cart/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // 正确解析后端返回的字段名
      return {
        items: response.data.items || [],
        totalQuantity: response.data.total_quantity || 0,
        totalAmount: response.data.total_amount || 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove item from cart');
    }
  }
);

// 异步thunk action - 清空购物车
export const clearCartItems = createAsyncThunk(
  'cart/clearCartItems',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(`${API_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // 正确解析后端返回的字段名
      return {
        items: response.data.items || [],
        totalQuantity: response.data.total_quantity || 0,
        totalAmount: response.data.total_amount || 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to clear cart');
    }
  }
);

// 确保在刷新页面时仍然有购物车缓存数据
const getInitialCartState = () => {
  try {
    const savedCart = localStorage.getItem('cartData');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      return {
        ...parsedCart,
        status: 'idle',
        error: null
      };
    }
  } catch (error) {
    console.error('Error parsing saved cart data:', error);
  }
  
  return {
    items: [],
    totalQuantity: 0,
    totalAmount: 0,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  };
};

const initialState = getInitialCartState();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // 本地操作，用于乐观UI更新
    setCartData: (state, action) => {
      const { items, totalQuantity, totalAmount } = action.payload;
      state.items = items;
      state.totalQuantity = totalQuantity;
      state.totalAmount = totalAmount;
    },
    
    resetCartError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // 处理获取购物车数据
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
        state.totalQuantity = action.payload.totalQuantity || 0;
        state.totalAmount = action.payload.totalAmount || 0;
        state.error = null;
        
        // 保存购物车数据到localStorage以便刷新页面时保持数据
        try {
          localStorage.setItem('cartData', JSON.stringify({
            items: state.items,
            totalQuantity: state.totalQuantity,
            totalAmount: state.totalAmount
          }));
        } catch (error) {
          console.error('Error saving cart data to localStorage:', error);
        }
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // 处理添加商品到购物车
      .addCase(addItemToCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
        state.totalQuantity = action.payload.totalQuantity || 0;
        state.totalAmount = action.payload.totalAmount || 0;
        state.error = null;
        
        // 保存购物车数据到localStorage
        localStorage.setItem('cartData', JSON.stringify({
          items: state.items,
          totalQuantity: state.totalQuantity,
          totalAmount: state.totalAmount
        }));
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // 处理更新商品数量
      .addCase(updateItemQuantity.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateItemQuantity.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
        state.totalQuantity = action.payload.totalQuantity || 0;
        state.totalAmount = action.payload.totalAmount || 0;
        state.error = null;
        
        // 保存购物车数据到localStorage
        localStorage.setItem('cartData', JSON.stringify({
          items: state.items,
          totalQuantity: state.totalQuantity,
          totalAmount: state.totalAmount
        }));
      })
      .addCase(updateItemQuantity.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // 处理从购物车移除商品
      .addCase(removeItemFromCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(removeItemFromCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
        state.totalQuantity = action.payload.totalQuantity || 0;
        state.totalAmount = action.payload.totalAmount || 0;
        state.error = null;
        
        // 保存购物车数据到localStorage
        localStorage.setItem('cartData', JSON.stringify({
          items: state.items,
          totalQuantity: state.totalQuantity,
          totalAmount: state.totalAmount
        }));
      })
      .addCase(removeItemFromCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // 处理清空购物车
      .addCase(clearCartItems.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(clearCartItems.fulfilled, (state) => {
        state.status = 'succeeded';
        state.items = [];
        state.totalQuantity = 0;
        state.totalAmount = 0;
        state.error = null;
        
        // 清除localStorage中的购物车数据
        localStorage.removeItem('cartData');
      })
      .addCase(clearCartItems.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setCartData, resetCartError } = cartSlice.actions;
export default cartSlice.reducer;

// 兼容性函数，提供与旧API相同的功能但使用新的异步action
export const addToCart = (item) => (dispatch) => {
  dispatch(addItemToCart({ product_id: item.id, quantity: item.quantity || 1 }));
};

export const removeFromCart = (id) => (dispatch) => {
  dispatch(removeItemFromCart(id));
};

export const updateQuantity = ({ id, quantity }) => (dispatch) => {
  dispatch(updateItemQuantity({ id, quantity }));
};

export const clearCart = () => (dispatch) => {
  dispatch(clearCartItems());
};
