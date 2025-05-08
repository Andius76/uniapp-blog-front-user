<template>
	<view class="container">
		<!-- 固定在顶部的标题和分类选择栏 -->
		<view class="header-fixed">
			<view class="header-main-container">
				<!-- 搜索栏 -->
				<view class="header-top">
					<view class="search-bar">
						<input type="text" placeholder="请输入搜索标签" v-model="searchText" @confirm="handleSearch" />
						<button class="search-btn" @click="handleSearch">搜索</button>
					</view>
				</view>

				<!-- 分类标签导航 -->
				<scroll-view class="category-scroll" scroll-x show-scrollbar="false">
					<view class="category-list">
						<view 
							v-for="(tag, index) in filteredTags" 
							:key="index" 
							class="category-item" 
							:class="{ active: currentTag === tag.name }"
							@click="switchCategory(tag.name)"
						>
							{{ tag.name }}
							<text class="tag-count" v-if="tag.count !== undefined">({{ tag.count }})</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 内容区域，使用ArticleList组件 -->
		<!-- #ifdef H5 -->
		<view class="content-area">
			<ArticleList 
				ref="articleListRef"
				:key="currentTag" 
				list-type="tag"
				:tag-name="currentTag === '全部' ? '' : currentTag"
				:height="'calc(100vh - 180rpx)'"
				:empty-text="emptyText"
				@article-click="viewArticleDetail"
				@author-click="viewAuthorProfile"
				@tag-click="handleTagClick"
				@share="handleShare"
				@comment="handleComment"
				@collect="handleCollect"
				@like="handleLike"
			/>
		</view>
		<!-- #endif -->

		<!-- APP和小程序的内容区域 -->
		<!-- #ifndef H5 -->
		<view class="content-area mp-content">
			<scroll-view 
				scroll-y 
				class="article-list" 
				refresher-enabled 
				:refresher-triggered="isRefreshing" 
				@refresherrefresh="handleRefresh"
				@scrolltolower="handleLoadMore"
				:refresher-threshold="100"
			>
				<!-- 文章列表循环显示 -->
				<view v-for="(article, index) in articleList" :key="article.id" class="article-card">
					<!-- 用户信息 -->
					<view class="user-info">
						<image class="avatar" :src="article.author && formatAvatarUrl(article.author?.avatar) || '/static/images/avatar.png'" mode="aspectFill" @error="handleUserAvatarError(index)"></image>
						<text class="nickname">{{article.author?.nickname || '未知用户'}}</text>
						<button class="follow-btn" :class="{'followed': article.author?.isFollowed}" @click.stop="handleFollow(article)">
							{{ article.author?.isFollowed ? '已关注' : '+ 关注' }}
						</button>
					</view>

					<!-- 文章内容 -->
					<view class="article-content" @click="viewArticleDetail(article.id)" :class="{'no-cover': !article.coverImage}">
						<text class="article-title">{{article.title}}</text>
						<text class="article-summary">{{formatArticleSummary(article.summary)}}</text>

						<!-- 文章封面图片 - 仅当真正有封面时才显示 -->
						<view class="article-image" v-if="article.coverImage">
							<image :src="article.coverImage" mode="aspectFill" class="single-image" @error="handleImageError(article)"></image>
						</view>
						
						<!-- 文章标签 -->
						<view class="article-tags" v-if="article.tags && article.tags.length > 0">
							<view v-for="(tag, tagIndex) in article.tags" :key="tagIndex" class="tag-item" @click.stop="handleTagClick(tag)">
								{{ tag }}
							</view>
						</view>
					</view>

					<!-- 文章操作按钮 -->
					<view class="article-actions">
						<view class="action-item" @click.stop="handleShare(article)">
							<uni-icons type="redo-filled" size="20" color="#666"></uni-icons>
							<text>分享</text>
						</view>
						<view class="action-item" @click.stop="handleComment(article)">
							<uni-icons type="chatbubble" size="20" color="#666"></uni-icons>
							<text>{{article.commentCount || 0}}</text>
						</view>
						<view class="action-item" @click.stop="handleCollect(article)">
							<uni-icons :type="article.isCollected ? 'star-filled' : 'star'" size="20" :color="article.isCollected ? '#ffc107' : '#666'" 
								:class="{'animate-icon': article.isAnimating && article.animationType === 'collect'}"></uni-icons>
							<text :class="{'collected': article.isCollected}">{{article.collectCount || 0}}</text>
						</view>
						<view class="action-item" @click.stop="handleLike(article)">
							<uni-icons :type="article.isLiked ? 'heart-filled' : 'heart'" size="20" :color="article.isLiked ? '#ff6b6b' : '#666'"
								:class="{'animate-icon': article.isAnimating && article.animationType === 'like'}"></uni-icons>
							<text :class="{'liked': article.isLiked}">{{article.likeCount || 0}}</text>
						</view>
					</view>
				</view>

				<!-- 加载状态 -->
				<view class="loading-state">
					<text v-if="isLoading">加载中...</text>
					<text v-else-if="noMoreData && articleList.length > 0">没有更多文章了</text>
					<text v-else-if="articleList.length === 0 && !isLoading">{{emptyText}}</text>
					<text v-else>↓向下滑动加载更多文章列表↓</text>
				</view>
			</scroll-view>
		</view>
		<!-- #endif -->

		<!-- 返回顶部组件 -->
		<back-to-top ref="backToTopRef" :threshold="300" :hide-after-click="true" :duration="0" @click="scrollToTop" />
	</view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, reactive, watch, onUnmounted } from 'vue';
