<template>
	<view class="container" @click="handleContainerClick">
		<!-- 顶部导航栏 -->
		<!-- #ifdef H5 -->
		<view class="header-fixed">
			<view class="header-top">
				<navigator url="/pages/index/index" class="logo">首页</navigator>
				<!-- 搜索框 -->
				<view class="search-bar">
					<input type="text" placeholder="请输入搜索内容" v-model="data.searchText" @confirm="handleSearch" />
					<button class="search-btn" @click="handleSearch">搜索</button>
				</view>
				<!-- 消息通知和用户头像 -->
				<view class="header-right">
					<view class="notification" @click="goToMessage">
						<uni-icons type="notification" size="24" />
					</view>
					<view class="user-info" @click.stop="navigateToMyPage">
						<image class="avatar" :src="formatAvatarUrl(userInfo.avatar)" mode="aspectFill"></image>
						<text class="nickname">{{ userInfo.nickname || '未登录' }}</text>
					</view>
				</view>
			</view>

			<!-- 导航菜单 -->
			<view class="nav-menu">
				<view v-for="(item, index) in data.navItems" :key="index" class="nav-item"
					:class="{ active: data.currentNav === index }" @click="switchNav(index)">
					{{ item.name }}
				</view>
			</view>
		</view>
		<!-- #endif -->

		<!-- APP和小程序的顶部布局 -->
		<!-- #ifndef H5 -->
		<view class="header-main-container">
			<!-- 顶部区域-搜索栏 -->
			<view class="header-top">
				<view class="search-bar">
					<input type="text" placeholder="请输入搜索内容" v-model="data.searchText" @confirm="handleSearch" />
					<button class="search-btn" @click="handleSearch">搜索</button>
				</view>
			</view>

			<!-- 导航菜单 -->
			<scroll-view class="category-scroll" scroll-x show-scrollbar="false">
				<view class="category-list">
					<view v-for="(item, index) in data.navItems" :key="index" class="category-item"
						:class="{ active: data.currentNav === index }" @click="switchNav(index)">
						{{ item.name }}
					</view>
				</view>
			</scroll-view>
		</view>
		<!-- #endif -->

		<!-- 内容区域 -->
		<!-- #ifdef H5 -->
		<view class="content-area">
			<!-- 左侧空白区域 -->
			<view class="left-sidebar"></view>

			<!-- 中间文章列表区域 -->
			<view class="main-content">
				<!-- 显示搜索状态和结果统计 -->
				<view class="search-status" v-if="data.currentNav === -1">
					<view class="search-info">
						<text>搜索"{{data.searchText}}"：共{{articleList.length}}条结果</text>
						<view class="clear-search" @click="clearSearch">
							<uni-icons type="clear" size="16" />
							<text>清除搜索</text>
						</view>
					</view>
				</view>
				
				<ArticleList 
					ref="articleListRef"
					:key="data.currentNav"
					:list-type="getListType()"
					:use-global-scroll="true"
					:empty-text="'暂无文章内容'"
					:keyword="data.currentNav === -1 ? data.searchText : ''"
					@article-click="viewArticleDetail"
					@like="handleLike"
					@share="handleShare"
					@comment="handleComment"
					@collect="handleCollect"
				/>
			</view>

			<!-- 右侧创作中心区域 -->
			<view class="right-sidebar">
				<view class="creator-center">
					<view class="creator-header">
						<uni-icons type="compose" size="24" />
						<text>创作中心</text>
					</view>
					<button class="write-btn" @click="handlePost">
						<uni-icons type="write" size="16" />
						<text>写文章</text>
					</button>
				</view>

				<!-- 用户数据统计 -->
				<view class="user-stats">
					<view class="stat-item animated-stat" @click="navigateToCollection">
						<uni-icons type="star" size="20" />
						<text>我的收藏</text>
						<text class="count">{{ userInfo.collectionCount || 0 }}</text>
					</view>
					<view class="stat-item animated-stat" @click="navigateToFollows">
						<uni-icons type="heart" size="20" />
						<text>我的关注</text>
						<text class="count">{{ userInfo.followCount || 0 }}</text>
					</view>
					<view class="stat-item animated-stat" @click="navigateToFollowers">
						<uni-icons type="person" size="20" />
						<text>我的粉丝</text>
						<text class="count">{{ userInfo.followerCount || 0 }}</text>
					</view>
				</view>
			</view>
		</view>
		<!-- #endif -->

		<!-- APP和小程序的内容区域 -->
		<!-- #ifndef H5 -->
		<view class="content-area mp-content">
			<!-- 显示搜索状态和结果统计 -->
			<view class="search-status" v-if="data.currentNav === -1">
				<view class="search-info">
					<text>搜索"{{data.searchText}}"：共{{articleList.length}}条结果</text>
					<view class="clear-search" @click="clearSearch">
						<uni-icons type="clear" size="16" />
						<text>清除搜索</text>
					</view>
				</view>
			</view>
			
			<scroll-view 
				scroll-y 
				class="article-list" 
				refresher-enabled 
				:refresher-triggered="data.isRefreshing" 
				@refresherrefresh="handleRefresh"
				@scrolltolower="handleLoadMore"
				:refresher-threshold="100"
			>
				<!-- 文章列表循环显示 -->
				<view v-for="(article, index) in articleList" :key="article.id" class="article-card">
					<!-- 用户信息 -->
					<view class="user-info">
						<!-- 添加更多安全性检查，确保即使formatAvatarUrl函数有问题也能显示默认头像 -->
						<image class="avatar" :src="article.author && formatAvatarUrl(article.author?.avatar) || '/static/images/avatar.png'" mode="aspectFill" @error="handleUserAvatarError(index)"></image>
						<text class="nickname">{{article.author?.nickname || '未知用户'}}</text>
						<button class="follow-btn" :class="{'followed': article.author?.isFollowed}" @click.stop="handleFollow(article)">
							{{ article.author?.isFollowed ? '已关注' : '+ 关注' }}
						</button>
					</view>

					<!-- 文章内容 -->
					<view class="article-content" @click="viewArticleDetail(article.id)">
						<text class="article-title">{{article.title}}</text>
						<text class="article-summary">{{formatArticleSummary(article.summary)}}...全文</text>

						<!-- 文章封面图片 -->
						<view class="article-image" v-if="article.coverImage">
							<image :src="article.coverImage" mode="aspectFill" class="single-image" @error="handleImageError(article)"></image>
							<!-- 添加调试信息，便于排查封面图片问题 -->
							<text class="debug-info" v-if="false">封面URL: {{article.coverImage}}</text>
						</view>
						
						<!-- 文章标签 -->
						<view class="article-tags" v-if="article.tags && article.tags.length > 0">
							<view v-for="(tag, tagIndex) in article.tags" :key="tagIndex" class="tag-item">
								{{ tag }}
							</view>
						</view>
					</view>

					<!-- 文章操作按钮 -->
					<view class="article-actions">
						<view class="action-item" @click.stop="handleShare(article)">
							<uni-icons type="redo-filled" size="20" color="#666"></uni-icons>
							<text>分享</text>
						</view>
						<view class="action-item" @click.stop="handleComment(article)">
							<uni-icons type="chatbubble" size="20" color="#666"></uni-icons>
							<text>{{article.commentCount || 0}}</text>
						</view>
						<view class="action-item" @click.stop="handleCollection(article)">
							<uni-icons :type="article.isCollected ? 'star-filled' : 'star'" size="20" :color="article.isCollected ? '#ffc107' : '#666'" 
								:class="{'animate-icon': article.isAnimating && article.animationType === 'collect'}"></uni-icons>
							<text :class="{'collected': article.isCollected}">{{article.collectCount || 0}}</text>
						</view>
						<view class="action-item" @click.stop="handleLike(article)">
							<uni-icons :type="article.isLiked ? 'heart-filled' : 'heart'" size="20" :color="article.isLiked ? '#ff6b6b' : '#666'"
								:class="{'animate-icon': article.isAnimating && article.animationType === 'like'}"></uni-icons>
							<text :class="{'liked': article.isLiked}">{{article.likeCount || 0}}</text>
						</view>
					</view>
				</view>

				<!-- 加载状态 -->
				<view class="loading-state">
					<text v-if="isLoading">加载中...</text>
					<text v-else-if="noMoreData && articleList.length > 0">没有更多文章了</text>
					<text v-else-if="articleList.length === 0 && !isLoading">暂无文章内容</text>
					<text v-else>↓向下滑动加载更多文章列表↓</text>
				</view>
			</scroll-view>
		</view>
		<!-- #endif -->

		<!-- #ifdef H5 -->
		<view class="settings-mask" v-if="showUserSettings" @click.self="closeUserSettings"></view>
		<view class="user-settings" v-if="showUserSettings">
			<view class="settings-header">
				<text class="title">用户设置</text>
				<view class="close-btn" @click="closeUserSettings">
					<uni-icons type="close" size="20" color="#333"></uni-icons>
				</view>
			</view>
			<view class="settings-body">
				<user-settings 
					:visible="showUserSettings"
					:userInfo="userInfo"
					@update:visible="handleVisibleChange"
					@avatar-change="handleAvatarChange"
					@nickname-change="handleNicknameChange"
					@logout="handleLogout"
					@before-avatar-select="handleBeforeAvatarSelect"
				/>
			</view>
		</view>
		<!-- #endif -->

		<!-- 使用通用的回到顶部组件，明确配置点击后隐藏并立即滚动到顶部 -->
		<back-to-top ref="backToTopRef" :threshold="300" :hide-after-click="true" :duration="0" @click="scrollToTop" />
	</view>
</template>

