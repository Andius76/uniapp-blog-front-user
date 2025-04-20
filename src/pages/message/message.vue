<template>
  <view class="message-container">
    <!-- 顶部选项卡 -->
    <view class="tabs-container">
      <view 
        v-for="(tab, index) in tabs" 
        :key="index" 
        class="tab-item" 
        :class="{ active: currentTab === index }"
        @click="switchTab(index)"
      >
        <view class="tab-icon">
          <uni-icons :type="tab.icon" size="24" :color="currentTab === index ? '#4361ee' : '#666'"></uni-icons>
        </view>
        <text class="tab-text">{{ tab.name }}</text>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view 
      scroll-y 
      class="message-list" 
      @scrolltolower="loadMore" 
      refresher-enabled 
      :refresher-triggered="isRefreshing" 
      @refresherrefresh="refreshList">
      <!-- 消息分组 -->
      <block v-for="(group, groupIndex) in messageGroups" :key="groupIndex">
        <!-- 消息组列表 -->
        <view v-for="(message, messageIndex) in group.messages" :key="messageIndex" class="message-item" @click="readMessage(message)">
          <view class="message-icon">
            <uni-icons :type="message.icon" size="30" color="#666"></uni-icons>
          </view>
          <view class="message-content">
            <view class="message-title">{{ message.title }}</view>
            <view class="message-desc">{{ message.description }}</view>
          </view>
          <view class="message-right">
            <view class="message-time">{{ message.time }}</view>
            <view class="unread-dot" v-if="!message.isRead"></view>
          </view>
        </view>
      </block>

      <!-- 无消息提示 -->
      <view v-if="messageGroups.length === 0 || (messageGroups[0] && messageGroups[0].messages.length === 0)" class="no-message">
        <uni-icons type="info" size="50" color="#ddd"></uni-icons>
        <text>暂无消息</text>
      </view>

      <!-- 加载状态 -->
      <view v-if="isLoading" class="loading-state">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
// 导入uni-icons组件
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';

// 当前选中的选项卡
const currentTab = ref(0);
// 刷新和加载状态
const isRefreshing = ref(false);
const isLoading = ref(false);
const noMoreData = ref(false);
const currentPage = ref(1);
const pageSize = 5; // 每页5条消息

// 选项卡数据
const tabs = reactive([
  {
    name: '点赞了我',
    icon: 'heart',
    type: 'like'
  },
  {
    name: '收藏了我',
    icon: 'star',
    type: 'collect'
  },
  {
    name: '订阅了我',
    icon: 'plus',
    type: 'subscribe'
  }
]);

// 消息组数据
const messageGroups = reactive([
  {
    type: 'system',
    messages: [
      {
        id: 1,
        title: '系统消息',
        description: '系统更新',
        time: '2025-4-20',
        icon: 'notification',
        isRead: false
      }
    ]
  },
  {
    type: 'account',
    messages: [
      {
        id: 2,
        title: '账号消息',
        description: '欢迎xxxx，登录系统...',
        time: '2025-4-20',
        icon: 'person',
        isRead: false
      }
    ]
  }
]);

