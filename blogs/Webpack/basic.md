---
title: webpack系列-第一篇
date: 2023-04-27
categories: 
 - Webpack
tags:
 - webpack 第一篇
sidebar: auto
---

## 1. 版本说明

> nodejs: v16.18.0
>
> pnpm: 7.18.2
>
> webpack:  5.80.0
>
> webpack-cli: 5.0.2
>
> vue: 3.2.47
>
> typescript: 5.0.4

## 2. 代码规范相关配置

### eslint + prettier

1. 安装相关依赖

   ```powershell
   pnpm install eslint eslint-plugin-vue eslint-plugin-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin -D
   ```

2. **eslintrc**配置

   ```js
   {
     "root": true,
     "env": {
       "browser": true,
       "node": true,
       "es2021": true,
     },
     extends: [
       'eslint:recommended',
       'plugin:vue/vue3-recommended',
       'plugin:prettier/recommended',
       'plugin:@typescript-eslint/recommended',
     ],
     parserOptions: {
       ecmaVersion: 12,
       parser: '@typescript-eslint/parser',
       sourceType: 'module',
       jsxPragma: 'React',
       ecmaFeatures: {
         jsx: true,
       },
     },
     rules: {
       "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
       "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
       "prettier/prettier": [
         "error",
         {
           endOfLine: "auto",
         },
       ],
       "vue/html-self-closing": "error",
     },
   }
   ```

3. **prettierrc**配置

   ```javascript
   // .prettierrc.js
   module.exports = {
     printWidth: 100, // 单行输出（不折行）的（最大）长度  
     tabWidth: 2, // 每个缩进级别的空格数  
     tabs: false, // 使用制表符 (tab) 缩进行而不是空格 (space)。  
     semi: false, // 是否在语句末尾打印分号  
     singleQuote: true, // 是否使用单引号  
     quoteProps: 'as-needed', // 仅在需要时在对象属性周围添加引号  
     bracketSpacing: true, // 是否在对象属性添加空格  
     jsxBracketSameLine: true,
     // 将 > 多行 JSX 元素放在最后一行的末尾，而不是单独放在下一行（不适用于自闭元素）,
     //默认false,这里选择>不另起一行  
     htmlWhitespaceSensitivity: 'ignore',
     // 指定 HTML 文件的全局空白区域敏感度, "ignore" - 空格被认为是不敏感的  
     trailingComma: 'none', // 去除对象最末尾元素跟随的逗号  
     useTabs: false, // 不使用缩进符，而使用空格  
     jsxSingleQuote: false, // jsx 不使用单引号，而使用双引号  
     arrowParens: 'always', // 箭头函数，只有一个参数的时候，也需要括号  
     rangeStart: 0, // 每个文件格式化的范围是文件的全部内容  
     proseWrap: 'always', // 当超出print width（上面有这个参数）时就折行  
     endOfLine: 'lf' // 换行符使用 lf
   };
   ```

### husky&lint-staged&commitizen 

1. 安装依赖

   ```powershell
   pnpm dlx husky-init && pnpm install
   ```

2. 添加脚本

   ```powershell
   pnpm pkg set scripts.prepare="husky install"
   pnpm run prepare
   ```

3. 修改`.husky/pre-commit`

   ```sh
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"
   
   pnpm run lint:lint-staged
   ```

4. `lint-staged`

   1. 安装依赖

      ```powershell
      pnpm install lint-staged -D
      ```

   2. 修改`package.json`文件

      ```json
      "lint-staged": {
          "src/**/*.{js,jsx,ts,tsx,vue}": [
            "prettier --write",
            "eslint --cache --fix",
            "git add"
          ]
      }
      ```

5. `commitzen `提交信息参考这篇文件配置

   [参考链接](https://segmentfault.com/a/1190000039813329)

6. 