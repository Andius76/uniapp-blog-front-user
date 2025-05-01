<template>
	<view class="container">
		<!-- 头部导航栏 -->
		<view class="publish-header">
			<!-- 返回按钮 -->
			<view class="back-btn" @click="showExitConfirm">
				<uni-icons type="closeempty" size="24" color="#333"></uni-icons>
			</view>
			
			<!-- 标题 -->
			<view class="header-title">
				<text>写文章</text>
			</view>

			<!-- 发布按钮 -->
			<view class="publish-btn" @click="publishArticle">
				<text>{{ publishBtnText }}</text>
			</view>
		</view>

		<scroll-view scroll-y class="publish-content">
			<!-- 标题输入 -->
			<view class="title-input">
				<input type="text" v-model="articleData.title" placeholder="请输入标题" class="input-field" />
			</view>

			<!-- 分割线 -->
			<view class="divider"></view>

			<!-- 正文编辑区域 - 动态高度 -->
			<view class="content-wrapper">
				<!-- 富文本编辑器区域 -->
				<view class="rich-editor-container">
					<!-- 富文本编辑器 -->
					<editor id="editor" class="rich-editor" 
						:placeholder="'请输入正文'" 
						@ready="onEditorReady" 
						@input="onEditorInput" 
						@paste="handlePaste"
						@focus="editorFocus" 
						@blur="editorBlur"
						@statuschange="onStatusChange">
					</editor>
					
					<!-- 字数统计 -->
					<view class="word-count">
						<text>{{ articleData.wordCount }} 字</text>
					</view>
				</view>
			</view>
			
			<!-- 文章信息区域 - 会被挤压 -->
			<view class="article-info-area">
				<!-- 文章标签区域 -->
				<view class="article-category">
					<text class="category-label">文章标签</text>
					<view class="tag-container">
						<!-- 已添加的标签 -->
						<view v-for="(tag, index) in articleData.tags" :key="index" class="tag-item simple-tag">
							<text>{{ tag }}</text>
						</view>
					</view>
				</view>
				
				<!-- 封面图片区域 -->
				<view class="cover-section">
					<text class="section-label">文章封面</text>
					<view class="cover-container">
						<view v-if="!articleData.coverImage" class="cover-placeholder" @click="selectCoverImage">
							<uni-icons type="image" size="36" color="#999"></uni-icons>
						</view>
						<view v-else class="cover-preview">
							<image :src="articleData.coverImage" mode="aspectFill" class="cover-image"></image>
							<view class="image-delete" @click="removeCoverImage">
								<uni-icons type="close" size="16" color="#fff"></uni-icons>
							</view>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部工具栏 -->
		<view class="editor-toolbar">
			<view class="toolbar-item" @click="showFormattingToolbar">
				<view class="toolbar-icon">
					<text class="icon-text">A</text>
				</view>
				<text class="toolbar-text">文本格式</text>
			</view>
			<view class="toolbar-item" @click="insertImage">
				<view class="toolbar-icon">
					<uni-icons type="image" size="24" color="#333"></uni-icons>
				</view>
				<text class="toolbar-text">上传图片</text>
			</view>
			<view class="toolbar-item" @click="showTagSelector">
				<view class="toolbar-icon">
					<uni-icons type="paperclip" size="24" color="#333"></uni-icons>
				</view>
				<text class="toolbar-text">添加标签</text>
			</view>
		</view>

		<!-- 格式工具栏弹出层 -->
		<view class="formatting-toolbar" v-if="showFormattingTools">
			<view class="format-item" @click="applyFormat('bold')">
				<uni-icons type="bold" size="20" color="#333"></uni-icons>
			</view>
			<view class="format-item" @click="applyFormat('italic')">
				<uni-icons type="italic" size="20" color="#333"></uni-icons>
			</view>
			<view class="format-item" @click="applyFormat('underline')">
				<uni-icons type="underline" size="20" color="#333"></uni-icons>
			</view>
			<view class="format-item" @click="applyFormat('link')">
				<uni-icons type="link" size="20" color="#333"></uni-icons>
			</view>
			<view class="format-item" @click="applyFormat('h1')">
				<text class="format-text">H1</text>
			</view>
			<view class="format-item" @click="applyFormat('h2')">
				<text class="format-text">H2</text>
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
						@confirm="addCustomTag" maxlength="10" />
					<button class="add-tag-btn" @click="addCustomTag">添加</button>
				</view>

				<!-- 已选标签展示 -->
				<view v-if="selectedTags.length > 0" class="selected-tags-section">
					<text class="section-title">已选标签 ({{ selectedTags.length }}/5)</text>
					<view class="tag-list">
						<view v-for="(tag, index) in selectedTags" :key="'selected-'+index"
							class="tag-item tag-selected">
							<text>{{ tag }}</text>
							<view class="tag-delete" @click="removeSelectedTag(tag)">
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
		computed,
		watch
	} from 'vue';
	import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup';
	import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';
	import { publishArticle as publishArticleApi, updateArticle } from '@/api/article'; // 引入文章API并重命名

	// =================== 引用DOM组件 =================== //
	const tagPopup = ref(null);
	const linkPopup = ref(null);

	// =================== 状态变量 =================== //
	// 自定义标签输入
	const customTagInput = ref('');
	// 链接相关
	const linkUrl = ref('');
	const linkText = ref('');
	// 格式工具栏显示状态
	const showFormattingTools = ref(false);
	// 防止重复显示提示
	const showingExitDialog = ref(false);
	// 加载状态
	const isLoading = ref(false);
	// 编辑器实例
	let editorCtx = null;
	// 编辑器状态
	const editorStatus = reactive({
		isBold: false,
		isItalic: false,
		isUnderline: false,
		isStrike: false,
		isH1: false,
		isH2: false
	});
	// 编辑器内容
	const editorContent = ref('');
	// 是否已确认离开
	let isConfirmedExit = false;

	// =================== 文章数据对象 =================== //
	// 文章模式
	const mode = ref('new'); // 'new' 或 'edit'
	// 文章数据
	const articleData = reactive({
		id: null,
		title: '',
		content: '',
		htmlContent: '',
		images: [],
		tags: [],
		coverImage: null,
		wordCount: 0 // 字数统计
	});

	// =================== 计算属性 =================== //
	// 发布按钮文本
	const publishBtnText = computed(() => {
		return mode.value === 'edit' ? '更新' : '发布';
	});

	// 推荐标签列表
	const availableTags = ref([
		'技术', '前端开发', '后端开发', '移动开发', '设计',
		'生活', '旅行', '美食', '教育', '学习',
		'健康', '时尚', '科技', '游戏', '娱乐',
		'艺术', '体育', '音乐', '电影', '书籍'
	]);

	// 已选标签
	const selectedTags = ref([]);
	
	// =================== 编辑器方法 =================== //
	// 编辑器准备完成
	const onEditorReady = () => {
		// #ifdef MP-WEIXIN || H5 || APP-PLUS
		uni.createSelectorQuery()
			.select('#editor')
			.context(res => {
				editorCtx = res.context;
				console.log('编辑器上下文已初始化', editorCtx ? '成功' : '失败');
				// 设置初始内容
				if (articleData.htmlContent) {
					editorCtx.setContents({
						html: articleData.htmlContent,
						fail: err => {
							console.error('设置内容失败:', err);
						},
						complete: () => {
							// 内容加载完成后，调整高度
							adjustEditorHeight();
						}
					});
				} else {
					// 如果没有初始内容，也要调整一次高度
					adjustEditorHeight();
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
		
		// 更新字数统计
		articleData.wordCount = e.detail.text ? e.detail.text.length : 0;
		
		// 自动调整编辑器高度
		nextTick(() => {
			adjustEditorHeight();
		});
	};
	
	// 编辑器状态变化
	const onStatusChange = (e) => {
		const formats = e.detail || {};
		
		// 更新编辑器状态
		editorStatus.isBold = !!formats.bold;
		editorStatus.isItalic = !!formats.italic;
		editorStatus.isUnderline = !!formats.underline;
		editorStatus.isStrike = !!formats.strike;
		editorStatus.isH1 = formats.header === 1;
		editorStatus.isH2 = formats.header === 2;
	};

	// 添加调整编辑器高度的方法
	const adjustEditorHeight = () => {
		// 尝试获取编辑器内容和计算合适的高度
		if (editorCtx) {
			editorCtx.getContents({
				success: (res) => {
					// 获取内容
					const text = res.text || '';
					const html = res.html || '';
					
					// 根据内容计算高度
					// 1. 基础高度为300rpx
					let estimatedHeight = 300;
					
					// 2. 按字符数计算基本高度 (每10个字符约增加3rpx)
					estimatedHeight += Math.floor(text.length / 10) * 3;
					
					// 3. 统计换行符数量，每个换行符增加行高
					const lineCount = (text.match(/\n/g) || []).length;
					estimatedHeight += lineCount * 40; // 假设每行高度约40rpx
					
					// 4. 检测图片数量
					const imgCount = (html.match(/<img/g) || []).length;
					estimatedHeight += imgCount * 300; // 每张图片估算300rpx
					
					// 确保最小高度
					estimatedHeight = Math.max(300, estimatedHeight);
					
					// 为了更好的视觉效果，增加一些缓冲空间
					estimatedHeight += 100;
					
					// 设置编辑器高度
					// 方法1: 直接设置DOM元素样式 (适用于H5和APP)
					// #ifdef H5 || APP-PLUS
					const editorEl = document.getElementById('editor');
					if (editorEl) {
						editorEl.style.minHeight = `${estimatedHeight}rpx`;
					}
					// #endif
					
					// 方法2: 通过选择器设置样式 (更通用的方法)
					uni.createSelectorQuery()
						.select('#editor')
						.fields({
							size: true,
							rect: true
						}, (data) => {
							if (data) {
								// 获取编辑器元素并设置样式
								uni.createSelectorQuery()
									.select('#editor')
									.node(res => {
										if (res && res.node) {
											res.node.style.minHeight = `${estimatedHeight}rpx`;
										}
									})
									.exec();
							}
						})
						.exec();
					
					// 记录当前内容长度，供下次比较
					articleData.wordCount = text.length;
				}
			});
		}
	};

	// 处理粘贴事件
	const handlePaste = async (e) => {
		// 检查剪贴板是否包含图片
		const items = (e.clipboardData || window.clipboardData).items;
		if (items && items.length) {
			for (let i = 0; i < items.length; i++) {
				if (items[i].type.indexOf('image') !== -1) {
					const blob = items[i].getAsFile();
					
					// 显示加载中
					uni.showLoading({
						title: '处理图片中...'
					});
					
					const reader = new FileReader();
					reader.onload = function(event) {
						const imageUrl = event.target.result;
						
						// 处理粘贴的图片
						if (editorCtx) {
							// 获取图片信息
							const img = new Image();
							img.onload = function() {
								// 计算适当尺寸
								const maxWidth = uni.getSystemInfoSync().windowWidth * 0.8;
								const ratio = img.width / img.height;
								const width = Math.min(maxWidth, img.width);
								const height = width / ratio;
								
								// 插入图片
								editorCtx.insertImage({
									src: imageUrl,
									width: width + 'px',
									height: height + 'px',
									alt: '粘贴的图片',
									extClass: 'article-content-image',
									success: () => {
										// 添加到图片数组
										articleData.images.push(imageUrl);
										uni.hideLoading();
									},
									fail: (err) => {
										console.error('插入图片失败:', err);
										uni.hideLoading();
									}
								});
							};
							img.src = imageUrl;
						} else {
							uni.hideLoading();
						}
					};
					reader.readAsDataURL(blob);
					break;
				}
			}
		}
	};

	// 编辑器获取焦点
	const editorFocus = () => {
		// 隐藏格式工具栏
		showFormattingTools.value = false;
	};

	// 编辑器失去焦点
	const editorBlur = () => {
		// 不做任何处理
	};

	// 显示格式工具栏
	const showFormattingToolbar = () => {
		showFormattingTools.value = !showFormattingTools.value;
	};

	// 应用格式化
	const applyFormat = (format) => {
		if (!editorCtx) {
			uni.showToast({
				title: '编辑器未初始化',
				icon: 'none'
			});
			return;
		}

		switch (format) {
			case 'bold':
				editorCtx.bold();
				break;
			case 'italic':
				editorCtx.italic();
				break;
			case 'underline':
				editorCtx.underline();
				break;
			case 'h1':
				editorCtx.header({ size: 1 });
				break;
			case 'h2':
				editorCtx.header({ size: 2 });
				break;
			case 'link':
				showLinkPopup();
				break;
			default:
				console.warn(`未知的格式化类型: ${format}`);
				break;
		}
	};

	// =================== 标签相关方法 =================== //
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
		
		// 检查已选标签数量
		if (selectedTags.value.length >= 5) {
			uni.showToast({
				title: '最多只能添加5个标签',
				icon: 'none'
			});
			return;
		}

		// 添加标签到已选列表
		selectedTags.value.push(tagValue);

		// 清空输入框
		customTagInput.value = '';
	};

	// 移除标签
	const removeTag = (tag) => {
		const index = articleData.tags.indexOf(tag);
		if (index > -1) {
			articleData.tags.splice(index, 1);
			
			uni.showToast({
				title: '标签已移除',
				icon: 'success'
			});
		}
	};
	
	// 移除选中标签
	const removeSelectedTag = (tag) => {
		const index = selectedTags.value.indexOf(tag);
		if (index > -1) {
			selectedTags.value.splice(index, 1);
		}
	};

	// 显示标签选择器
	const showTagSelector = () => {
		// 如果已经有5个标签，则提示
		if (articleData.tags.length >= 5) {
			uni.showToast({
				title: '最多只能添加5个标签',
				icon: 'none'
			});
			return;
		}
		
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
			// 检查是否已满5个标签
			if (selectedTags.value.length >= 5) {
				uni.showToast({
					title: '最多只能添加5个标签',
					icon: 'none'
				});
				return;
			}
			
			// 如果未选中，则添加到选中列表
			selectedTags.value.push(tag);
		}
	};

	// 确认标签选择
	const confirmTagSelection = () => {
		articleData.tags = [...selectedTags.value];
		closeTagPopup();

		uni.showToast({
			title: '标签已添加',
			icon: 'success'
		});
	};

	// =================== 链接相关方法 =================== //
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
				title: '请输入链接地址',
				icon: 'none'
			});
			return;
		}
		
		// 如果链接不以http://或https://开头，则添加https://
		let url = linkUrl.value.trim();
		if (!/^https?:\/\//i.test(url)) {
			url = 'https://' + url;
		}

		// 如果没有输入链接文本，就使用URL作为文本
		const text = linkText.value.trim() || url;

		if (editorCtx) {
			editorCtx.insertLink({
				text: text,
				url: url
			});
		}

		closeLinkPopup();
	};

	// =================== 图片相关方法 =================== //
	// 插入图片
	const insertImage = () => {
		// 首先确认编辑器上下文是否已初始化
		if (!editorCtx) {
			uni.showToast({
				title: '编辑器未初始化',
				icon: 'none'
			});
			return;
		}

		uni.chooseImage({
			count: 9,
			success: (res) => {
				// 处理选中的图片
				const tempFilePaths = res.tempFilePaths;
				
				// 显示加载中提示
				uni.showLoading({
					title: '处理图片中...'
				});
				
				// 模拟上传图片到服务器
				setTimeout(() => {
					// 添加到图片数组
					articleData.images = [...articleData.images, ...tempFilePaths];
					
					// 逐个插入图片到编辑器
					tempFilePaths.forEach((path, index) => {
						// 为每个图片添加唯一标识
						const imageId = `img_${Date.now()}_${index}`;
						
						// 获取图片信息
						uni.getImageInfo({
							src: path,
							success: (imageInfo) => {
								// 计算适当尺寸
								const maxWidth = uni.getSystemInfoSync().windowWidth * 0.8;
								const ratio = imageInfo.width / imageInfo.height;
								const width = Math.min(maxWidth, imageInfo.width);
								const height = width / ratio;
								
								// 插入图片到编辑器，并添加删除功能的标记
								editorCtx.insertImage({
									src: path,
									width: width + 'px',
									height: height + 'px',
									alt: `文章图片${index+1}`,
									extClass: 'article-content-image',
									data: {
										imageId: imageId
									},
									success: () => {
										// 生成带有删除按钮的HTML
										const deleteButton = `
											<div class="image-delete-wrapper" data-image-id="${imageId}" data-image-path="${path}" style="position:relative;display:inline-block;margin:10px 0;">
												<img src="${path}" style="max-width:100%;height:auto;border-radius:4px;" />
												<div class="image-delete-btn" data-image-id="${imageId}" data-image-path="${path}" style="position:absolute;top:8px;right:8px;width:24px;height:24px;background-color:rgba(0,0,0,0.5);border-radius:12px;display:flex;justify-content:center;align-items:center;color:white;font-size:16px;cursor:pointer;">×</div>
											</div>
										`;
										
										// 如果是最后一张图片，隐藏加载提示
										if (index === tempFilePaths.length - 1) {
											uni.hideLoading();
											uni.showToast({
												title: '图片添加成功',
												icon: 'success'
											});
										}
									},
									fail: (err) => {
										console.error('插入图片失败:', err);
										if (index === tempFilePaths.length - 1) {
											uni.hideLoading();
										}
									}
								});
							},
							fail: () => {
								// 获取图片信息失败，使用默认尺寸
								editorCtx.insertImage({
									src: path,
									width: '80%',
									alt: `文章图片${index+1}`,
									extClass: 'article-content-image'
								});
								
								// 如果是最后一张图片，隐藏加载提示
								if (index === tempFilePaths.length - 1) {
									uni.hideLoading();
								}
							}
						});
					});
				}, 500);
			}
		});
	};

	// 直接从编辑器中删除图片
	const removeImageFromEditor = (imagePath) => {
		// 确认删除对话框
		uni.showModal({
			title: '删除图片',
			content: '确定要删除这张图片吗？',
			success: (res) => {
				if (res.confirm) {
					// 从数组中移除图片
					const index = articleData.images.indexOf(imagePath);
					if (index > -1) {
						articleData.images.splice(index, 1);
					}
					
					// 更新富文本编辑器内容，从HTML中移除对应图片
					if (editorCtx) {
						// 获取当前HTML内容
						editorCtx.getContents({
							success: (res) => {
								let currentHtml = res.html || '';
								// 替换包含该图片路径的img标签及其父容器
								const imgWrapperRegex = new RegExp(`<div[^>]*class="image-delete-wrapper"[^>]*data-image-path="${imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\\s\\S]*?<\/div>`, 'g');
								currentHtml = currentHtml.replace(imgWrapperRegex, '');
								
								// 替换普通img标签
								const imgRegex = new RegExp(`<img[^>]*src=["']${imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'g');
								currentHtml = currentHtml.replace(imgRegex, '');
								
								// 设置新的内容
								editorCtx.setContents({
									html: currentHtml
								});
							}
						});
					}
					
					uni.showToast({
						title: '图片已删除',
						icon: 'success'
					});
				}
			}
		});
	};
	
	// =================== 封面图片相关方法 =================== //
	// 选择封面图片
	const selectCoverImage = () => {
		uni.chooseImage({
			count: 1, // 只选择一张图片作为封面
			success: (res) => {
				const tempFilePath = res.tempFilePaths[0];
				
				// 显示加载中提示
				uni.showLoading({
					title: '处理封面图片...'
				});
				
				// 设置封面图片
				setTimeout(() => {
					uni.hideLoading();
					articleData.coverImage = tempFilePath;
					
					uni.showToast({
						title: '封面设置成功',
						icon: 'success'
					});
				}, 500);
			}
		});
	};
	
	// 删除封面图片
	const removeCoverImage = () => {
		uni.showModal({
			title: '删除封面',
			content: '确定要删除封面图片吗？',
			success: (res) => {
				if (res.confirm) {
					articleData.coverImage = null;
					uni.showToast({
						title: '封面已删除',
						icon: 'success'
					});
				}
			}
		});
	};

	// =================== 页面退出与保存相关方法 =================== //
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
		articleData.coverImage = null;
		selectedTags.value = [];

		// 标记已确认离开
		isConfirmedExit = true;
	};

	// 退出确认弹窗
	const showExitConfirm = () => {
		// 如果已经显示了对话框，则不再重复显示
		if (showingExitDialog.value) return;
		
		// 判断是否有编辑内容，如果没有直接返回
		if (!hasContent()) {
			// 清空内容并标记为已确认离开
			clearAndRefresh();
			// 返回上一页面
			uni.navigateBack();
			return;
		}

		// 标记正在显示对话框
		showingExitDialog.value = true;

		// 显示确认对话框
		uni.showModal({
			title: '确认退出',
			content: '有未保存的内容，确定要退出吗？',
			confirmText: '退出',
			confirmColor: '#FF4D4F',
			cancelText: '继续编辑',
			success: (res) => {
				// 标记对话框已关闭
				showingExitDialog.value = false;
				
				if (res.confirm) {
					// 用户点击确认，清空内容并退出
					clearAndRefresh();
					// 返回上一页面
					uni.navigateBack();
				}
			},
			fail: () => {
				// 确保对话框关闭时重置标记
				showingExitDialog.value = false;
			}
		});
	};

	// 检查是否有内容
	const hasContent = () => {
		return articleData.title.trim() ||
			articleData.content.trim() ||
			articleData.images.length > 0 ||
			articleData.tags.length > 0 ||
			articleData.coverImage !== null;
	};
	
	// 发布或更新文章
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
		
		// 防止重复提交
		if (isLoading.value) {
			return;
		}
		
		// 设置加载状态
		isLoading.value = true;

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
			images: articleData.images,
			coverImage: articleData.coverImage,
			wordCount: articleData.wordCount
		};
		
		// 如果是编辑模式，添加文章ID
		if (mode.value === 'edit' && articleData.id) {
			requestData.id = articleData.id;
		}

		// 根据模式调用不同的API
		const apiCall = mode.value === 'edit' 
			? updateArticle(requestData) 
			: publishArticleApi(requestData);
			
		apiCall.then(res => {
			uni.hideLoading();
			isLoading.value = false;
			
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
		}).catch(err => {
			uni.hideLoading();
			isLoading.value = false;
			
			console.error('发布失败', err);
			uni.showToast({
				title: err.message || '发布失败，请重试',
				icon: 'none'
			});
		});
	};

	// =================== 生命周期方法 =================== //
	// 页面挂载时添加监听
	onMounted(() => {
		// 监听返回按钮和TabBar点击
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
				articleData.htmlContent = parsedData.htmlContent || parsedData.content || '';
				articleData.wordCount = parsedData.wordCount || parsedData.content?.length || 0;
				
				// 填充标签
				if (Array.isArray(parsedData.tags)) {
					articleData.tags = [...parsedData.tags];
					selectedTags.value = [...parsedData.tags];
				}
				
				// 填充图片
				if (Array.isArray(parsedData.images)) {
					articleData.images = [...parsedData.images];
				}
				
				// 填充封面图片
				if (parsedData.coverImage) {
					articleData.coverImage = parsedData.coverImage;
				}
				
				console.log('编辑模式：加载文章数据', articleData);
			} catch (error) {
				console.error('解析文章数据失败', error);
				uni.showToast({
					title: '加载文章数据失败',
					icon: 'none'
				});
			}
		}
		
		// 监听编辑器中图片删除按钮的点击事件
		document.addEventListener('click', (e) => {
			// 检查点击的元素是否是图片删除按钮
			if (e.target && e.target.classList.contains('image-delete-btn')) {
				// 获取图片路径
				const imagePath = e.target.getAttribute('data-image-path');
				if (imagePath) {
					// 调用删除方法
					removeImageFromEditor(imagePath);
				}
			}
		});
	});

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

	// 拦截页面离开事件
	onBeforeUnmount(() => {
		// 如果已确认离开则不拦截
		if (isConfirmedExit) return;

		// 判断是否有编辑内容
		if (hasContent()) {
			showExitConfirm();
		}
		
		// 移除图片删除事件监听
		document.removeEventListener('click', () => {});
	});
</script>

<style lang="scss">
	// 主题颜色变量
	$primary-color: #4361ee;
	$text-color: #333333;
	$text-secondary: #666666;
	$text-light: #999999;
	$border-color: #eeeeee;
	$bg-white: #ffffff;
	$bg-light: #f5f5f5;
	$danger-color: #ff4d4f;
	
	page {
		background-color: $bg-white;
		color: $text-color;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
	}
	
	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}
	
	/* ========== 头部样式 ========== */
	.publish-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 90rpx;
		padding: 0 30rpx;
		border-bottom: 1rpx solid $border-color;
		background-color: $bg-white;
		position: relative;
	}
	
	.back-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.header-title {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		font-size: 32rpx;
		font-weight: 500;
	}
	
	.publish-btn {
		background-color: $primary-color;
		color: $bg-white;
		font-size: 28rpx;
		padding: 10rpx 30rpx;
		border-radius: 30rpx;
		
		text {
			color: $bg-white;
		}
	}
	
	/* ========== 内容区域 ========== */
	.publish-content {
		flex: 1;
		padding: 0 30rpx;
		padding-bottom: 120rpx; /* 增加底部内边距，比工具栏高度多一些 */
		box-sizing: border-box;
		position: relative;
	}
	
	.content-wrapper {
		margin-bottom: 30rpx;
		position: relative;
		flex: 1;
	}
	
	.article-info-area {
		position: relative;
		z-index: 1;
		background-color: $bg-white;
	}
	
	/* 标题输入 */
	.title-input {
		padding: 30rpx 0;
	}
	
	.input-field {
		font-size: 36rpx;
		font-weight: 500;
		width: 100%;
	}
	
	/* 分割线 */
	.divider {
		height: 1rpx;
		background-color: $border-color;
		width: 100%;
		margin-bottom: 30rpx;
	}
	
	/* 富文本编辑器 */
	.rich-editor-container {
		width: 100%;
		min-height: 300rpx;
		margin-bottom: 30rpx;
		position: relative;
		z-index: 2; /* 确保编辑器在正确的层级 */
		overflow: visible;
		transition: min-height 0.2s; /* 添加平滑过渡 */
	}
	
	.rich-editor {
		width: 100%;
		min-height: 300rpx;
		height: auto;
		font-size: 30rpx;
		line-height: 1.6;
		padding: 20rpx 0;
		box-sizing: border-box;
		transition: min-height 0.2s; /* 添加平滑过渡 */
	}
	
	/* 标签区域 */
	.article-category {
		margin-top: 30rpx;
		margin-bottom: 30rpx;
	}
	
	.category-label, .section-label {
		font-size: 28rpx;
		color: $text-secondary;
		margin-bottom: 20rpx;
		display: block;
	}
	
	.tag-container {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}
	
	/* 正文下方的标签样式 */
	.article-category .tag-item {
		display: flex;
		align-items: center;
		padding: 8rpx 16rpx;
		border-radius: 30rpx;
		font-size: 24rpx;
		background-color: $primary-color;
		color: $bg-white;
		
		text {
			color: $bg-white;
		}
		
		&.simple-tag {
			background-color: rgba(67, 97, 238, 0.15);
			border: 1rpx solid rgba(67, 97, 238, 0.3);
			
			text {
				color: $primary-color;
			}
		}
	}
	
	.add-tag {
		width: 60rpx;
		height: 60rpx;
		background-color: rgba(67, 97, 238, 0.05);
		border: 1rpx dashed rgba(67, 97, 238, 0.3);
		border-radius: 30rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	/* 弹窗中的标签样式 */
	.tag-list .tag-item {
		display: flex;
		align-items: center;
		padding: 10rpx 20rpx;
		background-color: $bg-light;
		border-radius: 30rpx;
		font-size: 26rpx;
		color: $text-secondary;
		transition: all 0.2s ease;
		
		&.tag-selected {
			background-color: rgba(67, 97, 238, 0.15);
			border: 1rpx solid rgba(67, 97, 238, 0.3);
			color: $primary-color;
			
			text {
				color: $primary-color;
			}
		}
	}
	
	.tag-delete {
		width: 28rpx;
		height: 28rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-left: 8rpx;
	}
	
	.tag-popup-footer {
		margin-top: 30rpx;
		display: flex;
		justify-content: center;
	}
	
	.tag-confirm-btn {
		width: 60%;
		height: 80rpx;
		background-color: $primary-color;
		color: $bg-white;
		border-radius: 40rpx;
		font-size: 30rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	/* 封面区域 */
	.cover-section {
		margin-top: 30rpx;
		margin-bottom: 30rpx;
	}
	
	.cover-container {
		width: 100%;
		position: relative;
	}
	
	.cover-placeholder {
		width: 300rpx;
		height: 200rpx;
		background-color: $bg-light;
		border-radius: 10rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.cover-preview {
		width: 300rpx;
		height: 200rpx;
		position: relative;
		border-radius: 10rpx;
		overflow: hidden;
	}
	
	.cover-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.image-delete {
		position: absolute;
		top: 10rpx;
		right: 10rpx;
		width: 40rpx;
		height: 40rpx;
		background-color: rgba(0, 0, 0, 0.5);
		border-radius: 20rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10;
	}
	
	/* ========== 底部工具栏 ========== */
	.editor-toolbar {
		height: 100rpx;
		display: flex;
		justify-content: space-around;
		align-items: center;
		background-color: $bg-white;
		border-top: 1rpx solid $border-color;
		position: fixed; /* 固定定位 */
		bottom: 0; /* 固定在底部 */
		left: 0; /* 左边缘对齐 */
		right: 0; /* 右边缘对齐 */
		width: 100%; /* 宽度100% */
		z-index: 999; /* 确保在最上层 */
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05); /* 添加顶部阴影，提升视觉层次 */
	}
	
	.toolbar-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.toolbar-icon {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.icon-text {
		font-size: 28rpx;
		font-weight: bold;
	}
	
	.toolbar-text {
		font-size: 24rpx;
		color: $text-secondary;
		margin-top: 6rpx;
	}
	
	/* ========== 格式工具栏 ========== */
	.formatting-toolbar {
		position: fixed;
		bottom: 100rpx;
		left: 0;
		right: 0;
		background-color: $bg-white;
		display: flex;
		padding: 20rpx;
		justify-content: space-around;
		border-top: 1rpx solid $border-color;
		z-index: 100;
		animation: slideUp 0.3s ease;
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	
	.format-item {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 10rpx;
		
		&:active {
			background-color: $bg-light;
		}
	}
	
	.format-text {
		font-size: 28rpx;
		font-weight: bold;
	}
	
	/* ========== 标签弹窗 ========== */
	.tag-popup-content {
		background-color: $bg-white;
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
	}
	
	.tag-popup-close {
		width: 40rpx;
		height: 40rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.custom-tag-input {
		display: flex;
		margin-bottom: 30rpx;
	}
	
	.tag-input-field {
		flex: 1;
		height: 80rpx;
		background-color: $bg-light;
		border-radius: 40rpx;
		padding: 0 30rpx;
		font-size: 28rpx;
	}
	
	.add-tag-btn {
		width: 140rpx;
		height: 80rpx;
		background-color: $primary-color;
		color: $bg-white;
		border-radius: 40rpx;
		margin-left: 20rpx;
		font-size: 28rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.section-title {
		font-size: 28rpx;
		color: $text-secondary;
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
		gap: 16rpx;
	}
	
	/* ========== 链接弹窗 ========== */
	.link-input-container {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		padding: 20rpx 0;
	}
	
	.link-input,
	.link-text-input {
		height: 80rpx;
		background-color: $bg-light;
		border-radius: 8rpx;
		padding: 0 20rpx;
		margin-bottom: 20rpx;
	}
	
	/* ========== 编辑器内图片样式 ========== */
	.article-content-image {
		max-width: 100%;
		height: auto;
		margin: 20rpx 0;
		border-radius: 10rpx;
		position: relative;
		display: inline-block;
	}
	
	/* 图片删除按钮样式 */
	.image-delete-wrapper {
		position: relative;
		display: inline-block;
		margin: 10rpx 0;
		
		.image-delete-btn {
			position: absolute;
			top: 10rpx;
			right: 10rpx;
			width: 40rpx;
			height: 40rpx;
			background-color: rgba(0, 0, 0, 0.5);
			border-radius: 20rpx;
			display: flex;
			justify-content: center;
			align-items: center;
			color: $bg-white;
			font-size: 28rpx;
		}
	}
	
	/* 字数统计样式 */
	.word-count {
		position: absolute;
		bottom: 0;
		right: 0;
		padding: 6rpx 12rpx;
		font-size: 24rpx;
		color: $text-light;
		background-color: rgba(255, 255, 255, 0.8);
		border-radius: 6rpx;
	}
</style>