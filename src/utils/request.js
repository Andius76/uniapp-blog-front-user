/**
 * 网络请求工具
 * 文件位置: /src/utils/request.js
 * 
 * 该文件是整个应用的网络请求核心，提供以下功能：
 * 1. 根据不同平台(APP/H5/小程序)自动适配基础URL
 * 2. 统一的请求头设置
 * 3. 请求拦截器 - 处理URL、请求方法、请求头和Token
 * 4. 响应拦截器 - 统一处理HTTP状态码和业务状态码
 * 5. 统一的错误处理和提示
 * 6. 封装GET、POST、PUT、DELETE等请求方法
 * 
 * 所有API服务都基于此工具发送请求，确保了请求的一致性和可维护性
 */

/**
 * 获取基础URL（根据不同平台进行适配）
 * 这是整个应用中唯一的获取基础URL的方法，所有组件都应该引用这个方法
 * @returns {string} 基础URL
 */
function getBaseUrl() {
	// 所有平台统一使用域名和HTTPS
	return 'https://andiusblog.xyz';
	
	// 以下为原配置，现已全部修改为域名并使用HTTPS
	// #ifdef APP-PLUS
	// return 'http://121.40.195.102:8080';
	// #endif

	// #ifdef H5 || MP-WEIXIN
	// return 'http://localhost:8080';
	// #endif

	// return 'http://localhost:8080';
}

/**
 * 请求配置
 */
const config = {
	// 基础URL会根据平台动态获取
	baseUrl: getBaseUrl(),
	// 请求头
	header: {
		'Content-Type': 'application/json'
	},
	// 请求超时时间（毫秒）
	timeout: 60000,
	// 是否携带token
	withToken: true
};

/**
 * 获取存储的token
 * @returns {string} token值
 */
function getToken() {
	const token = uni.getStorageSync('token') || '';
	
	// 如果没有token，直接返回空字符串
	if (!token) return '';
	
	// 检查是否设置了remember模式和过期时间
	const remember = uni.getStorageSync('loginRemember');
	const expireTime = uni.getStorageSync('tokenExpireTime');
	
	// 只有在remember模式下才检查过期时间
	if (remember && expireTime) {
		// 检查token是否过期
		const now = Date.now();
		if (now > expireTime) {
			// token已过期，清除所有相关存储
			console.log('检测到token已过期，清除登录信息');
			uni.removeStorageSync('token');
			uni.removeStorageSync('tokenExpireTime');
			uni.removeStorageSync('loginRemember');
			uni.removeStorageSync('userInfo');
			return '';
		}
		
		// token未过期，如果还有不到3天过期，自动延长有效期
		const threeDays = 3 * 24 * 60 * 60 * 1000;
		if (expireTime - now < threeDays) {
			// 自动延长7天
			const newExpireTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
			uni.setStorageSync('tokenExpireTime', newExpireTime);
			console.log('token即将过期，已自动延长有效期至7天后');
		}
	}
	
	return token;
}

/**
 * 请求拦截器
 * @param {Object} options - 请求配置
 * @returns {Object} 处理后的请求配置
 */
function requestInterceptor(options) {
	// 处理请求URL
	if (!options.url.startsWith('http')) {
		options.url = `${config.baseUrl}${options.url}`;
	}

	// 处理请求方法
	options.method = (options.method || 'GET').toUpperCase();

	// 处理请求头
	options.header = {
		...config.header,
		...options.header
	};

	// 如果需要携带token且本地有token，则添加到请求头
	if (config.withToken) {
		const token = getToken();
		if (token) {
			options.header['Authorization'] = `Bearer ${token}`;
		}
	}

	return options;
}

/**
 * 响应拦截器
 * @param {Object} response - 响应数据
 * @returns {Object|Promise} 处理后的响应数据或Promise.reject
 */
