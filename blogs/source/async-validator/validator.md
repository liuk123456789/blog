---
title: AsyncValidator 源码
date: 2023-03-28
categories: 
 - 源码解读
tags:
 - async validator
sidebar: auto
---

## 1. 版本说明

> version: 4.2.5

## 2. 哪里用到AsyncValidator

如我们日常开发中使用的`Ant Design Vue`和`Element`的表单校验都使用了`AsyncValidator`进行表单校验

## 3. 入口

`/src/index.ts`便是整个项目的入口

## 4. 初始化

项目初始化时，会根据出入的规则对象进行解析，会在解析过程看下`TypeScript`的定义

涉及到的类型**Rules**，**Rule**，**RuleItem**如下

```typescript
export type RuleType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'method'
  | 'regexp'
  | 'integer'
  | 'float'
  | 'array'
  | 'object'
  | 'enum'
  | 'date'
  | 'url'
  | 'hex'
  | 'email'
  | 'pattern'
  | 'any';

export interface RuleItem {
  type?: RuleType; // default type is 'string' 默认是string
  required?: boolean; // 是否必填
  pattern?: RegExp | string; // 正则类型/字符串
  min?: number; // Range of type 'string' and 'array'
  max?: number; // Range of type 'string' and 'array'
  len?: number; // Length of type 'string' and 'array'
  enum?: Array<string | number | boolean | null | undefined>; // possible values of type 'enum'
  whitespace?: boolean;
  fields?: Record<string, Rule>; // ignore when without required
  options?: ValidateOption;
  defaultField?: Rule; // 'object' or 'array' containing validation rules
  transform?: (value: Value) => Value;
  message?: string | ((a?: string) => string);
  asyncValidator?: (
    rule: InternalRuleItem,
    value: Value,
    callback: (error?: string | Error) => void,
    source: Values,
    options: ValidateOption,
  ) => void | Promise<void>;
  validator?: (
    rule: InternalRuleItem,
    value: Value,
    callback: (error?: string | Error) => void,
    source: Values,
    options: ValidateOption,
  ) => SyncValidateResult | void;
}

export type Rule = RuleItem | RuleItem[];

export type Rules = Record<string, Rule>;
```

初始化代码如下

```typescript
class Schema {
    constructor(descriptor: Rules) {
        this.define(descriptor)
    }
    
    define(rules: Rules) {
       if(!rules) {
           throw new Error('Cannot configure a schema with no rules')
       }
       if (typeof rules !== 'object' || Array.isArray(rules)) {
      	   throw new Error('Rules must be an object');
       }
       this.rules = {};

       Object.keys(rules).forEach(name => {
       	   const item: Rule = rules[name];
           // 包装成数组，方便后面遍历
           this.rules[name] = Array.isArray(item) ? item : [item];
       });
    }
}
```

## 5. 校验validate方法

涉及到的类型如下