// 原始消息数据（用于模拟不同选项卡下的数据）
const allMessages = reactive({
  like: [
    {
      type: 'system',
      messages: [
        {
          id: 1,
          title: '系统消息',
          description: '您的文章《Vue3新特性解析》获得5个赞',
          time: '2025-4-20',
          icon: 'notification',
          isRead: false
        }
      ]
    },
    {
      type: 'account',
      messages: [
        {
          id: 2,
          title: '点赞通知',
          description: '用户"前端达人"赞了您的文章',
          time: '2025-4-19',
          icon: 'heart-filled',
          isRead: true
        },
        {
          id: 3,
          title: '点赞通知',
          description: '用户"JavaScript专家"赞了您的评论',
          time: '2025-4-18',
          icon: 'heart-filled',
          isRead: false
        }
      ]
    }
  ],
  collect: [
    {
      type: 'system',
      messages: [
        {
          id: 4,
          title: '系统消息',
          description: '您的文章《uniapp跨平台开发实战》被收藏3次',
          time: '2025-4-20',
          icon: 'notification',
          isRead: false
        }
      ]
    },
    {
      type: 'account',
      messages: [
        {
          id: 5,
          title: '收藏通知',
          description: '用户"移动开发专家"收藏了您的文章',
          time: '2025-4-17',
          icon: 'star-filled',
          isRead: true
        }
      ]
    }
  ],
  subscribe: [
    {
      type: 'system',
      messages: [
        {
          id: 6,
          title: '系统消息',
          description: '恭喜您获得2位新订阅者',
          time: '2025-4-20',
          icon: 'notification',
          isRead: true
        }
      ]
    },
    {
      type: 'account',
      messages: [
        {
          id: 7,
          title: '订阅通知',
          description: '用户"前端学习者"订阅了您',
          time: '2025-4-18',
          icon: 'bookmark-filled',
          isRead: false
        },
        {
          id: 8,
          title: '订阅通知',
          description: '用户"CSS大师"订阅了您',
          time: '2025-4-16',
          icon: 'bookmark-filled',
          isRead: true
        }
      ]
    }
	,
    {
      type: 'account',
      messages: [
        {
          id: 7,
          title: '订阅通知',
          description: '用户"前端学习者"订阅了您',
          time: '2025-4-18',
          icon: 'bookmark-filled',
          isRead: false
        },
        {
          id: 8,
          title: '订阅通知',
          description: '用户"CSS大师"订阅了您',
          time: '2025-4-16',
          icon: 'bookmark-filled',
          isRead: true
        }
      ]
    },
    {
      type: 'account',
      messages: [
        {
          id: 7,
          title: '订阅通知',
          description: '用户"前端学习者"订阅了您',
          time: '2025-4-18',
          icon: 'bookmark-filled',
          isRead: false
        },
        {
          id: 8,
          title: '订阅通知',
          description: '用户"CSS大师"订阅了您',
          time: '2025-4-16',
          icon: 'bookmark-filled',
          isRead: true
        }
      ]
    },
    {
      type: 'account',
      messages: [
        {
          id: 7,
          title: '订阅通知',
          description: '用户"前端学习者"订阅了您',
          time: '2025-4-18',
          icon: 'bookmark-filled',
          isRead: false
        },
        {
          id: 8,
          title: '订阅通知',
          description: '用户"CSS大师"订阅了您',
          time: '2025-4-16',
          icon: 'bookmark-filled',
          isRead: true
        }
      ]
    },
    {
      type: 'account',
      messages: [
        {
          id: 7,
          title: '订阅通知',
          description: '用户"前端学习者"订阅了您',
          time: '2025-4-18',
          icon: 'bookmark-filled',
          isRead: false
        },
        {
          id: 8,
          title: '订阅通知',
          description: '用户"CSS大师"订阅了您',
          time: '2025-4-16',
          icon: 'bookmark-filled',
          isRead: true
        }
      ]
    }
  ]
});

/**
 * 加载消息列表
 * TODO: 实际项目中应替换为API调用
 */
const loadMessages = () => {
  // 如果已经没有更多数据或正在加载中，则不处理
  if (noMoreData.value || isLoading.value) return;

  isLoading.value = true;

  // 模拟API请求延迟
  setTimeout(() => {
    const tabType = tabs[currentTab.value].type;
    
    if (allMessages[tabType]) {
      // 复制对应类型的消息数据
      Object.keys(messageGroups).forEach(key => {
        messageGroups.splice(0, messageGroups.length);
      });
      
      // 计算本次应加载的消息数据
      const endIndex = Math.min(currentPage.value * pageSize, allMessages[tabType].length);
      const startIndex = 0; // 由于我们是替换而非追加，所以从0开始
      
      // 获取当前页的数据
      const pageData = allMessages[tabType].slice(startIndex, endIndex);
      
      // 添加到消息列表
      pageData.forEach(group => {
        messageGroups.push({
          type: group.type,
          messages: [...group.messages]
        });
      });
      
      // 更新页码
      currentPage.value++;
      
      // 如果获取的数据比总数少，说明已加载完全部数据
      if (endIndex >= allMessages[tabType].length) {
        noMoreData.value = true;
      }
    }
    
    isLoading.value = false;
    
    // 如果是刷新状态，结束刷新
    if (isRefreshing.value) {
      isRefreshing.value = false;
    }
  }, 800);
  
  // TODO: 替换为实际API调用
  // api.getMessages({
  //   page: currentPage.value,
  //   pageSize: pageSize,
  //   type: tabs[currentTab.value].type
  // }).then(res => {
  //   // 处理响应数据
  //   if (res.data.length > 0) {
  //     messageGroups.push(...res.data);
  //     currentPage.value++;
  //     noMoreData.value = res.data.length < pageSize;
  //   } else {
  //     noMoreData.value = true;
  //   }
  //   isLoading.value = false;
  //   if (isRefreshing.value) isRefreshing.value = false;
  // }).catch(err => {
  //   console.error('获取消息列表失败', err);
  //   isLoading.value = false;
  //   if (isRefreshing.value) isRefreshing.value = false;
  // });
};

/**
 * 刷新列表
 */
const refreshList = () => {
  // 设置刷新状态
  isRefreshing.value = true;

  // 重置数据
  Object.keys(messageGroups).forEach(key => {
    messageGroups.splice(0, messageGroups.length);
  });
  currentPage.value = 1;
  noMoreData.value = false;

  // 重新加载
  loadMessages();

  // 提示用户
  uni.showToast({
    title: '刷新成功',
    icon: 'success',
    duration: 1500
  });
};

