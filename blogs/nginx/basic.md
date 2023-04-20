---
title: nginx 基本用法
date: 2023-01-29
categories: 
 - nginx 
tags:
 - nginx basic
sidebar: auto
---

[原文链接]: https://juejin.cn/post/6844904129987526663#heading-7

## Nginx 是什么

> “Nginx 是一款轻量级的 HTTP 服务器，采用事件驱动的异步非阻塞处理方式框架，这让其具有极好的 IO 性能，时常用于服务端的**反向代理**和**负载均衡**。”

Nginx 是一款 http 服务器 （或叫web服务器）。它是由俄罗斯人 伊戈尔·赛索耶夫为俄罗斯访问量第二的 Rambler.ru 站点开发的，并于2004年首次公开发布的。

> web服务器：负责处理和响应用户请求，一般也称为http服务器，如 Apache、IIS、Nginx
>
> 应用服务器：存放和运行系统程序的服务器，负责处理程序中的业务逻辑，如 Tomcat、Weblogic、Jboss（现在大多数应用服务器也包含了web服务器的功能）

Nginx 是什么，总结一下就是这些：

- 一种轻量级的web服务器
- 设计思想是事件驱动的异步非阻塞处理（类node.js）
- 占用内存少、启动速度快、并发能力强
- 使用C语言开发
- 扩展性好，第三方插件非常多
- 在互联网项目中广泛应用

## Nginx的安装

1. 通过 [官网](http://nginx.org/) 安装 （windows 推荐）
2. 通过 [homebrew](https://brew.sh/) 安装 （mac 推荐）

## Nginx的相关命令

### 启动

```bash
sudo ngnix /sudo brew services start nginx
```

### 停止

```bash
sudo nginx -s stop 或 sudo brew services stop nginx
```

### 热重启

```bash
sudo nginx -s reload
```

### 强制停止nginx

```bash
sudo pkill -9 nginx
```

### nginx.conf 的基本配置如下

```nginx
# 首尾配置暂时忽略
server {  
        # 当nginx接到请求后，会匹配其配置中的service模块
        # 匹配方法就是将请求携带的host和port去跟配置中的server_name和listen相匹配
        listen       8080;        
        server_name  localhost; # 定义当前虚拟主机（站点）匹配请求的主机名

        location / {
            root   html; # Nginx默认值
            # 设定Nginx服务器返回的文档名
            index  index.html index.htm; # 先找根目录下的index.html，如果没有再找index.htm
        }
}
# 首尾配置暂时忽略
```

server{ }其实是包含在http{ }内部的。每一个server{ }是一个虚拟主机（站点）

上面代码块的意思是：当一个请求叫做`localhost:8080`请求nginx服务器时，该请求就会被匹配进该代码块的server{ }中执行

## Nginx的应用

### 动静分离

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/4/17/171867d175eae45f~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.awebp)

Nginx服务器会将接收到的请求分为动态请求和静态请求

静态请求直接从nginx服务器设置的根目录获取资源，动态请求转发给真实的后台去处理

这样做不仅能给应用服务器减轻压力，将后台api接口服务化，还能将前后端代码分开并行开发和部署。

```nginx
server {  
        listen       8080;        
        server_name  localhost;

        location / {
            root   html; # Nginx默认值
            index  index.html index.htm;
        }
        
        # 静态化配置，所有静态请求都转发给 nginx 处理，存放目录为 my-project
        location ~ .*\.(html|htm|gif|jpg|jpeg|bmp|png|ico|js|css)$ {
            root /usr/local/var/www/my-project; # 静态请求所代理到的根目录
        }
        
        # 动态请求匹配到path为'node'的就转发到8002端口处理
        location /node/ {  
            proxy_pass http://localhost:8002; # 充当服务代理
        }
}
```

访问静态技园nginx服务器会返回my-project里面的文件，如获取index.html

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/4/16/171835d8723ead00~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.awebp)

访问动态请求nginx服务器会将它从8002端口请求到的内容，原封不动的返回回去

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/4/16/171836158ed179ef~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.awebp)

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/4/17/171865a653e3ce09~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.awebp)

### 反向代理

