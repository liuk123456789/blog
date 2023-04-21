---
title: github actions流水线
date: 2023-04-20
categories:
 - ci
tags:
 - github actions
sidebar: auto
---

## 使用github Actions 部署博客

1. `github`新建`workflow`

   ![Dingtalk_20230420143311](/my-blog/ci/actions/Dingtalk_20230420143311.jpg)

2. 编写下`deploy.yml`文件

   ```yaml
   # 流水线名称
   name: DEPLOY
   # 设置push触发流水线
   on:
     push:
       # 分支名称
       branches: master
   #jobs 可以多个
   jobs:
     # 只需要定义一个job并命名为DEPLOY_BLOG
     DEPLOY_BLOG:
       runs-on: ubuntu-latest
       steps:
         # 拉取项目代码
         - name: Checkout repository
           uses: actions/checkout@v2
         # 给当前环境下载node
         - name: Use Node.js
           uses: actions/setup-node@v2.5.2
           with:
             node-version: "12.x"
         # 安装依赖
         - name: Installing Dependencies
           run: npm install
         # 打包
         - name: Build
           # 打包应用
           run: npm run build
         # 利用scp拷贝打包的资源 public
         - name: copy file via ssh password
           uses: appleboy/scp-action@master
           with:
             host: ${{ secrets.REMOTE_HOST }}
             username: ${{ secrets.REMOTE_USER }}
             password: ${{ secrets.REMOTE_PASS }}
             port: 22
             source: "public/"
             target: ${{ secrets.REMOTE_TARGET }}  
   
   ```

3.  `actions secrets`的设置

   上面我们可以看到使用`REMOTE_HOST`等变量形式，所以这里的变量是如何配置呢，步骤如下
   
   


4. 提交代码时，便会触发流水线

   ![image-20230420232821542](/my-blog/ci/actions/image-20230420232821542.png)

5. 我们需要配置下服务器的nginx,核心代码如下

   ```nginx
   server {
           listen       80;
           listen       [::]:80;
           server_name  _;
           root         /usr/share/nginx/html;
   
           # Load configuration files for the default server block.
           include /etc/nginx/default.d/*.conf;
           
           # 因为我的博客basicUrl是:/my-blog/, 所以location这里匹配使用basicUrl
           location /my-blog/ {
             # 项目打包后的存在在服务器的地址
             alias /home/my-blog/;
             index index.html;
           }
   
           error_page 404 /404.html;
           location = /404.html {
           }
   
           error_page 500 502 503 504 /50x.html;
           location = /50x.html {
           }
       }
   ```

   

6. 然后启动下nginx

## TODO

因为`github Action`涉及到很多的玩法，这里只是简单的发布，可以参考官方文档进行相应的配置
