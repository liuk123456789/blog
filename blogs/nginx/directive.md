---
title: nginx指令
date: 2023-01-29
categories:
 - nginx
tags:
 - nginx directive
sidebar: auto
---

## 核心模块

### alias&root

上下文对象都是location,命中规则后

root：会把请求的url的`ip/域名`+`port`替换为root的指定目录，访问资源

alias：会把请求url的`ip/域名+port+匹配到的路径`替换为alias指定的目录，访问资源

以请求http://example.com/foo/bar/hello.html 为例，location配置如下

```nginx
location /foo {
    root /home/kn/;
}
```

匹配到/foo，url中的http://example.com被替换为/home/kn/,实际访问路径：/home/kn/foo/bar/hello.html

```nginx
location /foo {
    alias /home/kn/;
}
```

匹配到/foo/bar，url的`ip/域名+port+匹配到的路径`替换为alias指定的目录，即url中的example.com/foo/bar被替换为/home/kn/bar/hello.htm

1. index

   在location内部其实默认配置了一条规则`index index.html`，补全后的规则如下

   ```nginx
   location /foo {
       root /home/kn/;
       index index.html index.htm;
   }
   ```

   假设我们访问的url为http://example.com/foo/bar ，匹配到/foo，实际访问的路径为/home/hfy/foo/bar。如果我们的bar是一个文件夹，其中如果包含index.html文件，则会把该文件返回。所以index的作用是，当实际访问的是一个目录时，会返回该目录中index指定的文件，如果该目录中不存在index指定的文件，则会返回403。

   在访问http://example.com/foo/bar ，时我们打开浏览器的控制台，查看发送的请求，会发现发生了一个301重定向，http://example.com/foo/bar 被重定向为http://example.com/foo/bar/ ，由此引发了新的问题，为什么会发生重定向，url末尾的/，location 匹配路径末尾的/，以及root 指定目录末尾的/都表示什么意思

