/**
 * 网络请求工具
 */

/**
 * 请求配置
 */
const config = {
  // 基础URL，实际开发中可能会根据环境变量来设置
  baseUrl: '',
  // 请求头
  header: {
    'Content-Type': 'application/json'
  },
  // 请求超时时间（毫秒）
  timeout: 60000,
  // 是否携带token
  withToken: true
};

/**
 * 获取存储的token
 * @returns {string} token值
 */
function getToken() {
  return uni.getStorageSync('token') || '';
}

/**
 * 请求拦截器
 * @param {Object} options - 请求配置
 * @returns {Object} 处理后的请求配置
 */
function requestInterceptor(options) {
  // 如果需要携带token且本地有token，则添加到请求头
  if (config.withToken) {
    const token = getToken();
    if (token) {
      options.header = options.header || {};
      options.header['Authorization'] = `Bearer ${token}`;
    }
  }
  return options;
}

/**
 * 响应拦截器
 * @param {Object} response - 响应数据
 * @returns {Object|Promise} 处理后的响应数据或Promise.reject
 */
function responseInterceptor(response) {
  // 这里可以根据后端的响应格式进行统一处理
  const { statusCode, data } = response;
  
  // 请求成功
  if (statusCode >= 200 && statusCode < 300) {
    return data;
  }
  
  // 401: 未授权，token过期或无效
  if (statusCode === 401) {
    // 清除本地token
    uni.removeStorageSync('token');
    // 跳转到登录页
    uni.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none',
      duration: 2000
    });
    
    setTimeout(() => {
      uni.redirectTo({
        url: '/pages/login/login'
      });
    }, 1500);
    
    return Promise.reject(new Error('登录已过期，请重新登录'));
  }
  
  // 其他错误
  uni.showToast({
    title: data.message || '请求失败',
    icon: 'none',
    duration: 2000
  });
  
  return Promise.reject(data);
}

/**
 * 请求函数
 * @param {Object} options - 请求配置
 * @returns {Promise} - 返回Promise对象
 */
function request(options) {
  // 合并请求配置
  const mergedOptions = {
    ...options,
    header: { ...config.header, ...options.header },
    timeout: options.timeout || config.timeout
  };
  
  // 请求拦截
  const interceptedOptions = requestInterceptor(mergedOptions);
  
  // 返回Promise
  return new Promise((resolve, reject) => {
    uni.request({
      ...interceptedOptions,
      success: (res) => {
        try {
          // 响应拦截
          const result = responseInterceptor(res);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络请求失败',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
}

export default request;