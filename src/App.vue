<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app';
import routeGuard from '@/utils/routeGuard.js';
import { checkUserAccountStatus } from '@/utils/routeGuard.js';

// 提供给全局访问
uni.$routeGuard = routeGuard;

// 检查初始页面
const checkInitialPage = () => {
  // 获取当前页面路径
  const pages = getCurrentPages();
  if (pages.length === 0) return;
  
  const currentPage = pages[pages.length - 1];
  const currentPath = `/${currentPage.route}`;
  
  // 白名单检查
  const whiteList = [
    '/pages/login/login', 
    '/pages/register/register',
    '/pages/forget-password/forget-password'
  ];
  
  // 如果当前页面不在白名单中且未登录，则重定向到登录页
  if (!whiteList.some(path => currentPath.startsWith(path)) && !uni.getStorageSync('token')) {
    uni.redirectTo({
      url: `/pages/login/login?redirect=${encodeURIComponent(currentPath)}`
    });
  }
};

onLaunch(() => {
  console.log('App Launch');
  // 应用启动时检查用户状态
  if (uni.$checkUserStatus) {
    uni.$checkUserStatus();
  }
});

onShow(() => {
  // 每次切回应用时检查登录状态和当前页面
  checkInitialPage();
  
  // 同时检查用户状态
  if (uni.$checkUserStatus) {
    uni.$checkUserStatus();
  }
});
</script>

<style>
@import "@/static/icon/iconfont.css";

/* H5平台下隐藏底部导航栏 */
/* #ifdef H5 */
uni-tabbar {
  display: none !important;
}

/* 移除tabbar底部空白区域 */
.uni-app--showtabbar uni-page-wrapper::after {
  height: 0 !important;
  display: none !important;
}

/* 移除uni-page-wrapper相关样式 */
uni-page-wrapper {
  height: 100% !important;
  min-height: 100% !important;
}

uni-page-wrapper uni-page {
  min-height: 100% !important;
}

uni-page-wrapper uni-page uni-page-head {
  display: none !important;
}

uni-page-body {
  height: auto !important;
  min-height: 100% !important;
}
/* #endif */

/* 全局弹窗层级修复 */
/* #ifdef H5 */
/* 确保uni弹窗显示在最顶层 */
.uni-popup {
  z-index: 99999 !important;
}

.uni-popup .uni-popup__mask {
  z-index: 99998 !important;
}

.uni-popup .uni-popup__wrapper {
  z-index: 99999 !important;
}

.uni-toast {
  z-index: 100000 !important;
}
/* #endif */
</style>