import http from '@/utils/request'; // 修改为默认导入
import { getBaseUrl } from '@/utils/request'; // 保留命名导入
import { collectArticle, likeArticle } from '@/api/article'; // 导入文章操作API
import ArticleList from '@/components/article-list/article-list.vue'; // 引入ArticleList组件
import BackToTop from '@/components/back-to-top/back-to-top.vue'; // 引入BackToTop组件
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'; // 引入uni-icons组件

// 声明articleListRef在组件顶部
const articleListRef = ref(null);
const backToTopRef = ref(null);

// 添加全局防抖标记，使用闭包确保跨页面刷新时重置
const globalLoadingLock = (() => {
	let isLocked = false;
	let lockTimer = null;
	
	// 设置锁定方法
	const lock = (duration = 3000) => {
		if (lockTimer) clearTimeout(lockTimer);
		isLocked = true;
		lockTimer = setTimeout(() => {
			isLocked = false;
			lockTimer = null;
		}, duration);
		return true;
	};
	
	// 检查是否锁定
	const isActive = () => isLocked;
	
	// 解除锁定
	const unlock = () => {
		isLocked = false;
		if (lockTimer) {
			clearTimeout(lockTimer);
			lockTimer = null;
		}
	};
	
	// 重置
	const reset = () => {
		unlock();
	};
	
	return {
		lock,
		isActive,
		unlock,
		reset
	};
})();

// 搜索相关
const searchText = ref('');
const isSearching = ref(false);

// 标签数据
const allTags = ref([
	{ name: '全部', count: 0 }
]);
const currentTag = ref('全部');
const emptyText = ref('该分类下暂无文章');

// 文章列表数据（小程序和APP环境使用）
const articleList = ref([]);
const isLoading = ref(false);
const isRefreshing = ref(false);
const noMoreData = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);

// 获取文章标签列表
const loadTags = async () => {
	try {
		const res = await http.get('/api/article/tags');
		if (res.code === 200 && Array.isArray(res.data)) {
			// 将返回的标签加入到allTags中，保留'全部'为第一项
			const tags = [{ name: '全部', count: 0 }, ...res.data];
			
			// 计算"全部"的文章数量（所有标签的文章数量之和）
			const totalCount = res.data.reduce((sum, tag) => sum + (tag.count || 0), 0);
			tags[0].count = totalCount;
			
			allTags.value = tags;
		}
	} catch (error) {
		console.error('获取标签列表失败:', error);
		uni.showToast({
			title: '获取标签列表失败',
			icon: 'none'
		});
	}
};

// 根据搜索文本过滤标签
const filteredTags = computed(() => {
	if (!searchText.value) return allTags.value;
	
	// 只有输入了搜索文本才过滤
	return allTags.value.filter(tag => 
		tag.name === '全部' || tag.name.toLowerCase().includes(searchText.value.toLowerCase())
	);
});

