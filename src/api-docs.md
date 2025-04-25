# 博客系统API接口文档

## 基础说明

- 基础URL: `/api/v1`
- 请求格式：默认使用 JSON 格式
- 认证方式：Bearer Token（在请求头中添加 `Authorization: Bearer <token>`）
- 响应格式：
  ```json
  {
    "code": 200,      // 状态码
    "message": "成功", // 状态信息
    "data": {}       // 响应数据
  }
  ```

## 1. 用户认证模块

### 1.1 发送邮箱验证码
- **POST** `/auth/send-verification-code`
- 请求参数：
  ```json
  {
    "email": "string"    // 邮箱地址
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "验证码已发送"
  }
  ```
- 说明：
  - 验证码有效期为10分钟
  - 同一邮箱60秒内只能请求一次验证码
  - 验证码为6位数字
- 错误响应：
  ```json
  {
    "code": 400,
    "message": "邮箱格式不正确"
  }
  ```
  或
  ```json
  {
    "code": 429,
    "message": "请求过于频繁，请稍后再试"
  }
  ```

### 1.2 用户注册
- **POST** `/auth/register`
- 请求参数：
  ```json
  {
    "email": "string",             // 邮箱（作为登录账号）
    "verificationCode": "string",  // 邮箱验证码
    "password": "string",          // 密码
    "nickname": "string"          // 昵称（可选）
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "注册成功",
    "data": {
      "userId": "string",
      "email": "string",
      "nickname": "string",
      "token": "string"
    }
  }
  ```
- 说明：
  - 密码长度至少6位
  - 验证码必须是有效的且在有效期内（10分钟）
  - 注册成功后会自动登录并返回token
- 错误响应：
  ```json
  {
    "code": 400,
    "message": "验证码错误或已过期"
  }
  ```
  或
  ```json
  {
    "code": 400,
    "message": "邮箱已被注册"
  }
  ```
  或
  ```json
  {
    "code": 400,
    "message": "密码长度不足"
  }
  ```

### 1.3 用户登录
- **POST** `/auth/login`
- 请求参数：
  ```json
  {
    "email": "string",    // 邮箱
    "password": "string"  // 密码
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "登录成功",
    "data": {
      "token": "string",
      "userId": "string",
      "email": "string",
      "nickname": "string",
      "avatar": "string"
    }
  }
  ```

### 1.4 忘记密码
- **POST** `/auth/forget-password`
- 请求参数：
  ```json
  {
    "email": "string"    // 注册邮箱
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "重置链接已发送到邮箱"
  }
  ```

### 1.5 重置密码
- **POST** `/auth/reset-password`
- 请求参数：
  ```json
  {
    "token": "string",      // 重置令牌
    "newPassword": "string" // 新密码
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "密码重置成功"
  }
  ```

## 2. 用户信息模块

### 2.1 获取用户信息
- **GET** `/user/profile`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "userId": "string",
      "email": "string",
      "nickname": "string",
      "avatar": "string",
      "bio": "string",
      "followCount": 0,
      "followerCount": 0,
      "postCount": 0
    }
  }
  ```

### 2.2 获取指定用户信息
- **GET** `/user/profile/{userId}`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "userId": "string",
      "nickname": "string",
      "avatar": "string",
      "bio": "string",
      "followCount": 0,
      "followerCount": 0,
      "postCount": 0,
      "isFollowing": false
    }
  }
  ```

### 2.3 更新用户信息
- **PUT** `/user/profile`
- 请求参数：
  ```json
  {
    "nickname": "string",  // 昵称
    "avatar": "string",   // 头像URL
    "bio": "string"       // 个人简介
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "更新成功",
    "data": {
      "userId": "string",
      "nickname": "string",
      "avatar": "string",
      "bio": "string"
    }
  }
  ```

## 3. 文章模块

### 3.1 发布文章
- **POST** `/articles`
- 请求参数：
  ```json
  {
    "title": "string",       // 文章标题
    "content": "string",     // 文章内容
    "summary": "string",     // 文章摘要
    "coverImage": "string",  // 封面图片URL
    "tags": ["string"],      // 标签列表
    "category": "string",    // 分类
    "images": ["string"]     // 文章中的图片URL列表
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "发布成功",
    "data": {
      "articleId": "string",
      "title": "string",
      "createdAt": "string"
    }
  }
  ```

### 3.2 获取文章列表
- **GET** `/articles`
- 查询参数：
  - `page`: 页码（默认1）
  - `size`: 每页数量（默认10）
  - `category`: 分类（可选）
  - `tag`: 标签（可选）
  - `userId`: 作者ID（可选）
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "total": 100,
      "items": [{
        "articleId": "string",
        "title": "string",
        "summary": "string",
        "coverImage": "string",
        "author": {
          "userId": "string",
          "nickname": "string",
          "avatar": "string"
        },
        "publishTime": "string",
        "likes": 0,
        "comments": 0,
        "tags": ["string"]
      }]
    }
  }
  ```

### 3.3 获取文章详情
- **GET** `/articles/{articleId}`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "articleId": "string",
      "title": "string",
      "content": "string",
      "summary": "string",
      "coverImage": "string",
      "author": {
        "userId": "string",
        "nickname": "string",
        "avatar": "string"
      },
      "publishTime": "string",
      "updateTime": "string",
      "tags": ["string"],
      "category": "string",
      "likes": 0,
      "comments": 0,
      "isLiked": false,
      "isCollected": false,
      "images": ["string"]
    }
  }
  ```

