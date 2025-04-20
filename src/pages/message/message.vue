<template>
	<view class="message-container">
	  <!-- 顶部标签栏 -->
	  <view class="tab-bar">
		<view 
		  v-for="(tab, index) in data.tabs" 
		  :key="index"
		  class="tab-item"
		  :class="{ active: data.currentTab === index }"
		  @click="data.currentTab = index"
		>
		  <view class="tab-icon">
			<uni-icons :type="tab.icon" size="24" :color="data.currentTab === index ? '#2979ff' : '#666'"></uni-icons>
		  </view>
		  <text>{{ tab.title }}</text>
		</view>
	  </view>
  
	  <!-- 消息列表 -->
	  <scroll-view scroll-y class="message-list">
		<view class="message-item system" v-for="(item, index) in data.messages" :key="index">
		  <view class="message-icon">
			<uni-icons :type="item.type === 'system' ? 'notification' : 'person'" size="32" color="#666"></uni-icons>
		  </view>
		  <view class="message-content">
			<view class="message-title">{{ item.title }}</view>
			<view class="message-desc">{{ item.description }}</view>
			<view class="message-time">{{ item.time }}</view>
		  </view>
		  <view class="message-badge" v-if="item.unread">{{ item.unread }}</view>
		</view>
	  </scroll-view>
	</view>
  </template>
  
  <script setup>
  import { reactive } from 'vue'
  
  // 页面数据
  const data = reactive({
	// 顶部标签数据
	currentTab: 0,
	tabs: [
	  { title: '点赞了我', icon: 'heart' },
	  { title: '收藏了我', icon: 'star' },
	  { title: '订阅了我', icon: 'plusempty' }
	],
	// 消息列表数据
	messages: [
	  {
		type: 'system',
		title: '系统通知',
		description: '系统更新',
		time: '2025-4-20',
		unread: 1
	  },
	  {
		type: 'user',
		title: '账号消息',
		description: '欢迎xxxx，完善资料...',
		time: '2025-4-20',
		unread: 2
	  }
	]
  })
  </script>
  
  <style lang="scss">
  .message-container {
	min-height: 100vh;
	background-color: #f5f5f5;
	
	// 顶部标签栏样式
	.tab-bar {
	  display: flex;
	  justify-content: space-around;
	  align-items: center;
	  background-color: #ffffff;
	  padding: 20rpx 0;
	  border-bottom: 1rpx solid #eee;
	  
	  .tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10rpx 30rpx;
		
		&.active {
		  color: #2979ff;
		}
		
		.tab-icon {
		  margin-bottom: 6rpx;
		}
		
		text {
		  font-size: 24rpx;
		}
	  }
	}
	
	// 消息列表样式
	.message-list {
	  padding: 20rpx;
	  
	  .message-item {
		display: flex;
		align-items: center;
		background-color: #ffffff;
		padding: 30rpx;
		border-radius: 12rpx;
		margin-bottom: 20rpx;
		position: relative;
		
		.message-icon {
		  margin-right: 20rpx;
		}
		
		.message-content {
		  flex: 1;
		  
		  .message-title {
			font-size: 28rpx;
			color: #333;
			margin-bottom: 8rpx;
		  }
		  
		  .message-desc {
			font-size: 24rpx;
			color: #666;
			margin-bottom: 8rpx;
		  }
		  
		  .message-time {
			font-size: 22rpx;
			color: #999;
		  }
		}
		
		.message-badge {
		  position: absolute;
		  top: 20rpx;
		  right: 20rpx;
		  background-color: #ff5a5f;
		  color: #fff;
		  font-size: 20rpx;
		  padding: 4rpx 12rpx;
		  border-radius: 20rpx;
		  min-width: 32rpx;
		  text-align: center;
		}
	  }
	}
  }
  </style> 