/**
 * 加载更多
 */
const loadMore = () => {
  if (!noMoreData.value) {
    uni.showToast({
      title: '加载更多消息',
      icon: 'none',
      duration: 500
    });
    loadMessages();
  } else {
    uni.showToast({
      title: '没有更多消息了',
      icon: 'none',
      duration: 1500
    });
  }
};

/**
 * 切换选项卡
 * @param {Number} index - 选项卡索引
 */
const switchTab = (index) => {
  if (currentTab.value === index) return;
  
  currentTab.value = index;
  
  // 重置加载状态
  Object.keys(messageGroups).forEach(key => {
    messageGroups.splice(0, messageGroups.length);
  });
  currentPage.value = 1;
  noMoreData.value = false;
  
  // 显示加载提示
  uni.showLoading({
    title: `加载${tabs[index].name}消息`
  });
  
  // 加载新选项卡的消息
  loadMessages();
  
  // 隐藏加载提示
  setTimeout(() => {
    uni.hideLoading();
  }, 500);
};

/**
 * 读取消息
 * @param {Object} message - 消息对象
 */
const readMessage = (message) => {
  if (!message.isRead) {
    message.isRead = true;
    
    // 显示提示
    uni.showToast({
      title: '已读消息',
      icon: 'success',
      duration: 1000
    });
    
    // TODO: 实际项目中可以调用API标记消息为已读
    // api.markMessageRead(message.id).then(res => {
    //   // 处理返回结果
    // });
  }
  
  // 处理点击消息的其他逻辑
  // 根据消息类型跳转到不同页面或者执行不同操作
  switch (tabs[currentTab.value].type) {
    case 'like':
      uni.showToast({
        title: '查看点赞详情',
        icon: 'none'
      });
      // 可以跳转到具体文章或评论
      // uni.navigateTo({ url: `/pages/article-detail/article-detail?id=${relatedId}` });
      break;
    case 'collect':
      uni.showToast({
        title: '查看收藏详情',
        icon: 'none'
      });
      break;
    case 'subscribe':
      uni.showToast({
        title: '查看订阅者信息',
        icon: 'none'
      });
      break;
  }
};

// 页面初始化
onMounted(() => {
  // 加载默认选项卡的消息
  loadMessages();
  
  // TODO: 后续可以添加实时消息通知的功能
});
</script>

<style lang="scss">
page {
  background-color: #f5f5f5;
  min-height: 100%;
}

.message-container {
  display: flex;
  flex-direction: column;
  padding: 20px;
  
  // 顶部选项卡样式
  .tabs-container {
    display: flex;
    justify-content: space-around;
    padding: 20rpx 0;
    background-color: #fff;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    margin-top: 0;
    
    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10rpx 0;
      flex: 1;
      position: relative;
      
      &.active {
        .tab-text {
          color: #4361ee;
          font-weight: bold;
        }
        
        &::after {
          content: '';
          position: absolute;
          bottom: -10rpx;
          left: 50%;
          transform: translateX(-50%);
          width: 60rpx;
          height: 6rpx;
          background-color: #4361ee;
          border-radius: 3rpx;
        }
      }
      
      .tab-icon {
        margin-bottom: 10rpx;
      }
      
      .tab-text {
        font-size: 26rpx;
        color: #666;
      }
    }
  }
  
  // 消息列表样式
  .message-list {
    margin-top: 120rpx; // 为固定的tabs-container留出空间
    
    // 加载状态
    .loading-state {
      text-align: center;
      font-size: 24rpx;
      color: #999;
      margin: 20rpx 0;
      padding: 20rpx 0;
    }
    
    .message-item {
      display: flex;
      background-color: #fff;
      padding: 30rpx;
      margin-bottom: 20rpx;
      border-radius: 20rpx;
      box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
      position: relative;
      
      .message-icon {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        background-color: #f0f0f0;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 20rpx;
      }
      
      .message-content {
        flex: 1;
        
        .message-title {
          font-size: 28rpx;
          color: #333;
          margin-bottom: 10rpx;
          font-weight: 500;
        }
        
        .message-desc {
          font-size: 26rpx;
          color: #666;
        }
      }
      
      .message-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: space-between;
        
        .message-time {
          font-size: 24rpx;
          color: #999;
        }
        
        .unread-dot {
          width: 16rpx;
          height: 16rpx;
          border-radius: 50%;
          background-color: #ff6b6b;
        }
      }
      
      &:active {
        opacity: 0.7;
      }
    }
    
    // 无消息提示
    .no-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100rpx 0;
      
      text {
        font-size: 28rpx;
        color: #999;
        margin-top: 20rpx;
      }
    }
  }
}
</style>