<template>
	<view class="container">
		<!-- 固定在顶部的标题和搜索栏 -->
		<view class="header-fixed">
			<view class="header-top">
				<view class="search-bar">
					<input type="text" placeholder="请输入搜索内容" v-model="data.searchText" @confirm="handleSearch" />
					<button class="search-btn" @click="handleSearch">搜索</button>
				</view>

				<uni-button 
					type="primary" 
					size="mini"
					class="publish-btn"
					@click="handlePost"
					:style="{ borderRadius: '50rpx', padding: '0 30rpx' }"
				>
					发表
				</uni-button>
			</view>

			<!-- 导航菜单 -->
			<view class="nav-menu">
				<view 
					v-for="(item, index) in data.navItems" 
					:key="index" 
					class="nav-item"
					:class="{ active: data.currentNav === index }" 
					@click="switchNav(index)"
				>
					{{ item.name }}
				</view>
			</view>
		</view>

		<!-- 内容区域，添加上边距为header高度 -->
		<view class="content-area">
			<scroll-view 
				scroll-y 
				class="article-list" 
				@scrolltolower="loadMore" 
				refresher-enabled
				:refresher-triggered="data.isRefreshing" 
				@refresherrefresh="refreshList"
			>
				<!-- 文章列表循环 -->
				<view 
					v-for="(article, index) in data.articleList" 
					:key="index" 
					class="article-card"
				>
					<view class="user-info">
						<image 
							class="avatar" 
							:src="article.author.avatar || '/static/images/avatar.png'"
							mode="aspectFill"
						></image>
						<text class="nickname">{{article.author.nickname}}</text>
						<button 
							class="follow-btn" 
							:class="{'followed': article.author.isFollowed}"
							@click="toggleFollow(index)"
						>
							{{ article.author.isFollowed ? '已关注' : '+ 关注' }}
						</button>
					</view>

					<view class="article-content" @click="viewArticleDetail(article.id)">
						<text class="article-title">{{article.title}}</text>
						<text class="article-summary">{{article.summary}}...全文</text>

						<!-- 单图布局 -->
						<view class="article-image" v-if="article.imageType === 'single'">
							<image :src="article.coverImg" mode="aspectFill" class="single-image"></image>
						</view>

						<!-- 多图布局 -->
						<view class="image-grid" v-else-if="article.imageType === 'multi'">
							<image 
								v-for="(img, imgIndex) in article.images" 
								:key="imgIndex" 
								:src="img"
								mode="aspectFill" 
								class="grid-image"
							></image>
						</view>
					</view>

					<view class="article-actions">
						<view class="action-item" @click="handleShare(index)">
							<image class="action-icon" src="/static/images/share.png"></image>
							<text>分享</text>
						</view>
						<view class="action-item" @click="handleComment(index)">
							<image class="action-icon" src="/static/images/comment.png"></image>
							<text>{{article.commentCount}}</text>
						</view>
						<view class="action-item" @click="handleLike(index)">
							<image 
								class="action-icon"
								:src="article.isLiked ? '/static/images/like-filled.png' : '/static/images/like.png'"
							></image>
							<text :class="{'liked': article.isLiked}">{{article.likeCount}}</text>
						</view>
					</view>
				</view>

				<!-- 加载状态 -->
				<view class="loading-state">
					<text v-if="data.isLoading">加载中...</text>
					<text v-else-if="data.noMoreData">没有更多文章了</text>
					<text v-else>↓向下滑动加载更多文章列表↓</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script setup>
import { reactive, onMounted } from 'vue';

// 使用reactive统一管理数据
const data = reactive({
	// 搜索状态
	searchText: '',
	
	// 文章列表数据与状态
	articleList: [],
	isLoading: false,
	noMoreData: false,
	currentPage: 1,
	pageSize: 5, // 每页5条数据
	isRefreshing: false,
	
	// 导航菜单数据和状态
	navItems: [
		{ name: '关注', type: 'follow' },
		{ name: '推荐', type: 'recommend' },
		{ name: '热榜', type: 'hot' },
		{ name: '最新', type: 'new' }
	],
	currentNav: 1, // 默认选中推荐
});

