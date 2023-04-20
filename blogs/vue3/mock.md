---
title: mock
date: 2023-02-13
categories: 
 - Vue
tags:
 - mock
sidebar: auto
---

## 功能说明

> 在开发过程中，有时前端界面已经完成，等待后端接口时，减少等待时间，我们可以通过Mock 对应后端字段，生成随机数据，错误处理等等。

[Mock文档地址](http://mockjs.com/0.1/#)

## 安装

**vue3.x + vite + ts**

```bash
pnpm i mockjs -S
pnpm i vite-plugin-mock -D
```

**vue2.x**

```bash
npm i mockjs -S
```

**因为vue3 作为项目版本，所以主要针对vue3说明mock使用**

## 配置vite文件

```typescript
import { defineConfig, loadEnv } from 'vite'
import type { UserConfig, ConfigEnv } from 'vite'

import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig({mode, command}: ConfigEnv): UserConfig => {
    ***
	return {
        plugins: [
          vue(),
          vueJsx(),
          vueSetupExtend(),
          createSvgIconsPlugin({
            // 配置你存放 svg 图标的目录
            iconDirs: [path.resolve(process.cwd(), 'src/icons/svg')],
            // 定义 symbolId 格式
            symbolId: 'icon-[dir]-[name]'
          }),
          PurgeIcons(),
          AutoImport({
            resolvers: [ElementPlusResolver()],
            dts: path.resolve(pathSrc, 'auto-imports.d.ts')
          }),
          Components({
            resolvers: [
              ElementPlusResolver({
                importStyle: 'sass' // 非官方，必要
              })
            ]
          }),
          viteMockServe({
            mockPath: 'mock',
            localEnabled: command === 'serve'
          })
        ]
    }
}
```

## 配置.env.development本地代理和接口api

```
VITE_PROXY = [["/website","http://localhost:3100"]]
```

## 根目录新建mock目录

**_utils.ts**工具文件

```typescript
const pagination = <T = any>(pageNo: number, pageSize: number, array: T[]): T[] => {
  const offset = (pageNo - 1) * Number(pageSize);
  return offset + Number(pageSize) >= array.length
    ? array.slice(offset, array.length)
    : array.slice(offset, offset + Number(pageSize));
}

/**
 * @description: Request result set
 */
export enum ResultEnum {
  SUCCESS = 200,
  ERROR = -1,
  TIMEOUT = 401,
  TYPE = 'success'
}

export function resultSuccess<T = Recordable>(result: T, { message = 'ok' } = {}) {
  return {
    code: ResultEnum.SUCCESS,
    result,
    message,
    type: 'success'
  }
}

export function resultPageSuccess<T = any>(
  page: number,
  pageSize: number,
  list: T[],
  { message = 'ok' } = {}
) {
  const pageData = pagination(page, pageSize, list)

  return {
    ...resultSuccess({
      items: pageData,
      total: list.length
    }),
    message
  }
}

export function resultError(
  message = 'Request failed',
  { code = ResultEnum.ERROR, result = null } = {},
) {
  return {
    code,
    result,
    message,
    type: 'error',
  };
}

export interface requestParams {
  method: string;
  body: any;
  headers?: { token?: string };
  query: any;
}

/**
 * @description 本函数用于从request数据中获取token，请根据项目的实际情况修改
 *
 */
export function getRequestToken({ headers }: requestParams): string | undefined {
  return headers?.token;
}
```

## 接口文件

```typescript
import { MockMethod } from 'vite-plugin-mock'

import { resultSuccess, resultPageSuccess } from '../_util'

type ResQueryType = {
  page: number
  pageSize: number
  [k: string]: any
}

const accountList = (() => {
  const result: any[] = []
  for (let index = 0; index < 20; index++) {
    result.push({
      id: '@guid()', // 生成uid
      account: '@first', // 随机生成英文名 @last 生成英文姓
      email: '@email', // 随机生成一个邮件地址
      nickname: '@cname()', // 随机生成一个中文姓名
      role: '@first',
      createTime: '@datetime', // 返回一个随机的日期和时间字符串
      remark: '@cword(10,20)', // 中文字符长度 最小10， 最大20
      'status|1': ['0', '1'], // 从'0', '1' 取随机值
      address: '@region()' // 地区
    })
  }
  return result
})()

const roleList = (() => {
  const result: any[] = []
  for (let index = 0; index < 4; index++) {
    result.push({
      id: index + 1,
      orderNo: `${index + 1}`,
      roleName: ['超级管理员', '管理员', '文章管理员', '普通用户'][index],
      roleValue: '@first',
      createTime: '@datetime',
      remark: '@cword(10,20)',
      menu: [['0', '1', '2'], ['0', '1'], ['0', '2'], ['2']][index],
      'status|1': ['0', '1']
    })
  }
  return result
})()

const areaList: any[] = [
  {
    id: '530825900854620160',
    code: '430000',
    parentCode: '100000',
    levelType: 1,
    name: '湖南省',
    province: '湖南省',
    city: null,
    district: null,
    town: null,
    village: null,
    parentPath: '430000',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 16:33:42',
    customized: false,
    usable: true
  },
  {
    id: '530825900883980288',
    code: '430100',
    parentCode: '430000',
    levelType: 2,
    name: '长沙市',
    province: '湖南省',
    city: '长沙市',
    district: null,
    town: null,
    village: null,
    parentPath: '430000,430100',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 16:33:42',
    customized: false,
    usable: true
  },
  {
    id: '530825900951089152',
    code: '430102',
    parentCode: '430100',
    levelType: 3,
    name: '芙蓉区',
    province: '湖南省',
    city: '长沙市',
    district: '芙蓉区',
    town: null,
    village: null,
    parentPath: '430000,430100,430102',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 16:33:42',
    customized: false,
    usable: true
  },
  {
    id: '530825901014003712',
    code: '430104',
    parentCode: '430100',
    levelType: 3,
    name: '岳麓区',
    province: '湖南省',
    city: '长沙市',
    district: '岳麓区',
    town: null,
    village: null,
    parentPath: '430000,430100,430104',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 16:33:42',
    customized: false,
    usable: true
  },
  {
    id: '530825900988837888',
    code: '430103',
    parentCode: '430100',
    levelType: 3,
    name: '天心区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: null,
    village: null,
    parentPath: '430000,430100,430103',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 16:33:42',
    customized: false,
    usable: true
  },
  {
    id: '530826672489115648',
    code: '430103002',
    parentCode: '430103',
    levelType: 4,
    name: '坡子街街道',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: null,
    parentPath: '430000,430100,430103,430103002',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-12-14 15:26:43',
    customized: false,
    usable: true
  },
  {
    id: '530840241171607552',
    code: '430103002001',
    parentCode: '430103002',
    levelType: 5,
    name: '八角亭社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '八角亭社区',
    parentPath: '430000,430100,430103,430103002,430103002001',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2021-01-20 14:07:23',
    customized: false,
    usable: true
  },
  {
    id: '530840241200967680',
    code: '430103002002',
    parentCode: '430103002',
    levelType: 5,
    name: '西牌楼社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '西牌楼社区',
    parentPath: '430000,430100,430103,430103002,430103002002',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 17:30:41',
    customized: false,
    usable: true
  },
  {
    id: '530840241230327808',
    code: '430103002003',
    parentCode: '430103002',
    levelType: 5,
    name: '太平街社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '太平街社区',
    parentPath: '430000,430100,430103,430103002,430103002003',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 17:30:41',
    customized: false,
    usable: true
  },
  {
    id: '530840241259687936',
    code: '430103002005',
    parentCode: '430103002',
    levelType: 5,
    name: '坡子街社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '坡子街社区',
    parentPath: '430000,430100,430103,430103002,430103002005',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 17:30:41',
    customized: false,
    usable: true
  },
  {
    id: '530840241284853760',
    code: '430103002006',
    parentCode: '430103002',
    levelType: 5,
    name: '青山祠社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '青山祠社区',
    parentPath: '430000,430100,430103,430103002,430103002006',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 17:30:41',
    customized: false,
    usable: true
  },
  {
    id: '530840241310019584',
    code: '430103002007',
    parentCode: '430103002',
    levelType: 5,
    name: '沙河社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '沙河社区',
    parentPath: '430000,430100,430103,430103002,430103002007',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 17:30:41',
    customized: false,
    usable: true
  },
  {
    id: '530840241381322752',
    code: '430103002008',
    parentCode: '430103002',
    levelType: 5,
    name: '碧湘社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '碧湘社区',
    parentPath: '430000,430100,430103,430103002,430103002008',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 17:30:41',
    customized: false,
    usable: true
  },
  {
    id: '530840241410682880',
    code: '430103002009',
    parentCode: '430103002',
    levelType: 5,
    name: '创远社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '创远社区',
    parentPath: '430000,430100,430103,430103002,430103002009',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 17:30:41',
    customized: false,
    usable: true
  },
  {
    id: '530840241431654400',
    code: '430103002010',
    parentCode: '430103002',
    levelType: 5,
    name: '楚湘社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '楚湘社区',
    parentPath: '430000,430100,430103,430103002,430103002010',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 17:30:41',
    customized: false,
    usable: true
  },
  {
    id: '530840241465208832',
    code: '430103002011',
    parentCode: '430103002',
    levelType: 5,
    name: '西湖社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '西湖社区',
    parentPath: '430000,430100,430103,430103002,430103002011',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 17:30:41',
    customized: false,
    usable: true
  },
  {
    id: '530840241502957568',
    code: '430103002012',
    parentCode: '430103002',
    levelType: 5,
    name: '登仁桥社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '登仁桥社区',
    parentPath: '430000,430100,430103,430103002,430103002012',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 17:30:41',
    customized: false,
    usable: true
  },
  {
    id: '530840241553289216',
    code: '430103002013',
    parentCode: '430103002',
    levelType: 5,
    name: '文庙坪社区',
    province: '湖南省',
    city: '长沙市',
    district: '天心区',
    town: '坡子街街道',
    village: '文庙坪社区',
    parentPath: '430000,430100,430103,430103002,430103002013',
    createTime: '2020-11-30 15:47:31',
    updateTime: '2020-11-30 17:30:41',
    customized: false,
    usable: true
  }
]

export default [
  {
    url: '/website/system/getAccountList',
    timeout: 100,
    method: 'get',
    response: (params: { query: ResQueryType }) => {
      const { page, pageSize } = params.query
      return resultPageSuccess(page, pageSize, accountList)
    }
  },
  {
    url: '/website/system/getRoleListByPage',
    timeout: 100,
    method: 'get',
    response: (params: { query: ResQueryType }) => {
      const { page = 1, pageSize = 20 } = params.query
      return resultPageSuccess(page, pageSize, roleList)
    }
  },
  {
    url: '/website/system/setRoleStatus',
    timeout: 500,
    method: 'post',
    response: (params: { query: ResQueryType }) => {
      const { id, status } = params.query
      return resultSuccess({ id, status })
    }
  },
  {
    url: '/website/cascader/getAreaRecord',
    timeout: 1000,
    method: 'post',
    // @ts-ignore
    response: ({ body }) => {
      const { parentCode } = body || {}
      if (!parentCode) {
        return resultSuccess(areaList.filter((it) => it.code === '430000'))
      }
      return resultSuccess(areaList.filter((it) => it.parentCode === parentCode))
    }
  }
] as MockMethod[]

```

## 项目中的接口文档中配置对应请求

因为项目的接口都是放在api文件目录下，所以就在api文件目录下配置对应的axios请求
```typescript
import request from '@/utils/request'

export const fetchCityList = () => {
  return request.post({
    url: '/website/cascader/getAreaRecord'
  })
}

export const getAccountList = (params: any) => {
  return request.get({
    url: '/website/system/getAccountList',
    params
  })
}

export const getRoleListByPage = (params: any) => {
  return request.get({
    url: '/website/system/getRoleListByPage',
    params
  })
}

```

#### 使用

```vue
<template>
	<div>
       1223445
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'

import * as commonApis from '@/api/common'

const fetchCityData = async () => {
  const res = await cascaderApis.fetchCityList()
  console.log(res)
}

const getAccountList = async () => {
  const res = await cascaderApis.getAccountList({ page: 1, pageSize: 10 })
  console.log(res)
}

onMounted(async () => {
  await fetchCityData()
  await getAccountList()
})
</script>

```

## 效果

第一个接口数据返回

![](/my-blog/vue/mock-first.jpg)

第二个接口数据返回

![](/my-blog/vue/mock-two.jpg)

## 线上Mock

1. 修改.env.production 配置文件

   ```
   VITE_USE_MOCK = true;
   ```

2. mock/_createProductionServer.ts 文件中引入需要的mock文件

   ```typescript
   import { createProdMockServer } from 'vite-plugin-mock/es/createProdMockServer';
   
   const modules = import.meta.globEager('./**/*.ts');
   
   const mockModules: any[] = [];
   Object.keys(modules).forEach((key) => {
     if (key.includes('/_')) {
       return;
     }
     mockModules.push(...modules[key].default);
   });
   
   export function setupProdMockServer() {
     createProdMockServer(mockModules);
   }
   ```

3.  修改vite 中plugin配置

   ```typescript
   import { viteMockServe } from 'vite-plugin-mock';
   
   const configMockPlugin = (isBuild: boolean) => {
     return viteMockServe({
       ignore: /^\_/,
       mockPath: 'mock',
       localEnabled: !isBuild,
       prodEnabled: isBuild,
       injectCode: `
         import { setupProdMockServer } from '../mock/_createProductionServer';
   
         setupProdMockServer();
         `,
     });
   }
   
   const vitePlugins: (PluginOption | PluginOption[])[] = [
       // have to
       vue(),
       // have to
       vueJsx(),
       vueSetupExtend(),
       createSvgIconsPlugin({
           // 配置你存放 svg 图标的目录
           iconDirs: [path.resolve(process.cwd(), 'src/icons/svg')],
           // 定义 symbolId 格式
           symbolId: 'icon-[dir]-[name]'
       }),
       PurgeIcons(),
       AutoImport({
           resolvers: [ElementPlusResolver()],
           dts: path.resolve(pathSrc, 'auto-imports.d.ts')
       }),
       Components({
           resolvers: [
             ElementPlusResolver({
               importStyle: 'sass' // 非官方，必要
             })
           ]
       })
   ];
   
   // vite-plugin-mock
   VITE_USE_MOCK && vitePlugins.push(configMockPlugin(isBuild));
   
   export default defineConfig({mode, command}: ConfigEnv): UserConfig => {
       ***
   	return {
           plugins: vitePlugins
       }
   }
   ```
