# 停止并删除已存在的容器
if [ "$(docker ps -aq -f name=uniapp-blog)" ]; then
    docker stop uniapp-blog
    docker rm uniapp-blog
fi

# 构建新镜像
docker build -t uniapp-blog .

# 运行新容器，端口映射到5173，并挂载本地h5目录
docker run -d -p 5173:80 -v /usr/local/nginx/html/h5:/usr/local/nginx/html/h5 --name uniapp-blog uniapp-blog

# 显示运行中的容器
docker ps