// 模拟文章数据
const mockArticles = [
	{
		id: 1,
		title: '前端学习路线图 - Vue3新特性解析',
		summary: 'Vue3带来了Composition API、Teleport、Fragments等新特性，本文详细介绍这些新特性的使用方法和优势',
		imageType: 'single',
		coverImg: '/static/images/default.png',
		likeCount: 156,
		commentCount: 38,
		isLiked: false,
		author: {
			nickname: '前端达人',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	},
	{
		id: 2,
		title: 'uniapp跨平台开发实战经验分享',
		summary: '使用uniapp开发跨平台应用的实战经验，包括性能优化、组件复用、条件编译等多个方面的技巧',
		imageType: 'multi',
		images: [
			'/static/images/default.png',
			'/static/images/default.png',
			'/static/images/default.png'
		],
		likeCount: 98,
		commentCount: 25,
		isLiked: false,
		author: {
			nickname: '移动开发专家',
			avatar: '/static/images/avatar.png',
			isFollowed: true
		}
	},
	{
		id: 3,
		title: '如何搭建一个高性能的博客系统',
		summary: '本文介绍了搭建高性能博客系统的技术选型、架构设计以及性能优化策略，适合有一定web开发基础的读者',
		imageType: 'single',
		coverImg: '/static/images/default.png',
		likeCount: 76,
		commentCount: 15,
		isLiked: false,
		author: {
			nickname: '后端工程师',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	},
	{
		id: 4,
		title: '响应式设计与移动优先策略',
		summary: '讨论响应式设计的核心原则和移动优先策略的重要性，以及如何在实际项目中应用这些概念',
		imageType: 'multi',
		images: [
			'/static/images/default.png',
			'/static/images/default.png'
		],
		likeCount: 112,
		commentCount: 28,
		isLiked: false,
		author: {
			nickname: 'UI设计师',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	},
	{
		id: 5,
		title: 'JavaScript性能优化技巧',
		summary: '分享JavaScript代码优化的实用技巧，包括内存管理、DOM操作优化和异步编程模式等方面的内容',
		imageType: 'single',
		coverImg: '/static/images/default.png',
		likeCount: 189,
		commentCount: 42,
		isLiked: false,
		author: {
			nickname: 'JS专家',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	}
];

// 所有文章数据源（模拟）
const allArticles = [
	...mockArticles,
	{
		id: 6,
		title: 'CSS Grid与Flexbox布局详解',
		summary: '比较CSS Grid和Flexbox两种现代布局方式的特点和使用场景，帮助开发者选择合适的布局方案',
		imageType: 'multi',
		images: [
			'/static/images/default.png',
			'/static/images/default.png',
			'/static/images/default.png'
		],
		likeCount: 145,
		commentCount: 32,
		isLiked: false,
		author: {
			nickname: 'CSS大师',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	},
	{
		id: 7,
		title: '微信小程序开发技巧总结',
		summary: '总结微信小程序开发中的常见问题和解决方案，包括性能优化、组件复用和API调用等方面',
		imageType: 'single',
		coverImg: '/static/images/default.png',
		likeCount: 201,
		commentCount: 47,
		isLiked: false,
		author: {
			nickname: '小程序开发者',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	},
	{
		id: 8,
		title: 'TypeScript高级类型应用',
		summary: '深入解析TypeScript中的高级类型特性，如交叉类型、联合类型、映射类型和条件类型等，提升代码的类型安全性',
		imageType: 'single',
		coverImg: '/static/images/default.png',
		likeCount: 132,
		commentCount: 29,
		isLiked: false,
		author: {
			nickname: 'TS爱好者',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	},
	{
		id: 9,
		title: 'Web安全防护最佳实践',
		summary: '介绍Web应用中常见的安全漏洞和对应的防护措施，包括XSS、CSRF、SQL注入等方面的内容',
		imageType: 'multi',
		images: [
			'/static/images/default.png',
			'/static/images/default.png'
		],
		likeCount: 178,
		commentCount: 39,
		isLiked: false,
		author: {
			nickname: '安全工程师',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	},
	{
		id: 10,
		title: 'Node.js后端开发实战',
		summary: '分享使用Node.js进行后端开发的实战经验，包括Express框架使用、数据库交互和API设计等方面',
		imageType: 'single',
		coverImg: '/static/images/default.png',
		likeCount: 165,
		commentCount: 36,
		isLiked: false,
		author: {
			nickname: 'Node全栈',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	}
];

// 页面初始化
onMounted(() => {
	// 初始加载文章列表
	loadArticles();
	
	// TODO: 后续添加实际API调用，如获取用户信息、获取文章列表等
});

/**
 * 加载文章列表
 * TODO: 实际项目中应替换为API调用
 */
const loadArticles = () => {
	// 如果已经没有更多数据或正在加载中，则不处理
	if (data.noMoreData || data.isLoading) return;

	data.isLoading = true;

	// 模拟API请求延迟
	setTimeout(() => {
		// 计算起始和结束索引
		const startIndex = (data.currentPage - 1) * data.pageSize;
		const endIndex = startIndex + data.pageSize;

		// 从所有文章中获取当前页的数据
		const pageData = allArticles.slice(startIndex, endIndex);

		// 如果没有获取到数据，说明已经没有更多数据了
		if (pageData.length === 0) {
			data.noMoreData = true;
			data.isLoading = false;
			return;
		}

		// 添加到文章列表
		data.articleList.push(...pageData);

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
	// 示例：
	// api.getArticles({
	//   page: data.currentPage,
	//   pageSize: data.pageSize,
	//   type: data.navItems[data.currentNav].type
	// }).then(res => {
	//   // 处理响应数据
	//   if (res.data.length > 0) {
	//     data.articleList.push(...res.data);
	//     data.currentPage++;
	//     data.noMoreData = res.data.length < data.pageSize;
	//   } else {
	//     data.noMoreData = true;
	//   }
	//   data.isLoading = false;
	//   if (data.isRefreshing) data.isRefreshing = false;
	// }).catch(err => {
	//   console.error('获取文章列表失败', err);
	//   data.isLoading = false;
	//   if (data.isRefreshing) data.isRefreshing = false;
	// });
};

/**
 * 刷新列表
 */
const refreshList = () => {
	// 设置刷新状态
	data.isRefreshing = true;

	// 重置数据
	data.articleList = [];
	data.currentPage = 1;
	data.noMoreData = false;

	// 重新加载
	loadArticles();
	
	// TODO: 实际项目中可以添加获取最新数据的逻辑
};

/**
 * 加载更多
 */
const loadMore = () => {
	loadArticles();
};

/**
 * 搜索处理
 */
const handleSearch = () => {
	if (!data.searchText.trim()) {
		uni.showToast({
			title: '请输入搜索内容',
			icon: 'none'
		});
		return;
	}

	// 模拟搜索
	uni.showToast({
		title: '搜索: ' + data.searchText,
		icon: 'none'
	});
	
	// TODO: 实际搜索API调用
	// api.searchArticles(data.searchText).then(res => {
	//   // 处理搜索结果
	// });
};

/**
 * 发表文章处理
 */
const handlePost = () => {
	uni.navigateTo({
		url: '/pages/publish/publish'
	});
};

/**
 * 点赞处理
 * @param {Number} index - 文章索引
 */
const handleLike = (index) => {
	const article = data.articleList[index];

	// 切换点赞状态
	article.isLiked = !article.isLiked;

	// 更新点赞数
	if (article.isLiked) {
		// 点赞
		article.likeCount++;
		uni.showToast({
			title: '点赞成功',
			icon: 'success'
		});
	} else {
		// 取消点赞
		article.likeCount--;
		uni.showToast({
			title: '已取消点赞',
			icon: 'none'
		});
	}
	
	// TODO: 实际点赞API调用
	// api.likeArticle(article.id, article.isLiked);
};

/**
 * 评论处理
 * @param {Number} index - 文章索引
 */
const handleComment = (index) => {
	uni.showToast({
		title: '打开评论列表',
		icon: 'none'
	});

	// TODO: 跳转到评论页面
	// uni.navigateTo({ url: `/pages/comment/comment?id=${data.articleList[index].id}` });
};

/**
 * 分享处理
 * @param {Number} index - 文章索引
 */
const handleShare = (index) => {
	uni.showToast({
		title: '分享成功',
		icon: 'success'
	});
	
	// TODO: 实际分享API调用
};

/**
 * 切换关注状态
 * @param {Number} index - 文章索引
 */
const toggleFollow = (index) => {
	const author = data.articleList[index].author;
	author.isFollowed = !author.isFollowed;

	if (author.isFollowed) {
		uni.showToast({
			title: '关注成功',
			icon: 'success'
		});
	} else {
		uni.showToast({
			title: '已取消关注',
			icon: 'none'
		});
	}
	
	// TODO: 实际关注/取消关注API调用
	// api.followAuthor(author.id, author.isFollowed);
};

/**
 * 查看文章详情
 * @param {Number} id - 文章ID
 */
const viewArticleDetail = (id) => {
	uni.showToast({
		title: '查看文章详情: ' + id,
		icon: 'none'
	});

	// TODO: 跳转到文章详情页
	// uni.navigateTo({ url: `/pages/article-detail/article-detail?id=${id}` });
};

/**
 * 切换导航
 * @param {Number} index - 导航索引
 */
const switchNav = (index) => {
	if (data.currentNav === index) return;

	data.currentNav = index;

	// 重置文章列表
	data.articleList = [];
	data.currentPage = 1;
	data.noMoreData = false;

	// 显示加载提示
	uni.showLoading({
		title: '加载中...'
	});

	// 根据不同的导航类型加载不同的数据
	setTimeout(() => {
		loadArticles();
		uni.hideLoading();
	}, 500);
	
	// TODO: 根据不同的导航类型调用不同的API
	// api.getArticles({
	//   type: data.navItems[index].type,
	//   page: 1,
	//   pageSize: data.pageSize
	// }).then(/* 处理响应 */);
};
</script>

<style lang="scss">
	page {
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	.container {
		display: flex;
		flex-direction: column;
		position: relative;
		height: 100vh;
	}

	// 固定在顶部的标题和搜索栏
	.header-fixed {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background-color: #f5f5f5;
		padding: 20rpx;
		z-index: 100;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		
		// 顶部区域(搜索栏和发表按钮)容器
		.header-top {
			display: flex;
			align-items: center;
			position: relative;
			margin: 0 20rpx;
		}
		
		// 搜索栏
		.search-bar {
			display: flex;
			background: #fff;
			border-radius: 40rpx;
			overflow: hidden;
			padding: 0 20rpx;
			flex: 1;
			box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
			
			input {
				flex: 1;
				height: 80rpx;
				padding: 0 20rpx;
				font-size: 28rpx;
			}
		}
		
		// 搜索按钮
		.search-btn {
			height: 60rpx;
			line-height: 60rpx;
			margin: 10rpx 0;
			background-color: #4361ee;
			color: #fff;
			font-size: 26rpx;
			border-radius: 30rpx;
			padding: 0 30rpx;
		}
		
		// 发表按钮
		.publish-btn {
			margin-left: 20rpx;
		}
		
		// 导航菜单
		.nav-menu {
			display: flex;
			padding: 20rpx 30rpx 15rpx;
			background-color: #f5f5f5;
			margin-bottom: 5rpx;
			
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

	// 内容区域
	.content-area {
		padding: 20rpx;
		padding-top: 225rpx; // 增加上边距以避免导航栏覆盖文章
		flex: 1;
		
		.article-list {
			height: calc(100vh - 220rpx);
		}
		
		// 文章卡片
		.article-card {
			background-color: #fff;
			border-radius: 20rpx;
			padding: 30rpx;
			margin-bottom: 30rpx;
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
				
				.follow-btn {
					height: 50rpx;
					line-height: 50rpx;
					background-color: #fff;
					color: #4361ee;
					font-size: 24rpx;
					border: 2rpx solid #4361ee;
					border-radius: 25rpx;
					padding: 0 20rpx;
					
					&.followed {
						color: #999;
						border-color: #999;
					}
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
				
				// 单图布局
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
				
				// 多图布局
				.image-grid {
					display: flex;
					justify-content: space-between;
					margin-bottom: 20rpx;
					
					.grid-image {
						width: 32%;
						height: 200rpx;
						border-radius: 10rpx;
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
					
					.action-icon {
						width: 40rpx;
						height: 40rpx;
						margin-right: 10rpx;
					}
					
					text {
						font-size: 24rpx;
						color: #666;
						
						&.liked {
							color: #ff6b6b;
						}
					}
				}
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
</style>
