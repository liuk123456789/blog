---
title: elementUI主题&按需加载
date: 2023-01-18
categories: 
 - Vue
tags:
 - elementUI&dynamicImport
sidebar: auto
---

## 1. 自定义主题

采用了`命令行生成本地文件`这种方式，因为项目中使用了less，不想再去装sass、sass-loader，所以实践下这种方式

1. 生成本地样式

   > 版本说明
   >
   > node: 12.14.1（版本过高，后面会说到）
   >
   > node对应的npm版本：6.13.4

   1. 安装element-theme包

      ```bash
      npm i element-theme -D
      ```

   2. 安装白垩主题，可以从 npm 安装或者从 GitHub 拉取最新代码。

      ```bash
      # 从 npm
      npm i element-theme-chalk -D
      
      # 从 GitHub
      npm i https://github.com/ElementUI/theme-chalk -D
      ```

   3. 初始化变量文件

      ```bash
      # windows
      # 默认生成element-variables.scss文件
      node_modules\.bin\et -i
      
      # 自定义生成的scss文件
      node_modules\.bin\et -i [自定义的文件名称]
      ```

      > `node: 12.14.1` 会提示primordials is not defined，所以我们通过`nvm`降低node版本到10.8.0 在`重新安装包`

      删除node_modules 后执行下

      ```bash
      npm i element-theme element-theme-chalk -D
      ```

   4. 修改生成的文件

      ```scss
      $--color-primary: #24f9e7 !default;
      $--color-primary-light-1: mix($--color-white, $--color-primary, 8%) !default; /* 53a8ff */
      $--color-primary-light-2: mix($--color-white, $--color-primary, 16%) !default; /* 66b1ff */
      $--color-primary-light-3: mix($--color-white, $--color-primary, 24%) !default; /* 79bbff */
      $--color-primary-light-4: mix($--color-white, $--color-primary, 32%) !default; /* 8cc5ff */
      $--color-primary-light-5: mix($--color-white, $--color-primary, 40%) !default; /* a0cfff */
      $--color-primary-light-6: mix($--color-white, $--color-primary, 48%) !default; /* b3d8ff */
      $--color-primary-light-7: mix($--color-white, $--color-primary, 56%) !default; /* c6e2ff */
      $--color-primary-light-8: mix($--color-white, $--color-primary, 64%) !default; /* d9ecff */
      $--color-primary-light-9: mix($--color-white, $--color-primary, 72%) !default; /* ecf5ff */
      ```

2. 生成的文件拷贝到项目的文件目录中

3. 入口文件中引入

   ```bash
   import './styles/ui-theme/index.css'
   ```

   

## 2. 按需加载

> 环境参数：
>
> node： 12.14.1
> vue-cli：4.x

1. 安装依赖

   ```bash
   npm i babel-plugin-component -D
   ```

2. 配置项目中的babel.config.js/.babelrc文件

   ```js
   module.exports = {
     presets: ['@vue/cli-plugin-babel/preset', ['@babel/preset-env', { 'modules': false }]],
     plugins: ['@vue/babel-plugin-transform-vue-jsx',
       [
         'component',
         {
           'libraryName': 'element-ui',
           // 这个对应了生成的自定义主题的css文件位置，如果未使用定义，那么这里theme-chalk即可
           'styleLibraryName': '~src/styles/ui-theme'
         }
       ]
     ]
   }
   ```

   > elementui的官网 使用的`['es2015', { modules: false }]`，会报错，换成@babel/preset-env便正常，应该是babel@7的版本的原因，没有特别去追究原因 

3. 组件配置

   ```js
   import Vue from 'vue'
   import {
     Avatar,
     Pagination,
     Dialog,
     Dropdown,
     DropdownMenu,
     DropdownItem,
     Menu,
     Submenu,
     MenuItem,
     MenuItemGroup,
     Input,
     InputNumber,
     Radio,
     RadioGroup,
     RadioButton,
     Checkbox,
     CheckboxButton,
     CheckboxGroup,
     Select,
     Option,
     OptionGroup,
     Button,
     ButtonGroup,
     Table,
     TableColumn,
     DatePicker,
     TimeSelect,
     TimePicker,
     Popover,
     Tooltip,
     Breadcrumb,
     BreadcrumbItem,
     Form,
     FormItem,
     Tabs,
     TabPane,
     Tag,
     Tree,
     Icon,
     Row,
     Col,
     Upload,
     Progress,
     Spinner,
     Badge,
     Card,
     Carousel,
     CarouselItem,
     Container,
     Header,
     Aside,
     Main,
     Footer,
     Link,
     Divider,
     Image,
     Calendar,
     Backtop,
     Loading,
     MessageBox,
     Message,
     Notification,
     InfiniteScroll
   } from 'element-ui'
   
   Vue.use(Avatar)
   Vue.use(Pagination)
   Vue.use(Dialog)
   Vue.use(Dropdown)
   Vue.use(DropdownMenu)
   Vue.use(DropdownItem)
   Vue.use(Menu)
   Vue.use(Submenu)
   Vue.use(MenuItem)
   Vue.use(MenuItemGroup)
   Vue.use(Input)
   Vue.use(InputNumber)
   Vue.use(Radio)
   Vue.use(RadioGroup)
   Vue.use(RadioButton)
   Vue.use(Checkbox)
   Vue.use(CheckboxButton)
   Vue.use(CheckboxGroup)
   Vue.use(Select)
   Vue.use(Option)
   Vue.use(OptionGroup)
   Vue.use(Button)
   Vue.use(ButtonGroup)
   Vue.use(Table)
   Vue.use(TableColumn)
   Vue.use(DatePicker)
   Vue.use(TimeSelect)
   Vue.use(TimePicker)
   Vue.use(Popover)
   Vue.use(Tooltip)
   Vue.use(Breadcrumb)
   Vue.use(BreadcrumbItem)
   Vue.use(Form)
   Vue.use(FormItem)
   Vue.use(Tabs)
   Vue.use(TabPane)
   Vue.use(Tag)
   Vue.use(Tree)
   Vue.use(Icon)
   Vue.use(Row)
   Vue.use(Col)
   Vue.use(Upload)
   Vue.use(Progress)
   Vue.use(Spinner)
   Vue.use(Badge)
   Vue.use(Card)
   Vue.use(Carousel)
   Vue.use(CarouselItem)
   Vue.use(Container)
   Vue.use(Header)
   Vue.use(Aside)
   Vue.use(Main)
   Vue.use(Footer)
   Vue.use(Link)
   Vue.use(Divider)
   Vue.use(Image)
   Vue.use(Calendar)
   Vue.use(Backtop)
   Vue.use(InfiniteScroll)
   
   Vue.use(Loading.directive)
   
   Vue.prototype.$loading = Loading.service
   Vue.prototype.$msgbox = MessageBox
   Vue.prototype.$confirm = MessageBox.confirm
   Vue.prototype.$notify = Notification
   Vue.prototype.$message = Message
   
   Vue.prototype.$ELEMENT = { size: 'medium', zIndex: 1000 }
   
   ```

   

4. 入口引入配置

   删除入口引入

   ```js
   import ElementUI from 'element-ui';
   // 未自定义主题
   // import 'element-ui/lib/theme-chalk/index.css';
   
   // 自定义了主题
   import './styles/ui-theme/index.css';
   ```

   增加入口引入

   ```js
   import './plugins/ui-lib' // 项目中是放在plugins/ui-lib下
   ```