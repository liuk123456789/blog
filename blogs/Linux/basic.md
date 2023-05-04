---
title: Linux常用命令
date: 2023-04-25
categories: 
 - Linux
tags:
 - linux command
sidebar: auto
---
## linux的常用基础命令&用法

### ls

选项配置：

- -a 获取所有的文件，包含隐藏文件
- -l 列表形式展示
- -h 需要搭配-l使用，展示文件大小

### cd&pwd

#### cd 使用

```shell
# 切换到根目录
cd /
# 切换到工作目录
cd
# 切换到Music
cd /home/koona/Music
```

#### pwd

输出当前所在的工作目录的路径

### 相对路径和绝对路径

绝对路径：以根目录为起点，描述路径的一种写法

绝对路径：以当前目录为起点，描述路径的一种写法

### 特殊路径符

- `.`表示当前目录，如`cd ./Desktop` 表示当前目录下的`Desktop`目录内，和`cd Desktop`一致
- `..`表示上一级目录，比如`cd ..`即可回到上级目录
- `~`表示`HOME`目录，比如`cd ~`即可回到`HOME`目录

### mkdir

语法：`mkdir [-p] linux路径`

`-p`非必填，用于创建层级目录

```shell
# 创建test目录
mkdir test
# 创建了test2、bin、test目录
mkdir -p ~/test2/bin/cash
```

### touch&cat&more

#### touch

含义：创建文件

语法：`touch linux路径`

```shell
# 当前目录创建text.txt文件
touch text.txt
# 工作目录创建text.txt文件
touch ~/text.txt
# 上级目录下的test 创建text.txt文件
touch ../test/text.txt
```

#### cat

含义：查看文件内容

语法：`cat linux路径`

```shell
# 查看text.txt的文件内容
cat ~/test/text.txt # This is my way
```

#### more

含义：查看更多文件内容

语法：`more linux路径`

文件内容过多时，使用`more`可以翻页查看内容，同时可以使用`q`退出

```shell
# 查看text.txt的文件内容
more ~/test/text.txt
```

### cp&mv&rm

#### cp

含义：复制文件/文件目录

语法：`cp [-r] 参数1 参数2`

- -r 可选，用于复制文件夹，使用递归方式
- 参数1，`Linux`路径,表示被复制的文件/文件夹
- 参数2，`Linux`路径，表示要复制去得地方

```shell
# 回到工作目录
cd
# 创建test.txt文件
touch test.txt
# 复制test.txt内容到test1.txt
cp test.txt test1.txt
# 查看文件是否存在
ls

# 创建一个文件目录
mkdir -p it/test/test.txt
# 复制文件夹到it-test
cp -r it it-test
# 查看文件目录是否生成
ls -la it-test
```

#### mv

含义：移动文件/文件目录

语法：`mv 参数1 参数2`

- 参数1：源文件/文件目录

- 参数2：目标文件/文件目录

```shell
cd
mv test1.txt Desktop/
ls -la Desktop
# 如果不存在test3.txt，那么就是将test重命名
mv test.txt test3.txt

mv itcast/ it/
```

#### rm

含义：用于删除文件/文件目录

语法：`rm [-r] 参数1 参数2 参数3 ...`

- 参数不进行限制，`-r`代表删除文件目录

```shell
rm -r it it-test
rm test.txt
```

`rm`支持通配符`*`,用来做模糊匹配

- 符号`*`表示通配符，匹配任意内容
- test*，表示匹配任何以`test`开头的内容
- *test，表示匹配任何以`test`结尾的内容
- *test *，表示匹配任何包含test的内容

使用`-rf` 强制删除文件/文件目录，使用需要特别注意

### which&find

#### which

含义：用于查找命令路径

语法：`which 查找的命令`

```shell
which cd
which pwd
which mkdir
which touch
```

#### find

含义：用于查找文件路径

1. 按照文件名查找文件

   语法：`find 起始路径 -name '查找的文件名'`

   `find`支持通配符模糊匹配，规则同`rm`的规则

2. 按照文件大小搜索

   语法：`find 起始路径 -size +|- n [kmg]`

   - +、-表示大于和小于
   - n表示大小数字
   - kmg 表示大小单位，k代表kb，m代表M，g代表G
   - 如果不使用`+``-`，那就是`=`的意思

### grep

含义：从文件中通过关键字过滤文件行

