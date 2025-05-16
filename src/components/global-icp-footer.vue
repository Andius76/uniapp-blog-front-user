<template>
  <view class="global-icp-footer" v-if="showFooter && isIndexPage">
    <!-- H5环境使用a标签，可以点击跳转 -->
    <!-- #ifdef H5 -->
    <a href="https://beian.miit.gov.cn/" target="_blank" class="global-icp-link">鄂ICP备2025113077号-1</a>
    <!-- #endif -->
    
    <!-- 非H5环境使用text标签 -->
    <!-- #ifndef H5 -->
    <text class="global-icp-text" @click="openBeianPage">鄂ICP备2025113077号-1</text>
    <!-- #endif -->
  </view>
</template>

<script>
/**
 * 全局ICP备案组件
 * 只在首页底部中间位置显示
 */
export default {
  name: 'GlobalIcpFooter',
  props: {
    // 是否显示备案信息
    show: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      showFooter: false,
      isIndexPage: false // 只在首页显示
    }
  },
  created() {
    // #ifdef H5
    this.showFooter = this.show;
    // #endif
    
    // 检测当前是否为首页
    this.checkIsIndexPage();
    
    // 监听页面路由变化，只在首页显示
    uni.$on('onHide', this.checkIsIndexPage);
    uni.$on('onShow', this.checkIsIndexPage);
  },
  beforeDestroy() {
    // 移除监听
    uni.$off('onHide', this.checkIsIndexPage);
    uni.$off('onShow', this.checkIsIndexPage);
  },
  methods: {
    // 检查当前是否是首页
    checkIsIndexPage() {
      // 获取当前页面路径
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        const currentPath = currentPage.route;
        
        // 检测是否为首页
        this.isIndexPage = currentPath === 'pages/index/index';
        console.log('ICP备案组件：当前页面', currentPath, '是否首页:', this.isIndexPage);
      }
    },
    // 非H5环境下打开备案链接
    openBeianPage() {
      // #ifdef APP-PLUS
      plus.runtime.openURL('https://beian.miit.gov.cn/');
      // #endif
      
      // #ifdef MP
      uni.setClipboardData({
        data: 'https://beian.miit.gov.cn/',
        success: () => {
          uni.showToast({
            title: '已复制备案链接，请在浏览器中查看',
            icon: 'none'
          });
        }
      });
      // #endif
    }
  }
}
</script>

<style>
.global-icp-footer {
  width: 100%;
  padding: 20px 0;
  text-align: center;
  position: relative;
  z-index: 99;
  margin-top: 20px;
}

/* H5环境下的样式 */
/* #ifdef H5 */
.global-icp-link {
  color: #999;
  font-size: 12px;
  text-decoration: none;
  padding: 8px 15px;
  border-radius: 20px;
  background-color: rgba(247, 247, 247, 0.8);
  transition: all 0.3s;
}

.global-icp-link:hover {
  color: #666;
  background-color: rgba(247, 247, 247, 1);
}
/* #endif */

/* 小程序和APP环境下的样式 */
/* #ifndef H5 */
.global-icp-footer {
  position: fixed;
  bottom: 120rpx;
  left: 0;
  right: 0;
}

.global-icp-text {
  color: #999;
  font-size: 24rpx;
  background-color: rgba(247, 247, 247, 0.9);
  padding: 10rpx 30rpx;
  border-radius: 40rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}
/* #endif */
</style> 