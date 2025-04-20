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
						<view class="input-wrapper">
							<uni-icons type="person" size="20" color="#999"></uni-icons>
							<input 
								type="text" 
								class="input-field" 
								v-model="data.formData.username" 
								placeholder="请输入手机号/邮箱"
								@input="validateUsername" 
							/>
						</view>
						<text 
							v-if="data.errors.username"
							class="validation-feedback show-feedback"
						>{{ data.errors.username }}</text>
					</view>

					<view class="input-group">
						<text class="input-label">验证码</text>
						<view class="input-wrapper code-wrapper">
							<uni-icons type="chat" size="20" color="#999"></uni-icons>
							<input 
								type="text" 
								class="input-field" 
								v-model="data.formData.verificationCode" 
								placeholder="请输入验证码"
								@input="validateVerificationCode" 
							/>
							<button class="get-code-btn" @click="getVerificationCode" :disabled="data.codeBtnDisabled">
								{{ data.codeBtnText }}
							</button>
						</view>
						<text 
							v-if="data.errors.verificationCode"
							class="validation-feedback show-feedback"
						>{{ data.errors.verificationCode }}</text>
					</view>

					<view class="input-group">
						<text class="input-label">新密码</text>
						<view class="input-wrapper">
							<uni-icons type="locked" size="20" color="#999"></uni-icons>
							<input 
								:type="data.showPassword ? 'text' : 'password'" 
								class="input-field"
								v-model="data.formData.newPassword" 
								placeholder="请输入新密码" 
								@input="validateNewPassword" 
							/>
							<uni-icons 
								:type="data.showPassword ? 'eye-slash' : 'eye'" 
								size="20" 
								color="#999"
								@click="togglePasswordVisibility"
							></uni-icons>
						</view>
						<text 
							v-if="data.errors.newPassword"
							class="validation-feedback show-feedback"
						>{{ data.errors.newPassword }}</text>
					</view>

					<button class="btn-login" :disabled="data.loading" @click="handleSubmit">
						<text v-if="!data.loading">重置密码</text>
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
import { reactive } from 'vue';
// 导入uni-icons组件
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';

// 使用reactive统一管理所有数据
const data = reactive({
	// 表单数据
	formData: {
		username: '',
		verificationCode: '',
		newPassword: ''
	},
	// 错误信息
	errors: {
		username: '',
		verificationCode: '',
		newPassword: ''
	},
	// 界面状态
	loading: false,
	showPassword: false,
	// 验证码按钮状态
	codeBtnDisabled: false,
	codeBtnText: '获取验证码',
	countdown: 60
});

/**
 * 验证用户名（邮箱或手机号）
 * @returns {boolean} 验证结果
 */
const validateUsername = () => {
	const value = data.formData.username.trim();
	if (!value) {
		data.errors.username = '请输入手机号或邮箱';
		return false;
	}

	// 验证邮箱或手机号格式
	const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	const isPhone = /^1[3-9]\d{9}$/.test(value);

	if (!isEmail && !isPhone) {
		data.errors.username = '请输入有效的邮箱或手机号';
		return false;
	}

	data.errors.username = '';
	return true;
};

/**
 * 验证验证码
 * @returns {boolean} 验证结果
 */
const validateVerificationCode = () => {
	const value = data.formData.verificationCode.trim();
	if (!value) {
		data.errors.verificationCode = '请输入验证码';
		return false;
	}

	if (value.length !== 6) {
		data.errors.verificationCode = '验证码必须为 6 位';
		return false;
	}

	data.errors.verificationCode = '';
	return true;
};

/**
 * 验证新密码
 * @returns {boolean} 验证结果
 */
const validateNewPassword = () => {
	const value = data.formData.newPassword.trim();
	if (!value) {
		data.errors.newPassword = '请输入新密码';
		return false;
	}

	if (value.length < 6) {
		data.errors.newPassword = '密码至少需要 6 位';
		return false;
	}

	data.errors.newPassword = '';
	return true;
};

/**
 * 切换密码显示/隐藏
 */
const togglePasswordVisibility = () => {
	data.showPassword = !data.showPassword;
};

/**
 * 获取验证码
 */
const getVerificationCode = () => {
	if (!validateUsername()) {
		uni.showToast({
			title: '请先输入有效的手机号或邮箱',
			icon: 'none'
		});
		return;
	}
	
	// 禁用按钮并开始倒计时
	data.codeBtnDisabled = true;
	data.countdown = 60;
	data.codeBtnText = `${data.countdown}秒后重新获取`;
	
	const timer = setInterval(() => {
		data.countdown--;
		data.codeBtnText = `${data.countdown}秒后重新获取`;
		
		if (data.countdown <= 0) {
			clearInterval(timer);
			data.codeBtnDisabled = false;
			data.codeBtnText = '获取验证码';
		}
	}, 1000);
	
	// 模拟发送验证码
	uni.showToast({
		title: '验证码已发送',
		icon: 'success'
	});
	
	// TODO: 实际发送验证码API调用
	// api.sendVerificationCode(data.formData.username).then(res => {
	//   if (res.success) {
	//     uni.showToast({
	//       title: '验证码已发送',
	//       icon: 'success'
	//     });
	//   } else {
	//     uni.showToast({
	//       title: res.message || '发送失败',
	//       icon: 'none'
	//     });
	//     // 发送失败，重置按钮状态
	//     clearInterval(timer);
	//     data.codeBtnDisabled = false;
	//     data.codeBtnText = '获取验证码';
	//   }
	// }).catch(err => {
	//   console.error('发送验证码失败', err);
	//   uni.showToast({
	//     title: '发送失败，请检查网络',
	//     icon: 'none'
	//   });
	//   // 发送失败，重置按钮状态
	//   clearInterval(timer);
	//   data.codeBtnDisabled = false;
	//   data.codeBtnText = '获取验证码';
	// });
};

