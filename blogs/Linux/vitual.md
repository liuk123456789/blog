---
title: VM ware
date: 2023-05-09
categories: 
 - Linux
tags:
 - VM ware
sidebar: auto
---

## 1. 前言

因为最近学习`Linux`和`Docker`，所以搞了个虚拟机（windows）,所以整理下虚拟机的安装的步骤

## 2. 安装VM ware workstation

[安装地址](https://www.vmware.com/cn/products/workstation-pro/workstation-pro-evaluation.html)

1.点击创建此虚拟机

![image-20230510111445126](/my-blog/linux/image-20230510111445126.png)

2.选择典型安装，也可选择自定义高级来进行个性化的安装，这里就选择默认的典型安装即可，然后点击下一步。

![image-20230510111556418](/my-blog/linux/image-20230510111556418.png)

3.点击稍后安装，让后点击下一步即可。

![image-20230510111635646](/my-blog/linux/image-20230510111635646.png)

4.操作系统选择Linux，版本选择CentOS7 64位，然后点击下一步。

![image-20230510111748474](/my-blog/linux/image-20230510111748474.png)

5.输入虚拟机的名称和选择虚拟机的位置，默认为C盘，也可以创建到其他盘符。（默认的安装位置是可以更改的；更改方式：VMware的编辑→首选项→工作区→虚拟机默认位置），然后点击下一步

![image-20230510111824786](/my-blog/linux/image-20230510111824786.png)

6.指定虚拟机磁盘容量默认为20G，也可以给的大一点，磁盘容量不要太大20-40G即可。

![image-20230510111912364](/my-blog/linux/image-20230510111912364.png)

7.选择自定义硬件按钮，也可以直接点击完成，在VMware界面点击编辑虚拟机设置，对虚拟机配置进行更改。

![image-20230510111951564](/my-blog/linux/image-20230510111951564.png)

8.内存默认为1G，这里我选择的是2G。

![image-20230510112031828](/my-blog/linux/image-20230510112031828.png)

9.处理器选项，选择默认的配置即可。如果电脑性能比较好可以给的大一点例如：处理器2个，内核2个。

10.在新CD/DVD选项，设备连接为启动时连接，然后选择所要使用的ISO进行，这里使用CentOS7-1910的镜像。

配置完成即可点击关闭
也可将不需要的硬件进行移除
11.点击完成即可

12.接下来就是centos配置相关的，可以参考这篇文章

[cenos7的安装&配置](https://zhuanlan.zhihu.com/p/166686414)

> 文章中使用的VM wate 14，需要注意下



> 💡: centos iso国内镜像下载地址
>
> 阿里开源镜像站：https://developer.aliyun.com/mirror/
> 清华大学开源镜像站：https://mirrors.tuna.tsinghua.edu.cn/
> 腾讯开源镜像站：https://mirrors.cloud.tencent.com/
>
> 镜像站：http://mirror.nsc.liu.se/centos-store/7.6.1810/isos/x86_64/
