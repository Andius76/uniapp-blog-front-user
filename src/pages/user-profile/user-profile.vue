<template>
	<view class="container">
		<!-- 用户信息区域 -->
		<view class="user-info-section">
			<view class="user-header">
				<image class="avatar" :src="userInfo.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
				<view class="user-meta">
					<text class="nickname">{{ userInfo.nickname }}</text>
					<text class="email">{{ userInfo.email }}</text>
				</view>
				<view class="follow-btn" :class="{ 'following': isFollowing }" @click="handleFollow">
					<text>{{ isFollowing ? '已关注' : '关注' }}</text>
				</view>
			</view>

			<!-- 用户统计信息 -->
			<view class="user-stats">
				<view class="stat-item">
					<text class="num">{{ userInfo.postCount || 0 }}</text>
					<text class="label">发表</text>
				</view>
				<view class="stat-item">
					<text class="num">{{ userInfo.followCount || 0 }}</text>
					<text class="label">关注</text>
				</view>
				<view class="stat-item">
					<text class="num">{{ userInfo.followerCount || 0 }}</text>
					<text class="label">粉丝</text>
				</view>
			</view>

			<!-- 用户简介 -->
			<view class="user-bio">
				<text class="bio-text">{{ userInfo.bio || '这个人很懒，什么都没写~' }}</text>
			</view>
		</view>

		<!-- 文章列表标签页 -->
		<view class="tabs">
			<view 
				v-for="(tab, index) in tabs" 
				:key="index"
				class="tab-item"
				:class="{ active: currentTab === index }"
				@click="switchTab(index)"
			>
				<text>{{ tab.name }}</text>
			</view>
		</view>

		<!-- 文章列表 -->
		<scroll-view 
			scroll-y 
			class="article-list"
			@scrolltolower="loadMore"
			refresher-enabled
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
		>
			<view v-if="articles.length > 0">
				<view 
					v-for="(article, index) in articles" 
					:key="index"
					class="article-item"
					@click="viewArticle(article.id)"
				>
					<view class="article-title">{{ article.title }}</view>
					<view class="article-summary">{{ article.summary }}</view>
					<view class="article-meta">
						<text class="time">{{ article.createTime }}</text>
						<view class="stats">
							<view class="stat">
								<uni-icons type="eye" size="14"></uni-icons>
								<text>{{ article.viewCount }}</text>
							</view>
							<view class="stat">
								<uni-icons type="heart" size="14"></uni-icons>
								<text>{{ article.likeCount }}</text>
							</view>
							<view class="stat">
								<uni-icons type="chatbubble" size="14"></uni-icons>
								<text>{{ article.commentCount }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view v-else-if="!isLoading" class="empty-state">
				<uni-icons type="info" size="50" color="#ddd"></uni-icons>
				<text>暂无内容</text>
			</view>

			<!-- 加载状态 -->
			<view class="loading-state" v-if="isLoading">
				<text>加载中...</text>
			</view>
			<view class="loading-state" v-else-if="noMoreData && articles.length > 0">
				<text>没有更多了</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import { ref, reactive, onMounted } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import http from '@/utils/request.js';

	// 页面状态
	const isLoading = ref(false);
	const isRefreshing = ref(false);
	const noMoreData = ref(false);
	const currentPage = ref(1);
	const pageSize = 10;

	// 用户信息
	const userInfo = reactive({
		id: '',
		nickname: '',
		avatar: '',
		email: '',
		bio: '',
		postCount: 0,
		followCount: 0,
		followerCount: 0
	});

	// 关注状态
	const isFollowing = ref(false);

	// 文章列表
	const articles = ref([]);

	// 标签页配置
	const currentTab = ref(0);
	const tabs = [
		{ name: '发表的文章', type: 'posts' },
		{ name: '点赞的文章', type: 'likes' }
	];

	// 加载用户信息
	const loadUserInfo = async (userId) => {
		try {
			const res = await http.get(`/api/user/profile/${userId}`);
			if (res.code === 200) {
				Object.assign(userInfo, res.data);
				isFollowing.value = res.data.isFollowing || false;
			}
		} catch (error) {
			console.error('获取用户信息失败:', error);
			uni.showToast({
				title: '获取用户信息失败',
				icon: 'none'
			});
		}
	};

	// 加载文章列表
	const loadArticles = async () => {
		if (isLoading.value || noMoreData.value) return;
		
		isLoading.value = true;
		try {
			const type = tabs[currentTab.value].type;
			const res = await http.get(`/api/user/${userInfo.id}/articles`, {
				type,
				page: currentPage.value,
				pageSize
			});

			if (res.code === 200) {
				const { list, total } = res.data;
				
				if (currentPage.value === 1) {
					articles.value = list;
				} else {
					articles.value.push(...list);
				}

				noMoreData.value = articles.value.length >= total;
				currentPage.value++;
			}
		} catch (error) {
			console.error('获取文章列表失败:', error);
			uni.showToast({
				title: '获取文章列表失败',
				icon: 'none'
			});
		} finally {
			isLoading.value = false;
			isRefreshing.value = false;
		}
	};

	// 处理关注/取消关注
	const handleFollow = async () => {
		try {
			const action = isFollowing.value ? 'unfollow' : 'follow';
			const res = await http[action === 'follow' ? 'post' : 'delete'](`/api/user/follow/${userInfo.id}`);
			
			if (res.code === 200) {
				isFollowing.value = !isFollowing.value;
				userInfo.followerCount += isFollowing.value ? 1 : -1;
				
				uni.showToast({
					title: isFollowing.value ? '关注成功' : '已取消关注',
					icon: isFollowing.value ? 'success' : 'none'
				});
			}
		} catch (error) {
			console.error('操作失败:', error);
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			});
		}
	};

	// 切换标签页
	const switchTab = (index) => {
		if (currentTab.value === index) return;
		currentTab.value = index;
		currentPage.value = 1;
		noMoreData.value = false;
		articles.value = [];
		loadArticles();
	};

	// 查看文章详情
	const viewArticle = (articleId) => {
		uni.navigateTo({
			url: `/pages/article-detail/article-detail?id=${articleId}`
		});
	};

	// 加载更多
	const loadMore = () => {
		if (!noMoreData.value) {
			loadArticles();
		}
	};

	// 刷新
	const onRefresh = () => {
		isRefreshing.value = true;
		currentPage.value = 1;
		noMoreData.value = false;
		loadArticles();
	};

	// 页面加载
	onLoad((options) => {
		if (options.id) {
			userInfo.id = options.id;
			loadUserInfo(options.id);
			loadArticles();
		} else {
			uni.showToast({
				title: '用户ID不存在',
				icon: 'none'
			});
		}
	});
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
	}

	.user-info-section {
		background-color: #fff;
		padding: 30rpx;
		margin-bottom: 20rpx;

		.user-header {
			display: flex;
			align-items: center;

			.avatar {
				width: 120rpx;
				height: 120rpx;
				border-radius: 50%;
				margin-right: 20rpx;
				background-color: #eee;
			}

			.user-meta {
				flex: 1;

				.nickname {
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 8rpx;
					display: block;
				}

				.email {
					font-size: 24rpx;
					color: #999;
					display: block;
				}
			}

			.follow-btn {
				padding: 12rpx 30rpx;
				border-radius: 30rpx;
				background-color: #4361ee;
				color: #fff;
				font-size: 28rpx;

				&.following {
					background-color: #f5f5f5;
					color: #666;
					border: 1rpx solid #ddd;
				}
			}
		}

		.user-stats {
			display: flex;
			justify-content: space-around;
			margin-top: 30rpx;
			padding: 20rpx 0;
			border-top: 1rpx solid #f0f0f0;

			.stat-item {
				text-align: center;

				.num {
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					display: block;
				}

				.label {
					font-size: 24rpx;
					color: #999;
					margin-top: 8rpx;
					display: block;
				}
			}
		}

		.user-bio {
			margin-top: 20rpx;
			padding-top: 20rpx;
			border-top: 1rpx solid #f0f0f0;

			.bio-text {
				font-size: 28rpx;
				color: #666;
				line-height: 1.5;
			}
		}
	}

	.tabs {
		display: flex;
		background-color: #fff;
		padding: 0 30rpx;
		margin-bottom: 20rpx;

		.tab-item {
			position: relative;
			padding: 20rpx 30rpx;
			margin: 0 20rpx;

			&.active {
				color: #4361ee;
				font-weight: bold;

				&::after {
					content: '';
					position: absolute;
					bottom: 0;
					left: 50%;
					transform: translateX(-50%);
					width: 40rpx;
					height: 4rpx;
					background-color: #4361ee;
					border-radius: 2rpx;
				}
			}
		}
	}

	.article-list {
		height: calc(100vh - 400rpx);
		padding: 0 30rpx;

		.article-item {
			background-color: #fff;
			padding: 30rpx;
			margin-bottom: 20rpx;
			border-radius: 12rpx;

			.article-title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 16rpx;
			}

			.article-summary {
				font-size: 28rpx;
				color: #666;
				line-height: 1.5;
				margin-bottom: 20rpx;
			}

			.article-meta {
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-size: 24rpx;
				color: #999;

				.time {
					flex: 1;
				}

				.stats {
					display: flex;
					gap: 20rpx;

					.stat {
						display: flex;
						align-items: center;
						gap: 4rpx;
					}
				}
			}
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;

		text {
			font-size: 28rpx;
			color: #999;
			margin-top: 20rpx;
		}
	}

	.loading-state {
		text-align: center;
		padding: 20rpx 0;
		color: #999;
		font-size: 24rpx;
	}
</style>