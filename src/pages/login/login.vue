<template>
	<view class="container">
		<view class="login-container">
			<view class="title-area">
				<text class="title">登录</text>
				<text class="subtitle">欢迎回来，请输入您的账号密码</text>
			</view>
			<form @submit.prevent="handleSubmit">
				<view class="form-area">
					<view class="input-group">
						<text class="input-label">手机号/邮箱</text>
						<input type="text" class="input-field" v-model="formData.username" placeholder="请输入手机号/邮箱"
							@input="validateUsername" />
						<text v-if="errors.username"
							class="validation-feedback show-feedback">{{ errors.username }}</text>
					</view>

					<view class="input-group">
						<text class="input-label">密码</text>
						<input :type="showPassword ? 'text' : 'password'" class="input-field"
							v-model="formData.password" placeholder="请输入密码" @input="validatePassword" />
						<text v-if="errors.password"
							class="validation-feedback show-feedback">{{ errors.password }}</text>
					</view>

					<view class="form-options">
						<label class="remember-me">
							<checkbox :checked="formData.remember" @change="handleRememberChange" color="#4361ee"
								scale="0.7" />
							<text>保持登录</text>
						</label>
						<text @click="goToForgotPassword" class="forgot-password">忘记密码</text>
					</view>

					<button class="btn-login" :disabled="loading" @click="handleSubmit">
						<text v-if="!loading">立即登录</text>
						<text v-else>登录中...</text>
					</button>

					<view class="register-link">
						<text>没有账号？</text>
						<text @click="goToRegister" class="register-text">立即注册</text>
					</view>
				</view>
			</form>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		reactive
	} from 'vue';

	// 表单数据
	const formData = reactive({
		username: '',
		password: '',
		remember: false
	});

	// 错误信息
	const errors = reactive({
		username: '',
		password: ''
	});

	// 加载状态
	const loading = ref(false);
	// 是否显示密码
	const showPassword = ref(false);

	// 验证用户名（邮箱或手机号）
	const validateUsername = () => {
		const value = formData.username.trim();
		if (!value) {
			errors.username = '请输入手机号或邮箱';
			return false;
		}

		// 验证邮箱或手机号格式
		const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
		const isPhone = /^1[3-9]\d{9}$/.test(value);

		if (!isEmail && !isPhone) {
			errors.username = '请输入有效的邮箱或手机号';
			return false;
		}

		errors.username = '';
		return true;
	};

	// 验证密码
	const validatePassword = () => {
		const value = formData.password.trim();
		if (!value) {
			errors.password = '请输入密码';
			return false;
		}

		if (value.length < 6) {
			errors.password = '密码至少需要6位';
			return false;
		}

		errors.password = '';
		return true;
	};

	// checkbox状态变化处理函数
	const handleRememberChange = (e) => {
		// 在uniapp中，checkbox的值需要从事件对象中获取
		formData.remember = e.detail.value.length > 0;
	};

	// 提交表单
	const handleSubmit = () => {
		const usernameValid = validateUsername();
		const passwordValid = validatePassword();

		if (usernameValid && passwordValid) {
			loading.value = true;

			// 模拟登录请求
			setTimeout(() => {
				loading.value = false;
				// 登录成功处理
				uni.showToast({
					title: '登录成功',
					icon: 'success'
				});

				// 跳转到首页
				// uni.switchTab({
				//   url: '/pages/index/index'
				// });
			}, 1500);
		}
	};

	// 跳转到忘记密码页面
	const goToForgotPassword = () => {
		uni.navigateTo({
			url: '/pages/forget-password/forget-password'
		});
	};

	// 跳转到注册页面
	const goToRegister = () => {
		uni.navigateTo({
			url: '/pages/register/register'
		});
	};
</script>

<style lang="scss">
	page {
		background: linear-gradient(135deg, #5c75e0, #3f37c9);
		min-height: 100vh;
		overflow: hidden;
		/* 防止页面滚动 */
	}

	.container {
		height: 100vh;
		/* 固定高度 */
		min-height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 40rpx;
		overflow: hidden;
		/* 防止容器滚动 */
	}

	.login-container {
		background: rgba(255, 255, 255, 0.95);
		width: 100%;
		max-width: 320px;
		padding: 60rpx 50rpx;
		border-radius: 40rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
		max-height: 90vh;
		/* 限制最大高度 */
		overflow-y: auto;
		/* 内容超出时显示滚动条 */
	}

	.title-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 40rpx;
	}

	.title {
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}

	.subtitle {
		font-size: 28rpx;
		color: #666;
		text-align: center;
	}

	.form-area {
		margin-bottom: 20rpx;
	}

	.input-group {
		margin-bottom: 30rpx;
		position: relative;
	}

	.input-label {
		display: block;
		font-size: 28rpx;
		color: #666;
		margin-bottom: 16rpx;
		font-weight: 500;
	}

	.input-field {
		width: 100%;
		height: 96rpx;
		background: #f8f8f8;
		border: 1px solid #eee;
		border-radius: 20rpx;
		padding: 0 10rpx;
		font-size: 30rpx;
		color: #333;
	}

	.validation-feedback {
		color: #e74c3c;
		font-size: 24rpx;
		margin-top: 12rpx;
		display: none;
		height: 36rpx;
	}

	.show-feedback {
		display: block;
	}

	.form-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 30rpx 0;
		font-size: 28rpx;
	}

	.remember-me {
		display: flex;
		align-items: center;
		color: #666;
	}

	.forgot-password {
		color: #4361ee;
	}

	.btn-login {
		width: 100%;
		background: #4361ee;
		color: white;
		border: none;
		border-radius: 20rpx;
		font-size: 32rpx;
		font-weight: 500;
		margin-top: 20rpx;
	}

	.register-link {
		text-align: center;
		margin-top: 40rpx;
		color: #666;
		font-size: 28rpx;
		display: flex;
		justify-content: center;
	}

	.register-text {
		color: #4361ee;
		margin-left: 10rpx;
	}
</style>