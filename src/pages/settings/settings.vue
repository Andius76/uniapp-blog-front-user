<template>
	<view class="container">
		<view class="settings-container">
			<view class="title-area">
				<text class="title">设置中心</text>
			</view>
			
			<view class="settings-list">
				<!-- 用户设置区域 -->
				<view class="settings-section">
					<view class="section-title">账号设置</view>
					
					<!-- 修改昵称 -->
					<view class="settings-item" @click="showNicknameModal">
						<view class="item-left">
							<uni-icons type="person" size="24" color="#666"></uni-icons>
							<text class="item-label">修改昵称</text>
						</view>
						<view class="item-right">
							<text class="item-value">{{ data.userInfo.nickname }}</text>
							<uni-icons type="forward" size="18" color="#ccc"></uni-icons>
						</view>
					</view>
					
					<!-- 修改性别 -->
					<view class="settings-item" @click="showGenderPicker">
						<view class="item-left">
							<uni-icons type="help" size="24" color="#666"></uni-icons>
							<text class="item-label">修改性别</text>
						</view>
						<view class="item-right">
							<text class="item-value">{{ genderText }}</text>
							<uni-icons type="forward" size="18" color="#ccc"></uni-icons>
						</view>
					</view>
				</view>
				
				<!-- 其他设置区域 -->
				<view class="settings-section">
					<view class="section-title">其他设置</view>
					
					<!-- 退出登录 -->
					<view class="settings-item logout-item" @click="handleLogout">
						<view class="item-left">
							<uni-icons type="poweroff" size="24" color="#f56c6c"></uni-icons>
							<text class="item-label logout-label">退出登录</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 修改昵称弹窗 -->
		<uni-popup ref="nicknamePopup" type="dialog">
			<uni-popup-dialog 
				title="修改昵称" 
				:before-close="true"
				@confirm="confirmNickname" 
				@close="closeNicknamePopup"
				confirmText="确认"
				cancelText="取消"
			>
				<input 
					class="nickname-input" 
					type="text" 
					v-model="data.tempNickname" 
					placeholder="请输入新昵称" 
					maxlength="20"
				/>
			</uni-popup-dialog>
		</uni-popup>
		
		<!-- 性别选择器 -->
		<uni-popup ref="genderPopup" type="bottom">
			<view class="gender-picker-container">
				<view class="picker-header">
					<text class="picker-title">请选择性别</text>
					<text class="picker-close" @click="closeGenderPicker">取消</text>
				</view>
				<view class="gender-options">
					<view 
						class="gender-option" 
						:class="{ active: data.tempGender === 1 }"
						@click="selectGender(1)"
					>
						<text>男</text>
					</view>
					<view 
						class="gender-option" 
						:class="{ active: data.tempGender === 2 }"
						@click="selectGender(2)"
					>
						<text>女</text>
					</view>
					<view 
						class="gender-option" 
						:class="{ active: data.tempGender === 0 }"
						@click="selectGender(0)"
					>
						<text>保密</text>
					</view>
				</view>
				<view class="confirm-button" @click="confirmGender">
					<text>确认</text>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
import { reactive, computed, ref } from 'vue';
// 导入uni-icons组件
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
// 导入uni-popup组件
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue';
import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';

// 获取popup组件引用
const nicknamePopup = ref(null);
const genderPopup = ref(null);

// 使用reactive统一管理数据
const data = reactive({
	// 用户信息
	userInfo: {
		nickname: '用户asdf',
		gender: 0, // 0:保密 1:男 2:女
	},
	// 临时存储修改信息
	tempNickname: '',
	tempGender: 0
});

// 计算属性，根据性别值返回文本
const genderText = computed(() => {
	switch (data.userInfo.gender) {
		case 1:
			return '男';
		case 2:
			return '女';
		default:
			return '保密';
	}
});

/**
 * 显示修改昵称弹窗
 */
const showNicknameModal = () => {
	data.tempNickname = data.userInfo.nickname;
	nicknamePopup.value.open();
};

/**
 * 关闭修改昵称弹窗
 */
const closeNicknamePopup = () => {
	nicknamePopup.value.close();
};

/**
 * 确认修改昵称
 */
const confirmNickname = () => {
	const newNickname = data.tempNickname.trim();
	if (!newNickname) {
		uni.showToast({
			title: '昵称不能为空',
			icon: 'none'
		});
		return;
	}
	
	// 更新昵称
	data.userInfo.nickname = newNickname;
	
	// 提示修改成功
	uni.showToast({
		title: '昵称修改成功',
		icon: 'success'
	});
	
	// TODO: 调用后端API保存昵称
	// api.updateUserProfile({ nickname: newNickname }).then(res => {
	//   console.log('昵称更新成功');
	// });
	
	// 关闭弹窗
	closeNicknamePopup();
};