```typescript
export type Value = any;
export type Values = Record<string, Value>;

type ValidateMessage<T extends any[] = unknown[]> =
  | string
  | ((...args: T) => string);

export interface ValidateError {
  message?: string;
  fieldValue?: Value;
  field?: string;
}

export type ValidateFieldsError = Record<string, ValidateError[]>;

export type ValidateCallback = (
  errors: ValidateError[] | null,
  fields: ValidateFieldsError | Values,
) => void;

export interface ValidateMessages {
  default?: ValidateMessage;
  required?: ValidateMessage<[FullField]>;
  enum?: ValidateMessage<[FullField, EnumString]>;
  whitespace?: ValidateMessage<[FullField]>;
  date?: {
    format?: ValidateMessage;
    parse?: ValidateMessage;
    invalid?: ValidateMessage;
  };
  types?: {
    string?: ValidateMessage<[FullField, Type]>;
    method?: ValidateMessage<[FullField, Type]>;
    array?: ValidateMessage<[FullField, Type]>;
    object?: ValidateMessage<[FullField, Type]>;
    number?: ValidateMessage<[FullField, Type]>;
    date?: ValidateMessage<[FullField, Type]>;
    boolean?: ValidateMessage<[FullField, Type]>;
    integer?: ValidateMessage<[FullField, Type]>;
    float?: ValidateMessage<[FullField, Type]>;
    regexp?: ValidateMessage<[FullField, Type]>;
    email?: ValidateMessage<[FullField, Type]>;
    url?: ValidateMessage<[FullField, Type]>;
    hex?: ValidateMessage<[FullField, Type]>;
  };
  string?: {
    len?: ValidateMessage<[FullField, Range]>;
    min?: ValidateMessage<[FullField, Range]>;
    max?: ValidateMessage<[FullField, Range]>;
    range?: ValidateMessage<[FullField, Range, Range]>;
  };
  number?: {
    len?: ValidateMessage<[FullField, Range]>;
    min?: ValidateMessage<[FullField, Range]>;
    max?: ValidateMessage<[FullField, Range]>;
    range?: ValidateMessage<[FullField, Range, Range]>;
  };
  array?: {
    len?: ValidateMessage<[FullField, Range]>;
    min?: ValidateMessage<[FullField, Range]>;
    max?: ValidateMessage<[FullField, Range]>;
    range?: ValidateMessage<[FullField, Range, Range]>;
  };
  pattern?: {
    mismatch?: ValidateMessage<[FullField, Value, Pattern]>;
  };
}

export interface ValidateOption {
  // whether to suppress internal warning 是否忽略库的内部警告
  suppressWarning?: boolean;

  // whether to suppress validator error 是否忽略验证器错误
  suppressValidatorError?: boolean;

  // when the first validation rule generates an error stop processed
  // 当第一个验证规则产生错误时停止处理
  first?: boolean;

  // when the first validation rule of the specified field generates an error stop the field processed, 'true' means all fields.
  // 当指定字段的第一个验证规则产生错误时停止处理该字段，'true' 表示所有字段。
  firstFields?: boolean | string[];

  messages?: Partial<ValidateMessages>;

  /** The name of rules need to be trigger. Will validate all rules if leave empty */
  // 规则名称需要触发。 如果留空，将验证所有规则
  keys?: string[];

  error?: (rule: InternalRuleItem, message: string) => ValidateError;
}

export type ExecuteValidator = (
  rule: InternalRuleItem,
  value: Value,
  callback: (error?: string[]) => void,
  source: Values,
  options: ValidateOption,
) => void;

// Omit<A, B> TS的内置类型 从 keyof A 中排除类型B
export interface InternalRuleItem extends Omit<RuleItem, 'validator'> {
  field?: string;
  fullField?: string;
  fullFields?: string[];
  validator?: RuleItem['validator'] | ExecuteValidator;
}
```

看下`validate`的实现过程

1. 函数重载

   ```typescript
   validate(
       source: Values,
       option?: ValidateOption,
       callback?: ValidateCallback,
   ): Promise<Values>;
   validate(source: Values, callback: ValidateCallback): Promise<Values>;
   validate(source: Values): Promise<Values>;
   ```

   通过函数重载，我们可以使用以下方式调用`validate`

   ```typescript
   import Schema from 'async-validator';
   
   const rules = {
       name: {
           type: 'string',
           required: true,
           validator: (rule, value) => value === 'muji',
       }
   }
   
   const validator = new Schema(rules)
   
   // 第一种方式
   validator.validate({ name: 'muji'}, {
       first: true
   }, (errors, fields) => {
       console.log(errors, fields)
   }): Promise<Values>
   
   // 第二种方式
   validator.validate({ name: 'muji'}, (errors, fields) => {
       console.log(errors, fields)
   }):Promise<Values>
   
   // 第三种方式
   const validateName = async () => {
     try {
       const res = await validator.validate({ name: 'muji' });
       console.log(res);
     } catch (error) {
       console.error(error.message || error)
     }
   }
   
   validateName()
   ```

