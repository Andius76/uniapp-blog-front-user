/**
 * 认证相关API服务
 */

// 导入请求工具（假设项目中已有request工具，如果没有需要自行实现）
import request from '../utils/request';

// 基础URL
const BASE_URL = '/api/v1';

/**
 * 发送邮箱验证码
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱地址
 * @returns {Promise} - 返回Promise对象
 */
export function sendVerificationCode(data) {
  return request({
    url: `${BASE_URL}/auth/send-verification-code`,
    method: 'POST',
    data
  });
}

/**
 * 用户注册
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱地址
 * @param {string} data.verificationCode - 验证码
 * @param {string} data.password - 密码
 * @param {string} [data.nickname] - 昵称（可选）
 * @returns {Promise} - 返回Promise对象
 */
export function register(data) {
  return request({
    url: `${BASE_URL}/auth/register`,
    method: 'POST',
    data
  });
}

/**
 * 用户登录
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @returns {Promise} - 返回Promise对象
 */
export function login(data) {
  return request({
    url: `${BASE_URL}/auth/login`,
    method: 'POST',
    data
  });
}

/**
 * 忘记密码（发送重置链接）
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱地址
 * @returns {Promise} - 返回Promise对象
 */
export function forgetPassword(data) {
  return request({
    url: `${BASE_URL}/auth/forget-password`,
    method: 'POST',
    data
  });
}

/**
 * 重置密码
 * @param {Object} data - 请求数据
 * @param {string} data.token - 重置令牌
 * @param {string} data.newPassword - 新密码
 * @returns {Promise} - 返回Promise对象
 */
export function resetPassword(data) {
  return request({
    url: `${BASE_URL}/auth/reset-password`,
    method: 'POST',
    data
  });
}