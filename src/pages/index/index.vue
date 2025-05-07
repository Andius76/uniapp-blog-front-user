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
		<view class="mp-header">
			<!-- 添加顶部导航按钮 -->
			<view class="mp-top-nav">
				<view class="mp-logo" hover-class="mp-nav-active" @click="refreshArticleList">首页</view>
				<view class="mp-my-btn" hover-class="mp-nav-active" @click="navigateToMyPage">我的</view>
			</view>
			<!-- 搜索框 -->
			<view class="search-bar">
				<input type="text" placeholder="请输入搜索内容" v-model="data.searchText" @confirm="handleSearch" />
				<button class="search-btn" @click="handleSearch">搜索</button>
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

		<!-- 内容区域 -->
		<!-- #ifdef H5 -->
		<view class="content-area">
			<!-- 左侧空白区域 -->
			<view class="left-sidebar"></view>

			<!-- 中间文章列表区域 -->
			<view class="main-content">
				<ArticleList 
					ref="articleListRef"
					:key="data.currentNav"
					:list-type="getListType()"
					:use-global-scroll="true"
					:empty-text="'暂无文章内容'"
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
		<view class="mp-content">
			<ArticleList 
				ref="articleListRef"
				:key="data.currentNav"
				:list-type="getListType()"
				:height="getMPListHeight()"
				:empty-text="'暂无文章内容'"
				@article-click="viewArticleDetail"
				@like="handleLike"
				@share="handleShare"
				@comment="handleComment"
				@collect="handleCollect"
			/>
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
	import { getArticleDetail } from '@/api/article';
	import { getUserInfo } from '@/api/user'; // 导入getUserInfo接口
	import { onLoad, onShow } from '@dcloudio/uni-app';
	// 导入ArticleList组件
	import ArticleList from '@/components/article-list/article-list.vue';
	import UserSettings from '@/components/user-settings/user-settings.vue';
	// 导入回到顶部组件
	import BackToTop from '@/components/back-to-top/back-to-top.vue';
	import http from '@/utils/request';
	import { getBaseUrl } from '@/utils/request'; // 引入统一的getBaseUrl函数

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
	});

	// 组件卸载时清理监听器
	onUnmounted(() => {
		// 清理工作已经在BackToTop组件中处理
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
		// 因为在页面index里，评论点击应该是在当前页面就处理完成
		// 避免导航到两个地方的问题，这里只调用viewArticleDetail
		viewArticleDetail(article.id);
		
		// 不再执行下面的代码，防止双重导航
		return;
		
		/* 注释掉原来的代码，避免双重导航
		// #ifdef H5
		// H5环境下，在新窗口打开文章详情页
		const currentUrl = window.location.href;
		const baseUrl = currentUrl.split('#')[0];
		const detailUrl = `${baseUrl}#/pages/article-detail/article-detail?id=${article.id}&scrollToComments=true`;
		window.open(detailUrl, '_blank');
		// #endif
		
		// #ifndef H5
		// 非H5环境下，正常跳转到文章详情页
		uni.navigateTo({
			url: `/pages/article-detail/article-detail?id=${article.id}&scrollToComments=true`
		});
		// #endif
		*/
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

	// 添加获取APP和小程序文章列表高度的方法
	const getMPListHeight = () => {
		// #ifdef APP-PLUS || MP-WEIXIN
		// 减去搜索框高度(90rpx)和导航菜单高度(80rpx)以及状态栏高度
		return 'calc(100vh - 170rpx - var(--status-bar-height))';
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
		min-width: 1000px;
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
		min-width: 1000px;

		.header-top {
			display: flex;
			align-items: center;
			height: 60px;
			padding: 0 20px;
			max-width: 1200px;
			min-width: 960px;
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
			max-width: 1200px;
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
					margin-left: 150px;
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
		max-width: 1200px;
		min-width: 960px;
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
			min-width: 600px;
			background: #fff;
			border-radius: 4px 0 0 4px;
			padding: 20px;
			margin-left: 130px;
			margin-right: 0;
			min-height: 200px;
		}

		.right-sidebar {
			position: sticky;
			top: 106px;
			width: 300px;
			min-width: 280px;
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
		background-color: #fff;
		padding-top: var(--status-bar-height);
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;

		// 添加顶部导航栏样式
		.mp-top-nav {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20rpx 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			.mp-logo {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
			}
			
			.mp-my-btn {
				font-size: 28rpx;
				color: #4361ee;
				padding: 10rpx 20rpx;
			}
		}

		.search-bar {
			display: flex;
			align-items: center;
			padding: 20rpx;
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
				padding: 0 30rpx;
				height: 70rpx;
				line-height: 70rpx;
				font-size: 28rpx;
				color: #fff;
				background: #4361ee;
				border-radius: 35rpx;
				margin-left: 20rpx;
			}
		}

		.nav-menu {
			display: flex;
			padding: 20rpx 30rpx;
			background: #fff;
			border-bottom: 1rpx solid #f0f0f0;

			.nav-item {
				padding: 0 20rpx;
				font-size: 28rpx;
				color: #666;
				position: relative;

				&.active {
					color: #4361ee;
					font-weight: bold;

					&::after {
						content: '';
						position: absolute;
						bottom: -10rpx;
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

	.mp-content {
		padding-top: calc(220rpx + var(--status-bar-height));
		background: #f5f5f5;
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
</style>