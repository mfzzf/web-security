import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 更新API路径
const AUTH_API_URL = 'http://127.0.0.1:8080/api/auth';
const USERS_API_URL = 'http://127.0.0.1:8080/api/users';

// 令牌过期前的刷新阈值（毫秒）
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5分钟

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${AUTH_API_URL}/login`, { username, password });
      
      // 存储访问令牌和刷新令牌
      const { access_token, refresh_token, user } = response.data;
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('tokenTimestamp', Date.now().toString());
      
      return {
        user,
        accessToken: access_token,
        refreshToken: refresh_token
      };
    } catch (error) {
      // 提取错误信息
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.error
          ? error.response.data.error
          : typeof error.response?.data === 'string'
            ? error.response.data
            : '登录失败';
      return rejectWithValue(errorMessage);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${AUTH_API_URL}/register`, { 
        username, 
        email, 
        password 
      });
      return response.data;
    } catch (error) {
      // 提取错误信息
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.error
          ? error.response.data.error
          : typeof error.response?.data === 'string'
            ? error.response.data
            : '注册失败';
      return rejectWithValue(errorMessage);
    }
  }
);

// 刷新令牌函数
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue, getState }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('找不到刷新令牌');
      }
      
      const response = await axios.post(`${AUTH_API_URL}/refresh`, { 
        refresh_token: refreshToken 
      });
      
      // 存储新的令牌
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('tokenTimestamp', Date.now().toString());
      
      return {
        accessToken: access_token,
        refreshToken: refresh_token
      };
    } catch (error) {
      // 令牌刷新失败，需要重新登录
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenTimestamp');
      
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.error
          ? error.response.data.error
          : '会话已过期，请重新登录';
      return rejectWithValue(errorMessage);
    }
  }
);

// 检查令牌并获取用户资料
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // 检查访问令牌
      let accessToken = localStorage.getItem('accessToken');
      const tokenTimestamp = parseInt(localStorage.getItem('tokenTimestamp') || '0');
      const currentTime = Date.now();
      
      // 如果令牌即将过期，先刷新
      if (accessToken && (currentTime - tokenTimestamp > REFRESH_THRESHOLD)) {
        try {
          const refreshResult = await dispatch(refreshToken()).unwrap();
          accessToken = refreshResult.accessToken;
        } catch (error) {
          // 刷新失败，继续尝试使用当前令牌
          console.log('令牌刷新失败，使用现有令牌');
        }
      }
      
      if (!accessToken) {
        return rejectWithValue('找不到访问令牌');
      }
      
      // 获取用户资料
      const response = await axios.get(`${USERS_API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      // 映射后端字段名到前端字段名，并添加isAdmin属性
      return {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        fullName: response.data.full_name,
        phone: response.data.phone,
        address: response.data.address,
        city: response.data.city,
        state: response.data.state_province,
        zipCode: response.data.zip_postal_code,
        role: response.data.role,
        isAdmin: response.data.role === 'admin', // 添加isAdmin属性，用于前端权限检查
        lastLogin: response.data.last_login,
        accountStatus: response.data.account_status,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at
      };
    } catch (error) {
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.error
          ? error.response.data.error
          : typeof error.response?.data === 'string'
            ? error.response.data
            : '获取用户资料失败';
      return rejectWithValue(errorMessage);
    }
  }
);

// 注销函数
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        // 如果没有令牌，默认为已注销
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenTimestamp');
        return { success: true };
      }
      
      // 配置请求头
      const config = {
        headers: { Authorization: `Bearer ${accessToken}` }
      };
      
      await axios.post(`${AUTH_API_URL}/logout`, {}, config);
      
      // 清除localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenTimestamp');
      
      return { success: true };
    } catch (error) {
      // 删除令牌，因为无论如何我们都要注销
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenTimestamp');
      
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.error
          ? error.response.data.error
          : '注销过程中出错';
      
      // 返回成功，因为前端已经注销
      return { success: true, error: errorMessage };
    }
  }
);

// 更新用户资料
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        return rejectWithValue('需要登录才能更新资料');
      }

      // 映射前端字段名到后端字段名
      const mappedUserData = {
        full_name: userData.fullName,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        state_province: userData.state,  // 前端state映射到后端state_province
        zip_postal_code: userData.zipCode // 前端zipCode映射到后端zip_postal_code
      };
      
      // 如果有密码字段，也添加到请求中
      if (userData.newPassword) {
        mappedUserData.current_password = userData.currentPassword;
        mappedUserData.new_password = userData.newPassword;
      }

      // 发送更新请求
      const response = await axios.put(`${USERS_API_URL}/profile`, mappedUserData, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      // 提取错误信息
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.error
          ? error.response.data.error
          : typeof error.response?.data === 'string'
            ? error.response.data
            : '更新资料失败';
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,
  tokenRefreshing: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // 仅清除本地状态，实际注销API调用由logoutUser异步thunk处理
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenTimestamp');
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 登录
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        // 确保错误总是字符串
        state.error = typeof action.payload === 'object' && action.payload.error
          ? action.payload.error
          : action.payload || '登录失败';
      })

      // 注册
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        // 注册成功但用户仍需登录
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        // 确保错误总是字符串
        state.error = typeof action.payload === 'object' && action.payload.error
          ? action.payload.error
          : action.payload || '注册失败';
      })

      // 获取用户资料
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        // 删除本地存储的令牌
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenTimestamp');
        // 确保错误总是字符串
        state.error = typeof action.payload === 'object' && action.payload.error
          ? action.payload.error
          : action.payload || '获取用户资料失败';
      })
      
      // 刷新令牌
      .addCase(refreshToken.pending, (state) => {
        state.tokenRefreshing = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.tokenRefreshing = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.tokenRefreshing = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        // 删除本地存储的令牌
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenTimestamp');
      })
      
      // 注销用户
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // 即使后端注销失败，前端也认为用户已注销
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
      })
      
      // 更新用户资料
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'object' && action.payload.error
          ? action.payload.error
          : action.payload || '更新资料失败';
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
