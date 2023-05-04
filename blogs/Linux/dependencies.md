---
title: Linux 软件配置
date: 2023-04-28
categories: 
 - Linux
tags:
 - linux dependencies
sidebar: auto
---

## MySQL安装

### `MySQL5.7`在`centos`的安装

- 配置`yum`仓库

  ```shell
  rum --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022
  ```

- 安装`MySQL`

  ```shell
  rpm -Uvh http://repo.mysql.com//mysql57-community-release-el7-7.noarch.rpm
  ```

- 使用`yum`安装`MySQL`

  ```shell
  yum -y install mysql-community-server
  ```

- 安装完成后，启动`MySQL`

  `MySQL`安装完成后，会自动配置名称为：`mysqld`的服务，可以被`systemctl`所管理

  ```shell
  systemctl start mysqld # 启动
  systemctl enable mysqlId # 开机自启
  ```

#### 配置

1. 获取`MySQL`的初始密码

   ```shell
   grep 'temporary password' /var/log/mysqld.log
   ```

2. 登录`MySQL`数据库系统

   ```shell
   mysql -u root -p
   ```

3. 修改`root`用户密码

   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY '密码';	-- 密码需要符合：大于8位，有大写字母，有特殊符号，不能是连续的简单语句如123，abc
   ```

4. 配置简单的`root`密码

   ```sql
   # 如果你想设置简单密码，需要降低Mysql的密码安全级别
   set global validate_password_policy=LOW; # 密码安全级别低
   set global validate_password_length=4;	 # 密码长度最低4位即可
   
   # 然后就可以用简单密码了（课程中使用简单密码，为了方便，生产中不要这样）
   ALTER USER 'root'@'localhost' IDENTIFIED BY '简单密码';
   ```

5. 配置远程登录

   > 默认情况下，root用户是不运行远程登录的，只允许在MySQL所在的Linux服务器登陆MySQL系统
   >
   > 请注意，允许root远程登录会带来安全风险

   ```sql
   # 授权root远程登录
   grant all privileges on *.* to root@"IP地址" identified by '密码' with grant option;  
   # IP地址即允许登陆的IP地址，也可以填写%，表示允许任何地址
   # 密码表示给远程登录独立设置密码，和本地登陆的密码可以不同
   
   # 刷新权限，生效
   flush privileges;
   ```

6. 退出`exit`/`ctrl + D`

7. 检查端口

   1. MySQL默认绑定了3306端口，可以通过端口占用检查MySQL的网络状态

      ```shell
      netstat -anp | grep 3306
      ```

      ![image-20221012183746802](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/12/20221012183746.png)

### `Mysql8.0`在`centos`的安装

#### 安装

1. 配置yum仓库

   ```shell
   # 更新密钥
   rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022
   
   # 安装Mysql8.x版本 yum库
   rpm -Uvh https://dev.mysql.com/get/mysql80-community-release-el7-2.noarch.rpm
   ```

2. 使用yum安装MySQL

   ```shell
   # yum安装Mysql
   yum -y install mysql-community-server
   ```

3. 安装完成后，启动MySQL并配置开机自启动

   ```shell
   systemctl start mysqld		# 启动
   systemctl enable mysqld		# 开机自启
   ```

   > MySQL安装完成后，会自动配置为名称叫做：`mysqld`的服务，可以被systemctl所管理

4. 检查MySQL的运行状态

   ```shell
   systemctl status mysqld
   ```

#### 配置

主要修改root密码和允许root远程登录

1. 获取MySQL的初始密码

   ```shell
   # 通过grep命令，在/var/log/mysqld.log文件中，过滤temporary password关键字，得到初始密码
   grep 'temporary password' /var/log/mysqld.log
   ```

2. 登录MySQL数据库系统

   ```shell
   # 执行
   mysql -uroot -p
   # 解释
   # -u，登陆的用户，MySQL数据库的管理员用户同Linux一样，是root
   # -p，表示使用密码登陆
   
   # 执行完毕后输入刚刚得到的初始密码，即可进入MySQL数据库
   ```

3. 修改root密码

   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '密码';	-- 密码需要符合：大于8位，有大写字母，有特殊符号，不能是连续的简单语句如123，abc
   ```

