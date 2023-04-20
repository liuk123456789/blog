---
title: tsx使用指南
date: 2022-12-29
categories: 
 - Vue
tags:
 - tsx
sidebar: auto
---

### 1. 新建tsx文件

```vue
<script>
import { defineComponent } from 'vue'

import LogoImg from '@/assets/images/logo.png'

export default defineComponent({
  props: {
    onLink: {
      type: Function as PropType<() => void>,
      required: true
    }
  },
  setup(props) {
    return () => (
    <base-image
      class="cursor"
      onClick={props.onLink}
      style="width: 138px; height: 48px"
      src={LogoImg}
      ></base-image>
    )
  }
})
</script>
```

### 2. 通过script 的lang 指定tsx

```vue
<script lang="tsx">
import { defineComponent } from 'vue'
export default defineComponent({
    props: {
      onLink: {
        type: Function as PropType<() => void>,
        required: true
      }
    },
    setup(props) {
      return () => (
        <base-image
        class="cursor"
        onClick={props.onLink}
        style="width: 138px; height: 48px"
        src={LogoImg}
        ></base-image>
      )                             
    }
})
</script>
```

### 3. 组件插槽/二次封装组件插槽问题

这里通过二次封装elementPlus的descriptions组件为例

```vue
<script lang="tsx">
import { defineComponent, toRefs, h } from 'vue'

import type { IDescriptionItem, DescriptionPropsType } from '@/components/DescriptionRender/types'

import { get } from 'lodash-es'

import { isFunction } from '@/utils/is'

export default defineComponent({
  props: {
    itemModel: {
      type: Object as PropType<object>,
      default: () => ({})
    },
    descriptionProps: {
      type: Object as PropType<DescriptionPropsType>,
      default: () => ({})
    },
    descriptionItems: {
      type: Array as PropType<IDescriptionItem[]>,
      default: () => []
    }
  },
  setup(props, { slots }) {
    const { itemModel, descriptionItems, descriptionProps } = toRefs(props)

    const { useTitleSlot, useExtraSlot, title, extra, ...restDescriptionProps } =
      descriptionProps.value

    const descriptionSlots = {
      title: () => title || '',
      extra: () => extra || ''
    }

    if (useTitleSlot) {
      descriptionSlots.title = () => {
        return slots.title()
      }
    }

    if (useExtraSlot) {
      descriptionSlots.extra = () => {
        return slots.extra()
      }
    }

    // 配置策略关系
    const setSlotStrategy = () => {
      const defaultSlottrategy = [
        {
          checker: ({ useContentSlot, defaultSlot }) => !useContentSlot && !defaultSlot,
          Vnode: ({ field }) => {
            return itemModel.value[field]
          }
        },
        {
          checker: ({ useContentSlot }) => !!useContentSlot,
          Vnode: ({ field }) => {
            return slots[field]({ model: itemModel.value })
          }
        }
      ]

      const labelSlottrategy = [
        {
          checker: ({ useLabelSlot, labelSlot }) => !useLabelSlot && !isFunction(labelSlot),
          Vnode: ({ label }) => label
        },
        {
          checker: ({ useLabelSlot }) => !!useLabelSlot,
          Vnode: ({ field }) => {
            return slots[`label_${field}`]()
          }
        }
      ]
      return { defaultSlottrategy, labelSlottrategy }
    }

    // 渲染默认插槽
    const renderDefaultSlot = (options) => {
      const { defaultSlottrategy } = setSlotStrategy()
      const defaultSlotConfig = defaultSlottrategy.find((item) => item.checker(options))
      const defaultSlot = get(defaultSlotConfig, 'Vnode')
      return defaultSlot(options)
    }

    // 渲染label插槽
    const renderLabelSlot = (options) => {
      const { labelSlottrategy } = setSlotStrategy()
      const labelSlotConfig = labelSlottrategy.find((item) => item.checker(options))
      const defaultSlot = get(labelSlotConfig, 'Vnode')
      return defaultSlot(options)
    }
    return () => {
      return (
        <ElDescriptions {...restDescriptionProps} v-slots={descriptionSlots}>
          {descriptionItems.value.map((descriptionItem) => {
            const { field, label, useContentSlot, defaultSlot, useLabelSlot, labelSlot, ...props } =
              descriptionItem

            // default插槽
            const customContentSlot = renderDefaultSlot({
              field,
              useContentSlot,
              defaultSlot
            })

            // label 插槽
            const customLabelSlot = renderLabelSlot({
              field,
              label,
              useLabelSlot,
              labelSlot
            })

            const descritpionItemProps = {
              ...props,
              key: props.field
            }

            const slots = {
              default: () => customContentSlot,
              label: () => customLabelSlot
            }

            return (
              <ElDescriptionsItem {...descritpionItemProps} v-slots={slots}></ElDescriptionsItem>
            )
          })}
        </ElDescriptions>
      )
    }
  }
})
</script>

```

设置参数类型

```typescript
export interface IDescriptionItem {
  field: string | number
  label: string
  width?: string | number
  className?: string
  minWidth?: string | number
  span?: number
  align?: string
  labelAlign?: string
  labelClassName?: string
  useContentSlot?: boolean
  useLabelSlot?: boolean
}

export type DescriptionPropsType = Partial<{
  border: boolean
  column: number
  direction: 'vertical' | 'horizontal'
  size: 'small' | 'default' | 'large'
  title: string
  extra: string
  useTitleSlot?: boolean
  useExtraSlot?: boolean
}>

```

使用

1. 设置配置项

   ```typescript
   import type { IDescriptionItem } from '@/components/DescriptionRender/types'
   
   export const idItem: IDescriptionItem = {
     field: 'id',
     label: '编号',
     useContentSlot: true,
     useLabelSlot: true
   }
   
   export const nameItem: IDescriptionItem = {
     field: 'name',
     label: '名字'
   }
   
   export const ageItem: IDescriptionItem = {
     field: 'age',
     label: '年龄'
   }
   
   export const mobileItem: IDescriptionItem = {
     field: 'mobile',
     label: '手机号'
   }
   
   export default [idItem, nameItem, ageItem, mobileItem]
   
   ```

2. 组件中使用

   ```vue
   <template>
     <div>
       <DescriptionRender
         :item-model="itemModel"
         :description-props="descriptionProps"
         :description-items="items"
       >
         // 这里便是自定义插槽
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
           <el-tag size="small">School</el-tag>
         </template>
       </DescriptionRender>
       <BackTop />
     </div>
   </template>
   <script setup lang="ts">
   import { reactive } from 'vue'
   
   import descriptionItems from './config/description-items'
   
   import type { DescriptionPropsType, IDescriptionItem } from '@/components/DescriptionRender/types'
   
   const itemModel = reactive({
     id: 'ddfrr8328wwe32',
     name: '张三',
     age: 24,
     mobile: 110
   })
   
   const descriptionProps: DescriptionPropsType = {
     column: 2,
     useTitleSlot: true,
     useExtraSlot: true
   }
   
   const items: IDescriptionItem[] = reactive(descriptionItems)
   </script>
   
   ```