<script setup>
	import {
		reactive,
		onMounted,
		ref,
		nextTick,
		watch,
		onBeforeMount,
		onUnmounted,
		getCurrentInstance
	} from 'vue';
	// 导入uni-icons组件
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
	// 导入API接口
	import { getArticleDetail, likeArticle, collectArticle } from '@/api/article';
	import { getUserInfo } from '@/api/user'; // 导入getUserInfo接口
	import { onLoad, onShow } from '@dcloudio/uni-app';
	// 导入ArticleList组件
	import ArticleList from '@/components/article-list/article-list.vue';
	import UserSettings from '@/components/user-settings/user-settings.vue';
	// 导入回到顶部组件
	import BackToTop from '@/components/back-to-top/back-to-top.vue';
	import http from '@/utils/request';
	import { getBaseUrl } from '@/utils/request'; // 引入统一的getBaseUrl函数
	// 导入SearchArticles API
	import { searchArticles } from '@/api/article';

	// 添加引用
	const articleListRef = ref(null);
	const backToTopRef = ref(null);
	
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

	const userInfo = reactive({
		avatar: uni.getStorageSync('userInfo')?.avatar || '',
		nickname: uni.getStorageSync('userInfo')?.nickname || '',
		email: uni.getStorageSync('userInfo')?.email || '',
		collectionCount: uni.getStorageSync('userInfo')?.collectionCount || 0,
		followCount: uni.getStorageSync('userInfo')?.followCount || 0,
		followerCount: uni.getStorageSync('userInfo')?.followerCount || 0
	});

	// 监听登录状态变化
	watch(() => uni.getStorageSync('userInfo'), (newVal) => {
		if (newVal) {
			userInfo.avatar = newVal.avatar || '';
			userInfo.nickname = newVal.nickname || '';
			userInfo.email = newVal.email || '';
			userInfo.collectionCount = newVal.collectionCount || 0;
			userInfo.followCount = newVal.followCount || 0;
			userInfo.followerCount = newVal.followerCount || 0;
		} else {
			userInfo.avatar = '';
			userInfo.nickname = '';
			userInfo.email = '';
			userInfo.collectionCount = 0;
			userInfo.followCount = 0;
			userInfo.followerCount = 0;
		}
	}, { deep: true });

	// 在onBeforeMount阶段拦截，避免多个生命周期重复加载
	onBeforeMount(() => {
		console.log('页面开始挂载前');
		// 重置全局加载锁
		globalLoadingLock.reset();
	});

	// 页面初始化
	onMounted(async () => {
		// 加载用户信息和统计数据
		await loadUserData();
		// 使用统一的数据加载入口
		await loadArticleData();
		
		// 监听收藏状态更新事件
		uni.$on('article_collect_updated', (data) => {
			console.log('首页接收到文章收藏更新事件:', data);
			if (data && data.articleId && data.collectCount !== undefined) {
				// 查找文章并更新数据
				const article = articleList.value.find(item => item.id == data.articleId);
				if (article) {
					console.log(`首页更新文章[${data.articleId}]收藏状态:`, data);
					article.isCollected = data.isCollected;
					article.collectCount = data.collectCount;
				}
			}
		});
	});

	// 组件卸载时清理监听器
	onUnmounted(() => {
		// 清理工作已经在BackToTop组件中处理
		// 清理文章收藏更新事件监听
		uni.$off('article_collect_updated');
	});

	// 页面显示时刷新数据
	onShow(() => {
		// 每次页面显示时更新用户数据
		loadUserData();
		
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
		// 如果是搜索状态，返回search
		if (data.currentNav === -1) {
			return 'search';
		}
		
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
	 * 处理头像URL格式
	 * @param {String} url - 头像URL
	 * @return {String} 处理后的头像URL
	 */
	const formatAvatarUrl = (url) => {
		if (!url) return '/static/images/avatar.png';
		
		// 移除URL中可能存在的多余空格
		url = url.trim();
		
		// 确保不是null、undefined或空字符串
		if (url === 'null' || url === 'undefined' || url === '') {
			return '/static/images/avatar.png';
		}
		
		// 完整URL处理：如果已经是完整URL（包含http）则做特殊处理
		if (url.startsWith('http')) {
			// 检查并修复双斜杠问题
			if (url.includes('//uploads')) {
				url = url.replace('//uploads', '/uploads');
			}
			
			// APP环境下特别处理localhost
			// #ifdef APP-PLUS
			if (url.includes('localhost') || url.includes('127.0.0.1')) {
				const appBaseUrl = 'http://10.9.135.132:8080';
				const urlPath = url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '');
				return appBaseUrl + urlPath;
			}
			// #endif
			
			return url;
		}
		// 静态资源处理：如果是静态资源路径则不处理
		else if (url.startsWith('/static')) {
			return url;
		}
		// 路径以/uploads开头
		else if (url.startsWith('/uploads')) {
			return getBaseUrl() + url;
		}
		// 用户头像特别处理：如果是user_开头的文件名，默认放在/uploads/avatars/目录下
		else if (url.startsWith('user_')) {
			return getBaseUrl() + '/uploads/avatars/' + url;
		}
		// 其他情况：添加基础URL前缀
		else {
			if (url.startsWith('/')) {
				return getBaseUrl() + url;
			} else {
				// 默认假设是avatars目录
				return getBaseUrl() + '/uploads/avatars/' + url;
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

		// 显示加载提示
		uni.showLoading({
			title: '搜索中...'
		});
		
		// 将当前导航设置为-1，表示当前是搜索模式
		data.currentNav = -1;
		
		// 重置文章列表状态
		currentPage.value = 1;
		noMoreData.value = false;
		articleList.value = [];
		
		// 调用搜索API
		searchArticles(data.searchText, {
			page: 1,
			pageSize: 10
		}).then(res => {
			uni.hideLoading();
			
			if (res.code === 200 && res.data) {
				// 处理搜索结果
				const searchResults = res.data.list || [];
				
				// 如果没有搜索结果
				if (searchResults.length === 0) {
					uni.showToast({
						title: '没有找到相关文章',
						icon: 'none'
					});
					// 重置为推荐栏目
					data.currentNav = 1;
					// 重新加载推荐文章
					loadArticleList();
					return;
				}
				
				// 处理搜索结果数据
				const processedArticles = searchResults.map(article => {
					// 处理作者头像
					if (article.author && article.author.avatar) {
						article.author.avatar = formatAvatarUrl(article.author.avatar);
					}
					
					// 处理封面图片
					if (article.coverImage) {
						article.coverImage = formatArticleImage(article.coverImage);
					}
					
					// 处理收藏和点赞状态
					article.isLiked = !!article.isLiked;
					article.isCollected = !!article.isCollected;
					
					// 其他处理与loadArticleList中相同
					return article;
				});
				
				// 更新文章列表
				articleList.value = processedArticles;
			} else {
				// 处理搜索失败
				uni.showToast({
					title: res.message || '搜索失败',
					icon: 'none'
				});
				// 重置为推荐栏目
				data.currentNav = 1;
				// 重新加载推荐文章
				loadArticleList();
			}
		}).catch(err => {
			uni.hideLoading();
			uni.showToast({
				title: '搜索失败，请稍后重试',
				icon: 'none'
			});
			console.error('搜索失败:', err);
			// 重置为推荐栏目
			data.currentNav = 1;
			// 重新加载推荐文章
			loadArticleList();
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
	 * @param {Boolean} scrollToComments - 是否滚动到评论区
	 */
	const viewArticleDetail = (articleId, scrollToComments = false) => {
		// #ifdef H5
		// H5环境下，新窗口打开文章详情页
		// 获取正确的基础路径
		const currentUrl = window.location.href;
		const baseUrl = currentUrl.split('#')[0];
		const detailUrl = `${baseUrl}#/pages/article-detail/article-detail?id=${articleId}${scrollToComments ? '&scrollToComments=true' : ''}`;
		window.open(detailUrl, '_blank');
		// #endif
		
		// #ifndef H5
		// 非H5环境下，正常跳转
		uni.navigateTo({
			url: `/pages/article-detail/article-detail?id=${articleId}${scrollToComments ? '&scrollToComments=true' : ''}`
		});
		// #endif
	};

	/**
	 * 处理收藏
	 * @param {Object} article - 文章对象
	 */
	const handleCollect = (article) => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}
		
		// 切换收藏状态前的状态
		const originalState = article.isCollected;
		
		// 设置动画标记
		article.isAnimating = true;
		article.animationType = 'collect';
		
		// 立即反馈UI (乐观更新)
		article.isCollected = !article.isCollected;
		article.collectCount = article.isCollected ? (article.collectCount || 0) + 1 : Math.max(0, (article.collectCount || 0) - 1);
		
		// 调用API进行实际收藏/取消收藏操作
		collectArticle(article.id, article.isCollected)
			.then(res => {
				if (res.code === 200) {
					uni.showToast({
						title: article.isCollected ? '收藏成功' : '已取消收藏',
						icon: article.isCollected ? 'success' : 'none'
					});
					
					// API成功后，确保UI反映正确的计数
					if (res.data && typeof res.data.collectCount !== 'undefined') {
						article.collectCount = res.data.collectCount;
					}
					
					// 更新本地存储的收藏状态
					try {
						let collectedArticles = uni.getStorageSync('collectedArticles') || {};
						if (article.isCollected) {
							collectedArticles[article.id] = true;
						} else {
							delete collectedArticles[article.id];
						}
						uni.setStorageSync('collectedArticles', collectedArticles);
						console.log('更新本地收藏状态:', 
							article.isCollected ? '添加收藏' : '取消收藏', 
							article.id
						);
					} catch (e) {
						console.error('存储收藏状态出错:', e);
					}
					
					// 发送全局事件，通知其他页面更新该文章的收藏状态
					uni.$emit('article_collect_updated', {
						articleId: article.id,
						isCollected: article.isCollected,
						collectCount: article.collectCount
					});
				} else {
					// 恢复原状态
					article.isCollected = originalState;
					article.collectCount = originalState ? (article.collectCount || 0) + 1 : Math.max(0, (article.collectCount || 0) - 1);
					
					uni.showToast({
						title: res.message || '操作失败',
						icon: 'none'
					});
				}
			})
			.catch(err => {
				// 恢复原状态
				article.isCollected = originalState;
				article.collectCount = originalState ? (article.collectCount || 0) + 1 : Math.max(0, (article.collectCount || 0) - 1);
				
				uni.showToast({
					title: '网络异常，请稍后再试',
					icon: 'none'
				});
				console.error('收藏失败:', err);
			})
			.finally(() => {
				// 700ms后移除动画标记
				setTimeout(() => {
					article.isAnimating = false;
				}, 700);
			});
	};

	/**
	 * 处理评论
	 * @param {Object} article - 文章对象
	 */
	const handleComment = (article) => {
		// 检查登录状态，如果未登录，先跳转到登录页
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			
			setTimeout(() => {
				uni.navigateTo({
					url: `/pages/login/login?redirect=${encodeURIComponent('/pages/article-detail/article-detail?id=' + article.id + '&scrollToComments=true')}`
				});
			}, 1500);
			return;
		}
		
		// 跳转到文章详情页，并设置参数滚动到评论区
		viewArticleDetail(article.id, true);
	};

	/**
	 * 处理点赞
	 * @param {Object} article - 文章对象
	 */
	const handleLike = (article) => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}
		
		// 保存点赞前的状态
		const originalState = article.isLiked;
		
		// 设置动画标记
		article.isAnimating = true;
		article.animationType = 'like';
		
		// 立即反馈UI (乐观更新)
		article.isLiked = !article.isLiked;
		article.likeCount = article.isLiked ? (article.likeCount || 0) + 1 : Math.max(0, (article.likeCount || 0) - 1);
		
		// 调用API进行实际点赞/取消点赞操作
		likeArticle(article.id, article.isLiked)
			.then(res => {
				if (res.code === 200) {
					uni.showToast({
						title: article.isLiked ? '点赞成功' : '已取消点赞',
						icon: article.isLiked ? 'success' : 'none'
					});
					
					// API成功后，确保UI反映正确的计数
					if (res.data && typeof res.data.likeCount !== 'undefined') {
						article.likeCount = res.data.likeCount;
					}
				} else {
					// 恢复原状态
					article.isLiked = originalState;
					article.likeCount = originalState ? (article.likeCount || 0) + 1 : Math.max(0, (article.likeCount || 0) - 1);
					
					uni.showToast({
						title: res.message || '操作失败',
						icon: 'none'
					});
				}
			})
			.catch(err => {
				// 恢复原状态
				article.isLiked = originalState;
				article.likeCount = originalState ? (article.likeCount || 0) + 1 : Math.max(0, (article.likeCount || 0) - 1);
				
				uni.showToast({
					title: '网络异常，请稍后再试',
					icon: 'none'
				});
				console.error('点赞失败:', err);
			})
			.finally(() => {
				// 700ms后移除动画标记
				setTimeout(() => {
					article.isAnimating = false;
				}, 700);
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
		// 增加双击导航菜单刷新功能
		if (data.currentNav === index) {
			// 检查是否为双击
			if (refreshByNavDoubleTap(index)) {
				return; // 如果是双击，已经触发刷新，直接返回
			}
		}

		data.currentNav = index;

		// 显示加载提示
		uni.showLoading({
			title: '加载中...'
		});

		// 清空搜索内容
		data.searchText = '';

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

	// 添加获取APP和小程序文章列表高度的方法
	const getMPListHeight = () => {
		// #ifdef APP-PLUS || MP-WEIXIN
		// 由于减小了header高度，从120rpx减少为100rpx
		return 'calc(100vh - 100rpx - var(--status-bar-height) - 100rpx)';
		// #endif
		return '100vh';
	};

	const showUserSettings = ref(false);

	// 添加一个变量，用于标记正在执行特殊操作（如选择头像），期间禁止关闭设置面板
	const isInOperation = ref(false);

	// 修改 user-info 的点击事件处理
	const handleUserClick = (event) => {
		if (event) {
			event.stopPropagation();
		}
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.navigateTo({
				url: '/pages/login/login'
			});
			return;
		}
		
		// 更新最新的用户信息
		const latestUserInfo = uni.getStorageSync('userInfo');
		if (latestUserInfo) {
			// 确保处理头像URL
			if (latestUserInfo.avatar) {
				userInfo.avatar = formatAvatarUrl(latestUserInfo.avatar);
			} else {
				userInfo.avatar = '';
			}
			userInfo.nickname = latestUserInfo.nickname || '';
			userInfo.email = latestUserInfo.email || '';
			userInfo.collectionCount = latestUserInfo.collectionCount || 0;
			userInfo.followCount = latestUserInfo.followCount || 0;
			userInfo.followerCount = latestUserInfo.followerCount || 0;
		}
		
		// 显示设置面板
		nextTick(() => {
			showUserSettings.value = true;
		});
	};

	const handleAvatarChange = (newAvatar) => {
		// 标记操作完成
		isInOperation.value = false;
		
		// 处理头像URL
		const formattedAvatar = formatAvatarUrl(newAvatar);
		userInfo.avatar = formattedAvatar;
		
		// 更新本地存储
		const currentUserInfo = uni.getStorageSync('userInfo') || {};
		uni.setStorageSync('userInfo', {
			...currentUserInfo,
			avatar: newAvatar  // 保存原始URL，因为formatAvatarUrl已经加了baseUrl
		});
	};

	const handleNicknameChange = (newNickname) => {
		userInfo.nickname = newNickname;
		uni.setStorageSync('userInfo', {
			...uni.getStorageSync('userInfo'),
			nickname: newNickname
		});
	};

	const handleLogout = () => {
		uni.removeStorageSync('token');
		uni.removeStorageSync('userInfo');
		userInfo.avatar = '';
		userInfo.nickname = '';
		userInfo.email = '';
		userInfo.collectionCount = 0;
		userInfo.followCount = 0;
		userInfo.followerCount = 0;
		showUserSettings.value = false;
		
		uni.showToast({
			title: '已退出登录',
			icon: 'success'
		});
	};

	/**
	 * 跳转到消息通知页面
	 */
	const goToMessage = () => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}
		
		// #ifdef H5
		// H5环境下，在新窗口打开消息页面
		const currentUrl = window.location.href;
		const baseUrl = currentUrl.split('#')[0];
		const messageUrl = `${baseUrl}#/pages/message/message`;
		window.open(messageUrl, '_blank');
		// #endif
		
		// #ifndef H5
		// 非H5环境下，正常跳转到消息页面
		uni.navigateTo({
			url: '/pages/message/message'
		});
		// #endif
	};

	// 添加全局点击事件监听，点击其他区域关闭设置面板
	onMounted(() => {
		// #ifdef H5
		// 点击其他区域关闭设置面板
		document.addEventListener('click', (event) => {
			if (showUserSettings.value && !isInOperation.value) {
				const settingsPanel = document.querySelector('.user-settings-wrapper');
				if (settingsPanel && !settingsPanel.contains(event.target)) {
					showUserSettings.value = false;
				}
			}
		});
		// #endif
	});

	const handleVisibleChange = (visible) => {
		// 只处理关闭事件
		if (!visible) {
			closeUserSettings();
		}
	};

	const closeUserSettings = () => {
		showUserSettings.value = false;
	};

	// 处理头像选择前的事件
	const handleBeforeAvatarSelect = () => {
		// 标记正在进行头像选择操作，阻止关闭面板
		isInOperation.value = true;
	};

	const navigateToCollection = () => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}
		
		uni.navigateTo({
			url: '/pages/collection/collection'
		});
	};

	const navigateToFollows = () => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}
		
		uni.navigateTo({
			url: '/pages/follows/follows'
		});
	};

	const navigateToFollowers = () => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}
		
		uni.navigateTo({
			url: '/pages/followers/followers'
		});
	};

	/**
	 * 加载用户数据
	 */
	const loadUserData = async () => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			console.log('未登录，不加载用户数据');
			return;
		}

		try {
			// 调用获取用户信息API
			const res = await getUserInfo();
			
			if (res.code === 200 && res.data) {
				// 处理头像URL
				if (res.data.avatar) {
					res.data.avatar = formatAvatarUrl(res.data.avatar);
				}
				
				// 更新本地存储
				uni.setStorageSync('userInfo', res.data);
				
				// 更新响应式数据
				userInfo.avatar = res.data.avatar || '';
				userInfo.nickname = res.data.nickname || '';
				userInfo.email = res.data.email || '';
				userInfo.followCount = res.data.followCount || 0;
				userInfo.followerCount = res.data.followerCount || 0;
				userInfo.collectionCount = res.data.collectionCount || 0;
				
				console.log('用户数据已更新', res.data);
			}
		} catch (error) {
			console.error('获取用户数据失败', error);
		}
	};

	/**
	 * 滚动到顶部 - 控制文章列表滚动
	 */
	const scrollToTop = () => {
		console.log('首页: 执行滚动到顶部方法');
		
		// #ifdef H5
		// 对于H5环境，先尝试全局滚动
		if (window) {
			console.log('首页: 执行全局滚动');
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
			return;
		}
		// #endif
		
		// 如果不是H5环境或window不可用，尝试组件内部滚动
		if (articleListRef.value) {
			console.log('首页: 通过文章列表组件引用执行滚动');
			articleListRef.value.scrollToTop();
			return;
		}
		
		console.warn('首页: 文章列表组件引用不可用，尝试备用方案');
		
		// #ifdef H5
		// 备用方案1: 尝试直接操作DOM - H5环境
		const scrollViewH5 = document.getElementById('article-list-scroll-h5');
		if (scrollViewH5) {
			console.log('首页: 直接操作H5 DOM元素滚动');
			scrollViewH5.scrollTop = 0;
			return;
		}
		
		// 再尝试通过类名查找
		const scrollViewByClass = document.querySelector('.article-scroll');
		if (scrollViewByClass) {
			console.log('首页: 通过类名找到滚动元素');
			scrollViewByClass.scrollTop = 0;
			return;
		}
		// #endif
		
		// 备用方案2: 使用uni-app API
		console.log('首页: 使用uni-app通用API尝试滚动');
		uni.pageScrollTo({
			scrollTop: 0,
			duration: 0
		});
	};

	/**
	 * 处理容器点击事件
	 * 当点击在页面空白区域时，滚动文章列表到顶部
	 */
	const handleContainerClick = (event) => {
		// 处理用户设置面板的关闭逻辑
		if (showUserSettings.value && !isInOperation.value) {
			closeUserSettings();
			return;
		}
		
		// 只有在点击容器本身而不是其子元素时才触发
		if (event.target === event.currentTarget) {
			console.log('首页: 点击页面容器空白区域');
			scrollToTop();
		}
	};
	
	/**
	 * 处理右侧栏点击事件
	 * 在右侧栏的空白区域点击时滚动文章列表到顶部
	 */
	const handleSidebarClick = (event) => {
		// 获取点击的元素
		const target = event.target;
		
		// 检查是否点击在右侧栏的空白区域
		// 不是点击在右侧栏的具体交互元素上
		if (target.classList.contains('right-sidebar')) {
			console.log('首页: 点击右侧栏空白区域');
			scrollToTop();
		}
	};

	/**
	 * 导航到个人中心页面
	 */
	const navigateToMyPage = () => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}
		
		// #ifdef H5
		// H5环境下，在新窗口打开个人中心页面
		const currentUrl = window.location.href;
		const baseUrl = currentUrl.split('#')[0];
		const myPageUrl = `${baseUrl}#/pages/my/my`;
		window.open(myPageUrl, '_blank');
		// #endif
		
		// #ifndef H5
		// 非H5环境下，正常跳转
		uni.navigateTo({
			url: '/pages/my/my'
		});
		// #endif
	};

	/**
	 * 通过双击导航菜单刷新文章列表
	 */
	const refreshByNavDoubleTap = (() => {
		let lastTapTime = 0;
		let lastTapNav = -1;
		
		return (index) => {
			const now = Date.now();
			
			// 如果是同一个导航项，且时间间隔小于500ms，则视为双击
			if (lastTapNav === index && now - lastTapTime < 500) {
				// 刷新当前列表
				refreshArticleList();
				// 重置点击记录
				lastTapTime = 0;
				lastTapNav = -1;
				
				// 显示刷新提示
				uni.showToast({
					title: '刷新中...',
					icon: 'loading',
					duration: 1000
				});
				
				return true;
			}
			
			// 记录本次点击
			lastTapTime = now;
			lastTapNav = index;
			return false;
		};
	})();

	// 新增变量
	const articleList = ref([]); // 文章列表数据
	const isLoading = ref(false); // 加载状态
	const noMoreData = ref(false); // 是否还有更多数据
	const currentPage = ref(1); // 当前页码

	/**
	 * 处理文章摘要，展示纯文本并限制字数
	 */
	const formatArticleSummary = (summary) => {
		if (!summary) return '暂无摘要';
		// 去除HTML标签
		let plainText = summary.replace(/<\/?[^>]+(>|$)/g, '');
		// 限制字数
		const maxLength = 100;
		if (plainText.length > maxLength) {
			plainText = plainText.substring(0, maxLength);
		} 
		return plainText;
	};

	/**
	 * 处理用户关注
	 */
	const handleFollow = (article) => {
		if (!article.author) return;
		
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			return;
		}
		
		// 切换关注状态
		article.author.isFollowed = !article.author.isFollowed;
		
		uni.showToast({
			title: article.author.isFollowed ? '关注成功' : '已取消关注',
			icon: article.author.isFollowed ? 'success' : 'none'
		});
		
		// TODO: 实际关注/取消关注API调用
	};

	/**
	 * 处理文章收藏 - 修改方法名以匹配模板中的方法名
	 */
	const handleCollection = (article) => {
		handleCollect(article);
	};

	/**
	 * 加载文章列表
	 */
	const loadArticleList = () => {
		// 如果已经没有更多数据或正在加载中，则不处理
		if (noMoreData.value || isLoading.value) return;
		
		isLoading.value = true;
		
		// 获取文章列表
		const listType = getListType();
		
		// 构建请求参数
		const params = {
			page: currentPage.value,
			pageSize: 10,
			timestamp: new Date().getTime()
		};
		
		// 根据不同的列表类型设置参数
		if (listType === 'follow') {
			params.type = 'follow';
		} else if (listType === 'hot') {
			params.sort = 'hot';
		} else if (listType === 'new') {
			params.sort = 'new';
		}
		
		console.log('请求参数:', params, '请求类型:', listType);
		
		// 调用API获取文章列表
		http.get('/api/article', params)
			.then(res => {
				if (res.code === 200 && res.data && res.data.list) {
					const newArticles = res.data.list;
					console.log('获取到文章数据:', newArticles.length, '条');
					
					// 处理文章数据
					const processedArticles = newArticles.map(article => {
						// 输出原始数据用于调试
						console.log(`[文章${article.id}] 原始数据:`, Object.keys(article).reduce((acc, key) => {
							if (typeof article[key] !== 'object' || key === 'author') {
								acc[key] = article[key];
							}
							return acc;
						}, {}));
						
						// 记录原始图片相关字段，用于调试
						console.log(`[文章${article.id}] 原始字段:`, 
							Object.keys(article).filter(key => 
								key.includes('cover') || 
								key.includes('image') || 
								key === 'thumbnail'
							));
						
						// 尝试从多种可能的字段名获取封面图片URL
						let coverImage = null;
						
						// 优先级1: coverImage字段
						if (article.coverImage) {
							coverImage = article.coverImage;
							console.log(`[文章${article.id}] 使用coverImage字段:`, coverImage);
						} 
						// 优先级2: cover_image字段
						else if (article.cover_image) {
							coverImage = article.cover_image;
							console.log(`[文章${article.id}] 使用cover_image字段:`, coverImage);
						}
						// 优先级3: thumbnail字段
						else if (article.thumbnail) {
							coverImage = article.thumbnail;
							console.log(`[文章${article.id}] 使用thumbnail字段:`, coverImage);
						}
						// 优先级4: 从文章内容中提取第一张图片
						else if (article.content && article.content.includes('<img')) {
							const imgMatch = article.content.match(/<img[^>]+src=['"]([^'"]+)['"]/);
							if (imgMatch && imgMatch[1]) {
								coverImage = imgMatch[1];
								console.log(`[文章${article.id}] 从内容提取图片:`, coverImage);
							}
						}
						
						// 统一处理封面图片URL
						if (coverImage) {
							// #ifdef APP-PLUS
							// APP环境下特别处理localhost
							if (coverImage.includes('localhost') || coverImage.includes('127.0.0.1')) {
								const appBaseUrl = 'http://10.9.135.132:8080';
								const urlPath = coverImage.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '');
								coverImage = appBaseUrl + urlPath;
								console.log(`[文章${article.id}] APP环境替换localhost: ${coverImage}`);
							}
							// #endif
							
							article.coverImage = formatArticleImage(coverImage);
							console.log(`[文章${article.id}] 处理后的封面图片URL:`, article.coverImage);
						} else {
							article.coverImage = ''; // 确保没有封面时设为空字符串
							console.log(`[文章${article.id}] 无封面图片`);
						}
						
						// 处理作者头像
						if (article.author && article.author.avatar) {
							const originalAvatar = article.author.avatar;
							article.author.avatar = formatAvatarUrl(article.author.avatar);
							console.log(`[文章${article.id}] 作者头像: ${originalAvatar} -> ${article.author.avatar}`);
						} else if (article.author) {
							// 确保author对象存在但avatar为空时也设置默认头像
							article.author.avatar = '/static/images/avatar.png';
							console.log(`[文章${article.id}] 作者头像为空，使用默认头像`);
						} else {
							// 如果作者信息不存在，创建一个基本的author对象
							article.author = {
								nickname: '未知用户',
								avatar: '/static/images/avatar.png',
								isFollowed: false
							};
							console.log(`[文章${article.id}] 缺少作者信息，创建默认作者对象`);
						}
						
						// 处理点赞数、评论数和收藏数，支持多种可能的字段名
						// 点赞数处理
						if (typeof article.likeCount === 'number') {
							// 已经存在likeCount字段，直接使用
							article.likeCount = parseInt(article.likeCount || 0);
						} else if (typeof article.like_count === 'number') {
							// snake_case转换为camelCase
							article.likeCount = parseInt(article.like_count || 0); 
						} else if (typeof article.likes === 'number') {
							// 可能使用复数形式likes
							article.likeCount = parseInt(article.likes || 0);
						} else {
							article.likeCount = 0;
						}

						// 评论数处理
						if (typeof article.commentCount === 'number') {
							article.commentCount = parseInt(article.commentCount || 0);
						} else if (typeof article.comment_count === 'number') {
							article.commentCount = parseInt(article.comment_count || 0);
						} else if (typeof article.comments === 'number') {
							article.commentCount = parseInt(article.comments || 0);
						} else {
							article.commentCount = 0;
						}

						// 收藏数处理 - 完全重写为更彻底的扫描方式
						let collectCountFound = false;

						// 1. 首先尝试直接常见字段名
						const commonCollectFields = ['collectCount', 'collect_count', 'collection_count', 'collectionsCount', 'favorites', 'favorite_count'];
						for (const field of commonCollectFields) {
							if (typeof article[field] === 'number' || (article[field] && !isNaN(parseInt(article[field])))) {
								article.collectCount = parseInt(article[field]);
								console.log(`[文章${article.id}] 找到收藏数字段 ${field}:`, article.collectCount);
								collectCountFound = true;
								break;
							}
						}

						// 2. 如果常见字段没找到，尝试深度扫描整个对象
						if (!collectCountFound) {
							console.log(`[文章${article.id}] 开始深度扫描收藏数字段...`);
							
							// 扫描所有可能与收藏相关的字段
							const collectMatches = findFields(article, key => 
								key.includes('collect') || 
								key.includes('collection') || 
								key.includes('favorite') ||
								key === 'collections'
							);
							
							if (collectMatches.length > 0) {
								console.log(`[文章${article.id}] 深度扫描发现可能的收藏相关字段:`, collectMatches);
								
								// 按优先级处理找到的字段
								const numericMatches = collectMatches.filter(m => 
									typeof m.value === 'number' || 
									(m.value && !isNaN(parseInt(m.value)))
								);
								
								if (numericMatches.length > 0) {
									// 优先使用名称最匹配的字段
									const bestMatch = numericMatches.find(m => 
										m.key === 'collectCount' || 
										m.key === 'collect_count' || 
										m.key === 'collection_count'
									) || numericMatches[0];
									
									article.collectCount = parseInt(bestMatch.value);
									console.log(`[文章${article.id}] 使用深度扫描字段 ${bestMatch.path} 作为收藏数:`, article.collectCount);
									collectCountFound = true;
								}
							}
						}

						// 3. 如果还没找到，尝试从stats或统计对象中获取
						if (!collectCountFound && article.stats && typeof article.stats === 'object') {
							console.log(`[文章${article.id}] 检查stats对象:`, article.stats);
							
							// 从stats对象中查找收藏数
							const statsFields = Object.keys(article.stats).filter(key => 
								key.includes('collect') || 
								key.includes('collection') || 
								key.includes('favorite')
							);
							
							if (statsFields.length > 0) {
								const firstStatField = statsFields[0];
								article.collectCount = parseInt(article.stats[firstStatField]);
								console.log(`[文章${article.id}] 从stats对象获取收藏数 ${firstStatField}:`, article.collectCount);
								collectCountFound = true;
							}
						}

						// 4. 作为最后手段，检查可能包含统计信息的字符串并解析
						if (!collectCountFound) {
							// 遍历所有字符串字段，查找可能包含收藏数据的内容
							Object.keys(article).forEach(key => {
								if (typeof article[key] === 'string' && 
									(key.includes('stat') || key.includes('count') || key.includes('info'))) {
									try {
										const parsedData = JSON.parse(article[key]);
										if (parsedData && typeof parsedData === 'object') {
											const collectKey = Object.keys(parsedData).find(k => 
												k.includes('collect') || k.includes('favorite')
											);
											
											if (collectKey && !isNaN(parseInt(parsedData[collectKey]))) {
												article.collectCount = parseInt(parsedData[collectKey]);
												console.log(`[文章${article.id}] 从字符串 ${key} 解析出收藏数:`, article.collectCount);
												collectCountFound = true;
											}
										}
									} catch (e) {
										// 解析失败，忽略错误
									}
								}
							});
						}

						// 如果经过所有尝试还是没找到有效数据，设为0并记录所有字段用于调试
						if (!collectCountFound) {
							article.collectCount = 0;
							console.log(`[文章${article.id}] 未找到有效的收藏数字段，记录所有顶层字段:`);
							Object.keys(article).forEach(key => {
								if (typeof article[key] !== 'object' || article[key] === null) {
									console.log(`  - ${key}: ${article[key]} (${typeof article[key]})`);
								} else {
									console.log(`  - ${key}: [Object] (${Array.isArray(article[key]) ? 'Array' : 'Object'})`);
								}
							});
						}
						
						// 设置点赞和收藏状态
						article.isLiked = !!article.isLiked || !!article.is_liked || false;
						article.isCollected = !!article.isCollected || !!article.is_collected || !!article.is_favorite || false;
						
						console.log(`[文章${article.id}] 处理后的数据:`, {
							likeCount: article.likeCount,
							commentCount: article.commentCount,
							collectCount: article.collectCount,
							isLiked: article.isLiked,
							isCollected: article.isCollected
						});
						
						return article;
					});
					
					// 第一页时替换列表，否则追加
					if (currentPage.value === 1) {
						articleList.value = processedArticles;
					} else {
						articleList.value = [...articleList.value, ...processedArticles];
					}
					
					// 更新页码
					currentPage.value++;
					
					// 判断是否还有更多数据
					if (!newArticles.length || newArticles.length < 10) {
						noMoreData.value = true;
					}
					
					// 加载完成后同步收藏状态
					setTimeout(() => {
						syncCollectionStatus();
					}, 300);
				} else {
					uni.showToast({
						title: res.message || '获取文章列表失败',
						icon: 'none'
					});
				}
			})
			.catch(err => {
				console.error('获取文章列表异常:', err);
				uni.showToast({
					title: '网络异常，请稍后再试',
					icon: 'none'
				});
			})
			.finally(() => {
				isLoading.value = false;
				if (data.isRefreshing) {
					data.isRefreshing = false;
				}
			});
	};

	/**
	 * 处理文章封面图片URL
	 * @param {String} url - 图片URL
	 * @return {String} 处理后的图片URL
	 */
	const formatArticleImage = (url) => {
		console.log('[封面处理] 输入图片URL:', url);
		if (!url) {
			console.log('[封面处理] 空URL，返回空字符串');
			return '';
		}
		
		// 移除URL中可能存在的多余空格
		url = url.trim();
		
		// 确保不是null或undefined字符串
		if (url === 'null' || url === 'undefined' || url === '') {
			console.log('[封面处理] 无效URL值，返回空字符串');
			return '';
		}
		
		// APP环境特殊处理
		// #ifdef APP-PLUS
		console.log('[封面处理] 检测到APP环境，应用特殊处理');
		
		// 使用特定的APP环境基础URL - 直接使用与request.js相同的地址
		const appBaseUrl = 'http://10.9.135.132:8080';
		
		// 完整URL处理：如果已经是完整URL，需要特别处理localhost情况
		if (url.startsWith('http')) {
			// 检查是否包含localhost或127.0.0.1，需要替换为真实IP
			if (url.includes('localhost') || url.includes('127.0.0.1')) {
				// 保留路径部分，替换主机部分
				const urlPath = url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '');
				const newUrl = appBaseUrl + urlPath;
				console.log(`[封面处理] APP-替换localhost: ${url} -> ${newUrl}`);
				return newUrl;
			}
			
			// 检查并修复双斜杠问题
			if (url.includes('//uploads')) {
				url = url.replace('//uploads', '/uploads');
				console.log('[封面处理] APP-修复双斜杠问题，结果:', url);
			}
			console.log('[封面处理] APP-返回完整URL:', url);
			return url;
		}
		// 静态资源处理：如果是静态资源路径则不处理
		else if (url.startsWith('/static')) {
			console.log('[封面处理] APP-返回静态资源路径:', url);
			return url;
		}
		
		// 处理文章图片路径
		if (url.includes('articles') || url.includes('thumbnails')) {
			// 提取文件名
			const fileName = url.split('/').pop();
			// 构建完整路径，使用APP专用的基础URL
			let fullUrl;
			if (url.includes('thumbnails')) {
				fullUrl = appBaseUrl + '/uploads/articles/thumbnails/' + fileName;
			} else {
				fullUrl = appBaseUrl + '/uploads/articles/' + fileName;
			}
			console.log('[封面处理] APP-构建文章图片完整路径:', fullUrl);
			return fullUrl;
		} else {
			// 默认假设是文章图片
			let fullUrl;
			if (url.startsWith('/')) {
				fullUrl = appBaseUrl + url;
			} else {
				fullUrl = appBaseUrl + '/uploads/articles/' + url;
			}
			console.log('[封面处理] APP-构建默认文章图片路径:', fullUrl);
			return fullUrl;
		}
		// #endif
		
		// 非APP环境的处理
		// 完整URL处理：如果已经是完整URL（包含http）则不处理
		if (url.startsWith('http')) {
			// 检查并修复双斜杠问题
			if (url.includes('//uploads')) {
				url = url.replace('//uploads', '/uploads');
				console.log('[封面处理] 修复双斜杠问题，结果:', url);
			}
			console.log('[封面处理] 返回完整URL:', url);
			return url;
		}
		// 静态资源处理：如果是静态资源路径则不处理
		else if (url.startsWith('/static')) {
			console.log('[封面处理] 返回静态资源路径:', url);
			return url;
		}
		
		// 处理封面图片特殊路径：检查是否包含特定路径
		if (url.includes('articles') || url.includes('thumbnails')) {
			// 如果包含articles或thumbnails但没有完整路径，尝试构建完整路径
			if (!url.startsWith('/uploads')) {
				// 提取文件名
				const fileName = url.split('/').pop();
				console.log('[封面处理] 文件名:', fileName);
				// 构建完整路径 - 优先检查是否是缩略图路径
				if (url.includes('thumbnails')) {
					const fullUrl = getBaseUrl() + '/uploads/articles/thumbnails/' + fileName;
					console.log('[封面处理] 构建缩略图完整路径:', fullUrl);
					return fullUrl;
				} else {
					const fullUrl = getBaseUrl() + '/uploads/articles/' + fileName;
					console.log('[封面处理] 构建文章图片完整路径:', fullUrl);
					return fullUrl;
				}
			}
		}
		
		// 其他情况：添加基础URL前缀
		let fullUrl;
		if (url.startsWith('/')) {
			fullUrl = getBaseUrl() + url;
		} else {
			// 默认情况下，假设图片在articles目录
			fullUrl = getBaseUrl() + '/uploads/articles/' + url;
		}
		console.log('[封面处理] 构建其他情况完整URL:', fullUrl);
		return fullUrl;
	};

	/**
	 * 处理下拉刷新
	 */
	const handleRefresh = () => {
		data.isRefreshing = true;
		currentPage.value = 1;
		noMoreData.value = false;
		
		// 根据当前模式执行不同的刷新操作
		if (data.currentNav === -1) {
			// 搜索模式下重新搜索
			searchArticles(data.searchText, {
				page: 1,
				pageSize: 10
			}).then(res => {
				if (res.code === 200 && res.data) {
					// 处理搜索结果
					const searchResults = res.data.list || [];
					
					// 处理搜索结果数据
					const processedArticles = searchResults.map(article => {
						// 处理作者头像
						if (article.author && article.author.avatar) {
							article.author.avatar = formatAvatarUrl(article.author.avatar);
						}
						
						// 处理封面图片
						if (article.coverImage) {
							article.coverImage = formatArticleImage(article.coverImage);
						}
						
						// 处理收藏和点赞状态
						article.isLiked = !!article.isLiked;
						article.isCollected = !!article.isCollected;
						
						return article;
					});
					
					// 更新文章列表
					articleList.value = processedArticles;
					
					// 更新页码
					currentPage.value = 2;
					
					// 判断是否还有更多数据
					if (searchResults.length < 10) {
						noMoreData.value = true;
					}
				} else {
					// 处理搜索失败
					uni.showToast({
						title: res.message || '刷新搜索结果失败',
						icon: 'none'
					});
				}
			}).catch(err => {
				console.error('刷新搜索结果失败:', err);
				uni.showToast({
					title: '网络异常，请稍后再试',
					icon: 'none'
				});
			}).finally(() => {
				data.isRefreshing = false;
			});
		} else {
			// 普通模式下刷新文章列表
		loadArticleList();
		}
	};

	/**
	 * 处理加载更多
	 */
	const handleLoadMore = () => {
		// 如果处于搜索模式且还有更多数据
		if (data.currentNav === -1 && !noMoreData.value && !isLoading.value) {
			// 搜索结果加载更多
			loadMoreSearchResults();
		} else {
			// 普通模式下加载更多
		loadArticleList();
		}
	};

	// 加载更多搜索结果
	const loadMoreSearchResults = () => {
		// 如果已经没有更多数据或正在加载中，则不处理
		if (noMoreData.value || isLoading.value) return;
		
		isLoading.value = true;
		
		// 调用搜索API
		searchArticles(data.searchText, {
			page: currentPage.value,
			pageSize: 10
		}).then(res => {
			if (res.code === 200 && res.data) {
				// 处理搜索结果
				const searchResults = res.data.list || [];
				
				// 如果没有更多结果
				if (searchResults.length === 0) {
					noMoreData.value = true;
					isLoading.value = false;
					return;
				}
				
				// 处理搜索结果数据
				const processedArticles = searchResults.map(article => {
					// 处理作者头像
					if (article.author && article.author.avatar) {
						article.author.avatar = formatAvatarUrl(article.author.avatar);
					}
					
					// 处理封面图片
					if (article.coverImage) {
						article.coverImage = formatArticleImage(article.coverImage);
					}
					
					// 处理收藏和点赞状态
					article.isLiked = !!article.isLiked;
					article.isCollected = !!article.isCollected;
					
					return article;
				});
				
				// 追加到文章列表
				articleList.value = [...articleList.value, ...processedArticles];
				
				// 更新页码
				currentPage.value++;
				
				// 判断是否还有更多数据
				if (searchResults.length < 10) {
					noMoreData.value = true;
				}
			} else {
				// 处理搜索失败
				uni.showToast({
					title: res.message || '获取更多搜索结果失败',
					icon: 'none'
				});
			}
		}).catch(err => {
			console.error('获取更多搜索结果失败:', err);
			uni.showToast({
				title: '网络异常，请稍后再试',
				icon: 'none'
			});
		}).finally(() => {
			isLoading.value = false;
		});
	};

	// 监听导航切换，重新加载数据
	watch(() => data.currentNav, () => {
		// 如果是搜索状态(-1)，则无需重新加载数据
		if (data.currentNav === -1) {
			return;
		}
		
		currentPage.value = 1;
		noMoreData.value = false;
		articleList.value = [];
		loadArticleList();
	});

	// 页面加载时初始化数据
	onLoad(() => {
		console.log('页面加载:');
		// 先加载文章列表
		loadArticleList();
		
		// 文章列表加载完成后，同步收藏状态
		setTimeout(() => {
			syncCollectionStatus();
		}, 500);
	});

	/**
	 * 处理图片加载错误
	 */
	const handleImageError = (article) => {
		console.error(`文章[${article.id}]封面图片加载失败:`, article.coverImage);
		
		// 修复可能的URL错误，重新尝试格式化
		if (article.coverImage) {
			const originalUrl = article.coverImage;
			
			// #ifdef APP-PLUS
			// APP中特殊处理localhost问题
			if (originalUrl.includes('localhost') || originalUrl.includes('127.0.0.1')) {
				// 使用特定的APP环境基础URL
				const appBaseUrl = 'http://10.9.135.132:8080';
				// 提取路径部分，替换主机部分
				const urlPath = originalUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '');
				article.coverImage = appBaseUrl + urlPath;
				console.log(`[图片错误] APP-替换localhost: ${originalUrl} -> ${article.coverImage}`);
				return;
			}
			// #endif
			
			// 通用错误处理
			article.coverImage = formatArticleImage(article.coverImage);
			console.log(`尝试修复封面URL: ${originalUrl} -> ${article.coverImage}`);
		}
	};

	/**
	 * 处理用户头像加载错误
	 */
	const handleUserAvatarError = (index) => {
		console.error(`文章[${articleList.value[index]?.id}]作者头像加载失败:`, articleList.value[index]?.author?.avatar);
		// 设置默认头像
		if (articleList.value[index] && articleList.value[index].author) {
			articleList.value[index].author.avatar = '/static/images/avatar.png';
		}
	};

	/**
	 * 深度扫描对象寻找特定模式的字段，返回所有匹配的路径和值
	 * @param {Object} obj - 要扫描的对象
	 * @param {Function} matcher - 匹配函数，接收字段名并返回是否匹配
	 * @param {String} parentPath - 父路径，用于构建完整路径
	 * @param {Array} results - 结果数组
	 */
	const findFields = (obj, matcher, parentPath = '', results = []) => {
		if (!obj || typeof obj !== 'object') return results;
		
		Object.keys(obj).forEach(key => {
			const value = obj[key];
			const path = parentPath ? `${parentPath}.${key}` : key;
			
			// 检查当前字段是否匹配
			if (matcher(key)) {
				results.push({ path, key, value, type: typeof value });
			}
			
			// 递归检查子对象，但跳过数组和null
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				findFields(value, matcher, path, results);
			}
		});
		
		return results;
	};

	/**
	 * 同步文章收藏状态和数量
	 * 从本地存储和详情页同步收藏信息到首页列表
	 */
	const syncCollectionStatus = () => {
		if (!articleList.value || articleList.value.length === 0) {
			return;
		}
		
		console.log('同步文章收藏状态...');
		
		// 获取本地存储的收藏文章ID列表
		const collectedArticles = uni.getStorageSync('collectedArticles') || {};
		console.log('本地存储的收藏文章:', Object.keys(collectedArticles));
		
		// 更新文章列表中的收藏状态
		articleList.value.forEach(article => {
			if (!article) return;
			
			const articleId = String(article.id);
			const originalIsCollected = article.isCollected;
			
			// 从本地存储获取收藏状态
			article.isCollected = !!collectedArticles[articleId];
			
			// 如果状态不一致，尝试获取详情
			if (article.isCollected !== originalIsCollected || article.collectCount === 0) {
				console.log(`文章[${articleId}]收藏状态需要更新:`, {
					old: originalIsCollected,
					new: article.isCollected
				});
				
				// 尝试直接更新收藏数
				// 如果是收藏状态但收藏数为0，增加收藏数
				if (article.isCollected && article.collectCount === 0) {
					console.log(`文章[${articleId}]收藏状态为true但收藏数为0，设置为1`);
					article.collectCount = 1;
				}
				
				// 延迟异步请求文章详情以避免批量请求
				setTimeout(() => {
					// 获取文章详情以获取准确的收藏状态和数量
					getArticleDetail(articleId)
						.then(res => {
							if (res.code === 200 && res.data) {
								// 更新UI
								article.isCollected = !!res.data.isCollected;
								
								// 更新收藏数
								if (res.data.collectCount !== undefined) {
									article.collectCount = parseInt(res.data.collectCount) || 0;
									console.log(`从详情更新文章[${articleId}]收藏数:`, article.collectCount);
								}
							}
						})
						.catch(err => {
							console.error(`获取文章[${articleId}]详情失败:`, err);
						});
				}, Math.random() * 2000); // 随机延迟，避免同时发起多个请求
			}
		});
	};

	// 页面显示时同步收藏状态
	onShow(() => {
		// 如果已经有文章列表数据，同步收藏状态
		if (articleList.value && articleList.value.length > 0) {
			console.log('页面显示: 同步收藏状态');
			syncCollectionStatus();
		}
	});

	/**
	 * 清除搜索内容，返回推荐列表
	 */
	const clearSearch = () => {
		// 清空搜索内容
		data.searchText = '';
		// 切换回推荐标签
		data.currentNav = 1;
		// 重新加载文章列表
		currentPage.value = 1;
		noMoreData.value = false;
		articleList.value = [];
		loadArticleList();
	};