2. 兼容校验

   ```typescript
   validate(source_: Values, o: any = {}, oc: any = () => {}): Promise<Values> {
       let source:Values = source_;
       let options:ValidateOptions = o;
       let callback:ValidateCallback = oc;
       
       // 如果使用第二种方式的话，需要修改callback 和 options的值
       if(typeof options === 'function') {
           callback = options
           options = {}
       }
   
   	// 如果传入的规则不存在/空对象时，兼容下
   	if(!this.rules || Object.keys(this.rules).length === 0) {
           if(callback) {
               callback(null, source)
           }
           // 将返回数据包装成Promise
           return Promise.resolve(source)
       }
   }
   ```

3. `ValidateOption`的`messages`配置

   `newMessages`的相关代码

   ```typescript
   export function newMessages(): InternalValidateMessages {
     return {
       default: 'Validation error on field %s',
       required: '%s is required',
       enum: '%s must be one of %s',
       whitespace: '%s cannot be empty',
       date: {
         format: '%s date %s is invalid for format %s',
         parse: '%s date could not be parsed, %s is invalid ',
         invalid: '%s date %s is invalid',
       },
       types: {
         string: '%s is not a %s',
         method: '%s is not a %s (function)',
         array: '%s is not an %s',
         object: '%s is not an %s',
         number: '%s is not a %s',
         date: '%s is not a %s',
         boolean: '%s is not a %s',
         integer: '%s is not an %s',
         float: '%s is not a %s',
         regexp: '%s is not a valid %s',
         email: '%s is not a valid %s',
         url: '%s is not a valid %s',
         hex: '%s is not a valid %s',
       },
       string: {
         len: '%s must be exactly %s characters',
         min: '%s must be at least %s characters',
         max: '%s cannot be longer than %s characters',
         range: '%s must be between %s and %s characters',
       },
       number: {
         len: '%s must equal %s',
         min: '%s cannot be less than %s',
         max: '%s cannot be greater than %s',
         range: '%s must be between %s and %s',
       },
       array: {
         len: '%s must be exactly %s in length',
         min: '%s cannot be less than %s in length',
         max: '%s cannot be greater than %s in length',
         range: '%s must be between %s and %s in length',
       },
       pattern: {
         mismatch: '%s value %s does not match pattern %s',
       },
       clone() {
         const cloned = JSON.parse(JSON.stringify(this));
         cloned.clone = this.clone;
         return cloned;
       },
     };
   }
   
   export const messages = newMessages();
   ```

   `deepMerge`的代码如下

   ```typescript
   export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
     if (source) {
       for (const s in source) {
         if (source.hasOwnProperty(s)) {
           const value = source[s];
           if (typeof value === 'object' && typeof target[s] === 'object') {
             target[s] = {
               ...target[s],
               ...value,
             };
           } else {
             target[s] = value;
           }
         }
       }
     }
     return target;
   }
   
   ```

   `options.messages`配置项代码

   ```typescript
   class Schema {
     // ======================== Instance ========================
     _messages: InternalValidateMessages = defaultMessages;
       validate(source_: Values, o: any = {}, oc: any = () => {}): Promise<Values> {
          if(options.messages) {
              let messages = this.messages()
              if(messages === defaultMessages()) {
                  message = newMessages()
              }
              // 合并配置
              deepMerge(messages, options.messages)
              options.messages = messages
          } else {
              options.messages = this.messages()
          }
       }
       
       messages(messages?: ValidateMessages) {
         if (messages) {
           this._messages = deepMerge(newMessages(), messages);
         }
         return this._messages;
       }
   }
   ```

   这段代码的意思就是我可以修改默认配置的`message`，测试下

   ```typescript
   validator.validate(
       { name: '' },
       options,
       (errors, fields) => {
         console.error(options)
           if (errors) {
               // validation failed, errors is an array of all errors
               // fields is an object keyed by field name with an array of
               // errors per field
               return handleErrors(errors, fields);
           }
           // validation passed
       }
   );
   ```

   输出结果如下

   ```typescript
   {
       messages: {
           ***
           required: '%s 必填哦',
           ***
       }
   }
   ```

