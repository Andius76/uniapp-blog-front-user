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
						<view @click="showSettingsPopup">
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

	<!-- 设置表单弹出层 -->
	<uni-popup ref="settingsPopup" type="bottom">
		<view class="settings-popup-container">
			<view class="popup-header">
				<text class="popup-title">设置</text>
				<view class="popup-close" @click="closeSettingsPopup">
					<uni-icons type="close" size="24" color="#666"></uni-icons>
				</view>
			</view>
			
			<scroll-view scroll-y class="settings-scroll">
				<view class="settings-list">
					<!-- 用户设置区域 -->
					<view class="settings-section">
						<view class="section-title">账号设置</view>
						
						<!-- 上传头像 -->
						<view class="settings-item" @click="chooseAvatar">
							<view class="item-left">
								<uni-icons type="image" size="24" color="#666"></uni-icons>
								<text class="item-label">上传头像</text>
							</view>
							<view class="item-right">
								<image class="avatar-preview" :src="data.userInfo.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
								<uni-icons type="forward" size="18" color="#ccc"></uni-icons>
							</view>
						</view>
						
						<!-- 修改昵称 -->
						<view class="settings-item" @click="showNicknameModal">
							<view class="item-left">
								<uni-icons type="person" size="24" color="#666"></uni-icons>
								<text class="item-label">修改昵称</text>
							</view>
							<view class="item-right">
								<text class="item-value">{{ data.userInfo.nickname }}</text>
								<uni-icons type="forward" size="18" color="#ccc"></uni-icons>
							</view>
						</view>
						
						<!-- 修改性别 -->
						<view class="settings-item" @click="showGenderPicker">
							<view class="item-left">
								<uni-icons type="help" size="24" color="#666"></uni-icons>
								<text class="item-label">修改性别</text>
							</view>
							<view class="item-right">
								<text class="item-value">{{ genderText }}</text>
								<uni-icons type="forward" size="18" color="#ccc"></uni-icons>
							</view>
						</view>
					</view>
					
					<!-- 其他设置区域 -->
					<view class="settings-section">
						<view class="section-title">其他设置</view>
						
						<!-- 返回我的页面 -->
						<view class="settings-item" @click="closeSettingsPopup">
							<view class="item-left">
								<uni-icons type="home" size="24" color="#666"></uni-icons>
								<text class="item-label">返回我的页面</text>
							</view>
						</view>
						
						<!-- 退出登录 -->
						<view class="settings-item logout-item" @click="handleLogout">
							<view class="item-left">
								<uni-icons type="poweroff" size="24" color="#f56c6c"></uni-icons>
								<text class="item-label logout-label">退出登录</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</uni-popup>
	
	<!-- 修改昵称弹窗 -->
	<uni-popup ref="nicknamePopup" type="dialog">
		<uni-popup-dialog 
			title="修改昵称" 
			:before-close="true"
			@confirm="confirmNickname" 
			@close="closeNicknamePopup"
			confirmText="确认"
			cancelText="取消"
		>
			<input 
				class="nickname-input" 
				type="text" 
				v-model="tempNickname" 
				placeholder="请输入新昵称" 
				maxlength="20"
			/>
		</uni-popup-dialog>
	</uni-popup>
	
	<!-- 性别选择器 -->
	<uni-popup ref="genderPopup" type="bottom">
		<view class="gender-picker-container">
			<view class="picker-header">
				<text class="picker-title">请选择性别</text>
				<text class="picker-close" @click="closeGenderPicker">取消</text>
			</view>
			<view class="gender-options">
				<view 
					class="gender-option" 
					:class="{ active: tempGender === 1 }"
					@click="selectGender(1)"
				>
					<text>男</text>
				</view>
				<view 
					class="gender-option" 
					:class="{ active: tempGender === 2 }"
					@click="selectGender(2)"
				>
					<text>女</text>
				</view>
				<view 
					class="gender-option" 
					:class="{ active: tempGender === 0 }"
					@click="selectGender(0)"
				>
					<text>保密</text>
				</view>
			</view>
			<view class="confirm-button" @click="confirmGender">
				<text>确认</text>
			</view>
		</view>
	</uni-popup>
</template>

