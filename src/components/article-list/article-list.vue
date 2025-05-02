<template>
	<view class="article-list-container">
		<scroll-view 
			scroll-y 
			class="article-scroll" 
			@scrolltolower="handleLoadMore" 
			refresher-enabled
			:refresher-triggered="isRefreshing" 
			@refresherrefresh="handleRefresh"
			:refresher-threshold="100"
			refresher-background="#f5f5f5"
		>
			<!-- 文章列表循环 -->
			<view v-for="(article, index) in articleList" :key="article.id" class="article-card">
				<!-- 用户信息 -->
				<view class="user-info">
					<image class="avatar" :src="article.author?.avatar || '/static/images/avatar.png'"
						mode="aspectFill" @click="handleAuthorClick(article.author?.id)"></image>
					<text class="nickname" @click="handleAuthorClick(article.author?.id)">{{article.author?.nickname}}</text>
					<!-- 只有非当前用户时才显示关注按钮 -->
					<button 
						v-if="!isCurrentUser(article.author?.id)" 
						class="follow-btn" 
						:class="{'followed': article.author?.isFollowed}"
						@click.stop="handleFollow(index)"
					>
						{{ article.author?.isFollowed ? '已关注' : '+ 关注' }}
					</button>
				</view>

				<!-- 文章内容 -->
				<view class="article-content" @click="handleArticleClick(article.id)">
					<text class="article-title">{{article.title}}</text>
					<text class="article-summary">{{article.summary}}...全文</text>

					<!-- 文章标签 -->
					<view class="article-tags" v-if="article.tags && article.tags.length > 0">
						<view v-for="(tag, tagIndex) in article.tags" :key="tagIndex" 
							class="tag-item" @click.stop="handleTagClick(tag)">
							#{{tag}}
						</view>
					</view>

					<!-- 单图布局 -->
					<view class="article-image" v-if="article.coverImage">
						<image :src="article.coverImage" mode="aspectFill" class="single-image"></image>
					</view>

					<!-- 多图布局 -->
					<view class="image-grid" v-else-if="article.images && article.images.length > 0">
						<image v-for="(img, imgIndex) in article.images.slice(0, 3)" :key="imgIndex" :src="img"
							mode="aspectFill" class="grid-image"></image>
					</view>
				</view>

				<!-- 文章操作按钮 -->
				<view class="article-actions">
					<view class="action-item" @click.stop="handleShare(index)">
						<uni-icons type="redo-filled" size="20" color="#666"></uni-icons>
						<text>分享</text>
					</view>
					<view class="action-item" @click.stop="handleComment(index)">
						<uni-icons type="chatbubble" size="20" color="#666"></uni-icons>
						<text>{{article.commentCount || 0}}</text>
					</view>
					<view class="action-item" @click.stop="handleCollect(index)">
						<uni-icons :type="article.isCollected ? 'star-filled' : 'star'" size="20"
							:color="article.isCollected ? '#ffc107' : '#666'"></uni-icons>
						<text :class="{'collected': article.isCollected}">{{article.collectCount || 0}}</text>
					</view>
					<view class="action-item" @click.stop="handleLike(index)">
						<uni-icons :type="article.isLiked ? 'heart-filled' : 'heart'" size="20"
							:color="article.isLiked ? '#ff6b6b' : '#666'"></uni-icons>
						<text :class="{'liked': article.isLiked}">{{article.likeCount || 0}}</text>
					</view>
					
					<!-- 编辑和删除按钮（根据是否显示管理选项来决定是否展示） -->
					<template v-if="showManageOptions && isCurrentUser(article.author?.id)">
						<view class="action-item" @click.stop="handleEdit(index)">
							<uni-icons type="compose" size="20" color="#666"></uni-icons>
							<text>编辑</text>
						</view>
						<view class="action-item" @click.stop="handleDelete(index)">
							<uni-icons type="trash" size="20" color="#666"></uni-icons>
							<text>删除</text>
						</view>
					</template>
				</view>
			</view>

			<!-- 加载状态 -->
			<view class="loading-state">
				<text v-if="isLoading && !isRefreshing">加载中...</text>
				<text v-else-if="noMoreData && articleList.length > 0">没有更多文章了</text>
				<text v-else-if="articleList.length > 0">↓向下滑动加载更多文章↓</text>
				
				<!-- 无内容提示 -->
				<view v-if="articleList.length === 0 && !isLoading" class="no-content">
					<uni-icons type="info" size="50" color="#ddd"></uni-icons>
					<text>{{ emptyText }}</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import { ref, reactive, computed, watch, onMounted } from 'vue';
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
	
	// 定义组件属性
	const props = defineProps({
		// 列表类型: recommend(推荐)、follow(关注)、hot(热门)、new(最新)、tag(标签)、collection(收藏)
		listType: {
			type: String,
			default: 'recommend'
		},
		// 标签名称，当listType为tag时使用
		tagName: {
			type: String,
			default: ''
		},
		// 用户ID，当获取指定用户的文章时使用
		userId: {
			type: [Number, String],
			default: null
		},
		// 是否显示管理选项（编辑、删除）
		showManageOptions: {
			type: Boolean,
			default: false
		},
		// 空列表提示文本
		emptyText: {
			type: String,
			default: '暂无内容'
		},
		// 是否自动加载（组件挂载后是否自动请求数据）
		autoLoad: {
			type: Boolean,
			default: true
		},
		// 列表高度
		height: {
			type: String,
			default: 'calc(100vh - 165rpx)'
		}
	});
	
	// 定义事件
	const emit = defineEmits([
		'refresh', 
		'loadMore', 
		'articleClick', 
		'authorClick', 
		'tagClick',
		'share',
		'comment',
		'collect',
		'like',
		'edit',
		'delete',
		'follow'
	]);
	
	// 响应式数据
	const articleList = ref([]);
	const isLoading = ref(false);
	const isRefreshing = ref(false);
	const noMoreData = ref(false);
	const currentPage = ref(1);
	const pageSize = ref(10);
	
	// 获取当前登录用户信息
	const getCurrentUserId = () => {
		const userInfo = uni.getStorageSync('userInfo');
		return userInfo ? userInfo.id : null;
	};
	
	// 判断是否为当前用户的文章
	const isCurrentUser = (authorId) => {
		const currentUserId = getCurrentUserId();
		return currentUserId && currentUserId === authorId;
	};
	
	// 监听listType、tagName、userId的变化，重置并重新加载数据
	watch([() => props.listType, () => props.tagName, () => props.userId], () => {
		resetList();
		if (props.autoLoad) {
			loadArticles();
		}
	});
	
	// 组件初始化时加载数据
	onMounted(() => {
		if (props.autoLoad) {
			loadArticles();
		}
	});
	
	// 重置列表数据
	const resetList = () => {
		articleList.value = [];
		currentPage.value = 1;
		noMoreData.value = false;
		isLoading.value = false;
		// 不重置刷新状态，由刷新逻辑自行控制
	};
	
	// 加载文章列表
	const loadArticles = async () => {
		// 如果已经没有更多数据或正在加载中，则不处理
		if (noMoreData.value || isLoading.value) return;
		
		isLoading.value = true;
		
		try {
			// 构建请求参数
			const params = {
				page: currentPage.value,
				pageSize: pageSize.value
			};
			
			// 根据不同的列表类型设置参数
			if (props.listType === 'tag' && props.tagName) {
				params.tag = props.tagName;
			}
			
			// 获取文章列表的API路径
			let apiPath = '/api/article';
			
			// 如果是获取指定用户的文章
			if (props.userId) {
				apiPath = `/api/user/${props.userId}/articles`;
				params.type = props.listType === 'like' ? 'likes' : 'posts';
			} else if (props.listType === 'collection') {
				// 获取收藏的文章
				apiPath = '/api/article/collections';
			}
			
			// 发起请求
			const response = await request(apiPath, params);
			
			if (response.code === 200 && response.data) {
				// 处理文章列表数据
				const newArticles = processArticleData(response.data.list || []);
				
				// 添加到文章列表
				if (currentPage.value === 1) {
					articleList.value = newArticles;
				} else {
					articleList.value = [...articleList.value, ...newArticles];
				}
				
				// 更新页码
				currentPage.value++;
				
				// 检查是否还有更多数据
				if (!response.data.list || response.data.list.length < pageSize.value) {
					noMoreData.value = true;
				}
			} else {
				// 请求失败
				uni.showToast({
					title: response.message || '获取文章列表失败',
					icon: 'none'
				});
			}
		} catch (error) {
			console.error('获取文章列表失败:', error);
			uni.showToast({
				title: '网络异常，请稍后再试',
				icon: 'none'
			});
		} finally {
			isLoading.value = false;
			
			// 延迟关闭刷新状态，给用户更好的视觉反馈
			if (isRefreshing.value) {
				setTimeout(() => {
					isRefreshing.value = false;
				}, 800);
			}
		}
	};
	
	// 处理文章数据
	const processArticleData = (articles) => {
		return articles.map(article => {
			// 处理文章图片
			if (!article.coverImage && article.images && article.images.length > 0) {
				article.coverImage = article.images[0];
			}
			
			// 处理作者信息，确保有默认值
			if (!article.author) {
				article.author = {
					id: article.userId,
					nickname: article.nickname || '未知用户',
					avatar: article.avatar || '/static/images/avatar.png',
					isFollowed: false
				};
			}
			
			return article;
		});
	};
	
	// 网络请求封装
	const request = async (url, params = {}) => {
		// 实际项目中替换为API调用
		// 这里使用模拟数据
		return new Promise((resolve) => {
			setTimeout(() => {
				// 模拟API请求延迟
				const mockArticles = [{
					id: 1,
					title: '前端学习路线图 - Vue3新特性解析',
					collectCount: 45,
					isCollected: false,
					summary: 'Vue3带来了Composition API、Teleport、Fragments等新特性，本文详细介绍这些新特性的使用方法和优势',
					coverImage: '/static/images/default.png',
					likeCount: 156,
					commentCount: 38,
					isLiked: false,
					tags: ['前端', 'Vue3', '教程'],
					author: {
						id: 10001,
						nickname: '前端达人',
						avatar: '/static/images/avatar.png',
						isFollowed: false
					},
					createTime: '2024-04-20 10:00:00'
				},
				{
					id: 2,
					title: 'uniapp跨平台开发实战经验分享',
					collectCount: 32,
					isCollected: true,
					summary: '使用uniapp开发跨平台应用的实战经验，包括性能优化、组件复用、条件编译等多个方面的技巧',
					images: [
						'/static/images/default.png',
						'/static/images/default.png',
						'/static/images/default.png'
					],
					likeCount: 98,
					commentCount: 25,
					isLiked: false,
					tags: ['uniapp', '跨平台', '移动开发'],
					author: {
						id: 10002,
						nickname: '移动开发专家',
						avatar: '/static/images/avatar.png',
						isFollowed: true
					},
					createTime: '2024-04-18 15:30:00'
				}];
				
				resolve({
					code: 200,
					message: "success",
					data: {
						total: 100,
						list: mockArticles
					}
				});
			}, 800);
		});
	};
	
	// 处理下拉刷新
	const handleRefresh = () => {
		if (isRefreshing.value) return; // 避免重复触发
		
		isRefreshing.value = true;
		resetList();
		
		// 延迟执行，防止过快关闭刷新状态
		setTimeout(() => {
			loadArticles();
			emit('refresh');
		}, 300);
	};
	
	// 处理加载更多
	const handleLoadMore = () => {
		loadArticles();
		emit('loadMore');
	};
	
	// 处理文章点击
	const handleArticleClick = (articleId) => {
		emit('articleClick', articleId);
	};
	
	// 处理作者点击
	const handleAuthorClick = (authorId) => {
		emit('authorClick', authorId);
	};
	
	// 处理标签点击
	const handleTagClick = (tag) => {
		emit('tagClick', tag);
	};
	
	// 处理分享
	const handleShare = (index) => {
		emit('share', articleList.value[index]);
	};
	
	// 处理评论
	const handleComment = (index) => {
		emit('comment', articleList.value[index]);
	};
	
	// 处理收藏
	const handleCollect = (index) => {
		const article = articleList.value[index];
		// 切换收藏状态
		article.isCollected = !article.isCollected;
		article.collectCount += article.isCollected ? 1 : -1;
		
		emit('collect', article);
	};
	
	// 处理点赞
	const handleLike = (index) => {
		const article = articleList.value[index];
		// 切换点赞状态
		article.isLiked = !article.isLiked;
		article.likeCount += article.isLiked ? 1 : -1;
		
		emit('like', article);
	};
	
	// 处理编辑
	const handleEdit = (index) => {
		emit('edit', articleList.value[index]);
	};
	
	// 处理删除
	const handleDelete = (index) => {
		emit('delete', articleList.value[index]);
	};
	
	// 处理关注
	const handleFollow = (index) => {
		const article = articleList.value[index];
		const author = article.author;
		// 切换关注状态
		author.isFollowed = !author.isFollowed;
		
		emit('follow', author);
	};
	
	// 对外暴露的方法
	defineExpose({
		loadArticles,
		resetList,
		refresh: handleRefresh
	});
