<template>
  <view class="user-settings-wrapper">
    <!-- 弹出层背景蒙版 -->
    <view class="mask" @click="closeSettings" v-if="visible"></view>
    
    <!-- 设置面板 -->
    <view class="settings-panel" :class="{ 'visible': visible }">
      <view class="panel-header">
        <text class="panel-title">{{ isEditingNickname ? '修改昵称' : '用户设置' }}</text>
        <view class="close-btn" @click="isEditingNickname ? cancelEditNickname() : closeSettings()">
          <uni-icons :type="isEditingNickname ? 'left' : 'close'" size="24" color="#333"></uni-icons>
        </view>
      </view>
      
      <!-- 主设置面板 -->
      <view class="panel-content" v-if="!isEditingNickname">
        <!-- 头像设置 -->
        <view class="settings-item" @click="changeAvatar">
          <view class="item-label">
            <uni-icons type="person" size="22" color="#666"></uni-icons>
            <text>修改头像</text>
          </view>
          <view class="item-content">
            <image class="avatar-preview" :src="userInfo.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
            <uni-icons type="right" size="18" color="#999"></uni-icons>
          </view>
        </view>
        
        <!-- 昵称设置 -->
        <view class="settings-item" @click="showNicknameEdit">
          <view class="item-label">
            <uni-icons type="chat" size="22" color="#666"></uni-icons>
            <text>修改昵称</text>
          </view>
          <view class="item-content">
            <text class="nickname-preview">{{ userInfo.nickname }}</text>
            <uni-icons type="right" size="18" color="#999"></uni-icons>
          </view>
        </view>
        
        <!-- 退出登录 -->
        <view class="settings-item logout-item" @click="confirmLogout">
          <view class="item-label">
            <uni-icons type="logout" size="22" color="#ff6b6b"></uni-icons>
            <text class="logout-text">退出登录</text>
          </view>
        </view>
      </view>
      
      <!-- 昵称编辑面板 -->
      <view class="nickname-edit-panel" v-else>
        <view class="nickname-input-container">
          <input 
            class="nickname-input"
            type="text"
            v-model="newNickname"
            placeholder="请输入新昵称"
            maxlength="20"
            focus
          />
          <text class="char-count">{{ newNickname.length }}/20</text>
        </view>
        
        <view class="nickname-actions">
          <view class="nickname-action-btn cancel" @click="cancelEditNickname">
            取消
          </view>
          <view class="nickname-action-btn confirm" @click="updateNickname">
            确认
          </view>
        </view>
      </view>
      
      <!-- 版本信息 -->
      <view class="version-info" v-if="!isEditingNickname">
        <text>当前版本: v1.0.0</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits } from 'vue';
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';

// 定义组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userInfo: {
    type: Object,
    default: () => ({
      avatar: '/static/images/avatar.png',
      nickname: '用户昵称'
    })
  }
});

// 定义事件
const emit = defineEmits(['update:visible', 'avatar-change', 'nickname-change', 'logout']);

// 昵称编辑状态
const isEditingNickname = ref(false);
const newNickname = ref('');

// 关闭设置面板
const closeSettings = () => {
  emit('update:visible', false);
};

// 修改头像
const changeAvatar = () => {
  uni.chooseImage({
    count: 1, // 默认9
    sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
    sourceType: ['album', 'camera'], // 从相册选择或使用相机拍摄
    success: (res) => {
      const tempFilePaths = res.tempFilePaths;
      
      // 这里可以添加图片上传到服务器的逻辑
      // 模拟上传成功后更新头像
      uni.showLoading({
        title: '上传中...'
      });
      
      setTimeout(() => {
        uni.hideLoading();
        // 通知父组件头像已更改
        emit('avatar-change', tempFilePaths[0]);
        
        uni.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
      }, 1500);
    }
  });
};

