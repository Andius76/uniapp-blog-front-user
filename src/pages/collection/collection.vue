<template>
	<!-- #ifdef H5 -->
	<view class="container">
		<!-- 顶部导航栏，显示"xxx的收藏" -->
		<view class="navbar">
			<view class="navbar-left"></view>
			<view class="navbar-title">{{ userInfo.nickname || '我的' }}的收藏</view>
			<view class="navbar-right"></view>
		</view>
		<view class="article-width-container">
			<view class="content-area">
				<!-- 收藏文章列表，复用article-list组件，listType设为collection -->
				<article-list listType="collection" emptyText="暂无收藏文章" />
			</view>
		</view>
	</view>
	<!-- #endif -->
	<!-- #ifndef H5 -->
	<view>
		<article-list listType="collection" emptyText="暂无收藏文章" />
	</view>
	<!-- #endif -->
</template>

<script setup>
	// 导入文章列表组件
	import ArticleList from '@/components/article-list/article-list.vue'
	import { ref, onMounted } from 'vue'

	// 获取本地存储的用户信息，显示昵称
	const userInfo = ref({ nickname: '' })
	onMounted(() => {
		const localUserInfo = uni.getStorageSync('userInfo')
		if (localUserInfo) {
			userInfo.value.nickname = localUserInfo.nickname || '我的'
		}
	})
</script>

<style lang="scss">
	// 复用my.vue和follows.vue的H5样式
	/* #ifdef H5 */
	.container {
		background-color: #f5f5f5;
		min-height: 100vh;
		min-width: 1000px;
	}
	.navbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 90rpx;
		padding: 0 30rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #f0f0f0;
		position: sticky;
		top: 0;
		z-index: 100;
		.navbar-left,
		.navbar-right {
			width: 60rpx;
			display: flex;
			align-items: center;
		}
		.navbar-title {
			font-size: 34rpx;
			font-weight: bold;
			color: #333;
		}
	}
	.article-width-container {
		min-width: 600px;
		width: 100%;
		max-width: 700px;
		margin: 0 auto;
		padding: 10px 20px 20px;
		box-sizing: border-box;
		background-color: #fff;
		border-radius: 4px;
		min-height: 200px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
		margin-top: 0;
	}
	.content-area {
		padding: 0;
		width: 100%;
		box-sizing: border-box;
		overflow-y: auto;
	}
	/* #endif */
</style>
