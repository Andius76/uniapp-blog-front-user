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
 * 用于显示网站底部的ICP备案号
 */
const openBeianPage = () => {
	// 在非H5环境中，通过API打开外部链接
	plus.runtime.openURL('https://beian.miit.gov.cn/');
}
</script>

<style>
.icp-footer {
	width: 100%;
	padding: 15px 0;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: #f7f7f7;
	margin-top: 20px;
	border-top: 1px solid #eee;
}

.icp-container {
	text-align: center;
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
</style> 