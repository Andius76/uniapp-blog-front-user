<template>
	<view class="back-to-top" v-if="visible" @click="scrollToTop">
		<uni-icons :type="icon" :size="iconSize" :color="iconColor"></uni-icons>
		<text v-if="showText" class="text">{{ text }}</text>
	</view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { onPageScroll } from '@dcloudio/uni-app';

// 组件属性定义
const props = defineProps({
	// 显示阈值（滚动多少距离后显示）
	threshold: {
		type: Number,
		default: 300
	},
	// 图标类型
	icon: {
		type: String,
		default: 'top'
	},
	// 图标大小
	iconSize: {
		type: Number,
		default: 24
	},
	// 图标颜色
	iconColor: {
		type: String,
		default: '#ffffff'
	},
	// 是否显示文字
	showText: {
		type: Boolean,
		default: true
	},
	// 文字内容
	text: {
		type: String,
		default: '顶部'
	},
	// 动画持续时间
	duration: {
		type: Number,
		default: 0
	},
	// 样式相关
	right: {
		type: String,
		default: '30rpx'
	},
	bottom: {
		type: String,
		default: '100rpx'
	},
	// 是否使用页面滚动检测
	usePageScroll: {
		type: Boolean,
		default: true
	},
	// 如果页面有多个滚动区域，是否指定某个容器的ID
	containerId: {
		type: String,
		default: ''
	},
	// 点击后是否自动隐藏
	hideAfterClick: {
		type: Boolean,
		default: true
	}
});

// 状态管理
const scrollTop = ref(0);
const visible = ref(false);
let scrollListener = null;

// 监听页面滚动
const handlePageScroll = (e) => {
	scrollTop.value = e.scrollTop;
	visible.value = scrollTop.value > props.threshold;
};

// 滚动到顶部函数
const scrollToTop = () => {
	console.log('回到顶部组件: 点击滚动到顶部');
	
	// 用户反馈
	uni.showToast({
		title: '返回顶部',
		icon: 'none',
		duration: 300
	});
	
	try {
		// 使用uni-app API滚动到顶部，使用传入的duration参数
		uni.pageScrollTo({
			scrollTop: 0,
			duration: props.duration
		});
		
		// 点击后隐藏按钮
		if (props.hideAfterClick) {
			visible.value = false;
		}
		
		console.log('回到顶部组件: 执行滚动到顶部, duration:', props.duration);
	} catch (error) {
		console.error('回到顶部组件: 滚动到顶部出错:', error);
	}
};

// 生命周期钩子
onMounted(() => {
	if (props.usePageScroll) {
		// 使用页面滚动事件
		onPageScroll(handlePageScroll);
	} else if (props.containerId) {
		// 如果指定了容器ID，监听该容器的滚动事件
		setTimeout(() => {
			const container = document.getElementById(props.containerId);
			if (container) {
				scrollListener = (e) => {
					scrollTop.value = e.target.scrollTop;
					visible.value = scrollTop.value > props.threshold;
				};
				container.addEventListener('scroll', scrollListener);
			}
		}, 100);
	}
});

// 清理事件监听
onUnmounted(() => {
	if (!props.usePageScroll && props.containerId && scrollListener) {
		// #ifdef H5
		const container = document.getElementById(props.containerId);
		if (container) {
			container.removeEventListener('scroll', scrollListener);
		}
		// #endif
	}
});

// 导出组件方法
defineExpose({
	scrollToTop
});
</script>

<style lang="scss">
.back-to-top {
	position: fixed;
	right: v-bind(right);
	bottom: v-bind(bottom);
	width: 90rpx;
	height: 90rpx;
	border-radius: 50%;
	background-color: rgba(67, 97, 238, 0.8);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	z-index: 999;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	transition: all 0.3s ease;
	animation: fadeIn 0.3s ease;
	
	.text {
		font-size: 20rpx;
		color: #ffffff;
		margin-top: -5rpx;
	}
	
	&:active {
		opacity: 0.7;
		transform: scale(0.95);
	}
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(20px) scale(0.9);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
</style> 