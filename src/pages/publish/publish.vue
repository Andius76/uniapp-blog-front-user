<template>
	<view class="container">
		<!-- 标题输入 -->
		<uni-forms ref="form" :modelValue="formData" :rules="rules">
			<uni-forms-item label="标题" name="title">
				<uni-easyinput v-model="formData.title" placeholder="请输入文章标题" />
			</uni-forms-item>

			<!-- 分类选择 -->
			<uni-forms-item label="分类" name="category">
				<uni-data-select v-model="formData.category" :localdata="categories" placeholder="请选择分类" />
			</uni-forms-item>

			<!-- 内容输入 -->
			<uni-forms-item label="内容" name="content">
				<uni-easyinput type="textarea" v-model="formData.content" placeholder="请输入文章内容"
					:styles="{ height: '300px' }" />
			</uni-forms-item>

			<!-- 图片上传 -->
			<uni-forms-item label="封面图">
				<uni-file-picker v-model="formData.images" file-mediatype="image" limit="3" mode="grid" />
			</uni-forms-item>

			<!-- 提交按钮 -->
			<button type="primary" @click="submitForm">发布</button>
		</uni-forms>
	</view>
</template>

<script setup>
	import {
		ref
	} from 'vue';

	// 表单数据
	const formData = ref({
		title: '',
		category: '',
		content: '',
		images: []
	});

	// 分类选项
	const categories = ref([{
			value: 'tech',
			text: '技术'
		},
		{
			value: 'life',
			text: '生活'
		},
		{
			value: 'news',
			text: '新闻'
		}
	]);

	// 表单验证规则
	const rules = ref({
		title: {
			rules: [{
				required: true,
				errorMessage: '标题不能为空'
			}]
		},
		category: {
			rules: [{
				required: true,
				errorMessage: '请选择分类'
			}]
		},
		content: {
			rules: [{
				required: true,
				errorMessage: '内容不能为空'
			}]
		}
	});

	// 提交表单
	const submitForm = () => {
		uni.showLoading({
			title: '发布中...'
		});
		setTimeout(() => {
			uni.hideLoading();
			uni.showToast({
				title: '发布成功',
				icon: 'success'
			});
			console.log('提交数据:', formData.value);
			// 实际开发中此处调用API提交数据
		}, 1500);
	};
</script>

<style scoped>
	.container {
		padding: 20px;
	}
</style>