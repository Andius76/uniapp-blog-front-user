<template>
	<view class="container">
		<!-- 固定在顶部的标题和分类选择栏 -->
		<view class="header-fixed">
			<view class="header-main-container">
				<!-- 搜索栏 -->
				<view class="header-top">
					<view class="search-bar">
						<input type="text" placeholder="请输入搜索标签" v-model="searchText" @confirm="handleSearch" />
						<view class="clear-icon" v-if="searchText.length > 0" @click="clearSearch">
							<uni-icons type="clear" size="18" color="#999"></uni-icons>
						</view>
						<button class="search-btn" @click="handleSearch">搜索</button>
					</view>
				</view>

				<!-- 分类标签导航 -->
				<view class="category-scroll-container">
					<scroll-view class="category-scroll" scroll-x show-scrollbar="false" scroll-with-animation @scroll="handleTagsScroll">
						<view class="category-list">
							<view 
								v-for="(tag, index) in defaultTagList" 
								:key="index" 
								class="category-item" 
								:class="{ 'active': currentTag === tag.name }"
								@click="switchCategory(tag.name)"
							>
								<text class="tag-name">{{ tag.name }}</text>
							</view>
						</view>
					</scroll-view>
					<view class="scroll-indicator-left" v-if="showLeftIndicator"></view>
					<view class="scroll-indicator-right" v-if="showRightIndicator"></view>
				</view>
			</view>
		</view>

		<!-- 内容区域，使用ArticleList组件 -->
		<!-- #ifdef H5 -->
		<view class="content-area">
			<ArticleList 
				ref="articleListRef"
				:key="currentTag === searchText && searchText ? 'search-'+searchText : 'tag-'+currentTag" 
				:list-type="currentTag === searchText && searchText ? 'search' : 'tag'"
				:tag-name="currentTag === '全部' ? '' : currentTag"
				:keyword="currentTag === searchText && searchText ? searchText : ''"
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
				refresher-default-style="black"
				refresher-background="#f5f5f5"
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
import { collectArticle, likeArticle, getArticleTags } from '@/api/article'; // 导入文章操作API
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

// 滚动指示器状态
const showLeftIndicator = ref(false);
const showRightIndicator = ref(true);

// 监听标签栏滚动事件
const handleTagsScroll = (e) => {
	const { scrollLeft, scrollWidth, width } = e.detail;
	showLeftIndicator.value = scrollLeft > 20;
	showRightIndicator.value = scrollLeft < scrollWidth - width - 20;
};

// 默认推荐标签（与发布页面保持一致）
const defaultTags = [
	'全部', '技术', '前端开发', '后端开发', '移动开发', '设计',
	'生活', '旅行', '美食', '教育', '学习',
	'健康', '时尚', '科技', '游戏', '娱乐',
	'艺术', '体育', '音乐', '电影', '书籍'
];

// 文章列表数据（小程序和APP环境使用）
const articleList = ref([]);
const isLoading = ref(false);
const isRefreshing = ref(false);
const noMoreData = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);

// 标签相关
const allTags = ref([]); // 存储所有标签数据
const defaultTagList = ref([]); // 存储默认标签列表（用于显示）
const currentTag = ref('全部');
const emptyText = ref('该分类下暂无文章');

