<p>附录A 系统接口文档（Restful API）</p>
<p>A.1 用户模块</p>
<table>
<colgroup>
<col style="width: 8%" />
<col style="width: 8%" />
<col style="width: 8%" />
<col style="width: 9%" />
<col style="width: 20%" />
<col style="width: 23%" />
<col style="width: 9%" />
<col style="width: 11%" />
</colgroup>
<tbody>
<tr>
<td style="text-align: center;">接口名称</td>
<td style="text-align: center;">Endpoint</td>
<td style="text-align: center;">请求方法</td>
<td style="text-align: center;">请求参数</td>
<td style="text-align: center;">请求体（JSON）</td>
<td style="text-align: center;">响应示例（JSON）</td>
<td style="text-align: center;">权限说明</td>
<td style="text-align: center;">备注</td>
</tr>
<tr>
<td style="text-align: center;">用户注册</td>
<td style="text-align: center;">/api/auth/register</td>
<td style="text-align: center;">POST</td>
<td style="text-align: center;">无</td>
<td style="text-align: left;">{ "username": "user@example.com",
"password": "123456", "avatar": "url" }</td>
<td style="text-align: center;">{ "code": 200, "data": { "id": 1,
"username": "user@example.com" }, "message": "注册成功" }</td>
<td style="text-align: center;">开放访问</td>
<td style="text-align: center;">用户名需唯一（邮箱/手机号）</td>
</tr>
<tr>
<td style="text-align: center;">用户登录</td>
<td style="text-align: center;">/api/auth/login</td>
<td style="text-align: center;">POST</td>
<td style="text-align: center;">无</td>
<td style="text-align: left;">{ "username": "user@example.com",
"password": "123456" }</td>
<td style="text-align: center;">{ "code": 200, "data": { "token":
"xxxxx", "role": "USER" }, "message": "登录成功" }</td>
<td style="text-align: center;">开放访问</td>
<td style="text-align: center;">返回 JWT Token 和角色信息</td>
</tr>
<tr>
<td style="text-align: center;">获取当前用户信息</td>
<td style="text-align: center;">/api/users/me</td>
<td style="text-align: center;">GET</td>
<td style="text-align: center;">无（需 Header 携带Authorization: Bearer
&lt;token&gt;</td>
<td style="text-align: left;">无</td>
<td style="text-align: center;">{ "code": 200, "data": { "id": 1,
"username": "user@example.com", "avatar": "url" } }</td>
<td style="text-align: center;">USER/ADMIN</td>
<td style="text-align: center;">需登录</td>
</tr>
<tr>
<td style="text-align: center;">修改密码</td>
<td style="text-align: center;">/api/users/password</td>
<td style="text-align: center;">PUT</td>
<td style="text-align: center;">无（需 Header 携带Authorization: Bearer
&lt;token&gt;）</td>
<td style="text-align: left;">{ "oldPassword": "123456", "newPassword":
"654321" }</td>
<td style="text-align: center;">{ "code": 200, "data": null, "message":
"密码修改成功" }</td>
<td style="text-align: center;">当前用户或 ADMIN</td>
<td style="text-align: center;">需校验旧密码正确性</td>
</tr>
</tbody>
</table>
<p>A.2 博客模块</p>
<table>
<colgroup>
<col style="width: 11%" />
<col style="width: 9%" />
<col style="width: 10%" />
<col style="width: 10%" />
<col style="width: 18%" />
<col style="width: 14%" />
<col style="width: 11%" />
<col style="width: 13%" />
</colgroup>
<tbody>
<tr>
<td style="text-align: center;">接口名称</td>
<td style="text-align: center;">Endpoint</td>
<td style="text-align: center;">请求方法</td>
<td style="text-align: center;">请求参数</td>
<td style="text-align: center;">请求体（JSON）</td>
<td style="text-align: center;">响应示例（JSON）</td>
<td style="text-align: center;">权限说明</td>
<td style="text-align: center;">备注</td>
</tr>
<tr>
<td style="text-align: center;">发布文章</td>
<td style="text-align: center;">/api/articles</td>
<td style="text-align: center;">POST</td>
<td style="text-align: center;">无（需 Header 携带Authorization）</td>
<td style="text-align: center;">{ "title": "标题", "content": "正文",
"tags": [1,2], "coverImage": "url" }</td>
<td style="text-align: center;">{ "code": 200, "data": { "id": 100,
"title": "标题" }, "message": "发布成功" }</td>
<td style="text-align: center;">USER</td>
<td style="text-align: center;">支持富文本和标签绑定</td>
</tr>
<tr>
<td style="text-align: center;">获取文章列表</td>
<td style="text-align: center;">/api/articles</td>
<td style="text-align: center;">GET</td>
<td style="text-align: center;">page=1（分页）<br />
tagId=1（按标签筛选）</td>
<td style="text-align: center;">无</td>
<td style="text-align: center;">{ "code": 200, "data": [ { "id": 100,
"title": "标题", "author": "user@example.com" } ] }</td>
<td style="text-align: center;">开放访问</td>
<td style="text-align: center;">分页默认每页 10 条</td>
</tr>
<tr>
<td style="text-align: center;">发表评论</td>
<td style="text-align: center;">/api/articles/{articleId}/comments</td>
<td style="text-align: center;">POST</td>
<td style="text-align: center;">articleId（路径参数）</td>
<td style="text-align: center;">{ "content": "评论内容" }</td>
<td style="text-align: center;">{ "code": 200, "data": { "id": 500,
"content": "评论内容" }, "message": "评论成功" }</td>
<td style="text-align: center;">USER</td>
<td style="text-align: center;">需关联文章 ID</td>
</tr>
<tr>
<td style="text-align: center;">收藏文章</td>
<td style="text-align: center;">/api/articles/{articleId}/collect</td>
<td style="text-align: center;">POST</td>
<td style="text-align: center;">articleId（路径参数）</td>
<td style="text-align: center;">无</td>
<td style="text-align: center;">{ "code": 200, "data": null, "message":
"收藏成功" }</td>
<td style="text-align: center;">USER</td>
<td style="text-align: center;">用户不能重复收藏同一文章</td>
</tr>
</tbody>
</table>
<p>A.3系统管理模块（仅 ADMIN）</p>
<table>
<colgroup>
<col style="width: 8%" />
<col style="width: 12%" />
<col style="width: 11%" />
<col style="width: 11%" />
<col style="width: 14%" />
<col style="width: 19%" />
<col style="width: 8%" />
<col style="width: 13%" />
</colgroup>
<tbody>
<tr>
<td style="text-align: center;">接口名称</td>
<td style="text-align: center;">Endpoint</td>
<td style="text-align: center;">请求方法</td>
<td style="text-align: center;">请求参数</td>
<td style="text-align: center;">请求体（JSON）</td>
<td style="text-align: center;">响应示例（JSON）</td>
<td style="text-align: center;">权限说明</td>
<td style="text-align: center;">备注</td>
</tr>
<tr>
<td style="text-align: center;">查询用户列表</td>
<td style="text-align: center;">/api/admin/users</td>
<td style="text-align: center;">GET</td>
<td style="text-align: center;">page=1（分页）<br />
keyword=test（搜索）</td>
<td style="text-align: center;">无</td>
<td style="text-align: center;">{ "code": 200, "data": [ { "id": 1,
"username": "user@example.com" } ] }</td>
<td style="text-align: center;">ADMIN</td>
<td style="text-align: center;">支持按用户名模糊搜索</td>
</tr>
<tr>
<td style="text-align: center;">封禁/解封用户</td>
<td style="text-align: center;">/api/admin/users/{userId}/ban</td>
<td style="text-align: center;">PUT</td>
<td style="text-align: center;">userId（路径参数）</td>
<td style="text-align: center;">{ "reason": "违规操作", "status": 2
}</td>
<td style="text-align: center;">{ "code": 200, "data": null, "message":
"操作成功" }</td>
<td style="text-align: center;">ADMIN</td>
<td style="text-align: center;">状态：1（正常）/2（封禁）</td>
</tr>
<tr>
<td style="text-align: center;">审核文章</td>
<td
style="text-align: center;">/api/admin/articles/{articleId}/review</td>
<td style="text-align: center;">PUT</td>
<td style="text-align: center;">articleId（路径参数）</td>
<td style="text-align: center;">{ "status": 2, "reason": "违规内容"
}</td>
<td style="text-align: center;">{ "code": 200, "data": null, "message":
"审核完成" }</td>
<td style="text-align: center;">ADMIN</td>
<td style="text-align: center;">状态：2（发布）/3（下架）</td>
</tr>
</tbody>
</table>
<p>A.4 权限管理模块（仅 ADMIN）</p>
<table>
<colgroup>
<col style="width: 8%" />
<col style="width: 15%" />
<col style="width: 8%" />
<col style="width: 11%" />
<col style="width: 17%" />
<col style="width: 18%" />
<col style="width: 10%" />
<col style="width: 9%" />
</colgroup>
<tbody>
<tr>
<td style="text-align: center;">接口名称</td>
<td style="text-align: center;">Endpoint</td>
<td style="text-align: center;">请求方法</td>
<td style="text-align: center;">请求参数</td>
<td style="text-align: center;">请求体（JSON）</td>
<td style="text-align: center;">响应示例（JSON）</td>
<td style="text-align: center;">权限说明</td>
<td style="text-align: center;">备注</td>
</tr>
<tr>
<td style="text-align: center;">创建角色</td>
<td style="text-align: center;">/api/admin/roles</td>
<td style="text-align: center;">POST</td>
<td style="text-align: center;">无</td>
<td style="text-align: center;">{ "name": "EDITOR" }</td>
<td style="text-align: center;">{ "code": 200, "data": { "id": 3,
"name": "EDITOR" }, "message": "创建成功" }</td>
<td style="text-align: center;">ADMIN</td>
<td style="text-align: center;">角色名称需唯一</td>
</tr>
<tr>
<td style="text-align: center;">分配角色权限</td>
<td
style="text-align: center;">/api/admin/roles/{roleId}/permissions</td>
<td style="text-align: center;">PUT</td>
<td style="text-align: center;">roleId（路径参数）</td>
<td style="text-align: center;">{ "permissionIds": [1,2] }</td>
<td style="text-align: center;">{ "code": 200, "data": null, "message":
"权限分配成功" }</td>
<td style="text-align: center;">ADMIN</td>
<td style="text-align: center;">权限 ID 需存在</td>
</tr>
</tbody>
</table>
