/**
 * 网络请求工具
 */

/**
 * 请求配置
 */
const config = {
  // 基础URL
  baseUrl: '/api/auth',
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
  // 处理请求URL
  if (!options.url.startsWith('http')) {
    options.url = `${config.baseUrl}${options.url}`;
  }

  // 处理请求方法
  options.method = (options.method || 'GET').toUpperCase();

  // 处理请求头
  options.header = { ...config.header, ...options.header };

  // 如果需要携带token且本地有token，则添加到请求头
  if (config.withToken) {
    const token = getToken();
    if (token) {
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
  const { statusCode, data } = response;
  
  // HTTP状态码处理
  if (statusCode >= 200 && statusCode < 300) {
    // 处理业务状态码
    if (data.code === 200) {
      return data;
    } else {
      // 处理业务错误
      uni.showToast({
        title: data.message || '请求失败',
        icon: 'none',
        duration: 2000
      });
      return Promise.reject(data);
    }
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

  // 429: 请求频率限制
  if (statusCode === 429) {
    uni.showToast({
      title: '请求过于频繁，请稍后再试',
      icon: 'none',
      duration: 2000
    });
    return Promise.reject(data);
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

// 请求方法的快捷调用
const http = {
  get(url, data, options = {}) {
    return request({
      url,
      method: 'GET',
      data,
      ...options
    });
  },
  post(url, data, options = {}) {
    return request({
      url,
      method: 'POST',
      data,
      ...options
    });
  },
  put(url, data, options = {}) {
    return request({
      url,
      method: 'PUT',
      data,
      ...options
    });
  },
  delete(url, data, options = {}) {
    return request({
      url,
      method: 'DELETE',
      data,
      ...options
    });
  }
};

export default http;