语法：`grep [-n] 关键字 文件路径`

- 选项-n，可选，表示在结果中匹配行号
- 参数，关键字，必填，表示过滤的关键字，带有空格的需要使用引号包裹
- 参数，文件路径，必填，表示要过滤的文件内容的文件路径，作为内容输入端口

```bash
touch test.txt
# test ddd
grep 'test' test.txt
# 1:test ddd
grep -n 'test' test.txt

# 左边的结果 作为grep内容输入
cat test.txt | grep 'test'

# 管道符嵌套
cat test.txt | grep 'test' | grep 'ddd'
```

### wc

含义： 通过wc命令统计文件的行数、单词数量等

语法：`wx [-c -m -l -w] 文件路径` 

- 选项，-c，统计bytes数量
- 选项，-m，统计字符数量
- 选项，-l，统计行数
- 选项，-w，统计单词数量
- 参数，文件路径，被统计的文件，作为内容输入的端口

```bash
# 2 行 5 单词数量 31 字节数 test.txt 文件名
wc test.txt

# 左边的结果 作为grep内容输入
cat test.txt | wc -l  | wc -w
```

### echo&tail&重定向符号的使用

#### echo

含义：命令行中输出指定内容

语法：`echo 输出的内容`

- 无需选项，只有一个参数，表示输出的内容

#### 反引号``

被包裹的内容作为命令输出

#### 重定向符号

- `>`，将左侧的命令的结果，覆盖写入到符号右侧指定的文件中
- `>>`，将左侧命令的结果，追加写入到符号右侧指定的文件中

```bash
echo "this is linux" > test.txt
echo "this is learn linux commader" >> test.txt
```

#### tail命令

含义：查看文件尾部内容，跟踪文件的最新的更改，

语法：`tail [-f -num] linux路径`

- 参数，linux路径，表示被跟踪的文件路径
- 选项，-f，表示持续跟踪
- 选项，-num，表示查看尾部多少行，不填默认10行

```bash
# 查看尾部第一行的内容
tail -1 test.txt

# 跟踪文件内容更改
tail -f test.txt
```

备注：如果使用`-f`，可以使用`ctrl + c`退出跟踪

### vim编辑器（vi的加强版）

语法：`vim linux路径`

命令模式的快捷键

| 命令          | 描述                             |
| ------------- | -------------------------------- |
| i             | 当前光标位置进入输入模式         |
| a             | 当前光标位置 之后，进入输入模式  |
| I             | 当前行的开头，进入输入模式       |
| A             | 当前行的结尾，进入输入模式       |
| o             | 当前光标下一行进入输入模式       |
| O             | 当前光标上一行进入输入模式       |
| esc           | 任何情况输入回到命令模式         |
| 键盘上、键盘k | 向上移动光标                     |
| 键盘下、键盘j | 向下移动光标                     |
| 键盘左、键盘h | 向左移动光标                     |
| 键盘右、键盘l | 向右移动光标                     |
| 0             | 移动光标到当前行的开头           |
| $             | 移动光标到当前行的结尾           |
| pageup        | 向上翻页                         |
| pagedown      | 向下翻页                         |
| /             | 进入搜索模式                     |
| n             | 向下继续搜索                     |
| N             | 向上继续搜索                     |
| dd            | 删除光标所在行的内容             |
| ndd           | n是数字，表示删除当前光标向下n行 |
| yy            | 复制当前行                       |
| nyy           | n是数字，复制当前行和下面的n行   |
| p             | 粘贴复制的内容                   |
| u             | 撤销修改                         |
| ctrl + r      | 反向撤销修改                     |
| gg            | 跳到首行                         |
| G             | 跳到行尾                         |
| dG            | 从当前行开始，向下全部删除       |
| dgg           | 从当前行开始，向上全部删除       |
| d$            | 从当前光标开始，删除到本行的结尾 |
| d0            | 从当前光标开始，删除到本行的开头 |

### su&exit

#### su

含义：切换用户

语法：`su [-] { 用户名 }`

- -符号是可选的，表示是否在切换用户后加载环境变量
- 参数：用户名
- 切换用户后，可以通过exit命令退回上一个用户
- 使用普通用户，切换到其他用户`需要输入密码`
- 使用root用户切换到其他用户，`无需密码`

#### sudo

含义：普通用户获取`root`权限

语法：`sudo 命令`

