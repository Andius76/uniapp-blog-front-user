<template>
	<view class="container">
		<!-- 固定在顶部的用户信息和标签导航 -->
		<view class="header-fixed">
			<!-- 顶部用户信息区域 -->
			<view class="user-top-container">
				<!-- 原有用户信息区域内容 -->
				<view class="user-header">
					<view class="user-info">
						<image class="avatar" :src="data.userInfo.avatar || '/static/images/avatar.png'"
							mode="aspectFill"></image>
						<text class="nickname">{{ data.userInfo.nickname }}</text>
					</view>
					<view class="user-actions">
						<view class="action-btn" @click="navigateTo('/pages/creation-center/creation-center')">
							创作中心
						</view>
						<view @click="navigateTo('/pages/settings/settings')">
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
						<text class="stat-label">粉丝</text>
					</view>
					<view class="stat-divider">|</view>
					<view class="stat-item" @click="navigateTo('/pages/collection/collection')">
						<text class="stat-num">{{ data.userInfo.collectionCount }}</text>
						<text class="stat-label">收藏</text>
					</view>
				</view>

				<!-- 个人简介区域 -->
				<view class="user-bio">
					<view class="bio-content">
						<uni-icons type="person" size="20" color="#666"></uni-icons>
						<text class="bio-text">个人简介：{{ data.userInfo.bio || DEFAULT_BIO }}</text>
					</view>
					<view class="edit-profile-btn" @click="toggleBioEdit">
						编辑资料
					</view>
				</view>

				<!-- 标签页导航，使用首页的导航样式 -->
				<view class="nav-menu">
					<view v-for="(tab, index) in data.tabs" :key="index" class="nav-item"
						:class="{ active: data.currentTab === index }" @click="switchTab(index)">
						{{ tab.name }}
					</view>
				</view>
			</view>

			<!-- 内容区域，使用首页的内容区样式 -->
			<view class="content-area">
				<scroll-view scroll-y class="article-list" @scrolltolower="loadMore" refresher-enabled
					:refresher-triggered="data.isRefreshing" @refresherrefresh="refreshList" :refresher-threshold="100">
					<!-- 我的帖子列表，使用首页的文章卡片样式 -->
					<view v-for="(post, index) in data.contentList" :key="index" class="article-card">
						<!-- 用户信息 -->
						<view class="user-info">
							<image class="avatar" :src="post.avatar || '/static/images/avatar.png'" mode="aspectFill">
							</image>
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
							<!-- 编辑和删除按钮（仅在"我的发表"选项卡中显示） -->
							<template v-if="data.currentTab === 0">
								<view class="action-item" @click.stop="handleEditPost(index)">
									<uni-icons type="compose" size="20" color="#666"></uni-icons>
								</view>
								<view class="action-item" @click.stop="handleDeletePost(index)">
									<uni-icons type="trash" size="20" color="#666"></uni-icons>
								</view>
							</template>
						</view>
					</view>
					<!-- 加载状态 -->
					<view class="loading-state">
						<text v-if="data.isLoading">加载中...</text>
						<text v-else-if="data.noMoreData && data.contentList.length > 0">没有更多内容了</text>
						<text v-else>↓向下滑动加载更多内容↓</text>
					</view>
					<!-- 无内容提示 -->
					<view v-if="data.contentList.length === 0" class="no-content">
						<uni-icons type="info" size="50" color="#ddd"></uni-icons>
						<text>暂无内容</text>
					</view>


				</scroll-view>
			</view>
		</view>

		<!-- 内容区域，使用首页的内容区样式 -->
		<view class="content-area">
			<scroll-view scroll-y class="article-list" @scrolltolower="loadMore" refresher-enabled
				:refresher-triggered="data.isRefreshing" @refresherrefresh="refreshList">
				<!-- 我的帖子列表，使用首页的文章卡片样式 -->
				<view v-for="(post, index) in data.contentList" :key="index" class="article-card">
					<!-- 用户信息 -->
					<view class="user-info">
						<image class="avatar" :src="post.avatar || '/static/images/avatar.png'" mode="aspectFill">
						</image>
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
						<!-- 编辑和删除按钮（仅在"我的发表"选项卡中显示） -->
						<template v-if="data.currentTab === 0">
							<view class="action-item" @click.stop="handleEditPost(index)">
								<uni-icons type="compose" size="20" color="#666"></uni-icons>
								<text>编辑</text>
							</view>
							<view class="action-item" @click.stop="handleDeletePost(index)">
								<uni-icons type="trash" size="20" color="#666"></uni-icons>
								<text>删除</text>
							</view>
						</template>
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

		<!-- 用户设置组件 -->
		<UserSettings :visible="data.showUserSettings" :userInfo="data.userInfo" :initialView="data.settingsInitialView"
			@update:visible="data.showUserSettings = $event" @avatar-change="handleAvatarChange"
			@nickname-change="handleNicknameChange" @bio-change="handleBioChange" @logout="handleLogout" />
	</view>
	
	<!-- 使用原生方法实现的弹窗 -->
	<view v-if="data.showBioPopup" class="native-popup-container" @click.self="closeBioPopup">
		<view class="native-popup-mask" @click.stop></view>
		<view class="native-popup-body" @click.stop>
			<view class="bio-edit-popup">
				<view class="popup-header">
					<text class="popup-title">编辑个人简介</text>
					<view class="popup-close" @click="closeBioPopup">
						<uni-icons type="close" size="22" color="#666"></uni-icons>
					</view>
				</view>
				<view class="popup-content">
					<textarea 
						class="bio-textarea" 
						v-model="data.editingBio" 
						placeholder="请输入您的个人简介..."
						maxlength="200"
					></textarea>
					<view class="char-counter">
						<text>{{ data.editingBio.length }}/200</text>
					</view>
				</view>
				<view class="popup-footer">
					<button class="btn-cancel" @click="closeBioPopup">取消</button>
					<button class="btn-save" @click="saveUserBio">保存</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		reactive,
		onMounted,
		ref,
		onUnmounted,
		nextTick,
		watch
	} from 'vue';
	// 导入uni-icons组件
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
	// 导入用户设置组件
	import UserSettings from '@/components/user-settings/user-settings.vue';
	// 导入API接口
	import { getUserInfo, updateUserProfile, uploadUserAvatar } from '@/api/user';
	import { onLoad, onShow, onHide, onBackPress } from '@dcloudio/uni-app';

	// 默认个人简介
	const DEFAULT_BIO = "这个人很懒，什么都没写";
	
	// 添加返回拦截状态控制
	const isBackGestureLocked = ref(false);
	// 存储当前页面的webview对象
	let currentWebview = null;
	// 保存原始的手势配置
	let originalGestureConfig = null;
	// 存储定时器ID
	let lockTimeoutId = null;

	// 使用reactive统一管理数据
	const data = reactive({
		// 用户信息
		userInfo: {
			nickname: '',
			avatar: '/static/images/avatar.png',
			followCount: 0,
			followerCount: 0,
			collectionCount: 0,
			bio: '',
			email: ''
		},

		// 标签页数据
		tabs: [{
				name: '我的发表',
				type: 'posts'
			},
			{
				name: '我的点赞',
				type: 'likes'
			}
		],
		currentTab: 0, // 默认选中"我的发表"选项卡

		// 内容列表数据与状态
		contentList: [],
		isLoading: false,
		noMoreData: false,
		currentPage: 1,
		pageSize: 5,
		isRefreshing: false,

		// 用户设置面板显示状态
		showUserSettings: false,
		settingsInitialView: 'main', // 设置面板初始视图

		// 修改为使用原生弹窗的状态控制
		showBioPopup: false,
		editingBio: '',
	});

	// 模拟内容数据
	const mockContents = {
		posts: [{
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
		likes: [{
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

		// 不在这里显示刷新成功提示，等待数据加载完成后自动关闭刷新状态
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
	 * 打开用户设置面板
	 */
	const openUserSettings = () => {
		// 设置初始视图为编辑个人简介
		data.settingsInitialView = 'bio';
		// 显示设置面板
		data.showUserSettings = true;
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
			// 显示自定义设置面板
			data.showUserSettings = true;
			return;
		} else if (url.includes('follows')) {
			// 实际导航到关注列表页面
			uni.navigateTo({
				url
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
		} else if (url.includes('edit-profile')) {
			uni.showToast({
				title: '编辑个人资料',
				icon: 'none'
			});
			return;
		} else if (url.includes('article-detail')) {
			// 直接导航到文章详情页面
			uni.navigateTo({
				url
			});
			return;
		}

		// 实际跳转，当后端连接后使用
		// uni.navigateTo({ url });
	};

	/**
	 * 获取基础URL
	 */
	const getBaseUrl = () => {
		// #ifdef APP-PLUS
		return 'http:// 10.9.57.7:8080'; // 安卓模拟器访问本机服务器的地址
		// #endif
		
		// #ifdef H5
		return 'http://localhost:8080';
		// #endif
		
		// #ifdef MP-WEIXIN
		return 'http://localhost:8080';
		// #endif
	};

	/**
	 * 处理获取到的用户信息，处理头像URL
	 * @param {Object} userInfo - 用户信息对象
	 */
	const processUserInfo = (userInfo) => {
		// 深拷贝，避免直接修改原对象
		const processedInfo = { ...userInfo };
		
		// 处理头像URL
		if (processedInfo.avatar) {
			// 如果已经是完整的URL，直接使用
			if (processedInfo.avatar.startsWith('http')) {
				return processedInfo;
			}
			
			// 如果是相对路径，需要拼接基础URL
			if (processedInfo.avatar.startsWith('/')) {
				processedInfo.avatar = getBaseUrl() + processedInfo.avatar;
			} else {
				// 如果既不是http开头也不是/开头，添加/
				processedInfo.avatar = getBaseUrl() + '/' + processedInfo.avatar;
			}
		} else {
			// 使用默认头像
			// #ifdef APP-PLUS
			processedInfo.avatar = '/static/images/avatar.png';
			// #endif
			
			// #ifdef H5 || MP-WEIXIN
			processedInfo.avatar = '/static/images/avatar.png';
			// #endif
		}
		
		return processedInfo;
	};

	/**
	 * 修改用户头像
	 * @param {String} newAvatar - 新头像地址
	 */
	const handleAvatarChange = async (newAvatar) => {
		try {
			uni.showLoading({ title: '更新中...' });
			
			// 调用上传头像API
			const response = await uploadUserAvatar(newAvatar);
			
			if (response.code === 200) {
				// 更新本地用户信息
				data.userInfo.avatar = response.data.avatarUrl;
				
				uni.showToast({
					title: '头像更新成功',
					icon: 'success'
				});
			} else {
				throw new Error(response.message || '头像更新失败');
			}
		} catch (error) {
			console.error('头像更新失败:', error);
			uni.showToast({
				title: '头像更新失败，请重试',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	};

	/**
	 * 修改用户昵称
	 * @param {String} newNickname - 新昵称
	 */
	const handleNicknameChange = async (newNickname) => {
		try {
			uni.showLoading({ title: '更新中...' });
			
			// 调用更新用户资料API
			const response = await updateUserProfile({ nickname: newNickname });
			
			if (response.code === 200) {
				// 更新本地用户信息
				data.userInfo.nickname = newNickname;
				
				uni.showToast({
					title: '昵称更新成功',
					icon: 'success'
				});
			} else {
				throw new Error(response.message || '昵称更新失败');
			}
		} catch (error) {
			console.error('昵称更新失败:', error);
			uni.showToast({
				title: '昵称更新失败，请重试',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	};

	/**
	 * 修改用户个人简介
	 * @param {String} newBio - 新个人简介
	 */
	const handleBioChange = async (newBio) => {
		try {
			uni.showLoading({ title: '更新中...' });
			
			// 如果用户提交空简介，则使用默认值
			const bioToSubmit = newBio.trim() ? newBio : DEFAULT_BIO;
			
			// 调用更新用户资料API
			const response = await updateUserProfile({ bio: bioToSubmit });
			
			if (response.code === 200) {
				// 更新本地用户信息
				data.userInfo.bio = bioToSubmit;
				
				uni.showToast({
					title: '个人简介更新成功',
					icon: 'success'
				});
			} else {
				throw new Error(response.message || '个人简介更新失败');
			}
		} catch (error) {
			console.error('个人简介更新失败:', error);
			uni.showToast({
				title: '个人简介更新失败，请重试',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	};

	/**
	 * 处理退出登录
	 */
	const handleLogout = () => {
		// 清除用户数据和本地缓存
		uni.removeStorageSync('token');
		uni.removeStorageSync('userInfo');

		// 跳转到登录页
		uni.reLaunch({
			url: '/pages/login/login'
		});
	};

	/**
	 * 编辑文章
	 * @param {Number} index - 文章索引
	 */
	const handleEditPost = (index) => {
		const post = data.contentList[index];

		// 组装需要传递的文章数据
		const articleData = {
			id: post.id,
			title: post.title,
			content: post.summary, // 注意：这里只有摘要，实际应该传完整内容
			tags: post.tags || [],
			images: post.image ? [post.image] : []
		};

		// 将文章数据转换为JSON字符串，并进行URI编码
		const articleDataStr = encodeURIComponent(JSON.stringify(articleData));

		// 跳转到发布页面，带上文章数据
		uni.navigateTo({
			url: `/pages/publish/publish?mode=edit&articleData=${articleDataStr}`
		});
	};

	/**
	 * 删除文章
	 * @param {Number} index - 文章索引
	 */
	const handleDeletePost = (index) => {
		const post = data.contentList[index];

		// 显示确认对话框
		uni.showModal({
			title: '确认删除',
			content: '确定要删除这篇文章吗？删除后将无法恢复。',
			confirmText: '删除',
			confirmColor: '#ff0000',
			success: (res) => {
				if (res.confirm) {
					// 用户点击确认，执行删除
					deletePost(post.id, index);
				}
			}
		});
	};

	/**
	 * 执行文章删除操作
	 * @param {Number} postId - 文章ID
	 * @param {Number} index - 文章在列表中的索引
	 */
	const deletePost = (postId, index) => {
		// 显示加载提示
		uni.showLoading({
			title: '删除中...'
		});

		// 模拟删除请求
		setTimeout(() => {
			// 从列表中移除文章
			data.contentList.splice(index, 1);

			// 隐藏加载提示
			uni.hideLoading();

			// 显示成功提示
			uni.showToast({
				title: '删除成功',
				icon: 'success'
			});

			// TODO: 实际删除API调用
			// api.deleteArticle(postId).then(res => {
			//   console.log('文章删除成功');
			// }).catch(err => {
			//   console.error('文章删除失败:', err);
			//   uni.showToast({
			//     title: '删除失败，请重试',
			//     icon: 'none'
			//   });
			// });
		}, 800);
	};

	/**
	 * 显示个人简介编辑弹窗
	 */
	const toggleBioEdit = () => {
		// 初始化编辑框的值为当前简介
		data.editingBio = data.userInfo.bio || '';
		// 显示弹窗
		data.showBioPopup = true;
	};

	/**
	 * 关闭个人简介编辑弹窗
	 */
	const closeBioPopup = () => {
		data.showBioPopup = false;
	};

	/**
	 * 保存个人简介
	 */
	const saveUserBio = async () => {
		try {
			uni.showLoading({ title: '保存中...' });
			
			// 如果用户提交空简介，则使用默认值
			const bioToSubmit = data.editingBio.trim() ? data.editingBio.trim() : DEFAULT_BIO;
			
			// 调用更新用户资料API
			const response = await updateUserProfile({ bio: bioToSubmit });
			
			if (response.code === 200) {
				// 更新本地用户信息
				data.userInfo.bio = bioToSubmit;
				
				uni.showToast({
					title: '个人简介已更新',
					icon: 'success'
				});
				
				// 关闭弹窗
				closeBioPopup();
			} else {
				throw new Error(response.message || '个人简介更新失败');
			}
		} catch (error) {
			console.error('个人简介更新失败:', error);
			uni.showToast({
				title: '更新失败，请重试',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	};

	/**
	 * 禁用系统返回手势
	 */
	const disableBackGesture = () => {
		// #ifdef APP-PLUS
		try {
			// 确保获取到当前webview
			if (!currentWebview) {
				currentWebview = plus.webview.currentWebview();
			}
			
			// 保存原始配置（如果还没保存）
			if (!originalGestureConfig && currentWebview) {
				originalGestureConfig = currentWebview.getStyle().popGesture;
			}
			
			// 设置返回手势为none（禁用）
			if (currentWebview) {
				currentWebview.setStyle({
					popGesture: "none"
				});
				console.log('已禁用返回手势');
				return true;
			}
		} catch (e) {
			console.error('禁用返回手势失败:', e);
		}
		// #endif
		return false;
	};

	/**
	 * 恢复系统返回手势
	 */
	const restoreBackGesture = () => {
		// #ifdef APP-PLUS
		try {
			if (currentWebview) {
				currentWebview.setStyle({
					popGesture: originalGestureConfig || "close"
				});
				console.log('已恢复返回手势');
				return true;
			}
		} catch (e) {
			console.error('恢复返回手势失败:', e);
		}
		// #endif
		return false;
	};

	/**
	 * 临时锁定返回手势
	 * @param {Number} duration - 锁定时长（毫秒）
	 */
	const temporaryLockBackGesture = (duration = 800) => {
		isBackGestureLocked.value = true;
		disableBackGesture();
		
		// 清除之前的定时器
		if (lockTimeoutId) {
			clearTimeout(lockTimeoutId);
		}
		
		// 设置新的定时器
		lockTimeoutId = setTimeout(() => {
			isBackGestureLocked.value = false;
			restoreBackGesture();
		}, duration);
	};

	/**
	 * 监听用户设置面板显示状态变化
	 */
	watch(() => data.showUserSettings, (newVal) => {
		if (newVal) {
			// 设置面板显示，禁用返回手势
			disableBackGesture();
		} else {
			// 设置面板隐藏，临时锁定返回手势
			temporaryLockBackGesture(800);
		}
	});

	/**
	 * 拦截物理返回键
	 */
	onBackPress((e) => {
		// 如果返回手势被锁定，则拦截物理返回键
		if (isBackGestureLocked.value) {
			return true; // 拦截返回
		}
		
		// 如果设置面板正在显示，则关闭它而不是退出页面
		if (data.showUserSettings) {
			data.showUserSettings = false;
			return true; // 拦截返回
		}
		
		// 默认不拦截
		return false;
	});

	// 页面初始化
	onMounted(async () => {
		try {
			// 初始化webview
			// #ifdef APP-PLUS
			setTimeout(() => {
				currentWebview = plus.webview.currentWebview();
				if (currentWebview) {
					originalGestureConfig = currentWebview.getStyle().popGesture;
					console.log('初始化webview完成，原始手势配置:', originalGestureConfig);
				}
			}, 200);
			// #endif
			
			// 显示加载提示
			uni.showLoading({
				title: '加载中...'
			});
			
			// 先从本地存储获取基本用户信息
			const localUserInfo = uni.getStorageSync('userInfo');
			if (localUserInfo) {
				// 初始化用户基本信息
				data.userInfo = {
					...data.userInfo,
					nickname: localUserInfo.nickname || '',
					avatar: localUserInfo.avatar || '/static/images/avatar.png',
					email: localUserInfo.email || '',
					id: localUserInfo.id || 0
				};
			}
			
			// 再尝试从API获取完整用户信息（包括关注数、粉丝数等）
			try {
				const response = await getUserInfo();
				
				if (response.code === 200) {
					// 处理空的个人简介，使用默认值
					if (!response.data.bio) {
						response.data.bio = DEFAULT_BIO;
					}
					
					// 处理头像URL
					const processedUserInfo = processUserInfo(response.data);
					
					// 适配后端返回的字段名称
					const userData = {
						...processedUserInfo,
						// 后端返回fansCount，前端使用followerCount
						followerCount: processedUserInfo.fansCount || processedUserInfo.followerCount || 0,
						// 后端没有收藏数，默认为0
						collectionCount: processedUserInfo.collectionCount || 0,
					};
					
					// 更新用户完整信息
					data.userInfo = userData;
					
					// 更新本地存储
					uni.setStorageSync('userInfo', {
						id: userData.id,
						nickname: userData.nickname,
						avatar: userData.avatar,
						email: userData.email
					});
				}
			} catch (apiError) {
				console.error('获取API用户信息失败:', apiError);
				// API请求失败，但已有基本信息，继续使用
				if (!data.userInfo.bio) {
					data.userInfo.bio = DEFAULT_BIO;
				}
			}
			
			// 加载默认选项卡的内容
			loadContent();
		} catch (error) {
			console.error('初始化失败:', error);
			uni.showToast({
				title: '获取用户信息失败，请重试',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	});

	onLoad((options) => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			
			setTimeout(() => {
				uni.redirectTo({
					url: `/pages/login/login?redirect=${encodeURIComponent('/pages/my/my')}`
				});
			}, 1500);
			
			return false;
		}
		
		// 正常页面逻辑...
	});

	// 在onMounted中添加事件监听
	onMounted(() => {
		// 加载用户数据等其他初始化操作
		// 不再需要自定义事件监听
	});

	onUnmounted(() => {
		// 清理定时器
		if (lockTimeoutId) {
			clearTimeout(lockTimeoutId);
			lockTimeoutId = null;
		}
		
		// 恢复原始手势设置
		restoreBackGesture();
	});
	
	// 页面显示时
	onShow(() => {
		// 如果从设置页面返回，确保临时锁定手势
		if (data.showUserSettings === false && isBackGestureLocked.value) {
			console.log('页面显示，保持手势锁定');
		}
	});
	
	// 页面隐藏时(切换选项卡)
	onHide(() => {
		// 页面隐藏时，如果设置面板是打开状态，关闭它
		if (data.showUserSettings) {
			console.log('页面切换，自动关闭设置面板');
			data.showUserSettings = false;
		}
	});
</script>

<style lang="scss">
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

	// 移除原header-fixed的样式
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
					display: flex;
					align-items: center;
					margin-right: 50rpx;
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
		padding: 0 20rpx 0 20rpx;
		flex: 1;

		.article-list {
			height: calc(100vh - 445rpx);

			// 自定义下拉刷新样式
			&::before {
				content: '';
				width: 100%;
				height: 80rpx;
				position: absolute;
				top: 0;
				left: 0;
				background-color: transparent;
			}
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
				flex-wrap: wrap;

				.action-item {
					display: flex;
					align-items: center;
					padding: 0 10rpx;
					margin-bottom: 10rpx;

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
			height: 80rpx !important; // 调整刷新区域高度
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

	/* 原生弹窗样式 */
	.native-popup-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 9999;
		
		.native-popup-mask {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.5);
			animation: fadeIn 0.3s ease;
		}
		
		.native-popup-body {
			position: relative;
			z-index: 10000;
			animation: scaleIn 0.3s ease;
		}
	}
	
	/* 弹窗动画 */
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	@keyframes scaleIn {
		from { 
			transform: scale(0.8);
			opacity: 0;
		}
		to { 
			transform: scale(1);
			opacity: 1;
		}
	}
	
	/* 编辑个人简介弹窗样式 */
	.bio-edit-popup {
		width: 650rpx;
		background-color: #fff;
		border-radius: 16rpx;
		overflow: hidden;
		
		.popup-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 30rpx;
			border-bottom: 1rpx solid #eee;
			
			.popup-title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
			}
			
			.popup-close {
				padding: 10rpx;
			}
		}
		
		.popup-content {
			padding: 30rpx;
			
			.bio-textarea {
				width: 100%;
				height: 240rpx;
				background-color: #f8f8f8;
				border: 1rpx solid #eee;
				border-radius: 10rpx;
				padding: 20rpx;
				font-size: 28rpx;
				color: #333;
			}
			
			.char-counter {
				text-align: right;
				font-size: 24rpx;
				color: #999;
				margin-top: 10rpx;
			}
		}
		
		.popup-footer {
			display: flex;
			border-top: 1rpx solid #eee;
			
			button {
				flex: 1;
				margin: 0;
				height: 90rpx;
				line-height: 90rpx;
				font-size: 32rpx;
				border-radius: 0;
				
				&.btn-cancel {
					background-color: #f5f5f5;
					color: #666;
				}
				
				&.btn-save {
					background-color: #4361ee;
					color: #fff;
				}
			}
		}
	}
</style>