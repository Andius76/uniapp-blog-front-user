<template>
  <view class="user-settings-wrapper">
    <!-- 弹出层背景蒙版 -->
    <view class="mask" @click="handleBackOrClose" v-if="visible"></view>
    
    <!-- 设置面板 -->
    <view class="settings-panel" :class="{ 'visible': visible, 'fullscreen': true }">
      <view class="panel-header">
        <text class="panel-title">
          {{ isConfirmingLogout ? '退出登录' : (isEditingNickname ? '修改昵称' : '用户设置') }}
        </text>
        <view class="close-btn" @click="handleBackOrClose">
          <uni-icons :type="isEditingNickname || isConfirmingLogout ? 'left' : 'close'" size="24" color="#333"></uni-icons>
        </view>
      </view>
      
      <!-- 主设置面板 -->
      <view class="panel-content" v-if="!isEditingNickname && !isConfirmingLogout">
        <!-- 账号信息（邮箱）- 不可更改 -->
        <view class="settings-item non-clickable">
          <view class="item-label">
            <uni-icons type="email" size="22" color="#666"></uni-icons>
            <text>账号</text>
          </view>
          <view class="item-content">
            <text class="email-preview">{{ userInfo.email || '未绑定邮箱' }}</text>
          </view>
        </view>
        
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
      <view class="version-info" v-if="!isEditingNickname && !isConfirmingLogout">
        <text>当前版本: v1.0.0</text>
      </view>
    </view>
    
    <!-- 确认放弃修改弹窗 -->
    <uni-popup ref="confirmPopup" type="dialog">
      <uni-popup-dialog 
        type="warning"
        title="提示" 
        content="您有未保存的修改，确定放弃吗？" 
        @confirm="confirmAbandonChanges" 
        @close="cancelAbandonChanges"
        confirmText="放弃修改"
        cancelText="继续编辑"
      ></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, watch, onMounted, onUnmounted, nextTick } from 'vue';
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue';
import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';

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
      bio: '这个人很懒，什么都没写',
      email: ''
    })
  },
  initialView: {
    type: String,
    default: 'main' // 可选值: 'main', 'nickname'
  }
});

// 定义事件
const emit = defineEmits(['update:visible', 'avatar-change', 'nickname-change', 'logout']);

// 面板状态管理
const isEditingNickname = ref(false);
const isConfirmingLogout = ref(false);
const newNickname = ref('');
const confirmPopup = ref(null);
const hasUnsavedChanges = ref(false);
const originalNickname = ref('');
const isBackConfirming = ref(false);

// 监听面板显示状态，显示时根据初始视图参数决定显示哪个界面
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 如果面板显示，根据初始视图设置显示哪个界面
    if (props.initialView === 'nickname') {
      showNicknameEdit();
    }
    // 注册返回按键监听和TabBar点击拦截
    registerBackButtonListener();
    registerTabBarInterceptor();
  } else {
    // 面板隐藏时重置所有状态
    isEditingNickname.value = false;
    isConfirmingLogout.value = false;
    hasUnsavedChanges.value = false;
    
    // 移除返回按键监听和TabBar点击拦截
    unregisterBackButtonListener();
    unregisterTabBarInterceptor();
  }
});

// 监听昵称输入变化，判断是否有未保存的修改
watch(() => newNickname.value, (newVal) => {
  if (isEditingNickname.value) {
    hasUnsavedChanges.value = newVal !== originalNickname.value;
  }
});

// 处理返回或关闭
const handleBackOrClose = () => {
  if (isEditingNickname.value && hasUnsavedChanges.value) {
    // 如果有未保存的修改，显示确认弹窗
    showConfirmAbandonDialog();
  } else if (isEditingNickname.value) {
    cancelEditNickname();
  } else if (isConfirmingLogout.value) {
    cancelLogout();
  } else {
    closeSettings();
  }
};

