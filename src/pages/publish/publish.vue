<template>
	<view class="container">
		<view class="publish-header">
			<!-- 返回按钮 -->
			<view class="back-btn" @click="showExitConfirm">
				<uni-icons type="closeempty" size="24" color="#333"></uni-icons>
			</view>

			<!-- 发布按钮 -->
			<view class="publish-btn" @click="publishArticle">
				<text>{{ publishBtnText }}</text>
			</view>
		</view>

		<view class="publish-content">
			<!-- 标题输入 -->
			<view class="title-input">
				<input type="text" v-model="articleData.title" placeholder="请输入标题" class="input-field" />
			</view>

			<!-- 富文本编辑器区域 -->
			<view class="rich-editor-container">
				<!-- 编辑器工具栏 -->
				<view class="editor-format-toolbar" v-if="showFormattingToolbar">
					<view class="format-btn" @click="applyFormat('bold')">
						<uni-icons type="bold" size="20" color="#333"></uni-icons>
					</view>
					<view class="format-btn" @click="applyFormat('link')">
						<uni-icons type="link" size="20" color="#333"></uni-icons>
					</view>
				</view>

				<!-- 富文本编辑器 -->
				<rich-text class="rich-display" :nodes="renderedContent" v-if="previewMode"></rich-text>

				<editor v-else id="editor" class="rich-editor" :class="{'editor-height': showFormattingToolbar}"
					:placeholder="'请输入正文'" @ready="onEditorReady" @input="onEditorInput" @paste="handlePaste"
					@focus="editorFocus" @blur="editorBlur"></editor>

				<!-- 预览切换按钮 -->
				<view class="preview-toggle" @click="togglePreview">
					<text>{{ previewMode ? '编辑模式' : '预览模式' }}</text>
				</view>
			</view>
		</view>

		<!-- 标签展示区域 - 移到内容区域外，固定在底部工具栏上方 -->
		<view v-if="articleData.tags.length > 0" class="article-tags-area">
			<text class="tags-title">文章标签</text>
			<view class="article-tag-list">
				<view v-for="(tag, index) in articleData.tags" :key="index" class="article-tag-item">
					<text>{{ tag }}</text>
				</view>
			</view>
		</view>

		<!-- 底部工具栏 -->
		<view class="editor-toolbar">
			<view class="toolbar-item" @click="showTextFormatting">
				<uni-icons type="font" size="24" color="#333"></uni-icons>
				<text class="toolbar-text">文字</text>
			</view>
			<view class="toolbar-item" @click="insertImage">
				<uni-icons type="image" size="24" color="#333"></uni-icons>
				<text class="toolbar-text">上传图片</text>
			</view>
			<!-- 删除撤销和重做按钮 -->
			<view class="toolbar-item" @click="showTagSelector">
				<uni-icons type="tag" size="24" color="#333"></uni-icons>
				<text class="toolbar-text">添加标签</text>
			</view>
		</view>

		<!-- 标签选择弹窗 -->
		<uni-popup ref="tagPopup" type="bottom">
			<view class="tag-popup-content">
				<view class="tag-popup-header">
					<text class="tag-popup-title">添加标签</text>
					<view class="tag-popup-close" @click="closeTagPopup">
						<uni-icons type="close" size="20" color="#666"></uni-icons>
					</view>
				</view>

				<!-- 自定义标签输入区域 -->
				<view class="custom-tag-input">
					<input type="text" v-model="customTagInput" placeholder="输入自定义标签" class="tag-input-field"
						@confirm="addCustomTag" />
					<button class="add-tag-btn" @click="addCustomTag">添加</button>
				</view>

				<!-- 已选标签展示 -->
				<view v-if="selectedTags.length > 0" class="selected-tags-section">
					<text class="section-title">已选标签</text>
					<view class="tag-list">
						<view v-for="(tag, index) in selectedTags" :key="'selected-'+index"
							class="tag-item tag-selected">
							<text>{{ tag }}</text>
							<view class="tag-delete" @click.stop="removeTag(tag)">
								<uni-icons type="close" size="12" color="#fff"></uni-icons>
							</view>
						</view>
					</view>
				</view>

				<!-- 推荐标签区域 -->
				<view class="recommended-tags-section">
					<text class="section-title">推荐标签</text>
					<view class="tag-list">
						<view v-for="(tag, index) in availableTags" :key="'recommend-'+index" class="tag-item"
							:class="{ 'tag-selected': selectedTags.includes(tag) }" @click="toggleTag(tag)">
							<text>{{ tag }}</text>
						</view>
					</view>
				</view>

				<view class="tag-popup-footer">
					<button class="tag-confirm-btn" @click="confirmTagSelection">确认</button>
				</view>
			</view>
		</uni-popup>

		<!-- 链接插入弹窗 -->
		<uni-popup ref="linkPopup" type="dialog">
			<uni-popup-dialog title="插入链接" :before-close="true" @confirm="confirmInsertLink" @close="closeLinkPopup"
				confirmText="确认" cancelText="取消">
				<view class="link-input-container">
					<input class="link-input" type="text" v-model="linkUrl" placeholder="请输入链接URL" />
					<input class="link-text-input" type="text" v-model="linkText" placeholder="请输入链接文本" />
				</view>
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script setup>
	import {
		ref,
		reactive,
		onBeforeUnmount,
		onMounted,
		nextTick,
		computed
	} from 'vue';
	import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup';
	import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';

	// 引入uni-popup组件
	const tagPopup = ref(null);
	const linkPopup = ref(null);

	// 自定义标签输入
	const customTagInput = ref('');

	// 链接相关
	const linkUrl = ref('');
	const linkText = ref('');

	// 是否已经确认离开
	let isConfirmedExit = false;

	// 编辑器实例
	let editorCtx = null;
	const showFormattingToolbar = ref(false);
	const previewMode = ref(false);
	const editorContent = ref('');

	// 计算属性：渲染后的内容
	const renderedContent = computed(() => {
		return editorContent.value;
	});

	// 添加模式和文章ID变量
	const mode = ref('new'); // 默认为新建模式，可能的值: 'new', 'edit'
	const articleId = ref(null); // 编辑模式下存储文章ID

	// 文章数据
	const articleData = reactive({
		id: null,
		title: '',
		content: '',
		htmlContent: '',
		images: [],
		tags: [] // 添加标签字段
	});

	// 发布按钮文本
	const publishBtnText = computed(() => {
		return mode.value === 'edit' ? '更新' : '发布';
	});

	// 可选标签列表
	const availableTags = ref([
		'技术', '生活', '旅行', '美食', '教育',
		'健康', '时尚', '科技', '游戏', '娱乐',
		'艺术', '体育', '音乐', '电影', '书籍'
	]);

	// 已选标签
	const selectedTags = ref([]);

	// 编辑器准备完成
	const onEditorReady = () => {
		// #ifdef MP-WEIXIN || H5
		uni.createSelectorQuery()
			.select('#editor')
			.context(res => {
				editorCtx = res.context;
				// 设置初始内容
				if (articleData.htmlContent) {
					editorCtx.setContents({
						html: articleData.htmlContent,
						fail: err => {
							console.error('设置内容失败:', err);
						}
					});
				}
			})
			.exec();
		// #endif
	};

	// 编辑器内容变化
	const onEditorInput = (e) => {
		// 存储编辑器的最新内容
		articleData.htmlContent = e.detail.html || '';
		articleData.content = e.detail.text || '';
		editorContent.value = e.detail.html || '';
	};

	// 处理粘贴事件
	const handlePaste = async (e) => {
		// 粘贴内容处理逻辑
		console.log('粘贴了内容', e);
		// 可以在这里对粘贴内容进行额外处理，例如过滤、清理样式等
	};

	// 编辑器获取焦点
	const editorFocus = () => {
		// 当编辑器获得焦点时可以做一些操作
	};

	// 编辑器失去焦点
	const editorBlur = () => {
		// 当编辑器失去焦点时可以做一些操作
	};

	// 切换预览模式
	const togglePreview = () => {
		previewMode.value = !previewMode.value;
	};

	// 添加自定义标签
	const addCustomTag = () => {
		const tagValue = customTagInput.value.trim();

		// 验证标签是否为空
		if (!tagValue) {
			uni.showToast({
				title: '标签不能为空',
				icon: 'none'
			});
			return;
		}

		// 验证标签长度
		if (tagValue.length > 10) {
			uni.showToast({
				title: '标签最多10个字符',
				icon: 'none'
			});
			return;
		}

		// 检查标签是否已存在
		if (selectedTags.value.includes(tagValue)) {
			uni.showToast({
				title: '该标签已添加',
				icon: 'none'
			});
			return;
		}

		// 添加标签到已选列表
		selectedTags.value.push(tagValue);

		// 清空输入框
		customTagInput.value = '';

		uni.showToast({
			title: '标签已添加',
			icon: 'success'
		});
	};

	// 移除标签
	const removeTag = (tag) => {
		const index = selectedTags.value.indexOf(tag);
		if (index > -1) {
			selectedTags.value.splice(index, 1);
		}
	};

	// 显示标签选择器
	const showTagSelector = () => {
		// 打开前，先将已有的标签设置为选中状态
		selectedTags.value = [...articleData.tags];
		customTagInput.value = '';
		tagPopup.value.open();
	};

	// 关闭标签选择器
	const closeTagPopup = () => {
		tagPopup.value.close();
	};

	// 切换标签选中状态
	const toggleTag = (tag) => {
		const index = selectedTags.value.indexOf(tag);
		if (index > -1) {
			// 如果已选中，则取消选中
			selectedTags.value.splice(index, 1);
		} else {
			// 如果未选中，则添加到选中列表
			selectedTags.value.push(tag);
		}
	};

	// 确认标签选择
	const confirmTagSelection = () => {
		articleData.tags = [...selectedTags.value];
		closeTagPopup();

		uni.showToast({
			title: '标签添加成功',
			icon: 'success'
		});
	};

	// 显示链接插入弹窗
	const showLinkPopup = () => {
		linkUrl.value = '';
		linkText.value = '';
		linkPopup.value.open();
	};

	// 关闭链接插入弹窗
	const closeLinkPopup = () => {
		linkPopup.value.close();
	};

	// 确认插入链接
	const confirmInsertLink = () => {
		if (!linkUrl.value.trim()) {
			uni.showToast({
				title: '请输入链接URL',
				icon: 'none'
			});
			return;
		}

		// 如果没有输入链接文本，就使用URL作为文本
		const text = linkText.value.trim() || linkUrl.value;

		if (editorCtx) {
			editorCtx.insertLink({
				text: text,
				url: linkUrl.value
			});
		}

		closeLinkPopup();
	};

	// 清空内容并刷新页面
	const clearAndRefresh = () => {
		// 清空所有内容
		articleData.title = '';
		articleData.content = '';
		articleData.htmlContent = '';
		editorContent.value = '';
		if (editorCtx) {
			editorCtx.clear();
		}
		articleData.images = [];
		articleData.tags = [];
		selectedTags.value = [];

		// 标记已确认离开
		isConfirmedExit = true;
	};

	// 显示退出确认弹窗
	const showExitConfirm = () => {
		// 判断是否有编辑内容，如果没有直接返回
		if (!articleData.title.trim() && !articleData.content.trim() &&
			articleData.images.length === 0 && articleData.tags.length === 0) {
			// 清空内容并标记为已确认离开
			clearAndRefresh();
			// 返回上一页面而不是跳转到首页
			uni.navigateBack();
			return;
		}

		// 显示确认对话框
		uni.showModal({
			title: '确认退出',
			content: '您有未保存的内容，确定要退出吗？',
			confirmText: '确认退出',
			cancelText: '继续编辑',
			success: (res) => {
				if (res.confirm) {
					// 用户点击确认，清空内容并退出
					clearAndRefresh();
					// 返回上一页面而不是跳转到首页
					uni.navigateBack();
				}
				// 用户点击取消，不做任何操作
			}
		});
	};

	// 监听页面后退按钮
	const listenBackButton = () => {
		// #ifdef APP-PLUS
		const pages = getCurrentPages();
		const page = pages[pages.length - 1];
		const currentWebview = page.$getAppWebview();

		currentWebview.addEventListener('backpress', (e) => {
			e.preventDefault();
			showExitConfirm();
		});
		// #endif
	};

	// 拦截底部TabBar点击事件
	const listenTabBarClicks = () => {
		// #ifdef APP-PLUS || MP-WEIXIN
		uni.addInterceptor('switchTab', {
			invoke(e) {
				// 如果当前是发布页面，且有编辑内容，则拦截跳转
				if (hasContent()) {
					showExitConfirm();
					return false; // 阻止跳转
				}
				return true; // 允许跳转
			}
		});
		// #endif
	};

	// 检查是否有内容
	const hasContent = () => {
		return articleData.title.trim() ||
			articleData.content.trim() ||
			articleData.images.length > 0 ||
			articleData.tags.length > 0;
	};

	// 页面挂载时添加监听
	onMounted(() => {
		listenBackButton();
		listenTabBarClicks();
		
		// 获取页面参数
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		const options = currentPage.$page?.options || currentPage.options || {};
		
		// 检查是否有mode和articleData参数
		if (options.mode === 'edit' && options.articleData) {
			try {
				// 解码并解析文章数据
				const decodedData = decodeURIComponent(options.articleData);
				const parsedData = JSON.parse(decodedData);
				
				// 设置为编辑模式
				mode.value = 'edit';
				
				// 填充文章数据
				articleData.id = parsedData.id;
				articleData.title = parsedData.title || '';
				articleData.content = parsedData.content || '';
				articleData.htmlContent = parsedData.htmlContent || parsedData.content || ''; // 使用HTML内容或普通内容
				
				// 填充标签
				if (Array.isArray(parsedData.tags)) {
					articleData.tags = [...parsedData.tags];
					selectedTags.value = [...parsedData.tags];
				}
				
				// 填充图片
				if (Array.isArray(parsedData.images)) {
					articleData.images = [...parsedData.images];
				}
				
				console.log('编辑模式：加载文章数据', articleData);
				
				// 等待编辑器准备完成后设置内容
				nextTick(() => {
					// 编辑器在onEditorReady中会自动加载htmlContent的内容
				});
			} catch (error) {
				console.error('解析文章数据失败', error);
				uni.showToast({
					title: '加载文章数据失败',
					icon: 'none'
				});
			}
		}
	});

	// 拦截页面离开事件
	onBeforeUnmount(() => {
		// 如果已确认离开则不拦截
		if (isConfirmedExit) return;

		// 判断是否有编辑内容
		if (hasContent()) {
			showExitConfirm();
		}
	});

	// 发布文章
	const publishArticle = () => {
		// 表单验证
		if (!articleData.title.trim()) {
			uni.showToast({
				title: '请输入文章标题',
				icon: 'none'
			});
			return;
		}

		if (!articleData.content.trim()) {
			uni.showToast({
				title: '请输入文章内容',
				icon: 'none'
			});
			return;
		}

		// 根据模式显示不同的加载提示
		uni.showLoading({
			title: mode.value === 'edit' ? '更新中...' : '发布中...'
		});

		// 根据模式构建不同的请求数据
		const requestData = {
			title: articleData.title,
			content: articleData.content,
			htmlContent: articleData.htmlContent,
			tags: articleData.tags,
			images: articleData.images
		};
		
		// 如果是编辑模式，添加文章ID
		if (mode.value === 'edit' && articleData.id) {
			requestData.id = articleData.id;
		}

		// 这里应该是实际的API请求
		// 根据mode值调用不同的API
		setTimeout(() => {
			uni.hideLoading();
			uni.showToast({
				title: mode.value === 'edit' ? '更新成功' : '发布成功',
				icon: 'success'
			});

			// 发布成功后清空内容并标记为已确认离开
			clearAndRefresh();

			// 延迟返回上一页面
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		}, 1000);
		
		// TODO: 实际的API调用应该类似：
		/*
		if (mode.value === 'edit') {
			// 更新文章
			api.updateArticle(requestData).then(res => {
				uni.hideLoading();
				uni.showToast({
					title: '更新成功',
					icon: 'success'
				});
				clearAndRefresh();
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			}).catch(err => {
				uni.hideLoading();
				uni.showToast({
					title: '更新失败，请重试',
					icon: 'none'
				});
			});
		} else {
			// 创建新文章
			api.createArticle(requestData).then(res => {
				uni.hideLoading();
				uni.showToast({
					title: '发布成功',
					icon: 'success'
				});
				clearAndRefresh();
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			}).catch(err => {
				uni.hideLoading();
				uni.showToast({
					title: '发布失败，请重试',
					icon: 'none'
				});
			});
		}
		*/
	};

	// 插入图片
	const insertImage = () => {
		uni.chooseImage({
			count: 9,
			success: (res) => {
				// 处理选中的图片
				const tempFilePaths = res.tempFilePaths;

				// 这里处理图片上传逻辑
				uni.showLoading({
					title: '正在处理图片...'
				});

				// 模拟上传图片到服务器
				setTimeout(() => {
					uni.hideLoading();

					// 向编辑器中插入图片
					tempFilePaths.forEach(path => {
						if (editorCtx) {
							editorCtx.insertImage({
								src: path,
								width: '100%',
								success: () => {
									console.log('图片插入成功');
								}
							});
						}
					});

					// 添加到图片数组
					articleData.images = [...articleData.images, ...tempFilePaths];

					uni.showToast({
						title: '图片添加成功',
						icon: 'success'
					});
				}, 1000);
			}
		});
	};

	// 显示文本格式化工具
	const showTextFormatting = () => {
		showFormattingToolbar.value = !showFormattingToolbar.value;
	};

	// 应用格式化
	const applyFormat = (format) => {
		if (!editorCtx) return;

		switch (format) {
			case 'bold':
				editorCtx.bold();
				break;
			case 'link':
				showLinkPopup();
				break;
			default:
				break;
		}
	};

	// 撤销操作
	const undo = () => {
		if (editorCtx) {
			editorCtx.undo();
		}
	};

	// 重做操作
	const redo = () => {
		if (editorCtx) {
			editorCtx.redo();
		}
	};
