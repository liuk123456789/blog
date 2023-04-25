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





