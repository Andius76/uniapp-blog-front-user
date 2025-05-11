<template>
	<button class="follow-btn" :class="{'followed': isFollowed}" @click.stop="toggleFollow" v-if="showButton">
		{{ isFollowed ? '已关注' : '+ 关注' }}
	</button>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { followUser, checkUserFollow, getUserInfo } from '@/api/user.js'; // 导入用户API函数

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
// 当前登录用户ID
const currentUserId = ref(null);
// 是否正在加载
const isLoading = ref(false);

// 计算属性：是否显示关注按钮（不能关注自己）
const showButton = computed(() => {
	// 如果是未知用户或当前用户ID未获取，默认显示
	if (!currentUserId.value) return true;
	
	// 如果是当前登录用户，不显示关注按钮
	return currentUserId.value !== Number(props.userId);
});

// 检查登录状态
const isLoggedIn = () => {
	return !!uni.getStorageSync('token');
};

// 获取当前登录用户信息
const fetchCurrentUser = async () => {
	if (!isLoggedIn()) return;
	
	try {
		const userInfo = uni.getStorageSync('userInfo');
		if (userInfo && userInfo.id) {
			currentUserId.value = userInfo.id;
		} else {
			// 如果本地存储没有，从API获取
			const res = await getUserInfo();
			if (res.code === 200 && res.data) {
				currentUserId.value = res.data.id;
				// 更新本地存储
				uni.setStorageSync('userInfo', res.data);
			}
		}
	} catch (error) {
		console.error('获取当前用户信息失败:', error);
	}
};

// 监听followed属性变化
watch(() => props.followed, (newVal) => {
	isFollowed.value = newVal;
});

/**
 * 检查关注状态
 */
const checkFollowStatus = async () => {
	// 如果没有登录或正在加载，不检查
	if (!isLoggedIn() || isLoading.value) return;
	
	// 如果没有传递用户ID，不检查
	if (!props.userId) return;
	
	// 获取当前用户信息（如果未获取）
	if (!currentUserId.value) {
		await fetchCurrentUser();
	}
	
	// 如果是当前用户自己，不需要检查关注状态
	if (currentUserId.value === Number(props.userId)) {
		return;
	}
	
	isLoading.value = true;
	
	try {
		const result = await checkUserFollow(props.userId);
		if (result.code === 200) {
			// 检查响应数据结构
			let followStatus = false;
			
			// 根据API返回的数据结构处理
			if (typeof result.data === 'boolean') {
				// 如果直接返回布尔值
				followStatus = result.data;
			} else if (result.data && typeof result.data.following === 'boolean') {
				// 如果返回对象中包含following字段
				followStatus = result.data.following;
			}
			
			// 更新状态
			isFollowed.value = followStatus;
			
			// 通知父组件状态已更新
			emit('follow-change', followStatus);
			emit('update:followed', followStatus);
			
			console.log(`用户${props.userId}的关注状态已更新为:`, followStatus);
		}
	} catch (error) {
		console.error('检查关注状态失败:', error);
	} finally {
		isLoading.value = false;
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
	
	// 防止重复点击
	if (isLoading.value) {
		return;
	}
	
	isLoading.value = true;
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
						if (res.code === 200) {
							// 更新UI状态
							isFollowed.value = false;
							
							// 触发事件通知父组件
							emit('follow-change', false);
							emit('update:followed', false);
							
							uni.showToast({
								title: '已取消关注',
								icon: 'none'
							});
						} else if (res.code === 409) {
							// 处理409错误（未关注该用户）
							isFollowed.value = false;
							emit('follow-change', false);
							emit('update:followed', false);
							
							uni.showToast({
								title: '未关注该用户',
								icon: 'none'
							});
						} else {
							uni.showToast({
								title: res.message || '取消关注失败',
								icon: 'none'
							});
						}
					}).catch(err => {
						console.error('取消关注失败', err);
						uni.showToast({
							title: '取消关注失败，请重试',
							icon: 'none'
						});
					}).finally(() => {
						uni.hideLoading();
						isLoading.value = false;
					});
				} else {
					// 用户取消操作
					isLoading.value = false;
				}
			}
		});
	} else {
		// 当前是未关注状态，执行关注操作
		uni.showLoading({ title: '关注中...' });
		
		// 调用关注API
		followUser(props.userId, true).then(res => {
			if (res.code === 200) {
				// 更新UI状态
				isFollowed.value = true;
				
				// 触发事件通知父组件
				emit('follow-change', true);
				emit('update:followed', true);
				
				uni.showToast({
					title: '关注成功',
					icon: 'success'
				});
			} else if (res.code === 409) {
				// 处理409已关注的情况
				isFollowed.value = true;
				emit('follow-change', true);
				emit('update:followed', true);
				
				uni.showToast({
					title: '已关注该用户',
					icon: 'none'
				});
			} else {
				uni.showToast({
					title: res.message || '关注失败',
					icon: 'none'
				});
			}
		}).catch(err => {
			console.error('关注失败', err);
			uni.showToast({
				title: '关注失败，请重试',
				icon: 'none'
			});
		}).finally(() => {
			uni.hideLoading();
			isLoading.value = false;
		});
	}
};

// 组件挂载时，获取当前用户信息并检查关注状态
onMounted(async () => {
	// 获取当前用户信息
	await fetchCurrentUser();
	
	// 如果设置了自动检查，则检查关注状态
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