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
      
      <!-- 加载中提示 -->
      <view class="loading-container" v-if="data.loading">
        <uni-icons type="spinner-cycle" size="40" color="#999"></uni-icons>
        <text>加载中...</text>
      </view>
      
      <!-- 文章内容区域 -->
      <block v-else-if="data.article.id">
        <!-- 文章标题区域 -->
        <view class="article-header">
          <text class="article-title">{{ data.article.title }}</text>
          <view class="meta-info">
            <text class="author">{{ data.article.author.nickname }}</text>
            <text class="publish-time">{{ formatDate(data.article.createTime) }}</text>
          </view>
        </view>

        <!-- 正文内容区域 -->
        <view class="content-section">
          <text class="article-content">{{ data.article.content }}</text>
          <view class="image-container" v-if="data.article.coverImage">
            <image 
              :src="data.article.coverImage"
              mode="aspectFill"
              class="content-image"
            />
          </view>
        </view>

        <!-- 标签区域 -->
        <view class="tag-section" v-if="data.article.tags && data.article.tags.length">
          <text class="section-title">文章标签</text>
          <view class="tag-list">
            <view 
              v-for="(tag, index) in data.article.tags"
              :key="index"
              class="tag-item"
            >
              {{ tag.name }}
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
            <view v-for="(comment, index) in data.comments" :key="comment.id" class="comment-card">
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
                    <text class="comment-time">{{ formatDate(comment.createTime) }}</text>
                    <text class="reply-btn" @click="replyToComment(index)">回复</text>
                  </view>
                </view>
              </view>
              
              <!-- 评论回复区域 -->
              <view class="reply-list" v-if="comment.replies && comment.replies.length > 0">
                <view v-for="(reply, replyIndex) in comment.replies" :key="reply.id" class="reply-item">
                  <view class="reply-content">
                    <text class="reply-author">{{ reply.author }}</text>
                    <text v-if="reply.replyUser" class="reply-to">回复</text>
                    <text v-if="reply.replyUser" class="reply-to-author">@{{ reply.replyUser }}</text>
                    <text class="reply-text">：{{ reply.content }}</text>
                  </view>
                  <view class="reply-footer">
                    <text class="reply-time">{{ formatDate(reply.createTime) }}</text>
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
      </block>
      
      <!-- 加载失败提示 -->
      <view class="error-container" v-else-if="data.error">
        <uni-icons type="closeempty" size="40" color="#dd6161"></uni-icons>
        <text>{{ data.error }}</text>
        <button class="retry-btn" @click="fetchArticleDetail">重新加载</button>
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
import { reactive, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getArticleDetail, likeArticle, collectArticle, getArticleComments, commentArticle, likeComment } from '@/api/article';

const data = reactive({
  loading: true,  // 是否正在加载文章
  error: null,    // 加载错误信息
  articleId: 0,   // 文章ID
  article: {
    id: 0,
    title: '',
    content: '',
    author: {
      nickname: '',
      avatar: ''
    },
    createTime: '',
    tags: [],
    coverImage: '',
    likeCount: 0,
    collectCount: 0,
    commentCount: 0,
    isLiked: false,
    isCollected: false
  },
  comments: [],
  commentContent: '', // 评论输入内容
  replyTarget: '', // 回复的目标用户
  replyToCommentIndex: -1, // 回复的评论索引
  replyToReplyIndex: -1, // 回复的回复索引
  replyUserId: null, // 回复的用户ID
  parentId: null, // 父评论ID
  inputBottom: 0, // 键盘高度调整
  refreshing: false, // 是否正在刷新中
  showRefreshSuccess: false, // 是否显示刷新成功提示
  
  // 评论加载相关状态
  currentPage: 1, // 当前评论页码
  pageSize: 10, // 每页评论数量
  hasMoreComments: true, // 是否还有更多评论
  isLoadingMore: false // 是否正在加载更多评论
});

// 日期格式化函数
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date; // 时间差（毫秒）
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }
  
  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  }
  
  // 小于30天
  if (diff < 30 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  }
  
  // 大于30天，显示具体日期
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  
  // 如果是今年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}月${day}日 ${hour}:${minute}`;
  }
  
  return `${year}年${month}月${day}日 ${hour}:${minute}`;
};

// 加载文章详情
const fetchArticleDetail = async () => {
  data.loading = true;
  data.error = null;
  
  try {
    const response = await getArticleDetail(data.articleId);
    
    if (response.code === 200 && response.data) {
      // 更新文章信息
      data.article = response.data;
      
      // 加载评论
      fetchComments();
    } else {
      data.error = response.message || '获取文章详情失败';
    }
  } catch (error) {
    console.error('获取文章详情出错:', error);
    data.error = '网络错误，请稍后重试';
  } finally {
    data.loading = false;
  }
};