4. 遍历规则，组装数据

   相关类型如下

   ```typescript
   export interface RuleValuePackage {
     rule: InternalRuleItem;
     value: Value;
     source: Values;
     field: string;
   }
   ```

   数据组装代码如下

   ```typescript
   class Schema {
     validate(source_: Values, o: any = {}, oc: any = () => {}): Promise<Values> {
      	  // ------------省略部分代码------------
         
         const series: Record<string, RuleValuePackage[]> = {}
         // 读取options中配置keys，如果未配置读取rules的key
         const keys = options.keys || Object.keys(this.rules)
         keys.forEach(z => {
             // 因为define 中rule放入数组中
             const arr = this.rules[z]
             let value = source[z]
             
             arr.forEach(r => {
                 let rule: InternalRuleItem = r
                 // 格式化field 的value
                 if (typeof rule.transform === 'function') {
                 	if (source === source_) {
                   	source = { ...source };
                 	}
                 	value = source[z] = rule.transform(value);
                 }
                 // TODO: 这里有个疑问：rule根据类型，应该不会存在function类型，待验证
                 if (typeof rule === 'function') {
                     rule = {
                       validator: rule,
                     };
                  } else {
                     rule = { ...rule };
                  }
                  rule.validator = this.getValidationMethod(rule)
                  if(!rule.validator) {
                      return
                  }
                 
                  rule.field = z
                  rule.fullField = rule.fullField || z;
                  rule.type = this.getType(rule)
                  series[z] = series[z] || []
                  series[z].push({
                      rule,
                      value,
                      source,
                      field: z
                  })
             })
         })
     }
     // 配置rule 中的 validator 属性  
     getValidationMethod(rule: InternalRuleItem) {
         
       if (typeof rule.validator === 'function') {
         return rule.validator;
       }
       const keys = Object.keys(rule);
       const messageIndex = keys.indexOf('message');
       if (messageIndex !== -1) {
         keys.splice(messageIndex, 1);
       }
       // validators的required
       if (keys.length === 1 && keys[0] === 'required') {
         return validators.required;
       }
       return validators[this.getType(rule)] || undefined;
     }
     // 配置type 类型  
     getType(rule: InternalRuleItem) {
       if (rule.type === undefined && rule.pattern instanceof RegExp) {
         rule.type = 'pattern';
       }
       // validator
       if (
         typeof rule.validator !== 'function' &&
         rule.type &&
         !validators.hasOwnProperty(rule.type)
       ) {
         throw new Error(format('Unknown rule type %s', rule.type));
       }
       return rule.type || 'string';
     }
   }
   ```

   1. 遍历`rules`，组装成 `{ rule, value, source, field }`
   2. `getValidationMethod`作用就是给rule添加一个`validator`属性,优先级 `自定义validator > required > 其他type对应的类型`
   3. `getType`就会为`rule`匹配`type`

