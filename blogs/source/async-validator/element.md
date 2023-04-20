---
title: Elementui中使用asyncValidator
date: 2023-04-02
categories: 
 - 源码解读
tags:
 - ELementUI & async-validator
sidebar: auto
---

## 1. 版本说明

> ElementUI: 2.15.13
>
> async-validator: ~1.8.1

备注：

`Semver`通过`X.Y.Z`定义版本规范，`package.json`中`~`代表限制`X.Y`的版本，`Z`的版本在依赖下载时会更新到最新版，而`^`代表只限制`X`的版本，`Y.Z`的会更新到最新版本

## 2. form-item

### validate

这个方法便是调用`async-validator`的validate触发校验的核心

```javascript
validate(trigger, callback = noop) {
    this.validateDisabled = false;
    const rules = this.getFilteredRule(trigger);
    if ((!rules || rules.length === 0) && this.required === undefined) {
      callback();
      return true;
    }

    this.validateState = 'validating';

    const descriptor = {};
    if (rules && rules.length > 0) {
      rules.forEach(rule => {
        delete rule.trigger;
      });
    }
    descriptor[this.prop] = rules;

    const validator = new AsyncValidator(descriptor);
    const model = {};

    model[this.prop] = this.fieldValue;

    validator.validate(model, { firstFields: true }, (errors, invalidFields) => {
      this.validateState = !errors ? 'success' : 'error';
      this.validateMessage = errors ? errors[0].message : '';

      callback(this.validateMessage, invalidFields);
      this.elForm && this.elForm.$emit('validate', this.prop, !errors, this.validateMessage || null);
    });
},
```

- `trigger`代表触发校验的方式，存在`change`和`blur`两种方式
- `callback`用于调用`form`组件实例方法`validate`（官网文档中的`validate`)传入的回调
- 调用`validator.validate`时，`options`配置了`firstFields: true`,说明`props`的`rule`规则存在一条校验不通过就终止
- 我们在使用`ElForm`时`rules`配置了`trigger`，在生成`async-validator`的`descriptor`时，去掉了`trigger`，这里的写法非常有必要，在使用`TypeScript`时，不去掉`trigger`会报错，也保留了数据的原始性，没有参杂额外属性

## 结尾

因为只关注`ElementUI`是如何使用`async-validator`的，对于整个`ElForm`的校验流程没有涉及，代码也不复杂，如果对于`ElForm`整个校验流程感兴趣，可以直接看下`ElementUI`中的`form.vue`&`form-item.vue`

