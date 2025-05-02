<template>
	<view class="container">
		<!-- 固定在顶部的标题和搜索栏 -->
		<view class="header-fixed">
			<view class="header-top">
				<view class="search-bar">
					<input type="text" placeholder="请输入搜索内容" v-model="data.searchText" @confirm="handleSearch" />
					<button class="search-btn" @click="handleSearch">搜索</button>
				</view>

				<button type="primary" size="mini" class="publish-btn" @click="handlePost"
					:style="{ borderRadius: '50rpx', padding: '0 30rpx' }">
					发表
				</button>
			</view>

			<!-- 导航菜单 -->
			<view class="nav-menu">
				<view v-for="(item, index) in data.navItems" :key="index" class="nav-item"
					:class="{ active: data.currentNav === index }" @click="switchNav(index)">
					{{ item.name }}
				</view>
			</view>
		</view>

		<!-- 内容区域，添加上边距为header高度 -->
		<view class="content-area">
			<!-- 使用ArticleList组件 -->
			<ArticleList
				ref="articleListRef"
				:list-type="getCurrentListType()"
				:tag-name="data.currentTagName"
				@article-click="viewArticleDetail"
				@author-click="viewUserProfile"
				@tag-click="handleTagClick"
				@share="handleShare"
				@comment="handleComment"
				@collect="handleCollect"
				@like="handleLike"
				@follow="handleFollow"
			/>
		</view>
	</view>
</template>

