---
title: github actions流水线
date: 2023-04-20
categories:
 - CI
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
         	# 拷贝打包的资源public
         - name: copy file via ssh password
           # 因为构建之后，需要把代码上传到服务器上，所以需要连接到ssh，并且做一个拷贝操作
           uses: cross-the-world/scp-pipeline@master
           env:
             WELCOME: "ssh scp ssh pipelines"
             LASTSSH: "Doing something after copying"
           with:
             host: ${{ secrets.REMOTE_HOST }}
             user: ${{ secrets.REMOTE_USER }}
             pass: ${{ secrets.REMOTE_PASS }}
             connect_timeout: 10s
             local: './public/*'
             remote: /home/my-blog
   
   ```

3.  `actions secrets`的设置

   上面我们可以看到使用`REMOTE_HOST`等变量形式，所以这里的变量是如何配置呢，步骤如下
   
   1. ![Dingtalk_20230421103726](/my-blog/ci/actions/Dingtalk_20230421103726.jpg)
   2. ![Dingtalk_20230421104049](/my-blog/ci/actions/Dingtalk_20230421104049.jpg)
   3. ![Dingtalk_20230421104150](/my-blog/ci/actions/Dingtalk_20230421104150.jpg)


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
           
           # 因为我的博客baseUrl是/my-blog/, 所以location这里匹配使用basicUrl
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

6. 然后重新启动下`nginx`

   ```shell
   systemctl reload nginx
   ```

7. 效果图

   ![image-20230421103355889](/my-blog/ci/actions/image-20230421103355889.png)

## TODO

因为`github Action`涉及到很多的玩法，这里只是简单的发布，可以参考官方文档进行相应的配置



## 2023.04.26

因为博客还通过`github page`部署了，原先是通过项目中的`deploy.sh`的脚本部署，觉得这样太过于麻烦，所以使用`github action`完成部署

我们需要修改的就是`release.yml`，修改如下

```yaml
- name: Deploy GitHub Pages site
	# uses: crazy-max/ghaction-github-			     pages@c0d7ff0487ee0415efb7f32dab10ea880330b1dd
	uses: crazy-max/ghaction-github-pages@v3.1.0
    with:
      target_branch: gh-pages
      build_dir: public
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

💡：GITHUB_TOKEN是自动生成的，我们无需在`action`的`secrets`中进行配置，我们也可以使用`github.token`进行替换

我们看下`CI`的结果是否可以正常跑通

![image-20230426094657890](/my-blog/ci/actions/image-20230426094657890.png)

复制`github page`的`site`，看下博客是否正常

![image-20230426094917339](/my-blog/ci/actions/image-20230426094917339.png)

正常发布了，这样的话，我们每次提交代码的时候，都会自动部署到服务器&`github page`
