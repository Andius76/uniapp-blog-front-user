/**
 * 认证相关API接口封装
 * 文件位置: /src/api/auth.js
 * 
 * 该文件封装了所有与用户认证相关的API请求，包括：
 * - 发送验证码
 * - 用户注册
 * - 用户登录
 * - 重置密码
 * 
 * 所有API都基于/src/utils/request.js中的请求工具，
 * 该工具处理了不同平台(APP/H5/小程序)的基础URL、请求拦截和响应拦截。
 */

// 导入请求工具
import http from '@/utils/request.js';

/**
 * 发送邮箱验证码
 * @param {Object|string} params - 请求参数或邮箱字符串
 * @returns {Promise} - 返回Promise对象
 */
export const sendVerificationCode = (params) => {
  // 确保从params中获取email字符串
  const email = typeof params === 'object' ? params.email : params;
  return http.post(`/api/auth/send-email-code?email=${encodeURIComponent(email)}`);
};

/**
 * 用户注册
 * @param {Object} params - 注册参数
 * @param {string} params.email - 邮箱
 * @param {string} params.email_code - 邮箱验证码
 * @param {string} params.password - 密码
 * @returns {Promise} - 返回Promise对象
 */
export const register = (params) => {
  return http.post('/api/auth/register', params);
};

/**
 * 用户登录
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @param {boolean} data.remember - 是否记住登录状态
 * @returns {Promise} - 返回Promise对象
 */
export function login(data) {
  return http.post('/api/auth/login', data);
}

/**
 * 忘记密码（发送重置链接）
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱地址
 * @returns {Promise} - 返回Promise对象
 */
export function forgetPassword(data) {
  return http.post('/api/auth/forget-password', data);
}

/**
 * 重置密码
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱地址
 * @param {string} data.email_code - 验证码
 * @param {string} data.new_password - 新密码
 * @returns {Promise} - 返回Promise对象
 */
export function resetPassword(data) {
  return http.post('/api/auth/reset-password', data);
}

/**
 * 检查用户账号状态
 * @returns {Promise} - 返回Promise对象，包含用户状态信息
 */
export function checkUserStatus() {
  // 添加请求ID以便在日志中识别
  const requestId = Math.random().toString(36).substring(2, 10);
  console.log(`[${requestId}] 开始检查用户状态`);
  
  return new Promise((resolve, reject) => {
    // 设置超时处理
    const timeoutId = setTimeout(() => {
      console.warn(`[${requestId}] 检查用户状态请求超时`);
      reject(new Error('请求超时，无法获取用户状态'));
    }, 10000); // 10秒超时
    
    // 尝试不同的API路径，先尝试检查当前用户信息
    http.get('/api/user/info')
      .then(result => {
        clearTimeout(timeoutId); // 清除超时
        
        try {
          // 确保结果是有效的JSON对象
          if (typeof result === 'string') {
            try {
              result = JSON.parse(result);
            } catch (e) {
              console.error(`[${requestId}] 响应不是有效的JSON:`, result);
            }
          }
          
          console.log(`[${requestId}] 用户状态检查成功:`, result);
          
          // 确保result.data包含status字段
          if (result.code === 200 && result.data && typeof result.data.status !== 'undefined') {
            resolve(result);
          } else {
            // 如果用户信息API不包含status字段，则构造一个默认的正常状态返回
            console.log(`[${requestId}] 用户信息不包含status字段，使用默认状态1`);
            resolve({
              code: 200,
              data: {
                ...result.data,
                status: 1 // 假设用户状态正常
              },
              message: '获取用户状态成功'
            });
          }
        } catch (error) {
          console.error(`[${requestId}] 处理响应时出错:`, error);
          // 出错时返回默认状态
          resolve({
            code: 200,
            data: { status: 1 },
            message: '获取用户状态成功(默认)'
          });
        }
      })
      .catch(error => {
        clearTimeout(timeoutId); // 清除超时
        console.error(`[${requestId}] 用户状态检查失败:`, error);
        
        // 如果是401错误（未登录），则不视为异常，而是返回null
        if (error && error.code === 401) {
          resolve({
            code: 200,
            data: null,
            message: '用户未登录'
          });
        } else {
          // 其他错误情况，返回一个默认值，避免因为网络问题导致用户被误判为封禁
          resolve({
            code: 200,
            data: { status: 1 }, // 默认状态正常
            message: '获取状态失败，使用默认值'
          });
        }
      });
  });
}