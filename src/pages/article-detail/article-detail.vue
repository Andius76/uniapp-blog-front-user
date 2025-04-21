<template>
  <view class="container">
    <scroll-view scroll-y class="article-detail">
      <!-- 文章标题区域 -->
      <view class="article-header">
        <text class="article-title">{{ data.article.title }}</text>
        <view class="meta-info">
          <text class="author">{{ data.article.author.nickname }}</text>
          <text class="publish-time">{{ data.article.publishTime }}</text>
        </view>
      </view>

      <!-- 正文内容区域 -->
      <view class="content-section">
        <text class="article-content">{{ data.article.content }}</text>
        <view class="image-container" v-if="data.article.images">
          <image 
            v-for="(img, index) in data.article.images" 
            :key="index"
            :src="img"
            mode="aspectFill"
            class="content-image"
          />
        </view>
      </view>

      <!-- 标签区域 -->
      <view class="tag-section" v-if="data.article.tags.length">
        <text class="section-title">文章标签</text>
        <view class="tag-list">
          <view 
            v-for="(tag, index) in data.article.tags"
            :key="index"
            class="tag-item"
          >
            {{ tag }}
          </view>
        </view>
      </view>

      <!-- 互动操作栏 -->
      <view class="action-bar">
        <view class="action-item" @click="handleLike">
          <uni-icons :type="data.article.isLiked ? 'heart-filled' : 'heart'" size="24" 
            :color="data.article.isLiked ? '#ff6b6b' : '#666'"/>
          <text>{{ data.article.likeCount }}</text>
        </view>
        <view class="action-item" @click="handleCollect">
          <uni-icons :type="data.article.isCollected ? 'star-filled' : 'star'" size="24"
            :color="data.article.isCollected ? '#ffc107' : '#666'"/>
          <text>{{ data.article.collectCount }}</text>
        </view>
        <view class="action-item" @click="handleComment">
          <uni-icons type="chatbubble" size="24" color="#666"/>
          <text>{{ data.article.commentCount }}</text>
        </view>
      </view>

      <!-- 评论输入框 -->
      <view class="comment-input-container">
        <uni-search-bar
          v-model="commentText"
          placeholder="输入评论..."
          :radius="20"
          @confirm="submitComment"
          cancel-button="none"
        />
      </view>

      <!-- 评论列表 -->
      <view class="comment-section">
        <text class="section-title">热门评论（{{data.article.commentCount}}）</text>
        <view class="comment-list">
          <view v-for="(comment, index) in data.comments" :key="comment.id" class="comment-item shadow-card">
            <image :src="comment.avatar" class="comment-avatar"/>
            <view class="comment-content">
              <view class="comment-header">
                <text class="comment-author">{{ comment.author }}</text>
                <text class="comment-time">{{ comment.time }}</text>
              </view>
              <text class="comment-text">{{ comment.content }}</text>
              
              <!-- 操作按钮 -->
              <view class="action-buttons">
                <view class="action-btn" @click="toggleLike(comment)">
                  <uni-icons :type="comment.isLiked ? 'heart-filled' : 'heart'" size="16" 
                    :color="comment.isLiked ? '#ff6b6b' : '#666'"/>
                  <text class="count">{{ comment.likeCount }}</text>
                </view>
                <view class="action-btn" @click="showReplyInput(comment)">
                  <uni-icons type="chatbubble" size="16" color="#666"/>
                  <text>回复</text>
                </view>
              </view>

              <!-- 回复输入框 -->
              <view v-if="comment.showReply" class="reply-input">
                <uni-easyinput
                  v-model="comment.replyText"
                  placeholder="输入回复..."
                  :styles="{backgroundColor: '#f5f5f5', borderRadius: '12px'}"
                  @confirm="submitReply(comment)"
                />
              </view>

              <!-- 回复列表 -->
              <view v-if="comment.replies.length" class="reply-list">
                <view v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                  <text class="reply-author">{{ reply.author }}：</text>
                  <text class="reply-text">{{ reply.content }}</text>
                  <text class="reply-time">{{ reply.time }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const commentText = ref('')

const data = reactive({
  article: {
    id: 0,
    title: '文章标题',
    content: '这里是文章正文内容...',
    author: {
      nickname: '作者昵称',
      avatar: '/static/images/avatar.png'
    },
    publishTime: '2024-03-20 14:30',
    tags: ['技术', '前端'],
    images: ['/static/images/default.png'],
    likeCount: 156,
    collectCount: 89,
    commentCount: 45,
    isLiked: false,
    isCollected: false
  },
  comments: [
    {
      id: 1,
      author: '用户A',
      avatar: '/static/images/avatar.png',
      content: '非常棒的文章！',
      time: '1小时前',
      likeCount: 12,
      isLiked: false,
      showReply: false,
      replyText: '',
      replies: []
    }
  ]
})

const submitComment = () => {
  if (commentText.value.trim()) {
    data.comments.unshift({
      id: Date.now(),
      avatar: '/static/images/avatar.png',
      author: '当前用户',
      content: commentText.value,
      time: '刚刚',
      likeCount: 0,
      isLiked: false,
      showReply: false,
      replyText: '',
      replies: []
    })
    commentText.value = ''
    data.article.commentCount++
  }
}

const toggleLike = (comment) => {
  comment.isLiked = !comment.isLiked
  comment.likeCount += comment.isLiked ? 1 : -1
}

const showReplyInput = (comment) => {
  comment.showReply = !comment.showReply
  if (!comment.showReply) comment.replyText = ''
}

const submitReply = (comment) => {
  if (comment.replyText.trim()) {
    comment.replies.push({
      id: Date.now(),
      author: '当前用户',
      content: comment.replyText,
      time: '刚刚'
    })
    comment.replyText = ''
    comment.showReply = false
  }
}

onLoad((options) => {
  if (options?.id) {
    // TODO: 根据ID获取文章详情
    console.log('加载文章ID:', options.id)
  }
})

const handleLike = () => {
  data.article.isLiked = !data.article.isLiked
  data.article.likeCount += data.article.isLiked ? 1 : -1
  uni.showToast({
    title: data.article.isLiked ? '点赞成功' : '已取消点赞',
    icon: data.article.isLiked ? 'success' : 'none'
  })
}

const handleCollect = () => {
  data.article.isCollected = !data.article.isCollected
  data.article.collectCount += data.article.isCollected ? 1 : -1
  uni.showToast({
    title: data.article.isCollected ? '收藏成功' : '已取消收藏',
    icon: data.article.isCollected ? 'success' : 'none'
  })
}

const handleComment = () => {
  uni.showToast({
    title: '打开评论输入',
    icon: 'none'
  })
}
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  background-color: #fff;
}

