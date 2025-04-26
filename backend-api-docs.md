# 毕业设计管理系统API文档

## 基础信息

- 基础URL: `http://localhost:8080`
- 响应格式: JSON
- 编码方式: UTF-8

## 通用响应格式

```json
{
    "code": 200,       // 状态码
    "message": "成功",  // 响应消息
    "data": {}        // 响应数据
}
```

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## API接口列表

### 1. 用户认证

#### 1.1 用户登录

- **接口URL**: `/api/auth/login`
- **请求方式**: POST
- **请求参数**:

```json
{
    "username": "string",  // 用户名
    "password": "string"   // 密码
}
```

- **响应示例**:

```json
{
    "code": 200,
    "message": "登录成功",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "userInfo": {
            "userId": 1,
            "username": "admin",
            "role": "ADMIN"
        }
    }
}
```

#### 1.2 用户登出

- **接口URL**: `/api/auth/logout`
- **请求方式**: POST
- **请求头**:
  - Authorization: Bearer {token}
- **响应示例**:

```json
{
    "code": 200,
    "message": "登出成功",
    "data": null
}
```

## 注意事项

1. 所有需要认证的接口都需要在请求头中携带token
2. token格式为：`Bearer {token}`
3. 接口文档会随着开发进度持续更新

## 更新记录

| 日期 | 版本 | 描述 |
|------|------|------|
| 2024-01-01 | v1.0.0 | 初始版本 |