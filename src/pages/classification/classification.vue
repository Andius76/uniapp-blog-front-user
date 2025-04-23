<template>
	<view class="container">
		<!-- 固定在顶部的标题和分类选择栏 -->
		<view class="header-fixed">
			<view class="header-main-container">
				<!-- 分类滑块容器 -->
				<view class="header-top">
					<view class="search-bar">
						<input type="text" placeholder="请输入搜索标签" v-model="searchText" @confirm="handleSearch" />
						<button class="search-btn" @click="handleSearch">搜索</button>
					</view>
				</view>

				<!-- 分类标签导航 -->
				<scroll-view class="category-scroll" scroll-x show-scrollbar="false">
					<view class="category-list">
						<view 
							v-for="(tag, index) in tags" 
							:key="index" 
							class="category-item" 
							:class="{ active: currentTag === tag }"
							@click="switchCategory(tag)"
						>
							{{ tag }}
						</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 内容区域，添加上边距为header高度 -->
		<view class="content-area">
			<scroll-view 
				scroll-y 
				class="article-list" 
				@scrolltolower="loadMore" 
				refresher-enabled 
				:refresher-triggered="isRefreshing" 
				@refresherrefresh="refreshList"
				:refresher-threshold="100"
			>
				<!-- 文章列表循环 -->
				<view v-for="(article, index) in articleList" :key="index" class="article-card">
					<view class="user-info">
						<image class="avatar" :src="article.author.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
						<text class="nickname">{{article.author.nickname}}</text>
						<button class="follow-btn" :class="{'followed': article.author.isFollowed}" @click="toggleFollow(index)">
							{{ article.author.isFollowed ? '已关注' : '+ 关注' }}
						</button>
					</view>

					<view class="article-content" @click="viewArticleDetail(index)">
						<text class="article-title">{{article.title}}</text>
						<text class="article-summary">{{article.summary}}...全文</text>

						<!-- 单图布局 -->
						<view class="article-image" v-if="article.imageType === 'single'">
							<image :src="article.coverImg" mode="aspectFill" class="single-image"></image>
						</view>

						<!-- 多图布局 -->
						<view class="image-grid" v-else-if="article.imageType === 'multi'">
							<image v-for="(img, imgIndex) in article.images" :key="imgIndex" :src="img" mode="aspectFill" class="grid-image"></image>
						</view>
						
						<!-- 文章标签 -->
						<view class="article-tags" v-if="article.tags && article.tags.length > 0">
							<view v-for="(tag, tagIndex) in article.tags" :key="tagIndex" class="tag-item">
								{{ tag }}
							</view>
						</view>
					</view>

					<view class="article-actions">
						<view class="action-item" @click="handleShare(index)">
							<uni-icons type="redo-filled" size="20" color="#666"></uni-icons>
							<text>分享</text>
						</view>
						<view class="action-item" @click="handleComment(index)">
							<uni-icons type="chatbubble" size="20" color="#666"></uni-icons>
							<text>{{article.commentCount}}</text>
						</view>
						<view class="action-item" @click="handleCollect(index)">
							<uni-icons :type="article.isCollected ? 'star-filled' : 'star'" size="20" :color="article.isCollected ? '#ffc107' : '#666'"></uni-icons>
							<text :class="{'collected': article.isCollected}">{{article.collectCount}}</text>
						</view>
						<view class="action-item" @click="handleLike(index)">
							<uni-icons :type="article.isLiked ? 'heart-filled' : 'heart'" size="20" :color="article.isLiked ? '#ff6b6b' : '#666'"></uni-icons>
							<text :class="{'liked': article.isLiked}">{{article.likeCount}}</text>
						</view>
					</view>
				</view>

				<!-- 加载状态 -->
				<view class="loading-state">
					<text v-if="isLoading">加载中...</text>
					<text v-else-if="noMoreData && articleList.length > 0">没有更多文章了</text>
					<text v-else-if="articleList.length === 0 && !isLoading">该分类下暂无文章</text>
					<text v-else>↓向下滑动加载更多文章列表↓</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
// 导入uni-icons组件
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';

// 搜索相关
const searchText = ref('');

// 可用的标签分类
const tags = ref([
	'全部', '技术', '生活', '旅行', '美食', '教育',
	'健康', '时尚', '科技', '游戏', '娱乐',
	'艺术', '体育', '音乐', '电影', '书籍'
]);

// 当前选中的标签
const currentTag = ref('全部');

// 分页和加载状态
const articleList = ref([]);
const currentPage = ref(1);
const pageSize = 5;
const isLoading = ref(false);
const noMoreData = ref(false);
const isRefreshing = ref(false);

