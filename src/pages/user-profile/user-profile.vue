<template>
	<view class="container">
		<!-- 用户信息区域 -->
		<view class="user-info-section">
			<view class="user-header">
				<image class="avatar" :src="getAvatarUrl(userInfo.avatar)" mode="aspectFill"></image>
				<view class="user-meta">
					<view class="name-and-follow">
						<text class="nickname">{{ userInfo.nickname }}</text>
						<!-- 关注按钮，当用户不是自己时显示 -->
						<button v-if="!isSelf" class="follow-btn" :class="{'followed': isFollowing}" @click="toggleFollow">
							{{ isFollowing ? '已关注' : '+ 关注' }}
						</button>
					</view>
					<view class="bio-container">
						<text class="bio-label">个人简介：</text>
						<text class="bio">{{ userInfo.bio || '这个人很懒，什么都没写~' }}</text>
					</view>
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
	import { reactive, ref } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import http from '@/utils/request.js';
	import { checkUserFollow, followUser } from '@/api/user.js';
	import { getBaseUrl } from '@/utils/request'; // 引入统一的getBaseUrl函数

	// 基础URL配置 - 不再使用硬编码的值
	// const baseURL = 'http://localhost:8080';

	// 是否关注中
	const isFollowing = ref(false);
	// 是否是自己的主页
	const isSelf = ref(false);
	// 当前登录用户ID
	let currentUserId = null;

	// 获取头像完整URL
	const getAvatarUrl = (avatar) => {
		if (!avatar) return '/static/images/avatar.png';
		
		// 移除URL中可能存在的多余空格
		avatar = avatar.trim();
		
		// 确保不是null或undefined
		if (avatar === 'null' || avatar === 'undefined') {
			return '/static/images/avatar.png';
		}
		
		// 完整URL处理：如果已经是完整URL（包含http）则不处理
		if (avatar.startsWith('http')) {
			// 检查并修复双斜杠问题
			if (avatar.includes('//uploads')) {
				avatar = avatar.replace('//uploads', '/uploads');
			}
			return avatar;
		}
		// 静态资源处理：如果是静态资源路径则不处理
		else if (avatar.startsWith('/static')) {
			return avatar;
		}
		// 其他情况：添加基础URL前缀
		else {
			const baseUrl = getBaseUrl(); // 使用统一的获取baseUrl的方法
			
			// 处理不同格式的路径
			if (avatar.startsWith('/')) {
				return baseUrl + avatar;
			} else {
				// 确保路径中有uploads目录
				if (avatar.includes('uploads/')) {
					return baseUrl + '/' + avatar;
				} else {
					// 如果只是文件名，添加标准路径
					return baseUrl + '/uploads/avatars/' + avatar;
				}
			}
		}
	};

	// 用户信息
	const userInfo = reactive({
		id: '',
		nickname: '',
		avatar: '',
		bio: '',
		postCount: 0,
		followCount: 0,
		followerCount: 0,
		isFollowed: false
	});

	// 加载用户信息
	const loadUserInfo = async (userId) => {
		try {
			const res = await http.get(`/api/user/profile/${userId}`);
			if (res.code === 200) {
				Object.assign(userInfo, res.data);
				
				// 判断是否是自己的主页
				const localUserInfo = uni.getStorageSync('userInfo');
				if (localUserInfo) {
					currentUserId = localUserInfo.id;
					isSelf.value = Number(userId) === Number(localUserInfo.id);
				}
				
				// 如果不是自己的主页，检查是否已关注
				if (!isSelf.value) {
					checkFollowStatus();
				}
			}
		} catch (error) {
			console.error('获取用户信息失败:', error);
			uni.showToast({
				title: '获取用户信息失败',
				icon: 'none'
			});
		}
	};
	
	// 检查关注状态
	const checkFollowStatus = async () => {
		try {
			// 跳过自己，自己不能关注自己
			if (isSelf.value) {
				isFollowing.value = false;
				return;
			}
			
			// 尝试使用check-follow API (如果后端已实现)
			try {
				console.log('尝试检查关注状态...');
				const res = await checkUserFollow(userInfo.id);
				if (res.code === 200) {
					isFollowing.value = res.data.following;
					console.log('关注状态检查结果:', isFollowing.value);
					return;
				}
			} catch (apiError) {
				console.log('check-follow API不存在或请求失败，使用降级方案:', apiError);
			}
			
			// 降级方案1：检查用户资料中是否有isFollowed标志
			if (userInfo.isFollowed !== undefined) {
				isFollowing.value = userInfo.isFollowed;
				console.log('使用用户数据中的isFollowed:', isFollowing.value);
				return;
			}
			
			// 降级方案2：通过关注列表API检查
			console.log('尝试通过关注列表API检查关注状态...');
			try {
				// 获取关注列表第一页，检查是否包含当前用户
				const followsRes = await http.get('/api/user/follows', { 
					page: 1, 
					pageSize: 100,
					// 添加用户昵称作为搜索关键词，如果后端支持搜索功能，可以减少返回数据量
					keyword: userInfo.nickname
				});
				
				if (followsRes.code === 200) {
					const isFound = followsRes.data.list.some(user => Number(user.id) === Number(userInfo.id));
					isFollowing.value = isFound;
					console.log('通过关注列表API检查结果:', isFollowing.value);
					return;
				}
			} catch (followError) {
				console.error('获取关注列表失败:', followError);
			}
			
			// 最终降级：默认为未关注状态
			console.log('所有检查方法都失败，默认设置为未关注状态');
			isFollowing.value = false;
		} catch (error) {
			console.error('检查关注状态失败:', error);
			isFollowing.value = false;
		}
	};
	
	// 切换关注状态
	const toggleFollow = async () => {
		// 防止自己关注自己
		if (isSelf.value) {
			uni.showToast({
				title: '不能关注自己',
				icon: 'none'
			});
			return;
		}
		
		if (!userInfo.id) return;
		
		// 如果是已关注状态，弹出确认对话框
		if (isFollowing.value) {
			uni.showModal({
				title: '取消关注',
				content: `确定不再关注"${userInfo.nickname}"吗？`,
				confirmText: '确定',
				cancelText: '取消',
				success: async (res) => {
					if (res.confirm) {
						await performFollowToggle();
					}
				}
			});
		} else {
			// 如果是未关注状态，直接执行关注操作
			await performFollowToggle();
		}
	};
	
	// 执行关注/取消关注操作
	const performFollowToggle = async () => {
		try {
			uni.showLoading({ title: isFollowing.value ? '取消关注中...' : '关注中...' });
			
			// 使用followUser函数替代直接http请求
			const res = await followUser(userInfo.id, !isFollowing.value);
			
			if (res.code === 200) {
				// 更新关注状态
				isFollowing.value = !isFollowing.value;
				
				// 更新粉丝数
				userInfo.followerCount += isFollowing.value ? 1 : -1;
				
				uni.showToast({
					title: isFollowing.value ? '关注成功' : '已取消关注',
					icon: isFollowing.value ? 'success' : 'none'
				});
			} else if (res.code === 409) {
				// 处理已关注的情况
				if (!isFollowing.value) {
					isFollowing.value = true;
					uni.showToast({
						title: '已经关注过该用户',
						icon: 'none'
					});
				} else {
					uni.showToast({
						title: '您未关注该用户',
						icon: 'none'
					});
				}
			} else {
				throw new Error(res.message || '操作失败');
			}
		} catch (error) {
			console.error('关注操作失败:', error);
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
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
				flex-shrink: 0; /* 防止头像缩小 */
			}

			.user-meta {
				flex: 1;
				width: 0; /* 确保宽度自适应 */
				
				.name-and-follow {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 8rpx;
					
					.nickname {
						font-size: 32rpx;
						font-weight: bold;
						color: #333;
					}
					
					.follow-btn {
						margin: 0;
						padding: 0 20rpx;
						height: 50rpx;
						line-height: 46rpx;
						font-size: 24rpx;
						background-color: #fff;
						color: #4361ee;
						border: 2rpx solid #4361ee;
						border-radius: 25rpx;
						
						&.followed {
							color: #999;
							border-color: #999;
						}
					}
				}

				.bio-container {
					display: flex;
					flex-wrap: wrap; /* 允许内容换行 */
					width: 100%; /* 确保容器占满可用空间 */
					max-width: 100%; /* 限制最大宽度 */
					
					.bio-label {
						font-size: 24rpx;
						color: #666;
						font-weight: 500;
						flex-shrink: 0; /* 防止标签缩小 */
					}
					
					.bio {
						font-size: 24rpx;
						color: #999;
						flex: 1; /* 内容自适应宽度 */
						max-width: 100%; /* 限制最大宽度 */
						line-height: 1.4; /* 保留合适的行高 */
						word-wrap: break-word; /* 允许长单词换行 */
						/* 兼容各平台 */
						/* #ifdef H5 */
						box-sizing: border-box;
						/* #endif */
						/* #ifdef MP-WEIXIN */
						box-sizing: border-box;
						/* #endif */
						/* #ifdef APP-PLUS */
						box-sizing: border-box;
						/* #endif */
					}
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