</script>

<style lang="scss">
	page {
		background-color: #fff;
		min-height: 100vh;
	}

	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	/* 头部样式 */
	.publish-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		border-bottom: 1px solid #eee;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}


	.publish-btn {
		background-color: #4361ee;
		color: #fff;
		font-size: 28rpx;
		padding: 12rpx 30rpx;
		border-radius: 30rpx;
	}

	/* 内容区域 */
	.publish-content {
		flex: 1;
		padding: 30rpx;
		overflow-y: auto;
	}

	.title-input {
		margin-bottom: 30rpx;
	}

	.input-field {
		font-size: 36rpx;
		font-weight: bold;
		padding: 20rpx 0;
		border-bottom: 1px solid #eee;
	}

	/* 富文本编辑器容器 */
	.rich-editor-container {
		position: relative;
		min-height: 800rpx;
		display: flex;
		flex-direction: column;
	}

	/* 编辑器格式化工具栏 */
	.editor-format-toolbar {
		display: flex;
		flex-wrap: wrap;
		padding: 10rpx;
		background-color: #f5f5f5;
		border-radius: 8rpx;
		margin-bottom: 10rpx;
	}

	.format-btn {
		width: 70rpx;
		height: 70rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 5rpx;
	}

	.format-text {
		font-size: 30rpx;
		font-weight: bold;
	}

	/* 富文本编辑器 */
	.rich-editor {
		min-height: 800rpx;
		width: 100%;
		padding: 20rpx;
		box-sizing: border-box;
		border: 1px solid #eee;
		border-radius: 8rpx;
	}

	.editor-height {
		min-height: 1200rpx;
	}

	.rich-display {
		min-height: 800rpx;
		width: 100%;
		padding: 20rpx;
		box-sizing: border-box;
		border: 1px solid #eee;
		border-radius: 8rpx;
		background-color: #fafafa;
	}

	.preview-toggle {
		margin-top: 20rpx;
		text-align: right;
	}

	.preview-toggle text {
		color: #4361ee;
		font-size: 28rpx;
	}

	/* 链接输入容器 */
	.link-input-container {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		margin-top: 20rpx;
	}

	.link-input,
	.link-text-input {
		height: 80rpx;
		padding: 0 20rpx;
		border-radius: 8rpx;
		border: 1px solid #eee;
		background-color: #f8f8f8;
	}

	/* 文章标签展示区域 - 紧贴底部工具栏 */
	.article-tags-area {
		padding: 20rpx 30rpx;
		border-top: 1px dashed #eee;
		background-color: #f9f9f9;
	}

	.tags-title {
		font-size: 28rpx;
		color: #666;
		margin-bottom: 20rpx;
	}

	.article-tag-list {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
	}

	.article-tag-item {
		padding: 8rpx 16rpx;
		background-color: #4361ee;
		color: #fff;
		border-radius: 24rpx;
		margin-right: 16rpx;
		margin-bottom: 16rpx;
		font-size: 24rpx;
	}

	/* 底部工具栏 */
	.editor-toolbar {
		display: flex;
		justify-content: space-around;
		padding: 20rpx;
		border-top: 1px solid #eee;
		background-color: #f8f8f8;
	}

	.toolbar-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10rpx;
	}

	.toolbar-text {
		font-size: 24rpx;
		color: #666;
		margin-top: 10rpx;
	}

	/* 标签弹窗样式 */
	.tag-popup-content {
		background-color: #fff;
		padding: 30rpx;
		border-top-left-radius: 20rpx;
		border-top-right-radius: 20rpx;
		max-height: 70vh;
		overflow-y: auto;
	}

	.tag-popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.tag-popup-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.tag-popup-close {
		width: 40rpx;
		height: 40rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* 自定义标签输入区域 */
	.custom-tag-input {
		display: flex;
		margin-bottom: 20rpx;
		border-bottom: 1px solid #eee;
		padding-bottom: 20rpx;
	}

	.tag-input-field {
		flex: 1;
		height: 70rpx;
		background: #f2f2f2;
		border-radius: 35rpx;
		padding: 0 30rpx;
		font-size: 28rpx;
	}

	.add-tag-btn {
		width: 140rpx;
		height: 70rpx;
		background-color: #4361ee;
		color: white;
		border-radius: 35rpx;
		margin-left: 20rpx;
		font-size: 28rpx;
		line-height: 70rpx;
	}

	/* 标签区域 */
	.section-title {
		font-size: 28rpx;
		color: #666;
		margin-bottom: 20rpx;
		display: block;
	}

	.selected-tags-section,
	.recommended-tags-section {
		margin-bottom: 30rpx;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
	}

	.tag-item {
		display: flex;
		align-items: center;
		padding: 10rpx 20rpx;
		background-color: #f2f2f2;
		border-radius: 30rpx;
		margin: 10rpx;
		font-size: 28rpx;
		color: #666;
	}

	.tag-selected {
		background-color: #4361ee;
		color: #fff;
	}

	.tag-delete {
		margin-left: 10rpx;
		width: 24rpx;
		height: 24rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.tag-popup-footer {
		margin-top: 30rpx;
		display: flex;
		justify-content: center;
	}

	.tag-confirm-btn {
		background-color: #4361ee;
		color: #fff;
		width: 60%;
		border-radius: 40rpx;
		font-size: 30rpx;
	}
</style>