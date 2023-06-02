---
title: webpack系列-第六篇
date: 2023-05-25
categories: 
 - Webpack
tags:
 - webpack 第六篇
sidebar: auto
---

## 1. Module Federation模块联邦的动机

> Multiple separate builds should form a single application. These separate builds should not have dependencies between each other, so they can be developed and deployed individually. This is often known as Micro-Frontends, but is not limited to that.

对应的中文解释

> 多个独立的构建可以组成一个应用程序，这些独立的构建之间不应该存在依赖关系，因此可以单独开发和部署它们。
>
> 这通常被称作微前端，但并不仅限于此。

## 2. MF的核心概念

- Container

  一个使用`ModuleFederationPlugin`构建的应用就是一个`Container`，可以加载其他的`Container`，也可以被其他的`Contaienr`加载

- Host&Remote

  `Host`通常被看作`consumer(消费者)`，可以动态加载并运行`Remote`的代码，而`Remote`作为`Supplier(供应者)`，可以暴露属性，方法，组件等等提供给消费方，需要注意的是`Container`即可以是`消费者`，也可以是`供应者`

  如下所示

  ```typescript
  new ModuleFederationPlugin({
      name: 'component_app',
      // 打包生成的chunk 文件
      filename: 'remoteEntry.js',
      // 作为供应者提供组件
      exposes: {
          "./Button": "./src/Button.vue"
      },
      // 作为消费者加载
      remotes: {
          "lib-app": "lib_app@http://localhost:3000/remoteEntry.js"
      }
      
  })
  ```

- Shared

  表示依赖共享，一个应用可以将自己的依赖共享出去，比如`vue`、`vue-router`，其他应用可以直接使用共享作用域中的依赖从而减少应用的体积

## 3. 使用

