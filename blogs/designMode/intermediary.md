---
title: 中介者模式
date: 2023-03-01
categories: 
 - Design Partten
tags:
 - intermediary
sidebar: auto
---

## 介绍

> 中介者模式的作用就是解除对象与对象之间的紧耦合关系。增加一个中介者对象后，所有的
>
> 相关对象都通过中介者对象来通信，而不是互相引用，所以当一个对象发生改变时，只需要通知
>
> 中介者对象即可。中介者使各对象之间耦合松散，而且可以独立地改变它们之间的交互。中介者
>
> 模式使网状的多对多关系变成了相对简单的一对多关系

## 现实中的中介者

### 机场指挥塔

> 中介者也被称为调停者，我们想象一下机场的指挥塔，如果没有指挥塔的存在，每一架飞机
>
> 要和方圆 100 公里内的所有飞机通信，才能确定航线以及飞行状况，后果是不可想象的。现实中
>
> 的情况是，每架飞机都只需要和指挥塔通信。指挥塔作为调停者，知道每一架飞机的飞行状况，
>
> 所以它可以安排所有飞机的起降时间，及时做出航线调整。

### 博彩公司

> 打麻将的人经常遇到这样的问题，打了几局之后开始计算钱，A 自摸了两把，B 杠了三次，
>
> C 点炮一次给 D，谁应该给谁多少钱已经很难计算清楚，而这还是在只有 4 个人参与的情况下。
>
> 在世界杯期间购买足球彩票，如果没有博彩公司作为中介，上千万的人一起计算赔率和输赢
>
> 绝对是不可能实现的事情。有了博彩公司作为中介，每个人只需和博彩公司发生关联，博彩公司
>
> 会根据所有人的投注情况计算好赔率，彩民们赢了钱就从博彩公司拿，输了钱就交给博彩公司。

## 中介者的实际应用 - 偏好搜索

### 1. 效果图

![intermediary_1.jpg](/my-blog/designPattern/intermediary/intermediary_1.jpg)

### 2. 思路

![intermediary_2.png](/my-blog/designPattern/intermediary/intermediary_2.png)

### 3. 代码

因为使用的`Vue`，所以就用`Vue`展示代码

`PerformanceFilter`类代码大致结构

1. 表单/自定义表单类组件change统一处理

   ```javascript
   export default class PerformanceFilter {
     constructor(filterBarList, formModel) {
       this.filterBarList = []
       this.formModel =  {}
     }
       
     _getFieldIndex() {
       const idx = this.filterBarList.findIndex((item) => item.id === id)
       if (id === -1) return
       return idx 
     }
   
     /**
      * 用于处理表单空间/自定义空间触发处理
      * @param {String} field 用于标识当前操作的表单项的类型
      * @param {Object} fieldValue 当前操作表单项的值
      * @param {Boolean}  isCustom 用于标识是否是自定义
     */
     change(fieldModel) {
       try {
         if (isBlank(fieldModel)) throw new Error(`[fieldModel]:字段缺失`)
         // 将当前的数据放入数组
         this.filterBarList.push({
           id: generateUUID(), // 分配个uuid
           ...fieldModel
         })
       } catch (error) {
         console.error(error.message || error)
       }
     }
     /**
      * 用于处理底部筛选删除的处理
      * @param {String} id 筛选条目的id
     */
     delete(id) {
   	const idx = this._getFieldIndex(id)
       if(idx === -1) return
       this.filterBarList.splice(idx, 1)
     }
   
     /**
      * 用于处理底部筛选删除的处理
      * @param {String} id 筛选条目的id
     */
     reset() {
   
     }
     /**
      * 点击偏好搜索时的处理
      * @param {Object} obj
      */
     changePerformance(obj) {
   
     }
   
     /**
      * 更新filterBarList和params
     */
     update() {
   
     }
   }
   ```

2. 上面代码中存在一个问题，就是每次change前，我需要把filterBarList 中field 和当前field一致的，提前过滤掉， 然后在push，所以需要提供一个新的方法，修改代码

   ```javascript
   export default class PerformanceFilter {
     constructor(filterBarList, formModel) {
       this.filterBarList = []
       this.formModel =  {}
     }
       
      /**省略部分代码*/
       
      /**
      * 删除某个type对应list
      */
      _clearFilterBarFieldType(fieldType) {
        return this.filterBarList.filter(({ field }) => field !== fieldType)
      }
   
      filterListByField(field) {
        this.filterBarList = this._clearFilterBarFieldType(field)
      }
   }
   ```

