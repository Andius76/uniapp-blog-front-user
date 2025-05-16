# 使用NGINX作为基础镜像
FROM nginx

# 创建目标目录结构（如果需要）
RUN mkdir -p /usr/local/nginx/html/h5

# 将您的 NGINX 配置文件复制到容器中的 NGINX 配置目录
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 无需复制dist目录，因为我们将直接使用主机上的h5目录
# 创建工作目录
WORKDIR /usr/local/nginx/html