.article-detail {
  height: calc(100vh - 88rpx);
}

.article-header {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  
  .article-title {
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
    line-height: 1.4;
  }

  .meta-info {
    margin-top: 20rpx;
    display: flex;
    align-items: center;
    
    .author {
      font-size: 28rpx;
      color: #666;
      margin-right: 30rpx;
    }
    
    .publish-time {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.content-section {
  padding: 30rpx;
  
  .article-content {
    font-size: 32rpx;
    color: #333;
    line-height: 1.8;
  }
  
  .image-container {
    margin-top: 40rpx;
    
    .content-image {
      width: 100%;
      height: 400rpx;
      border-radius: 16rpx;
      margin-bottom: 20rpx;
    }
  }
}

.tag-section {
  padding: 30rpx;
  border-top: 16rpx solid #f5f5f5;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 30rpx;
  }
  
  .tag-list {
    display: flex;
    flex-wrap: wrap;
  }
  
  .tag-item {
    padding: 12rpx 24rpx;
    background-color: #f0f2f5;
    border-radius: 40rpx;
    margin-right: 20rpx;
    margin-bottom: 20rpx;
    font-size: 26rpx;
    color: #666;
  }
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
  border-top: 1rpx solid #eee;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
  
  .action-item {
    display: flex;
    align-items: center;
    
    text {
      margin-left: 10rpx;
      font-size: 28rpx;
      color: #666;
    }
  }
}

.comment-section {
  padding: 30rpx;
  margin-bottom: 100rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 30rpx;
  }
  
  .comment-item {
    display: flex;
    margin-bottom: 30rpx;
    
    .comment-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 20rpx;
    }
    
    .comment-content {
      flex: 1;
      
      .comment-author {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 10rpx;
      }
      
      .comment-text {
        font-size: 30rpx;
        color: #333;
        line-height: 1.6;
      }
      
      .comment-time {
        font-size: 24rpx;
        color: #999;
        margin-top: 10rpx;
      }
    }
  }
}
</style>