4. [扩展]，配置root的简单密码

   > 我们可以给root设置简单密码，如123456.
   >
   > 请注意，此配置仅仅是用于测试环境或学习环境的MySQL，如果是正式使用，请勿设置简单密码

   ```sql
   set global validate_password.policy=0;		# 密码安全级别低
   set global validate_password.length=4;		# 密码长度最低4位即可
   ```

   

5. 允许root远程登录，并设置远程登录密码

   > 默认情况下，root用户是不运行远程登录的，只允许在MySQL所在的Linux服务器登陆MySQL系统
   >
   > 请注意，允许root远程登录会带来安全风险

   ```sql
   # 第一次设置root远程登录，并配置远程密码使用如下SQL命令
   create user 'root'@'%' IDENTIFIED WITH mysql_native_password BY '密码!';	-- 密码需要符合：大于8位，有大写字母，有特殊符号，不能是连续的简单语句如123，abc
   
   # 后续修改密码使用如下SQL命令
   ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '密码';
   ```

6. 退出MySQL控制台页面

   ```sql
   # 退出命令
   exit
   
   # 或者通过快捷键退出：ctrl + d
   ```

7. 检查端口

   MySQL默认绑定了3306端口，可以通过端口占用检查MySQL的网络状态

   ```shell
   netstat -anp | grep 3306
   ```

   ![image-20221012192303607](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/12/20221012192303.png)



### MySQL5.7版本在Ubuntu（WSL环境）系统安装

> 课程中配置的WSL环境是最新的Ubuntu22.04版本，这个版本的软件商店内置的MySQL是8.0版本
>
> 所以我们需要额外的步骤才可以安装5.7版本的MySQL



安装操作需root权限，你可以：

1. 通过 sudo su -，切换到root用户

   > 课程中选择这种方式操作

2. 或在每一个命令前，加上sudo，用来临时提升权限



#### 安装

1. 下载apt仓库文件

   ```shell
   # 下载apt仓库的安装包，Ubuntu的安装包是.deb文件
   wget https://dev.mysql.com/get/mysql-apt-config_0.8.12-1_all.deb
   ```

   ![image-20221016094103315](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016094103.png)

2. 配置apt仓库

   ```shell
   # 使用dpkg命令安装仓库
   dpkg -i mysql-apt-config_0.8.12-1_all.deb
   ```

   弹出框中选择：`ubuntu bionic` （Ubuntu18.04系统的代号是bionic，选择18.04的版本库用来安装）

   ![image-20221016094142343](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016094142.png)

   弹出框中选择：`MySQL Server & Cluster`

   ![image-20221016094216377](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016094216.png)

   弹出框中选择：`mysql-5.7`

   ![image-20221016094254397](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016094254.png)

   最后选择：`ok`

   ![image-20221016094306917](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016094306.png)

3. 更新apt仓库的信息

   ```shell
   # 首先导入仓库的密钥信息
   apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 467B942D3A79BD29
   # 更新仓库信息
   apt update
   ```

4. 检查是否成功配置MySQL5.7的仓库

   ```shell
   apt-cache policy mysql-server
   ```

   ![image-20221016094546943](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016094546.png)

   看到如图所示字样，即成功

5. 安装MySQL5.7

   ```shell
   # 使用apt安装mysql客户端和mysql服务端
   apt install -f -y mysql-client=5.7* mysql-community-server=5.7*
   ```

   弹出框中输入root密码并选择ok，密码任意，课程中以123456代替

   ![image-20221016094941439](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016094941.png)

   再次输入root密码确认

   ![image-20221016094954505](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016094954.png)

