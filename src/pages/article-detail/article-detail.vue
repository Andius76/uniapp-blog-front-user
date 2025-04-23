<template>
  <view class="container">
    <scroll-view scroll-y class="article-detail"
      refresher-enabled
      :refresher-triggered="data.refreshing"
      @refresherrefresh="onRefresh"
      @refresherrestore="onRestore"
      :refresher-background="'#f2f2f2'"
      refresher-default-style="black"
      @scrolltolower="loadMoreComments">
      <!-- 返回按钮 -->
      <!-- #ifdef H5 -->
      <view class="back-button" @click="goBack">
        <uni-icons type="back" size="24" color="#333"></uni-icons>
      </view>
      <!-- #endif -->
      
      <!-- 刷新成功提示 -->
      <view class="refresh-success" v-if="data.showRefreshSuccess">
        <uni-icons type="checkmarkempty" size="16" color="#09BB07"></uni-icons>
        <text>刷新成功</text>
      </view>
      
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

      <!-- 评论列表 -->
      <view class="comment-section">
        <text class="section-title">评论（{{ data.article.commentCount }}）</text>
        <view class="comment-list">
          <view v-for="(comment, index) in data.comments" :key="index" class="comment-card">
            <view class="comment-item">
              <image :src="comment.avatar" class="comment-avatar"/>
              <view class="comment-content">
                <view class="comment-header">
                  <text class="comment-author">{{ comment.author }}</text>
                  <view class="comment-actions">
                    <view class="like-action" @click="handleCommentLike(index)">
                      <uni-icons :type="comment.isLiked ? 'heart-filled' : 'heart'" size="16" 
                        :color="comment.isLiked ? '#ff6b6b' : '#999'"/>
                      <text :class="{'liked': comment.isLiked}">{{ comment.likeCount || 0 }}</text>
                    </view>
                  </view>
                </view>
                <text class="comment-text">{{ comment.content }}</text>
                <view class="comment-footer">
                  <text class="comment-time">{{ comment.time }}</text>
                  <text class="reply-btn" @click="replyToComment(index)">回复</text>
                </view>
              </view>
            </view>
            
            <!-- 评论回复区域 -->
            <view class="reply-list" v-if="comment.replies && comment.replies.length > 0">
              <view v-for="(reply, replyIndex) in comment.replies" :key="replyIndex" class="reply-item">
                <view class="reply-content">
                  <text class="reply-author">{{ reply.author }}</text>
                  <text v-if="reply.replyTo" class="reply-to">回复</text>
                  <text v-if="reply.replyTo" class="reply-to-author">@{{ reply.replyTo }}</text>
                  <text class="reply-text">：{{ reply.content }}</text>
                </view>
                <view class="reply-footer">
                  <text class="reply-time">{{ reply.time }}</text>
                  <text class="reply-btn" @click="replyToReply(index, replyIndex)">回复</text>
                </view>
              </view>
              
              <!-- 查看更多回复 -->
              <view v-if="comment.replies.length > 2 && !comment.showAllReplies" class="more-replies" 
                    @click="showAllReplies(index)">
                <text>查看更多回复</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 无评论提示 -->
        <view v-if="data.comments.length === 0" class="no-comment">
          <uni-icons type="chat" size="40" color="#ddd"></uni-icons>
          <text>暂无评论，快来发表第一条评论吧</text>
        </view>
        
        <!-- 加载更多 -->
        <view v-if="data.comments.length > 0" class="load-more">
          <view v-if="data.isLoadingMore" class="loading">
            <uni-icons type="spinner-cycle" size="20" color="#999"></uni-icons>
            <text>加载中...</text>
          </view>
          <view v-else-if="data.hasMoreComments" class="load-more-text" @click="loadMoreComments">
            <text>点击加载更多</text>
          </view>
          <view v-else class="no-more">
            <text>已经到底啦</text>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 评论输入框 -->
    <view class="comment-input-container" :style="{ bottom: inputBottom + 'px' }">
      <input
        class="comment-input"
        type="text"
        v-model="data.commentContent"
        :placeholder="data.replyTarget ? `回复 ${data.replyTarget}` : '说点什么...'"
        confirm-type="send"
        @confirm="submitComment"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
      />
      <button class="send-btn" :disabled="!data.commentContent.trim()" @click="submitComment">发送</button>
    </view>
  </view>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

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
      content: '非常棒的文章，学习了很多知识！',
      time: '1小时前',
      likeCount: 12,
      isLiked: false,
      showAllReplies: false,
      replies: [
        {
          id: 11,
          author: '用户B',
          replyTo: '用户A',
          content: '同感，我也学到了很多',
          time: '50分钟前'
        },
        {
          id: 12,
          author: '用户C',
          replyTo: '用户B',
          content: '期待作者的下一篇文章',
          time: '30分钟前'
        }
      ]
    },
    {
      id: 2,
      author: '用户D',
      avatar: '/static/images/avatar.png',
      content: '文章解释得很清楚，希望作者能多写一些这方面的内容',
      time: '2小时前',
      likeCount: 8,
      isLiked: false,
      replies: []
    }
  ],
  commentContent: '', // 评论输入内容
  replyTarget: '', // 回复的目标用户
  replyToCommentIndex: -1, // 回复的评论索引
  replyToReplyIndex: -1, // 回复的回复索引
  inputBottom: 0, // 键盘高度调整
  refreshing: false, // 是否正在刷新中
  showRefreshSuccess: false, // 是否显示刷新成功提示
  
  // 新增评论加载相关状态
  currentPage: 1, // 当前评论页码
  pageSize: 10, // 每页评论数量
  hasMoreComments: true, // 是否还有更多评论
  isLoadingMore: false, // 是否正在加载更多评论
})

