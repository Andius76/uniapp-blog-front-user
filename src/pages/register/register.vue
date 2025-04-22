<template>
	<view class="container">
		<view class="login-container">
			<view class="title-area">
				<text class="title">注册</text>
				<text class="subtitle">欢迎加入，请输入邮箱注册</text>
			</view>

			<form @submit.prevent="handleSubmit">
				<view class="form-area">
					<view class="input-group">
						<text class="input-label">用户名</text>
						<view class="input-wrapper">
							<uni-icons type="person" size="20" color="#999"></uni-icons>
							<input 
								type="text" 
								class="input-field" 
								v-model="data.formData.username" 
								placeholder="请输入邮箱"
								@input="validateUsername" 
							/>
						</view>
						<text 
							v-if="data.errors.username"
							class="validation-feedback show-feedback"
						>{{ data.errors.username }}</text>
					</view>

					<view class="input-group">
						<text class="input-label">密码</text>
						<view class="input-wrapper">
							<uni-icons type="locked" size="20" color="#999"></uni-icons>
							<input 
								:type="data.showPassword ? 'text' : 'password'" 
								class="input-field"
								v-model="data.formData.password" 
								placeholder="请输入密码" 
								@input="validatePassword" 
							/>
							<uni-icons 
								:type="data.showPassword ? 'eye-slash' : 'eye'" 
								size="20" 
								color="#999"
								@click="togglePasswordVisibility"
							></uni-icons>
						</view>
						<text 
							v-if="data.errors.password"
							class="validation-feedback show-feedback"
						>{{ data.errors.password }}</text>
					</view>

					

					<button class="btn-login" :disabled="data.loading" @click="handleSubmit">
						<text v-if="!data.loading">立即注册</text>
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
import { reactive } from 'vue';
// 导入uni-icons组件
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';

// 使用reactive统一管理所有数据
const data = reactive({
	// 表单数据
	formData: {
		username: '',
		password: ''
	},
	// 错误信息
	errors: {
		username: '',
		password: ''
	},
	// 界面状态
	loading: false,
	showPassword: false
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
	const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

	if (!isValidEmail) {
		data.errors.username = '请输入有效的邮箱';
		return false;
	}

	data.errors.username = '';
	return true;
};

/**
 * 验证密码
 * @returns {boolean} 验证结果
 */
const validatePassword = () => {
	const value = data.formData.password.trim();
	if (!value) {
		data.errors.password = '请输入密码';
		return false;
	}

	if (value.length < 6) {
		data.errors.password = '密码至少需要6位';
		return false;
	}

	data.errors.password = '';
	return true;
};



/**
 * 切换密码显示/隐藏
 */
const togglePasswordVisibility = () => {
	data.showPassword = !data.showPassword;
};

/**
 * 提交表单
 */
const handleSubmit = () => {
	const usernameValid = validateUsername();
	const passwordValid = validatePassword();

	if (usernameValid && passwordValid) {
		data.loading = true;

		// 模拟注册请求
		setTimeout(() => {
			data.loading = false;
			// 注册成功处理
			uni.showToast({
				title: '注册成功',
				icon: 'success'
			});

			// 跳转到登录页面
			uni.redirectTo({
				url: '/pages/login/login'
			});
		}, 1500);
		
		// TODO: 实际注册API调用
		// api.register(data.formData).then(res => {
		//   if (res.success) {
		//     uni.showToast({
		//       title: '注册成功',
		//       icon: 'success'
		//     });
		//     uni.redirectTo({
		//       url: '/pages/login/login'
		//     });
		//   } else {
		//     uni.showToast({
		//       title: res.message || '注册失败',
		//       icon: 'none'
		//     });
		//   }
		//   data.loading = false;
		// }).catch(err => {
		//   uni.showToast({
		//     title: '注册失败，请检查网络',
		//     icon: 'none'
		//   });
		//   console.error('注册失败', err);
		//   data.loading = false;
		// });
	}
};

/**
 * 跳转到登录页面
 */
const goToLogin = () => {
	uni.redirectTo({
		url: '/pages/login/login'
	});
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
	
	// 注册容器
	.login-container {
		background: rgba(255, 255, 255, 0.95);
		width: 100%;
		max-width: 320px;
		padding: 60rpx 50rpx;
		border-radius: 40rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
		max-height: 90vh; // 限制最大高度
		overflow-y: auto; // 内容超出时显示滚动条
		
		// 标题区域
		.title-area {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-bottom: 40rpx;
			
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
			margin-bottom: 40rpx; // 原为20rpx
			
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
			
			// 表单选项区域
			.form-options {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin: 30rpx 0;
				font-size: 28rpx;
				
				.remember-me {
					display: flex;
					align-items: center;
					color: #666;
				}
			}
			
			// 注册按钮
			.btn-login {
				width: 100%;
				background: #4361ee;
				color: white;
				border: none;
				border-radius: 20rpx;
				font-size: 32rpx;
				font-weight: 500;
				margin-top: 20rpx;
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
			
			// 登录链接
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