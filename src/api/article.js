/**
 * 文章相关API接口封装
 * 文件位置: /src/api/article.js
 * 
 * 该文件封装了所有与文章相关的API请求，包括：
 * - 发布文章
 * - 更新文章
 * - 获取文章详情
 * - 获取文章列表
 * - 点赞/取消点赞文章
 * - 收藏/取消收藏文章
 * 
 * 所有API都基于/src/utils/request.js中的请求工具，
 * 确保了请求的一致性和错误处理。
 */

import http from '@/utils/request';

// 获取服务器基础URL，使用request.js中导出的方法确保一致性
const baseUrl = http.config.baseUrl;

/**
 * 发布文章
 * @param {Object} articleData - 文章数据
 * @param {string} articleData.title - 文章标题
 * @param {string} articleData.content - 文章纯文本内容
 * @param {string} articleData.htmlContent - 文章HTML内容
 * @param {Array<string>} articleData.tags - 文章标签
 * @param {Array<string>} articleData.images - 文章图片
 * @param {string} articleData.coverImage - 文章封面图片
 * @return {Promise} - 返回包含发布结果的Promise
 */
export function publishArticle(articleData) {
  // 准备需要上传的所有图片路径
  const allImagePaths = [];
  
  // 添加文章正文中的图片
  if (articleData.images && articleData.images.length > 0) {
    allImagePaths.push(...articleData.images);
  }
  
  // 添加封面图片（如果有且不在正文图片中）
  if (articleData.coverImage && !allImagePaths.includes(articleData.coverImage)) {
    allImagePaths.push(articleData.coverImage);
  }
  
  // 如果有图片需要上传
  if (allImagePaths.length > 0) {
    return uploadArticleImages(allImagePaths).then(imageUrls => {
      // 替换文章内容中的本地图片路径为服务器URL
      let htmlContent = articleData.htmlContent;
      let coverImageUrl = null;
      
      // 遍历所有本地图片路径和对应的服务器URL
      articleData.images.forEach((localPath, index) => {
        const serverUrl = imageUrls[allImagePaths.indexOf(localPath)];
        if (serverUrl) {
          // 替换HTML内容中的图片路径，确保img标签中的src被正确替换
          const regex = new RegExp(`src=["']${localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g');
          htmlContent = htmlContent.replace(regex, `src="${serverUrl}"`);
        }
      });
      
      // 获取封面图片URL
      if (articleData.coverImage) {
        const coverIndex = allImagePaths.indexOf(articleData.coverImage);
        if (coverIndex !== -1 && imageUrls[coverIndex]) {
          coverImageUrl = imageUrls[coverIndex];
        }
      }
      
      // 构建发布请求数据
      const requestData = {
        title: articleData.title,
        content: articleData.content,
        htmlContent: htmlContent,
        tags: articleData.tags,
        coverImage: coverImageUrl, // 使用专门的封面图片
        wordCount: articleData.wordCount || articleData.content.length // 添加字数统计
      };
      
      // 发送发布请求
      return http.post('/api/article', requestData);
    });
  } else {
    // 无图片的情况，直接发送请求
    return http.post('/api/article', {
      title: articleData.title,
      content: articleData.content,
      htmlContent: articleData.htmlContent,
      tags: articleData.tags,
      coverImage: null,
      wordCount: articleData.wordCount || articleData.content.length
    });
  }
}

/**
 * 更新文章
 * @param {Object} articleData - 文章数据，包含id
 * @return {Promise} - 返回包含更新结果的Promise
 */
export function updateArticle(articleData) {
  // 检查是否包含id
  if (!articleData.id) {
    return Promise.reject(new Error('缺少文章ID'));
  }
  
  // 准备需要上传的图片路径
  const allLocalImages = [];
  
  // 检查正文图片中的本地路径
  if (articleData.images && articleData.images.length > 0) {
    // 过滤出本地图片路径（需要上传的图片）
    const localContentImages = articleData.images.filter(img => !img.startsWith('http'));
    if (localContentImages.length > 0) {
      allLocalImages.push(...localContentImages);
    }
  }
  
  // 检查封面图片是否是本地路径
  if (articleData.coverImage && !articleData.coverImage.startsWith('http')) {
    if (!allLocalImages.includes(articleData.coverImage)) {
      allLocalImages.push(articleData.coverImage);
    }
  }
  
  // 如果有本地图片需要上传
  if (allLocalImages.length > 0) {
    return uploadArticleImages(allLocalImages).then(imageUrls => {
      // 替换文章内容中的本地图片路径为服务器URL
      let htmlContent = articleData.htmlContent;
      let coverImageUrl = articleData.coverImage;
      
      // 遍历所有本地图片路径和对应的服务器URL
      allLocalImages.forEach((localPath, index) => {
        if (index < imageUrls.length) {
          const serverUrl = imageUrls[index];
          
          // 替换HTML内容中的本地图片路径
          const regex = new RegExp(`src=["']${localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g');
          htmlContent = htmlContent.replace(regex, `src="${serverUrl}"`);
          
          // 如果是封面图片，更新封面图片URL
          if (localPath === articleData.coverImage) {
            coverImageUrl = serverUrl;
          }
        }
      });
      
      // 构建更新请求数据
      const requestData = {
        id: articleData.id,
        title: articleData.title,
        content: articleData.content,
        htmlContent: htmlContent,
        tags: articleData.tags,
        coverImage: coverImageUrl,
        wordCount: articleData.wordCount || articleData.content.length
      };
      
      // 发送更新请求
      return http.put(`/api/article/${articleData.id}`, requestData);
    });
  }
  
  // 无新图片或仅有远程图片的情况，直接发送请求
  return http.put(`/api/article/${articleData.id}`, {
    id: articleData.id,
    title: articleData.title,
    content: articleData.content,
    htmlContent: articleData.htmlContent,
    tags: articleData.tags,
    coverImage: articleData.coverImage,
    wordCount: articleData.wordCount || articleData.content.length
  });
}

/**
 * 上传文章图片
 * @param {Array<string>} imagePaths - 本地图片路径数组
 * @return {Promise<Array<string>>} - 返回服务器图片URL数组的Promise
 */
function uploadArticleImages(imagePaths) {
  // 如果没有图片，直接返回空数组
  if (!imagePaths || imagePaths.length === 0) {
    return Promise.resolve([]);
  }
  
  // 创建图片上传任务数组
  const uploadTasks = imagePaths.map(path => {
    return new Promise((resolve, reject) => {
      // 获取图片信息，用于传递宽高参数
      uni.getImageInfo({
        src: path,
        success: (imageInfo) => {
          uni.uploadFile({
            url: `${baseUrl}/api/article/upload-image`, // 使用统一的baseUrl
            filePath: path,
            name: 'image',
            formData: {
              // 传递图片类型，判断是否为封面图
              type: path === imagePaths[imagePaths.length - 1] && 
                    imagePaths[imagePaths.length - 1] === imagePaths.find(p => p === path) ? 
                    'cover' : 'content',
              width: imageInfo.width,
              height: imageInfo.height
            },
            header: {
              Authorization: `Bearer ${uni.getStorageSync('token') || ''}`
            },
            success: (res) => {
              try {
                // 处理返回的数据
                let data;
                if (typeof res.data === 'string') {
                  data = JSON.parse(res.data);
                } else {
                  data = res.data;
                }
                
                if (data.code === 200 && data.data && data.data.imageUrl) {
                  resolve(data.data.imageUrl);
                } else {
                  console.error('上传图片失败', data);
                  reject(new Error(data.message || '上传图片失败'));
                }
              } catch (e) {
                console.error('解析上传结果失败', e, res.data);
                reject(new Error('解析上传结果失败'));
              }
            },
            fail: (err) => {
              console.error('上传请求失败', err);
              reject(err);
            }
          });
        },
        fail: (err) => {
          console.error('获取图片信息失败', err);
          // 获取图片信息失败时，仍尝试上传
          uni.uploadFile({
            url: `${baseUrl}/api/article/upload-image`,
            filePath: path,
            name: 'image',
            formData: {
              type: 'content' // 默认为内容图片
            },
            header: {
              Authorization: `Bearer ${uni.getStorageSync('token') || ''}`
            },
            success: (res) => {
              try {
                const data = JSON.parse(res.data);
                if (data.code === 200 && data.data && data.data.imageUrl) {
                  resolve(data.data.imageUrl);
                } else {
                  reject(new Error(data.message || '上传图片失败'));
                }
              } catch (e) {
                reject(new Error('解析上传结果失败'));
              }
            },
            fail: (err) => {
              reject(err);
            }
          });
        }
      });
    });
  });
  
  // 并行上传所有图片
  return Promise.all(uploadTasks)
    .catch(err => {
      console.error('图片上传过程中出错', err);
      uni.showToast({
        title: '部分图片上传失败',
        icon: 'none'
      });
      return Promise.reject(err);
    });
}

/**
 * 获取文章列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.pageSize - 每页条数，默认10
 * @param {string} params.tag - 标签筛选
 * @param {string} params.keyword - 关键词搜索
 * @return {Promise} - 返回包含文章列表的Promise
 */
export function getArticleList(params) {
  return http.get('/api/article', params);
}

/**
 * 获取文章详情
 * @param {number} articleId - 文章ID
 * @return {Promise} - 返回包含文章详情的Promise
 */
export function getArticleDetail(articleId) {
  return http.get(`/api/article/${articleId}`);
}

/**
 * 点赞/取消点赞文章
 * @param {number} articleId - 文章ID
 * @param {boolean} isLike - 是否点赞，true为点赞，false为取消点赞
 * @return {Promise} - 返回操作结果的Promise
 */
export function likeArticle(articleId, isLike) {
  return isLike ? 
    http.post(`/api/article/like/${articleId}`) : 
    http.delete(`/api/article/like/${articleId}`);
}

/**
 * 收藏/取消收藏文章
 * @param {number} articleId - 文章ID
 * @param {boolean} isCollect - 是否收藏，true为收藏，false为取消收藏
 * @return {Promise} - 返回操作结果的Promise
 */
export function collectArticle(articleId, isCollect) {
  return isCollect ? 
    http.post(`/api/article/collect/${articleId}`) : 
    http.delete(`/api/article/collect/${articleId}`);
}

/**
 * 获取文章评论列表
 * @param {number} articleId - 文章ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.pageSize - 每页条数，默认10
 * @return {Promise} - 返回包含评论列表的Promise
 */
export function getArticleComments(articleId, params) {
  return http.get(`/api/article/${articleId}/comments`, params);
}

/**
 * 发表评论
 * @param {number} articleId - 文章ID
 * @param {Object} commentData - 评论数据
 * @param {string} commentData.content - 评论内容
 * @param {number} [commentData.parentId] - 父评论ID（回复评论时必需）
 * @param {number} [commentData.replyUserId] - 被回复用户ID（回复评论时必需）
 * @return {Promise} - 返回包含新评论信息的Promise
 */
export function commentArticle(articleId, commentData) {
  return http.post(`/api/article/${articleId}/comment`, commentData);
}

/**
 * 获取用户收藏的文章列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.pageSize - 每页条数，默认10
 * @return {Promise} - 返回包含收藏文章列表的Promise
 */
export function getCollectedArticles(params) {
  return http.get('/api/article/collections', params);
}

/**
 * 获取文章标签列表
 * @return {Promise} - 返回包含标签列表的Promise
 */
export function getArticleTags() {
  return http.get('/api/article/tags');
}

/**
 * 获取用户发表的文章列表
 * @param {number} userId - 用户ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.pageSize - 每页条数，默认10
 * @return {Promise} - 返回包含用户文章列表的Promise
 */
export function getUserArticles(userId, params) {
  return http.get(`/api/user/${userId}/articles`, {
    ...params,
    type: 'posts'
  });
}

/**
 * 获取用户点赞的文章列表
 * @param {number} userId - 用户ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.pageSize - 每页条数，默认10
 * @return {Promise} - 返回包含用户点赞文章列表的Promise
 */
export function getUserLikedArticles(userId, params) {
  return http.get(`/api/user/${userId}/articles`, {
    ...params,
    type: 'likes'
  });
} 