/**
 * 提交表单
 */
const handleSubmit = () => {
	const usernameValid = validateUsername();
	const verificationCodeValid = validateVerificationCode();
	const newPasswordValid = validateNewPassword();

	if (usernameValid && verificationCodeValid && newPasswordValid) {
		data.loading = true;

		// 模拟重置密码请求
		setTimeout(() => {
			data.loading = false;
			// 重置成功处理
			uni.showToast({
				title: '密码重置成功',
				icon: 'success'
			});

			// 跳转到登录页面
			uni.navigateBack();
		}, 1500);
		
		// TODO: 实际重置密码API调用
		// api.resetPassword(data.formData).then(res => {
		//   if (res.success) {
		//     uni.showToast({
		//       title: '密码重置成功',
		//       icon: 'success'
		//     });
		//     uni.navigateBack();
		//   } else {
		//     uni.showToast({
		//       title: res.message || '重置密码失败',
		//       icon: 'none'
		//     });
		//   }
		//   data.loading = false;
		// }).catch(err => {
		//   console.error('重置密码失败', err);
		//   uni.showToast({
		//     title: '重置密码失败，请检查网络',
		//     icon: 'none'
		//   });
		//   data.loading = false;
		// });
	}
};

/**
 * 返回登录页面
 */
const goBack = () => {
	uni.navigateBack();
};
</script>

<style lang="scss">
// 页面基础样式
page {
	background: linear-gradient(135deg, #5c75e0, #3f37c9);
	min-height: 100vh;
	overflow: hidden; // 防止页面滚动
}

// 主容器
.container {
	height: 100vh; // 固定高度
	min-height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 0 40rpx;
	overflow: hidden; // 防止容器滚动
	
	// 主容器
	.login-container {
		background: rgba(255, 255, 255, 0.95);
		width: 100%;
		max-width: 320px;
		padding: 60rpx 40rpx;
		border-radius: 40rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
		max-height: 90vh; // 限制最大高度
		overflow-y: auto; // 内容超出时显示滚动条
		
		// 标题区域
		.title-area {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-bottom: 60rpx;
			
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
		}
		
		// 表单区域
		.form-area {
			margin-bottom: 20rpx;
			
			// 输入框组
			.input-group {
				margin-bottom: 30rpx;
				position: relative;
				
				.input-label {
					display: block;
					font-size: 28rpx;
					color: #666;
					margin-bottom: 16rpx;
					font-weight: 500;
				}
				
				// 输入框包装
				.input-wrapper {
					display: flex;
					align-items: center;
					width: 100%;
					height: 96rpx;
					background: #f8f8f8;
					border: 1px solid #eee;
					border-radius: 20rpx;
					padding: 0 10rpx;
					transition: all 0.3s ease;
					
					&.code-wrapper {
						padding-right: 0;
					}
					
					.uni-icons {
						margin-right: 10rpx;
					}
					
					.input-field {
						flex: 1;
						height: 90rpx;
						font-size: 30rpx;
						color: #333;
						background: transparent;
						border: none;
						transition: all 0.3s ease;
						
						&:focus {
							background: transparent;
						}
					}
					
					.get-code-btn {
						height: 96rpx;
						background: #4361ee;
						color: white;
						font-size: 24rpx;
						border-radius: 0 20rpx 20rpx 0;
						margin: 0;
						padding: 0 20rpx;
						border: none;
						line-height: 96rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						min-width: 180rpx;
						
						&:disabled {
							background: #999;
						}
					}
					
					&:focus-within {
						background: #e8e8e8;
						border-color: #4361ee;
					}
				}
				
				// 验证反馈
				.validation-feedback {
					color: #e74c3c;
					font-size: 24rpx;
					margin-top: 12rpx;
					display: none;
					height: 36rpx;
					
					&.show-feedback {
						display: block;
					}
				}
			}
			
			// 重置密码按钮
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
				height: 90rpx;
				line-height: 90rpx;
				
				&:hover {
					background: #3a57d1;
					box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.15);
				}
				
				&:active {
					transform: scale(0.95);
					background: #324cb7;
				}
			}
			
			// 返回登录链接
			.register-link {
				text-align: center;
				margin-top: 40rpx;
				color: #666;
				font-size: 28rpx;
				display: flex;
				justify-content: center;
				
				.register-text {
					color: #4361ee;
					margin-left: 10rpx;
					transition: all 0.3s ease;
					
					&:hover {
						transform: scale(1.1);
					}
				}
			}
		}
	}
}
</style>