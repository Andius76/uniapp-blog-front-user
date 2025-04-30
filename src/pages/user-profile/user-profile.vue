<template>
	<view class="container">
		<!-- 用户信息区域 -->
		<view class="user-info-section">
			<view class="user-header">
				<image class="avatar" :src="getAvatarUrl(userInfo.avatar)" mode="aspectFill"></image>
				<view class="user-meta">
					<text class="nickname">{{ userInfo.nickname }}</text>
					<text class="bio">{{ userInfo.bio || '这个人很懒，什么都没写~' }}</text>
				</view>
			</view>

			<!-- 用户统计信息 -->
			<view class="user-stats">
				<view class="stat-item">
					<text class="num">{{ userInfo.postCount || 0 }}</text>
					<text class="label">发表</text>
				</view>
				<view class="stat-item">
					<text class="num">{{ userInfo.followCount || 0 }}</text>
					<text class="label">关注</text>
				</view>
				<view class="stat-item">
					<text class="num">{{ userInfo.followerCount || 0 }}</text>
					<text class="label">粉丝</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { reactive } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import http from '@/utils/request.js';

	// 基础URL配置
	const baseURL = 'http://localhost:8080';

	// 获取头像完整URL
	const getAvatarUrl = (avatar) => {
		if (!avatar) return '/static/images/avatar.png';
		if (avatar.startsWith('http')) return avatar;
		// 如果是完整的相对路径（以/uploads开头）
		if (avatar.startsWith('/uploads')) {
			return `${baseURL}${avatar}`;
		}
		// 如果只是文件名
		return `${baseURL}/uploads/avatars/${avatar}`;
	};

	// 用户信息
	const userInfo = reactive({
		id: '',
		nickname: '',
		avatar: '',
		bio: '',
		postCount: 0,
		followCount: 0,
		followerCount: 0
	});

	// 加载用户信息
	const loadUserInfo = async (userId) => {
		try {
			const res = await http.get(`/api/user/profile/${userId}`);
			if (res.code === 200) {
				Object.assign(userInfo, res.data);
			}
		} catch (error) {
			console.error('获取用户信息失败:', error);
			uni.showToast({
				title: '获取用户信息失败',
				icon: 'none'
			});
		}
	};

	// 页面加载
	onLoad((options) => {
		if (options.id) {
			userInfo.id = options.id;
			loadUserInfo(options.id);
		} else {
			uni.showToast({
				title: '用户ID不存在',
				icon: 'none'
			});
		}
	});
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
	}

	.user-info-section {
		background-color: #fff;
		padding: 30rpx;
		margin-bottom: 20rpx;

		.user-header {
			display: flex;
			align-items: center;

			.avatar {
				width: 120rpx;
				height: 120rpx;
				border-radius: 50%;
				margin-right: 20rpx;
				background-color: #eee;
			}

			.user-meta {
				flex: 1;

				.nickname {
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 8rpx;
					display: block;
				}

				.bio {
					font-size: 24rpx;
					color: #999;
					display: block;
				}
			}
		}

		.user-stats {
			display: flex;
			justify-content: space-around;
			margin-top: 30rpx;
			padding: 20rpx 0;
			border-top: 1rpx solid #f0f0f0;

			.stat-item {
				text-align: center;

				.num {
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					display: block;
				}

				.label {
					font-size: 24rpx;
					color: #999;
					margin-top: 8rpx;
					display: block;
				}
			}
		}
	}
</style>