</script>

<style lang="scss">
	page {
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	// #ifdef H5
	.uni-page-wrapper,
	.uni-page-body {
		height: auto !important;
		min-height: 100vh;
	}
	// #endif

	.container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		// #ifdef H5
		min-width: 1000px;
		// #endif
		// #ifndef H5
		min-width: 100%;
		width: 100%;
		overflow-x: hidden;
		// #endif
		overflow: visible;
	}

	// 顶部导航栏
	.header-fixed {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background-color: #fff;
		z-index: 100;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		// #ifdef H5
		min-width: 1000px;
		// #endif

		.header-top {
			display: flex;
			align-items: center;
			height: 60px;
			padding: 0 20px;
			// #ifdef H5
			max-width: 1200px;
			min-width: 960px;
			// #endif
			margin: 0 auto;
			justify-content: center;
			gap: 20px;

			.logo {
				font-size: 18px;
				font-weight: bold;
				color: #333;
				padding: 0 15px;
				white-space: nowrap;
			}

			.search-bar {
				flex: 0 1 400px;
				display: flex;
				align-items: center;
				background: #f5f5f5;
				border-radius: 4px;
				padding: 0 15px;
				margin: 0 10px;

				input {
					flex: 1;
					height: 36px;
					font-size: 14px;
					background: transparent;
					border: none;
				}

				.search-btn {
					padding: 0 15px;
					height: 32px;
					line-height: 32px;
					font-size: 14px;
					color: #fff;
					background: #4361ee;
					border-radius: 4px;
					margin-left: 10px;
				}
			}

			.header-right {
				display: flex;
				align-items: center;
				gap: 15px;
				white-space: nowrap;

				.notification {
					cursor: pointer;
					padding: 0 5px;
				}

				.user-info {
					display: flex;
					align-items: center;
					gap: 8px;
					position: relative;
					cursor: pointer;
					padding: 4px 8px;
					border-radius: 20px;
					transition: background-color 0.3s;
					
					&:hover {
						background-color: #f5f5f5;
					}

					.avatar {
						width: 32px;
						height: 32px;
						border-radius: 50%;
						object-fit: cover;
						border: 1px solid #eee;
					}

					.nickname {
						font-size: 14px;
						color: #333;
						max-width: 100px;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
				}
			}
		}

		.nav-menu {
			height: 46px;
			border-top: 1px solid #f0f0f0;
			display: flex;
			align-items: center;
			justify-content: flex-start;
			// #ifdef H5
			max-width: 1200px;
			// #endif
			margin: 0 auto;
			padding: 0;

			.nav-item {
				padding: 0 25px;
				font-size: 16px;
				color: #666;
				position: relative;
				cursor: pointer;
				transition: color 0.3s;
				
				&:first-child {
					// #ifdef H5
					margin-left: 150px;
					// #endif
					// #ifndef H5
					margin-left: 0;
					// #endif
				}

				&.active {
					color: #4361ee;
					font-weight: bold;

					&::after {
						content: '';
						position: absolute;
						bottom: -13px;
						left: 50%;
						transform: translateX(-50%);
						width: 24px;
						height: 3px;
						background-color: #4361ee;
						border-radius: 1.5px;
					}
				}

				&:hover {
					color: #4361ee;
				}
			}
		}
	}

	// 内容区域
	.content-area {
		display: flex;
		justify-content: space-between;
		// #ifdef H5
		max-width: 1200px;
		min-width: 960px;
		// #endif
		margin: 0 auto;
		padding: 106px 20px 20px;
		gap: 0;
		position: relative;
		min-height: calc(100vh - 106px);

		.left-sidebar {
			position: sticky;
			top: 106px;
			width: 110px;
			height: calc(100vh - 106px);
			background: transparent;
		}

		.main-content {
			flex: 1;
			// #ifdef H5
			min-width: 600px;
			// #endif
			background: #fff;
			border-radius: 4px 0 0 4px;
			padding: 20px;
			// #ifdef H5
			margin-left: 130px;
			// #endif
			margin-right: 0;
			min-height: 200px;
		}

		.right-sidebar {
			position: sticky;
			top: 106px;
			width: 300px;
			// #ifdef H5
			min-width: 280px;
			// #endif
			height: fit-content;
			background: transparent;
			margin-left: 0;
			padding-top: 0;
			
			.creator-center {
				position: sticky;
				top: 106px;
				background: #fff;
				border-radius: 0 4px 4px 0;
				box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
				
				.creator-header {
					display: flex;
					align-items: center;
					padding: 20px;
					border-bottom: 1px solid #f0f0f0;
					
					text {
						font-size: 16px;
						font-weight: bold;
						color: #333;
						margin-left: 10px;
					}
				}
				
				.write-btn {
					display: flex;
					align-items: center;
					justify-content: center;
					margin: 10px 20px 0 20px;
					height: 40px;
					background: #4361ee;
					color: #fff;
					border-radius: 4px;
					font-size: 14px;
					transition: all 0.3s;
					&:hover {
						background: #3651d4;
						transform: translateY(-2px);
						box-shadow: 0 4px 12px rgba(67, 97, 238, 0.2);
					}
					
					text {
						margin-left: 8px;
					}
				}
			}
			
			.user-stats {
				position: sticky;
				top: 286px;
				background: #fff;
				border-radius: 0 4px 4px 0;
				margin-bottom: 20px;
				box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
				padding: 20px;
				
				.stat-item {
					display: flex;
					align-items: center;
					padding: 15px 0;
					cursor: pointer;
					transition: all 0.5s ease;
					
					&:not(:last-child) {
						border-bottom: 1px solid #f0f0f0;
					}
					
					&:hover {
						background: #f8f9fa;
						padding-left: 10px;
					}
					
					text {
						font-size: 14px;
						color: #333;
						margin-left: 10px;
						
						&.count {
							margin-left: auto;
							color: #666;
						}
					}
					
					&.animated-stat {
						position: relative;
						padding-left: 15px;
						
						&::before {
							content: '';
							position: absolute;
							left: 0;
							top: 50%;
							transform: translateY(-50%) scaleY(0);
							width: 3px;
							height: 70%;
							background-color: #4361ee;
							transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
							transform-origin: center center;
							border-radius: 2px;
						}
						
						&:hover::before {
							transform: translateY(-50%) scaleY(1);
						}
						
						&:active::before {
							background-color: #3651d4;
							transform: translateY(-50%) scaleY(1.1);
							transition: all 0.3s ease;
						}
					}
				}
			}
		}
	}

	// 全局禁用滚动条
	::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	// 添加全局滚动条样式
	::-webkit-scrollbar-thumb {
		background: #ddd;
		border-radius: 3px;
	}
	
	::-webkit-scrollbar-track {
		background: #f5f5f5;
	}

	// 响应式布局
	@media screen and (max-width: 1200px) {
		.content-area {
			.left-sidebar {
				display: none;
			}
			.main-content {
				margin-left: 20px;
			}
			.right-sidebar {
				right: 50px;
			}
		}
	}

	@media screen and (max-width: 960px) {
		.content-area {
			.main-content {
				margin-right: 20px;
			}
			.right-sidebar {
				display: none;
			}
		}
	}

	// APP和小程序的样式
	// #ifndef H5
	.mp-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
		background-color: #f5f5f5;

		.search-bar {
			display: flex;
			align-items: center;
			padding: 15rpx 20rpx;
			padding-top: calc(15rpx + var(--status-bar-height));
			background: #fff;
			
			input {
				flex: 1;
				height: 70rpx;
				background: #f5f5f5;
				border-radius: 35rpx;
				padding: 0 30rpx;
				font-size: 28rpx;
			}
			
			.search-btn {
				margin-left: 20rpx;
				height: 70rpx;
				line-height: 70rpx;
				background-color: #4361ee;
				color: #fff;
				font-size: 28rpx;
				border-radius: 35rpx;
				padding: 0 30rpx;
			}
		}

		.nav-menu {
			display: flex;
			align-items: center;
			padding: 10rpx 0;
			overflow-x: auto;
			white-space: nowrap;
			background-color: #f5f5f5;
			border-bottom: 1rpx solid #f0f0f0;
			
			.nav-item {
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

	.mp-content {
		padding-top: calc(var(--status-bar-height) + 150rpx); /* 调整内容区域的顶部间距 */
		background: #f5f5f5;
		width: 100%;
		
		.article-list {
			height: calc(100vh - 212rpx); // 减去顶部导航栏高度
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
					margin: 0;
					
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
					margin-bottom: 15rpx;
					display: block;
					line-height: 1.4;
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
					position: relative;
					
					.single-image {
						width: 100%;
						height: 100%;
						background-color: #f5f5f5;
					}
					
					.debug-info {
						position: absolute;
						bottom: 0;
						left: 0;
						right: 0;
						background: rgba(0,0,0,0.5);
						color: #fff;
						font-size: 20rpx;
						padding: 4rpx 10rpx;
						word-break: break-all;
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
					
					text {
						font-size: 24rpx;
						color: #666;
						margin-left: 6rpx;
						
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
			padding-bottom: 120rpx; // 增加底部间距，确保在底部导航栏上方可见
		}
	}
	// #endif

	.settings-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: 9998;
	}

	.user-settings {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 9999;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		
		.settings-header {
			padding: 16px 20px;
			border-bottom: 1px solid #eee;
			display: flex;
			align-items: center;
			justify-content: space-between;
			
			.title {
				font-size: 16px;
				font-weight: bold;
				color: #333;
			}
			
			.close-btn {
				cursor: pointer;
				width: 32px;
				height: 32px;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 4px;
				
				&:hover {
					background: #f5f5f5;
				}
			}
		}
		
		.settings-body {
			flex: 1;
			overflow: hidden;
			
			:deep(.user-settings-wrapper) {
				height: 100%;
				background: transparent;
				overflow: hidden;
				
				.mask {
					display: none;
				}
				
				.settings-panel {
					position: relative;
					top: 0;
					right: 0;
					width: 100%;
					height: auto;
					max-height: 70vh;
					box-shadow: none;
					border-radius: 0;
					transform: none !important;
					transition: none !important;
					
					&.visible {
						transform: none !important;
					}
					
					.panel-header {
						display: none;
					}
					
					.panel-content,
					.nickname-edit-panel,
					.logout-confirm-panel {
						padding: 20px;
						overflow-y: auto;
						
						.settings-item {
							padding: 15px;
							border-bottom: 1px solid #f0f0f0;
							
							&:last-child {
								border-bottom: none;
							}
							
							.item-label {
								font-size: 14px;
								color: #333;
							}
							
							.item-content {
								margin-top: 10px;
							}
						}
					}
				}
			}
		}
	}

	// 添加水平滚动条样式
	// #ifdef H5
	html {
		overflow-y: scroll;
		overflow-x: auto;
		min-width: 1000px;
		
		&::-webkit-scrollbar {
			width: 6px;
			height: 6px;
		}

		&::-webkit-scrollbar-thumb {
			background: #ddd;
			border-radius: 3px;
			
			&:hover {
				background: #bbb;
			}
		}

		&::-webkit-scrollbar-track {
			background: #f5f5f5;
		}
	}

	body {
		min-width: 1000px;
	}
	// #endif

	// 添加"我的"链接悬停和点击动画效果
	.my-link {
		font-size: 16px;
		color: #666;
		padding: 0 15px;
		white-space: nowrap;
		position: relative;
		transition: all 0.5s ease;
		
		&.hover-effect {
			cursor: pointer;
			
			&::after {
				content: '';
				position: absolute;
				bottom: -8px;
				left: 50%;
				transform: translateX(-50%) scaleX(0);
				width: 20px;
				height: 2px;
				background-color: #4361ee;
				transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
			}
			
			&:hover {
				color: #4361ee;
				
				&::after {
					transform: translateX(-50%) scaleX(1);
				}
			}
		}
	}

	.my-link-active {
		transform: scale(0.95);
		color: #4361ee !important;
		font-weight: bold;
	}

	// APP和小程序样式增强
	// #ifndef H5
	.mp-header {
		.mp-top-nav {
			.mp-logo, .mp-my-btn {
				position: relative;
				transition: all 0.2s ease;
				border-radius: 8rpx;
				padding: 10rpx 20rpx;
				
				&::after {
					content: '';
					position: absolute;
					bottom: -4rpx;
					left: 50%;
					transform: translateX(-50%) scaleX(0);
					width: 40rpx;
					height: 4rpx;
					background-color: #4361ee;
					transition: transform 0.3s ease;
				}
				
				&:hover {
					color: #4361ee;
				}
			}
			
			.mp-my-btn {
				position: relative;
				overflow: hidden;
				border-radius: 30rpx;
				
				&::before {
					content: '';
					position: absolute;
					top: 50%;
					left: 50%;
					width: 100%;
					height: 100%;
					background: rgba(67, 97, 238, 0.1);
					border-radius: 30rpx;
					transform: translate(-50%, -50%) scale(0);
					transition: transform 0.3s ease;
				}
				
				&:hover::before {
					transform: translate(-50%, -50%) scale(1);
				}
			}
		}
	}

	.mp-nav-active {
		transform: scale(0.9);
		color: #4361ee !important;
		font-weight: bold;
	}
	// #endif

	// 添加禁用时的样式
	.my-link.disabled, .mp-my-btn.disabled {
		opacity: 0.6;
		cursor: not-allowed;
		
		&:hover {
			transform: none;
			color: #666;
		}
	}

	// #ifndef H5
	// 小程序和APP的样式
	.content-area.mp-content {
		padding: 20rpx;
		padding-top: calc(var(--status-bar-height) + 85rpx); /* 进一步减少顶部间距 */
		background: #f5f5f5;
		flex: 1;
		box-sizing: border-box;
		
		.article-list {
			height: calc(100vh - 85rpx - var(--status-bar-height)); /* 匹配header高度 */
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
					margin: 0;
					
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
					margin-bottom: 15rpx;
					display: block;
					line-height: 1.4;
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
					position: relative;
					
					.single-image {
						width: 100%;
						height: 100%;
						background-color: #f5f5f5;
					}
					
					.debug-info {
						position: absolute;
						bottom: 0;
						left: 0;
						right: 0;
						background: rgba(0,0,0,0.5);
						color: #fff;
						font-size: 20rpx;
						padding: 4rpx 10rpx;
						word-break: break-all;
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
					
					text {
						font-size: 24rpx;
						color: #666;
						margin-left: 6rpx;
						
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
			padding-bottom: 120rpx; // 增加底部间距，确保在底部导航栏上方可见
		}
	}
	// #endif

	// APP和小程序样式增强
	// #ifndef H5
	// 固定在顶部的标题和分类栏
	.header-main-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		gap: 0; /* 减少垂直间隔 */
		padding: 0;
		margin: 0; /* 确保外边距为0 */
		padding-top: var(--status-bar-height); /* 仅保留状态栏高度的内边距 */
		background: #f5f5f5;
		z-index: 100;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		
		// 顶部区域
		.header-top {
			display: flex;
			align-items: center;
			padding: 15rpx 20rpx; /* 保持左右内边距 */
			padding-top: 5rpx; /* 减少顶部内边距 */
			padding-bottom: 5rpx; /* 减少底部内边距 */
			margin: 0; /* 确保外边距为0 */
			
			// 搜索栏样式
			.search-bar {
				display: flex;
				align-items: center;
				background: #fff;
				border-radius: 45rpx;
				overflow: hidden;
				padding: 0 15rpx;
				flex: 1;
				box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
				height: 80rpx;
				margin: 0; /* 确保外边距为0 */
				
				input {
					flex: 1;
					height: 80rpx;
					padding: 0 25rpx;
					font-size: 32rpx;
					margin: 0; /* 确保外边距为0 */
				}
			}
			
			// 搜索按钮
			.search-btn {
				height: 70rpx;
				line-height: 70rpx;
				margin: 0 0 0 15rpx;
				background-color: #4361ee;
				color: #fff;
				font-size: 30rpx;
				border-radius: 35rpx;
				padding: 0 30rpx;
			}
		}
		
		// 分类标签导航
		.category-scroll {
			width: 100%;
			white-space: nowrap;
			background-color: #f5f5f5;
			padding: 5rpx 0; /* 减少上下内边距 */
			margin: 0; /* 确保外边距为0 */
			
			.category-list {
				display: inline-flex;
				padding: 0 20rpx;
				margin: 0; /* 确保外边距为0 */
				
				.category-item {
					padding: 8rpx 25rpx; /* 减少上下内边距 */
					margin: 0 10rpx;
					font-size: 30rpx;
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

	// 内容区域样式调整 - 也需要修改顶部间距以适应更大的搜索框
	.content-area.mp-content {
		padding: 20rpx;
		padding-top: calc(var(--status-bar-height) + 170rpx); /* 进一步增加顶部间距，避免被菜单栏遮挡 */
		background: #f5f5f5;
		flex: 1;
		box-sizing: border-box;
		
		.article-list {
			height: calc(100vh - 170rpx - var(--status-bar-height)); /* 匹配调整后的header高度 */
		}
	}
	// #endif

	// 添加点赞和收藏的动画效果
	.animate-icon {
		animation: scale-bounce 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	@keyframes scale-bounce {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.5);
		}
		70% {
			transform: scale(0.8);
		}
		85% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	// 优化点赞和收藏文字样式
	.action-item {
		text {
			&.liked {
				color: #ff6b6b !important;
				font-weight: bold;
				transition: all 0.3s ease;
			}
			
			&.collected {
				color: #ffc107 !important;
				font-weight: bold;
				transition: all 0.3s ease;
			}
		}
		
		// 增加点击反馈
		&:active {
			transform: scale(0.95);
		}
	}

	// 搜索状态
	.search-status {
		padding: 20rpx;
		background-color: #fff;
		border-radius: 10rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		
		.search-info {
			display: flex;
			align-items: center;
			justify-content: space-between;
			
			text {
				font-size: 28rpx;
				color: #666;
			}
			
			.clear-search {
				display: flex;
				align-items: center;
				cursor: pointer;
				padding: 10rpx;
				border-radius: 8rpx;
				transition: all 0.3s;
				
				&:hover {
					background-color: #f5f5f5;
				}
				
				&:active {
					transform: scale(0.95);
				}
				
				text {
					font-size: 24rpx;
					color: #999;
					margin-left: 10rpx;
				}
			}
		}
	}
</style>