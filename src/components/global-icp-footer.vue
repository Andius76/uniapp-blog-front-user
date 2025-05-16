<template>
  <view class="global-icp-footer" v-if="showFooter">
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
 * 在H5环境中自动显示在页面底部
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
      showFooter: false
    }
  },
  created() {
    // #ifdef H5
    this.showFooter = this.show;
    // #endif
  },
  methods: {
    // 非H5环境下打开备案链接
    openBeianPage() {
      // #ifdef APP-PLUS
      plus.runtime.openURL('https://beian.miit.gov.cn/');
      // #endif
      
      // #ifdef MP
      uni.showModal({
        title: '提示',
        content: '备案号：鄂ICP备2025113077号-1',
        showCancel: false
      });
      // #endif
    }
  }
}
</script>

<style>
/* 样式在App.vue中全局定义 */
</style> 