/**
 * 显示性别选择器
 */
const showGenderPicker = () => {
	data.tempGender = data.userInfo.gender;
	genderPopup.value.open();
};

/**
 * 关闭性别选择器
 */
const closeGenderPicker = () => {
	genderPopup.value.close();
};

/**
 * 选择性别
 * @param {Number} gender - 性别值 0:保密 1:男 2:女
 */
const selectGender = (gender) => {
	data.tempGender = gender;
};

/**
 * 确认修改性别
 */
const confirmGender = () => {
	// 更新性别
	data.userInfo.gender = data.tempGender;
	
	// 提示修改成功
	uni.showToast({
		title: '性别修改成功',
		icon: 'success'
	});
	
	// TODO: 调用后端API保存性别
	// api.updateUserProfile({ gender: data.tempGender }).then(res => {
	//   console.log('性别更新成功');
	// });
	
	// 关闭选择器
	closeGenderPicker();
};

/**
 * 退出登录
 */
const handleLogout = () => {
	uni.showModal({
		title: '退出登录',
		content: '确定要退出登录吗？',
		success: (res) => {
			if (res.confirm) {
				// 清除登录状态和用户信息
				// uni.removeStorageSync('token');
				// uni.removeStorageSync('userInfo');
				
				// 跳转到登录页面
				uni.reLaunch({
					url: '/pages/login/login'
				});
				
				// TODO: 调用后端API退出登录
				// api.logout().then(res => {
				//   console.log('已成功退出登录');
				// });
			}
		}
	});
};
</script>

<style lang="scss">
// 页面基础样式
page {
	background-color: #f5f5f5;
	min-height: 100vh;
}

// 主容器
.container {
	min-height: 100vh;
	padding: 30rpx 0;
	
	// 设置容器
	.settings-container {
		width: 100%;
		
		// 标题区域
		.title-area {
			padding: 20rpx 40rpx 40rpx;
			
			.title {
				font-size: 48rpx;
				font-weight: bold;
				color: #333;
			}
		}
		
		// 设置列表
		.settings-list {
			width: 100%;
			
			// 设置区域
			.settings-section {
				background-color: #fff;
				border-radius: 20rpx;
				margin: 0 30rpx 30rpx;
				padding: 20rpx 0;
				
				// 区域标题
				.section-title {
					padding: 20rpx 30rpx;
					font-size: 28rpx;
					color: #999;
					font-weight: 500;
				}
				
				// 设置项
				.settings-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 30rpx;
					border-bottom: 1px solid #f5f5f5;
					
					&:last-child {
						border-bottom: none;
					}
					
					// 左侧内容
					.item-left {
						display: flex;
						align-items: center;
						
						.item-label {
							font-size: 32rpx;
							color: #333;
							margin-left: 20rpx;
						}
					}
					
					// 右侧内容
					.item-right {
						display: flex;
						align-items: center;
						
						.item-value {
							font-size: 28rpx;
							color: #999;
							margin-right: 10rpx;
							max-width: 200rpx;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}
					}
					
					// 退出登录样式
					&.logout-item {
						margin-top: 10rpx;
						
						.logout-label {
							color: #f56c6c;
						}
					}
				}
			}
		}
	}
}

// 修改昵称输入框
.nickname-input {
	height: 80rpx;
	background-color: #f8f8f8;
	border-radius: 10rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	margin-top: 20rpx;
}

// 性别选择器
.gender-picker-container {
	background-color: #fff;
	border-radius: 20rpx 20rpx 0 0;
	padding-bottom: 30rpx;
	
	// 选择器头部
	.picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1px solid #f5f5f5;
		
		.picker-title {
			font-size: 32rpx;
			font-weight: 500;
			color: #333;
		}
		
		.picker-close {
			font-size: 28rpx;
			color: #999;
		}
	}
	
	// 性别选项
	.gender-options {
		padding: 30rpx;
		
		.gender-option {
			height: 100rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 10rpx;
			margin-bottom: 20rpx;
			font-size: 32rpx;
			color: #333;
			border: 1px solid #eee;
			
			&.active {
				background-color: #4361ee;
				color: #fff;
				border-color: #4361ee;
			}
		}
	}
	
	// 确认按钮
	.confirm-button {
		margin: 20rpx 30rpx 0;
		height: 90rpx;
		background-color: #4361ee;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10rpx;
		font-size: 32rpx;
		font-weight: 500;
	}
}
</style> 