// 切换分类
const switchCategory = (tagName) => {
	// 如果点击的是当前分类，不做任何操作
	if (currentTag.value === tagName) return;
	
	// 更新当前选择的标签
	currentTag.value = tagName;
	
	// 更新空列表提示文字
	emptyText.value = tagName === '全部' ? '暂无文章内容' : `没有找到关于"${tagName}"的文章`;
	
	// #ifdef H5
	// 对于H5环境，使用ArticleList组件刷新
	nextTick(() => {
		if (articleListRef.value) {
			articleListRef.value.resetList(); // 重置列表
			articleListRef.value.loadArticles(); // 加载文章
		}
	});
	// #endif
	
	// #ifndef H5
	// 对于APP和小程序环境，直接刷新文章列表
	handleRefresh();
	// #endif
};

// 处理搜索
const handleSearch = () => {
	isSearching.value = true;
	
	// 如果搜索框为空，则重置为全部分类
	if (!searchText.value.trim()) {
		switchCategory('全部');
		isSearching.value = false;
		return;
	}
	
	// 在标签中搜索
	const found = allTags.value.find(tag => 
		tag.name !== '全部' && tag.name.toLowerCase() === searchText.value.toLowerCase()
	);
	
	// 如果找到完全匹配的标签，切换到该标签
	if (found) {
		switchCategory(found.name);
	} else {
		// 否则，显示搜索结果
		emptyText.value = `没有找到关于"${searchText.value}"的标签`;
		// 这里可以根据需要添加更多搜索逻辑
	}
	
	isSearching.value = false;
};

// 处理标签点击事件
const handleTagClick = (tag) => {
	// 切换到被点击的标签
	switchCategory(tag);
	
	// 可选：清空搜索框
	searchText.value = '';
};

// 查看文章详情
const viewArticleDetail = (articleId) => {
	uni.navigateTo({
		url: `/pages/article-detail/article-detail?id=${articleId}`
	});
};

// 查看作者资料
const viewAuthorProfile = (authorId) => {
	uni.navigateTo({
		url: `/pages/user-profile/user-profile?id=${authorId}`
	});
};

/**
 * 格式化文章摘要
 */
const formatArticleSummary = (summary) => {
	if (!summary) return '暂无摘要...全文';
	
	// 去除HTML标签
	summary = summary.replace(/<[^>]+>/g, '');
	
	// 去除多余空格
	summary = summary.replace(/\s+/g, ' ');
	
	// 限制长度
	const maxLength = 80;
	return summary.length > maxLength ? 
		summary.substring(0, maxLength) + '...全文' : 
		summary + '...全文';
};

/**
 * 处理头像URL格式
 */
const formatAvatarUrl = (url) => {
	if (!url) return '/static/images/avatar.png';
	
	// 移除URL中可能存在的多余空格
	url = url.trim();
	
	// 确保不是null、undefined或空字符串
	if (url === 'null' || url === 'undefined' || url === '') {
		return '/static/images/avatar.png';
	}
	
	// 完整URL处理：如果已经是完整URL（包含http）则做特殊处理
	if (url.startsWith('http')) {
		// 检查并修复双斜杠问题
		if (url.includes('//uploads')) {
			url = url.replace('//uploads', '/uploads');
		}
		
		// APP环境下特别处理localhost
		// #ifdef APP-PLUS
		if (url.includes('localhost') || url.includes('127.0.0.1')) {
			const appBaseUrl = 'http://10.9.135.132:8080';
			const urlPath = url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '');
			return appBaseUrl + urlPath;
		}
		// #endif
		
		return url;
	}
	// 静态资源处理：如果是静态资源路径则不处理
	else if (url.startsWith('/static')) {
		return url;
	}
	// 路径以/uploads开头
	else if (url.startsWith('/uploads')) {
		return getBaseUrl() + url;
	}
	// 用户头像特别处理：如果是user_开头的文件名，默认放在/uploads/avatars/目录下
	else if (url.startsWith('user_')) {
		return getBaseUrl() + '/uploads/avatars/' + url;
	}
	// 其他情况：添加基础URL前缀
	else {
		if (url.startsWith('/')) {
			return getBaseUrl() + url;
		} else {
			// 默认假设是avatars目录
			return getBaseUrl() + '/uploads/avatars/' + url;
		}
	}
};