如何分配：

1. 执行以下命令

   ```bash
   su - root
   visudo
   ```

2. 在`vim`编辑文件末尾添加

   ```
   koona ALL=(ALL) NOPASSWD:ALL
   ```

3. `wq`保存

### 用户、用户组

#### 用户组

1. 创建用户组

   语法：`groupadd 用户组名`

   ```bash
   sudo - root
   groupdadd itkoona
   ```

2. 删除用户组

   语法：`groupdel 用户组名`

   ```bash
   sudo - root
   groupdel itkoona
   ```

#### 用户

备注：需要root用户执行

1. 创建用户

   语法：`useradd [-g -d] 用户名`

   - 选项：-g指定用户的组，不指定-g，会创建同名组并自动加入，指定-g需要组已经存在，如果已存在同名组，必须使用-g
   - 选项：-d指定用户HOME路径，不指定，HOME目录默认在：/home/用户名

   ```bash
   groupadd group-test
   # 指定工作目录，不指定工作组
   useradd user-test -d /home/userTest
   # uid=1001(user-test) gid=1002(user-test) groups=1002(user-test)
   id user-test
   cd /home/userTest
   # 不指定工作目录，指定工作组
   useradd user-test2 -g group-test
   # uid=1002(user-test2) gid=1001(group-test) groups=1001(group-test)
   id user-test
   cd /home/user-test2
   
   ```

2. 删除用户

   语法：`userdel [-r] 用户名`

   - 选项：-r，删除用户的HOME目录，不使用-r，删除用户时，HOME目录保留

   ```bash
   userdel -r user-test2
   ```

3. 查看用户所属组

   语法：`id [用户名]`

   - 参数：用户名，被查看的用户，如果不提供则查看自身

4. 修改用户所属组

   语法：`usermod -aG 用户组 用户名`将指定的用户加入到指定的用户组中

   ```bash
   # uid=1001(user-test) gid=1002(user-test) groups=1002(user-test),1001(group-test)
   
   usermod -aG group-test user-test
   ```

#### getent

**查看用户**

含义：查看当前系统中有哪些用户

语法：`getent passwd`

```bash
getent passwd
```

**查看用户组**

含义：查看当前系统中有哪些用户组

语法：`getent group`

```bash
getent group
```

### 查看权限控制信息

通过`ls -l`可以以列表形式展示内容，并显示权限细节

```bash
drwxr-xr-x. 2 koona koona 6 Apr 22 11:39 Desktop
drwxr-xr-x. 2 koona koona 6 Apr 22 11:39 Documents
drwxr-xr-x. 2 koona koona 6 Apr 22 11:39 Downloads
drwxr-xr-x. 2 koona koona 6 Apr 22 11:39 Music
drwxr-xr-x. 2 koona koona 6 Apr 22 11:39 Pictures
drwxr-xr-x. 2 koona koona 6 Apr 22 11:39 Public
drwxr-xr-x. 2 koona koona 6 Apr 22 11:39 Templates
drwxr-xr-x. 2 koona koona 6 Apr 22 11:39 Videos
```

其中的`drwxr-xr-x`

- 首位的`-/d`/l表示文件/文件夹/软连接
- 接下来的三位，用于表示所属用户权限
- 在接下来的三位表示所属的用户组权限
- 最后三位表示其他用户权限

**r&w&x**

**r**代表读权限

**w**代表写权限

**x**代表执行权限

针对文件、文件夹的不同，`rwx`的含义有细微差别

- **r**针对文件可以查看文件内容，对于文件夹，可以查看文件夹内容
- **w**针对文件表示可以修改此文件，对于文件夹，可以在我呢佳佳创建、删除、改名等操作
- **x**针对文件表示可以将文件作为程序执行，对于文件夹，表示可以更改工作目录到此文件夹，即`cd`进入

### chmod

可以使用`chmod`命令，修改文件、文件夹的权限信息
`注意，只有文件、文件夹的所属用户或root用户可以修改`

语法：`chmod [-R] 权限 文件或文件夹`

- 选项：-R，对文件夹内的全部内容应用同样的操作

示例

- `chmod u=rwx,g=rx,o=x hello.txt`将文件权限修改为：`rwxr--x--x`
  - 其中：u表示user所属用户权限，g表示group组权限，o表示other其他用户权限
