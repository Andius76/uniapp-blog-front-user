<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<!-- #ifdef H5 -->
		<view class="header-fixed">
			<view class="header-top">
				<navigator url="/pages/index/index" class="logo">首页</navigator>
				<navigator url="/pages/my/my" class="my-link">我的</navigator>
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
					<view class="user-info" @click.stop="handleUserClick">
						<image class="avatar" :src="userInfo.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
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
					:height="getListHeight()"
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
					<view class="stat-item">
						<uni-icons type="star" size="20" />
						<text>我的收藏</text>
						<text class="count">0</text>
					</view>
					<view class="stat-item">
						<uni-icons type="heart" size="20" />
						<text>我的关注</text>
						<text class="count">0</text>
					</view>
					<view class="stat-item">
						<uni-icons type="person" size="20" />
						<text>我的粉丝</text>
						<text class="count">0</text>
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
					:visible="true"
					:userInfo="userInfo"
					@update:visible="handleVisibleChange"
					@avatar-change="handleAvatarChange"
					@nickname-change="handleNicknameChange"
					@logout="handleLogout"
				/>
			</view>
		</view>
		<!-- #endif -->
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
	import UserSettings from '@/components/user-settings/user-settings.vue';

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

	const userInfo = reactive({
		avatar: uni.getStorageSync('userInfo')?.avatar || '',
		nickname: uni.getStorageSync('userInfo')?.nickname || '',
		email: uni.getStorageSync('userInfo')?.email || ''
	});

	// 监听登录状态变化
	watch(() => uni.getStorageSync('userInfo'), (newVal) => {
		if (newVal) {
			userInfo.avatar = newVal.avatar || '';
			userInfo.nickname = newVal.nickname || '';
			userInfo.email = newVal.email || '';
		} else {
			userInfo.avatar = '';
			userInfo.nickname = '';
			userInfo.email = '';
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

	// 添加获取APP和小程序文章列表高度的方法
	const getMPListHeight = () => {
		// #ifdef APP-PLUS || MP-WEIXIN
		// 减去搜索框高度(90rpx)和导航菜单高度(80rpx)以及状态栏高度
		return 'calc(100vh - 170rpx - var(--status-bar-height))';
		// #endif
		return '100vh';
	};

	const showUserSettings = ref(false);

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
			userInfo.avatar = latestUserInfo.avatar || '';
			userInfo.nickname = latestUserInfo.nickname || '';
			userInfo.email = latestUserInfo.email || '';
		}
		
		// 显示设置面板
		nextTick(() => {
			showUserSettings.value = true;
		});
	};

	const handleAvatarChange = (newAvatar) => {
		userInfo.avatar = newAvatar;
		uni.setStorageSync('userInfo', {
			...uni.getStorageSync('userInfo'),
			avatar: newAvatar
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
		showUserSettings.value = false;
		
		uni.showToast({
			title: '已退出登录',
			icon: 'success'
		});
	};

	// 添加全局点击事件监听，点击其他区域关闭设置面板
	onMounted(() => {
		// #ifdef H5
		// 点击其他区域关闭设置面板
		document.addEventListener('click', (event) => {
			if (showUserSettings.value) {
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
</script>

<style lang="scss">
	page {
		background-color: #f5f5f5;
		height: 100vh;
		overflow: hidden;
	}

	// #ifdef H5
	.uni-page-wrapper {
		min-height: 100% !important;
		height: auto !important;
	}

	.uni-page-body {
		height: auto !important;
		min-height: 100%;
	}
	// #endif

	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
		min-width: 1000px;
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

			.my-link {
				font-size: 16px;
				color: #666;
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
		padding: 106px 20px 0;
		gap: 20px;
		position: relative;
		height: 100%;
		overflow: hidden;

		.left-sidebar {
			position: fixed;
			width: 110px;
			top: 106px;
			bottom: 0;
			background: transparent;
			overflow: hidden;
		}

		.main-content {
			flex: 1;
			min-width: 600px;
			background: #fff;
			border-radius: 4px;
			padding: 20px;
			margin-left: 130px;
			margin-right: 320px;
			overflow: hidden;
		}

		.right-sidebar {
			position: fixed;
			width: 300px;
			min-width: 280px;
			top: 106px;
			right: calc((100% - 1200px) / 2 + 30px);
			bottom: 0;
			background: transparent;
			overflow: hidden;

			.creator-center {
				background: #fff;
				border-radius: 4px;
				padding: 20px;
				margin-bottom: 20px;
				box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

				.creator-header {
					display: flex;
					align-items: center;
					gap: 10px;
					margin-bottom: 15px;
					font-size: 16px;
					font-weight: bold;
				}

				.write-btn {
					width: 100%;
					height: 40px;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 8px;
					background: #4361ee;
					color: #fff;
					border-radius: 4px;
					font-size: 14px;
				}
			}

			.user-stats {
				background: #fff;
				border-radius: 4px;
				padding: 20px;

				.stat-item {
					display: flex;
					align-items: center;
					gap: 10px;
					padding: 12px 0;
					border-bottom: 1px solid #f0f0f0;
					cursor: pointer;

					&:last-child {
						border-bottom: none;
					}

					text {
						color: #666;
						font-size: 14px;
					}

					.count {
						margin-left: auto;
						color: #999;
					}
				}
			}
		}
	}

	// 全局禁用滚动条
	::-webkit-scrollbar {
		width: 0;
		height: 0;
		display: none;
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
				right: 30px;
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
		padding-top: calc(170rpx + var(--status-bar-height));
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
			overflow-y: auto;
			
			:deep(.user-settings-wrapper) {
				height: auto;
				background: transparent;
				
				.mask {
					display: none;
				}
				
				.settings-panel {
					position: relative;
					top: 0;
					right: 0;
					width: 100%;
					height: auto;
					box-shadow: none;
					border-radius: 0;
					
					.panel-header {
						display: none;
					}
					
					.panel-content {
						padding: 20px;
						
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
		overflow-x: auto;
		min-width: 1000px;
	}

	body {
		min-width: 1000px;
	}

	::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	::-webkit-scrollbar-thumb {
		background: #ddd;
		border-radius: 3px;
	}

	::-webkit-scrollbar-track {
		background: #f5f5f5;
	}
	// #endif
</style>