2. location 解析url的工作流程

   ![](https://img-blog.csdnimg.cn/bea9508cc8b94ad9807c490e217cabd9.jpeg)

   上述的工作流程，假设了url末尾没有加/，如果末尾包含/，解析流程为上图中绿色部分。例如url为http://example.com/foo/ ，如果foo不存在或者是文件，则直接返回404，如果是foo是目录，则进入到绿色部分流程。如果foo目录中存在index指定的文件，则返回该文件。如果不存在返回403。从这个例子可以看出，url末尾加/表示要访问一个目录，如果实际是个文件，nginx会返回404。

3. 关于末尾'/'的含义

   - url末尾/的含义

     http://example.com/foo/bar 表示我们把bar当成一个文件，想要访问bar文件
     http://example.com/foo/bar/ 表示我们把bar当成一个目录，想要访问bar目录下index指定的文件

   - location匹配路径末尾/的含义

     ```nginx
     location /foo {
         root /home/kn/;
         index index.html index.htm;
     }
     ```

     /foo 既能匹配http://example.com/foo 也能匹配 http://example.com/foo/

     ```nginx
     location /foo/ {
         root /home/kn/;
         index index.html;
     }
     ```

     /foo/只能匹配http://example.com/foo/

   - root指定目录末尾/的含义

     ```nginx
     location /foo {
         root /home/kn/;
         index index.html index.htm;
     }
     ```

     /home/kn表示把kn当成目录或者文件

     /home/kn/表示把kn当成目录

     `alias 后面必须要用'/'结束，否则会找不到下级目录`

     `root后面指定的都应该是目录`

4. alias的基本用法

   以请求http://example.com/foo/bar/hello.html为例，location配置如下

   ```nginx
   location /foo {
       alias /home/kn/;
   }
   ```

   匹配到/foo，url的`ip/域名+port+匹配到的路径`替换为alias指定的目录，即url中的`example.com/foo`被替换为了`/home/kn/bar/hello.html`

   请求的url不变，更改location配置

   ```nginx
   location /foo/bar {
       alias /home/kn/;
   }
   ```

   匹配到/foo/bar，url的`ip/域名+port+匹配到的路径`替换为alias指定的目录，即url中的example.com/foo/bar被替换为/home/kn，实际访问路径/home/kn/hello.html

   alias其余特性，最左匹配、index、location解析url工作流程、末尾’/'与root一致。

5. 特殊情况

   1. alias 指定文件

      1. url: http://example.com/foo & /home/kn/foo是一个文件

         ```nginx
         location /foo {
         	alias /home/kn/foo
         }
         ```

         实际访问路径/home/kn/foo，nginx**返回foo文件**。

         这就是上面说的特例，alias也可以指定文件，并且正常返回了要访问的文件。但是实际一般不会用alias指定文件。

      2. url: http://example.com/foo & /home/kn/foo是一个文件

         ```nginx
         location /foo {
             alias /home/kn/foo/;
         }
         ```

         实际访问路径/home/hfy/foo，alias指定 /home/hfy/foo/是一个目录，而foo是一个文件，**返回404**。

      3. url: http://example.com/foo/ & /home/kn/foo是文件

         ```nginx
         location /foo/ {
             alias /home/kn/foo;
         }
         ```

         实际访问路径/home/kn/foo/要访问目录，alias指定/home/kn/foo是目录或文件，而foo是一个文件，**返回了500**。

      4. url: http://example.com/ & /home/kn/foo是一个文件

         ```nginx
         location / {
             alias /home/kn/foo;
         }
         ```

         实际访问路径/home/kn/foo，**但是返回了500**。

      5. url: http://example.com/foo/  & /home/kn/foo是一个文件

         ```nginx
         location /foo/ {
             alias /home/kn/foo/;
         }
         ```

         实际访问路径/home/kn/foo/，alias指定/home/kn/foo/是一个目录，而foo是一个文件，**返回了404**。

      6. url：http://example.com/ & /home/kn/foo是一个文件

         ```nginx
         location / {
             alias /home/kn/foo/;
         }
         ```

         实际访问路径/home/hfy/foo/，**返回404**。

   2. root 指定文件

      1. url: http://example.com/foo & /home/kn/foo是一个文件

         ```nginx
         location /foo {
             root /home/kn/foo;
         }
         ```

         实际访问路径/home/kn/foo/foo, 不存在，返回404

      2. url: http://example.com/foo & /home/kn/foo是一个文件

         ```nginx
         location /foo {
             root /home/kn/;
         }
         ```

         实际访问路径/home/kn/foo，**返回foo文件**

      3. url: http://example.com/foo/ & /home/kn/foo是一个文件

         ```nginx
         location /foo {
             root /home/kn/;
         }
         ```

         实际访问路径/home/kn/foo/，/home/kn/foo是文件，**返回404**

      4. url: http://example.com/ & /home/kn/foo是一个文件

         ```nginx
         location / {
             root /home/kn/foo;
         }
         ```

         实际访问路径/home/kn/foo，foo是一个文件，**但是却返回404**。

      5. url: http://example.com/ & /home/kn/foo是一个文件

         ```nginx
         location / {
             root /home/kn/foo/;
         }
         ```

         实际访问路径/home/hfy/foo，foo是一个文件，**但是却返回404**。

### location

语法：location[=|~|~*|^~]/uri/{...}

当匹配中符合条件的location，则执行内部指令；如果使用正则表达式，必须使用~*表明不区分大小写或者~区分大小写匹配；例如：location ~* .(gif|jpg|jpeg)$ ；当匹配成功后，将停止往下匹配；如果没有找到，则使用常规自字符串处理结果；

如果不是用正则表达式；可使用=严格匹配；

　　如果使用^~前缀用于一个常规字符串；表示如果路径匹配，则不测试正则表达式；

　　总结：指令按下列顺序被接受

　　　　1:=前缀的指令严格匹配这个查询；如果找到停止往下匹配

　　　　2:剩下的常规字符串，长的在前，如果这个匹配使用^~前缀，匹配停止；

　　　　3:正则表达式，按配置文件的顺序；

　　　　4:如果第三步产生匹配。则使用这个结果；停止匹配；否则使用第二部的匹配结果；

```nginx
location = / {

　　　　#只匹配／查询

　　}

　　location / {

　　　　#匹配任何查询，所有请求都是以/开头。但是正则表达式规则和长的块规则将被优先匹配和查询；

　　}

　　location ^~ /images/ {
　　　　# 匹配任何已 /images/ 开头的任何查询并且停止搜索。任何正则表达式将不会被测试。
　　　　}

　　location ~* .(gif|jpg|png)${

　　　　#匹配任何以gif、jpg、png结尾的请求。然后所有/images/目录的请求将使用第三个

　　}

　　例子请求:

　　　　/ -> configuration A

　　　　/documents/document.html -> configuration B

　　　　/images/1.gif -> configuration C

　　　　/documents/1.jpg -> configuration D
```

#### 八个location案例

```nginx
location = / {  #精确匹配，/后面不能加任何字符串，符合此条件就直接返回数据，不再向下匹配。
    // 如果/usr/local/ngnix/html/是目录
    if (-d $request_filename) {
         root /usr/local/nginx/html/;  #当用户访问newweb的时候，则显示此目录的内容，除此之外访问其他的任何目录都不匹配。
　　[动作A]
}

location  / {
  # 因为所有的地址都以/开头，所以这条规则将匹配到所有请求，但是非精确匹配会采取正则和最长字符串会优先匹配，因此还会向下继续匹配，比如当访问/bbs的时候，还需要看下面是否更精确的匹配。
  [ 动作B] 
}

location /documents/ {
  # 匹配任何以 /documents/ 开头的地址，匹配符合以后，还要继续往下搜索
  # 如果后面的正则表达式都没有匹配到，就匹配这一条
  [动作C] 
}

location ^~ /images/ {   #匹配任何以/images/ 开头的任何请求并且停止搜索，后面任何正则表达式将不会被测试。
  # 匹配任何以 /images/ 开头的地址，匹配符合以后，停止往下搜索正则，采用这一条。
  [动作D] 
}

location ~* .(gif|jpg|jpeg)$ {  #~*为不区分大小写
  # 匹配所有以 gif,jpg或jpeg 结尾的请求
  # 然而，所有请求/images/下的图片会被动作D匹配处理，因为动作D有^~会优先匹配并终止匹配，所以到达不了这一条正则
  [动作E] 
}

location /images/ {
  # 字符匹配到 /images/，继续往下，会发现 ^~ 存在，如果动作D存在，则这一条就不生效。
  [动作F] 
}

location /images/abc {
  #最长字符匹配到 /images/abc，继续往下，会发现 ^~ 存在，如果D存在，则这一条就不生效。
  #F与G的放置顺序是没有关系的
  [动作G] 
}

location ~ /images/abc/ {
  # 动作D存在，这一条不生效，如果注销动作D，则会优先最长匹配 动作G 开头的地址，然后向下匹配，到这一条的时候就会匹配并生效。
    [ configuration H ] 
}

 匹配优先级，顺序 no优先级：
(location =) > (location 完整路径) > (location ^~ 路径) > (location ~,~* 正则顺序) > (location 部分起始路径) > (/)

上面的匹配结果
按照上面的location写法，以下的匹配示例成立：

/ -> config A
精确完全匹配，即使/index.html也匹配不了

/downloads/download.html -> config B
匹配B以后，往下没有任何匹配，采用B

/images/1.gif -> configuration D
匹配到F，往下匹配到D，停止往下

/images/abc/def -> config D
最长匹配到G，往下匹配D，停止往下
你可以看到 任何以/images/开头的都会匹配到D并停止，FG写在这里是没有任何意义的，H是永远轮不到的，这里只是为了说明匹配顺序

/documents/document.html -> config C
匹配到C，往下没有任何匹配，采用C

/documents/1.jpg -> configuration E
匹配到C，往下正则匹配到E

/documents/Abc.jpg -> config CC
最长匹配到C，往下正则顺序匹配到CC，不会往下到E
```