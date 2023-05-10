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

![](https://i0.hdslb.com/bfs/note/2031282a4bbe13d9604f6c7298e1a1a9cac46550.png@690w_!web-note.avif)

2.选择典型安装，也可选择自定义高级来进行个性化的安装，这里就选择默认的典型安装即可，然后点击下一步。

![](https://i0.hdslb.com/bfs/note/9fc580dd66d4eca48e3be6c6cd9ea215b01518a2.png@690w_!web-note.avif)

3.点击稍后安装，让后点击下一步即可。

![](https://i0.hdslb.com/bfs/note/5d221937270a977ac967d1943c5124208dbfac53.png@690w_!web-note.avif)

4.操作系统选择Linux，版本选择CentOS7 64位，然后点击下一步。

![](https://i0.hdslb.com/bfs/note/81e6261d52e9080daf380cddb7cb3b7b6e67d081.png@690w_!web-note.avif)

5.输入虚拟机的名称和选择虚拟机的位置，默认为C盘，也可以创建到其他盘符。（默认的安装位置是可以更改的；更改方式：VMware的编辑→首选项→工作区→虚拟机默认位置），然后点击下一步

![](https://i0.hdslb.com/bfs/note/20bea15fcee9674bf438a9c624c3d23e28b606ad.png@690w_!web-note.avif)

6.指定虚拟机磁盘容量默认为20G，也可以给的大一点，磁盘容量不要太大20-40G即可。

![](https://i0.hdslb.com/bfs/note/8e965f544cd50bd27e7e690fa120bce21d250593.png@690w_!web-note.avif)

7.选择自定义硬件按钮，也可以直接点击完成，在VMware界面点击编辑虚拟机设置，对虚拟机配置进行更改。

![](https://i0.hdslb.com/bfs/note/a8abc6f451619ec04134e6679dacbd12ec3b0c66.png@690w_!web-note.avif)

8.内存默认为1G，这里我选择的是2G。

![](https://i0.hdslb.com/bfs/note/2f2e652a5f64f6f673bb62bc1218388cde016776.png@690w_!web-note.avif)

9.处理器选项，选择默认的配置即可。如果电脑性能比较好可以给的大一点例如：处理器2个，内核2个。

![](https://i0.hdslb.com/bfs/note/5651c7980ad0593ac96f2a133ebb77a7d85278ba.png@690w_!web-note.avif)

10.在新CD/DVD选项，设备连接为启动时连接，然后选择所要使用的ISO进行，这里使用CentOS7-1910的镜像。

![](https://i0.hdslb.com/bfs/note/4ea3b9dd8f8006258da15d4fbdf23bfe7e493458.png@690w_!web-note.avif)

配置完成即可点击关闭
也可将不需要的硬件进行移除
11.点击完成即可

![](https://i0.hdslb.com/bfs/note/f607077bdae540d8c105318d3cea1e7953adb6aa.png@690w_!web-note.avif)

12.点击开始此虚拟机

![](https://i0.hdslb.com/bfs/note/94faaab5d9066d8863dbac41a3602bc1233904d8.png@690w_!web-note.avif)

13.点击到黑色的虚拟机界面，选择Install CentOS7

![](https://i0.hdslb.com/bfs/note/c2577aa677cb9fde698019fc8d9d093330f2d053.png@690w_!web-note.avif)

14.语言可选择中文或者英文，工作中建议选择英文，在最小化中，中文会出现无法显示或者乱码的情况。

![](https://i0.hdslb.com/bfs/note/bc6ccfa78ee30db78b3f6d983ffc311d75846c1e.png@690w_!web-note.avif)

15.点击软件选择

![](https://i0.hdslb.com/bfs/note/7e92ae2c4039de55048490bac0536491bd5c4903.png@690w_!web-note.avif)

16.选择GNOME桌面，可以在右侧选择所需要的系统选项，这里选择默认，然后点击完成

![](https://i0.hdslb.com/bfs/note/76c1ffb306bc0d933b7fef7b6079c4111ad5ce07.png@690w_!web-note.avif)

17.点击安装位置

![](https://i0.hdslb.com/bfs/note/8e6cdafb6379f2db6c1dc7a8e0f6809cbaf5a5e2.png@690w_!web-note.avif)

18.点击完成即可，也可以进行自定义（boot建议为512M，swap为内存的1.25到2倍，其他给根"/"分区。），然后点击完成。

![](https://i0.hdslb.com/bfs/note/7090b7eb005c0810031c00bc51e80f7c7f2fa087.png@690w_!web-note.avif)

19.点击网络和用户名。

![](https://i0.hdslb.com/bfs/note/2a521af900a3ab90276dc7e6957850bfa61dbbcb.png@690w_!web-note.avif)

20.启动网络，主机名默认即可，然后点击完成

![](https://i0.hdslb.com/bfs/note/cc6d41e98dd61ffd977733c9be43e73fe734bddc.png@690w_!web-note.avif)

21.点击KUMP

![](https://i0.hdslb.com/bfs/note/a892a29ccea218fe2e16079c35425a32b1bbb5ba.png@690w_!web-note.avif)

22.关闭KDUMP，然后点击完成。

![](https://i0.hdslb.com/bfs/note/9a85f4e009999d23a8bae0ed23f52195109d4d74.png@690w_!web-note.avif)

23.点击开始安装。

![](https://i0.hdslb.com/bfs/note/c2f2b85d882420a833ae7cf1267bc1a38d0524d1.png@690w_!web-note.avif)

24.为root创建密码

![](https://i0.hdslb.com/bfs/note/c2bdebb7faa0853b4ee4c84ba9f13bc7f8adba94.png@690w_!web-note.avif)

25.密码输入123456，然后进行确认，然后点击完成。

![](https://i0.hdslb.com/bfs/note/c3107f3c2777e96fb80832139292f0cbda07347a.png@690w_!web-note.avif)

25.为Linux创建一个普通用户

![](https://i0.hdslb.com/bfs/note/dffa1f5f5e1bbf1cc5c775522309f1ec724730e4.png@690w_!web-note.avif)

26.输入用户名和密码（用户名随意，密码为123456，记得确认一下密码）

![](https://i0.hdslb.com/bfs/note/48367ecd043eec308b34fd1742155f5d9844f7b0.png@690w_!web-note.avif)

此刻虚拟机已经安装成功了！



> 💡: centos 国内镜像下载地址
>
> 阿里开源镜像站：https://developer.aliyun.com/mirror/
> 清华大学开源镜像站：https://mirrors.tuna.tsinghua.edu.cn/
> 腾讯开源镜像站：https://mirrors.cloud.tencent.com/
>
> 镜像站：http://mirror.nsc.liu.se/centos-store/7.6.1810/isos/x86_64/