<script setup>
	import {
		reactive,
		onMounted,
		ref,
		computed,
		nextTick
	} from 'vue';
	// 导入uni-icons组件
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
	// 导入uni-popup组件
	import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue';
	import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';

	// 设置需要使用的组件
	const components = {
		uniIcons,
		uniPopup,
		uniPopupDialog
	};

	// 使用reactive统一管理数据
	const data = reactive({
		// 用户信息
		userInfo: {
			nickname: '用户asdf',
			avatar: '/static/images/avatar.png',
			followCount: 1,
			followerCount: 0,
			collectionCount: 1,
			historyCount: 55,
			bio: '简单介绍一下自己',
			gender: 0 // 0:保密 1:男 2:女
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
		isRefreshing: false
	});

	// 临时存储修改信息
	const tempNickname = ref('');
	const tempGender = ref(0);
	
	// 计算属性，根据性别值返回文本
	const genderText = computed(() => {
		switch (data.userInfo.gender) {
			case 1:
				return '男';
			case 2:
				return '女';
			default:
				return '保密';
		}
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

	// 获取popup组件引用
	const settingsPopup = ref(null);
	const nicknamePopup = ref(null);
	const genderPopup = ref(null);

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
			// 已改为弹出设置表单，不再跳转
			showSettingsPopup();
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

		// 确保popup组件正确初始化
		nextTick(() => {
			console.log('popup组件初始化状态:', !!settingsPopup.value);
		});

		// TODO: 获取用户信息
		// api.getUserInfo().then(res => {
		//   data.userInfo = res.data;
		// });
	});

	/**
	 * 显示设置弹出层
	 */
	const showSettingsPopup = () => {
		// 简单处理，直接尝试打开
		try {
			console.log('打开设置弹窗', settingsPopup.value);
			uni.showToast({
				title: '正在打开设置',
				icon: 'none',
				duration: 1000
			});
			setTimeout(() => {
				if (settingsPopup.value) {
					settingsPopup.value.open();
				} else {
					uni.showToast({
						title: '组件未找到，请检查控制台',
						icon: 'none'
					});
					console.error('settingsPopup组件引用为空');
				}
			}, 100);
		} catch (error) {
			console.error('打开设置弹窗失败:', error);
			uni.showToast({
				title: '打开设置失败，请重试',
				icon: 'none'
			});
		}
	};
	
	/**
	 * 关闭设置弹出层
	 */
	const closeSettingsPopup = () => {
		settingsPopup.value.close();
	};
	
	/**
	 * 显示修改昵称弹窗
	 */
	const showNicknameModal = () => {
		tempNickname.value = data.userInfo.nickname;
		nicknamePopup.value.open();
	};

	/**
	 * 关闭修改昵称弹窗
	 */
	const closeNicknamePopup = () => {
		nicknamePopup.value.close();
	};

	/**
	 * 确认修改昵称
	 */
	const confirmNickname = () => {
		const newNickname = tempNickname.value.trim();
		if (!newNickname) {
			uni.showToast({
				title: '昵称不能为空',
				icon: 'none'
			});
			return;
		}
		
		// 更新昵称
		data.userInfo.nickname = newNickname;
		
		// 提示修改成功
		uni.showToast({
			title: '昵称修改成功',
			icon: 'success'
		});
		
		// TODO: 调用后端API保存昵称
		// api.updateUserProfile({ nickname: newNickname }).then(res => {
		//   console.log('昵称更新成功');
		// });
		
		// 关闭弹窗
		closeNicknamePopup();
	};

	/**
	 * 显示性别选择器
	 */
	const showGenderPicker = () => {
		tempGender.value = data.userInfo.gender;
		genderPopup.value.open();
	};

	/**
	 * 关闭性别选择器
	 */
	const closeGenderPicker = () => {
		genderPopup.value.close();
	};

	/**
	 * 选择性别
	 * @param {Number} gender - 性别值 0:保密 1:男 2:女
	 */
	const selectGender = (gender) => {
		tempGender.value = gender;
	};

	/**
	 * 确认修改性别
	 */
	const confirmGender = () => {
		// 更新性别
		data.userInfo.gender = tempGender.value;
		
		// 提示修改成功
		uni.showToast({
			title: '性别修改成功',
			icon: 'success'
		});
		
		// TODO: 调用后端API保存性别
		// api.updateUserProfile({ gender: tempGender.value }).then(res => {
		//   console.log('性别更新成功');
		// });
		
		// 关闭选择器
		closeGenderPicker();
	};

	/**
	 * 选择头像
	 */
	const chooseAvatar = () => {
		uni.chooseImage({
			count: 1, // 默认9
			sizeType: ['compressed'], // 压缩图片
			sourceType: ['album', 'camera'], // 从相册选择或拍照
			success: (res) => {
				// 预览选择的图片
				const tempFilePath = res.tempFilePaths[0];
				
				// 更新头像预览
				data.userInfo.avatar = tempFilePath;
				
				// 提示上传成功
				uni.showToast({
					title: '头像更新成功',
					icon: 'success'
				});
				
				// TODO: 实际上传逻辑
				// uni.uploadFile({
				//   url: 'your-upload-endpoint',
				//   filePath: tempFilePath,
				//   name: 'avatar',
				//   success: (uploadRes) => {
				//     const data = JSON.parse(uploadRes.data);
				//     if (data.success) {
				//       // 更新头像链接
				//       data.userInfo.avatar = data.avatarUrl;
				//       
				//       uni.showToast({
				//         title: '头像上传成功',
				//         icon: 'success'
				//       });
				//     } else {
				//       uni.showToast({
				//         title: data.message || '上传失败',
				//         icon: 'none'
				//       });
				//     }
				//   },
				//   fail: () => {
				//     uni.showToast({
				//       title: '上传失败，请重试',
				//       icon: 'none'
				//     });
				//   }
				// });
			}
		});
	};

	/**
	 * 退出登录
	 */
	const handleLogout = () => {
		uni.showModal({
			title: '退出登录',
			content: '确定要退出登录吗？',
			success: (res) => {
				if (res.confirm) {
					// 清除登录状态和用户信息
					// uni.removeStorageSync('token');
					// uni.removeStorageSync('userInfo');
					
					// 跳转到登录页面
					uni.reLaunch({
						url: '/pages/login/login'
					});
					
					// TODO: 调用后端API退出登录
					// api.logout().then(res => {
					//   console.log('已成功退出登录');
					// });
				}
			}
		});
	};
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

	// 设置弹出层样式
	.settings-popup-container {
		background-color: #fff;
		border-radius: 24rpx 24rpx 0 0;
		padding-bottom: 30rpx;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		
		// 弹出层头部
		.popup-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			.popup-title {
				font-size: 36rpx;
				font-weight: bold;
				color: #333;
			}
			
			.popup-close {
				padding: 10rpx;
			}
		}
		
		// 设置内容区域
		.settings-scroll {
			flex: 1;
			height: 100%;
			max-height: calc(80vh - 100rpx);
		}
		
		// 设置列表
		.settings-list {
			width: 100%;
			
			// 设置区域
			.settings-section {
				padding: 20rpx 0;
				
				// 区域标题
				.section-title {
					padding: 20rpx 30rpx;
					font-size: 28rpx;
					color: #999;
					font-weight: 500;
				}
				
				// 设置项
				.settings-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 30rpx;
					border-bottom: 1rpx solid #f5f5f5;
					
					&:last-child {
						border-bottom: none;
					}
					
					// 左侧内容
					.item-left {
						display: flex;
						align-items: center;
						
						.item-label {
							font-size: 32rpx;
							color: #333;
							margin-left: 20rpx;
						}
					}
					
					// 右侧内容
					.item-right {
						display: flex;
						align-items: center;
						
						.item-value {
							font-size: 28rpx;
							color: #999;
							margin-right: 10rpx;
							max-width: 200rpx;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}
						
						.avatar-preview {
							width: 80rpx;
							height: 80rpx;
							border-radius: 50%;
							background-color: #eee;
							margin-right: 10rpx;
							border: 1rpx solid #eee;
						}
					}
					
					// 退出登录样式
					&.logout-item {
						margin-top: 10rpx;
						
						.logout-label {
							color: #f56c6c;
						}
					}
				}
			}
		}
	}

	// 修改昵称输入框
	.nickname-input {
		height: 80rpx;
		background-color: #f8f8f8;
		border-radius: 10rpx;
		padding: 0 20rpx;
		font-size: 28rpx;
		margin-top: 20rpx;
	}

	// 性别选择器
	.gender-picker-container {
		background-color: #fff;
		border-radius: 20rpx 20rpx 0 0;
		padding-bottom: 30rpx;
		
		// 选择器头部
		.picker-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 30rpx;
			border-bottom: 1rpx solid #f5f5f5;
			
			.picker-title {
				font-size: 32rpx;
				font-weight: 500;
				color: #333;
			}
			
			.picker-close {
				font-size: 28rpx;
				color: #999;
			}
		}
		
		// 性别选项
		.gender-options {
			padding: 30rpx;
			
			.gender-option {
				height: 100rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 10rpx;
				margin-bottom: 20rpx;
				font-size: 32rpx;
				color: #333;
				border: 1rpx solid #eee;
				
				&.active {
					background-color: #4361ee;
					color: #fff;
					border-color: #4361ee;
				}
			}
		}
		
		// 确认按钮
		.confirm-button {
			margin: 20rpx 30rpx 0;
			height: 90rpx;
			background-color: #4361ee;
			color: #fff;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 10rpx;
			font-size: 32rpx;
			font-weight: 500;
		}
	}
</style>