onLoad((options) => {
  if (options?.id) {
    // TODO: 根据ID获取文章详情
    console.log('加载文章ID:', options.id)
  }
  
  // 显示评论区
  if (options?.showComments) {
    // 可以滚动到评论区
    setTimeout(() => {
      const query = uni.createSelectorQuery()
      query.select('.comment-section').boundingClientRect()
      query.selectViewport().scrollOffset()
      query.exec(res => {
        if (res && res[0]) {
          uni.pageScrollTo({
            scrollTop: res[0].top,
            duration: 300
          })
        }
      })
    }, 500)
  }
})

// 处理文章点赞
const handleLike = () => {
  data.article.isLiked = !data.article.isLiked
  data.article.likeCount += data.article.isLiked ? 1 : -1
  uni.showToast({
    title: data.article.isLiked ? '点赞成功' : '已取消点赞',
    icon: data.article.isLiked ? 'success' : 'none'
  })
}

// 处理文章收藏
const handleCollect = () => {
  data.article.isCollected = !data.article.isCollected
  data.article.collectCount += data.article.isCollected ? 1 : -1
  uni.showToast({
    title: data.article.isCollected ? '收藏成功' : '已取消收藏',
    icon: data.article.isCollected ? 'success' : 'none'
  })
}

// 处理评论
const handleComment = () => {
  // 聚焦到评论输入框
  const inputEl = document.querySelector('.comment-input')
  if (inputEl) {
    inputEl.focus()
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack({
    delta: 1
  });
}

// 处理评论点赞
const handleCommentLike = (index) => {
  const comment = data.comments[index]
  comment.isLiked = !comment.isLiked
  comment.likeCount += comment.isLiked ? 1 : -1
  
  uni.showToast({
    title: comment.isLiked ? '点赞成功' : '已取消点赞',
    icon: 'none',
    duration: 1000
  })
}

// 回复评论
const replyToComment = (index) => {
  const comment = data.comments[index]
  data.replyTarget = comment.author
  data.replyToCommentIndex = index
  data.replyToReplyIndex = -1
  
  // 聚焦到输入框
  const inputEl = document.querySelector('.comment-input')
  if (inputEl) {
    inputEl.focus()
  }
}

// 回复回复
const replyToReply = (commentIndex, replyIndex) => {
  const comment = data.comments[commentIndex]
  const reply = comment.replies[replyIndex]
  data.replyTarget = reply.author
  data.replyToCommentIndex = commentIndex
  data.replyToReplyIndex = replyIndex
  
  // 聚焦到输入框
  const inputEl = document.querySelector('.comment-input')
  if (inputEl) {
    inputEl.focus()
  }
}

// 提交评论
const submitComment = () => {
  if (!data.commentContent.trim()) return
  
  // 根据是否是回复决定操作
  if (data.replyToCommentIndex >= 0) {
    // 添加回复
    const now = new Date()
    const timeStr = `${now.getHours()}:${now.getMinutes()}`
    
    const newReply = {
      id: Math.floor(Math.random() * 1000) + 100,
      author: '当前用户', // 这里应该是登录用户的信息
      content: data.commentContent,
      time: '刚刚',
      replyTo: data.replyTarget
    }
    
    data.comments[data.replyToCommentIndex].replies.push(newReply)
    
    // 更新文章评论计数
    data.article.commentCount++
    
    uni.showToast({
      title: '回复成功',
      icon: 'success'
    })
  } else {
    // 添加新评论
    const newComment = {
      id: Math.floor(Math.random() * 1000) + 100,
      author: '当前用户', // 这里应该是登录用户的信息
      avatar: '/static/images/avatar.png',
      content: data.commentContent,
      time: '刚刚',
      likeCount: 0,
      isLiked: false,
      replies: []
    }
    
    data.comments.unshift(newComment)
    
    // 更新文章评论计数
    data.article.commentCount++
    
    uni.showToast({
      title: '评论成功',
      icon: 'success'
    })
  }
  
  // 清空输入框和状态
  data.commentContent = ''
  data.replyTarget = ''
  data.replyToCommentIndex = -1
  data.replyToReplyIndex = -1
}

// 显示所有回复
const showAllReplies = (index) => {
  data.comments[index].showAllReplies = true
}

// 处理输入框获得焦点
const handleInputFocus = (e) => {
  // 处理键盘弹出
  data.inputBottom = e.detail.height || 0
}

// 处理输入框失去焦点
const handleInputBlur = () => {
  data.inputBottom = 0
}

// 处理下拉刷新事件
const onRefresh = () => {
  data.refreshing = true
  
  // 模拟加载数据
  setTimeout(() => {
    // 这里可以加入重新获取文章详情和评论的逻辑
    refreshArticleData()
  }, 1500)
}

// 刷新文章数据
const refreshArticleData = () => {
  // 在实际应用中，这里应该调用API重新获取文章信息和评论
  // 模拟刷新成功
  console.log('刷新文章数据')
  
  // 刷新完成后显示成功提示
  data.refreshing = false
  data.showRefreshSuccess = true
  
  // 2秒后隐藏成功提示
  setTimeout(() => {
    data.showRefreshSuccess = false
  }, 2000)
}

// 刷新恢复事件
const onRestore = () => {
  console.log('刷新控件恢复默认状态')
}

// 加载更多评论
const loadMoreComments = () => {
  // 如果没有更多评论或正在加载中，则不执行
  if (!data.hasMoreComments || data.isLoadingMore) return
  
  data.isLoadingMore = true
  console.log('加载更多评论，页码：', data.currentPage + 1)
  
  // 模拟获取更多评论
  setTimeout(() => {
    // 在实际项目中，这里应该调用API获取下一页评论
    // fetchMoreComments(data.currentPage + 1, data.pageSize)
    
    // 模拟新评论数据
    const newComments = getMockComments(data.currentPage + 1)
    
    if (newComments.length > 0) {
      // 添加新评论到列表
      data.comments = [...data.comments, ...newComments]
      data.currentPage += 1
      
      // 模拟是否还有更多评论（示例：只加载3页）
      data.hasMoreComments = data.currentPage < 3
    } else {
      data.hasMoreComments = false
    }
    
    data.isLoadingMore = false
  }, 1000)
}

// 模拟获取评论数据（实际开发中应替换为API调用）
const getMockComments = (page) => {
  // 第一页已经在初始数据中，这里模拟后续页面
  if (page <= 1) return []
  
  const mockComments = []
  
  // 每页生成3条模拟评论
  for (let i = 0; i < 3; i++) {
    const commentId = 100 + (page - 1) * 3 + i
    mockComments.push({
      id: commentId,
      author: `用户${commentId}`,
      avatar: '/static/images/avatar.png',
      content: `这是第${page}页的第${i+1}条评论，用于测试加载更多功能`,
      time: '刚刚',
      likeCount: Math.floor(Math.random() * 20),
      isLiked: false,
      replies: page === 2 ? [
        {
          id: commentId * 10 + 1,
          author: `回复用户${commentId*10+1}`,
          content: '感谢分享！',
          time: '刚刚'
        }
      ] : []
    })
  }
  
  return mockComments
}
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  background-color: #fff;
  position: relative;
  min-height: 100vh;
}