// 显示确认放弃修改弹窗
const showConfirmAbandonDialog = () => {
  isBackConfirming.value = true;
  nextTick(() => {
    confirmPopup.value.open();
  });
};

// 确认放弃修改
const confirmAbandonChanges = () => {
  if (isEditingNickname.value) {
    cancelEditNickname();
  }
  
  isBackConfirming.value = false;
  hasUnsavedChanges.value = false;
  
  // 如果是在主设置面板，则关闭整个设置
  if (!isEditingNickname.value && !isConfirmingLogout.value) {
    closeSettings();
  }
};

// 取消放弃修改
const cancelAbandonChanges = () => {
  isBackConfirming.value = false;
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
  originalNickname.value = props.userInfo.nickname;
  newNickname.value = props.userInfo.nickname;
  isEditingNickname.value = true;
  hasUnsavedChanges.value = false;
};

// 取消编辑昵称
const cancelEditNickname = () => {
  isEditingNickname.value = false;
  hasUnsavedChanges.value = false;
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
    
    // 更新原始昵称，清除未保存标记
    originalNickname.value = newNickname.value;
    hasUnsavedChanges.value = false;
    
    // 返回主设置界面
    isEditingNickname.value = false;
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

// 注册返回按钮监听
const registerBackButtonListener = () => {
  // #ifdef APP-PLUS || MP-WEIXIN
  plus?.key?.addEventListener('backbutton', handleBackButton);
  uni.addInterceptor('navigateBack', {
    success: handleBackButtonInterceptor
  });
  // #endif
};

// 移除返回按钮监听
const unregisterBackButtonListener = () => {
  // #ifdef APP-PLUS || MP-WEIXIN
  plus?.key?.removeEventListener('backbutton', handleBackButton);
  uni.removeInterceptor('navigateBack');
  // #endif
};

// 处理返回按钮
const handleBackButton = () => {
  // 如果设置面板可见，拦截返回事件
  if (props.visible) {
    handleBackOrClose();
    return true; // 返回true表示已拦截处理
  }
  return false; // 未拦截，交由系统处理
};

// 拦截返回导航
const handleBackButtonInterceptor = (e) => {
  if (props.visible) {
    // 阻止默认返回行为
    e.cancel = true;
    // 自定义处理
    handleBackOrClose();
  }
  return e;
};

// 注册TabBar点击拦截器
const registerTabBarInterceptor = () => {
  // #ifdef MP-WEIXIN || APP-PLUS
  uni.addInterceptor('switchTab', {
    invoke: interceptTabBarClick
  });
  // #endif
};

// 移除TabBar点击拦截器
const unregisterTabBarInterceptor = () => {
  // #ifdef MP-WEIXIN || APP-PLUS
  uni.removeInterceptor('switchTab');
  // #endif
};

// 拦截TabBar点击
const interceptTabBarClick = (e) => {
  if (props.visible) {
    // 如果有未保存的修改，显示确认弹窗
    if (hasUnsavedChanges.value) {
      showConfirmAbandonDialog();
      return false; // 拦截点击
    } else {
      // 直接关闭设置面板
      closeSettings();
    }
  }
  return e; // 不拦截
};

// 组件挂载时
onMounted(() => {
  // 监听页面路由变化，确保关闭设置面板
  uni.onTabBarMidButtonTap(() => {
    if (props.visible) {
      if (hasUnsavedChanges.value) {
        showConfirmAbandonDialog();
      } else {
        closeSettings();
      }
    }
  });
});

// 组件卸载时
onUnmounted(() => {
  // 确保移除所有事件监听器
  unregisterBackButtonListener();
  unregisterTabBarInterceptor();
});
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
        
        &.non-clickable {
          background-color: #fafafa;
        }
        
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
          .bio-preview,
          .email-preview {
            font-size: 28rpx;
            color: #666;
            margin-right: 15rpx;
            max-width: 300rpx;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .email-preview {
            color: #999;
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