5. **asyncMap**

   **asyncMap**的代码如下

   ```typescript
   export class AsyncValidationError extends Error {
     errors: ValidateError[];
     fields: Record<string, ValidateError[]>;
   
     constructor(
       errors: ValidateError[],
       fields: Record<string, ValidateError[]>,
     ) {
       super('Async Validation Error');
       this.errors = errors;
       this.fields = fields;
     }
   }
   
   export function convertFieldsError(
     errors: ValidateError[],
   ): Record<string, ValidateError[]> {
     if (!errors || !errors.length) return null;
     const fields = {};
     errors.forEach(error => {
       const field = error.field;
       fields[field] = fields[field] || [];
       fields[field].push(error);
     });
     return fields;
   }
   
   export function asyncMap(
   	objArr: Record<string, RuleValuePackage[]>,
       option: validateOption,
       func: ValidateFunc,
       callback: (errors: validateError[]) => void,
       source: Values
   ):Promise<Values> {
     // 配置first（第一个验证规则错误时终止）
     if (option.first) {
       const pending = new Promise<Values>((resolve, reject) => {
         const next = (errors: ValidateError[]) => {
           callback(errors);
           return errors.length
             ? reject(new AsyncValidationError(errors, convertFieldsError(errors)))
             : resolve(source);
         };
         const flattenArr = flattenObjArr(objArr);
         asyncSerialArray(flattenArr, func, next);
       });
       pending.catch(e => e);
       return pending;
     }
     // 省略部分代码
   }
   ```

   可以看到配置了`option.first`会返回一个promise，如果校验通过情况会返回`source`，校验未通过会会返回`error以及对应的fileds`，其中`fields`的格式如下：

   ```typescript
   const fields:Record<string, ValidateError[]> = { 
       [PropertyKey]: [{ message: string, fieldValue: Value, field: string }] 
   }
   ```

   **AsyncValidationError**和**convertFieldsError**很好理解，我们看下**flattenObjArr**和**asyncSerialArray**

   ```typescript
   function flattenObjArr(objArr: Record<string, RuleValuePackage[]>) {
     const ret: RuleValuePackage[] = [];
     Object.keys(objArr).forEach(k => {
       // 通过解构，将数组平铺
       ret.push(...(objArr[k] || []));
     });
     return ret;
   }
   ```

   ```typescript
   type ValidateFunc = (
     data: RuleValuePackage,
     doIt: (errors: ValidateError[]) => void,
   ) => void;
   
   function asyncSerialArray(
     arr: RuleValuePackage[],
     func: ValidateFunc,
     callback: (errors: ValidateError[]) => void,
   ) {
     let index = 0;
     const arrLength = arr.length;
   
     function next(errors: ValidateError[]) {
       if (errors && errors.length) {
         callback(errors);
         return;
       }
       const original = index;
       index = index + 1;
       if (original < arrLength) {
         func(arr[original], next);
       } else {
         callback([]);
       }
     }
   
     next([]);
   }
   ```

   1. `func(arr[original], next)`循环调用`next`因为闭包影响，`index`值会自动加1
   2. `func`是通过入口调用`asyncMap`传入，`callback`是`asyncMap`对应的`next`方法

   `asyncMap`的调用流程如下

   ![validator-asyncMap](/my-blog/source/async-validator/validator-asyncMap.png)

   看下`validateFunc`这个错误收集函数做了什么

