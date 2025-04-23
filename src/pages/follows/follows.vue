<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<!-- #ifdef H5 -->
		<view class="navbar">
			<view class="navbar-left" @click="goBack">
				<uni-icons type="back" size="24" color="#333"></uni-icons>
			</view>
			<view class="navbar-title">我的关注</view>
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
						<image class="avatar" :src="user.avatar || '/static/images/avatar.png'" mode="aspectFill">
						</image>
						<view class="user-details">
							<text class="nickname">{{ user.nickname }}</text>
							<text class="bio">{{ user.bio }}</text>
						</view>
					</view>

					<!-- 关注按钮 -->
					<view class="follow-btn" :class="{'followed': user.isFollowed}" @click="toggleFollow(index)">
						<text>{{ user.isFollowed ? '已关注' : '关注' }}</text>
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

	// 关注列表数据
	const followList = ref([]);
	const searchKeyword = ref('');
	const isLoading = ref(false);
	const isRefreshing = ref(false);
	const noMoreData = ref(false);
	let currentPage = 1;
	const pageSize = 10;

	// 模拟关注数据
	const mockFollowData = [{
			id: 1,
			nickname: '前端开发者',
			avatar: '/static/images/avatar.png',
			bio: '分享前端开发技术和经验',
			isFollowed: true
		},
		{
			id: 2,
			nickname: 'UI设计师',
			avatar: '/static/images/avatar.png',
			bio: '专注UI/UX设计，热爱创造美好的用户体验',
			isFollowed: true
		},
		{
			id: 3,
			nickname: '全栈工程师',
			avatar: '/static/images/avatar.png',
			bio: '全栈开发，偶尔写写技术文章',
			isFollowed: true
		},
		{
			id: 4,
			nickname: '产品经理',
			avatar: '/static/images/avatar.png',
			bio: '关注用户体验与产品设计',
			isFollowed: true
		}
	];

	/**
	 * 加载关注列表
	 */
	const loadFollowList = () => {
		// 如果已经没有更多数据或正在加载中，则不处理
		if (noMoreData.value || isLoading.value) return;

		isLoading.value = true;

		// 模拟API请求延迟
		setTimeout(() => {
			// 模拟分页数据
			const startIndex = (currentPage - 1) * pageSize;
			const endIndex = startIndex + pageSize;
			const pageData = mockFollowData.slice(startIndex, endIndex);

			// 如果没有获取到数据，说明已经没有更多数据了
			if (pageData.length === 0) {
				noMoreData.value = true;
				isLoading.value = false;

				// 如果是刷新状态，结束刷新
				if (isRefreshing.value) {
					isRefreshing.value = false;
				}
				return;
			}

			// 添加到关注列表
			if (currentPage === 1) {
				followList.value = [...pageData];
			} else {
				followList.value.push(...pageData);
			}

			// 更新页码
			currentPage++;

			// 如果获取的数据不足一页，标记为没有更多数据
			if (pageData.length < pageSize) {
				noMoreData.value = true;
			}

			isLoading.value = false;

			// 如果是刷新状态，结束刷新
			if (isRefreshing.value) {
				isRefreshing.value = false;
			}
		}, 800);

		// TODO: 替换为实际API调用
		// api.getFollowList({
		//   page: currentPage,
		//   pageSize: pageSize,
		//   keyword: searchKeyword.value
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
		user.isFollowed = !user.isFollowed;

		// 如果取消关注，可以选择从列表中移除
		if (!user.isFollowed) {
			// 显示确认对话框
			uni.showModal({
				title: '取消关注',
				content: `确定不再关注"${user.nickname}"吗？`,
				success: (res) => {
					if (res.confirm) {
						// 用户确认，从列表中移除
						followList.value.splice(index, 1);

						uni.showToast({
							title: '已取消关注',
							icon: 'none'
						});

						// TODO: 实际API调用
						// api.followUser(user.id, false).then(res => {
						//   console.log('取消关注成功');
						// });
					} else {
						// 用户取消，恢复关注状态
						user.isFollowed = true;
					}
				}
			});
		} else {
			// 关注操作提示
			uni.showToast({
				title: '关注成功',
				icon: 'success'
			});

			// TODO: 实际API调用
			// api.followUser(user.id, true).then(res => {
			//   console.log('关注成功');
			// });
		}
	};

	/**
	 * 返回上一页
	 */
	const goBack = () => {
		uni.navigateBack();
	};

	/**
	 * 跳转到用户资料页
	 * @param {Number} userId - 用户ID
	 */
	const navigateToUserProfile = (userId) => {
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

	// 页面初始化
	onMounted(() => {
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
				}

				.user-details {
					flex: 1;

					.nickname {
						font-size: 30rpx;
						color: #333;
						font-weight: 500;
						margin-bottom: 6rpx;
						display: block;
					}

					.bio {
						font-size: 24rpx;
						color: #666;
						display: block;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						max-width: 400rpx;
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