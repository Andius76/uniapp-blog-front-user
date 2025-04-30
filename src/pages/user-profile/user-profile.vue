<template>
	<view class="container">
		<!-- 顶部用户信息区域 -->
		<view class="user-top-container">
			<!-- 用户信息区域内容 -->
			<view class="user-header">
				<view class="user-info">
					<image class="avatar" :src="userInfo.avatar || '/static/images/avatar.png'" mode="aspectFill">
					</image>
					<text class="nickname">{{ userInfo.nickname }}</text>
				</view>
				<view class="user-actions">
					<view class="follow-btn" :class="{ 'following': isFollowing }" @click="toggleFollow">
						<text>{{ isFollowing ? '已关注' : '+ 关注' }}</text>
					</view>
				</view>
			</view>

			<!-- 用户数据统计区域 -->
			<view class="user-stats">
				<view class="stat-item" @click="navigateTo(`/pages/follows/follows?id=${userId}`)">
					<text class="stat-num">{{ userInfo.followCount }}</text>
					<text class="stat-label">关注</text>
				</view>
				<view class="stat-divider">|</view>
				<view class="stat-item" @click="navigateTo(`/pages/followers/followers?id=${userId}`)">
					<text class="stat-num">{{ userInfo.followerCount }}</text>
					<text class="stat-label">被关注</text>
				</view>
				<view class="stat-divider">|</view>
				<view class="stat-item">
					<text class="stat-num">{{ userInfo.postCount }}</text>
					<text class="stat-label">发表</text>
				</view>
			</view>

			<!-- 个人简介区域 -->
			<view class="user-bio">
				<view class="bio-content">
					<uni-icons type="person" size="20" color="#666"></uni-icons>
					<text class="bio-text">个人简介：{{ userInfo.bio }}</text>
				</view>
			</view>

			<!-- 标签页导航 -->
			<view class="nav-menu">
				<view v-for="(tab, index) in tabs" :key="index" class="nav-item"
					:class="{ active: currentTab === index }" @click="switchTab(index)">
					{{ tab.name }}
				</view>
			</view>
		</view>

		<!-- 内容区域 -->
		<view class="content-area">
			<scroll-view scroll-y class="article-list" @scrolltolower="loadMore" refresher-enabled
				:refresher-triggered="isRefreshing" @refresherrefresh="refreshList" :refresher-threshold="100">
				<!-- 文章列表 -->
				<view v-for="(post, index) in contentList" :key="index" class="article-card">
					<!-- 用户信息 -->
					<view class="user-info">
						<image class="avatar" :src="userInfo.avatar || '/static/images/avatar.png'" mode="aspectFill">
						</image>
						<text class="nickname">{{ userInfo.nickname }}</text>
					</view>

					<!-- 文章内容 -->
					<view class="article-content" @click="viewPostDetail(post.id)">
						<text class="article-title">{{ post.title }}</text>
						<text class="article-summary">{{ post.summary }}...全文</text>

						<!-- 文章图片 -->
						<view class="article-image" v-if="post.image">
							<image :src="post.image" mode="aspectFill" class="single-image"></image>
						</view>
					</view>

					<!-- 文章操作按钮 -->
					<view class="article-actions">
						<view class="action-item" @click="handleComment(index)">
							<uni-icons type="chatbubble" size="20" color="#666"></uni-icons>
							<text>{{ post.commentCount }}</text>
						</view>
						<view class="action-item" @click="handleCollect(index)">
							<uni-icons :type="post.isCollected ? 'star-filled' : 'star'" size="20"
								:color="post.isCollected ? '#ffc107' : '#666'"></uni-icons>
							<text :class="{'collected': post.isCollected}">{{ post.collectCount }}</text>
						</view>
						<view class="action-item" @click="handleLike(index)">
							<uni-icons :type="post.isLiked ? 'heart-filled' : 'heart'" size="20"
								:color="post.isLiked ? '#ff6b6b' : '#666'"></uni-icons>
							<text :class="{'liked': post.isLiked}">{{ post.likeCount }}</text>
						</view>
					</view>
				</view>

				<!-- 无内容提示 -->
				<view v-if="contentList.length === 0" class="no-content">
					<uni-icons type="info" size="50" color="#ddd"></uni-icons>
					<text>暂无内容</text>
				</view>

				<!-- 加载状态 -->
				<view class="loading-state">
					<text v-if="isLoading">加载中...</text>
					<text v-else-if="noMoreData && contentList.length > 0">没有更多内容了</text>
					<text v-else>↓向下滑动加载更多内容↓</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script setup>
	import {
		reactive,
		ref,
		onMounted,
		toRefs
	} from 'vue';
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';

	// 获取页面参数
	const props = defineProps({
		id: {
			type: String,
			default: ''
		}
	});

	// 用户ID
	const userId = ref('');

	// 是否已关注
	const isFollowing = ref(false);

	// 当前选中的选项卡
	const currentTab = ref(0);

	// 数据加载状态
	const isLoading = ref(false);
	const noMoreData = ref(false);
	const currentPage = ref(1);
	const pageSize = 5;
	const isRefreshing = ref(false);

	// 标签页数据
	const tabs = reactive([{
			name: '发表的文章',
			type: 'posts'
		},
		{
			name: '点赞的文章',
			type: 'likes'
		}
	]);

	// 用户信息
	const userInfo = reactive({
		nickname: '加载中...',
		avatar: '/static/images/avatar.png',
		followCount: 0,
		followerCount: 0,
		postCount: 0,
		bio: '该用户暂无简介'
	});

	// 文章列表
	const contentList = ref([]);

	// 模拟用户数据
	const mockUsers = {
		'user_001': {
			nickname: '前端达人',
			avatar: '/static/images/avatar.png',
			followCount: 120,
			followerCount: 358,
			postCount: 45,
			bio: '专注前端技术分享，擅长Vue.js和React',
			isFollowing: true
		},
		'user_002': {
			nickname: 'Vue学习者',
			avatar: '/static/images/avatar.png',
			followCount: 85,
			followerCount: 42,
			postCount: 12,
			bio: '正在学习Vue3和TypeScript，分享学习心得',
			isFollowing: false
		},
		'user_003': {
			nickname: '前端工程师',
			avatar: '/static/images/avatar.png',
			followCount: 256,
			followerCount: 189,
			postCount: 67,
			bio: '全栈开发工程师，喜欢分享实用技术和解决方案',
			isFollowing: false
		},
		'user_004': {
			nickname: '区块链开发者',
			avatar: '/static/images/avatar.png',
			followCount: 56,
			followerCount: 98,
			postCount: 23,
			bio: '专注Web3和区块链应用开发，分享最新技术趋势',
			isFollowing: true
		},
		'user_007': {
			nickname: '前端学习者',
			avatar: '/static/images/avatar.png',
			followCount: 35,
			followerCount: 15,
			postCount: 5,
			bio: '正在学习前端开发，记录学习历程',
			isFollowing: false
		}
	};

	// 模拟文章数据
	const mockPosts = {
		'user_001': [{
				id: 101,
				title: 'Vue3性能优化实践',
				summary: '分享Vue3项目中常用的性能优化技巧，包括组件懒加载、状态管理优化等方法',
				image: '/static/images/default.png',
				commentCount: 45,
				collectCount: 78,
				likeCount: 156,
				isCollected: false,
				isLiked: true
			},
			{
				id: 102,
				title: 'CSS Grid布局完全指南',
				summary: '详细介绍CSS Grid布局的基本概念、属性和实战案例，帮助你掌握现代网页布局技术',
				image: '/static/images/default.png',
				commentCount: 32,
				collectCount: 56,
				likeCount: 98,
				isCollected: true,
				isLiked: false
			}
		],
		'user_002': [{
			id: 201,
			title: 'Vue3组合式API实战',
			summary: '通过实际项目案例，讲解Vue3组合式API的使用方法和最佳实践',
			image: '/static/images/default.png',
			commentCount: 18,
			collectCount: 25,
			likeCount: 42,
			isCollected: false,
			isLiked: false
		}],
		'user_003': [{
				id: 301,
				title: 'JavaScript设计模式与实践',
				summary: '深入讲解常用JavaScript设计模式，并结合实际项目案例分析其应用场景',
				image: '/static/images/default.png',
				commentCount: 36,
				collectCount: 47,
				likeCount: 89,
				isCollected: false,
				isLiked: true
			},
			{
				id: 302,
				title: 'Node.js微服务架构实践',
				summary: '分享如何使用Node.js构建可扩展的微服务架构，包括服务发现、负载均衡等核心概念',
				image: '/static/images/default.png',
				commentCount: 28,
				collectCount: 39,
				likeCount: 67,
				isCollected: true,
				isLiked: false
			}
		],
		'user_004': [{
			id: 401,
			title: 'Web3入门：区块链应用开发基础',
			summary: '介绍Web3开发的基本概念、工具和环境搭建，帮助传统Web开发者快速入门区块链应用开发',
			image: '/static/images/default.png',
			commentCount: 24,
			collectCount: 35,
			likeCount: 58,
			isCollected: false,
			isLiked: true
		}],
		'user_007': [{
			id: 701,
			title: '我的前端学习笔记：HTML和CSS基础',
			summary: '记录我学习前端开发的第一步，分享HTML和CSS的基础知识和实践经验',
			image: '/static/images/default.png',
			commentCount: 8,
			collectCount: 12,
			likeCount: 25,
			isCollected: false,
			isLiked: false
		}]
	};

	/**
	 * 页面初始化
	 */
	onMounted(() => {
		// 获取页面参数中的用户ID
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];

		if (currentPage && currentPage.options && currentPage.options.id) {
			userId.value = currentPage.options.id;
		} else if (props.id) {
			userId.value = props.id;
		}

		// 加载用户信息
		loadUserInfo();

		// 加载用户发表的文章
		loadContent();
	});

	/**
	 * 加载用户信息
	 */
	const loadUserInfo = () => {
		// 显示加载提示
		uni.showLoading({
			title: '加载中...'
		});

		// 模拟API请求延迟
		setTimeout(() => {
			// 使用模拟数据
			if (mockUsers[userId.value]) {
				const userData = mockUsers[userId.value];
				Object.assign(userInfo, userData);
				isFollowing.value = userData.isFollowing;
			} else {
				// 用户不存在，显示默认信息
				userInfo.nickname = '未知用户';
				userInfo.bio = '该用户不存在或已注销';
			}

			// 隐藏加载提示
			uni.hideLoading();
		}, 500);

		// TODO: 实际API调用
		// api.getUserInfo(userId.value).then(res => {
		//   Object.assign(userInfo, res.data);
		//   isFollowing.value = res.data.isFollowing;
		// }).catch(err => {
		//   console.error('获取用户信息失败', err);
		//   uni.showToast({
		//     title: '获取用户信息失败',
		//     icon: 'none'
		//   });
		// }).finally(() => {
		//   uni.hideLoading();
		// });
	};

	/**
	 * 切换关注状态
	 */
	const toggleFollow = () => {
		isFollowing.value = !isFollowing.value;

		// 更新用户关注状态
		if (isFollowing.value) {
			userInfo.followerCount++;
			uni.showToast({
				title: `已关注 ${userInfo.nickname}`,
				icon: 'success'
			});
		} else {
			userInfo.followerCount--;
			uni.showToast({
				title: `已取消关注`,
				icon: 'none'
			});
		}

		// TODO: 实际API调用
		// api.followUser(userId.value, isFollowing.value).then(res => {
		//   console.log('关注状态更新成功');
		// }).catch(err => {
		//   console.error('更新关注状态失败', err);
		//   // 恢复原状态
		//   isFollowing.value = !isFollowing.value;
		//   userInfo.followerCount = isFollowing.value ? userInfo.followerCount + 1 : userInfo.followerCount - 1;
		// });
	};

	/**
	 * 加载内容列表
	 */
	const loadContent = () => {
		// 如果已经没有更多数据或正在加载中，则不处理
		if (noMoreData.value || isLoading.value) return;

		isLoading.value = true;

		// 模拟API请求延迟
		setTimeout(() => {
			const tabType = tabs[currentTab.value].type;
			let contentSource = [];

			// 获取对应用户的文章数据
			if (tabType === 'posts' && mockPosts[userId.value]) {
				contentSource = mockPosts[userId.value];
			} else if (tabType === 'likes') {
				// 模拟用户点赞的文章，这里简单返回其他用户的文章
				const otherUsers = Object.keys(mockPosts).filter(id => id !== userId.value);
				contentSource = otherUsers.reduce((acc, id) => {
					// 随机选择一些文章作为用户点赞的内容
					const randomPosts = mockPosts[id].filter(() => Math.random() > 0.5);
					return [...acc, ...randomPosts];
				}, []);
			}

			// 计算本次应加载的内容数据
			const startIndex = (currentPage.value - 1) * pageSize;
			const endIndex = startIndex + pageSize;

			// 获取当前页的数据
			const pageData = contentSource.slice(startIndex, endIndex);

			// 如果没有获取到数据，说明已经没有更多数据了
			if (pageData.length === 0) {
				noMoreData.value = true;
				isLoading.value = false;

				// 如果是刷新状态，结束刷新
				if (isRefreshing.value) {
					isRefreshing.value = false;
				}
				return;
			}

			// 添加到内容列表
			if (currentPage.value === 1) {
				contentList.value = [...pageData];
			} else {
				contentList.value.push(...pageData);
			}

			// 更新页码
			currentPage.value++;

			// 如果获取的数据不足一页，也标记为没有更多数据
			if (pageData.length < pageSize) {
				noMoreData.value = true;
			}

			isLoading.value = false;

			// 如果是刷新状态，结束刷新
			if (isRefreshing.value) {
				isRefreshing.value = false;
			}
		}, 800);

		// TODO: 替换为实际API调用
		// api.getUserContent({
		//   userId: userId.value,
		//   type: tabs[currentTab.value].type,
		//   page: currentPage.value,
		//   pageSize: pageSize
		// }).then(res => {
		//   // 处理响应数据
		// }).catch(err => {
		//   console.error('获取用户内容失败', err);
		// }).finally(() => {
		//   isLoading.value = false;
		//   if (isRefreshing.value) isRefreshing.value = false;
		// });
	};

	/**
	 * 刷新列表
	 */
	const refreshList = () => {
		// 如果已经在刷新或加载中，则不处理
		if (isRefreshing.value || isLoading.value) return;

		// 设置刷新状态
		isRefreshing.value = true;

		// 重置数据
		contentList.value = [];
		currentPage.value = 1;
		noMoreData.value = false;

		// 重新加载
		loadContent();
	};

	/**
	 * 加载更多
	 */
	const loadMore = () => {
		if (!noMoreData.value) {
			loadContent();
		}
	};

	/**
	 * 切换选项卡
	 * @param {Number} index - 选项卡索引
	 */
	const switchTab = (index) => {
		if (currentTab.value === index) return;

		currentTab.value = index;

		// 重置列表数据
		contentList.value = [];
		currentPage.value = 1;
		noMoreData.value = false;

		// 显示加载提示
		uni.showLoading({
			title: '加载中...'
		});

		// 加载新选项卡的内容
		loadContent();

		// 隐藏加载提示
		setTimeout(() => {
			uni.hideLoading();
		}, 500);
	};

	/**
	 * 查看文章详情
	 * @param {Number} id - 文章ID
	 */
	const viewPostDetail = (id) => {
		navigateTo(`/pages/article-detail/article-detail?id=${id}`);
	};

	/**
	 * 处理收藏
	 * @param {Number} index - 内容索引
	 */
	const handleCollect = (index) => {
		const post = contentList.value[index];
		post.isCollected = !post.isCollected;
		post.collectCount += post.isCollected ? 1 : -1;

		uni.showToast({
			title: post.isCollected ? '收藏成功' : '已取消收藏',
			icon: post.isCollected ? 'success' : 'none'
		});

		// TODO: 实际收藏API调用
		// api.collectArticle(post.id, post.isCollected).then(res => {
		//   console.log('收藏状态已更新');
		// });
	};

	/**
	 * 处理评论
	 * @param {Number} index - 内容索引
	 */
	const handleComment = (index) => {
		const postId = contentList.value[index].id;
		navigateTo(`/pages/article-detail/article-detail?id=${postId}&showComments=true`);
	};

	/**
	 * 处理点赞
	 * @param {Number} index - 内容索引
	 */
	const handleLike = (index) => {
		const post = contentList.value[index];
		post.isLiked = !post.isLiked;
		post.likeCount += post.isLiked ? 1 : -1;

		uni.showToast({
			title: post.isLiked ? '点赞成功' : '已取消点赞',
			icon: post.isLiked ? 'success' : 'none'
		});

		// TODO: 实际点赞API调用
		// api.likeArticle(post.id, post.isLiked).then(res => {
		//   console.log('点赞状态已更新');
		// });
	};

	/**
	 * 页面导航
	 * @param {String} url - 导航地址
	 */
	const navigateTo = (url) => {
		// 检查页面是否存在，这里只是模拟
		if (url.includes('follows')) {
			uni.showToast({
				title: '查看用户关注列表',
				icon: 'none'
			});
			return;
		} else if (url.includes('followers')) {
			uni.showToast({
				title: '查看用户粉丝列表',
				icon: 'none'
			});
			return;
		} else if (url.includes('article-detail')) {
			uni.showToast({
				title: '查看文章详情: ' + url.split('=')[1].split('&')[0],
				icon: 'none'
			});
			return;
		}

		// 实际跳转，当后端连接后使用
		// uni.navigateTo({ url });
	};