6. **validateFunc**

   参数类型如下

   ```typescript
   type ValidateFunc = (
     data: RuleValuePackage,
     doIt: (errors: ValidateError[]) => void,
   ) => void;
   ```

   代码如下

   ```typescript
   (data, doIt) => {
       const rule = data.rule;
       let deep =
         (rule.type === 'object' || rule.type === 'array') &&
         (typeof rule.fields === 'object' ||
           typeof rule.defaultField === 'object');
       deep = deep && (rule.required || (!rule.required && data.value));
       rule.field = data.field;
   
       function addFullField(key: string, schema: RuleItem) {
         return {
           ...schema,
           fullField: `${rule.fullField}.${key}`,
           fullFields: rule.fullFields ? [...rule.fullFields, key] : [key],
         };
       }
   
       function cb(e: SyncErrorType | SyncErrorType[] = []) {
         let errorList = Array.isArray(e) ? e : [e];
         if (!options.suppressWarning && errorList.length) {
           Schema.warning('async-validator:', errorList);
         }
         if (errorList.length && rule.message !== undefined) {
           errorList = [].concat(rule.message);
         }
   
         // Fill error info
         let filledErrors = errorList.map(complementError(rule, source));
   
         if (options.first && filledErrors.length) {
           errorFields[rule.field] = 1;
           return doIt(filledErrors);
         }
         if (!deep) {
           doIt(filledErrors);
         } else {
           // if rule is required but the target object
           // does not exist fail at the rule level and don't
           // go deeper
           if (rule.required && !data.value) {
             if (rule.message !== undefined) {
               filledErrors = []
                 .concat(rule.message)
                 .map(complementError(rule, source));
             } else if (options.error) {
               filledErrors = [
                 options.error(
                   rule,
                   format(options.messages.required, rule.field),
                 ),
               ];
             }
             return doIt(filledErrors);
           }
   
           let fieldsSchema: Record<string, Rule> = {};
           if (rule.defaultField) {
             Object.keys(data.value).map(key => {
               fieldsSchema[key] = rule.defaultField;
             });
           }
           fieldsSchema = {
             ...fieldsSchema,
             ...data.rule.fields,
           };
   
           const paredFieldsSchema: Record<string, RuleItem[]> = {};
   
           Object.keys(fieldsSchema).forEach(field => {
             const fieldSchema = fieldsSchema[field];
             const fieldSchemaList = Array.isArray(fieldSchema)
               ? fieldSchema
               : [fieldSchema];
             paredFieldsSchema[field] = fieldSchemaList.map(
               addFullField.bind(null, field),
             );
           });
           const schema = new Schema(paredFieldsSchema);
           schema.messages(options.messages);
           if (data.rule.options) {
             data.rule.options.messages = options.messages;
             data.rule.options.error = options.error;
           }
           schema.validate(data.value, data.rule.options || options, errs => {
             const finalErrors = [];
             if (filledErrors && filledErrors.length) {
               finalErrors.push(...filledErrors);
             }
             if (errs && errs.length) {
               finalErrors.push(...errs);
             }
             doIt(finalErrors.length ? finalErrors : null);
           });
         }
       }
   
       let res: ValidateResult;
       if (rule.asyncValidator) {
         res = rule.asyncValidator(rule, data.value, cb, data.source, options);
       } else if (rule.validator) {
         try {
           res = rule.validator(rule, data.value, cb, data.source, options);
         } catch (error) {
           console.error?.(error);
           // rethrow to report error
           if (!options.suppressValidatorError) {
             setTimeout(() => {
               throw error;
             }, 0);
           }
           cb(error.message);
         }
         if (res === true) {
           cb();
         } else if (res === false) {
           cb(
             typeof rule.message === 'function'
               ? rule.message(rule.fullField || rule.field)
               : rule.message || `${rule.fullField || rule.field} fails`,
           );
         } else if (res instanceof Array) {
           cb(res);
         } else if (res instanceof Error) {
           cb(res.message);
         }
       }
       if (res && (res as Promise<void>).then) {
         (res as Promise<void>).then(
           () => cb(),
           e => cb(e),
         );
       }
   }
   ```

   1. 通过`type`判定是否需要进行递归（），前置条件如下

      > type 必须是 Object / Array
      >
      > fields 必须是Object /defaultField必须是Object

   2. 判定是同步校验还是异步校验，异步校验调用`asyncValidator`，同步校验调用`validator`同时兼容错误结果为string/function/array/ instanceof Error的情形

   3. 异步校验的结果是`Promise`，调用`then`接受返回结果，

   **cb**函数的功能

   获取错误信息时，统一交给`cb`函数进行处理

   1. `option`的`suppressWarning`为`false/undefined`并且存在错误信息，由`warning`函数统一处理

   2. 错误信息存在，且`rule.message`不为空，入栈错误列表数组

   3. 填充错误信息，让其格式为以下类型

      ```typescript
      {
          message,
          fieldValue,
          field
      }
      ```

   4. `option.first`为`true`，调用`doIt`

   5. `deep`是`false`，调用`doIt`，否则判定下`rule`中是否配置message error等等

   6. `defaultField`&`fields`的处理

      1. `deep`时才会处理`defaultField`和`fields`,`deep`的判定前面提到过，代码如下

         ```typescript
         let deep =
           (rule.type === 'object' || rule.type === 'array') &&
           (typeof rule.fields === 'object' ||
             typeof rule.defaultField === 'object');
         deep = deep && (rule.required || (!rule.required && data.value));
         ```

      2. 如果`defaultField`字段存在，数据源的`key`都会配置`defaultField`，代码如下

         ```typescript
         if (rule.defaultField) {
           Object.keys(data.value).map(key => {
             fieldsSchema[key] = rule.defaultField;
           });
         }
         ```

         所以我们在使用的时候，可以这样使用

         ```typescript
         const rules: Rules = {
             address: [{
                 type: 'object',
                 defaultField: {
                   required: true,
                   message: '这些是必填的'
                 }  
             }]
         }
         ```
      
         ```typescript
         const validateFields = async () => {
           try {
              const res = await validator.validate(
                   {
                     address: { province: '', city: '' }
                   },
                   options,
                   (errors, fields) => {
                     if (errors) {
                     }
                   }
              ); 
           } catch (error) {
             console.log(error.errors)
           }
         }
         validateFields()
         ```
      
         输出结果
      
         ```typescript
         [
         	{ message: '这些是必填的', fieldValue: '', field: 'address.province' },
           	{ message: '这些是必填的', fieldValue: '', field: 'address.city' }
         ]
         ```
      
      3. 合并`fieldsSchema`和`rule.fields`,注意的是同名属性，`rule.fields`会覆盖`fieldsSchema`
      
         我们测试下这个功能
      
         ```typescript
         const rules: Rules = {
             address: [{
                 type: 'object',
                 defaultField: {
                   required: true,
                   message: '这些是必填的'
                 },
                 fields: {
         		  province: {
                     type: 'number',
                       required: false
                       validator: (rule, value, callback) => {
                         if (value !== '211') {
                             return callback('值必须是211');
                         } else {
                             return callback();
                         }
                     }
                 }
             }]
         }
         ```
      
         ```typescript
         const validateFields = async () => {
           try {
              const res = await validator.validate(
                   {
                     address: { province: '', city: '' }
                   },
                   options,
                   (errors, fields) => {
                     if (errors) {
                     }
                   }
              ); 
           } catch (error) {
             console.log(error.errors)
           }
         }
         validateFields()
         ```
      
         输出结果
      
         ```typescript
         [
           { message: '值必须是211', fieldValue: '', field: 'address.province' },
           { message: '这些是必填的', fieldValue: '', field: 'address.city' }
         ]
         ```
      
         可以看出`fields`的配置覆盖了`defaultField`的配置，所以`province`非必填，校验的自定义`validator`
      
      4. 将`fieldsSchema`包装成`rule`数组,主要就是将`fullField`和`fullFields`放入对象中
      
      5. 实例化`Schema`，然后`validate`