/**
 * 处理用户头像加载错误
 */
const handleUserAvatarError = (index) => {
	// 显示错误日志
	console.error('用户头像加载失败:', index);
	
	// 替换为默认头像
	if (articleList.value[index] && articleList.value[index].author) {
		articleList.value[index].author.avatar = '/static/images/avatar.png';
	}
};

/**
 * 处理图片加载错误
 */
const handleImageError = (article) => {
	// 显示错误日志
	console.error('图片加载错误:', article.id, article.title, article.coverImage);
	
	// 仅当文章确实有封面图时才尝试修复
	if (article.coverImage) {
		// URL格式问题处理
		if (article.coverImage.includes('null') || article.coverImage.includes('undefined')) {
			console.log('封面图片含有无效值，移除封面');
			article.coverImage = null;
			return;
		}
		
		// 尝试修复URL格式问题
		if (article.coverImage.startsWith('/uploads')) {
			console.log('尝试修复URL格式: 添加基础URL');
			const newUrl = getBaseUrl() + article.coverImage;
			console.log(`修复URL: ${article.coverImage} -> ${newUrl}`);
			article.coverImage = newUrl;
			return;
		}
		
		// 检查是否为相对路径
		if (!article.coverImage.startsWith('http') && !article.coverImage.startsWith('/static')) {
			console.log('尝试修复相对路径');
			const newUrl = getBaseUrl() + '/' + article.coverImage;
			console.log(`修复URL: ${article.coverImage} -> ${newUrl}`);
			article.coverImage = newUrl;
			return;
		}
		
		// 如果上述修复都不成功，移除封面
		console.log('无法修复封面图片URL，移除封面');
		article.coverImage = null;
	}
};

/**
 * 处理分享
 */
const handleShare = (article) => {
	// 分享逻辑
	uni.showToast({
		title: '分享功能开发中',
		icon: 'none'
	});
};

/**
 * 处理评论
 */
const handleComment = (article) => {
	// 跳转到文章详情页评论区
	uni.navigateTo({
		url: `/pages/article-detail/article-detail?id=${article.id}&showComments=true`
	});
};

/**
 * 处理收藏/取消收藏
 */
const handleCollect = async (article) => {
	// 检查登录状态
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
		// 添加动画效果
		article.isAnimating = true;
		article.animationType = 'collect';
		
		// 调用收藏API
		const res = await collectArticle(article.id, !article.isCollected);
		
		if (res.code === 200) {
			// 更新文章收藏状态
			article.isCollected = !article.isCollected;
			// 更新收藏数量
			article.collectCount = article.isCollected ? 
				(article.collectCount || 0) + 1 : 
				Math.max(0, (article.collectCount || 0) - 1);
				
			// 发送全局事件，通知其他页面更新
			uni.$emit('article_collect_updated', {
				articleId: article.id,
				isCollected: article.isCollected,
				collectCount: article.collectCount
			});
		} else {
			uni.showToast({
				title: res.message || '操作失败',
				icon: 'none'
			});
		}
	} catch (error) {
		console.error('收藏操作失败:', error);
		uni.showToast({
			title: '操作失败，请稍后再试',
			icon: 'none'
		});
	} finally {
		// 动画结束后清除动画状态
		setTimeout(() => {
			article.isAnimating = false;
		}, 500);
	}
};

/**
 * 处理点赞/取消点赞
 */
const handleLike = async (article) => {
	// 检查登录状态
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
		// 添加动画效果
		article.isAnimating = true;
		article.animationType = 'like';
		
		// 调用点赞API
		const res = await likeArticle(article.id, !article.isLiked);
		
		if (res.code === 200) {
			// 更新文章点赞状态
			article.isLiked = !article.isLiked;
			// 更新点赞数量
			article.likeCount = article.isLiked ? 
				(article.likeCount || 0) + 1 : 
				Math.max(0, (article.likeCount || 0) - 1);
		} else {
			uni.showToast({
				title: res.message || '操作失败',
				icon: 'none'
			});
		}
	} catch (error) {
		console.error('点赞操作失败:', error);
		uni.showToast({
			title: '操作失败，请稍后再试',
			icon: 'none'
		});
	} finally {
		// 动画结束后清除动画状态
		setTimeout(() => {
			article.isAnimating = false;
		}, 500);
	}
};

