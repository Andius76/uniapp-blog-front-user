<template>
	<view class="icp-footer">
		<!-- 备案号 -->
		<view class="icp-container">
			<!-- #ifdef H5 -->
			<a href="https://beian.miit.gov.cn/" target="_blank" class="icp-link">鄂ICP备2025113077号-1</a>
			<!-- #endif -->
			
			<!-- #ifndef H5 -->
			<text class="icp-text" @click="openBeianPage">鄂ICP备2025113077号-1</text>
			<!-- #endif -->
		</view>
	</view>
</template>

<script setup>
/**
 * ICP备案底部组件
 * 用于显示网站底部的ICP备案号，只在首页显示
 */
const openBeianPage = () => {
	// 在非H5环境中，通过API打开外部链接
	// #ifdef APP-PLUS
	plus.runtime.openURL('https://beian.miit.gov.cn/');
	// #endif
	
	// #ifdef MP
	uni.setClipboardData({
		data: 'https://beian.miit.gov.cn/',
		success: () => {
			uni.showToast({
				title: '已复制链接，请在浏览器中打开',
				icon: 'none'
			});
		}
	});
	// #endif
}
</script>

<style>
.icp-footer {
	width: 100%;
	padding: 20px 0;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: transparent;
	margin-top: 30px;
	position: relative;
	z-index: 1;
}

.icp-container {
	text-align: center;
	padding: 8px 15px;
	border-radius: 20px;
	background-color: rgba(247, 247, 247, 0.8);
}

.icp-link {
	color: #999;
	font-size: 12px;
	text-decoration: none;
}

.icp-text {
	color: #999;
	font-size: 12px;
}

/* H5环境下的特殊样式 */
/* #ifdef H5 */
.icp-link:hover {
	color: #666;
	text-decoration: underline;
}
/* #endif */

/* 小程序和APP环境下的特殊样式 */
/* #ifndef H5 */
.icp-footer {
	position: fixed;
	bottom: 120rpx;
	left: 0;
	right: 0;
	z-index: 99;
	background-color: transparent;
}

.icp-container {
	background-color: rgba(247, 247, 247, 0.9);
	padding: 10rpx 30rpx;
	border-radius: 40rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}
/* #endif */
</style> 