7. **complete**

   ```typescript
   function complete(results: (ValidateError | ValidateError[])[]) {
   	let errors: ValidateError[] = [];
   	let fields: ValidateFieldsError = {};
   
   	function add(e: ValidateError | ValidateError[]) {
           if (Array.isArray(e)) {
             errors = errors.concat(...e);
           } else {
             errors.push(e);
           }
       }
   
     	for (let i = 0; i < results.length; i++) {
       	add(results[i]);
     	}
     	if (!errors.length) {
       	callback(null, source);
     	} else {
       	fields = convertFieldsError(errors);
           (callback as (
             errors: ValidateError[],
             fields: ValidateFieldsError,
           ) => void)(errors, fields);
       }
   }
   ```

   调用实例化实例时的`callback`，`errors`&`fields` 作为参数

## 6. 内置规则函数&校验类型函数

### 规则函数：用于服务校验函数

枚举校验、正则校验、范围校验、必填校验、类型校验、url校验、whiteSpace校验

必填校验 代码

```typescript
import { ExecuteRule } from '../interface';
import { format, isEmptyValue } from '../util';

const required: ExecuteRule = (rule, value, source, errors, options, type) => {
  if (
    rule.required &&
    (!source.hasOwnProperty(rule.field) ||
      isEmptyValue(value, type || rule.type))
  ) {
    // format 格式化错误 
    errors.push(format(options.messages.required, rule.fullField));
  }
};

export default required;
```

### 校验类型函数

any、array、boolean、data、enum、float、integer、method、number、object、pattern、regexp、required、string、type

比如 required校验
```typescript
import { ExecuteValidator } from '../interface';
import rules from '../rule';

const required: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  const type = Array.isArray(value) ? 'array' : typeof value;
  // 这里调用的就是规则函数required  
  rules.required(rule, value, source, errors, options, type);
  callback(errors);
};

export default required;
```

## 7. 自定义校验类型函数

```typescript
class Schema {
  // ========================= Static =========================
  static register = function register(type: string, validator) {
    if (typeof validator !== 'function') {
      throw new Error(
        'Cannot register a validator by type, validator is not a function',
      );
    }
    validators[type] = validator;
  }
}
```

暴露了类的静态方法`register`，用于自定义注册校验类型函数

## 8. TODO

下一篇会看下`ElementUI`是如何使用`async-validator`