/**
 * 处理关注/取消关注
 */
const handleFollow = async (article) => {
	// 检查登录状态
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
	
	// 获取作者ID
	const authorId = article.author?.id;
	if (!authorId) {
		uni.showToast({
			title: '操作失败，作者信息不完整',
			icon: 'none'
		});
		return;
	}
	
	try {
		// 当前关注状态
		const isFollowed = article.author.isFollowed;
		
		// 发送关注/取消关注请求
		const url = `/api/user/follow/${authorId}`;
		const method = isFollowed ? 'delete' : 'post';
		
		const res = await http[method](url);
		
		if (res.code === 200) {
			// 更新关注状态
			article.author.isFollowed = !isFollowed;
			
			// 显示操作成功提示
			uni.showToast({
				title: isFollowed ? '已取消关注' : '关注成功',
				icon: 'none'
			});
		} else {
			uni.showToast({
				title: res.message || '操作失败',
				icon: 'none'
			});
		}
	} catch (error) {
		console.error('关注操作失败:', error);
		uni.showToast({
			title: '网络错误，请稍后再试',
			icon: 'none'
		});
	}
};

// 加载文章列表数据
const loadArticles = async (refresh = false) => {
	// 避免重复加载
	if (isLoading.value) return;
	
	// 如果刷新，重置页码
	if (refresh) {
		currentPage.value = 1;
		noMoreData.value = false;
		if (refresh && !isRefreshing.value) {
			articleList.value = [];
		}
	}
	
	// 标记加载状态
	isLoading.value = true;
	
	try {
		// 构建请求参数
		const params = {
			page: currentPage.value,
			pageSize: pageSize.value,
			sort: 'new',
			timestamp: new Date().getTime() // 添加时间戳防止缓存
		};
		
		// 添加标签过滤
		if (currentTag.value !== '全部') {
			params.tag = currentTag.value;
		}
		
		console.log('请求参数:', params, '当前标签:', currentTag.value);
		
		// 发送请求
		const res = await http.get('/api/article', params);
		
		if (res.code === 200 && res.data) {
			// 获取文章列表
			let articles = res.data.list || [];
			console.log(`获取到${articles.length}篇文章数据`);
			
			// 处理每篇文章的数据
			articles = articles.map(article => {
				// 输出原始数据用于调试
				console.log(`[文章${article.id}] 标题: ${article.title}`);
				
				// 尝试从多种可能的字段名获取封面图片URL
				let coverImage = null;
				
				// 优先级1: coverImage字段
				if (article.coverImage) {
					coverImage = article.coverImage;
					console.log(`[文章${article.id}] 使用coverImage字段:`, coverImage);
				} 
				// 优先级2: cover_image字段
				else if (article.cover_image) {
					coverImage = article.cover_image;
					console.log(`[文章${article.id}] 使用cover_image字段:`, coverImage);
				}
				// 优先级3: thumbnail字段
				else if (article.thumbnail) {
					coverImage = article.thumbnail;
					console.log(`[文章${article.id}] 使用thumbnail字段:`, coverImage);
				}
				// 优先级4: 从文章内容中提取第一张图片
				else if (article.content && article.content.includes('<img')) {
					const imgMatch = article.content.match(/<img[^>]+src=['"]([^'"]+)['"]/);
					if (imgMatch && imgMatch[1]) {
						coverImage = imgMatch[1];
						console.log(`[文章${article.id}] 从内容提取图片:`, coverImage);
					}
				}
				
				// 使用formatArticleImage统一处理封面图片URL
				if (coverImage) {
					article.coverImage = formatArticleImage(coverImage);
					console.log(`[文章${article.id}] 处理后的封面URL:`, article.coverImage);
				} else {
					article.coverImage = null; // 确保没有封面时设为null
					console.log(`[文章${article.id}] 无封面图片`);
				}
				
				// 处理作者头像
				if (article.author && article.author.avatar) {
					article.author.avatar = formatAvatarUrl(article.author.avatar);
				}
				
				return article;
			});
			
			// 如果是刷新，直接替换列表；否则，追加数据
			if (refresh) {
				articleList.value = articles;
			} else {
				articleList.value = [...articleList.value, ...articles];
			}
			
			// 确保每个文章都有基本属性
			articleList.value.forEach(article => {
				// 确保有基本的计数字段
				article.commentCount = article.commentCount || 0;
				article.likeCount = article.likeCount || 0;
				article.collectCount = article.collectCount || 0;
				
				// 确保有基本的状态字段
				article.isLiked = !!article.isLiked;
				article.isCollected = !!article.isCollected;
				
				// 确保有标签数组
				if (!article.tags || !Array.isArray(article.tags)) {
					article.tags = [];
				}
			});
			
			// 更新是否有更多数据的标志
			noMoreData.value = articles.length < pageSize.value;
			
			// 如果成功加载，递增页码
			if (articles.length > 0) {
				currentPage.value++;
			}
		} else {
			// 显示错误提示
			uni.showToast({
				title: res.message || '获取文章列表失败',
				icon: 'none'
			});
		}
	} catch (error) {
		console.error('加载文章失败:', error);
		uni.showToast({
			title: '网络错误，请稍后再试',
			icon: 'none'
		});
	} finally {
		// 清除加载状态
		isLoading.value = false;
		isRefreshing.value = false;
	}
};