</script>

<style lang="scss">
	.article-list-container {
		width: 100%;
		
		.article-scroll {
			height: v-bind(height);
		}
		
		// 文章卡片
		.article-card {
			background-color: #fff;
			border-radius: 20rpx;
			padding: 30rpx;
			margin-top: 5rpx;
			margin-bottom: 20rpx;
			box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

			// 用户信息
			.user-info {
				display: flex;
				align-items: center;
				margin-bottom: 20rpx;

				.avatar {
					width: 80rpx;
					height: 80rpx;
					border-radius: 50%;
					margin-right: 20rpx;
					background-color: #eee;
				}

				.nickname {
					flex: 1;
					font-size: 28rpx;
					color: #333;
					font-weight: 500;
				}

				.follow-btn {
					height: 50rpx;
					line-height: 50rpx;
					background-color: #fff;
					color: #4361ee;
					font-size: 24rpx;
					border: 2rpx solid #4361ee;
					border-radius: 25rpx;
					padding: 0 20rpx;
					margin: 0;

					&.followed {
						color: #999;
						border-color: #999;
					}
				}
			}

			// 文章内容
			.article-content {
				margin-bottom: 20rpx;

				.article-title {
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 10rpx;
					display: block;
				}

				.article-summary {
					font-size: 28rpx;
					color: #666;
					margin-bottom: 20rpx;
					line-height: 1.5;
					display: block;
				}
				
				// 文章标签
				.article-tags {
					display: flex;
					flex-wrap: wrap;
					margin-bottom: 20rpx;
					
					.tag-item {
						font-size: 24rpx;
						color: #4361ee;
						background-color: #f0f4ff;
						padding: 8rpx 20rpx;
						border-radius: 30rpx;
						margin-right: 16rpx;
						margin-bottom: 16rpx;
					}
				}

				// 单图布局
				.article-image {
					width: 100%;
					height: 300rpx;
					border-radius: 10rpx;
					overflow: hidden;
					margin-bottom: 20rpx;

					.single-image {
						width: 100%;
						height: 100%;
						background-color: #eee;
					}
				}

				// 多图布局
				.image-grid {
					display: flex;
					justify-content: space-between;
					margin-bottom: 20rpx;

					.grid-image {
						width: 32%;
						height: 200rpx;
						border-radius: 10rpx;
						background-color: #eee;
					}
				}
			}

			// 文章操作按钮
			.article-actions {
				display: flex;
				justify-content: space-around;
				border-top: 2rpx solid #f0f0f0;
				padding-top: 20rpx;
				flex-wrap: wrap;

				.action-item {
					display: flex;
					align-items: center;
					margin-bottom: 10rpx;

					.uni-icons {
						margin-right: 10rpx;
					}

					text {
						font-size: 24rpx;
						color: #666;

						&.liked {
							color: #ff6b6b;
						}
						
						&.collected {
							color: #ffc107;
						}
					}
				}
			}
		}

		// 加载状态
		.loading-state {
			text-align: center;
			font-size: 24rpx;
			color: #999;
			margin-top: 20rpx;
			padding-top: 20rpx;
			padding-bottom: 50rpx; // 增加底部间距
			
			// 无内容提示
			.no-content {
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