// 显示昵称编辑界面
const showNicknameEdit = () => {
  newNickname.value = props.userInfo.nickname;
  isEditingNickname.value = true;
};

// 取消编辑昵称
const cancelEditNickname = () => {
  isEditingNickname.value = false;
};

// 更新昵称
const updateNickname = () => {
  if (!newNickname.value.trim()) {
    uni.showToast({
      title: '昵称不能为空',
      icon: 'none'
    });
    return;
  }
  
  // 这里可以添加更新昵称到服务器的逻辑
  // 模拟更新成功
  uni.showLoading({
    title: '更新中...'
  });
  
  setTimeout(() => {
    uni.hideLoading();
    // 通知父组件昵称已更改
    emit('nickname-change', newNickname.value);
    
    uni.showToast({
      title: '昵称更新成功',
      icon: 'success'
    });
    
    // 返回主设置界面
    isEditingNickname.value = false;
  }, 1000);
};

// 确认退出登录
const confirmLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 执行退出登录
        logout();
      }
    }
  });
};

// 退出登录
const logout = () => {
  uni.showLoading({
    title: '退出中...'
  });
  
  // 这里可以添加实际的退出登录逻辑，如清除token等
  setTimeout(() => {
    uni.hideLoading();
    // 通知父组件用户已退出登录
    emit('logout');
    closeSettings();
    
    uni.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  }, 1000);
};
</script>

<style lang="scss">
.user-settings-wrapper {
  .mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
  
  .settings-panel {
    position: fixed;
    bottom: -800rpx; // 初始位置在屏幕外
    left: 0;
    right: 0;
    height: 750rpx;
    background-color: #fff;
    border-radius: 30rpx 30rpx 0 0;
    z-index: 1000;
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
    
    &.visible {
      transform: translateY(-800rpx);
    }
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx;
      border-bottom: 2rpx solid #f5f5f5;
      
      .panel-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
      
      .close-btn {
        padding: 10rpx;
      }
    }
    
    .panel-content {
      flex: 1;
      padding: 20rpx 0;
      overflow-y: auto;
      
      .settings-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 30rpx;
        border-bottom: 2rpx solid #f5f5f5;
        
        .item-label {
          display: flex;
          align-items: center;
          
          text {
            font-size: 28rpx;
            color: #333;
            margin-left: 15rpx;
          }
        }
        
        .item-content {
          display: flex;
          align-items: center;
          
          .avatar-preview {
            width: 80rpx;
            height: 80rpx;
            border-radius: 50%;
            margin-right: 15rpx;
            background-color: #eee;
          }
          
          .nickname-preview {
            font-size: 28rpx;
            color: #666;
            margin-right: 15rpx;
            max-width: 300rpx;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
        
        &.logout-item {
          margin-top: 50rpx;
          border-top: 10rpx solid #f5f5f5;
          
          .logout-text {
            color: #ff6b6b;
          }
        }
      }
    }
    
    // 昵称编辑面板
    .nickname-edit-panel {
      flex: 1;
      padding: 30rpx;
      
      .nickname-input-container {
        position: relative;
        margin-top: 20rpx;
        
        .nickname-input {
          width: 100%;
          height: 90rpx;
          background-color: #f8f8f8;
          border: 2rpx solid #eee;
          border-radius: 8rpx;
          padding: 0 20rpx;
          font-size: 30rpx;
          color: #333;
        }
        
        .char-count {
          position: absolute;
          right: 20rpx;
          bottom: -50rpx;
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .nickname-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 80rpx;
        
        .nickname-action-btn {
          width: 45%;
          height: 80rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8rpx;
          font-size: 30rpx;
          
          &.cancel {
            background-color: #f8f8f8;
            color: #666;
            border: 2rpx solid #eee;
          }
          
          &.confirm {
            background-color: #4361ee;
            color: #fff;
          }
        }
      }
    }
    
    .version-info {
      padding: 30rpx;
      text-align: center;
      
      text {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}
</style> 