// 处理下拉刷新
const handleRefresh = () => {
	if (isRefreshing.value) return; // 避免重复刷新
	
	isRefreshing.value = true;
	loadArticles(true);
};

// 处理加载更多
const handleLoadMore = () => {
	if (isLoading.value || noMoreData.value) return;
	loadArticles(false);
};

// 滚动到顶部
const scrollToTop = () => {
	// H5环境使用backToTopRef的scrollToTop方法
	if (backToTopRef.value) {
		backToTopRef.value.handleClick();
	} else {
		// 小程序和APP环境使用uni.pageScrollTo
		uni.pageScrollTo({
			scrollTop: 0,
			duration: 300
		});
	}
};

// 组件卸载时清理事件监听
onUnmounted(() => {
	// 移除收藏状态更新事件监听
	uni.$off('article_collect_updated');
});

// 页面加载时获取标签数据和文章列表
onMounted(() => {
	// 重置全局加载锁
	globalLoadingLock.reset();
	
	// 加载标签数据
	loadTags();
	
	// #ifndef H5
	// 仅在非H5环境加载文章列表
	loadArticles(true);
	// #endif
	
	// 监听收藏状态更新事件
	uni.$on('article_collect_updated', (data) => {
		console.log('分类页接收到文章收藏更新事件:', data);
		if (data && data.articleId && data.collectCount !== undefined) {
			// 查找文章并更新数据
			const article = articleList.value.find(item => item.id == data.articleId);
			if (article) {
				console.log(`分类页更新文章[${data.articleId}]收藏状态:`, data);
				article.isCollected = data.isCollected;
				article.collectCount = data.collectCount;
			}
		}
	});
});

/**
 * 处理文章封面图片URL
 * @param {String} url - 图片URL
 * @return {String} 处理后的图片URL
 */