// 获取文章标签列表
const loadTags = async () => {
	try {
		// 先使用默认标签初始化
		defaultTagList.value = defaultTags.map(tag => ({
			name: tag,
			count: 0,
			isDefault: true
		}));
		
		// 从服务器获取标签数据
		const res = await getArticleTags();
		if (res.code === 200 && Array.isArray(res.data)) {
			// 保存所有标签数据（包括用户创建的）
			allTags.value = res.data;
			
			// 计算所有文章的总数量（用于"全部"标签）
			let totalCount = 0;
			
			// 更新默认标签的文章数量
			defaultTagList.value.forEach((tag, index) => {
				if (tag.name === '全部') return; // 先跳过全部标签
				
				const serverTag = res.data.find(t => t.name === tag.name);
				if (serverTag) {
					tag.count = serverTag.count || 0;
					totalCount += tag.count; // 累加计数到总数
				}
			});
			
			// 另外遍历一次服务器标签，累加非默认标签的数量
			res.data.forEach(tag => {
				if (!defaultTags.includes(tag.name)) {
					totalCount += tag.count || 0;
				}
			});
			
			// 更新"全部"标签的计数
			const allTag = defaultTagList.value.find(t => t.name === '全部');
			if (allTag) {
				allTag.count = totalCount;
			}
			
			console.log('标签数量统计完成，全部标签数量:', totalCount);
		}
		
		// 延迟执行加载文章，确保标签已经加载完成
		// #ifndef H5
		setTimeout(() => {
			// 初始加载全部分类的文章
			loadArticles(true);
		}, 100);
		// #endif
		
	} catch (error) {
		console.error('获取标签列表失败:', error);
		uni.showToast({
			title: '获取标签列表失败',
			icon: 'none'
		});
		
		// 即使标签加载失败，也加载默认的全部文章
		// #ifndef H5
		setTimeout(() => {
			loadArticles(true);
		}, 100);
		// #endif
	}
};

