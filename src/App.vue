<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app';
import routeGuard from '@/utils/routeGuard.js';

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
});

onShow(() => {
  // 每次切回应用时检查登录状态和当前页面
  checkInitialPage();
});
</script>

<style>
@import "@/static/icon/iconfont.css";

/* H5平台下隐藏底部导航栏 */
/* #ifdef H5 */
uni-tabbar {
  display: none !important;
}
/* #endif */
</style>