const formatArticleImage = (url) => {
	console.log('[封面处理] 输入图片URL:', url);
	if (!url) {
		console.log('[封面处理] 空URL，返回空字符串');
		return '';
	}
	
	// 移除URL中可能存在的多余空格
	url = url.trim();
	
	// 确保不是null或undefined字符串
	if (url === 'null' || url === 'undefined' || url === '') {
		console.log('[封面处理] 无效URL值，返回空字符串');
		return '';
	}
	
	// APP环境特殊处理
	// #ifdef APP-PLUS
	console.log('[封面处理] 检测到APP环境，应用特殊处理');
	
	// 使用特定的APP环境基础URL
	const appBaseUrl = 'http://10.9.135.132:8080';
	
	// 完整URL处理：如果已经是完整URL，需要特别处理localhost情况
	if (url.startsWith('http')) {
		// 检查是否包含localhost或127.0.0.1，需要替换为真实IP
		if (url.includes('localhost') || url.includes('127.0.0.1')) {
			// 保留路径部分，替换主机部分
			const urlPath = url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '');
			const newUrl = appBaseUrl + urlPath;
			console.log(`[封面处理] APP-替换localhost: ${url} -> ${newUrl}`);
			return newUrl;
		}
		
		// 检查并修复双斜杠问题
		if (url.includes('//uploads')) {
			url = url.replace('//uploads', '/uploads');
			console.log('[封面处理] APP-修复双斜杠问题，结果:', url);
		}
		console.log('[封面处理] APP-返回完整URL:', url);
		return url;
	}
	// 静态资源处理：如果是静态资源路径则不处理
	else if (url.startsWith('/static')) {
		console.log('[封面处理] APP-返回静态资源路径:', url);
		return url;
	}
	// 相对路径处理：添加基础URL
	else {
		// 如果以/开头，直接拼接
		if (url.startsWith('/')) {
			const newUrl = appBaseUrl + url;
			console.log(`[封面处理] APP-添加基础URL: ${url} -> ${newUrl}`);
			return newUrl;
		} else {
			// 否则添加/再拼接
			const newUrl = appBaseUrl + '/' + url;
			console.log(`[封面处理] APP-添加基础URL和斜杠: ${url} -> ${newUrl}`);
			return newUrl;
		}
	}
	// #endif
	
	// 非APP环境处理（H5、小程序等）
	// 完整URL直接返回
	if (url.startsWith('http')) {
		// 检查并修复双斜杠问题
		if (url.includes('//uploads')) {
			url = url.replace('//uploads', '/uploads');
			console.log('[封面处理] 修复双斜杠问题，结果:', url);
		}
		console.log('[封面处理] 返回完整URL:', url);
		return url;
	}
	// 静态资源直接返回
	else if (url.startsWith('/static')) {
		console.log('[封面处理] 返回静态资源路径:', url);
		return url;
	}
	// 相对路径添加基础URL
	else {
		const baseUrl = getBaseUrl();
		// 以/开头，直接拼接
		if (url.startsWith('/')) {
			const newUrl = baseUrl + url;
			console.log(`[封面处理] 添加基础URL: ${url} -> ${newUrl}`);
			return newUrl;
		} else {
			// 否则添加/再拼接
			const newUrl = baseUrl + '/' + url;
			console.log(`[封面处理] 添加基础URL和斜杠: ${url} -> ${newUrl}`);
			return newUrl;
		}
	}
};
</script>

<style lang="scss" scoped>
.container {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100vh;
	background-color: #f8f9fa;
}

.header-fixed {
	position: sticky;
	top: 0;
	width: 100%;
	background-color: #fff;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	z-index: 100;
	padding-bottom: 10rpx;
}

.header-main-container {
	padding: 0 20rpx;
}

.header-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 90rpx;
	padding: 0 10rpx;
}

.search-bar {
	display: flex;
	flex: 1;
	height: 70rpx;
	background-color: #f5f5f5;
	border-radius: 35rpx;
	padding: 0 20rpx;
	align-items: center;
	margin: 10rpx 0;
	
	input {
		flex: 1;
		height: 100%;
		font-size: 28rpx;
		color: #333;
	}
	
	.search-btn {
		height: 56rpx;
		line-height: 56rpx;
		font-size: 26rpx;
		padding: 0 20rpx;
		background-color: #3170f9;
		color: #fff;
		border-radius: 28rpx;
		margin: 0;
	}
}

.category-scroll {
	width: 100%;
	white-space: nowrap;
	padding: 5rpx 0;
}

.category-list {
	display: inline-flex;
	padding: 0 10rpx;
}

.category-item {
	display: inline-flex;
	align-items: center;
	padding: 10rpx 20rpx;
	margin: 0 10rpx;
	font-size: 28rpx;
	color: #666;
	border-radius: 30rpx;
	background-color: #f5f5f5;
	transition: all 0.3s;
	
	&.active {
		background-color: #3170f9;
		color: #fff;
		
		.tag-count {
			color: rgba(255, 255, 255, 0.8);
		}
	}
	
	.tag-count {
		font-size: 22rpx;
		color: #999;
		margin-left: 6rpx;
	}
}