- `chmod -R u=rwx,g=rx,o=x test`将文件夹test以及文件夹内的全部内容权限设置为：`rwxr-x--x`

```bash
cd ~
touch test.txt
# -rwxr---w-
chmod u=rwx,g=r,o=w test.txt
# drwxr-x--x. 3 koona koona 19 4月  25 02:27 test
mkdir -p test/other/test.txt
chmod -R u=rwx,g=rx,o=x test
```

权限可以通过数字进行表示

- 0：无任何权限，即---
- 1：仅有x权限，即--x
- 2:  仅有w权限，即-w-
- 3：有w和x权限，即-wx
- 4：仅有r权限，即r--
- 5：有r和x权限，即r-x
- 6：有r和w权限，即rw-
- 7：有全部权限，即rwx

```bash
# drwxr----x. 3 koona koona 19 4月  25 02:27 test
chmod -R 741 test
```

### chown

使用`chown`命令，可以修改文件、文件夹的所属用户和用户组

`普通用户无法修改所属为其他用户或组，所以此命令只适用root用户执行`

语法：`chown [-R] [用户][:][用户组] 文件或文件夹`

- 选项，-R，同`chmod`，对文件夹内全部内容应用相同规则
- 选项，用户，修改所属用户
- 选项，用户组，修改所属用户组
- :用于分隔用户和用户组

示例

- `chown root hello.txt`，将`hello.txt`所属用户修改为`root`
- `chown :root hello.txt`，将`hello.txt`所属用户组修改为`root`
- `chown root:koona hello.txt`，将`hello.txt`所属用户修改为`root`，用户组修改为`koona`
- `chown -R root test`，将文件夹`test`的所属用户修改为`root`并对文件夹内去拿内容应用同样规则

```bash
su - root
cd /home/koona
# -rwxr---w-. 1 root  koona  0 Apr 25 02:22 text.txt
chown root text.txt
# -rwxr---w-. 1 root  root   0 Apr 25 02:22 text.txt
chown :root text.txt
# -rwxr---w-. 1 root  koona  0 Apr 25 02:22 text.txt
chown root:koona text.txt
# drwxr----x. 3 root  koona 19 Apr 25 02:27 test
chown root test
```

### 常用快捷键

`ctrl + c` 强制停止

`ctrl + d`退出/登录，注意不能退出vi/vim

`history`，查看历史输入的命令

`!命令对应的字符`，快捷执行最近一次的执行命令

`ctrl + r`，用于搜索命令

`ctrl + a`，跳到命令开头

`ctrl + e`，跳到命令结尾

`ctrl + 键盘左键`，向左跳一个单词

`ctrl + 键盘右键`，向右跳一个单词

`ctrl + l/ clear`清空终端内容

### 软件安装包

#### yum

含义：RPM包软件管理器，用于自动化安装配置Linux软件，并可以自动解决依赖问题

语法：`yum [-y] [install | remove | search]  软件名称`

- 选项： -y，自动确认，无需手动确认安装或卸载过程
- install: 安装
- remove: 卸载
- search:搜索

yum命令需要root权限哦，可以su切换到root，或使用sudo提权

yum命令需要联网

### systemctl

含义：控制软件的启动、停止、开启

能够被`systemctl`管理的软件，也被称之为服务

语法:`systemctl start | stop | status | enable | disable 服务名`

系统内置服务比较多，比如：

- NetworkManager,主网络服务
- network，副网络服务
- firewalld，防火墙服务
- sshd,ssh服务（FinalShell远程登录Linux使用的就是这个服务）

###  ln 创建软连接

含义：在系统中创建软连接，可以将文件、文件夹链接到其他位置

语法：`ln -s 参数1 参数2`

- -s 选项，创建软连接
- 参数1：被链接的文件或文件夹
- 参数2：要链接去的目的地

实例：

- `ln -s /etc/yum.conf~/yum.conf`
- `ln -s /etc/yum~/yum`

```bash
cd
ln -s /etc/yum ~/yum
ln -s /etc/yum.conf ~/yum.conf
```

### 日期和时区

#### date

语法：`date  [-d] [+格式化字符串]`

- -d 按照给定的字符串显示日期，一般用于日期计算

- 格式化字符串：通过特定的字符串标记，来控制显示的日期格式

  - %Y 年

  - %y 年分后两位数字

  - %m 月份

  - %d 日

  - %H 小时

  - %M 分钟

  - %S 秒

  - %s 自1970-01-01 00:00:00 UTC 到现在的秒数

    ```bash
    date +%Y-%m-%d
    date "+%Y-%m-%d %H:%M:%S"
    ```

