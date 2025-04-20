<template>
	<view class="container">
		<!-- 固定在顶部的用户信息和标签导航 -->
		<view class="header-fixed">
			<!-- 顶部用户信息区域 -->
			<view class="user-header">
				<view class="user-info">
					<image class="avatar" :src="data.userInfo.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
					<text class="nickname">{{ data.userInfo.nickname }}</text>
				</view>
				<view class="user-actions">
					<view class="action-btn" @click="navigateTo('/pages/creation-center/creation-center')">
						创作中心
					</view>
					<view class="settings-btn" @click="navigateTo('/pages/settings/settings')">
						<uni-icons type="gear" size="24" color="#333"></uni-icons>
					</view>
				</view>
			</view>

			<!-- 用户数据统计区域 -->
			<view class="user-stats">
				<view class="stat-item" @click="navigateTo('/pages/follows/follows')">
					<text class="stat-num">{{ data.userInfo.followCount }}</text>
					<text class="stat-label">关注</text>
				</view>
				<view class="stat-divider">|</view>
				<view class="stat-item" @click="navigateTo('/pages/followers/followers')">
					<text class="stat-num">{{ data.userInfo.followerCount }}</text>
					<text class="stat-label">被关注</text>
				</view>
				<view class="stat-divider">|</view>
				<view class="stat-item" @click="navigateTo('/pages/collection/collection')">
					<text class="stat-num">{{ data.userInfo.collectionCount }}</text>
					<text class="stat-label">收藏</text>
				</view>
				<view class="stat-divider">|</view>
				<view class="stat-item" @click="navigateTo('/pages/history/history')">
					<text class="stat-num">{{ data.userInfo.historyCount }}</text>
					<text class="stat-label">最近浏览</text>
				</view>
			</view>

			<!-- 个人简介区域 -->
			<view class="user-bio">
				<view class="bio-content">
					<uni-icons type="person" size="20" color="#666"></uni-icons>
					<text class="bio-text">个人简介：{{ data.userInfo.bio }}</text>
				</view>
				<view class="edit-profile-btn" @click="handleEditProfile">
					编辑资料
				</view>
			</view>

			<!-- 标签页导航，使用首页的导航样式 -->
			<view class="nav-menu">
				<view 
					v-for="(tab, index) in data.tabs" 
					:key="index" 
					class="nav-item" 
					:class="{ active: data.currentTab === index }"
					@click="switchTab(index)"
				>
					{{ tab.name }}
				</view>
			</view>
		</view>

		<!-- 内容区域，使用首页的内容区样式 -->
		<view class="content-area">
			<scroll-view 
				scroll-y 
				class="article-list" 
				@scrolltolower="loadMore" 
				refresher-enabled 
				:refresher-triggered="data.isRefreshing" 
				@refresherrefresh="refreshList"
			>
				<!-- 我的帖子列表，使用首页的文章卡片样式 -->
				<view v-for="(post, index) in data.contentList" :key="index" class="article-card">
					<!-- 用户信息 -->
					<view class="user-info">
						<image class="avatar" :src="post.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
						<text class="nickname">{{ post.author }}</text>
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
				<view v-if="data.contentList.length === 0" class="no-content">
					<uni-icons type="info" size="50" color="#ddd"></uni-icons>
					<text>暂无内容</text>
				</view>
				
				<!-- 加载状态 -->
				<view class="loading-state">
					<text v-if="data.isLoading">加载中...</text>
					<text v-else-if="data.noMoreData && data.contentList.length > 0">没有更多内容了</text>
					<text v-else>↓向下滑动加载更多内容↓</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
// 导入uni-icons组件
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';

// 使用reactive统一管理数据
const data = reactive({
	// 用户信息
	userInfo: {
		nickname: '自己的昵称',
		avatar: '/static/images/avatar.png',
		followCount: 1,
		followerCount: 0,
		collectionCount: 1,
		historyCount: 55,
		bio: '简单介绍一下自己'
	},
	
	// 标签页数据
	tabs: [
		{ name: '我的发表', type: 'posts' },
		{ name: '动态', type: 'activities' },
		{ name: '赞同', type: 'likes' }
	],
	currentTab: 1, // 默认选中"动态"选项卡
	
	// 内容列表数据与状态
	contentList: [],
	isLoading: false,
	noMoreData: false,
	currentPage: 1,
	pageSize: 5,
	isRefreshing: false
});

