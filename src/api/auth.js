// 导入请求工具
import http from '@/utils/request.js';

// auth.js
export const sendVerificationCode = (params) => {
  // 确保从params中获取email字符串
  const email = typeof params === 'object' ? params.email : params;
  return http.post(`/send-email-code?email=${encodeURIComponent(email)}`);
};

export const register = (params) => {
  return http.post('/register', params);
};

/**
 * 用户登录
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @returns {Promise} - 返回Promise对象
 */
export function login(data) {
  return http.post('/login', data);
}

/**
 * 忘记密码（发送重置链接）
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱地址
 * @returns {Promise} - 返回Promise对象
 */
export function forgetPassword(data) {
  return http.post('/forget-password', data);
}

/**
 * 重置密码
 * @param {Object} data - 请求数据
 * @param {string} data.token - 重置令牌
 * @param {string} data.newPassword - 新密码
 * @returns {Promise} - 返回Promise对象
 */
export function resetPassword(data) {
  return http.post('/reset-password', data);
}