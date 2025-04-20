<template>
	<view class="container">
		<view class="login-container">
			<view class="title-area">
				<text class="title">注册</text>
				<text class="subtitle">欢迎加入，请输入注册信息</text>
			</view>

			<form @submit.prevent="handleSubmit">
				<view class="form-area">
					<view class="input-group">
						<text class="input-label">用户名</text>
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

					<view class="input-group">
						<text class="input-label">确认密码</text>
						<input :type="showPassword ? 'text' : 'password'" class="input-field"
							v-model="formData.confirmPassword" placeholder="请再次输入密码" @input="validateConfirmPassword" />
						<text v-if="errors.confirmPassword"
							class="validation-feedback show-feedback">{{ errors.confirmPassword }}</text>
					</view>

					<view class="form-options">
						<label class="remember-me">
							<checkbox :checked="formData.agreeTerms" @change="handleAgreeTermsChange" color="#4361ee"
								scale="0.7" />
							<text>我已阅读并同意相关条款</text>
						</label>
					</view>

					<button class="btn-login" :disabled="loading" @click="handleSubmit">
						<text v-if="!loading">立即注册</text>
						<text v-else>注册中...</text>
					</button>

					<view class="register-link">
						<text>已有账号？</text>
						<text @click="goToLogin" class="register-text">立即登录</text>
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
		confirmPassword: '',
		agreeTerms: false
	});

	// 错误信息
	const errors = reactive({
		username: '',
		password: '',
		confirmPassword: ''
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

	// 验证确认密码
	const validateConfirmPassword = () => {
		const value = formData.confirmPassword.trim();
		if (!value) {
			errors.confirmPassword = '请再次输入密码';
			return false;
		}

		if (value !== formData.password) {
			errors.confirmPassword = '两次输入的密码不一致';
			return false;
		}

		errors.confirmPassword = '';
		return true;
	};

	// checkbox状态变化处理函数
	const handleAgreeTermsChange = (e) => {
		// 在uniapp中，checkbox的值需要从事件对象中获取
		formData.agreeTerms = e.detail.value.length > 0;
	};

	// 提交表单
	const handleSubmit = () => {
		const usernameValid = validateUsername();
		const passwordValid = validatePassword();
		const confirmPasswordValid = validateConfirmPassword();

		if (usernameValid && passwordValid && confirmPasswordValid && formData.agreeTerms) {
			loading.value = true;

			// 模拟注册请求
			setTimeout(() => {
				loading.value = false;
				// 注册成功处理
				uni.showToast({
					title: '注册成功',
					icon: 'success'
				});

				// 跳转到登录页面
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
		}
	};

	// 跳转到登录页面
	const goToLogin = () => {
		uni.navigateTo({
			url: '/pages/login/login'
		});
	};
</script>

<style>
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
		transition: all 0.3s ease;
	}

	.register-text:hover {
		transform: scale(1.1);
	}

	.btn-login:hover {
		background: #3a57d1;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.15);
	}

	.btn-login:active {
		transform: scale(0.95);
		background: #324cb7;
	}
</style>