反向代理：找代购买东西，不用管从哪里买的，只要买到就行，代购在这里就是nginx，浏览器/其他终端就是需求方

nginx配置反向代理

```nginx
server {
        listen       8080;        
        server_name  localhost;

        location / {
            root   html; # Nginx默认值
            index  index.html index.htm;
        }
        
        proxy_pass http://localhost:8000; # 反向代理配置，请求会被转发到8000端口
}
```

反向代理模型：

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/4/16/17183720f7a66978~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.awebp)

nginx就是图中的proxy。左边的3个client在请求时向nginx获取内容，是感受不到3台server存在的

> 此时，proxy就充当了3个server的反向代理

### 负载均衡

随着业务的不断增长和用户的不断增多，一台服务已经满足不了系统要求了。这个时候就出现了服务器 [集群](https://link.juejin.cn/?target=https%3A%2F%2Fwww.cnblogs.com%2Fbhlsheji%2Fp%2F4026296.html)。

在服务器集群中，Nginx 可以将接收到的客户端请求“均匀地”（严格讲并不一定均匀，可以通过设置权重）分配到这个集群中所有的服务器上。这个就叫做**负载均衡**。

负载均衡示意图：

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/4/17/171862efada16376~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.awebp)



##### 负载均衡的作用

- 分摊服务器集群压力
- 保证客户端访问的稳定性

前面也提到了，负载均衡可以解决分摊服务器集群压力的问题。除此之外，Nginx还带有**健康检查**（服务器心跳检查）功能，会定期轮询向集群里的所有服务器发送健康检查请求，来检查集群中是否有服务器处于异常状态。

一旦发现某台服务器异常，那么在这以后代理进来的客户端请求都不会被发送到该服务器上（直健康检查发现该服务器已恢复正常），从而保证客户端访问的稳定性。

nginx配置负载均衡

```nginx
# 负载均衡：设置domain
upstream domain {
    server localhost:8000;
    server localhost:8001;
}
server {  
        listen       8080;        
        server_name  localhost;

        location / {
            # root   html; # Nginx默认值
            # index  index.html index.htm;
            
            proxy_pass http://domain; # 负载均衡配置，请求会被平均分配到8000和8001端口
            proxy_set_header Host $host:$server_port;
        }
}
```

8000和8001是我本地用 Node.js 起的两个服务，负载均衡成功后可以看到访问 `localhost:8080` 有时会访问到8000端口的页面，有时会访问到8001端口的页面。

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/4/17/17186788e4daacc3~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.awebp)

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/4/17/17186790c211d628~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.awebp)

实际项目中的负载均衡远比这个案例要更加复杂，但是万变不离其宗，都是根据这个理想模型衍生出来的。

受集群单台服务器内存等资源的限制，负载均衡集群的服务器也不能无限增多。但因其良好的容错机制，负载均衡成为了实现**高可用架构**中必不可少的一环。

### 正向代理

正向代理跟反向道理正好相反。拿上文中的那个代购例子来讲，多个人找代购购买同一个商品，代购找到买这个的店后一次性给买了。这个过程中，该店主是不知道代购是帮别代买买东西的。那么代购对于多个想买商品的顾客来讲，他就充当了正向代理。

正向代理的示意图如下：

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/4/17/171864e773f05fe7~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.awebp)

nginx 就是充当图中的 proxy。左边的3个 client 在请求时向 nginx 获取内容，server 是感受不到3台 client 存在的。

> 此时，proxy 就充当了3个 client 的正向代理。

**正向代理**，意思是一个位于客户端和原始服务器(origin server)之间的服务器，为了从原始服务器取得内容，客户端向代理发送一个请求并指定目标(原始服务器)，然后代理向原始服务器转交请求并将获得的内容返回给客户端。客户端才能使用正向代理。当你需要把你的服务器作为代理服务器的时候，可以用Nginx来实现正向代理。

科学上网vpn（俗称`翻墙`）其实就是一个正向代理工具。

该 vpn 会将想访问墙外服务器 server 的网页请求，代理到一个可以访问该网站的代理服务器 proxy 上。这个 proxy 把墙外服务器 server 上获取的网页内容，再转发给客户。

代理服务器 proxy 就是 Nginx 搭建的。