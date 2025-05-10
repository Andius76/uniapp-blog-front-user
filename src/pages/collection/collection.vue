<template>
	<view>
		<!-- 收藏文章列表，复用article-list组件，listType设为collection -->
		<article-list listType="collection" emptyText="暂无收藏文章" />
	</view>
</template>

<script setup>
	// 导入文章列表组件
	import ArticleList from '@/components/article-list/article-list.vue'
</script>

<style lang="scss">
</style>