[demo 地址](https://github.com/liuk123456789/webpack-federation)

### component-app

**App.vue**

```vue
<script setup>
</script>

<template>
    <h2>This is Component App</h2>
</template>
```

**webpack.config.js**

```javascript
const path = require('path')

const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const { DefinePlugin } = require('webpack')

module.exports = {
  mode: 'development',
  stats: 'errors-only',
  entry: './main.js',
  output: {
    clean: true,
    publicPath: 'http://localhost:3020/',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        use: ['babel-loader']
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.vue', '.ts', '.tsx', '.js']
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new DefinePlugin({
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: false
    })
  ]
}
```

### main-app

**App.vue**

```vue
<script setup>
</script>

<template>
	<div>
        <h2>This is Main App</h2>
    </div>
</template>
```

**webpack.config.js**

```javascript
const path = require('path')

const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const { DefinePlugin } = require('webpack')

module.exports = {
  mode: 'development',
  stats: 'errors-only',
  entry: './main.js',
  output: {
    clean: true,
    publicPath: 'http://localhost:3030/'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        use: ['babel-loader']
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.vue', '.ts', '.tsx', '.js']
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new DefinePlugin({
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: false
    })
  ]
}
```

### ModuleFederationPlugin

**供应方(component-app)**

```javascript
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
    // ...
    plugins: [
        // ...
        new ModuleFederationPlugin({
            name: 'component_app',
            filename: 'componentEntry.js',
            exposes: {
                './Federation': './src/components/Federation.vue'
            },
            share: {
                vue: { singleton: true }
            }
        })
    ]
    // ...
}
```

**消费方(main-app)**

```javascript
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
    // ...
    plugins: [
        // ...
        new ModuleFederationPlugin({
            name: 'main_app',
            remotes: {
                'component-app': 'component_app@http://localhost:3020/componentEntry.js'
            }
        })
    ]
    // ...
}
```

### 消费方(main-app)加载远程模块

1. 引入远程模块组件

   ```vue
   <script setup>
     import { defineAsyncComponent } from 'vue'
   
     const AsyncFederation = defineAsyncComponent(() => import('component-app/Federation'))
   
   </script>
   
   <template>
     <div>
       <h2>This is Main App</h2>
       <h3>
         <AsyncFederation />
       </h3>
     </div>
   </template>
   ```

2. 入口文件异步加载

   原`main.js`提取到`bootstrap.js`文件中

   ```javascript
   import { createApp } from 'vue'
   
   import App from './App.vue'
   
   const app = createApp(App)
   
   app.mount('#app')
   ```

   `main.js`动态引入`bootstrap.js`

   ```javascript
   import ('./bootstrap.js')
   ```

### 启动

```shell
npm run start
```

## 4. 打包产物

### 供应方（component-app）

**componentEntry.js**

用于消费方消费的远程模块

```javascript
eval("var moduleMap = {\n\t\"./Federation\": () => {\n\t\treturn __webpack_require__.e(\"src_components_Federation_vue\").then(() => (() => ((__webpack_require__(/*! ./src/components/Federation.vue */ \"./src/components/Federation.vue\")))));\n\t}\n};\nvar get = (module, getScope) => {\n\t__webpack_require__.R = getScope;\n\tgetScope = (\n\t\t__webpack_require__.o(moduleMap, module)\n\t\t\t? moduleMap[module]()\n\t\t\t: Promise.resolve().then(() => {\n\t\t\t\tthrow new Error('Module \"' + module + '\" does not exist in container.');\n\t\t\t})\n\t);\n\t__webpack_require__.R = undefined;\n\treturn getScope;\n};\nvar init = (shareScope, initScope) => {\n\tif (!__webpack_require__.S) return;\n\tvar name = \"default\"\n\tvar oldScope = __webpack_require__.S[name];\n\tif(oldScope && oldScope !== shareScope) throw new Error(\"Container initialization failed as it has already been initialized with a different share scope\");\n\t__webpack_require__.S[name] = shareScope;\n\treturn __webpack_require__.I(name, initScope);\n};\n\n// This exports getters to disallow modifications\n__webpack_require__.d(exports, {\n\tget: () => (get),\n\tinit: () => (init)\n});\n\n//# sourceURL=webpack://component-app/container_entry?");
```

主要的就是这行代码

```javascript
__webpack_require__.e(\"src_components_Federation_vue\")
```

这里会去调用`src_components_Federation_vue.js`文件

**main.js**

入口文件

**src_components_Federation_vue.js**

`exposes` 给消费方的远程组件

```javascript
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   render: () => (/* reexport safe */ _node_modules_babel_loader_lib_index_js_node_modules_vue_loader_dist_templateLoader_js_ruleSet_1_rules_2_node_modules_vue_loader_dist_index_js_ruleSet_1_rules_5_use_0_Federation_vue_vue_type_template_id_0b9337f3__WEBPACK_IMPORTED_MODULE_0__.render)\n/* harmony export */ });\n/* harmony import */ var _node_modules_babel_loader_lib_index_js_node_modules_vue_loader_dist_templateLoader_js_ruleSet_1_rules_2_node_modules_vue_loader_dist_index_js_ruleSet_1_rules_5_use_0_Federation_vue_vue_type_template_id_0b9337f3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../node_modules/babel-loader/lib/index.js!../../node_modules/vue-loader/dist/templateLoader.js??ruleSet[1].rules[2]!../../node_modules/vue-loader/dist/index.js??ruleSet[1].rules[5].use[0]!./Federation.vue?vue&type=template&id=0b9337f3 */ \"./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/dist/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/dist/index.js??ruleSet[1].rules[5].use[0]!./src/components/Federation.vue?vue&type=template&id=0b9337f3\");\n\n\n//# sourceURL=webpack://component-app/./src/components/Federation.vue?");
```

下面的这行代码代表`Federation.vue`组件的加载

```javascript
./src/components/Federation.vue?vue&type=template&id=0b9337f3\");\n\n\n//# sourceURL=webpack://component-app/./src/components/Federation.vue?")
```

### 消费方（main-app)

**bootstrap_js-webpack_sharing_* *.js**

```javascript
const AsyncFederation = (0,vue__WEBPACK_IMPORTED_MODULE_0__.defineAsyncComponent)(() => __webpack_require__.e(/*! import() */ \"webpack_container_remote_component-app_Federation\").then(__webpack_require__.t.bind(__webpack_require__, /*! component-app/Federation */ \"webpack/container/remote/component-app/Federation\", 23)));
```

此文件中，我们可以看到上述的代码`webpack_container_remote_component-app_Federation`，在入口`main.js`中配置了对应的映射关系，看下`main.js`代码

**main.js**

```javascript
/******/ 	/* webpack/runtime/remotes loading */
/******/ 	(() => {
/******/ 		var chunkMapping = {
/******/ 			"webpack_container_remote_component-app_Federation": [
/******/ 				"webpack/container/remote/component-app/Federation"
/******/ 			]
/******/ 		};
/******/ 		var idToExternalAndNameMapping = {
/******/ 			"webpack/container/remote/component-app/Federation": [
/******/ 				"default",
/******/ 				"./Federation",
/******/ 				"webpack/container/reference/component-app"
/******/ 			]
/******/ 		};
/******/ 		__webpack_require__.f.remotes = (chunkId, promises) => {
/******/ 			if(__webpack_require__.o(chunkMapping, chunkId)) {
/******/ 				chunkMapping[chunkId].forEach((id) => {
/******/ 					var getScope = __webpack_require__.R;
/******/ 					if(!getScope) getScope = [];
/******/ 					var data = idToExternalAndNameMapping[id];
/******/ 					if(getScope.indexOf(data) >= 0) return;
/******/ 					getScope.push(data);
/******/ 					if(data.p) return promises.push(data.p);
/******/ 					var onError = (error) => {
/******/ 						if(!error) error = new Error("Container missing");
/******/ 						if(typeof error.message === "string")
/******/ 							error.message += '\nwhile loading "' + data[1] + '" from ' + data[2];
/******/ 						__webpack_require__.m[id] = () => {
/******/ 							throw error;
/******/ 						}
/******/ 						data.p = 0;
/******/ 					};
/******/ 					var handleFunction = (fn, arg1, arg2, d, next, first) => {
/******/ 						try {
/******/ 							var promise = fn(arg1, arg2);
/******/ 							if(promise && promise.then) {
/******/ 								var p = promise.then((result) => (next(result, d)), onError);
/******/ 								if(first) promises.push(data.p = p); else return p;
/******/ 							} else {
/******/ 								return next(promise, d, first);
/******/ 							}
/******/ 						} catch(error) {
/******/ 							onError(error);
/******/ 						}
/******/ 					}
/******/ 					var onExternal = (external, _, first) => (external ? handleFunction(__webpack_require__.I, data[0], 0, external, onInitialized, first) : onError());
/******/ 					var onInitialized = (_, external, first) => (handleFunction(external.get, data[1], getScope, 0, onFactory, first));
/******/ 					var onFactory = (factory) => {
/******/ 						data.p = 1;
/******/ 						__webpack_require__.m[id] = (module) => {
/******/ 							module.exports = factory();
/******/ 						}
/******/ 					};
/******/ 					handleFunction(__webpack_require__, data[2], 0, 0, onExternal, 1);
/******/ 				});
/******/ 			}
/******/ 		}
/******/ 	})();
```

下面代码的`chunkMapping`映射了`webpack_container_remote_component-app_Federation`

```javascript
/******/ 		var chunkMapping = {
/******/ 			"webpack_container_remote_component-app_Federation": [
/******/ 				"webpack/container/remote/component-app/Federation"
/******/ 			]
/******/ 		};
```

`idToExternalAndNameMapping` 对象保存的是被依赖的远程模块的基本信息，便于后面远程请求该模块。

```javascript
/******/ 		var idToExternalAndNameMapping = {
/******/ 			"webpack/container/remote/component-app/Federation": [
/******/ 				"default",
/******/ 				"./Federation",
/******/ 				"webpack/container/reference/component-app"
/******/ 			]
/******/ 		};
```

加载`http://localhost:3020/componentEntry.js`，代码如下

```javascript
/***/ "webpack/container/reference/component-app":
/*!************************************************************************!*\
  !*** external "component_app@http://localhost:3020/componentEntry.js" ***!
  \************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
var __webpack_error__ = new Error();
module.exports = new Promise((resolve, reject) => {
	if(typeof component_app !== "undefined") return resolve();
	__webpack_require__.l("http://localhost:3020/componentEntry.js", (event) => {
		if(typeof component_app !== "undefined") return resolve();
		var errorType = event && (event.type === 'load' ? 'missing' : event.type);
		var realSrc = event && event.target && event.target.src;
		__webpack_error__.message = 'Loading script failed.\n(' + errorType + ': ' + realSrc + ')';
		__webpack_error__.name = 'ScriptExternalLoadError';
		__webpack_error__.type = errorType;
		__webpack_error__.request = realSrc;
		reject(__webpack_error__);
	}, "component_app");
}).then(() => (component_app));

/***/ })

/******/ 	});
```

可以看到最终返回了`component_app`这个全局变量作为`webpack/container/reference/component-app`的执行结果

提取下供应方的`componentEntry.js`涉及的核心代码

```javascript
var moduleMap = {
	"./Federation\": () => {
		return __webpack_require__.e(\"src_components_Federation_vue\").then(() => (() => ((__webpack_require__(/*! ./src/components/Federation.vue */ \"./src/components/Federation.vue\")))));}}
}
// 获取指定模块
var get = (module, getScope) => {
    __webpack_require__.R = getScope;
    getScope = (
        __webpack_require__.o(moduleMap, module)
                ? moduleMap[module]()
                : Promise.resolve().then(() => {
                        throw new Error('Module "' + module + '" does not exist in container.');
                })
    );
    __webpack_require__.R = undefined;
    return getScope;
};
var init = (shareScope, initScope) => {
    // ...
};
// 往全局变量 component_app 上挂载get和init方法
__webpack_require__.d(exports, {
    get: () => (get),
    init: () => (init)
});
```

可以看到对于远程组件`Federation`做了映射关系，前面提到了，总要的就是暴露了`get`和`init`方法

消费方的`main.js`中涉及的代码如下

```javascript
__webpack_require__.f.remotes = {
    // ***
     var onInitialized = (_, external, first) => (handleFunction(external.get, data[1], getScope, 0, onFactory, first));   
}
```

这里` external.get` 其实就是 `componnet_app.get` 方法，`data[1]` 就是要加载的异步组件，比如执行 `componnet_app.get('./Federation')`就可以异步获取 `Federation`组件。

## 5. 依赖共享

```javascript
// shareScope表示Host应用中的共享作用域
var init = (shareScope, initScope) => {
    if (!__webpack_require__.S) return;
    var name = "default"
    var oldScope = __webpack_require__.S[name];
    if(oldScope && oldScope !== shareScope) throw new Error("Container initialization failed as it has already been initialized with a different share scope");
    // 将Host的sharedScope赋值给当前应用
    __webpack_require__.S[name] = shareScope;
    // 又调用当前应用的__webpack_require__.I方法去处理它的remote应用
    return __webpack_require__.I(name, initScope);
};

```

`init`方法会使用`main`引用的`__webpack_require__.S`初始化`component`应用的`__webpack_require__.S`

之后`main`应用调用了自己的`__webpack_require__.I`

```javascript
/******/ 		__webpack_require__.I = (name, initScope) => {
/******/ 			if(!initScope) initScope = [];
/******/ 			// handling circular init calls
/******/ 			var initToken = initTokens[name];
/******/ 			if(!initToken) initToken = initTokens[name] = {};
/******/ 			if(initScope.indexOf(initToken) >= 0) return;
/******/ 			initScope.push(initToken);
/******/ 			// only runs once
/******/ 			if(initPromises[name]) return initPromises[name];
/******/ 			// creates a new share scope if needed
/******/ 			if(!__webpack_require__.o(__webpack_require__.S, name)) __webpack_require__.S[name] = {};
/******/ 			// runs all init snippets from all modules reachable
/******/ 			var scope = __webpack_require__.S[name];
/******/ 			var warn = (msg) => {
/******/ 				if (typeof console !== "undefined" && console.warn) console.warn(msg);
/******/ 			};
/******/ 			var uniqueName = "main-app";
/******/ 			var register = (name, version, factory, eager) => {
/******/ 				var versions = scope[name] = scope[name] || {};
/******/ 				var activeVersion = versions[version];
/******/ 				if(!activeVersion || (!activeVersion.loaded && (!eager != !activeVersion.eager ? eager : uniqueName > activeVersion.from))) versions[version] = { get: factory, from: uniqueName, eager: !!eager };
/******/ 			};
/******/ 			var initExternal = (id) => {
/******/ 				var handleError = (err) => (warn("Initialization of sharing external failed: " + err));
/******/ 				try {
/******/ 					var module = __webpack_require__(id);
/******/ 					if(!module) return;
/******/ 					var initFn = (module) => (module && module.init && module.init(__webpack_require__.S[name], initScope))
/******/ 					if(module.then) return promises.push(module.then(initFn, handleError));
/******/ 					var initResult = initFn(module);
/******/ 					if(initResult && initResult.then) return promises.push(initResult['catch'](handleError));
/******/ 				} catch(err) { handleError(err); }
/******/ 			}
/******/ 			var promises = [];
/******/ 			switch(name) {
/******/ 				case "default": {
/******/ 					register("vue", "3.3.4", () => (() => (__webpack_require__(/*! ./node_modules/vue/dist/vue.runtime.esm-bundler.js */ "./node_modules/vue/dist/vue.runtime.esm-bundler.js"))), 1);
/******/ 					initExternal("webpack/container/reference/component-app");
/******/ 				}
/******/ 				break;
/******/ 			}
/******/ 			if(!promises.length) return initPromises[name] = 1;
/******/ 			return initPromises[name] = Promise.all(promises).then(() => (initPromises[name] = 1));
/******/ 		};
```

注意这行代码，注册`main`应用自身的共享依赖

```javascript
/******/ 					register("vue", "3.3.4", () => (() => (__webpack_require__(/*! ./node_modules/vue/dist/vue.runtime.esm-bundler.js */ "./node_modules/vue/dist/vue.runtime.esm-bundler.js"))), 1);
```

