---
title: 权限相关
date: 2022-12-29
categories: 
 - Vue
tags:
 - auth
sidebar: auto
---



> 实现逻辑参考了 [vue-vben-admin](https://doc.vvbin.cn/guide/introduction.html)

### 1. 配置前端路由

1. 基础路由

   1. 登录模块路由

      ```typescript
      export const LoginRoute:AppRouteRecordRaw = {
      	path: '/login',
          name: 'Login',
          component: () => import('@/views/login/index.vue'),
          meta: {
              title: '登录'
          }
      }
      ```

      

   2. 根模块路由

      ```typescript
      export const RootRoute:AppRouteRecordRaw = {
          path: '/',
          name: 'Root',
          redirect: '/home' // 重定向路由
          meta: {
          	title: 'Root'
          }
      }
      ```

      

   3. 404路由

      ```typescript
      export const PAGE_NOT_FOUND_NAME = 'PageNotFound'
      
      export const PAGE_NOT_FOUND_ROUTE:AppRouteRecordRaw = {
          path: '/:path(.*)*', // 404
          name: PAGE_NOT_FOUND_NAME,
          component: LAYOUT,
          meta: {
              title: 'ErrorPage',
              hideBreadcrumb: true,
              hideMenu: true
          },
          children: [
              {
                path: '/:path(.*)*',
                name: PAGE_NOT_FOUND_NAME,
                component: EXCEPTION_COMPONENT,
                meta: {
                  title: 'ErrorPage',
                  hideBreadcrumb: true,
                  hideMenu: true,
                },
              }
          ]
      }
      ```

2. 动态路由 - 通常防止modules 下的路由集合

3. 具体配置如下

   ```typescript
   // import.meta.globEager() 直接引入所有的模块 Vite 独有的功能
   const modules = import.meta.globEager('./modules/**/*.ts');
   const routeModuleList: AppRouteModule[] = [];
   
   // 加入到路由集合中
   Object.keys(modules).forEach((key) => {
     const mod = modules[key].default || {};
     const modList = Array.isArray(mod) ? [...mod] : [mod];
     routeModuleList.push(...modList);
   });
   
   // 动态路由集合 TODO:这里为什么将404也归入动态路由有待商榷
   export const asyncRoutes = [PAGE_NOT_FOUND_ROUTE, ...routeModuleList];
   
   // 基础路由
   // Basic routing without permission
   // 未经许可的基本路由
   export const basicRoutes = [
     LoginRoute,
     RootRoute,
     PAGE_NOT_FOUND_ROUTE,
   ];
   ```

### 2. 获取用户权限

1. 获取用户信息

   代码大致如下：

   ```typescript
   async getUserInfoAction(): Promise<Nullable<UserInfo>> {
       if(!this.getToken) return null
       const userInfo = await userApis.getUserInfo()
       
       const { roles = [] } = userInfo
       if(isArray(roles)) {
           const roleList = roles.map(item => item.value)as RoleEnum[]
           this.setRoleList(roleList) // 权限
       } else {
           userInfo.roles = []
           this.setRoleList([])
       }
   	this.setUserInfo(userInfo)
   	return userInfo
   }
   ```

2. 构建路由

   - 大致代码如下：

     ```typescript
     async buildRoutesAction():Promise<AppRouteRecordRaw> {
         const userStore = useUserStore()
         const appStore = useAppStoreWithOut()
         
         let routes: AppRouteRecordRaw[] = []
         const roleList = toRaw(userStore.getRoleList) || []
         const { permissionMode = projectSetting.permissionMode } = appStore.getProjectConfig
         ***
         return routes
     }
     ```

     

   - 通过路由的addRoute方法，添加路由

     ```typescript
     const routes = await permissionStore.buildRoutesAction()
     
     routes.forEach(route => {
         router.addRoute(route as unknow as RouteRecordRaw)
     })
     
     router.addRoute(PAGE_NOT_FOUND_ROUTE as unknown as RouteRecordRaw);
     ```

### 3. 几种路由权限的实现方案

​	以下几种方案参考了vue-vben-admin项目的处理

   先预先封装好几种常用的处理函数

- filter - 过滤路由树中权限路由

  ```typescript
  interface TreeHelperConfig {
    id: string;
    children: string;
    pid: string;
  }
  
  // 默认配置
  const DEFAULT_CONFIG: TreeHelperConfig = {
    id: 'id',
    children: 'children',
    pid: 'pid',
  };
  
  // 获取配置。  Object.assign 从一个或多个源对象复制到目标对象
  const getConfig = (config: Partial<TreeHelperConfig>) => Object.assign({}, DEFAULT_CONFIG, config);
  
  export function filter<T extends any>(
      tree: T[],
      func: (n: T) => boolean,
      config: Partial<TreeHelperConfig> = {}
  ): T[] {
  	// 获取配置
      config = getConfig(config)
      const children = config.children as string
      
      function listFilter(list: T[]) {
          return list
              .map((node: any) => ({ ...node }))
          	.filter(node => {
              node[children] = node[children] && listFilter(node[children])
              // 执行传入的回调 func 进行过滤
              return func(node) || (node[children] && node[children].length)
          })
      }
      
      return listFilter(tree)
  }
  ```

  

- routerFilter - 过滤符合的权限路由

  ```typescript
  export const routeFilter = (route: AppRouteRecordRaw): boolean => {
      const { meta } = route
      const { roles } = meta || {}
  	if(!roles) return true
      
      return roleList.some(role => roles.includes(role))
  }
  ```

- flatMultiLevelRoutes - 多级路由转二级路由

  ```typescript
  function isMultipleRoute(routeModule: AppRouteModule) {
      // Reflect.has 与 in 操作符 相同, 用于检查一个对象(包括它原型链上)是否拥有某个属性
    	if (!routeModule || !Reflect.has(routeModule, 'children') || !routeModule.children?.length) {
          return false;
      }
  
    const children = routeModule.children;
  
    let flag = false;
    for (let index = 0; index < children.length; index++) {
      const child = children[index];
      if (child.children?.length) {
        flag = true;
        break;
      }
    }
    return flag;    
  }
  
  // 路由等级提升
  function promoteRouteLevel(routeModule: AppRouteModule) {
  	// Use vue-router to splice menus
    	// 使用vue-router拼接菜单
    	// createRouter 创建一个可以被 Vue 应用程序使用的路由实例
    	let router: Router | null = createRouter({
      	routes: [routeModule as unknown as RouteRecordNormalized],
      	history: createWebHashHistory(),
    	});
  	
    // getRoutes： 获取所有 路由记录的完整列表。
    const routes = router.getRoutes();
    // 将所有子路由添加到二级路由
    addToChildren(routes, routeModule.children || [], routeModule);
    router = null;
  
    // omit lodash的函数 对传入的item对象的children进行删除
    routeModule.children = routeModule.children?.map((item) => omit(item, 'children'));
  }
  
  // Add all sub-routes to the secondary route
  // 将所有子路由添加到二级路由
  function addToChildren(
    routes: RouteRecordNormalized[],
    children: AppRouteRecordRaw[],
    routeModule: AppRouteModule,
  ) {
    for (let index = 0; index < children.length; index++) {
      const child = children[index];
      // 路由表中是否可以查找child路由
      const route = routes.find((item) => item.name === child.name);
      if (!route) {
        continue;
      }
      routeModule.children = routeModule.children || [];
      // 多级路由
      if (!routeModule.children.find((item) => item.name === route.name)) {
        routeModule.children?.push(route as unknown as AppRouteModule);
      }
      if (child.children?.length) {
        addToChildren(routes, child.children, routeModule);
      }
    }
  }
  
  // 多级路由转二级路由
  export function flatMultiLevelRoutes(routeModules: AppRouteModule[]) {
      const modules: AppRouteModule[] = cloneDeep(routeModules)
      
      for(const module of modules) {
          if(!isMultipleRoute(module)) {
              continue
          }
          // 路由等级提升
          promoteRouteLevel(module)
      }
  	return modules
  }
  ```

- transformRouteToMenu - 路由转菜单

  ```typescript
  export function transformRouteToMenu(routeModList: AppRouteModule[], routeMapping = false) {
      // 借助深拷贝
      const cloneRouteModList = cloneDeep(routeModList)
      const routeList: AppRouteRecordRaw[] = []
      
      // 对路由项进行修改
      cloneRouteModList.forEach(item => {
          if(routeMapping && item.meta.hideChildrenInMenu && typeof item.redirect === 'string') {
              item.path = item.redirect
          }
          
          if(item.meta?.single) {
              const realItem = item?.children?.[0]
              realItem && routeList.push(realItem)
          } else {
              routeList.push(item)
          }
      })
      
      // 提取树指定结构
      const list = treeMap(routeList, {
          conversion: (node: AppRouteRecordRaw) => {
              const { meta: { title, hideMenu = false } = {} } = node
              return {
                  ...(node.meta || {}),
                  meta: node.meta,
                  name: title,
                  hideMenu,
                  path: node.path,
                  ...(node.redirect ? { redirect: node.redirect } : {})
              };
          }
      })
      // 路径处理
      joinParentPath(list);
      return cloneDeep(list);
  }
  ```
  

1. 前端角色权限

   1. 过滤非一级路由权限

      ```typescript
      routes = filter(asyncRoutes, routerFilter)
      ```

   2. 过滤一级路由权限

      ```typescript
   routes = routerFilter(routes)
      ```
   
   3. 多级路由转二级路由

      ```typescript
      routes = flatMultiLevelRoutes(routes)
      ```

2. 路由表映射

   1. 过滤非一级路由

      ```typescript
      routes = filter(asyncRoutes, routerFilter)
      ```

   2. 过滤一级路由

      ```typescript
      routes = routes.filter(routerFilter)
      ```

   3. 路由生成权限菜单

      ```typescript
      const menuList = transformRouteToMenu(routes, true)
      // 对菜单进行排序
      menuList.sort((a, b) => {
          return (a.meta?.orderNo || 0) - (b.meta?.orderNo || 0);
      });
      ```

   4. 移除设置ignoreRoute：true的路由 （没懂这一步的具体功能）

      ```typescript
      routes = filter(routes, routeRemoveIgnoreFilter)
      routes = routes.filter(routeRemoveIgnoreFilter)
      ```

   5. 设置菜单列表

      ```javascript
      this.setFrontMenuList(menuList)
      ```
   6. 多级路由转二级路由

      ```typescript
      routes = flatMultiLevelRoutes(routes);
      ```

3. 后端角色权限

   1. 通过接口获取路由菜单对象

      ```typescript
        let routeList: AppRouteRecordRaw[] = [];
        try {
          await this.changePermissionCode();
          routeList = (await getMenuList()) as AppRouteRecordRaw[]; // 模拟接口
        } catch (error) {
          console.error(error);
        }
      ```

      

   2. 返回数据生成路由表

      ```typescript
      // Turn background objects into routing objects
      // 将背景对象变成路由对象
      export function transformObjToRoute<T = AppRouteModule>(routeList: AppRouteModule[]): T[] {
        routeList.forEach((route) => {
          const component = route.component as string;
          if (component) {
            if (component.toUpperCase() === 'LAYOUT') {
              route.component = LayoutMap.get(component.toUpperCase());
            } else {
              route.children = [cloneDeep(route)];
              route.component = LAYOUT;
              route.name = `${route.name}Parent`;
              route.path = '';
              const meta = route.meta || {};
              meta.single = true;
              meta.affix = false;
              route.meta = meta;
            }
          } else {
            warn('请正确配置路由：' + route?.name + '的component属性');
          }
          route.children && asyncImportRoute(route.children);
        });
        return routeList as unknown as T[];
      }
      
      // Dynamically introduce components
      // 动态引入组件
      routeList = transformObjToRoute(routeList);
      ```

      

   3. 路由表转导航菜单

      ```typescript
      //  后台路由到菜单结构
      const backMenuList = transformRouteToMenu(routeList);
      this.setBackMenuList(backMenuList);
      ```

   4. 多级路由转二级路由

      ```typescript
      // 删除 meta.ignoreRoute 项
      routeList = filter(routeList, routeRemoveIgnoreFilter);
      routeList = routeList.filter(routeRemoveIgnoreFilter);
      
      routeList = flatMultiLevelRoutes(routeList);
      routes = [PAGE_NOT_FOUND_ROUTE, ...routeList];
      ```
   

### 4. 导航菜单的生成

导航菜单是根据生成路由进行配置的，前端/后端获取用户信息中的路由权限生成导航菜单

具体流程如下：

1. useLayoutMenu这个hooks中包含主要逻辑，通过监听菜单生成时间&获取用户信息生成菜单列表时触发监听器，从而生成菜单

   ```typescript
   import type { Menu } from '/@/router/types';
   import type { Ref } from 'vue';
   import { watch, unref, ref, computed } from 'vue';
   import { useRouter } from 'vue-router';
   import { MenuSplitTyeEnum } from '/@/enums/menuEnum';
   import { useThrottleFn } from '@vueuse/core';
   import { useMenuSetting } from '/@/hooks/setting/useMenuSetting';
   import { getChildrenMenus, getCurrentParentPath, getMenus, getShallowMenus } from '/@/router/menus';
   import { usePermissionStore } from '/@/store/modules/permission';
   import { useAppInject } from '/@/hooks/web/useAppInject';
   
   export function useSplitMenu {
    const menusRef = ref<Menu[]>([]);
      ****
      // 监听构建时间 & 菜单列表
      watch(
      	[() => permissionStore.getLastBuildMenuTime, () => pemissionStore.getBackMenuList],
       () => {
           genMenus() // 生成权限菜单
       }
      )
       
      async function genMenus() {
          if(unref(normalType) && unref(getIsMobile)) {
              menusRef.value = await getMenus()
              return
          }
          
          // split-top
           if (unref(getSpiltTop)) {
             const shallowMenus = await getShallowMenus();
   
             menusRef.value = shallowMenus;
             return;
           }
      }
          
       return { menusRef };
   }
   ```

   1. 说下getSplitTop的逻辑

      取值，值依赖useSplitMenu hooks的传参

      ```typescript
      const getSpiltTop = computed(() => unref(splitType) === MenuSplitTyeEnum.TOP)
      ```

      useSplitMenu 用于菜单menu组件中,可以看到splitType是props传入

      ```typescript
      const { menusRef } = useSplitMenu(toRef(props, 'splitType'));
      ```

      而组件调用是在LayoutSider组件中，图下代码所示

      ```vue
      <template>
          <LayoutMenu :theme="getMenuTheme" :menuMode="getMode" :splitType="getSplitType" />
      </template>
      
      <script setup lang="ts">
        import { useMenuSetting } from '/@/hooks/setting/useMenuSetting';
        const {
          getCollapsed,
          getMenuWidth,
          getSplit, // getSplit读取的是app应用配置
          getMenuTheme,
          getRealWidth,
          getMenuHidden,
          getMenuFixed,
          getIsMixMode,
          toggleCollapsed,
        } = useMenuSetting();
      
        const getSplitType = computed(() => {
              return unref(getSplit) ? MenuSplitTyeEnum.LEFT : MenuSplitTyeEnum.NONE;
            });
      </script>
      ```

      useMenuSetting 代码片段

      ```typescript
      import { useAppStore } from '/@/store/modules/app';
      
      const appStore = useAppStore();
      const getSplit = computed(() => appStore.getMenuSetting.split);
      ```

   2. 说下getShallowMenus的逻辑

      ```typescript
      export async function getShallowMenus(): Promise<Menu[]> {
      	const menus = await getAsyncMenus()
          const shallowMenuList = menus.map(item => ({...item, children: undefined }))
          // 前端角色路由模式
          if(isRoleMode()) {
              const routes = router.getRoutes()
              return shallowMenuList.filter(basicFilter(routes))
          }
          return shallowMenuList
      }
      ```

   3. 说下分割菜单的处理 handleSplitLeftMenu

      ```typescript
      import { MenuSplitTypeEnum } from '@/enums/menuEnum'
      import { useThrottleFn } from '@vueuse/core';
      
      import { getChildrenMenus, getCurrentParentPath, getMenus, getShallowMenus } from '/@/router/menus';
      
      export function useSplitMenu(splitType: Ref<MenuSplitTypeEnum>) {
      
          const throttleHandleSplitLeftMenu = useThrottleFn(handleSplitLeftMenu, 50)
      	// 监听路由 & splitType 变化，节流加载menus 菜单
          watch(
              [() => unref(currentRoute).path, () => unref(splitType)],
              async ([path]: [string, MenuSplitTyeEnum]) => {
                // 
                if (unref(splitNotLeft) || unref(getIsMobile)) return;
      
                const { meta } = unref(currentRoute);
                const currentActiveMenu = meta.currentActiveMenu as string;
                let parentPath = await getCurrentParentPath(path);
                if (!parentPath) {
                  parentPath = await getCurrentParentPath(currentActiveMenu);
                }
                parentPath && throttleHandleSplitLeftMenu(parentPath);
              },
              {
                immediate: true,
              },
          );
          
          async function handleSplitLeftMenu(parentPath: string) {
              if(unref(getSplitLeft) || unref(getIsMobile)) return
              
              const children = await getChidlrenMenus(parentPath)
              
              if(!children || !children.length) {
                  setMenuSetting({ hidden: true }) // 设置导航菜单可见
                  menusRef.value = []
                  return
              }
              
              setMenuSetting({ hidden: false }); // 设置导航菜单不可见
              menusRef.value = children;
          }
      }
      
      ```

      **getChildrenMenus**的逻辑

      ```typescript
      export async function getChildrenMenus(parentPath: string) {
        const menus = await getMenus();
        const parent = menus.find((item) => item.path === parentPath);
        if (!parent || !parent.children || !!parent?.meta?.hideChildrenInMenu) {
          return [] as Menu[];
        }
        if (isRoleMode()) {
          const routes = router.getRoutes();
          return filter(parent.children, basicFilter(routes));
        }
        return parent.children;
      }
      ```

      **setMenuSetting**的逻辑

      ```typescript
      function setMenuSetting(menuSetting: Partial<MenuSetting>): void {
          appStore.setProjectConfig({ menuSetting })
      }
      ```