// 根据搜索文本过滤标签
const filteredTags = computed(() => {
	// 如果有搜索文本，过滤标签
	if (searchText.value) {
		return defaultTagList.value.filter(tag => 
			tag.name.toLowerCase().includes(searchText.value.toLowerCase())
		);
	}
	// 没有搜索文本，返回所有默认标签
	return defaultTagList.value;
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
	// 下一帧滚动到选中的标签
	nextTick(() => {
		// 获取所有标签元素
		const tagElements = document.querySelectorAll('.category-item');
		// 找到当前选中的标签索引
		let activeIndex = -1;
		tagElements.forEach((el, index) => {
			if (el.classList.contains('active')) {
				activeIndex = index;
			}
		});
		
		// 如果找到了当前标签，滚动到它的位置
		if (activeIndex >= 0 && tagElements[activeIndex]) {
			const scrollView = document.querySelector('.category-scroll');
			if (scrollView) {
				const tagElement = tagElements[activeIndex];
				const tagLeft = tagElement.offsetLeft;
				const tagWidth = tagElement.offsetWidth;
				const scrollWidth = scrollView.offsetWidth;
				
				// 计算滚动位置，使标签居中
				const scrollTo = tagLeft - (scrollWidth / 2) + (tagWidth / 2);
				scrollView.scrollLeft = Math.max(0, scrollTo);
			}
		}
	});
	// #endif
	
	// H5环境不需要手动刷新，因为:key的变化会触发组件重新渲染
	// #ifdef H5
	console.log('H5环境切换标签，将通过key触发组件重新渲染');
	// #endif
	
	// #ifndef H5
	// 对于APP和小程序环境，直接刷新文章列表
	// 重置分页数据
	currentPage.value = 1;
	noMoreData.value = false;
	articleList.value = [];
	
	// 手动触发加载新标签的文章
	loadArticles(true);
	
	// APP和小程序环境下，需要把滚动条移到顶部
	setTimeout(() => {
		// 滚动到顶部
		scrollToTop();
	}, 100);
	// #endif
};

// 处理搜索
const handleSearch = async () => {
	isSearching.value = true;
	
	// 如果搜索框为空，则重置为全部分类
	if (!searchText.value.trim()) {
		switchCategory('全部');
		isSearching.value = false;
		return;
	}
	
	// 显示加载提示
	uni.showLoading({
		title: '搜索中...'
	});
	
	try {
		// 调用搜索API，根据关键词搜索标签相关的文章
		const res = await http.get('/api/article/search', {
			keyword: searchText.value,
			tag: searchText.value, // 将搜索文本作为标签参数
			page: 1,
			pageSize: 10
		});
		
		uni.hideLoading();
		
		if (res.code === 200 && res.data) {
			// 提取搜索结果中的标签
			const searchResults = res.data.list || [];
			let foundTag = false;
			
			// 先查找是否有精确匹配的标签
			// 1. 先在默认标签中搜索
			const foundInDefault = defaultTagList.value.find(tag => 
				tag.name.toLowerCase() === searchText.value.toLowerCase()
			);
			
			if (foundInDefault) {
				// 如果在默认标签中找到，直接切换
				switchCategory(foundInDefault.name);
				foundTag = true;
			} else {
				// 2. 在所有标签中搜索
				const foundInAll = allTags.value.find(tag => 
					tag.name.toLowerCase() === searchText.value.toLowerCase()
				);
				
				if (foundInAll) {
					// 如果在所有标签中找到，切换到该标签
					switchCategory(foundInAll.name);
					foundTag = true;
				} else {
					// 3. 如果没有精确匹配的标签，从搜索结果中提取所有标签
					const tagsFromResults = new Set();
					
					// 从搜索结果中收集所有标签
					searchResults.forEach(article => {
						if (article.tags && Array.isArray(article.tags)) {
							article.tags.forEach(tag => {
								// 检查标签名是否包含搜索文本
								if (tag.toLowerCase().includes(searchText.value.toLowerCase())) {
									tagsFromResults.add(tag);
								}
							});
						}
					});
					
					// 如果从搜索结果中找到相关标签
					if (tagsFromResults.size > 0) {
						// 使用第一个匹配的标签
						const matchedTag = Array.from(tagsFromResults)[0];
						switchCategory(matchedTag);
						foundTag = true;
						
						uni.showToast({
							title: `已找到相关标签: ${matchedTag}`,
							icon: 'none'
						});
					}
				}
			}
			
			// 如果没有找到任何相关标签
			if (!foundTag) {
				// 如果搜索结果不为空，可能有相关文章但标签不完全匹配
				if (searchResults.length > 0) {
					// 创建一个临时标签
					currentTag.value = searchText.value;
					
					// 更新空内容提示信息
					emptyText.value = `正在显示"${searchText.value}"的搜索结果`;
					
					// 在ArticleList组件刷新时，传入搜索关键词
					if (articleListRef.value) {
						// 重置当前状态
						articleListRef.value.resetList();
						
						// 等待下一个渲染周期，确保组件能够正确接收新的props
						nextTick(() => {
							// 触发ArticleList组件加载搜索结果
							articleListRef.value.loadArticles(true);
						});
					}
					
					// #ifndef H5
					// 在非H5环境下需要手动加载搜索结果
					loadArticlesWithKeyword(searchText.value);
					// #endif
				} else {
					// 没有找到任何相关标签或文章
					uni.showToast({
						title: `没有找到"${searchText.value}"相关标签或文章`,
						icon: 'none'
					});
					
					// 更新空内容提示信息
					emptyText.value = `没有找到关于"${searchText.value}"的标签或文章`;
					
					// 可以考虑保持在当前标签，或者切换到全部
					// switchCategory('全部');
				}
			}
		} else {
			// API请求失败
			uni.showToast({
				title: res.message || '搜索失败',
				icon: 'none'
			});
		}
	} catch (err) {
		uni.hideLoading();
		uni.showToast({
			title: '搜索失败，请稍后重试',
			icon: 'none'
		});
		console.error('搜索标签失败:', err);
	} finally {
		isSearching.value = false;
	}
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

// 处理文章加载
const loadArticles = (isRefresh = false) => {
	// 如果已经在加载中，则不重复加载
	if (isLoading.value && !isRefresh) return;
	
	console.log('[loadArticles] 开始加载文章, 当前标签:', currentTag.value, '是否刷新:', isRefresh);
	
	isLoading.value = true;
	
	// 如果是刷新，重置页码和数据
	if (isRefresh) {
		currentPage.value = 1;
		noMoreData.value = false;
		articleList.value = [];
	}
	
	// 确保在搜索模式下使用搜索API
	if (currentTag.value === searchText.value && searchText.value) {
		// 搜索模式
		loadArticlesWithKeyword(searchText.value);
	} else {
		// 标签模式
		loadTagArticles();
	}
};

// 处理下拉刷新
const handleRefresh = () => {
	isRefreshing.value = true;
	console.log('[handleRefresh] 开始下拉刷新, 当前标签:', currentTag.value);
	
	// 重置分页数据
	currentPage.value = 1;
	noMoreData.value = false;
	
	// 通过setTimeout避免UI卡顿
	setTimeout(() => {
		// 根据当前模式决定刷新方法
		if (currentTag.value === searchText.value && searchText.value) {
			// 搜索模式刷新
			console.log('[handleRefresh] 刷新搜索结果:', searchText.value);
			loadArticlesWithKeyword(searchText.value);
		} else {
			// 标签模式刷新
			console.log('[handleRefresh] 刷新标签文章:', currentTag.value);
			articleList.value = []; // 清空当前列表
			loadArticles(true);
		}
		
		// 在刷新完成后重置状态
		setTimeout(() => {
			isRefreshing.value = false;
		}, 500);
	}, 300);
};

// 处理加载更多
const handleLoadMore = async () => {
	// 如果已经没有更多数据或正在加载中，则不处理
	if (noMoreData.value || isLoading.value) return;
	
	isLoading.value = true;
	
	// 判断当前是普通标签还是搜索模式
	if (currentTag.value === searchText.value && searchText.value) {
		// 搜索模式下加载更多
		try {
			// 调用搜索API
			const res = await http.get('/api/article/search', {
				keyword: searchText.value,
				tag: searchText.value,
				page: currentPage.value,
				pageSize: 10
			});
			
			if (res.code === 200 && res.data) {
				const searchResults = res.data.list || [];
				
				// 如果没有更多结果
				if (searchResults.length === 0) {
					noMoreData.value = true;
					isLoading.value = false;
					return;
				}
				
				// 处理搜索结果数据
				const processedArticles = searchResults.map(article => {
					// 处理作者头像
					if (article.author && article.author.avatar) {
						article.author.avatar = formatAvatarUrl(article.author.avatar);
					}
					
					// 处理封面图片
					if (article.coverImage) {
						article.coverImage = formatArticleImage(article.coverImage);
					} else if (article.cover_image) {
						article.coverImage = formatArticleImage(article.cover_image);
					}
					
					// 处理标签
					if (article.tags && !Array.isArray(article.tags)) {
						try {
							if (typeof article.tags === 'string') {
								article.tags = JSON.parse(article.tags);
							}
						} catch (e) {
							article.tags = [];
						}
					}
					
					return article;
				});
				
				// 追加到文章列表
				articleList.value = [...articleList.value, ...processedArticles];
				
				// 更新页码
				currentPage.value++;
				
				// 判断是否还有更多数据
				if (searchResults.length < 10) {
					noMoreData.value = true;
				}
			} else {
				// 处理搜索失败
				uni.showToast({
					title: res.message || '加载更多失败',
					icon: 'none'
				});
			}
		} catch (err) {
			console.error('加载更多搜索结果失败:', err);
			uni.showToast({
				title: '网络异常，请稍后重试',
				icon: 'none'
			});
		} finally {
			isLoading.value = false;
		}
	} else {
		// 普通标签模式下加载更多
		loadTagArticles();
	}
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
	
	// #ifdef H5
	// H5环境中，使用ArticleList组件加载文章
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
	
	// #ifdef H5
	// 初始滚动到激活的标签
	nextTick(() => {
		const activeTagElement = document.querySelector('.category-item.active');
		if (activeTagElement) {
			const scrollView = document.querySelector('.category-scroll');
			if (scrollView) {
				const tagLeft = activeTagElement.offsetLeft;
				const tagWidth = activeTagElement.offsetWidth;
				const scrollWidth = scrollView.offsetWidth;
				
				// 计算滚动位置，使标签居中
				const scrollTo = tagLeft - (scrollWidth / 2) + (tagWidth / 2);
				scrollView.scrollLeft = Math.max(0, scrollTo);
			}
		}
	});
	// #endif
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

// 处理标签点击事件
const handleTagClick = (tag) => {
	// 切换到被点击的标签
	switchCategory(tag);
	
	// 清空搜索框
	searchText.value = '';
};

/**
 * 加载带关键词的文章（用于非H5环境）
 * @param {String} keyword - 搜索关键词
 */
const loadArticlesWithKeyword = async (keyword) => {
	if (!keyword) return;
	
	console.log('[loadArticlesWithKeyword] 开始搜索关键词:', keyword);
	
	isLoading.value = true;
	noMoreData.value = false;
	currentPage.value = 1;
	articleList.value = [];
	
	try {
		// 调用搜索API获取文章
		const res = await http.get('/api/article/search', {
			keyword: keyword,
			tag: keyword, // 同时将关键词作为标签搜索
			page: 1,
			pageSize: 10
		});
		
		console.log('[loadArticlesWithKeyword] 搜索结果:', res);
		
		if (res.code === 200 && res.data) {
			const searchResults = res.data.list || [];
			
			// 如果搜索结果为空
			if (searchResults.length === 0) {
				emptyText.value = `没有找到关于"${keyword}"的文章`;
				noMoreData.value = true;
				isLoading.value = false;
				return;
			}
			
			// 处理搜索结果数据
			const processedArticles = searchResults.map(article => {
				// 处理作者头像
				if (article.author && article.author.avatar) {
					article.author.avatar = formatAvatarUrl(article.author.avatar);
				}
				
				// 处理封面图片
				if (article.coverImage) {
					article.coverImage = formatArticleImage(article.coverImage);
				} else if (article.cover_image) {
					article.coverImage = formatArticleImage(article.cover_image);
				}
				
				// 处理标签，确保都是字符串数组
				if (article.tags && !Array.isArray(article.tags)) {
					try {
						if (typeof article.tags === 'string') {
							// 尝试解析JSON字符串
							article.tags = JSON.parse(article.tags);
						}
					} catch (e) {
						// 解析失败则设置为空数组
						article.tags = [];
					}
				}
				
				return article;
			});
			
			// 更新文章列表
			articleList.value = processedArticles;
			console.log('[loadArticlesWithKeyword] 加载搜索结果数量:', articleList.value.length);
			
			// 更新页码
			currentPage.value = 2;
			
			// 判断是否还有更多数据
			if (searchResults.length < 10) {
				noMoreData.value = true;
			}
		} else {
			// 处理搜索失败
			uni.showToast({
				title: res.message || '搜索失败',
				icon: 'none'
			});
			
			// 更新空内容提示
			emptyText.value = `搜索失败，请稍后重试`;
		}
	} catch (err) {
		console.error('[loadArticlesWithKeyword] 搜索关键词文章失败:', err);
		uni.showToast({
			title: '网络异常，请稍后重试',
			icon: 'none'
		});
		emptyText.value = `搜索失败，请稍后重试`;
	} finally {
		isLoading.value = false;
	}
};

/**
 * 加载特定标签的文章（用于非H5环境）
 */
const loadTagArticles = async () => {
	// 如果已经没有更多数据或正在加载中，则不处理
	if (noMoreData.value && currentPage.value > 1) {
		isLoading.value = false;
		return;
	}
	
	isLoading.value = true;
	
	try {
		// 构建请求参数
		const params = {
			page: currentPage.value,
			pageSize: 10
		};
		
		// 如果不是"全部"标签，则加上标签过滤
		if (currentTag.value !== '全部') {
			params.tag = currentTag.value;
		}
		
		console.log('[loadTagArticles] 请求参数:', params);
		
		// 发起请求
		const res = await http.get('/api/article', params);
		console.log('[loadTagArticles] 响应结果:', res);
		
		if (res.code === 200 && res.data) {
			const newArticles = res.data.list || [];
			
			// 如果没有更多文章
			if (newArticles.length === 0) {
				noMoreData.value = true;
				isLoading.value = false;
				return;
			}
			
			// 处理文章数据
			const processedArticles = newArticles.map(article => {
				// 处理作者头像
				if (article.author && article.author.avatar) {
					article.author.avatar = formatAvatarUrl(article.author.avatar);
				}
				
				// 处理封面图片
				if (article.coverImage) {
					article.coverImage = formatArticleImage(article.coverImage);
				} else if (article.cover_image) {
					article.coverImage = formatArticleImage(article.cover_image);
				}
				
				// 处理标签
				if (article.tags && !Array.isArray(article.tags)) {
					try {
						if (typeof article.tags === 'string') {
							article.tags = JSON.parse(article.tags);
						}
					} catch (e) {
						article.tags = [];
					}
				}
				
				return article;
			});
			
			// 追加到文章列表
			articleList.value = [...articleList.value, ...processedArticles];
			console.log('[loadTagArticles] 加载后的文章数量:', articleList.value.length);
			
			// 更新页码
			currentPage.value++;
			
			// 判断是否还有更多数据
			if (newArticles.length < 10) {
				noMoreData.value = true;
			}
		} else {
			// 处理请求失败
			uni.showToast({
				title: res.message || '加载失败',
				icon: 'none'
			});
		}
	} catch (err) {
		console.error('[loadTagArticles] 加载标签文章失败:', err);
		uni.showToast({
			title: '网络异常，请稍后重试',
			icon: 'none'
		});
	} finally {
		isLoading.value = false;
	}
};

// 处理清除搜索框
const clearSearch = () => {
	searchText.value = '';
};
</script>

<style lang="scss" scoped>
/* 主容器样式 */
.container {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100vh;
	background-color: #f8f9fa;
}

/* 顶部固定区域 */
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

/* 搜索栏样式 */
.search-bar {
	display: flex;
	flex: 1;
	height: 70rpx;
	background-color: #f5f5f5;
	border-radius: 35rpx;
	padding: 0 20rpx;
	align-items: center;
	margin: 10rpx 0;
	position: relative;
}

.search-bar input {
	flex: 1;
	height: 100%;
	font-size: 28rpx;
	color: #333;
	padding-right: 50rpx; /* 为清除图标预留空间 */
}

.clear-icon {
	position: absolute;
	right: 120rpx; /* 位于搜索按钮左侧 */
	display: flex;
	align-items: center;
	justify-content: center;
	width: 50rpx;
	height: 50rpx;
	z-index: 2;
}

.clear-icon:active {
	opacity: 0.7;
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

/* 分类列表区域 */
.category-scroll-container {
	position: relative;
	overflow: hidden;
}

.scroll-indicator-left,
.scroll-indicator-right {
	position: absolute;
	top: 0;
	height: 100%;
	width: 40rpx;
	z-index: 2;
	pointer-events: none;
}

.scroll-indicator-left {
	left: 0;
	background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
}

.scroll-indicator-right {
	right: 0;
	background: linear-gradient(to left, #fff, rgba(255, 255, 255, 0));
}

.category-scroll {
	width: 100%;
	white-space: nowrap;
	padding: 10rpx 0;
	background-color: #fff;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
	position: relative;
}

.category-scroll:after {
	content: '';
	position: absolute;
	right: 0;
	top: 0;
	bottom: 0;
	width: 40rpx;
	background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
	pointer-events: none;
	z-index: 1;
}

.category-list {
	display: inline-flex;
	padding: 0 20rpx;
}

.category-item {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 12rpx 24rpx;
	margin: 0 8rpx;
	font-size: 28rpx;
	color: #666;
	border-radius: 40rpx;
	background-color: #f5f5f5;
	transition: all 0.3s ease;
	box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
	min-width: 100rpx;
	position: relative;
}

.category-item:first-child {
	margin-left: 0;
}

.category-item:active {
	transform: scale(0.96);
	opacity: 0.9;
}

.category-item.active {
	background-color: #3170f9;
	color: #fff;
	font-weight: 500;
	box-shadow: 0 4rpx 8rpx rgba(49, 112, 249, 0.2);
}

.category-item.active:after {
	content: '';
	position: absolute;
	bottom: -8rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 16rpx;
	height: 6rpx;
	background-color: #3170f9;
	border-radius: 3rpx;
}

.category-item.default-tag {
	border: 1px solid #3170f9;
	background-color: rgba(49, 112, 249, 0.05);
}

.category-item.custom-tag {
	border: 1px solid #ff6b6b;
	background-color: rgba(255, 107, 107, 0.05);
}

.tag-name {
	font-size: 28rpx;
	color: #333;
	text-align: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.active .tag-name {
	color: #fff;
}

.tag-count {
	font-size: 22rpx;
	color: #999;
	margin-left: 8rpx;
	background-color: #f0f2f7;
	border-radius: 16rpx;
	padding: 2rpx 10rpx;
	min-width: 36rpx;
	text-align: center;
	font-weight: normal;
}

.active .tag-count {
	color: #fff;
	background-color: rgba(255, 255, 255, 0.25);
	box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

/* 文章列表区域 */
.content-area {
	flex: 1;
	overflow: hidden;
}

.mp-content {
	padding: 0;
}

.article-list {
	height: calc(100vh - 180rpx);
	width: 100%;
}

/* 文章卡片样式 */
.article-card {
	margin: 20rpx;
	padding: 20rpx;
	background-color: #fff;
	border-radius: 12rpx;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
	min-height: 200rpx;
	max-height: 600rpx;
	overflow: hidden;
}

/* 用户信息样式 */
.user-info {
	display: flex;
	align-items: center;
	margin-bottom: 15rpx;
}

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
}

.follow-btn.followed {
	background-color: #e6f0ff;
	color: #3170f9;
}

/* 文章内容样式 */
.article-content {
	padding: 10rpx 0;
}

.article-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #222;
	line-height: 1.4;
	margin-bottom: 15rpx;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.article-summary {
	font-size: 28rpx;
	color: #666;
	line-height: 1.5;
	margin-bottom: 15rpx;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	word-break: break-all;
}

/* 针对无封面文章的样式调整 */
.no-cover .article-title {
	font-size: 34rpx;
	margin-bottom: 20rpx;
}

.no-cover .article-summary {
	font-size: 30rpx;
	margin-bottom: 20rpx;
}

.no-cover .article-tags {
	margin-top: 15rpx;
}

/* 文章图片样式 */
.article-image {
	width: 100%;
	margin: 15rpx 0;
	border-radius: 8rpx;
	overflow: hidden;
}

.single-image {
	width: 100%;
	height: 340rpx;
	display: block;
	object-fit: cover;
}

/* 文章标签样式 */
.article-tags {
	display: flex;
	flex-wrap: wrap;
	margin: 10rpx 0;
}

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

/* 文章操作区域样式 */
.article-actions {
	display: flex;
	justify-content: space-between;
	padding-top: 15rpx;
	border-top: 1rpx solid #f0f2f7;
}

.action-item {
	display: flex;
	align-items: center;
	padding: 0 10rpx;
}

.action-item text {
	font-size: 24rpx;
	color: #666;
	margin-left: 8rpx;
}

.liked {
	color: #ff6b6b !important;
}

.collected {
	color: #ffc107 !important;
}

/* 加载状态样式 */
.loading-state {
	padding: 30rpx;
	text-align: center;
	color: #999;
	font-size: 26rpx;
}

/* 动画效果 */
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

/* 响应式布局 */
@media screen and (min-width: 768px) {
	.category-item {
		font-size: 30rpx;
		padding: 14rpx 28rpx;
		margin: 0 12rpx;
		min-width: 120rpx;
	}
	
	.tag-name {
		font-size: 30rpx;
	}
	
	.tag-count {
		font-size: 24rpx;
		padding: 2rpx 12rpx;
		min-width: 40rpx;
	}
	
	.search-bar {
		height: 80rpx;
	}
	
	.search-bar input {
		font-size: 30rpx;
	}
	
	.search-btn {
		height: 64rpx;
		line-height: 64rpx;
		font-size: 28rpx;
	}
}
</style>