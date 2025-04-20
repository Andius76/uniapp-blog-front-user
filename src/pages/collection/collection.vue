<template>
	<view>
		<button @click="login">跳转到登录</button>
		<button @click="index">跳转到首页</button>
	</view>
</template>

<script setup>
	
const login = () => {
	uni.navigateTo({
		url: '/pages/login/login'
	});
}
const index = () => {
	uni.navigateTo({
		url: '/pages/index/index'
	});
}
</script>

<style lang="scss">
	button {
		width: 100%;
		height: 40px;
		border: 1px solid #ccc;
		border-radius: 5px;
		margin-bottom: 10px;
	}
</style>