`date`命令进行日期加减

- -d选项，可以按照给定的字符串显示日期，一般用于日期计算

- 支持的时间标记：

  - year年
  - Month月
  - day天
  - hour小时
  - Minute分钟
  - second秒

- -d 选项可以和格式化字符串配合使用

  ```bash
  # 2024
  date -d "+1 year" +%Y
  # 2022
  date -d "-1 year" +%Y
  # 2023-04-26
  date -d "+1 day" +%Y-%m-%d
  # 2023-04-24
  date -d "-1 day" +%Y-%m-%d
  # 05
  date -d "+1 Month" +%m
  # 03
  date -d "-1 Month" +%m
  # 26
  date -d "+1 day" +%d
  # 24
  date -d "-1 day" +%d
  ```

  💡：以上结果不准是因为时区的原因，下面会说到修改时区的问题

#### 时区

1. 修改时区：通过删除本地时间文件

   ```bash
   su - root
   rm -f /etc/localtime
   ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
   ```

2. 时间校准：ntp时间校准

   ```bash
   su - root
   yum -y install ntp
   # 启动并设置开机自启
   systemctl start ntpd
   systemctl enable ntpd
   ```

   手动校准（需要root权限）

   ```bash
   # 26 Apr 11:49:25 ntpdate[66958]: adjust time server 203.107.6.88 offset 0.000370 sec
   
   ntpdate -u ntp.aliyun.com
   ```

### IP地址&主机名

#### IP地址

查看`ip`地址，可以使用`ifconfig`，如果无法使用可以安装：`yum -y install net-tools`

#### 主机名

查看主机名：`hostname`

修改主机名：`hostnamectl set-hostname 主机名`，需要`root`权限

#### 配置主机名和IP的映射关系

`FinalShell(windows)`: 修改`C:\Windows\System32\drivers\etc\hosts`配置`IP`和`主机`映射关系

`linux`: 修改`/etc/hosts`配置`IP`和`主机`映射关系

#### 固定IP地址

`VMware`中配置

修改`vim /etc/sysconfig/network-scripts/ifcfg-ens33`

```
# IP地址
IPADDR="192.168.154.30"
# 子网掩码
NETMASK="255.255.255.0"
# 网关
GATEWAY="192.168.154.2"
# DNS
DNS1="192.168.154.2"
```

#### ping

用于检查网络服务器是否是可联通状态

语法：`ping [-c num] ip或主机名`

- 选项：-c，检查的次数，不使用-c选项，将无限次数持续检查
- 参数：ip或主机名，被检查的服务器的ip地址或主机名地址

```bash
ping baidu.com
ping 33.56.88.20
```

#### wget

`wget`是非交互式的文件下载器，可以在命令行内下载网络文件

语法：`wget [-b] url`

- 选项：-b，可选，后台下载，会将日志写入到当前工作目录的`wget-log`文件
- 参数：url，下载链接

#### curl

`curl`可以发送http网络请求，可用于：下载文件、获取信息等

语法：`curl [-O] url`

- 选项：-O,用于下载文件，当url是下载链接时，可以使用此选项保存文件
- 参数：url，要发起请求的网路地址


### 进程

程序运行在操作系统中，是被操作系统所管理的

为管理运行的程序，每一个程序在运行的时候，便被操作系统注册为系统中的一个：进程

并会为每一个进程分配一个独有的：进程ID

#### 查看进程

语法：`ps [-e -f]`

- 选项：-e，显示全部进程
- 选项：-f，完成格式化的形式展示信息

```bash
ps -ef
# UID         PID   PPID  C STIME TTY          TIME CMD
# root          1      0  0 23:30 ?        00:00:04 # /usr/lib/systemd/systemd --switc
# root          2      0  0 23:30 ?        00:00:00 [kthreadd]
# root          3      2  0 23:30 ?        00:00:00 [ksoftirqd/0]
# root          4      2  0 23:30 ?        00:00:00 [kworker/0:0]
# root          5      2  0 23:30 ?        00:00:00 [kworker/0:0H]
# root          6      2  0 23:30 ?        00:00:00 [kworker/u256:0]

```

从左到右分别是：