### 3.4 更新文章
- **PUT** `/articles/{articleId}`
- 请求参数：
  ```json
  {
    "title": "string",
    "content": "string",
    "summary": "string",
    "coverImage": "string",
    "tags": ["string"],
    "category": "string",
    "images": ["string"]
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "更新成功"
  }
  ```

### 3.5 删除文章
- **DELETE** `/articles/{articleId}`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "删除成功"
  }
  ```

## 4. 社交互动模块

### 4.1 关注用户
- **POST** `/social/follow/{userId}`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "关注成功"
  }
  ```

### 4.2 取消关注
- **DELETE** `/social/follow/{userId}`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "取消关注成功"
  }
  ```

### 4.3 获取关注列表
- **GET** `/social/following`
- 查询参数：
  - `userId`: 用户ID（可选，默认为当前登录用户）
  - `page`: 页码（默认1）
  - `size`: 每页数量（默认20）
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "total": 100,
      "items": [{
        "userId": "string",
        "nickname": "string",
        "avatar": "string",
        "bio": "string",
        "followTime": "string"
      }]
    }
  }
  ```

### 4.4 获取粉丝列表
- **GET** `/social/followers`
- 查询参数：
  - `userId`: 用户ID（可选，默认为当前登录用户）
  - `page`: 页码（默认1）
  - `size`: 每页数量（默认20）
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "total": 100,
      "items": [{
        "userId": "string",
        "nickname": "string",
        "avatar": "string",
        "bio": "string",
        "followTime": "string",
        "isFollowing": false
      }]
    }
  }
  ```

## 5. 评论模块

### 5.1 发表评论
- **POST** `/articles/{articleId}/comments`
- 请求参数：
  ```json
  {
    "content": "string",     // 评论内容
    "parentId": "string"    // 父评论ID（回复评论时需要）
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "评论成功",
    "data": {
      "commentId": "string",
      "content": "string",
      "createdAt": "string"
    }
  }
  ```

### 5.2 获取文章评论列表
- **GET** `/articles/{articleId}/comments`
- 查询参数：
  - `page`: 页码（默认1）
  - `size`: 每页数量（默认20）
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "total": 100,
      "items": [{
        "commentId": "string",
        "content": "string",
        "author": {
          "userId": "string",
          "nickname": "string",
          "avatar": "string"
        },
        "createdAt": "string",
        "likes": 0,
        "replies": [{
          "commentId": "string",
          "content": "string",
          "author": {
            "userId": "string",
            "nickname": "string",
            "avatar": "string"
          },
          "createdAt": "string",
          "likes": 0
        }]
      }]
    }
  }
  ```

### 5.3 删除评论
- **DELETE** `/articles/{articleId}/comments/{commentId}`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "删除成功"
  }
  ```

## 6. 点赞和收藏模块

### 6.1 点赞文章
- **POST** `/articles/{articleId}/like`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "点赞成功"
  }
  ```

### 6.2 取消点赞
- **DELETE** `/articles/{articleId}/like`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "取消点赞成功"
  }
  ```

### 6.3 收藏文章
- **POST** `/articles/{articleId}/collect`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "收藏成功"
  }
  ```

### 6.4 取消收藏
- **DELETE** `/articles/{articleId}/collect`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "取消收藏成功"
  }
  ```

### 6.5 获取收藏列表
- **GET** `/user/collections`
- 查询参数：
  - `page`: 页码（默认1）
  - `size`: 每页数量（默认20）
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "total": 100,
      "items": [{
        "articleId": "string",
        "title": "string",
        "summary": "string",
        "coverImage": "string",
        "author": {
          "userId": "string",
          "nickname": "string",
          "avatar": "string"
        },
        "publishTime": "string",
        "collectTime": "string"
      }]
    }
  }
  ```

## 7. 消息通知模块

### 7.1 获取消息列表
- **GET** `/messages`
- 查询参数：
  - `page`: 页码（默认1）
  - `size`: 每页数量（默认20）
  - `type`: 消息类型（comment/like/follow/system）
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "total": 100,
      "items": [{
        "messageId": "string",
        "type": "string",
        "title": "string",
        "description": "string",
        "from": {
          "userId": "string",
          "nickname": "string",
          "avatar": "string"
        },
        "articleId": "string",
        "articleTitle": "string",
        "time": "string",
        "isRead": false,
        "icon": "string"
      }]
    }
  }
  ```

### 7.2 标记消息为已读
- **PUT** `/messages/read`
- 请求参数：
  ```json
  {
    "messageIds": ["string"]  // 消息ID列表
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "标记成功"
  }
  ```

### 7.3 获取未读消息数
- **GET** `/messages/unread/count`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": {
      "total": 10,
      "comment": 3,
      "like": 4,
      "follow": 2,
      "system": 1
    }
  }
  ```

## 8. 分类和标签模块

### 8.1 获取分类列表
- **GET** `/categories`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": [
      {
        "id": "string",
        "name": "string",
        "articleCount": 0
      }
    ]
  }
  ```

### 8.2 获取标签列表
- **GET** `/tags`
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": [
      {
        "id": "string",
        "name": "string",
        "articleCount": 0
      }
    ]
  }
  ```

### 8.3 获取热门标签
- **GET** `/tags/hot`
- 查询参数：
  - `limit`: 返回数量（默认10）
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "成功",
    "data": [
      {
        "id": "string",
        "name": "string",
        "articleCount": 0
      }
    ]
  }
  ```