6. 启动MySQL

   ```shell
   /etc/init.d/mysql start			# 启动
   /etc/init.d/mysql stop			# 停止
   /etc/init.d/mysql status		# 查看状态
   ```

   ![image-20221016095259172](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016095259.png)

7. 对MySQL进行初始化

   ```shell
   # 执行如下命令，此命令是MySQL安装后自带的配置程序
   mysql_secure_installation
   # 可以通过which命令查看到这个自带程序所在的位置
   root@DESKTOP-Q89USRE:~# which mysql_secure_installation
   /usr/bin/mysql_secure_installation
   ```

   1. 输入密码：

      ![image-20221016095458755](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016095458.png)

   2. 是否开启密码验证插件，如果需要增强密码安全性，输入`y`并回车，不需要直接回车（课程中选择直接回车）

      ![image-20221016095537716](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016095537.png)

   3. 是否更改root密码，需要输入`y`回车，不需要直接回车（课程不更改）

      ![image-20221016095621386](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016095621.png)

   4. 是否移除匿名用户，移除输入`y`回车，不移除直接回车（课程选择移除）

      ![image-20221016101232827](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016101232.png)

   5. 是否进制root用户远程登录，禁止输入`y`回车，不禁止直接回车（课程选择不禁止）

      ![image-20221016101324577](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016101324.png)

   6. 是否移除自带的测试数据库，移除输入`y`回车，不移除直接回车（课程选择不移除）

      ![image-20221016101404392](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016101404.png)

   7. 是否刷新权限，刷新输入`y`回车，不刷新直接回车（课程选择刷新）

      ![image-20221016101442459](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016101442.png)

8. 登陆MySQL

   ```shell
   mysql -uroot -p
   # 输入密码即可登陆成功
   ```

   ![image-20221016101524498](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016101524.png)



至此，在Ubuntu上安装MySQL5.7版本成功。



### MySQL8.0版本在Ubuntu（WSL环境）系统安装

> 课程中配置的WSL环境是最新的Ubuntu22.04版本，这个版本的软件商店内置的MySQL是8.0版本
>
> 所以直接可以通过apt安装即可

> 注意，课程是以WSL获得的Ubuntu操作系统环境。
>
> 如果你通过VMware虚拟机的方式获得了Ubuntu操作系统环境，操作步骤不用担心，和课程中使用WSL环境是==完全一致的==



安装操作需root权限，你可以：

1. 通过 sudo su -，切换到root用户

   > 课程中选择这种方式操作

2. 或在每一个命令前，加上sudo，用来临时提升权限

#### 安装

1. 如果已经安装过MySQL5.7版本，需要卸载仓库信息哦

   ```shell
   # 卸载MySQL5.7版本
   apt remove -y mysql-client=5.7* mysql-community-server=5.7*
   
   # 卸载5.7的仓库信息
   dpkg -l | grep mysql | awk '{print $2}' | xargs dpkg -P
   ```

2. 更新apt仓库信息

   ```shell
   apt update
   ```

3. 安装mysql

   ```shell
   apt install -y mysql-server
   ```

4. 启动MySQL

   ```shell
   /etc/init.d/mysql start			# 启动
   /etc/init.d/mysql stop			# 停止
   /etc/init.d/mysql status		# 查看状态
   ```

5. 登陆MySQL设置密码

   ```shell
   # 直接执行：mysql
   mysql
   ```