.article-detail {
  height: calc(100vh - 120rpx); // 调整高度以适应评论输入框
  padding-bottom: 100rpx;
}

.back-button {
  position: fixed;
  top: 40rpx;
  left: 30rpx;
  z-index: 10;
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.article-header {
  padding: 30rpx;
  // #ifdef H5
  padding-top: 100rpx;
  // #endif
  // #ifndef H5
  padding-top: 30rpx;
  // #endif
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
  bottom: 100rpx; // 调整位置以适应评论输入框
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
  margin-top: 30rpx;
  padding: 20rpx 0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  display: block;
}

.comment-list {
  margin-bottom: 30rpx;
}

.comment-card {
  background-color: #f9f9f9;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.comment-item {
  display: flex;
  margin-bottom: 16rpx;
}

.comment-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.comment-author {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.comment-actions {
  display: flex;
}

.like-action {
  display: flex;
  align-items: center;
}

.like-action text {
  font-size: 24rpx;
  color: #999;
  margin-left: 4rpx;
}

.like-action .liked {
  color: #ff6b6b;
}

.comment-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 10rpx;
}

.comment-time {
  font-size: 24rpx;
  color: #999;
}

.reply-btn {
  font-size: 24rpx;
  color: #666;
}

.reply-list {
  margin-left: 100rpx;
  background-color: #f0f0f0;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 10rpx;
}

.reply-item {
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.reply-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.reply-content {
  display: flex;
  flex-wrap: wrap;
  font-size: 26rpx;
  line-height: 1.5;
}

.reply-author {
  color: #6495ED;
  font-weight: bold;
}

.reply-to {
  color: #666;
  margin: 0 4rpx;
}

.reply-to-author {
  color: #6495ED;
}

.reply-text {
  color: #333;
  word-break: break-all;
}

.reply-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
}

.reply-time {
  font-size: 22rpx;
  color: #999;
}

.more-replies {
  text-align: center;
  margin-top: 10rpx;
  padding-top: 10rpx;
}

.more-replies text {
  font-size: 24rpx;
  color: #6495ED;
}

.no-comment {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
  color: #999;
}

.no-comment text {
  margin-top: 20rpx;
  font-size: 28rpx;
}

// 评论输入框
.comment-input-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
  z-index: 100;
  
  .comment-input {
    flex: 1;
    height: 70rpx;
    background-color: #f5f5f5;
    border-radius: 35rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
  }
  
  .send-btn {
    margin-left: 20rpx;
    background-color: #4361ee;
    color: #fff;
    height: 70rpx;
    font-size: 28rpx;
    padding: 0 30rpx;
    border-radius: 35rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &[disabled] {
      background-color: #cccccc;
      color: #ffffff;
    }
  }
}

// 刷新成功提示
.refresh-success {
  position: fixed;
  top: 100rpx;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 26rpx;
  padding: 12rpx 30rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  
  text {
    margin-left: 10rpx;
  }
}

// 加载更多区域样式
.load-more {
  text-align: center;
  padding: 30rpx 0;
  margin-bottom: 100rpx;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  
  text {
    margin-left: 10rpx;
    font-size: 26rpx;
    color: #999;
  }
}

.load-more-text {
  padding: 20rpx;
  font-size: 26rpx;
  color: #666;
}

.no-more {
  font-size: 26rpx;
  color: #999;
}
</style>