3. 更新最新的表单数据

   ```javascript
   import { isBlank } from './is'
   import { generateUUID } from './util' // 生成UUID
   
   // 表单字段的映射
   export const FILTER_FIELD_TYPE = {
     ACCEPTER_TYPE: 'accepterType',
     EXPIREDAY: 'expireDay',
     BILL_AMOUNT: 'billAmount',
     FLAW: 'flaw',
     CHARGE_AMOUNT: 'chargeAmount',
   }
   
   // 数据处理的策略，需要注意自己项目的不同来处理
   const strategies = [{
     checker: (field) => [FILTER_FIELD_TYPE.ACCEPTER_TYPE, FILTER_FIELD_TYPE.FLAW].includes(field),
     result: (field, fieldValue, map) => {
       const mapFields = map.get(`${field}`) || []
       mapFields.push(fieldValue[field])
       map.set(`${field}`, [...mapFields])
       return { [field]: map.get(`${field}`).join(',') }
     }
   }, {
     checker: (field) => field === FILTER_FIELD_TYPE.EXPIREDAY,
     result: (field, fieldValue) => {
       const { expireDayMin, expireDayMax } = fieldValue
       return { expireDayMin, expireDayMax }
     }
   }, {
     checker: (field) => field === FILTER_FIELD_TYPE.BILL_AMOUNT,
     result: (field, fieldValue) => {
       const { amountMin, amountMax } = fieldValue
       return { amountMin, amountMax }
     }
   }]
   
   export class PerformanceFilter {
     constructor(filterBarList, formModel) {
       this.filterBarList = []
       this.formModel = {}
     }
   
     /**省略部分代码*/
     updateFormModel() {
       const params = {}
       const map = new Map()
       for (const { field, fieldValue } of this.filterBarList) {
         const fieldModel = strategies.find(({ checker }) => checker(field))
         if (!fieldModel) return
         Object.assign(params, fieldModel.result(field, fieldValue, map))
       }
       this.formModel = { ...params }
     }
   }
   ```

4. 最后就是切换搜索偏好的处理

   ```javascript
   export const FILTER_FIELD_TYPE = {
     ACCEPTER_TYPE: 'accepterType',
     EXPIREDAY: 'expireDay',
     BILL_AMOUNT: 'billAmount',
     FLAW: 'flaw',
     CHARGE_AMOUNT: 'chargeAmount',
     SEARCH: 'search'
   }
   
   export class PerformanceFilter {
     /**
      * 重置数据
      * @param
     */
     reset() {
       this.filterBarList = []
       this.formModel = {}
     }
       
     /**
      * @param {Object} performanceObj
      * @returns {Object} performanceModel
      */
     changePerformance(performanceObj) {
       // 在处理之前，我们需要将performanceObj 的key 一定是在FILTER_FIELD_TYPE中的
       // 无非需要将一些数据处理成数据类型，一些数据需要处理成时间类型格式等等
       // 而对于底部的筛选来说，我们需要根据不同情况，进行不同处理
       const performanceModel = {}
   
       const stragies = [{
         checker: (field) => [FILTER_FIELD_TYPE.ACCEPTER_TYPE, FILTER_FIELD_TYPE.FLAW].includes(field),
         result: (field, fieldValue, map) => {
           // 过滤
           this.clearFieldfilterBarList(field)
           // 更新filterBarList
           for (const item of fieldValue.split(',')) {
             this.change({
               field,
               fieldValue: item,
               label: item, // 如果是映射，取映射关系的label
               isCustom: false
             })
           }
           return { [field]: fieldValue }
         }
       }, {
         checker: (field) => field === FILTER_FIELD_TYPE.EXPIREDAY,
         result: (field, fieldValue) => {
           /***/
         }
       }]
       const map = new Map()
       for (const [key, value] of Object.entries(performanceObj)) {
         const formatStragies = stragies.find(({ checker }) => checker(key))
         if (!formatStragies) return
         const model = formatStragies.result(key, value, map)
         Object.assign(performanceModel, { ...model })
       }
       this.updateFormModel()
       return performanceModel
     }
   }
   ```

### 4.最终效果

![intermediary_3.jpg](/my-blog/designPattern/intermediary/intermediary_3.jpg)