- UID: 进程所属用户
- PID: 进程的进程号
- PPD: 进程的父ID(启动此进程的其他进程)
- C: 此进程的CPU占用率
- STIME: 进程的启动时间
- TTY: 启动此进程的终端序号，如显示？，则表示非终端启动
- TIME: 进程占用CPU的时间
- CMD: 进程的启动命令或路径

#### 关闭进程

语法：`kill [-9] 进程ID`

- 选项：-9，表示强制关闭进程。不使用此选项会向进程发送信号要求关闭，但是否关闭看进程自身的处理机制

### 主机状态监控

#### 查看系统资源占用

语法：`top`

`top`命令内容详解

TODO: ppt搬过来

- 选项： -p 只显示某个进程的信息 `top -p 进程id`
- 选项： -d 设置刷新时间，默认5s
- 选项： -c 显示产生进程的完整命令，默认是进程名
- 选项： -n 执行刷新次数`top -n 次数`
- 选项： -b  以非交互非全屏模式运行，以批次方式执行`top`，一般配合`-n`指定输出几次统计信息，将输出重定向到指定文件，如：`top -b -n 3 > /temp/top.tmp`
- 选项： -i 不显示任何闲置（idle)或无用（zombie）的进程
- 选项：-u 查找特定用户启动的进程`top -u user`

#### top交互式选项

交互式模式中，可用快捷键：

![image-20221027221354137](/my-blog/linux/20221027221354.png)

#### 磁盘信息监控

语法：`df [-h ]`

选项：-h,更人性化的单位显示

可以使用`iosstat`查看`CPU`、磁盘的相关信息

语法：`iostat [-x] [num1][num2]`

- 选项： -x，显示更多信息
- num1: 数字，刷新间隔，num2: 数字，刷新几次 

#### 网络状态监控

语法：`sar -n DEV num1 num2`

选项： -n，查看网络，DEV表示查看网络接口

num1: 刷新间隔（不填就查看一次结束），num2: 查看次数（不填无限次数） 

### 环境变量

- 临时设置：export 变量名=变量值

- 永久设置：
  - 针对用户，设置用户HOME目录内：`.bashrc`文件
  
    ```bash
    vim ~/.bashrc
    ```
  
  - 针对全局，设置`/etc/profile`
  
    ```bash
    su -
    vim /etc/profile
    # 让配置生效
    source /etc/profile
    # ***代表配置的变量名，example:echo $customEnv
    echo $***
    ```
  
    

### PATH变量

记录执行程序的搜索路径

可以将自定义路径加入PATH内，实现自定义命令在任意地方均可执行的效果

### $符号

可以取出指定的环境变量的值

语法：`$变量名`

示例：

`echo $PATH`,输出PATH环境变量的值

`echo ${PATH}ABC`,输出PATH环境变量的值以及ABC

如果变量名和其他内容混淆在一起，可以使用${}

### 文件上传和下载

安装服务：`yum -y install lrzsz`

下载：`sz ***.gz`

上传：`rz`

### 解压缩

1. tar

   语法：`tar [-c -v -x -f- z- C] 参数1 参数2 ... 参数N`

   - -c：创建压缩文件，用于压缩模式
   - -v：显示压缩、解压过程，用于查看进度
   - -x：解压模式
   - -f：要创建的文件，或要解压的文件，-f选项必须在所有选项中位置处于最后一个
   -  -z：gzip模式，不适用-z就是普通的tarball模式
   - -C: 选择解压的目的地，用于 解压模式

   **tar压缩常用的组合**

   - `tar -cvf test.tar 1.txt 2.text 3.txt`
   - `tar -zcvf test.tar.gz 1.txt 2.txt 3.txt`

   注意：

   - -z选项如果使用的话，一般处于选项位第一个
   - -f选项，必须在选项位最后一个

   **tar解压常用组合**

   `tar -zxvf 被解压的文件 -C 要解压去的地方`

   - -z表示使用gzip，可以省略
   - -C，可以省略，指定要解压去的地方，不写解压到当前目录

2. `zip`和`unzip`

   - `zip`

     语法：`zip [-r] 参数1 参数2 参数N`

     ![image-20221027221906247](/my-blog/linux/20221027221906.png)

   - `unzip`

     语法：`unzip [-d] 参数`

     ![image-20221027221939899](/my-blog/linux/20221027221939.png)









