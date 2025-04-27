<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app';
import routeGuard from '@/utils/routeGuard.js';

// 提供给全局访问
uni.$routeGuard = routeGuard;

// 全局页面拦截
const checkLoginStatus = () => {
  // 检查当前路径是否需要登录
  const pages = getCurrentPages();
  if (pages.length === 0) return;
  
  const currentPage = pages[pages.length - 1];
  const currentPath = `/${currentPage.route}`;
  
  // 应用路由守卫
  routeGuard();
};

onLaunch(() => {
  console.log('App Launch');
});

onShow(() => {
  // 每次切回应用时检查登录状态
  checkLoginStatus();
});
</script>

<style>
@import "@/static/icon/iconfont.css";
</style>