6. 设置密码

   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
   ```

7. 退出MySQL控制台

   ```shell
   exit
   ```

8. 对MySQL进行初始化

   ```shell
   # 执行如下命令，此命令是MySQL安装后自带的配置程序
   mysql_secure_installation
   # 可以通过which命令查看到这个自带程序所在的位置
   root@DESKTOP-Q89USRE:~# which mysql_secure_installation
   /usr/bin/mysql_secure_installation
   ```

   1. 输入密码：

      ![image-20221016095458755](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016095458.png)

   2. 是否开启密码验证插件，如果需要增强密码安全性，输入`y`并回车，不需要直接回车（课程中选择直接回车）

      ![image-20221016095537716](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016095537.png)

   3. 是否更改root密码，需要输入`y`回车，不需要直接回车（课程不更改）

      ![image-20221016095621386](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016095621.png)

   4. 是否移除匿名用户，移除输入`y`回车，不移除直接回车（课程选择移除）

      ![image-20221016101232827](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016101232.png)

   5. 是否进制root用户远程登录，禁止输入`y`回车，不禁止直接回车（课程选择不禁止）

      ![image-20221016101324577](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016101324.png)

   6. 是否移除自带的测试数据库，移除输入`y`回车，不移除直接回车（课程选择不移除）

      ![image-20221016101404392](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016101404.png)

   7. 是否刷新权限，刷新输入`y`回车，不刷新直接回车（课程选择刷新）

      ![image-20221016101442459](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016101442.png)

9. 重新登陆MySQL（用更改后的密码）

   ```shell
   mysql -uroot -p
   ```

   ![image-20221016110414182](https://image-set.oss-cn-zhangjiakou.aliyuncs.com/img-out/2022/10/16/20221016110414.png)


### 远程连接数据库

我是使用`Navicat`连接的，如果连接不上，[参考此篇](https://www.jianshu.com/p/b6dda0a1aa78)

![20230504150609.jpg](/my-blog/linux/Dingtalk_20230504150609.jpg)

## Nginx安装

### 安装

Nginx同样需要配置额外的yum仓库，才可以使用yum安装

> 安装Nginx的操作需要root身份



1. 安装yum依赖程序

   ```shell
   # root执行
   yum install -y yum-utils
   ```

2. 手动添加，nginx的yum仓库

   yum程序使用的仓库配置文件，存放在：`/etc/yum.repo.d`内。

   ```shell
   # root执行
   # 创建文件使用vim编辑
   vim /etc/yum.repos.d/nginx.repo
   # 填入如下内容并保存退出
   [nginx-stable]
   name=nginx stable repo
   baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
   gpgcheck=1
   enabled=1
   gpgkey=https://nginx.org/keys/nginx_signing.key
   module_hotfixes=true
   
   [nginx-mainline]
   name=nginx mainline repo
   baseurl=http://nginx.org/packages/mainline/centos/$releasever/$basearch/
   gpgcheck=1
   enabled=0
   gpgkey=https://nginx.org/keys/nginx_signing.key
   module_hotfixes=true
   ```

   > 通过如上操作，我们手动添加了nginx的yum仓库

3. 通过yum安装最新稳定版的nginx

   ```shell
   # root执行
   yum install -y nginx
   ```

4. 启动

   ```shell
   # nginx自动注册了systemctl系统服务
   systemctl start nginx		# 启动
   systemctl stop nginx		# 停止
   systemctl status nginx		# 运行状态
   systemctl enable nginx		# 开机自启
   systemctl disable nginx		# 关闭开机自启
   ```

5. 配置防火墙放行

   nginx默认绑定80端口，需要关闭防火墙或放行80端口

   ```shell
   # 方式1，关闭防火墙
   systemctl stop firewalld		# 关闭
   systemctl disable firewalld		# 关闭开机自启
   
   # 方式2(推荐)，放行80端口
   firewall-cmd --add-port=80/tcp --permanent		# 放行tcp规则下的80端口，永久生效
   firewall-cmd --reload						    # 重新加载防火墙规则
   # 查看新增端口是否对外开放
   firewall-cmd --list-all
   ```

6. 启动后浏览器输入Linux服务器的IP地址或主机名即可访问

   http://192.168.154.30 或 http://centos-koona

   > ps：80端口是访问网站的默认端口，所以后面无需跟随端口号
   >
   > 显示的指定端口也是可以的比如：
   >
   > - http://192.168.154.30:80
   > - http://centos-koona:80

至此，Nginx安装配置完成。

![20230504165457](/my-blog/linux/Dingtalk_20230504165457.jpg)

