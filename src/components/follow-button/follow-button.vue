<template>
	<button class="follow-btn" :class="{'followed': isFollowed}" @click.stop="toggleFollow">
		{{ isFollowed ? '已关注' : '+ 关注' }}
	</button>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { followUser, checkUserFollow } from '@/api/user.js'; // 导入用户API函数

// 定义组件属性
const props = defineProps({
	// 用户ID
	userId: {
		type: [Number, String],
		required: true
	},
	// 用户昵称（用于确认对话框显示）
	nickname: {
		type: String,
		default: '该用户'
	},
	// 初始关注状态
	followed: {
		type: Boolean,
		default: false
	},
	// 是否自动检查关注状态
	autoCheck: {
		type: Boolean,
		default: true
	}
});

// 定义事件
const emit = defineEmits(['follow-change', 'update:followed']);

// 关注状态
const isFollowed = ref(props.followed);

// 检查登录状态
const isLoggedIn = () => {
	return !!uni.getStorageSync('token');
};

// 监听followed属性变化
watch(() => props.followed, (newVal) => {
	isFollowed.value = newVal;
});

/**
 * 检查关注状态
 */
const checkFollowStatus = async () => {
	// 如果没有登录，不检查
	if (!isLoggedIn()) return;
	
	// 如果没有传递用户ID，不检查
	if (!props.userId) return;
	
	try {
		const result = await checkUserFollow(props.userId);
		if (result.code === 200) {
			// 如果后端返回的关注状态与当前状态不同，更新状态
			if (isFollowed.value !== result.data) {
				isFollowed.value = result.data;
				
				// 通知父组件状态已更新
				emit('follow-change', result.data);
				emit('update:followed', result.data);
				
				console.log(`用户${props.userId}的关注状态已更新为: ${result.data}`);
			}
		}
	} catch (error) {
		console.error('检查关注状态失败:', error);
	}
};

/**
 * 切换关注状态
 */
const toggleFollow = () => {
	// 检查是否登录
	if (!isLoggedIn()) {
		uni.showToast({
			title: '请先登录',
			icon: 'none'
		});
		
		// 延迟跳转到登录页
		setTimeout(() => {
			uni.navigateTo({
				url: '/pages/login/login'
			});
		}, 1500);
		return;
	}

	const currentFollowState = isFollowed.value;

	// 如果当前是已关注状态，执行取消关注操作
	if (currentFollowState) {
		// 显示确认对话框
		uni.showModal({
			title: '取消关注',
			content: `确定不再关注"${props.nickname}"吗？`,
			success: (res) => {
				if (res.confirm) {
					// 显示加载中
					uni.showLoading({ title: '取消关注中...' });
					
					// 调用取消关注API
					followUser(props.userId, false).then(res => {
						if (res.code !== 200) {
							throw new Error(res.message || '取消关注失败');
						}
						
						// 更新UI状态
						isFollowed.value = false;
						
						// 触发事件通知父组件
						emit('follow-change', false);
						emit('update:followed', false);
						
						uni.showToast({
							title: '已取消关注',
							icon: 'none'
						});
					}).catch(err => {
						console.error('取消关注失败', err);
						uni.showToast({
							title: '取消关注失败，请重试',
							icon: 'none'
						});
					}).finally(() => {
						uni.hideLoading();
					});
				}
			}
		});
	} else {
		// 当前是未关注状态，执行关注操作
		uni.showLoading({ title: '关注中...' });
		
		// 调用关注API
		followUser(props.userId, true).then(res => {
			if (res.code !== 200) {
				// 处理409已关注的情况，不作为错误处理
				if (res.code === 409) {
					// 如果后端返回已关注，直接更新UI状态为已关注
					isFollowed.value = true;
					emit('follow-change', true);
					emit('update:followed', true);
					
					uni.showToast({
						title: '已关注该用户',
						icon: 'none'
					});
					return;
				}
				throw new Error(res.message || '关注失败');
			}
			
			// 更新UI状态
			isFollowed.value = true;
			
			// 触发事件通知父组件
			emit('follow-change', true);
			emit('update:followed', true);
			
			uni.showToast({
				title: '关注成功',
				icon: 'success'
			});
		}).catch(err => {
			console.error('关注失败', err);
			uni.showToast({
				title: '关注失败，请重试',
				icon: 'none'
			});
		}).finally(() => {
			uni.hideLoading();
		});
	}
};

// 组件挂载时，如果设置了自动检查，则检查关注状态
onMounted(() => {
	if (props.autoCheck) {
		checkFollowStatus();
	}
});
</script>

<style lang="scss" scoped>
.follow-btn {
	height: 50rpx;
	line-height: 50rpx;
	background-color: #fff;
	color: #4361ee;
	font-size: 24rpx;
	border: 2rpx solid #4361ee;
	border-radius: 25rpx;
	padding: 0 20rpx;
	min-width: 120rpx;
	flex-shrink: 0;

	&.followed {
		color: #999;
		border-color: #999;
	}
}
</style> 