// 模拟内容数据
const mockContents = {
	posts: [
		{
			id: 1,
			author: '自己的昵称',
			avatar: '/static/images/avatar.png',
			time: '2025-4-20 08:27',
			title: '我发表的文章标题',
			summary: '这是我发表的文章内容，展示了一些技术分享和个人见解...',
			image: '/static/images/default.png',
			collectCount: 8,
			commentCount: 12,
			likeCount: 24,
			isCollected: false,
			isLiked: true
		},
		{
			id: 2,
			author: '自己的昵称',
			avatar: '/static/images/avatar.png',
			time: '2025-4-18 15:42',
			title: '前端学习心得分享',
			summary: '分享我在学习前端过程中的一些心得体会和实用技巧...',
			image: '/static/images/default.png',
			collectCount: 14,
			commentCount: 5,
			likeCount: 36,
			isCollected: true,
			isLiked: true
		}
	],
	activities: [
		{
			id: 3,
			author: '自己的昵称',
			avatar: '/static/images/avatar.png',
			time: '2025-4-20 09:35',
			title: '文章标题',
			summary: '一部分正文...全文',
			image: '/static/images/default.png',
			collectCount: 6,
			commentCount: 8,
			likeCount: 15,
			isCollected: false,
			isLiked: false
		}
	],
	likes: [
		{
			id: 4,
			author: '前端达人',
			avatar: '/static/images/avatar.png',
			time: '2025-4-19 14:22',
			title: 'Vue3新特性解析',
			summary: 'Vue3带来了Composition API、Teleport、Fragments等新特性...',
			image: '/static/images/default.png',
			collectCount: 45,
			commentCount: 38,
			likeCount: 156,
			isCollected: true,
			isLiked: true
		},
		{
			id: 5,
			author: '移动开发专家',
			avatar: '/static/images/avatar.png',
			time: '2025-4-17 10:08',
			title: 'uniapp跨平台开发实战经验分享',
			summary: '使用uniapp开发跨平台应用的实战经验，包括性能优化、组件复用...',
			image: '/static/images/default.png',
			collectCount: 32,
			commentCount: 25,
			likeCount: 98,
			isCollected: false,
			isLiked: true
		}
	]
};

/**
 * 加载内容列表
 */
const loadContent = () => {
	// 如果已经没有更多数据或正在加载中，则不处理
	if (data.noMoreData || data.isLoading) return;
	
	data.isLoading = true;
	
	// 模拟API请求延迟
	setTimeout(() => {
		const tabType = data.tabs[data.currentTab].type;
		const contentSource = mockContents[tabType] || [];
		
		// 计算本次应加载的内容数据
		const startIndex = (data.currentPage - 1) * data.pageSize;
		const endIndex = startIndex + data.pageSize;
		
		// 获取当前页的数据
		const pageData = contentSource.slice(startIndex, endIndex);
		
		// 如果没有获取到数据，说明已经没有更多数据了
		if (pageData.length === 0) {
			data.noMoreData = true;
			data.isLoading = false;
			
			// 如果是刷新状态，结束刷新
			if (data.isRefreshing) {
				data.isRefreshing = false;
			}
			return;
		}
		
		// 添加到内容列表
		if (data.currentPage === 1) {
			data.contentList = [...pageData];
		} else {
			data.contentList.push(...pageData);
		}
		
		// 更新页码
		data.currentPage++;
		
		// 如果获取的数据不足一页，也标记为没有更多数据
		if (pageData.length < data.pageSize) {
			data.noMoreData = true;
		}
		
		data.isLoading = false;
		
		// 如果是刷新状态，结束刷新
		if (data.isRefreshing) {
			data.isRefreshing = false;
		}
	}, 800);
	
	// TODO: 替换为实际API调用
	// api.getContent({
	//   type: data.tabs[data.currentTab].type,
	//   page: data.currentPage,
	//   pageSize: data.pageSize
	// }).then(res => {
	//   // 处理响应数据
	// });
};

/**
 * 刷新列表
 */
const refreshList = () => {
	// 如果已经在刷新或加载中，则不处理
	if (data.isRefreshing || data.isLoading) return;
	
	// 设置刷新状态
	data.isRefreshing = true;
	
	// 重置数据
	data.contentList = [];
	data.currentPage = 1;
	data.noMoreData = false;
	
	// 重新加载
	loadContent();
	
	// 提示用户
	uni.showToast({
		title: '刷新成功',
		icon: 'success',
		duration: 1500
	});
};

/**
 * 加载更多
 */
const loadMore = () => {
	if (!data.noMoreData) {
		loadContent();
	}
};

/**
 * 切换选项卡
 * @param {Number} index - 选项卡索引
 */
