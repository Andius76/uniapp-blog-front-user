# 后端接口文档

## 用户认证模块

### 1. 发送邮箱验证码
```json
{
  "path": "/api/auth/send-email-code",
  "method": "POST",
  "request": {
    "email": "string"
  },
  "response": {
    "code": 200,
    "data": {
      "expire_time": 600
    }
  }
}
```

## 文章管理模块

### 1. 创建文章
```json
{
  "path": "/api/articles",
  "method": "POST",
  "request": {
    "title": "string",
    "content": "string",
    "tags": ["string"]
  }
}
```

## 数据库设计

### 用户表(users)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | bigint | 主键 |
| email | varchar(255) | 唯一索引 |
| password_hash | varchar(255) | 密码哈希 |

注：本文档持续补充后端接口规范、错误代码映射及数据库设计细节。