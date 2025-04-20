<template>
	<view class="container">
		<view class="login-container">
			<view class="title-area">
				<text class="title">页面导航测试</text>
				<text class="subtitle">点击按钮跳转到对应页面</text>
			</view>

			<view class="nav-buttons">
				<button 
					v-for="(route, index) in routes" 
					:key="index"
					class="btn-login"
					@click="navigateTo(route.path)"
				>
					{{ route.title }}
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
const routes = [
	{ title: '登录页面', path: '/pages/login/login' },
	{ title: '注册页面', path: '/pages/register/register' },
	{ title: '忘记密码', path: '/pages/forget-password/forget-password' },
	{ title: '首页', path: '/pages/index/index' },
	{ title: '个人中心', path: '/pages/my/my' },
	{ title: '消息中心', path: '/pages/message/message' },
	{ title: '内容发布', path: '/pages/publish/publish' },
	{ title: '分类查看', path: '/pages/classification/classification' }
];

const navigateTo = (path) => {
	uni.navigateTo({
		url: path
	});
};
</script>

<style lang="scss" scoped>
.nav-buttons {
	display: flex;
	flex-direction: column;
	gap: 30rpx;
	padding: 40rpx 0;
}

.btn-login {
	margin: 0 !important;
}
</style>