// 加载评论列表
const fetchComments = async () => {
  try {
    data.isLoadingMore = true;
    
    const response = await getArticleComments(data.articleId, {
      page: data.currentPage,
      pageSize: data.pageSize
    });
    
    if (response.code === 200 && response.data) {
      const { records, total, current, size } = response.data;
      
      // 将数据转换为组件需要的格式
      const formattedComments = records.map(comment => {
        // 主评论
        const formattedComment = {
          id: comment.id,
          author: comment.user.nickname,
          avatar: comment.user.avatar || '/static/images/avatar.png',
          content: comment.content,
          createTime: comment.createTime,
          likeCount: comment.likeCount || 0,
          isLiked: comment.isLiked || false,
          userId: comment.userId,
          showAllReplies: false,
          replies: []
        };
        
        // 回复
        if (comment.replies && comment.replies.length > 0) {
          formattedComment.replies = comment.replies.map(reply => ({
            id: reply.id,
            author: reply.user.nickname,
            content: reply.content,
            createTime: reply.createTime,
            userId: reply.userId,
            replyUser: reply.replyUser ? reply.replyUser.nickname : null,
            replyUserId: reply.replyUserId
          }));
        }
        
        return formattedComment;
      });
      
      // 第一页直接替换，其他页追加
      if (data.currentPage === 1) {
        data.comments = formattedComments;
      } else {
        data.comments = [...data.comments, ...formattedComments];
      }
      
      // 判断是否还有更多评论
      const totalPages = Math.ceil(total / size);
      data.hasMoreComments = current < totalPages;
    } else {
      uni.showToast({
        title: response.message || '获取评论失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取评论出错:', error);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
  } finally {
    data.isLoadingMore = false;
  }
};

onLoad((options) => {
  if (options?.id) {
    data.articleId = options.id;
    fetchArticleDetail();
  } else {
    data.error = '未找到文章ID';
    data.loading = false;
  }
  
  // 显示评论区
  if (options?.showComments) {
    // 可以滚动到评论区
    setTimeout(() => {
      const query = uni.createSelectorQuery();
      query.select('.comment-section').boundingClientRect();
      query.selectViewport().scrollOffset();
      query.exec(res => {
        if (res && res[0]) {
          uni.pageScrollTo({
            scrollTop: res[0].top,
            duration: 300
          });
        }
      });
    }, 500);
  }
});

// 处理文章点赞
const handleLike = async () => {
  // 检查用户是否登录
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
    return;
  }
  
  try {
    // 更新界面
    const newIsLiked = !data.article.isLiked;
    data.article.isLiked = newIsLiked;
    data.article.likeCount += newIsLiked ? 1 : -1;
    
    // 发送请求
    const response = await likeArticle(data.articleId, newIsLiked);
    
    if (response.code !== 200) {
      // 请求失败，恢复状态
      data.article.isLiked = !newIsLiked;
      data.article.likeCount += newIsLiked ? -1 : 1;
      
      uni.showToast({
        title: response.message || (newIsLiked ? '点赞失败' : '取消点赞失败'),
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('点赞操作出错:', error);
    // 发生错误，恢复状态
    const newIsLiked = !data.article.isLiked;
    data.article.isLiked = newIsLiked;
    data.article.likeCount += newIsLiked ? 1 : -1;
    
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
  }
};

// 处理文章收藏
const handleCollect = async () => {
  // 检查用户是否登录
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
    return;
  }
  
  try {
    // 更新界面
    const newIsCollected = !data.article.isCollected;
    data.article.isCollected = newIsCollected;
    data.article.collectCount += newIsCollected ? 1 : -1;
    
    // 发送请求
    const response = await collectArticle(data.articleId, newIsCollected);
    
    if (response.code !== 200) {
      // 请求失败，恢复状态
      data.article.isCollected = !newIsCollected;
      data.article.collectCount += newIsCollected ? -1 : 1;
      
      uni.showToast({
        title: response.message || (newIsCollected ? '收藏失败' : '取消收藏失败'),
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('收藏操作出错:', error);
    // 发生错误，恢复状态
    const newIsCollected = !data.article.isCollected;
    data.article.isCollected = newIsCollected;
    data.article.collectCount += newIsCollected ? 1 : -1;
    
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
  }
};

// 处理评论
const handleComment = () => {
  // 检查用户是否登录
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
    return;
  }
  
  // 聚焦到评论输入框
  const inputEl = document.querySelector('.comment-input');
  if (inputEl) {
    inputEl.focus();
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack({
    delta: 1
  });
};

// 处理评论点赞
const handleCommentLike = async (index) => {
  // 检查用户是否登录
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
    return;
  }
  
  const comment = data.comments[index];
  if (!comment) return;
  
  try {
    // 更新界面
    const newIsLiked = !comment.isLiked;
    comment.isLiked = newIsLiked;
    comment.likeCount += newIsLiked ? 1 : -1;
    
    // 发送请求
    const response = await likeComment(comment.id, newIsLiked);
    
    if (response.code !== 200) {
      // 请求失败，恢复状态
      comment.isLiked = !newIsLiked;
      comment.likeCount += newIsLiked ? -1 : 1;
      
      uni.showToast({
        title: response.message || (newIsLiked ? '点赞失败' : '取消点赞失败'),
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('评论点赞操作出错:', error);
    // 发生错误，恢复状态
    const newIsLiked = !comment.isLiked;
    comment.isLiked = newIsLiked;
    comment.likeCount += newIsLiked ? 1 : -1;
    
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
  }
};

// 回复评论
const replyToComment = (index) => {
  // 检查用户是否登录
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
    return;
  }
  
  const comment = data.comments[index];
  if (!comment) return;
  
  data.replyTarget = comment.author;
  data.replyToCommentIndex = index;
  data.replyToReplyIndex = -1;
  data.parentId = comment.id;
  data.replyUserId = comment.userId;
  
  // 聚焦到输入框
  const inputEl = document.querySelector('.comment-input');
  if (inputEl) {
    inputEl.focus();
  }
};

// 回复回复
const replyToReply = (commentIndex, replyIndex) => {
  // 检查用户是否登录
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
    return;
  }
  
  const comment = data.comments[commentIndex];
  if (!comment || !comment.replies || !comment.replies[replyIndex]) return;
  
  const reply = comment.replies[replyIndex];
  data.replyTarget = reply.author;
  data.replyToCommentIndex = commentIndex;
  data.replyToReplyIndex = replyIndex;
  data.parentId = comment.id;
  data.replyUserId = reply.userId;
  
  // 聚焦到输入框
  const inputEl = document.querySelector('.comment-input');
  if (inputEl) {
    inputEl.focus();
  }
};

// 提交评论
const submitComment = async () => {
  // 检查用户是否登录
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
    return;
  }
  
  if (!data.commentContent.trim()) return;
  
  try {
    const commentData = {
      content: data.commentContent,
      parentId: data.parentId,
      replyUserId: data.replyUserId
    };
    
    const response = await commentArticle(data.articleId, commentData);
    
    if (response.code === 200) {
      uni.showToast({
        title: '评论成功',
        icon: 'success'
      });
      
      // 清空输入框和状态
      data.commentContent = '';
      data.replyTarget = '';
      data.replyToCommentIndex = -1;
      data.replyToReplyIndex = -1;
      data.parentId = null;
      data.replyUserId = null;
      
      // 刷新评论列表
      data.currentPage = 1;
      fetchComments();
      
      // 更新文章评论计数
      data.article.commentCount++;
    } else {
      uni.showToast({
        title: response.message || '评论失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('提交评论出错:', error);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
  }
};

// 显示所有回复
const showAllReplies = (index) => {
  if (data.comments[index]) {
    data.comments[index].showAllReplies = true;
  }
};

// 处理输入框获得焦点
const handleInputFocus = (e) => {
  // 处理键盘弹出
  data.inputBottom = e.detail.height || 0;
};

// 处理输入框失去焦点
const handleInputBlur = () => {
  data.inputBottom = 0;
};

// 处理下拉刷新事件
const onRefresh = () => {
  data.refreshing = true;
  fetchArticleDetail();
};

// 刷新文章数据
const refreshArticleData = async () => {
  try {
    await fetchArticleDetail();
    
    // 刷新完成后显示成功提示
    data.refreshing = false;
    data.showRefreshSuccess = true;
    
    // 2秒后隐藏成功提示
    setTimeout(() => {
      data.showRefreshSuccess = false;
    }, 2000);
  } catch (error) {
    console.error('刷新文章数据出错:', error);
    data.refreshing = false;
  }
};

// 刷新恢复事件
const onRestore = () => {
  console.log('刷新控件恢复默认状态');
};

// 加载更多评论
const loadMoreComments = () => {
  // 如果没有更多评论或正在加载中，则不执行
  if (!data.hasMoreComments || data.isLoadingMore) return;
  
  // 加载下一页
  data.currentPage++;
  fetchComments();
};
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
    word-wrap: break-word;
    overflow-wrap: break-word;
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
    // 添加文本换行属性，解决溢出问题
    white-space: normal;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    text-align: justify;
    width: 100%;
    box-sizing: border-box;
  }
  
  .image-container {
    margin-top: 40rpx;
    width: 100%;
    
    .content-image {
      width: 100%;
      height: 400rpx;
      border-radius: 16rpx;
      margin-bottom: 20rpx;
      object-fit: cover; // 确保图片比例适当
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
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
      width: 0; // 确保弹性布局中的元素不会超出容器
      overflow: hidden;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  word-wrap: break-word;
  white-space: normal;
  overflow-wrap: break-word;
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

// 加载和错误状态样式
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  height: 300px;
  
  text {
    margin-top: 20px;
    font-size: 28rpx;
    color: #999;
  }
}

.error-container text {
  color: #dd6161;
}

.retry-btn {
  margin-top: 30rpx;
  background-color: #4361ee;
  color: #fff;
  font-size: 28rpx;
  padding: 12rpx 40rpx;
  border-radius: 40rpx;
}
</style>