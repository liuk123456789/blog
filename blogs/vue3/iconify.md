---
title: Iconify的使用
date: 2023-01-03
categories: 
 - Vue
tags:
 - Iconify
sidebar: auto
---

## 1. Iconify概述

[Iconify](https://link.juejin.cn/?target=https%3A%2F%2Ficonify.design) 可以访问 80 多个流行的开源图标集，其中有超过 5000 个图标可供选择，基本上能满足了我们项目中的所有需求了。在 [Iconify](https://link.juejin.cn/?target=https%3A%2F%2Ficonify.design) 上，你可以查询到你想要的组件库图标并使用，如 `Element` 、 `Antd`。

## 2. 依赖&vite配置

1. 安装依赖

   ```bash
   npm i @iconify/json @purge-icons/generated vite-plugin-purge-icons -D
   ```

   ```bash
   npm i @iconify/iconify -S
   ```

   

2. 修改vite.config.ts配置

   ```typescript
   import PurgeIcons from 'vite-plugin-purge-icons'
   
   import { defineConfig, loadEnv } from 'vite'
   import type { UserConfig, ConfigEnv } from 'vite'
   
   export default defineConfig(({ mode }: ConfigEnv):UserConfig => {
       return {
           ***
           plugins: [
           	***
               PurgeIcons()
           ]
       }
   })
   ```

## 3. Icon组件封装

为了保证图标样式统一性，可以基于组件库的Icon组件进行二次封装，这里我们以 `element-plus` 为例。

并且 `Icon` 组件 需要对外暴露三个参数 `icon` 、 `color` 、 `size`，分别对应 `图标名称` 、 `图标颜色` 、 `图标尺寸` 。

```vue
<script lang="ts" setup>
import { ElIcon } from 'element-plus'

const props = defineProps({
    icon: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: ''
    },
    size: {
        type: Number,
        default: 16
    }
})
</script>
```

### 处理本地svg图标

```vue
<template>
  <ElIcon :size="size" :color="color">
    <svg v-if="isLocal" aria-hidden="true">
      <use :xlink:href="symbolId" />
    </svg>
  </ElIcon>

</template>
<script lang="ts" setup>
import { ElIcon } from 'element-plus'
    
import { computed, unref, toRefs } from 'vue'

// 本地svg图标的标记    
const SVG_START_WITH_FLAG = 'svg-icon:';

const props = defineProps({
    icon: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: ''
    },
    size: {
        type: Number,
        default: 16
    }
})
const { icon } = toRefs(props)

// 是否时本地svg
const isLocal = computed(() => {
    return icon.startsWith(SVG_START_WITH_FLAG)
})

// 获取icon
const symbolId = computed(() => {
    return unref(isLocal) ? `#icon-${props.icon.split(SVG_START_WITH_FLAG)[1]}` : icon
})
</script>
```

测试代码&效果图：

```vue
<DescriptionRender
  :item-model="itemModel"
  :description-props="descriptionProps"
  :description-items="items"
>
  <template #title>
    <el-tag size="small">测试左侧标题</el-tag>
  </template>
  <template #extra>
    <el-tag size="small">测试右侧标题</el-tag>
  </template>
  <template #id>
    <el-tag size="small">{{ itemModel.mobile }}</el-tag>
  </template>
  <template #label_id>
    <ElTag size="small">School</ElTag>
    <Icon icon="svg-icon:more-icon" />
  </template>
</DescriptionRender>
```



![](/my-blog/vue/icon-first.jpg)

### 处理Iconify图标

```vue
<template>
  <ElIcon :size="size" :color="color">
    <svg v-if="isLocal" aria-hidden="true">
      <use :xlink:href="symbolId" />
    </svg>
    <span v-else ref="elRef" :class="$attrs.class" :style="getIconifyStyle">
      <span class="iconify" :data-icon="symbolId"></span>
    </span>
  </ElIcon>

</template>

<script lang="ts" setup>
import { ElIcon } from 'element-plus'
    
import { computed, unref, toRefs, nextTick, watch } from 'vue'
    
import Iconify from '@purge-icons/generated'

// 本地svg图标的标记    
const SVG_START_WITH_FLAG = 'svg-icon:';

const props = defineProps({
    icon: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: ''
    },
    size: {
        type: Number,
        default: 16
    }
})
const { icon, color, size } = toRefs(props)

// 是否时本地svg
const isLocal = computed(() => {
    return icon.startsWith(SVG_START_WITH_FLAG)
})

// 获取icon
const symbolId = computed(() => {
    return unref(isLocal) ? `#icon-${props.icon.split(SVG_START_WITH_FLAG)[1]}` : icon
})

const elRef = ref<ElRef>(null)
// 设置Iconify样式
const getIconifyStyle = computed(() => {
    return {
        fontSize: `${size}px`,
        color
    }
})

// 更新Iconify
const updateIcon = async(icon: string) => {
    if(unref(isLocal)) return
    
    const el = unref(elRef)

	await nextTick()
    
    if(!icon) return
    
    const svg = Iconify.renderSVG(icon, {})
    if(svg) {
        el.textContent = ''
        el.appendChild(svg)
    } else {
        const span = document.createElement('span')
        span.className = 'iconify'
        span.dataset.icon = icon
        el.textContent = ''
        el.appendChild(span)
    }
}

watch(
	() => props.icon,
    (icon: string) => {
        updateIcon(icon)
    }
)
</script>
```

测试代码&效果图

```vue
<DescriptionRender
  :item-model="itemModel"
  :description-props="descriptionProps"
  :description-items="items"
>
  <template #title>
    <el-tag size="small">测试左侧标题</el-tag>
  </template>
  <template #extra>
    <el-tag size="small">测试右侧标题</el-tag>
  </template>
  <template #id>
    <el-tag size="small">{{ itemModel.mobile }}</el-tag>
  </template>
  <template #label_id>
    <ElTag size="small">School</ElTag>
    <!-- <Icon icon="svg-icon:more-icon" /> -->
    <Icon icon="ep:aim" />
    <Icon icon="ep:alarm-clock" />
    <Icon icon="ep:baseball" />
    <Icon icon="ep:chat-line-round" />
  </template>
</DescriptionRender>
```

![](/my-blog/vue/icon-second.jpg)