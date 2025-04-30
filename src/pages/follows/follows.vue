<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<!-- #ifdef H5 -->
		<view class="navbar">
			<view class="navbar-left"></view>
			<view class="navbar-title">{{ userInfo.nickname }}的关注</view>
			<view class="navbar-right"></view>
		</view>
		<!-- #endif -->
		<!-- 搜索框 -->
		<view class="search-box">
			<view class="search-input">
				<uni-icons type="search" size="20" color="#999"></uni-icons>
				<input type="text" v-model="searchKeyword" placeholder="搜索关注的人" @input="handleSearch"
					confirm-type="search" />
				<uni-icons v-if="searchKeyword" type="clear" size="18" color="#999" @click="clearSearch"></uni-icons>
			</view>
		</view>

		<!-- 关注列表 -->
		<scroll-view scroll-y class="follow-list" @scrolltolower="loadMore" refresher-enabled
			:refresher-triggered="isRefreshing" @refresherrefresh="refreshList">
			<!-- 列表内容 -->
			<view v-if="followList.length > 0">
				<view v-for="(user, index) in followList" :key="index" class="follow-item">
					<!-- 用户信息 -->
					<view class="user-info" @click="navigateToUserProfile(user.id)">
						<image class="avatar" :src="getAvatarUrl(user.avatar)" mode="aspectFill">
						</image>
						<view class="user-details">
							<text class="nickname">{{ user.nickname }}</text>
							<text class="bio">{{ user.bio }}</text>
						</view>
					</view>

					<!-- 关注按钮 -->
					<view class="follow-btn" :class="{'followed': user.isFollowedByMe}" @click="toggleFollow(index)">
						<text>{{ user.isFollowedByMe ? '已关注' : '关注' }}</text>
					</view>
				</view>
			</view>

			<!-- 无内容提示 -->
			<view v-else-if="!isLoading" class="empty-state">
				<uni-icons type="person-filled" size="50" color="#ddd"></uni-icons>
				<text>暂未关注任何人</text>
				<view class="action-btn" @click="navigateToDiscover">去发现更多</view>
			</view>

			<!-- 加载状态 -->
			<view class="loading-state">
				<text v-if="isLoading">加载中...</text>
				<text v-else-if="noMoreData && followList.length > 0">没有更多了</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import {
		ref,
		reactive,
		onMounted
	} from 'vue';
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
	import http from '@/utils/request.js'; // 导入封装的请求工具

	// 基础URL配置
	const baseURL = 'http://localhost:8080';

	// 获取头像完整URL
	const getAvatarUrl = (avatar) => {
		if (!avatar) return '/static/images/avatar.png';
		if (avatar.startsWith('http')) return avatar;
		return `${baseURL}/uploads/avatars/${avatar}`;
	};

	// 关注列表数据
	const followList = ref([]);
	const searchKeyword = ref('');
	const isLoading = ref(false);
	const isRefreshing = ref(false);
	const noMoreData = ref(false);
	let currentPage = 1;
	const pageSize = 10;

	// 用户信息
	const userInfo = reactive({
		nickname: '',
		avatar: '',
		id: ''
	});

	/**
	 * 获取用户信息
	 */
	const getUserInfo = () => {
		// 从本地存储获取用户信息
		const localUserInfo = uni.getStorageSync('userInfo');
		if (localUserInfo) {
			userInfo.nickname = localUserInfo.nickname || '用户';
			userInfo.avatar = localUserInfo.avatar;
			userInfo.id = localUserInfo.id;
		}
	};

	/**
	 * 加载关注列表
	 */
	const loadFollowList = () => {
		// 如果已经没有更多数据或正在加载中，则不处理
		if (noMoreData.value || isLoading.value) return;

		isLoading.value = true;

		// 调用后端API获取关注列表
		http.get('/api/user/follows', {
			page: currentPage,
			pageSize: pageSize,
			keyword: searchKeyword.value
		}).then(res => {
			const { list, total, pages } = res.data;

			// 添加到关注列表
			if (currentPage === 1) {
				followList.value = [...list];
			} else {
				followList.value.push(...list);
			}

			// 更新页码
			currentPage++;

			// 如果获取的数据不足一页，标记为没有更多数据
			if (list.length < pageSize || followList.value.length >= total) {
				noMoreData.value = true;
			}
		}).catch(err => {
			console.error('获取关注列表失败', err);
		}).finally(() => {
			isLoading.value = false;
			// 如果是刷新状态，结束刷新
			if (isRefreshing.value) {
				isRefreshing.value = false;
			}
		});
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
		followList.value = [];
		currentPage = 1;
		noMoreData.value = false;

		// 重新加载
		loadFollowList();
	};

	/**
	 * 加载更多
	 */
	const loadMore = () => {
		if (!noMoreData.value) {
			loadFollowList();
		}
	};

	/**
	 * 处理搜索
	 */
	const handleSearch = () => {
		// 重置数据
		followList.value = [];
		currentPage = 1;
		noMoreData.value = false;

		// 重新加载
		loadFollowList();
	};

	/**
	 * 清除搜索
	 */
	const clearSearch = () => {
		searchKeyword.value = '';
		handleSearch();
	};

	/**
	 * 切换关注状态
	 * @param {Number} index - 用户索引
	 */
	const toggleFollow = (index) => {
		const user = followList.value[index];

		// 如果取消关注，显示确认对话框
		if (user.isFollowedByMe) {
			uni.showModal({
				title: '取消关注',
				content: `确定不再关注"${user.nickname}"吗？`,
				success: (res) => {
					if (res.confirm) {
						// 调用取消关注API
						http.delete(`/api/user/follow/${user.id}`).then(res => {
							// 更新UI状态
							user.isFollowedByMe = false;
							uni.showToast({
								title: '已取消关注',
								icon: 'none'
							});
						}).catch(err => {
							console.error('取消关注失败', err);
						});
					}
				}
			});
		} else {
			// 调用关注API
			http.post(`/api/user/follow/${user.id}`).then(res => {
				// 更新UI状态
				user.isFollowedByMe = true;
				uni.showToast({
					title: '关注成功',
					icon: 'success'
				});
			}).catch(err => {
				console.error('关注失败', err);
			});
		}
	};

	/**
	 * 跳转到用户资料页
	 * @param {Number} userId - 用户ID
	 */
	const navigateToUserProfile = (userId) => {
		// #ifdef H5
		// 获取当前页面的完整URL
		const currentUrl = window.location.href;
		// 提取基础URL（去除路径部分）
		const baseUrl = currentUrl.split('#')[0];
		// 在H5环境下，使用window.open在新窗口打开用户资料页
		window.open(`${baseUrl}#/pages/user-profile/user-profile?id=${userId}`, '_blank');
		return;
		// #endif

		// 其他平台使用普通跳转
		uni.navigateTo({
			url: `/pages/user-profile/user-profile?id=${userId}`
		});
	};

	/**
	 * 跳转到发现页面
	 */
	const navigateToDiscover = () => {
		uni.switchTab({
			url: '/pages/index/index'
		});
	};

	/**
	 * 返回上一页
	 */
	const goBack = () => {
		// 获取当前页面栈
		const pages = getCurrentPages();
		if (pages.length > 1) {
			// 如果有上一页，则直接返回
			uni.navigateBack();
		} else {
			// 如果没有上一页，则跳转到我的页面
			uni.switchTab({
				url: '/pages/my/my'
			});
		}
	};

	// 页面初始化
	onMounted(() => {
		getUserInfo();
		// 加载关注列表
		loadFollowList();
	});