const switchTab = (index) => {
	if (data.currentTab === index) return;
	
	data.currentTab = index;
	
	// 重置列表数据
	data.contentList = [];
	data.currentPage = 1;
	data.noMoreData = false;
	
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
 * 查看帖子详情
 * @param {Number} id - 帖子ID
 */
const viewPostDetail = (id) => {
	navigateTo(`/pages/article-detail/article-detail?id=${id}`);
};

/**
 * 处理收藏
 * @param {Number} index - 内容索引
 */
const handleCollect = (index) => {
	const post = data.contentList[index];
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
	const postId = data.contentList[index].id;
	uni.showToast({
		title: '打开评论列表: ID=' + postId,
		icon: 'none'
	});
	
	// TODO: 跳转到评论页面
	// navigateTo(`/pages/comment/comment?id=${postId}`);
};

/**
 * 处理点赞
 * @param {Number} index - 内容索引
 */
const handleLike = (index) => {
	const post = data.contentList[index];
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
 * 处理编辑资料
 */
const handleEditProfile = () => {
	navigateTo('/pages/edit-profile/edit-profile');
};

/**
 * 页面导航
 * @param {String} url - 导航地址
 */
const navigateTo = (url) => {
	// 检查页面是否存在，这里只是模拟
	if (url.includes('creation-center')) {
		uni.showToast({
			title: '进入创作中心',
			icon: 'none'
		});
		return;
	} else if (url.includes('settings')) {
		uni.showToast({
			title: '进入设置页面',
			icon: 'none'
		});
		return;
	} else if (url.includes('follows')) {
		uni.showToast({
			title: '查看我的关注',
			icon: 'none'
		});
		return;
	} else if (url.includes('followers')) {
		uni.showToast({
			title: '查看我的粉丝',
			icon: 'none'
		});
		return;
	} else if (url.includes('collection')) {
		uni.showToast({
			title: '查看我的收藏',
			icon: 'none'
		});
		return;
	} else if (url.includes('history')) {
		uni.showToast({
			title: '查看浏览历史',
			icon: 'none'
		});
		return;
	} else if (url.includes('edit-profile')) {
		uni.showToast({
			title: '编辑个人资料',
			icon: 'none'
		});
		return;
	} else if (url.includes('article-detail')) {
		uni.showToast({
			title: '查看文章详情: ' + url.split('=')[1],
			icon: 'none'
		});
		return;
	}
	
	// 实际跳转，当后端连接后使用
	// uni.navigateTo({ url });
};

// 页面初始化
onMounted(() => {
	// 加载默认选项卡的内容
	loadContent();
	
	// TODO: 获取用户信息
	// api.getUserInfo().then(res => {
	//   data.userInfo = res.data;
	// });
});
</script>

<style lang="scss">
page {
	background-color: #f5f5f5;
	min-height: 100%;
}

.container {
	display: flex;
	flex-direction: column;
	position: relative;
	height: 100vh;
}

// 固定在顶部的用户信息和导航
.header-fixed {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background-color: #f5f5f5;
	z-index: 100;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	
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
			
			.action-btn {
				font-size: 26rpx;
				color: #666;
				margin-right: 30rpx;
			}
			
			.settings-btn {
				display: flex;
				justify-content: center;
				align-items: center;
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
			color: #ddd;
			font-size: 24rpx;
			align-self: center;
		}
	}
	
	// 个人简介
	.user-bio {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: #fff;
		margin-top: 2rpx;
		
		.bio-content {
			display: flex;
			align-items: center;
			
			.bio-text {
				font-size: 26rpx;
				color: #666;
				margin-left: 10rpx;
			}
		}
		
		.edit-profile-btn {
			background-color: #f8f8f8;
			color: #666;
			font-size: 24rpx;
			padding: 10rpx 30rpx;
			border-radius: 30rpx;
			border: 1rpx solid #eee;
		}
	}
	
	// 导航菜单，使用首页的样式
	.nav-menu {
		display: flex;
		padding: 10rpx 30rpx 5rpx;
		background-color: #fff;
		margin-top: 2rpx;
		
		.nav-item {
			padding: 10rpx 24rpx;
			margin: 0 15rpx;
			font-size: 30rpx;
			color: #666;
			position: relative;
			
			&.active {
				color: #4361ee;
				font-weight: bold;
				
				&::after {
					content: '';
					position: absolute;
					bottom: -6rpx;
					left: 50%;
					transform: translateX(-50%);
					width: 30rpx;
					height: 6rpx;
					background-color: #4361ee;
					border-radius: 3rpx;
				}
			}
		}
	}
}

// 内容区域，使用首页的样式
.content-area {
	padding: 20rpx;
	padding-top: 445rpx; // 为固定的header留出空间
	flex: 1;
	
	.article-list {
		height: calc(100vh - 445rpx);
	}
	
	// 文章卡片
	.article-card {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-top: 5rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		
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
				line-height: 1.5;
				display: block;
			}
			
			// 文章图片
			.article-image {
				width: 100%;
				height: 300rpx;
				border-radius: 10rpx;
				overflow: hidden;
				margin-bottom: 20rpx;
				
				.single-image {
					width: 100%;
					height: 100%;
					background-color: #eee;
				}
			}
		}
		
		// 文章操作按钮
		.article-actions {
			display: flex;
			justify-content: space-around;
			border-top: 2rpx solid #f0f0f0;
			padding-top: 20rpx;
			
			.action-item {
				display: flex;
				align-items: center;
				
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
		margin: 20rpx 0;
		padding: 20rpx 0;
	}
}

// 全局样式覆盖
.uni-scroll-view-refresh {
	background-color: #f5f5f5 !important;
	
	&-inner {
		color: #fff;
	}
}

// 响应式样式
@media screen and (max-width: 375px) {
	.header-fixed {
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
}
</style>
