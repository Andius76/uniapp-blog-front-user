import {
	createSSRApp
} from "vue";
import App from "./App.vue";
import routeGuard from './utils/routeGuard.js'

// 添加页面跳转拦截器
uni.addInterceptor('navigateTo', {
	invoke(args) {
		// 检查目标页面是否在白名单内
		const whiteList = [
			'/pages/login/login', 
			'/pages/register/register',
			'/pages/forget-password/forget-password'
		];
		
		if (!whiteList.some(path => args.url.startsWith(path)) && !uni.getStorageSync('token')) {
			// 未登录且目标页面需要登录
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			
			// 跳转到登录页，并记录原目标
			setTimeout(() => {
				uni.navigateTo({
					url: `/pages/login/login?redirect=${encodeURIComponent(args.url)}`
				});
			}, 1500);
			
			return false; // 阻止原导航
		}
		return args; // 继续原导航
	}
});

// 同样拦截redirectTo
uni.addInterceptor('redirectTo', {
	// 类似的实现...
});

// 同样拦截switchTab (如果应用使用了tabbar)
uni.addInterceptor('switchTab', {
	// 类似的实现...
});

export function createApp() {
	const app = createSSRApp(App);
	return {
		app,
	};
}