</script>

<style lang="scss">
	.container {
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	// 顶部导航栏
	.navbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 90rpx;
		padding: 0 30rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #f0f0f0;
		position: sticky;
		top: 0;
		z-index: 100;

		.navbar-left,
		.navbar-right {
			width: 60rpx;
			display: flex;
			align-items: center;
		}

		.navbar-title {
			font-size: 34rpx;
			font-weight: bold;
			color: #333;
		}
	}

	// 搜索框
	.search-box {
		padding: 20rpx 30rpx;
		background-color: #fff;

		.search-input {
			display: flex;
			align-items: center;
			background-color: #f5f5f5;
			border-radius: 36rpx;
			padding: 14rpx 24rpx;

			.uni-icons {
				margin-right: 10rpx;
			}

			input {
				flex: 1;
				height: 60rpx;
				font-size: 28rpx;
			}
		}
	}

	// 关注列表
	.follow-list {
		height: calc(100vh - 210rpx);

		.follow-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 30rpx;
			margin-bottom: 2rpx;
			background-color: #fff;
			height: 160rpx;

			.user-info {
				flex: 1;
				display: flex;
				align-items: center;

				.avatar {
					width: 100rpx;
					height: 100rpx;
					border-radius: 50%;
					background-color: #eee;
					margin-right: 20rpx;
					flex-shrink: 0;
				}

				.user-details {
					flex: 1;
					width: 0;
					overflow: hidden;

					.nickname {
						font-size: 30rpx;
						color: #333;
						font-weight: 500;
						margin-bottom: 6rpx;
						display: block;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}

					.bio {
						font-size: 24rpx;
						color: #666;
						display: block;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						max-width: 420rpx;
						line-height: 1.2;
					}
				}
			}

			.follow-btn {
				min-width: 140rpx;
				height: 60rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				background-color: #4361ee;
				color: #fff;
				border-radius: 30rpx;
				font-size: 28rpx;
				flex-shrink: 0;

				&.followed {
					background-color: #f2f2f2;
					color: #666;
					border: 1rpx solid #ddd;
				}
			}
		}
	}

	// 空状态
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;

		text {
			font-size: 28rpx;
			color: #999;
			margin-top: 20rpx;
			margin-bottom: 30rpx;
		}

		.action-btn {
			padding: 16rpx 40rpx;
			background-color: #4361ee;
			color: #fff;
			border-radius: 30rpx;
			font-size: 28rpx;
		}
	}

	// 加载状态
	.loading-state {
		text-align: center;
		font-size: 24rpx;
		color: #999;
		padding: 20rpx 0;
	}
</style>