</script>

<style lang="scss">
	page {
		background-color: #f5f5f5;
		min-height: 100%;
	}

	.container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		position: relative;
	}

	.user-top-container {
		position: sticky;
		top: 0;
		z-index: 100;
		background: #f5f5f5;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);

		.user-header,
		.user-stats,
		.user-bio,
		.nav-menu {
			background: #fff;
			margin-top: 2rpx;
			padding: 0 30rpx;
		}
	}

	// 用户头部信息
	.user-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		background-color: #fff;

		.user-info {
			display: flex;
			align-items: center;

			.avatar {
				width: 120rpx;
				height: 120rpx;
				border-radius: 50%;
				margin-right: 20rpx;
				background-color: #eee;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
			}

			.nickname {
				font-size: 34rpx;
				font-weight: bold;
				color: #333;
			}
		}

		.user-actions {
			display: flex;
			align-items: center;

			.follow-btn {
				display: flex;
				align-items: center;
				justify-content: center;
				background-color: #4361ee;
				color: #fff;
				font-size: 28rpx;
				padding: 12rpx 40rpx;
				border-radius: 30rpx;
				transition: all 0.3s ease;

				&.following {
					background-color: #f5f5f5;
					color: #666;
					border: 1rpx solid #ddd;
				}

				&:active {
					transform: scale(0.95);
				}
			}
		}
	}

	// 用户统计数据
	.user-stats {
		display: flex;
		justify-content: space-around;
		padding: 20rpx 0;
		background-color: #fff;
		border-top: 1rpx solid #f0f0f0;

		.stat-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 10rpx 30rpx;
			position: relative;

			.stat-num {
				font-size: 32rpx;
				color: #333;
				font-weight: 500;
			}

			.stat-label {
				font-size: 24rpx;
				color: #666;
				margin-top: 6rpx;
			}
		}

		.stat-divider {
			color: #eee;
			font-size: 24rpx;
			align-self: center;
		}
	}

	// 个人简介
	.user-bio {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 20rpx 30rpx;
		background-color: #fff;
		margin-top: 2rpx;

		.bio-content {
			display: flex;
			align-items: flex-start;
			flex: 1;

			.bio-text {
				font-size: 26rpx;
				color: #666;
				margin-left: 10rpx;
				line-height: 1.6;
				word-break: break-all;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
			}
		}
	}

	// 导航菜单
	.nav-menu {
		display: flex;
		padding: 10rpx 30rpx 5rpx;
		background-color: #fff;
		margin-top: 2rpx;
		position: relative;

		.nav-item {
			padding: 15rpx 24rpx;
			margin: 0 15rpx;
			font-size: 30rpx;
			color: #666;
			position: relative;
			transition: all 0.3s ease;

			&.active {
				color: #4361ee;
				font-weight: bold;

				&::after {
					content: '';
					position: absolute;
					bottom: -2rpx;
					left: 50%;
					transform: translateX(-50%);
					width: 30rpx;
					height: 6rpx;
					background-color: #4361ee;
					border-radius: 3rpx;
				}
			}

			&:active {
				opacity: 0.7;
			}
		}
	}

	// 内容区域
	.content-area {
		padding: 20rpx;
		flex: 1;

		.article-list {
			height: calc(100vh - 445rpx);

			// 文章卡片
			.article-card {
				background-color: #fff;
				border-radius: 20rpx;
				padding: 30rpx;
				margin-bottom: 20rpx;
				box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
				transition: transform 0.3s ease;

				&:active {
					transform: scale(0.98);
				}

				// 用户信息
				.user-info {
					display: flex;
					align-items: center;
					margin-bottom: 20rpx;

					.avatar {
						width: 80rpx;
						height: 80rpx;
						border-radius: 50%;
						margin-right: 20rpx;
						background-color: #eee;
						box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
					}

					.nickname {
						flex: 1;
						font-size: 28rpx;
						color: #333;
						font-weight: 500;
					}
				}

				// 文章内容
				.article-content {
					margin-bottom: 20rpx;

					.article-title {
						font-size: 32rpx;
						font-weight: bold;
						color: #333;
						margin-bottom: 10rpx;
						display: block;
					}

					.article-summary {
						font-size: 28rpx;
						color: #666;
						margin-bottom: 20rpx;
						line-height: 1.6;
						display: block;
					}

					// 文章图片
					.article-image {
						width: 100%;
						height: 300rpx;
						border-radius: 12rpx;
						overflow: hidden;
						margin-bottom: 20rpx;
						background-color: #f5f5f5;

						.single-image {
							width: 100%;
							height: 100%;
							object-fit: cover;
							transition: transform 0.3s ease;

							&:hover {
								transform: scale(1.02);
							}
						}
					}
				}

				// 文章操作按钮
				.article-actions {
					display: flex;
					justify-content: space-around;
					border-top: 1rpx solid #f0f0f0;
					padding-top: 20rpx;

					.action-item {
						display: flex;
						align-items: center;
						padding: 10rpx 20rpx;
						transition: all 0.3s ease;

						.uni-icons {
							margin-right: 10rpx;
						}

						text {
							font-size: 24rpx;
							color: #666;

							&.liked {
								color: #ff6b6b;
							}

							&.collected {
								color: #ffc107;
							}
						}

						&:active {
							opacity: 0.7;
						}
					}
				}
			}
		}

		// 无内容提示
		.no-content {
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

		// 加载状态
		.loading-state {
			text-align: center;
			font-size: 24rpx;
			color: #999;
			padding: 20rpx 0;
			margin: 20rpx 0;
		}
	}

	// 全局样式覆盖
	.uni-scroll-view-refresh {
		background-color: #f5f5f5 !important;

		&-inner {
			color: #fff;
			height: 80rpx !important;
		}
	}

	// 响应式样式
	@media screen and (max-width: 375px) {
		.user-header {
			.user-info {
				.avatar {
					width: 100rpx;
					height: 100rpx;
				}

				.nickname {
					font-size: 30rpx;
				}
			}
		}

		.user-stats {
			.stat-item {
				.stat-num {
					font-size: 28rpx;
				}

				.stat-label {
					font-size: 22rpx;
				}
			}
		}
	}
</style>