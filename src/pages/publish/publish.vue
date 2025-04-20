<template>
	<view class="container">
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
				<text>发布</text>
			</view>
		</view>
		
		<view class="publish-content">
			<!-- 标题输入 -->
			<view class="title-input">
				<input 
					type="text" 
					v-model="articleData.title" 
					placeholder="请输入标题" 
					class="input-field"
				/>
			</view>
			
			<!-- 内容编辑区 -->
			<view class="content-editor">
				<textarea 
					v-model="articleData.content" 
					placeholder="请输入正文" 
					class="editor-textarea"
					auto-height
				/>
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
			<view class="toolbar-item" @click="undo">
				<uni-icons type="undo" size="24" color="#333"></uni-icons>
				<text class="toolbar-text">撤销</text>
			</view>
			<view class="toolbar-item" @click="redo">
				<uni-icons type="redo" size="24" color="#333"></uni-icons>
				<text class="toolbar-text">重做</text>
			</view>
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
				<view class="tag-list">
					<view 
						v-for="(tag, index) in availableTags" 
						:key="index" 
						class="tag-item"
						:class="{ 'tag-selected': selectedTags.includes(tag) }"
						@click="toggleTag(tag)"
					>
						<text>{{ tag }}</text>
					</view>
				</view>
				<view class="tag-popup-footer">
					<button class="tag-confirm-btn" @click="confirmTagSelection">确认</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, reactive } from 'vue';

// 引入uni-popup组件
const tagPopup = ref(null);

// 文章数据
const articleData = reactive({
	title: '',
	content: '',
	images: [],
	tags: [] // 添加标签字段
});

// 可选标签列表
const availableTags = ref([
	'技术', '生活', '旅行', '美食', '教育', 
	'健康', '时尚', '科技', '游戏', '娱乐',
	'艺术', '体育', '音乐', '电影', '书籍'
]);

// 已选标签
const selectedTags = ref([]);

// 显示标签选择器
const showTagSelector = () => {
	// 打开前，先将已有的标签设置为选中状态
	selectedTags.value = [...articleData.tags];
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

// 显示退出确认弹窗
const showExitConfirm = () => {
	// 判断是否有编辑内容，如果没有直接返回
	if (!articleData.title.trim() && !articleData.content.trim() && articleData.images.length === 0) {
		goBack();
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
				// 用户点击确认
				goBack();
			}
			// 用户点击取消，不做任何操作
		}
	});
};

// 返回首页
const goBack = () => {
	uni.switchTab({
		url: '/pages/index/index'
	});
};

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
	
	// 模拟发布请求
	uni.showLoading({
		title: '发布中...'
	});
	
	// 这里应该是实际的API请求
	setTimeout(() => {
		uni.hideLoading();
		uni.showToast({
			title: '发布成功',
			icon: 'success'
		});
		
		// 发布成功后返回首页
		setTimeout(() => {
			uni.switchTab({
				url: '/pages/index/index'
			});
		}, 1500);
	}, 1000);
};

// 插入图片
const insertImage = () => {
	uni.chooseImage({
		count: 9,
		success: (res) => {
			// 处理选中的图片
			const tempFilePaths = res.tempFilePaths;
			
			// 在这里应该上传图片到服务器，然后获取URL
			// 这里仅做演示，将图片路径添加到内容中
			articleData.images = [...articleData.images, ...tempFilePaths];
			
			// 向内容中插入图片标记或URL
			articleData.content += '\n[图片]\n';
			
			uni.showToast({
				title: '图片添加成功',
				icon: 'success'
			});
		}
	});
};

// 文本格式化工具
const showTextFormatting = () => {
	uni.showToast({
		title: '文本格式化功能',
		icon: 'none'
	});
};

// 撤销操作
const undo = () => {
	uni.showToast({
		title: '撤销操作',
		icon: 'none'
	});
};

// 重做操作
const redo = () => {
	uni.showToast({
		title: '重做操作',
		icon: 'none'
	});
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

.header-title {
	font-size: 36rpx;
	font-weight: bold;
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

.content-editor {
	min-height: 300rpx;
}

.editor-textarea {
	width: 100%;
	font-size: 30rpx;
	line-height: 1.6;
	min-height: 500rpx;
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

.tag-list {
	display: flex;
	flex-wrap: wrap;
	padding: 20rpx 0;
}

.tag-item {
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