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
			<!-- 使用ArticleList组件替换原有的文章列表 -->
			<ArticleList 
				ref="articleListRef"
				:key="data.currentNav"
				:list-type="getListType()"
				:height="getListHeight()"
				:empty-text="'暂无文章内容'"
				@article-click="viewArticleDetail"
				@like="handleLike"
				@share="handleShare"
				@comment="handleComment"
				@collect="handleCollect"
			/>
		</view>
	</view>
</template>

<script setup>
	import {
		reactive,
		onMounted,
		ref,
		nextTick,
		watch,
		onBeforeMount
	} from 'vue';
	// 导入uni-icons组件
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
	// 导入API接口
	import { getArticleDetail } from '@/api/article';
	import { onLoad, onShow } from '@dcloudio/uni-app';
	// 导入ArticleList组件
	import ArticleList from '@/components/article-list/article-list.vue';

	// 添加引用
	const articleListRef = ref(null);
	
	// 添加全局防抖标记，使用闭包确保跨页面刷新时重置
	const globalLoadingLock = (() => {
		let isLocked = false;
		let lockTimer = null;
		
		// 设置锁定方法
		const lock = (duration = 3000) => {
			if (lockTimer) clearTimeout(lockTimer);
			isLocked = true;
			lockTimer = setTimeout(() => {
				isLocked = false;
				lockTimer = null;
			}, duration);
			return true;
		};
		
		// 检查是否锁定
		const isActive = () => isLocked;
		
		// 解除锁定
		const unlock = () => {
			isLocked = false;
			if (lockTimer) {
				clearTimeout(lockTimer);
				lockTimer = null;
			}
		};
		
		// 重置
		const reset = () => {
			unlock();
		};
		
		return {
			lock,
			isActive,
			unlock,
			reset
		};
	})();

	// 使用reactive统一管理数据
	const data = reactive({
		// 搜索状态
		searchText: '',

		// 文章列表数据与状态
		isRefreshing: false,
		lastRequestTime: 0, // 添加最近请求时间戳，用于限制频率

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

	// 在onBeforeMount阶段拦截，避免多个生命周期重复加载
	onBeforeMount(() => {
		console.log('页面开始挂载前');
		// 重置全局加载锁
		globalLoadingLock.reset();
	});

	// 页面初始化
	onMounted(async () => {
		// 使用统一的数据加载入口
		await loadArticleData();
	});

	// 页面显示时刷新数据
	onShow(() => {
		// 如果全局锁定中，跳过刷新
		if (globalLoadingLock.isActive()) {
			console.log('全局锁定中，onShow跳过文章列表刷新');
			return;
		}
		
		// 检查请求频率限制 - 如果距离上次请求不足1秒，则跳过刷新
		const now = Date.now();
		if (now - data.lastRequestTime < 1000) {
			console.log('请求过于频繁，跳过本次刷新');
			return;
		}
		
		// 刷新文章列表
		if (articleListRef.value) {
			// 记录本次请求时间
			data.lastRequestTime = now;
			
			// 检查组件上的加载状态
			const isComponentLoading = articleListRef.value.isLoading || articleListRef.value.loading || false;
			
			if (!isComponentLoading && !data.isRefreshing) {
				// 设置刷新状态为true，防止短时间内重复刷新
				data.isRefreshing = true;
				
				console.log('检测到页面显示，刷新文章列表');
				// 设置一个小延迟，避免可能的竞态条件
				setTimeout(() => {
					articleListRef.value.resetList();
					// 添加延迟再加载文章，避免可能的并发请求
					setTimeout(() => {
						articleListRef.value.loadArticles();
					}, 50);
				}, 50);
				
				// 2秒后重置刷新状态，允许下次刷新
				setTimeout(() => {
					data.isRefreshing = false;
				}, 2000);
			} else if (isComponentLoading) {
				console.log('组件正在加载中，跳过本次刷新');
			} else {
				console.log('已在刷新中，跳过本次刷新');
			}
		} else {
			console.warn('文章列表组件未初始化，无法刷新');
		}
	});

	/**
	 * 加载文章数据
	 * 统一的数据加载入口，确保只调用一次
	 */
	const loadArticleData = async () => {
		// 如果已经在加载中，跳过
		if (globalLoadingLock.isActive()) {
			console.log('全局加载锁激活中，跳过加载');
				return;
			}

		// 设置加载锁，防止重复加载
		globalLoadingLock.lock(3000);
		
		// 设置刷新状态
		data.isRefreshing = true;
		
		// 记录请求时间
		data.lastRequestTime = Date.now();
		
		console.log('=== 开始统一加载文章数据 ===');
		
		try {
			// 显示加载提示
			uni.showLoading({
				title: '加载中...'
			});
			
			// 等待DOM更新，确保引用有效
			await nextTick();
			
			// 延迟加载文章列表，确保组件已经完全挂载
			setTimeout(() => {
				// 等待下一个DOM更新周期，文章列表组件会自动加载
				nextTick(() => {
					console.log('文章列表组件已渲染，将自动加载数据');
					
					// 隐藏加载提示
					uni.hideLoading();
				
					// 延迟重置刷新状态
					setTimeout(() => {
						data.isRefreshing = false;
						console.log('重置刷新状态');
					}, 2000);
				});
			}, 300);
		} catch (error) {
			console.error('统一加载失败:', error);
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			});
			uni.hideLoading();
			
			// 出错时也要重置状态
				data.isRefreshing = false;
			globalLoadingLock.unlock();
		}
	};

	/**
	 * 获取当前导航对应的列表类型
	 */
	const getListType = () => {
		const navType = data.navItems[data.currentNav].type;
		switch(navType) {
			case 'follow':
				return 'follow';
			case 'recommend':
				return 'recommend';
			case 'hot':
				return 'hot';
			case 'new':
				return 'latest';
			default:
				return 'recommend';
		}
	};

	/**
	 * 获取基础URL
	 */
	const getBaseUrl = () => {
		// #ifdef APP-PLUS
		return 'http://10.9.99.181:8080'; // 安卓模拟器访问本机服务器的地址
		// #endif

		// #ifdef H5
		return 'http://localhost:8080';
		// #endif

		// #ifdef MP-WEIXIN
		return 'http://localhost:8080';
		// #endif
	};

	/**
	 * 处理头像URL格式
	 * @param {String} url - 头像URL
	 * @return {String} 处理后的头像URL
	 */
	const formatAvatarUrl = (url) => {
		if (!url) return '/static/images/avatar.png';
		
		// 移除URL中可能存在的多余空格
		url = url.trim();
		
		// 确保不是null或undefined
		if (url === 'null' || url === 'undefined') {
			return '/static/images/avatar.png';
		}
		
		// 完整URL处理：如果已经是完整URL（包含http）则不处理
		if (url.startsWith('http')) {
			// 检查并修复双斜杠问题
			if (url.includes('//uploads')) {
				url = url.replace('//uploads', '/uploads');
			}
			return url;
		}
		// 静态资源处理：如果是静态资源路径则不处理
		else if (url.startsWith('/static')) {
			return url;
		}
		// 其他情况：添加基础URL前缀
		else {
			if (url.startsWith('/')) {
				return getBaseUrl() + url;
			} else {
				return getBaseUrl() + '/' + url;
			}
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
				title: '请先登录',
				icon: 'none'
			});
			
			setTimeout(() => {
				uni.navigateTo({
					url: `/pages/login/login?redirect=${encodeURIComponent('/pages/publish/publish')}`
				});
			}, 1500);
			return;
		}
		
		uni.navigateTo({
			url: '/pages/publish/publish'
		});
	};

	/**
	 * 查看文章详情
	 * @param {Number} articleId - 文章ID
	 */
	const viewArticleDetail = (articleId) => {
		// #ifdef H5
		// H5环境下，新窗口打开文章详情页
		// 获取正确的基础路径
		const currentUrl = window.location.href;
		const baseUrl = currentUrl.split('#')[0];
		const detailUrl = `${baseUrl}#/pages/article-detail/article-detail?id=${articleId}`;
		window.open(detailUrl, '_blank');
		// #endif
		
		// #ifndef H5
		// 非H5环境下，正常跳转
		uni.navigateTo({
			url: `/pages/article-detail/article-detail?id=${articleId}`
		});
		// #endif
	};

	/**
	 * 处理收藏
	 * @param {Object} article - 文章对象
	 */
	const handleCollect = (article) => {
		uni.showToast({
			title: article.isCollected ? '收藏成功' : '已取消收藏',
			icon: article.isCollected ? 'success' : 'none'
		});
	};

	/**
	 * 处理评论
	 * @param {Object} article - 文章对象
	 */
	const handleComment = (article) => {
		// 跳转到文章详情页并显示评论部分
		uni.navigateTo({
			url: `/pages/article-detail/article-detail?id=${article.id}&showComments=true`
		});
	};

	/**
	 * 处理点赞
	 * @param {Object} article - 文章对象
	 */
	const handleLike = (article) => {
		uni.showToast({
			title: article.isLiked ? '点赞成功' : '已取消点赞',
			icon: article.isLiked ? 'success' : 'none'
		});
	};

	/**
	 * 处理分享
	 * @param {Object} article - 文章对象
	 */
	const handleShare = (article) => {
		// 分享菜单
		uni.showActionSheet({
			itemList: ['分享到微信', '复制链接', '生成分享图'],
			success: (res) => {
				switch (res.tapIndex) {
					case 0: // 分享到微信
						// #ifdef APP-PLUS
						uni.share({
							provider: 'weixin',
							scene: 'WXSceneSession',
							type: 0,
							title: article.title,
							summary: article.summary || '来自我的博客',
							imageUrl: article.coverImage || '',
							href: `${getBaseUrl()}/article/${article.id}`,
							success: () => {
								uni.showToast({
									title: '分享成功',
									icon: 'success'
								});
							}
						});
						// #endif
						
						// #ifdef H5 || MP-WEIXIN
						uni.showToast({
							title: '已复制链接，请手动分享',
							icon: 'none'
						});
						uni.setClipboardData({
							data: `${getBaseUrl()}/article/${article.id}`,
							success: () => {
								console.log('链接已复制');
							}
						});
						// #endif
						break;
						
					case 1: // 复制链接
						uni.setClipboardData({
							data: `${getBaseUrl()}/article/${article.id}`,
							success: () => {
								uni.showToast({
									title: '链接已复制',
									icon: 'success'
								});
							}
						});
						break;
						
					case 2: // 生成分享图
						uni.showToast({
							title: '分享图生成中...',
							icon: 'loading',
							duration: 2000
						});
						
						setTimeout(() => {
							uni.showToast({
								title: '分享图已生成',
								icon: 'success'
							});
						}, 2000);
						break;
				}
			}
		});
	};

	/**
	 * 切换导航
	 * @param {Number} index - 导航索引
	 */
	const switchNav = (index) => {
		if (data.currentNav === index) {
			// 如果点击当前选中的选项卡，则视为刷新操作
			refreshArticleList();
			return;
		}

		data.currentNav = index;

		// 显示加载提示
		uni.showLoading({
			title: '加载中...'
		});

		// 由于添加了key属性，组件会重新创建，不需要手动调用重置和加载方法
		setTimeout(() => {
			uni.hideLoading();
		}, 500);
	};

	/**
	 * 手动刷新文章列表
	 */
	const refreshArticleList = () => {
		// 使用统一的加载入口进行刷新
		loadArticleData();
	};

	/**
	 * 获取文章列表高度
	 */
	const getListHeight = () => {
		// #ifdef APP-PLUS || MP-WEIXIN
		// 在APP和小程序中减去状态栏高度
		return 'calc(100vh - 220rpx - var(--status-bar-height, 25px))';
		// #endif
		
		// #ifdef H5
		// 在H5中使用固定值
		return 'calc(100vh - 220rpx)';
		// #endif
		
		// 默认高度
		return 'calc(100vh - 220rpx)';
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
		padding-top: calc(5rpx + var(--status-bar-height, 0px));
		z-index: 100;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		// #ifdef APP-PLUS || MP-WEIXIN
		padding-top: calc(5rpx + var(--status-bar-height, 25px));
		// #endif

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
		padding: 220rpx 20rpx 0rpx 20rpx;
		// #ifdef APP-PLUS || MP-WEIXIN
		padding-top: calc(220rpx + var(--status-bar-height, 25px));
		// #endif
		flex: 1;
	}

	// 全局样式覆盖
	.uni-scroll-view-refresh {
		background-color: #f5f5f5 !important;

		&-inner {
			color: #b82222;
		}
	}
</style>