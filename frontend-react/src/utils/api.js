import axios from 'axios';
import { store } from '../store';
import { refreshToken } from '../store/slices/authSlice';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8080/api'
});

// 请求拦截器，自动添加令牌
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器，处理令牌过期
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 避免无限循环
    if (
      error.response && 
      error.response.status === 401 && 
      error.response.data.error && 
      (
        error.response.data.error.includes('token') ||
        error.response.data.error.includes('令牌')
      ) && 
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      try {
        // 尝试刷新令牌
        const result = await store.dispatch(refreshToken()).unwrap();
        const newAccessToken = result.accessToken;
        
        // 使用新令牌重试原始请求
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新失败，需要重新登录
        console.log('令牌刷新失败，请重新登录', refreshError);
        // 重定向到登录页面或其他处理...
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