// 模拟文章数据
const mockArticles = [
	{
		id: 1,
		title: '前端学习路线图 - Vue3新特性解析',
		collectCount: 45,
		isCollected: false,
		summary: 'Vue3带来了Composition API、Teleport、Fragments等新特性，本文详细介绍这些新特性的使用方法和优势',
		imageType: 'single',
		coverImg: '/static/images/default.png',
		likeCount: 156,
		commentCount: 38,
		isLiked: false,
		tags: ['技术', '科技'],
		author: {
			nickname: '前端达人',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	},
	{
		id: 2,
		title: 'uniapp跨平台开发实战经验分享',
		collectCount: 32,
		isCollected: true,
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
		tags: ['技术', '科技', '教育'],
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
		collectCount: 28,
		isCollected: false,
		tags: ['技术', '教育'],
		author: {
			nickname: '后端工程师',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	},
	{
		id: 4,
		title: '旅行摄影的10个小技巧',
		summary: '分享旅行中拍摄美丽照片的实用技巧，从构图到用光，帮助你在旅途中记录难忘的瞬间',
		imageType: 'multi',
		images: [
			'/static/images/default.png',
			'/static/images/default.png'
		],
		likeCount: 112,
		commentCount: 28,
		isLiked: false,
		collectCount: 48,
		isCollected: false,
		tags: ['旅行', '艺术'],
		author: {
			nickname: '摄影旅行家',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	},
	{
		id: 5,
		title: '健康饮食指南：均衡营养的重要性',
		summary: '探讨健康饮食的原则和均衡营养的重要性，包括各类营养素的摄入建议和日常饮食规划',
		imageType: 'single',
		coverImg: '/static/images/default.png',
		likeCount: 89,
		commentCount: 42,
		isLiked: false,
		collectCount: 36,
		isCollected: false,
		tags: ['健康', '美食'],
		author: {
			nickname: '营养师',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	},
	{
		id: 6,
		title: '最新电影《星际冒险》观后感',
		summary: '分享对最新科幻大片《星际冒险》的观后感，探讨电影中的科学元素和哲学思考',
		imageType: 'single',
		coverImg: '/static/images/default.png',
		likeCount: 145,
		commentCount: 37,
		isLiked: false,
		collectCount: 52,
		isCollected: false,
		tags: ['电影', '娱乐'],
		author: {
			nickname: '影评人',
			avatar: '/static/images/avatar.png',
			isFollowed: false
		}
	}
];

/**
 * 切换分类
 * @param {String} tag - 分类标签
 */
const switchCategory = (tag) => {
	if (currentTag.value === tag) return;
	
	currentTag.value = tag;
	
	// 重置文章列表
	articleList.value = [];
	currentPage.value = 1;
	noMoreData.value = false;
	
	// 显示加载提示
	uni.showLoading({
		title: '加载中...'
	});
	
	// 加载选中分类的文章
	loadArticles();
	
	// 隐藏加载提示
	setTimeout(() => {
		uni.hideLoading();
	}, 500);
};

/**
 * 加载文章列表
 */
const loadArticles = () => {
	// 如果已经没有更多数据或正在加载中，则不处理
	if (noMoreData.value || isLoading.value) return;
	
	isLoading.value = true;
	
	// 模拟API请求延迟
	setTimeout(() => {
		// 过滤符合当前分类的文章
		const filteredArticles = currentTag.value === '全部' 
			? mockArticles 
			: mockArticles.filter(article => article.tags && article.tags.includes(currentTag.value));
		
		// 计算本次应加载的数据
		const startIndex = (currentPage.value - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		const pageData = filteredArticles.slice(startIndex, endIndex);
		
		// 如果没有数据，标记已加载全部
		if (pageData.length === 0) {
			noMoreData.value = true;
			isLoading.value = false;
			
			// 如果是刷新状态，结束刷新
			if (isRefreshing.value) {
				isRefreshing.value = false;
			}
			return;
		}
		
		// 添加到文章列表
		articleList.value.push(...pageData);
		
		// 更新页码
		currentPage.value++;
		
		// 如果获取的数据不足一页，也标记为没有更多数据
		if (pageData.length < pageSize || endIndex >= filteredArticles.length) {
			noMoreData.value = true;
		}
		
		isLoading.value = false;
		
		// 如果是刷新状态，结束刷新
		if (isRefreshing.value) {
			isRefreshing.value = false;
		}
	}, 800);
	
	// TODO: 替换为实际API调用
	// api.getArticlesByTag({
	//   tag: currentTag.value,
	//   page: currentPage.value,
	//   pageSize: pageSize
	// }).then(res => {
	//   // 处理响应数据
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
	articleList.value = [];
	currentPage.value = 1;
	noMoreData.value = false;
	
	// 重新加载
	loadArticles();
};

/**
 * 加载更多
 */
const loadMore = () => {
	if (!noMoreData.value) {
		loadArticles();
	}
};

/**
 * 查看文章详情
 * @param {Number} index - 文章索引
 */
const viewArticleDetail = (index) => {
	// 获取文章完整数据
	const article = articleList.value[index];
	
	// 创建要传递的文章数据对象
	const articleData = {
		id: article.id,
		title: article.title,
		content: article.summary, // 这里使用摘要，实际项目中可能需要获取完整内容
		author: article.author,
		publishTime: article.publishTime || '2025-05-01 12:00', // 假设有发布时间
		tags: article.tags || [],
		likeCount: article.likeCount,
		commentCount: article.commentCount,
		collectCount: article.collectCount,
		isLiked: article.isLiked,
		isCollected: article.isCollected,
		imageType: article.imageType,
		coverImg: article.coverImg,
		images: article.images
	};
	
	// 将数据转换为JSON字符串并进行URI编码
	const articleDataStr = encodeURIComponent(JSON.stringify(articleData));
	
	// 跳转到文章详情页面，传递文章数据
	uni.navigateTo({
		url: `/pages/article-detail/article-detail?articleData=${articleDataStr}`
	});
	
	/* 
	// 如果文章详情页面支持通过ID获取数据，也可以只传ID
	uni.navigateTo({
		url: `/pages/article-detail/article-detail?id=${article.id}`
	});
	*/
};

/**
 * 点赞处理
 * @param {Number} index - 文章索引
 */
const handleLike = (index) => {
	const article = articleList.value[index];
	
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
 * 收藏处理
 * @param {Number} index - 文章索引
 */
const handleCollect = (index) => {
	const article = articleList.value[index];
	article.isCollected = !article.isCollected;
	article.collectCount += article.isCollected ? 1 : -1;
	
	uni.showToast({
		title: article.isCollected ? '收藏成功' : '已取消收藏',
		icon: article.isCollected ? 'success' : 'none'
	});
	
	// TODO: 实际收藏API调用
	// api.collectArticle(article.id, article.isCollected);
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
	// uni.navigateTo({ url: `/pages/comment/comment?id=${articleList.value[index].id}` });
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
	const author = articleList.value[index].author;
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
 * 处理搜索
 */
const handleSearch = () => {
	if (!searchText.value.trim()) {
		uni.showToast({
			title: '请输入搜索内容',
			icon: 'none'
		});
		return;
	}
	
	// 模拟搜索
	uni.showToast({
		title: '搜索标签: ' + searchText.value,
		icon: 'none'
	});
	
	// TODO: 实际搜索标签API调用
	// 可以添加标签到tags数组中，或者直接切换到匹配的标签分类
	// 例如：如果搜索的标签存在，可以直接切换到该标签
	// const searchedTag = searchText.value.trim();
	// if (tags.value.includes(searchedTag)) {
	//   switchCategory(searchedTag);
	// } else {
	//   // 可以添加到tags中并切换
	//   tags.value.push(searchedTag);
	//   switchCategory(searchedTag);
	// }
};

// 页面初始化
onMounted(() => {
	// 加载文章列表
	loadArticles();
});
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

// 固定在顶部的标题和分类栏
.header-fixed {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background-color: #f5f5f5;
	z-index: 100;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	
	// 顶部区域
	.header-top {
		display: flex;
		align-items: center;
		padding: 15rpx 20rpx;
		
		// 搜索栏样式
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
	}
	
	// 分类标签导航
	.category-scroll {
		width: 100%;
		white-space: nowrap;
		background-color: #f5f5f5;
		padding: 10rpx 0;
		position: relative;
		z-index: 100;

		
		.category-list {
			display: inline-flex;
			padding: 0 20rpx;
			
			.category-item {
				padding: 10rpx 24rpx;
				margin: 0 10rpx;
				font-size: 28rpx;
				color: #666;
				border-radius: 30rpx;
				transition: all 0.3s;
				
				&.active {
					color: #fff;
					background-color: #4361ee;
					font-weight: bold;
				}
			}
		}
	}
}

// 内容区域
.content-area {
	padding: 212rpx 20rpx 0 20rpx;
	flex: 1;
	
	.article-list {
		height: calc(100vh - 212rpx); // 减去底部导航栏高度
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
			
			// 文章标签
			.article-tags {
				display: flex;
				flex-wrap: wrap;
				margin-top: 10rpx;
				
				.tag-item {
					padding: 6rpx 16rpx;
					font-size: 22rpx;
					color: #4361ee;
					background-color: rgba(67, 97, 238, 0.1);
					border-radius: 20rpx;
					margin-right: 10rpx;
					margin-bottom: 10rpx;
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
	
	// 加载状态
	.loading-state {
		text-align: center;
		font-size: 24rpx;
		color: #999;
		margin: 20rpx 0;
		padding: 20rpx 0;
		padding-bottom: 50rpx; // 增加底部间距，确保在底部导航栏上方可见
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
.header-main-container {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 15rpx 0 0 0;
  background: #f5f5f5;
  position: relative;
  z-index: 99;
}

// 调整原有固定定位样式
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}
</style>