<script setup>
	import {
		reactive,
		ref,
		computed,
		onMounted,
		nextTick
	} from 'vue';
	// 导入ArticleList组件
	import ArticleList from '@/components/article-list/article-list.vue';

	// 获取文章列表组件引用
	const articleListRef = ref(null);

	// 使用reactive统一管理数据
	const data = reactive({
		// 搜索状态
		searchText: '',

		// 当前标签名称
		currentTagName: '',

		// 导航菜单数据和状态
		navItems: [{
				name: '关注',
				type: 'follow'
			},
			{
				name: '推荐',
				type: 'recommend'
			},
			{
				name: '热榜',
				type: 'hot'
			},
			{
				name: '最新',
				type: 'new'
			}
		],
		currentNav: 1, // 默认选中推荐
	});

	// 获取当前列表类型
	const getCurrentListType = () => {
		return data.navItems[data.currentNav].type;
	};

	// 页面初始化
	onMounted(() => {
		// 检查登录状态
		checkLoginStatus();
	});

	// 检查登录状态
	const checkLoginStatus = () => {
		const token = uni.getStorageSync('token');
		if (!token && data.currentNav === 0) {
			// 未登录状态下，不能访问"关注"页面，自动切换到"推荐"
			data.currentNav = 1;
			uni.showToast({
				title: '请先登录后查看关注内容',
				icon: 'none'
			});
		}
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

		// 跳转到搜索结果页面
		uni.navigateTo({
			url: `/pages/search/search?keyword=${encodeURIComponent(data.searchText)}`
		});
	};

	/**
	 * 发表文章处理
	 */
	const handlePost = () => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录后发表内容',
				icon: 'none'
			});
			
			// 延迟跳转到登录页
			setTimeout(() => {
				uni.navigateTo({
					url: `/pages/login/login?redirect=${encodeURIComponent('/pages/publish/publish')}`
				});
			}, 1500);
			return;
		}
		
		// 已登录，直接跳转到发布页
		uni.navigateTo({
			url: '/pages/publish/publish'
		});
	};

	/**
	 * 切换导航
	 * @param {Number} index - 导航索引
	 */
	const switchNav = (index) => {
		if (data.currentNav === index) return;
		
		// 检查登录状态
		if (index === 0) {
			const token = uni.getStorageSync('token');
			if (!token) {
				uni.showToast({
					title: '请先登录后查看关注内容',
					icon: 'none'
				});
				
				// 延迟跳转到登录页
				setTimeout(() => {
					uni.navigateTo({
						url: `/pages/login/login?redirect=${encodeURIComponent('/pages/index/index')}`
					});
				}, 1500);
				return;
			}
		}

		data.currentNav = index;
		data.currentTagName = ''; // 切换导航时重置标签筛选

		// 显示加载提示
		uni.showLoading({
			title: '加载中...'
		});

		// 切换完成后刷新文章列表
		nextTick(() => {
			articleListRef.value?.resetList();
			articleListRef.value?.loadArticles();
			
			// 隐藏加载提示
			setTimeout(() => {
				uni.hideLoading();
			}, 500);
		});
	};

	/**
	 * 查看文章详情
	 * @param {Number} id - 文章ID
	 */
	const viewArticleDetail = (id) => {
		uni.navigateTo({ 
			url: `/pages/article-detail/article-detail?id=${id}` 
		});
	};
	
	/**
	 * 查看用户资料
	 * @param {Number} userId - 用户ID
	 */
	const viewUserProfile = (userId) => {
		// 检查是否为当前用户
		const currentUser = uni.getStorageSync('userInfo');
		if (currentUser && currentUser.id === userId) {
			// 跳转到"我的"页面
			uni.switchTab({
				url: '/pages/my/my'
			});
			return;
		}
		
		// 跳转到用户资料页
		uni.navigateTo({
			url: `/pages/user-profile/user-profile?id=${userId}`
		});
	};
	
	/**
	 * 处理标签点击
	 * @param {String} tag - 标签名称
	 */
	const handleTagClick = (tag) => {
		// 设置当前标签
		data.currentTagName = tag;
		// 切换到标签筛选模式
		data.currentNav = -1; // 使用-1表示自定义筛选
		
		// 刷新文章列表
		nextTick(() => {
			articleListRef.value?.resetList();
			articleListRef.value?.loadArticles();
		});
		
		uni.showToast({
			title: `查看标签: ${tag}`,
			icon: 'none'
		});
	};
	
	/**
	 * 处理文章分享
	 * @param {Object} article - 文章对象
	 */
	const handleShare = (article) => {
		uni.showToast({
			title: '分享功能开发中',
			icon: 'none'
		});
	};
	
	/**
	 * 处理文章评论
	 * @param {Object} article - 文章对象
	 */
	const handleComment = (article) => {
		viewArticleDetail(article.id);
	};
	
	/**
	 * 处理文章收藏
	 * @param {Object} article - 文章对象
	 */
	const handleCollect = (article) => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录后操作',
				icon: 'none'
			});
			return;
		}
		
		// 在实际应用中，这里需要调用API进行收藏/取消收藏操作
		uni.showToast({
			title: article.isCollected ? '收藏成功' : '已取消收藏',
			icon: article.isCollected ? 'success' : 'none'
		});
	};
	
	/**
	 * 处理文章点赞
	 * @param {Object} article - 文章对象
	 */
	const handleLike = (article) => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录后操作',
				icon: 'none'
			});
			return;
		}
		
		// 在实际应用中，这里需要调用API进行点赞/取消点赞操作
		uni.showToast({
			title: article.isLiked ? '点赞成功' : '已取消点赞',
			icon: article.isLiked ? 'success' : 'none'
		});
	};
	
	/**
	 * 处理关注用户
	 * @param {Object} author - 作者对象
	 */
	const handleFollow = (author) => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录后操作',
				icon: 'none'
			});
			return;
		}
		
		// 在实际应用中，这里需要调用API进行关注/取消关注操作
		uni.showToast({
			title: author.isFollowed ? '关注成功' : '已取消关注',
			icon: author.isFollowed ? 'success' : 'none'
		});
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
		padding: 5rpx;
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
			height: 60rpx;
			line-height: 60rpx;
			padding: 0 30rpx;
			font-size: 26rpx;
			margin-left: 20rpx;
		}

		// 导航菜单
		.nav-menu {
			display: flex;
			padding: 10rpx 30rpx 5rpx;
			background-color: #f5f5f5;

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
		padding: 165rpx 20rpx 0rpx 20rpx;
		flex: 1;
	}
</style>