function responseInterceptor(response) {
	const {
		statusCode,
		data
	} = response;

	// HTTP状态码处理
	if (statusCode >= 200 && statusCode < 300) {
		// 处理业务状态码
		if (data.code === 200) {
			return data;
		} else if (data.code === 409) {
			// 特殊处理409冲突状态码，直接返回原始数据而不是reject
			// 这样上层代码可以根据code判断如何处理冲突情况
			console.log('业务冲突(409):', data.message);
			return data;
		} else {
			// 处理业务错误
			uni.showToast({
				title: data.message || '请求失败',
				icon: 'none',
				duration: 2000
			});
			return Promise.reject(data);
		}
	}

	// 401: 未授权，token过期或无效
	if (statusCode === 401) {
		// 清除本地token
		uni.removeStorageSync('token');
		// 跳转到登录页
		uni.showToast({
			title: '登录已过期，请重新登录',
			icon: 'none',
			duration: 2000
		});

		setTimeout(() => {
			uni.redirectTo({
				url: '/pages/login/login'
			});
		}, 1500);

		return Promise.reject(new Error('登录已过期，请重新登录'));
	}

	// 403: 禁止访问，账号被封禁
	if (statusCode === 403) {
		// 打印更多信息以便调试
		console.error('收到403状态码:', data);
		console.error('响应数据结构:', JSON.stringify(data));

		// 检查是否确实是账号被封禁的情况
		// 某些API可能返回403但不是因为账号被封禁
		if (data && data.message && (
			data.message.includes('封禁') || 
			data.message.includes('禁用') || 
			data.message.includes('banned') ||
			data.message.includes('disabled')
		)) {
			// 清除本地token和用户信息
			uni.removeStorageSync('token');
			uni.removeStorageSync('userInfo');
			
			// 显示封禁提示
			uni.showModal({
				title: '账号已被封禁',
				content: data.message || '您的账号已被封禁，无法继续使用',
				showCancel: false,
				success: () => {
					// 跳转到登录页
					uni.redirectTo({
						url: '/pages/login/login'
					});
				}
			});
			
			return Promise.reject(new Error('账号已被封禁'));
		} else {
			// 其他类型的403错误
			uni.showToast({
				title: data.message || '权限不足，无法访问',
				icon: 'none',
				duration: 2000
			});
			
			return Promise.reject(data);
		}
	}

	// 429: 请求频率限制
	if (statusCode === 429) {
		uni.showToast({
			title: '请求过于频繁，请稍后再试',
			icon: 'none',
			duration: 2000
		});
		return Promise.reject(data);
	}

	// 其他错误
	uni.showToast({
		title: data.message || '请求失败',
		icon: 'none',
		duration: 2000
	});

	return Promise.reject(data);
}

/**
 * 请求函数
 * @param {Object} options - 请求配置
 * @returns {Promise} - 返回Promise对象
 */
function request(options) {
	// 合并请求配置
	const mergedOptions = {
		...options,
		timeout: options.timeout || config.timeout
	};

	// 请求拦截
	const interceptedOptions = requestInterceptor(mergedOptions);

	// 详细日志
	console.log('===== 发起请求 =====');
	console.log('请求URL:', interceptedOptions.url);
	console.log('请求方法:', interceptedOptions.method);
	console.log('请求头:', JSON.stringify(interceptedOptions.header));
	console.log('Authorization:', interceptedOptions.header['Authorization'] || '未设置');
	console.log('本地存储的Token:', getToken() || '未存储Token');
	if (interceptedOptions.data) {
		console.log('请求数据:', JSON.stringify(interceptedOptions.data));
	}

	// 返回Promise
	return new Promise((resolve, reject) => {
		uni.request({
			...interceptedOptions,
			success: (res) => {
				// 详细日志
				console.log('===== 响应数据 =====');
				console.log('状态码:', res.statusCode);
				console.log('响应头:', JSON.stringify(res.header));
				try {
					// 响应拦截
					const result = responseInterceptor(res);
					resolve(result);
				} catch (error) {
					console.error('响应处理错误:', error);
					reject(error);
				}
			},
			fail: (err) => {
				console.error('===== 请求失败 =====');
				console.error('错误详情:', err);
				uni.showToast({
					title: '网络请求失败',
					icon: 'none',
					duration: 2000
				});
				reject(err);
			}
		});
	});
}

// 请求方法的快捷调用
const http = {
	config, // 导出配置对象，方便外部访问
	get(url, params, options = {}) {
		// 处理URL参数
		if (params) {
			const queryString = Object.keys(params)
				.filter(key => params[key] !== undefined && params[key] !== null)
				.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
				.join('&');

			if (queryString) {
				url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
			}
		}

		return request({
			url,
			method: 'GET',
			...options
		});
	},
	post(url, data, options = {}) {
		return request({
			url,
			method: 'POST',
			data,
			...options
		});
	},
	put(url, data, options = {}) {
		return request({
			url,
			method: 'PUT',
			data,
			...options
		});
	},
	delete(url, data, options = {}) {
		return request({
			url,
			method: 'DELETE',
			data,
			...options
		});
	}
};

// 导出工具函数和HTTP请求对象
export {
	getBaseUrl
};
export default http;