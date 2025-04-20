<template>
	<view class="container">
		<view class="login-container">
			<view class="title-area">
				<text class="title">忘记密码</text>
				<text class="subtitle">请输入您的手机号/邮箱以重置密码</text>
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
						<text class="input-label">验证码</text>
						<input type="text" class="input-field" v-model="formData.verificationCode" placeholder="请输入验证码"
							@input="validateVerificationCode" />
						<text v-if="errors.verificationCode"
							class="validation-feedback show-feedback">{{ errors.verificationCode }}</text>
					</view>

					<view class="input-group">
						<text class="input-label">新密码</text>
						<input :type="showPassword ? 'text' : 'password'" class="input-field"
							v-model="formData.newPassword" placeholder="请输入新密码" @input="validateNewPassword" />
						<text v-if="errors.newPassword"
							class="validation-feedback show-feedback">{{ errors.newPassword }}</text>
					</view>

					<button class="btn-login" :disabled="loading" @click="handleSubmit">
						<text v-if="!loading">重置密码</text>
						<text v-else>重置中...</text>
					</button>

					<view class="register-link">
						<text>返回</text>
						<text @click="goBack" class="register-text">登录页面</text>
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
		verificationCode: '',
		newPassword: ''
	});

	// 错误信息
	const errors = reactive({
		username: '',
		verificationCode: '',
		newPassword: ''
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
		const isEmail = /^[^s@]+@[^s@]+.[^s@]+$/.test(value);
		const isPhone = /^1[3-9]\d{9}$/.test(value);

		if (!isEmail && !isPhone) {
			errors.username = '请输入有效的邮箱或手机号';
			return false;
		}

		errors.username = '';
		return true;
	};

	// 验证验证码
	const validateVerificationCode = () => {
		const value = formData.verificationCode.trim();
		if (!value) {
			errors.verificationCode = '请输入验证码';
			return false;
		}

		if (value.length !== 6) {
			errors.verificationCode = '验证码必须为 6 位';
			return false;
		}

		errors.verificationCode = '';
		return true;
	};

	// 验证新密码
	const validateNewPassword = () => {
		const value = formData.newPassword.trim();
		if (!value) {
			errors.newPassword = '请输入新密码';
			return false;
		}

		if (value.length < 6) {
			errors.newPassword = '密码至少需要 6 位';
			return false;
		}

		errors.newPassword = '';
		return true;
	};

	// 提交表单
	const handleSubmit = () => {
		const usernameValid = validateUsername();
		const verificationCodeValid = validateVerificationCode();
		const newPasswordValid = validateNewPassword();

		if (usernameValid && verificationCodeValid && newPasswordValid) {
			loading.value = true;

			// 模拟重置密码请求
			setTimeout(() => {
				loading.value = false;
				// 重置成功处理
				uni.showToast({
					title: '密码重置成功',
					icon: 'success'
				});

				// 跳转到登录页面
				uni.navigateBack();
			}, 1500);
		}
	};

	// 返回登录页面
	const goBack = () => {
		uni.navigateBack();
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
		padding: 60rpx 40rpx;
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
		margin-bottom: 60rpx;
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
		transition: all 0.3s ease;
	}

	.input-field:focus {
		background: #e8e8e8;
		border-color: #4361ee;
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

	.btn-login {
		width: 100%;
		background: #4361ee;
		color: white;
		border: none;
		border-radius: 20rpx;
		font-size: 32rpx;
		font-weight: 500;
		margin-top: 20rpx;
		transition: all 0.3s ease;
	}

	.btn-login:hover {
		background: #3a57d1;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.15);
	}

	.btn-login:active {
		transform: scale(0.95);
		background: #324cb7;
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
</style>