---
title: github actions流水线
date: 2023-04-20
categories:
 - ci
tags:
 - github actions
sidebar: auto
---

## 1. 使用github Actions 进行流水线作业

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

   上面我们可以看到使用`${{ secrets.REMOTE_HOST }}`等变量形式，所以这里的变量是如何配置呢，步骤如下

   

4. 