/* APP和小程序文章列表样式 */
.mp-content {
	padding: 0;
}

.article-list {
	height: calc(100vh - 180rpx);
	width: 100%;
}

.article-card {
	margin: 20rpx;
	padding: 20rpx;
	background-color: #fff;
	border-radius: 12rpx;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
	// 设置合理的最小高度
	min-height: 200rpx;
	// 限制最大高度，防止卡片过高
	max-height: 600rpx;
	// 允许内容溢出时滚动
	overflow: hidden;
}

.user-info {
	display: flex;
	align-items: center;
	margin-bottom: 15rpx;
	
	.avatar {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		margin-right: 15rpx;
		background-color: #f2f2f2;
	}
	
	.nickname {
		font-size: 28rpx;
		color: #333;
		flex: 1;
	}
	
	.follow-btn {
		font-size: 24rpx;
		padding: 6rpx 20rpx;
		background-color: #f0f2f7;
		color: #3170f9;
		border-radius: 30rpx;
		margin: 0;
		line-height: 1.5;
		
		&.followed {
			background-color: #e6f0ff;
			color: #3170f9;
		}
	}
}

.article-content {
	padding: 10rpx 0;
	
	// 针对无封面文章的样式调整
	&.no-cover {
		.article-title {
			font-size: 34rpx;
			margin-bottom: 20rpx;
		}
		
		.article-summary {
			font-size: 30rpx;
			margin-bottom: 20rpx;
		}
		
		.article-tags {
			margin-top: 15rpx;
		}
	}
	
	.article-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #222;
		line-height: 1.4;
		margin-bottom: 15rpx;
		display: block;
		// 添加文本溢出处理
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2; // 最多显示2行
		-webkit-box-orient: vertical;
	}
	
	.article-summary {
		font-size: 28rpx;
		color: #666;
		line-height: 1.5;
		margin-bottom: 15rpx;
		display: block;
		// 添加文本溢出处理
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 3; // 最多显示3行
		-webkit-box-orient: vertical;
		word-break: break-all; // 允许在任意字符间断行
	}
}

.article-image {
	width: 100%;
	margin: 15rpx 0;
	border-radius: 8rpx;
	overflow: hidden;
	
	.single-image {
		width: 100%;
		height: 340rpx;
		display: block;
		object-fit: cover; // 确保图片正确裁剪，不变形
	}
}

.article-tags {
	display: flex;
	flex-wrap: wrap;
	margin: 10rpx 0;
	
	.tag-item {
		display: inline-block;
		padding: 5rpx 15rpx;
		font-size: 22rpx;
		color: #3170f9;
		background-color: #f0f2f7;
		border-radius: 20rpx;
		margin-right: 15rpx;
		margin-bottom: 10rpx;
	}
}

.article-actions {
	display: flex;
	justify-content: space-between;
	padding-top: 15rpx;
	border-top: 1rpx solid #f0f2f7;
	
	.action-item {
		display: flex;
		align-items: center;
		padding: 0 10rpx;
		
		text {
			font-size: 24rpx;
			color: #666;
			margin-left: 8rpx;
			
			&.liked {
				color: #ff6b6b;
			}
			
			&.collected {
				color: #ffc107;
			}
		}
	}
}

.loading-state {
	padding: 30rpx;
	text-align: center;
	color: #999;
	font-size: 26rpx;
}

.animate-icon {
	animation: scale-animation 0.5s;
}

@keyframes scale-animation {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.3);
	}
	100% {
		transform: scale(1);
	}
}

/* 媒体查询适配不同设备 */
@media screen and (min-width: 768px) {
	.category-item {
		font-size: 30rpx;
		padding: 12rpx 24rpx;
	}
	
	.search-bar {
		height: 80rpx;
		
		input {
			font-size: 30rpx;
		}
		
		.search-btn {
			height: 64rpx;
			line-height: 64rpx;
			font-size: 28rpx;
		}
	}
}
</style>