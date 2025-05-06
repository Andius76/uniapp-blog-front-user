<template>
	<view class="h5-navigation" v-if="isH5">
		<!-- 自定义导航内容 -->
		<view class="nav-content">
			<view class="nav-item" v-for="(item, index) in navItems" :key="index" @click="navTo(item.path)"
				:class="{'active': currentPath === item.path}">
				<image :src="currentPath === item.path ? item.selectedIcon : item.icon" mode="aspectFit"></image>
				<text>{{ item.text }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, onShow } from 'vue';

// 是否为H5环境
const isH5 = ref(false);
// #ifdef H5
isH5.value = true;
// #endif

// 当前路径
const currentPath = ref('');

// 导航项目列表
const navItems = [{
		path: '/pages/index/index',
		icon: '/static/tabbar/index-un.png',
		selectedIcon: '/static/tabbar/index.png',
		text: '首页'
	},
	{
		path: '/pages/classification/classification',
		icon: '/static/tabbar/classiz-un.png',
		selectedIcon: '/static/tabbar/classiz.png',
		text: '分类'
	},
	{
		path: '/pages/message/message',
		icon: '/static/tabbar/message-un.png',
		selectedIcon: '/static/tabbar/message.png',
		text: '消息'
	},
	{
		path: '/pages/my/my',
		icon: '/static/tabbar/my-un.png',
		selectedIcon: '/static/tabbar/my.png',
		text: '我的'
	}
];

// 更新当前路径
const updateCurrentPath = () => {
	const pages = getCurrentPages();
	if (pages.length > 0) {
		const currentPage = pages[pages.length - 1];
		currentPath.value = '/' + currentPage.route;
	}
};

// 导航到指定页面
const navTo = (path) => {
	// 如果点击当前页面，不执行操作
	if (currentPath.value === path) return;
	
	console.log('准备跳转到:', path);
	
	// 如果是"我的"页面，使用直接跳转
	if (path === '/pages/my/my') {
		uni.navigateTo({
			url: path,
			success: () => {
				console.log('成功跳转到我的页面');
			},
			fail: (err) => {
				console.error('跳转失败:', err);
			}
		});
		return;
	}
	
	// 其他页面使用switchTab
	uni.switchTab({
		url: path,
		fail: () => {
			uni.navigateTo({
				url: path
			});
		}
	});
};

// 生命周期函数
onMounted(() => {
	updateCurrentPath();
});

// 页面显示时更新路径
uni.onShow(() => {
	updateCurrentPath();
});
</script>

<style scoped>
	/* H5导航栏样式 */
	.h5-navigation {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 50px;
		background-color: #ffffff;
		box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
		z-index: 999;
	}

	.nav-content {
		display: flex;
		justify-content: space-around;
		align-items: center;
		height: 100%;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 25%;
		height: 100%;
	}

	.nav-item image {
		width: 24px;
		height: 24px;
		margin-bottom: 2px;
	}

	.nav-item text {
		font-size: 12px;
		color: #666;
	}

	.nav-item.active text {
		color: #007AFF;
	}
</style>