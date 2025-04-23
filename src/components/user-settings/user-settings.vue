<template>
  <view class="user-settings-wrapper">
    <!-- 弹出层背景蒙版 -->
    <view class="mask" @click="closeSettings" v-if="visible"></view>
    
    <!-- 设置面板 -->
    <view class="settings-panel" :class="{ 'visible': visible, 'fullscreen': true }">
      <view class="panel-header">
        <text class="panel-title">
          {{ isConfirmingLogout ? '退出登录' : (isEditingNickname ? '修改昵称' : (isEditingBio ? '编辑个人简介' : '用户设置')) }}
        </text>
        <view class="close-btn" @click="handleBackOrClose">
          <uni-icons :type="isEditingNickname || isConfirmingLogout || isEditingBio ? 'left' : 'close'" size="24" color="#333"></uni-icons>
        </view>
      </view>
      
      <!-- 主设置面板 -->
      <view class="panel-content" v-if="!isEditingNickname && !isConfirmingLogout && !isEditingBio">
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
        
        <!-- 个人简介设置 -->
        <view class="settings-item" @click="showBioEdit">
          <view class="item-label">
            <uni-icons type="info" size="22" color="#666"></uni-icons>
            <text>编辑个人简介</text>
          </view>
          <view class="item-content">
            <text class="bio-preview">{{ userInfo.bio || '未设置' }}</text>
            <uni-icons type="right" size="18" color="#999"></uni-icons>
          </view>
        </view>
        
        <!-- 退出登录 -->
        <view class="settings-item logout-item" @click="showLogoutConfirm">
          <view class="item-label">
            <uni-icons type="logout" size="22" color="#ff6b6b"></uni-icons>
            <text class="logout-text">退出登录</text>
          </view>
        </view>
      </view>
      
      <!-- 昵称编辑面板 -->
      <view class="nickname-edit-panel" v-else-if="isEditingNickname">
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
      
      <!-- 个人简介编辑面板 -->
      <view class="bio-edit-panel" v-else-if="isEditingBio">
        <view class="bio-input-container">
          <textarea 
            class="bio-textarea"
            v-model="newBio"
            placeholder="请输入个人简介"
            maxlength="100"
          />
          <text class="char-count">{{ newBio.length }}/100</text>
        </view>
        
        <view class="bio-actions">
          <view class="bio-action-btn cancel" @click="cancelEditBio">
            取消
          </view>
          <view class="bio-action-btn confirm" @click="updateBio">
            确认
          </view>
        </view>
      </view>
      
      <!-- 退出登录确认面板 -->
      <view class="logout-confirm-panel" v-else-if="isConfirmingLogout">
        <view class="logout-confirm-content">
          <uni-icons type="help" size="60" color="#ff6b6b"></uni-icons>
          <text class="logout-confirm-text">确定要退出登录吗？</text>
        </view>
        
        <view class="logout-actions">
          <view class="logout-action-btn cancel" @click="cancelLogout">
            取消
          </view>
          <view class="logout-action-btn confirm" @click="logout">
            确认退出
          </view>
        </view>
      </view>
      
      <!-- 版本信息 -->
      <view class="version-info" v-if="!isEditingNickname && !isConfirmingLogout && !isEditingBio">
        <text>当前版本: v1.0.0</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, watch } from 'vue';
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
      nickname: '用户昵称',
      bio: '这个人很懒，什么都没写'
    })
  },
  initialView: {
    type: String,
    default: 'main' // 可选值: 'main', 'bio', 'nickname'
  }
});

// 定义事件
const emit = defineEmits(['update:visible', 'avatar-change', 'nickname-change', 'bio-change', 'logout']);

// 面板状态管理
const isEditingNickname = ref(false);
const isConfirmingLogout = ref(false);
const isEditingBio = ref(false);
const newNickname = ref('');
const newBio = ref('');

// 监听面板显示状态，显示时根据初始视图参数决定显示哪个界面
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 如果面板显示，根据初始视图设置显示哪个界面
    if (props.initialView === 'bio') {
      showBioEdit();
    } else if (props.initialView === 'nickname') {
      showNicknameEdit();
    }
  } else {
    // 面板隐藏时重置所有状态
    isEditingNickname.value = false;
    isEditingBio.value = false;
    isConfirmingLogout.value = false;
  }
});

// 处理返回或关闭
const handleBackOrClose = () => {
  if (isEditingNickname.value) {
    cancelEditNickname();
  } else if (isConfirmingLogout.value) {
    cancelLogout();
  } else if (isEditingBio.value) {
    cancelEditBio();
  } else {
    closeSettings();
  }
};

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

// 显示个人简介编辑界面
const showBioEdit = () => {
  newBio.value = props.userInfo.bio || '';
  isEditingBio.value = true;
};

// 取消编辑个人简介
const cancelEditBio = () => {
  isEditingBio.value = false;
};

// 更新个人简介
const updateBio = () => {
  // 清理个人简介文本
  const bioText = newBio.value.trim();
  
  // 如果简介为空，使用默认文本
  const finalBio = bioText || '这个人很懒，什么都没写';
  
  // 模拟更新成功
  uni.showLoading({
    title: '更新中...'
  });
  
  setTimeout(() => {
    uni.hideLoading();
    // 通知父组件简介已更改
    emit('bio-change', finalBio);
    
    uni.showToast({
      title: '个人简介更新成功',
      icon: 'success'
    });
    
    // 返回主设置界面
    isEditingBio.value = false;
  }, 1000);
};

// 显示退出登录确认
const showLogoutConfirm = () => {
  isConfirmingLogout.value = true;
};

// 取消退出登录
const cancelLogout = () => {
  isConfirmingLogout.value = false;
};

// 确认退出登录
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
    
    &.fullscreen {
      height: 100vh;
      bottom: -100vh;
      border-radius: 0;
      
      &.visible {
        transform: translateY(-100vh);
      }
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
          
          .nickname-preview,
          .bio-preview {
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
    
    // 个人简介编辑面板
    .bio-edit-panel {
      flex: 1;
      padding: 30rpx;
      
      .bio-input-container {
        position: relative;
        margin-top: 20rpx;
        
        .bio-textarea {
          width: 100%;
          height: 300rpx;
          background-color: #f8f8f8;
          border: 2rpx solid #eee;
          border-radius: 8rpx;
          padding: 20rpx;
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
      
      .bio-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 80rpx;
        
        .bio-action-btn {
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
    
    // 退出登录确认面板
    .logout-confirm-panel {
      flex: 1;
      padding: 40rpx 30rpx;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      
      .logout-confirm-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 60rpx;
        
        .logout-confirm-text {
          font-size: 34rpx;
          color: #333;
          margin-top: 30rpx;
          font-weight: 500;
        }
      }
      
      .logout-actions {
        display: flex;
        justify-content: space-between;
        margin-bottom: 60rpx;
        
        .logout-action-btn {
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
            background-color: #ff6b6b;
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