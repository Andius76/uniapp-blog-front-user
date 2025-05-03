<template>
	<view class="article-list-container">
		<scroll-view 
			scroll-y 
			class="article-scroll" 
			@scrolltolower="handleLoadMore" 
			:refresher-enabled="true"
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
						v-if="!isCurrentUser(article.author?.id) && !showManageOptions" 
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
					<!-- 分享按钮 -->
					<view class="action-item" @click.stop="handleShare(index)">
						<uni-icons type="redo-filled" size="20" color="#000"></uni-icons>
						<text v-if="!showManageOptions">分享</text>
					</view>
					
					<!-- 点赞按钮 -->
					<view class="action-item" @click.stop="handleLike(index)">
						<uni-icons :type="article.isLiked ? 'heart-filled' : 'heart'" size="20"
							:color="article.isLiked ? '#ff6b6b' : '#000'"></uni-icons>
						<text :class="{'liked': article.isLiked}">{{article.likeCount || 0}}</text>
					</view>
					
					<!-- 编辑按钮（根据权限条件显示） -->
					<view class="action-item manage-btn" 
						v-if="showManageOptions && (isCurrentUser(article.author?.id) || props.showEditForAllUsers)"
						@click.stop="handleEdit(index)">
						<uni-icons type="compose" size="20" color="#000"></uni-icons>
					</view>
					
					<!-- 删除按钮（当显示管理选项且是当前用户的文章时） -->
					<view class="action-item manage-btn" 
						v-if="showManageOptions && isCurrentUser(article.author?.id)"
						@click.stop="handleDelete(index)">
						<uni-icons type="trash" size="20" color="#000"></uni-icons>
					</view>
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
	import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
	import { deleteArticle, getArticleDetail } from '@/api/article';
	
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
		// 是否允许所有已登录用户编辑文章
		showEditForAllUsers: {
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
		
		// 监听全局文章发布/更新事件
		uni.$on('article_published', (data) => {
			console.log('接收到文章发布事件:', data);
			// 如果列表类型是推荐、最新或热门，刷新列表
			if (['recommend', 'new', 'hot'].includes(props.listType)) {
				resetList();
				loadArticles();
			}
		});
		
		uni.$on('article_updated', (data) => {
			console.log('接收到文章更新事件:', data);
			// 重新加载列表数据
			resetList();
			loadArticles();
		});
		
		// 监听用户信息更新事件
		uni.$on('user_info_updated', () => {
			console.log('接收到用户信息更新事件，重新处理文章列表中的用户信息');
			// 重新处理当前列表中的用户信息
			if (articleList.value.length > 0) {
				articleList.value = processArticleData([...articleList.value]);
			}
		});
	});
	
	// 组件卸载时移除事件监听
	onBeforeUnmount(() => {
		uni.$off('article_published');
		uni.$off('article_updated');
		uni.$off('user_info_updated');
	});
	
	// 重置列表数据
	const resetList = () => {
		articleList.value = [];
		currentPage.value = 1;
		noMoreData.value = false;
		isLoading.value = false;
		// 注意：不重置isRefreshing状态，由刷新逻辑自行控制
	};
	
	// 加载文章列表
	const loadArticles = async (force = false) => {
		// 如果已经没有更多数据或正在加载中，则不处理
		if (noMoreData.value || isLoading.value) {
			console.log('跳过加载：', noMoreData.value ? '没有更多数据' : '正在加载中');
			return Promise.resolve();
		}
		
		console.log('开始加载文章列表，页码:', currentPage.value, force ? '(强制刷新)' : '');
		isLoading.value = true;
		
		try {
			// 构建请求参数
			const params = {
				page: currentPage.value,
				pageSize: pageSize.value
			};
			
			// 获取文章列表的API路径
			let apiPath = '/api/article';
			
			// 根据不同的列表类型设置参数和API路径
			if (props.listType === 'myPosts') {
				// 直接获取当前登录用户的文章，无需传递userId
				const currentUserId = getCurrentUserId();
				if (!currentUserId) {
					console.error('用户未登录，无法获取我的发表');
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					isLoading.value = false;
					return Promise.reject(new Error('用户未登录'));
				}
				apiPath = `/api/article/user/${currentUserId}/articles`;
				params.type = 'posts';
				console.log(`加载当前用户(${currentUserId})的文章`);
			} else if (props.userId) {
				// 获取指定用户的文章
				apiPath = `/api/article/user/${props.userId}/articles`;
				params.type = props.listType === 'like' ? 'likes' : 'posts';
				console.log(`加载用户(${props.userId})的${params.type}类型文章`);
			} else if (props.listType === 'collection') {
				// 获取收藏的文章
				apiPath = '/api/article/collections';
				console.log('加载收藏的文章');
			} else if (props.listType === 'follow') {
				// 获取关注的用户发布的文章
				apiPath = '/api/article/follow';
				console.log('加载关注用户的文章');
			} else if (props.listType === 'hot') {
				// 获取热门文章
				params.sort = 'hot';
				console.log('加载热门文章');
			} else if (props.listType === 'new') {
				// 获取最新文章
				params.sort = 'new';
				console.log('加载最新文章');
			} else if (props.listType === 'tag' && props.tagName) {
				// 获取特定标签的文章
				params.tag = props.tagName;
				console.log(`加载标签(${props.tagName})的文章`);
			} else {
				console.log('加载推荐文章');
			}
			
			// 添加时间戳参数和强制刷新标志
			if (force) {
				params.timestamp = new Date().getTime();
				params.forceRefresh = true;
				console.log('添加时间戳和强制刷新参数:', params.timestamp);
			}
			
			// 打印完整的请求信息，便于调试
			console.log('======= 请求信息 =======');
			console.log('API路径:', apiPath);
			console.log('请求参数:', JSON.stringify(params));
			console.log('用户ID:', props.userId);
			console.log('列表类型:', props.listType);
			
			// 发起请求
			const response = await request(apiPath, params, force);
			
			// 打印响应信息
			console.log('======= 响应信息 =======');
			console.log('响应代码:', response.code);
			console.log('响应消息:', response.message);
			console.log('数据总数:', response.data?.total);
			console.log('页大小:', response.data?.pageSize);
			console.log('当前页:', response.data?.pageNum);
			console.log('是否有列表数据:', !!response.data?.list);
			console.log('列表数据条数:', response.data?.list?.length || 0);
			
			// 处理响应数据
			if (response.code === 200 && response.data) {
				// 更详细地验证响应数据
				if (!response.data.list) {
					console.warn('API响应缺少list字段:', response.data);
					// 如果是强制刷新但无数据，返回空列表
					if (force) {
						articleList.value = [];
						return Promise.resolve();
					}
				}
				
				// 处理文章数据并添加到文章列表
				const newArticles = processArticleData(response.data.list || []);
				console.log(`获取到${newArticles.length}篇文章`);
				
				if (currentPage.value === 1) {
					// 第一页数据，替换列表
					console.log('替换整个文章列表');
					articleList.value = newArticles;
				} else {
					// 追加数据到列表
					console.log('追加文章到列表');
					articleList.value = [...articleList.value, ...newArticles];
				}
				
				// 更新页码
				currentPage.value++;
				console.log('页码更新为:', currentPage.value);
				
				// 判断是否还有更多数据
				// 如果后端返回了pageSize，使用它进行判断
				const backendPageSize = response.data.pageSize || pageSize.value;
				
				// 如果没有数据或数据量小于页大小，认为没有更多数据了
				if (!response.data.list || response.data.list.length < backendPageSize) {
					noMoreData.value = true;
					console.log('已加载全部数据');
				}
				
				// 触发loadMore事件
				emit('loadMore');
				
				return Promise.resolve();
			} else {
				// 处理错误情况
				console.error('加载失败:', response.message);
				uni.showToast({
					title: response.message || '加载失败',
					icon: 'none'
				});
				
				return Promise.reject(new Error(response.message || '加载失败'));
			}
		} catch (error) {
			console.error('获取文章列表异常:', error);
			uni.showToast({
				title: '网络异常，请稍后再试',
				icon: 'none'
			});
			
			return Promise.reject(error);
		} finally {
			// 确保无论成功或失败都会重置加载状态
			isLoading.value = false;
			console.log('加载状态已重置');
		}
	};
	
	// 处理文章数据
	const processArticleData = (articles) => {
		// 获取当前登录用户信息，用于同步头像
		const currentUserInfo = uni.getStorageSync('userInfo') || {};
		
		return articles.map(article => {
			// 处理封面图片 - 优先使用coverImage字段，如果没有再从images数组取第一张
			// 确保后端直接返回的coverImage能正确显示
			if (!article.coverImage && article.images && article.images.length > 0) {
				article.coverImage = article.images[0];
			}
			
			// 如果coverImage字段存在但是不包含完整URL，补全路径
			if (article.coverImage && !article.coverImage.startsWith('http')) {
				if (article.coverImage.startsWith('/')) {
					article.coverImage = getBaseUrl() + article.coverImage;
				} else {
					article.coverImage = getBaseUrl() + '/' + article.coverImage;
				}
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
			
			// 同步当前登录用户的头像和昵称
			if (currentUserInfo.id && article.author.id === currentUserInfo.id) {
				article.author.avatar = currentUserInfo.avatar || article.author.avatar;
				article.author.nickname = currentUserInfo.nickname || article.author.nickname;
			}
			
			// 确保头像地址是完整URL
			if (article.author.avatar && !article.author.avatar.startsWith('http') && !article.author.avatar.startsWith('/static')) {
				if (article.author.avatar.startsWith('/')) {
					article.author.avatar = getBaseUrl() + article.author.avatar;
				} else {
					article.author.avatar = getBaseUrl() + '/' + article.author.avatar;
				}
			}
			
			// 调试输出，方便查看coverImage
			if (article.coverImage) {
				console.log(`文章ID: ${article.id}, 标题: ${article.title}, 封面图片: ${article.coverImage}`);
			}
			
			return article;
		});
	};
	
	// 网络请求封装
	const request = async (url, params = {}, force = false) => {
		try {
			// 获取基础URL
			const baseUrl = getBaseUrl();
			
			// 获取token
			const token = uni.getStorageSync('token');
			
			// 构建请求URL（添加查询参数）
			let requestUrl = baseUrl + url;
			if (Object.keys(params).length > 0) {
				const queryString = Object.keys(params)
					.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
					.join('&');
				requestUrl += `?${queryString}`;
			}
			
			console.log('发起API请求:', requestUrl);
			
			// 返回Promise
			return new Promise((resolve, reject) => {
				// 请求计时器，用于监控请求时间
				const startTime = Date.now();
				
				// 设置请求超时
				let timeoutId = setTimeout(() => {
					console.error('请求超时:', requestUrl);
					reject(new Error('请求超时，请检查网络连接'));
				}, 15000); // 15秒超时
				
				// 请求头
				const headers = {
					'Authorization': token ? `Bearer ${token}` : '',
					'Content-Type': 'application/json'
				};
				
				// 如果是强制刷新，添加防缓存头
				if (force) {
					headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
					headers['Pragma'] = 'no-cache';
					headers['Expires'] = '0';
					headers['If-Modified-Since'] = '0';
				}
				
				uni.request({
					url: requestUrl,
					method: 'GET',
					timeout: 15000, // 15秒超时设置
					header: headers,
					success: (res) => {
						clearTimeout(timeoutId); // 清除超时计时器
						
						// 计算请求耗时
						const requestTime = Date.now() - startTime;
						console.log(`API响应状态: ${res.statusCode}, 耗时: ${requestTime}ms`);
						
						// 处理API响应
						if (res.statusCode === 200) {
							// 验证返回数据结构
							if (!res.data) {
								console.warn('API返回空数据');
								resolve({code: 200, message: "success", data: {total: 0, list: []}});
								return;
							}
							
							// 检查data字段
							if (!res.data.data && res.data.code === 200) {
								console.warn('API返回的data字段为空');
								res.data.data = {total: 0, list: []};
							}
							
							console.log('API请求成功，数据条数:', res.data?.data?.list?.length || 0);
							resolve(res.data);
						} else if (res.statusCode === 401) {
							// 未授权，可能是token过期
							console.log('API请求未授权(401)');
							uni.showToast({
								title: '请先登录',
								icon: 'none'
							});
							
							// 可以在这里添加重定向到登录页的逻辑
							// uni.navigateTo({url: '/pages/login/login'});
							
							resolve({code: 401, message: "需要登录", data: null});
						} else {
							// 其他错误
							console.log('API请求失败，状态码:', res.statusCode);
							resolve({code: res.statusCode, message: res.data?.message || "请求失败", data: null});
						}
					},
					fail: (err) => {
						clearTimeout(timeoutId); // 清除超时计时器
						
						console.error('API请求网络错误:', err);
						// 网络错误时明确拒绝Promise
						reject(err);
					},
					complete: () => {
						// 可以在这里添加全局的请求完成逻辑
					}
				});
			});
		} catch (error) {
			console.error('请求异常:', error);
			return Promise.reject(error);
		}
	};
	
	/**
	 * 获取基础URL
	 */
	const getBaseUrl = () => {
		// #ifdef APP-PLUS
		return 'http://10.9.57.7:8080'; // 安卓模拟器访问本机服务器的地址
		// #endif
		
		// #ifdef H5
		return 'http://localhost:8080';
		// #endif
		
		// #ifdef MP-WEIXIN
		return 'http://localhost:8080';
		// #endif
	};
	
	// 处理下拉刷新
	const handleRefresh = () => {
		if (isRefreshing.value) return; // 避免重复触发
		
		console.log('开始完全重置刷新...');
		isRefreshing.value = true;
		
		// 完全重置组件状态
		articleList.value = [];
		currentPage.value = 1;
		noMoreData.value = false;
		
		// 通知用户正在刷新
		uni.showToast({
			title: '正在刷新...',
			icon: 'loading',
			duration: 1000
		});
		
		// 模拟浏览器刷新效果 - 短暂延迟后完全重新加载
		setTimeout(() => {
			// 发起带有缓存破坏参数的全新请求
			const randomParam = Math.random().toString(36).substring(2, 15);
			
			// 构建请求参数和API路径
			let apiPath = '/api/article';
			const requestParams = {
				page: 1,
				pageSize: pageSize.value,
				_nocache: randomParam,
				_t: Date.now()
			};
			
			// 根据列表类型设置正确的参数
			if (props.listType === 'myPosts') {
				const currentUserId = getCurrentUserId();
				if (!currentUserId) {
					console.error('用户未登录，无法刷新');
					isRefreshing.value = false;
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				apiPath = `/api/article/user/${currentUserId}/articles`;
				requestParams.type = 'posts';
			} else if (props.userId) {
				apiPath = `/api/article/user/${props.userId}/articles`;
				requestParams.type = props.listType === 'like' ? 'likes' : 'posts';
			} else if (props.listType === 'collection') {
				apiPath = '/api/article/collections';
			} else if (props.listType === 'follow') {
				apiPath = '/api/article/follow';
			} else if (props.listType === 'hot') {
				requestParams.sort = 'hot';
			} else if (props.listType === 'new') {
				requestParams.sort = 'new';
			} else if (props.listType === 'tag' && props.tagName) {
				requestParams.tag = props.tagName;
			}
			
			console.log('刷新请求路径:', apiPath);
			console.log('刷新请求参数:', requestParams);
			
			// 直接发起完全的新请求
			request(apiPath, requestParams, true)
				.then(response => {
					// 处理响应数据
					if (response.code === 200 && response.data && response.data.list) {
						// 使用全新数据替换列表
						articleList.value = processArticleData(response.data.list || []);
						
						// 更新分页信息
						currentPage.value = 2; // 已加载第1页，下次加载第2页
						
						// 检查是否还有更多数据
						const backendPageSize = response.data.pageSize || pageSize.value;
						if (!response.data.list || response.data.list.length < backendPageSize) {
							noMoreData.value = true;
						}
						
						// 显示成功提示
						uni.showToast({
							title: '刷新成功',
							icon: 'success',
							duration: 1500
						});
					} else {
						// 处理错误情况
						throw new Error(response.message || '刷新失败');
					}
				})
				.catch(error => {
					console.error('刷新失败:', error);
					uni.showToast({
						title: '刷新失败，请重试',
						icon: 'none',
						duration: 2000
					});
				})
				.finally(() => {
					// 无论成功或失败，重置刷新状态
					isRefreshing.value = false;
					isLoading.value = false;
					emit('refresh'); // 通知父组件刷新已完成
				});
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
	const handleCollect = async (index) => {
		const article = articleList.value[index];
		const articleId = article.id;
		const baseUrl = getBaseUrl();
		const token = uni.getStorageSync('token');
		
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			return;
		}
		
		try {
			// 构建请求
			const url = `${baseUrl}/api/article/collect/${articleId}`;
			const method = article.isCollected ? 'DELETE' : 'POST';
			
			// 发起请求
			uni.request({
				url,
				method,
				header: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				success: (res) => {
					if (res.statusCode === 200) {
						// 切换收藏状态
						article.isCollected = !article.isCollected;
						article.collectCount = (article.collectCount || 0) + (article.isCollected ? 1 : -1);
						
						// 显示提示
						uni.showToast({
							title: article.isCollected ? '收藏成功' : '已取消收藏',
							icon: 'success'
						});
						
						// 触发事件
						emit('collect', article);
					} else {
						uni.showToast({
							title: res.data?.message || '操作失败',
							icon: 'none'
						});
					}
				},
				fail: (err) => {
					console.error('收藏操作失败:', err);
					uni.showToast({
						title: '网络异常，请稍后再试',
						icon: 'none'
					});
				}
			});
		} catch (error) {
			console.error('收藏操作异常:', error);
			uni.showToast({
				title: '操作异常，请稍后再试',
				icon: 'none'
			});
		}
	};
	
	// 处理点赞
	const handleLike = async (index) => {
		const article = articleList.value[index];
		const articleId = article.id;
		const baseUrl = getBaseUrl();
		const token = uni.getStorageSync('token');
		
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			return;
		}
		
		try {
			// 构建请求
			const url = `${baseUrl}/api/article/like/${articleId}`;
			const method = article.isLiked ? 'DELETE' : 'POST';
			
			// 发起请求
			uni.request({
				url,
				method,
				header: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				success: (res) => {
					if (res.statusCode === 200) {
						// 切换点赞状态
						article.isLiked = !article.isLiked;
						article.likeCount = (article.likeCount || 0) + (article.isLiked ? 1 : -1);
						
						// 显示提示
						uni.showToast({
							title: article.isLiked ? '点赞成功' : '已取消点赞',
							icon: 'success'
						});
						
						// 触发事件
						emit('like', article);
					} else {
						uni.showToast({
							title: res.data?.message || '操作失败',
							icon: 'none'
						});
					}
				},
				fail: (err) => {
					console.error('点赞操作失败:', err);
					uni.showToast({
						title: '网络异常，请稍后再试',
						icon: 'none'
					});
				}
			});
		} catch (error) {
			console.error('点赞操作异常:', error);
			uni.showToast({
				title: '操作异常，请稍后再试',
				icon: 'none'
			});
		}
	};
	
	// 处理编辑文章
	const handleEdit = async (index) => {
		const article = articleList.value[index];
		const articleId = article.id;
		const baseUrl = getBaseUrl();
		const token = uni.getStorageSync('token');
		
		// 确认是否为当前用户的文章
		if (!isCurrentUser(article.author?.id)) {
			uni.showToast({
				title: '只能编辑自己的文章',
				icon: 'none'
			});
			return;
		}
		
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			return;
		}
		
		try {
			// 显示加载中
			uni.showLoading({
				title: '加载文章内容...'
			});
			
			// 获取完整的文章内容，准备编辑
			const url = `${baseUrl}/api/article/${articleId}`;
			
			// 发起请求
			uni.request({
				url,
				method: 'GET',
				header: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				success: (res) => {
					uni.hideLoading();
					
					if (res.statusCode === 200 && res.data.code === 200 && res.data.data) {
						// 准备文章数据
						const articleData = {
							id: article.id,
							title: article.title,
							content: res.data.data.content || article.content,
							htmlContent: res.data.data.htmlContent || article.content,
							tags: article.tags || [],
							// 优先使用API响应中的coverImage
							coverImage: res.data.data.coverImage || article.coverImage
						};
						
						// 处理封面图片URL如果需要
						if (articleData.coverImage && !articleData.coverImage.startsWith('http')) {
							if (articleData.coverImage.startsWith('/')) {
								articleData.coverImage = getBaseUrl() + articleData.coverImage;
							} else {
								articleData.coverImage = getBaseUrl() + '/' + articleData.coverImage;
							}
						}
						
						console.log('编辑文章数据:', articleData);
						
						// 触发事件
						emit('edit', articleData);
					} else {
						// 使用简略数据
						console.warn('无法获取完整文章内容，使用简略数据');
						emit('edit', article);
						
						uni.showToast({
							title: '获取完整内容失败',
							icon: 'none'
						});
					}
				},
				fail: (err) => {
					uni.hideLoading();
					console.error('获取文章详情失败:', err);
					
					// 使用简略数据作为回退方案
					emit('edit', article);
					
					uni.showToast({
						title: '网络异常，使用简略内容',
						icon: 'none'
					});
				}
			});
		} catch (error) {
			uni.hideLoading();
			console.error('编辑操作异常:', error);
			
			// 使用简略数据作为回退方案
			emit('edit', article);
			
			uni.showToast({
				title: '操作异常，使用简略内容',
				icon: 'none'
			});
		}
	};
	
	// 处理删除文章
	const handleDelete = (index) => {
		const article = articleList.value[index];
		
		// 确认是否为当前用户的文章
		if (!isCurrentUser(article.author?.id)) {
			uni.showToast({
				title: '只能删除自己的文章',
				icon: 'none'
			});
			return;
		}
		
		// 显示确认对话框
		uni.showModal({
			title: '确认删除',
			content: '确定要删除这篇文章吗？该操作无法撤销。',
			confirmText: '删除',
			confirmColor: '#FF5A5F',
			success: (res) => {
				if (res.confirm) {
					// 显示加载中
					uni.showLoading({
						title: '正在删除...',
						mask: true
					});
					
					// 调用删除API
					deleteArticle(article.id)
						.then(res => {
							// 无论结果如何，先从前端列表中移除该文章
							// 如果后端返回200或文章不存在都认为是删除成功
							if (res.code === 200 || res.message === '文章不存在') {
								// 从列表中移除该文章
								articleList.value.splice(index, 1);
								
								// 显示成功提示
								uni.showToast({
									title: '删除成功',
									icon: 'success',
									duration: 2000
								});
								
								// 发出删除事件
								emit('delete', article);
							} else {
								console.error('删除失败:', res);
								uni.showToast({
									title: res.message || '删除失败，请重试',
									icon: 'none',
									duration: 2000
								});
							}
						})
						.catch(err => {
							console.error('删除文章失败:', err);
							const errorMsg = err.data?.message || err.message || '网络异常，请稍后再试';
							
							// 如果返回的错误是"文章不存在"，说明文章已经被删除
							if(errorMsg.includes('不存在')) {
								// 从列表移除文章
								articleList.value.splice(index, 1);
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});
								emit('delete', article);
							} else {
								uni.showToast({
									title: errorMsg,
									icon: 'none',
									duration: 2000
								});
							}
						})
						.finally(() => {
							uni.hideLoading();
						});
				}
			}
		});
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
		refresh: handleRefresh,
		getArticleList: () => articleList.value
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
				padding-bottom: 10rpx;
				flex-wrap: wrap;
				position: relative;
				
				.action-item {
					display: flex;
					align-items: center;
					justify-content: center;
					margin-bottom: 10rpx;
					padding: 0 15rpx;
					
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
				
				.manage-btn {
					width: 70rpx;
					height: 70rpx;
					background-color: #f8f8f8;
					border-radius: 50%;
					justify-content: center;
					margin-right: 0;
					
					.uni-icons {
						margin-right: 0;
					}
					
					&:active {
						opacity: 0.8;
						transform: scale(0.95);
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