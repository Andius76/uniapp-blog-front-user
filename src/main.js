import {
	createSSRApp
} from "vue";
import App from "./App.vue";
import routeGuard from './utils/routeGuard.js';
import { checkUserAccountStatus } from './utils/routeGuard.js';

// 全局配置
const appConfig = {
	// 用户状态检查配置
	userStatusCheck: {
		enabled: true,               // 是否启用用户状态检查
		interval: 60000,             // 检查间隔（毫秒），默认1分钟
		lastCheckTime: 0,            // 上次检查时间戳
		isChecking: false,           // 是否正在检查中
	}
};

// 挂载到全局，方便访问
uni.$appConfig = appConfig;

// 创建全局用户状态检查函数
uni.$checkUserStatus = function() {
	const now = Date.now();
	const config = uni.$appConfig.userStatusCheck;
	
	// 如果已禁用，直接返回
	if (!config.enabled) return Promise.resolve(true);
	
	// 如果正在检查中或者间隔时间不够，则跳过
	if (config.isChecking || (now - config.lastCheckTime < config.interval)) {
		console.log('用户状态检查跳过:', 
			config.isChecking ? '正在检查中' : `间隔不足(${Math.floor((now - config.lastCheckTime)/1000)}秒)`);
		return Promise.resolve(true);
	}
	
	// 标记为检查中
	config.isChecking = true;
	
	// 执行检查
	return checkUserAccountStatus()
		.then(isNormal => {
			// 更新上次检查时间
			config.lastCheckTime = now;
			return isNormal;
		})
		.finally(() => {
			// 无论成功失败，都将检查状态重置
			config.isChecking = false;
		});
};

// 添加页面跳转拦截器
uni.addInterceptor('navigateTo', {
	invoke(args) {
		// 检查目标页面是否在白名单内
		const whiteList = [
			'/pages/login/login', 
			'/pages/register/register',
			'/pages/forget-password/forget-password'
		];
		
		// 每次页面跳转也检查用户状态
		if (uni.getStorageSync('token')) {
			uni.$checkUserStatus();
		}
		
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
	invoke(args) {
		// 检查目标页面是否在白名单内
		const whiteList = [
			'/pages/login/login', 
			'/pages/register/register',
			'/pages/forget-password/forget-password'
		];
		
		// 每次页面跳转也检查用户状态
		if (uni.getStorageSync('token')) {
			uni.$checkUserStatus();
		}
		
		if (!whiteList.some(path => args.url.startsWith(path)) && !uni.getStorageSync('token')) {
			// 未登录且目标页面需要登录
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			
			// 跳转到登录页，并记录原目标
			setTimeout(() => {
				uni.redirectTo({
					url: `/pages/login/login?redirect=${encodeURIComponent(args.url)}`
				});
			}, 1500);
			
			return false; // 阻止原导航
		}
		return args; // 继续原导航
	}
});

// 拦截switchTab (适用于tabbar页面)
uni.addInterceptor('switchTab', {
	invoke(args) {
		// 每次切换标签页也检查用户状态
		if (uni.getStorageSync('token')) {
			uni.$checkUserStatus();
		}
		
		// tabbar页面通常也需要登录保护
		if (!uni.getStorageSync('token')) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			
			setTimeout(() => {
				uni.redirectTo({
					url: '/pages/login/login'
				});
			}, 1500);
			
			return false;
		}
		return args;
	}
});

export function createApp() {
	const app = createSSRApp(App);
	return {
		app,
	};
}
