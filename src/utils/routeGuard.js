/**
 * 路由守卫 - 处理页面访问权限
 * 文件位置: /src/utils/routeGuard.js
 */

import { checkUserStatus } from '@/api/auth';

// 定义无需登录即可访问的页面路径
const whiteList = [
  '/pages/login/login', 
  '/pages/register/register',
  '/pages/forget-password/forget-password',
  '/pages/index/index',
];

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
function isLoggedIn() {
  return !!uni.getStorageSync('token');
}

/**
 * 获取当前页面路径
 * @param {Object} options - 页面参数
 * @returns {string} 页面路径
 */
function getCurrentPagePath(options) {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  let path = `/${currentPage.route}`;
  
  // 处理页面参数
  if (options && Object.keys(options).length > 0) {
    const queryParams = Object.keys(options)
      .map(key => `${key}=${options[key]}`)
      .join('&');
    path += `?${queryParams}`;
  }
  
  return path;
}

/**
 * 检查用户账号状态
 * 如果用户被封禁(status=0)，则强制退出登录
 * @returns {Promise<boolean>} 用户状态是否正常
 */
function checkUserAccountStatus() {
  // 如果未登录，不需要检查状态
  if (!isLoggedIn()) {
    return Promise.resolve(true);
  }
  
  return new Promise((resolve) => {
    checkUserStatus()
      .then(res => {
        // 记录检查结果
        console.log('检查用户状态结果:', res);
        
        if (res.code === 200 && res.data) {
          // 如果状态为0（被封禁）
          if (res.data.status === 0) {
            console.warn('检测到用户账号已被封禁，执行强制登出');
            
            // 清除登录信息
            uni.removeStorageSync('token');
            uni.removeStorageSync('userInfo');
            
            // 显示提示
            uni.showModal({
              title: '账号已被封禁',
              content: '您的账号已被管理员封禁，无法继续使用',
              showCancel: false,
              success: () => {
                // 跳转到登录页
                uni.reLaunch({
                  url: '/pages/login/login'
                });
              }
            });
            
            resolve(false);
          } else {
            // 用户状态正常
            resolve(true);
          }
        } else {
          // 无法获取用户状态，假设正常
          resolve(true);
        }
      })
      .catch(err => {
        console.error('检查用户状态失败:', err);
        // 出错时不进行强制登出
        resolve(true);
      });
  });
}

/**
 * 路由守卫方法，在页面onLoad时调用
 * @param {Object} options - 页面参数
 */
function routeGuard(options) {
  const currentPath = getCurrentPagePath(options);
  
  // 是否在白名单中
  const isWhitelisted = whiteList.some(path => currentPath.startsWith(path));
  
  // 如果不在白名单中且未登录，则跳转到登录页
  if (!isWhitelisted && !isLoggedIn()) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 1500
    });
    
    // 记录当前页面，以便登录后返回
    const redirectUrl = encodeURIComponent(currentPath);
    
    // 延迟跳转，确保提示显示
    setTimeout(() => {
      uni.redirectTo({
        url: `/pages/login/login?redirect=${redirectUrl}`
      });
    }, 1500);
    
    return false;
  }
  
  // 如果已登录且不在白名单中，检查用户状态
  if (isLoggedIn() && !isWhitelisted) {
    // 异步检查用户状态
    checkUserAccountStatus();
  }
  
  return true;
}

// 导出所有有用的函数
export {
  isLoggedIn,
  getCurrentPagePath,
  checkUserAccountStatus
};

export default routeGuard;
