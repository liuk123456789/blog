---
title: 策略模式
date: 2023-02-01
categories: 
 - Design Partten
tags:
 - strategy
sidebar: auto
---
## 什么是设计模式 

> 设想有一个电子爱好者，虽然他没有经过正规的培训，但是却日积月累地设计并制造出了许多有用的电子设备：业余无线电、盖革计数器、报警器等。有一天这个爱好者决定重新回到学校去攻读电子学学位，来让自己的才能得到正式的认可。随着课程的展开，这个爱好者突然发现课程内容都似曾相识。似曾相识的不是术语或表述的方式，而是背后的概念。这个爱好者不断学到一些名称和原理，虽然这些名称和原理原来他并不知道，但事实上他多年以来一直都在使用。整个过程只不过是一个接一个的顿悟。
> *[设计模式沉思录 ，John Vlissides， 第一章 1.2节](https://link.zhihu.com/?target=https%3A//yq.aliyun.com/articles/93401%3Fspm%3Da2c4e.11153940.blogcont93399.10.76995b89Oy4aYg)*


## 什么是策略模式

策略模式是一种简单却常用的设计模式，它的应用场景非常广泛。我们先了解下策略模式的概念，再通过代码示例来更清晰的认识它。

策略模式由两部分构成：一部分是封装不同策略的策略组，另一部分是 Context。通过组合和委托来让 Context 拥有执行策略的能力，从而实现可复用、可扩展和可维护，并且避免大量复制粘贴的工作。

## 策略模式的应用场景

> 下面的案例来自曾探的`JavaScript设计模式与开发实践`

### 1. 使用策略模式计算奖金

很多公司的年终奖是根据员工的工资基数和年底绩效情况来发放的。例如，绩效为 S 的人年

终奖有 4 倍工资，绩效为 A 的人年终奖有 3 倍工资，而绩效为 B 的人年终奖是 2 倍工资。假设财

务部要求我们提供一段代码，来方便他们计算员工的年终奖。

```javascript
const strategies = {
    "S": function(salary) {
        return salary * 4
    },
    "A": function(salary) {
        return salary * 3
    },
    "B": function(salary) {
        return salary * 2
    }
}

const calculateBouns = function(level, salary) {
    return strategies[level](salary)
}

console.log(calculateBouns('S', 20000)) // 输出：80000
console.log(calculateBouns('A', 10000)) // 输出：30000
```

### 2. 表单校验

1. 实现表单的第一个版本

   ```html
   <html> 
    <body> 
        <form action="http:// xxx.com/register" id="registerForm" method="post"> 
            请输入用户名：<input type="text" name="userName"/ >
            请输入密码：<input type="text" name="password"/ >
            请输入手机号码：<input type="text" name="phoneNumber"/ >
            <button>提交</button>
        </form>
        <script>
            var registerForm = document.getElementById( 'registerForm' );
            registerForm.onsubmit = function(){
                if ( registerForm.userName.value === '' ){
                alert ( '用户名不能为空' ); 
                return false; 
                }
                if ( registerForm.password.value.length < 6 ){ 
                    alert ( '密码长度不能少于 6 位' ); 
                    return false; 
                } 
                if ( !/(^1[3|5|8][0-9]{9}$)/.test( registerForm.phoneNumber.value ) ){ 
                    alert ( '手机号码格式不正确' ); 
                    return false; 
                } 
            } 
        </script> 
    </body> 
   </html>
   ```

   缺点：

   1. registerForm.onsubmit函数比较庞大，包含了很多if-else语句，这些语句需要覆盖所有的校验规则
   2. registerForm.onsubmit函数缺乏弹性，增加了校验规则，
   3. 或者想把密码的长度校验从 6 改成 8，我们都必须深入 registerForm.onsubmit 函数的内部实现，这是违反开放—封闭原则的。
   4. 算法的复用性差，程序中增加另外一个表单，这个表单也有类似校验，那么校验逻辑漫天遍野

2. 策略模式重构表单校验

   ```javascript
   const strategies = {
       isNonEmpty: function(value, errorMsg) {
          if(value === '') {
              return errorMsg
          }
       },
       minLength: function(value,length,errorMsg) {
           if(value.length < length) {
               return errorMsg
           }
       },
       isMobile: function( value, errorMsg ){ // 手机号码格式
            if ( !/(^1[3|5|8][0-9]{9}$)/.test( value ) ){ 
                return errorMsg;
            } 
       }
   }
   ```

   接下来我们准备实现 Validator 类。Validator 类在这里作为 Context，负责接收用户的请求

   并委托给 strategy 对象。在给出 Validator 类的代码之前，有必要提前了解用户是如何向 Validator

   类发送请求的，这有助于我们知道如何去编写 Validator 类的代码。代码如下：

   ```javascript
   const validataFunc = function() {
       const validator = new Validator();
       
    	validator.add( registerForm.userName, 'isNonEmpty', '用户名不能为空' ); 
    	validator.add( registerForm.password, 'minLength:6', '密码长度不能少于 6 位' ); 
    	validator.add( registerForm.phoneNumber, 'isMobile', '手机号码格式不正确' );
       
       const errorMsg = validator.start();
       return errorMsg
   }
   
   const registerForm = document.getElementById('registerForm')
   
   registerForm.onsubmit = function() {
       const errorMsg = validataFunc()
       if(errorMsg) {
           alert(errorMsg)
           return false
       }
   }
   ```

   我们先创建了一个 validator 对象，然后通过 validator.add 方法，

   往 validator 对象中添加一些校验规则。validator.add 方法接受 3 个参数，以下面这句代码说明：

   ```javascript
   validator.add( registerForm.password, 'minLength:6', '密码长度不能少于 6 位' );
   ```

   - registerForm.password 为参与校验的input 输入框

   -  'minLength:6'是一个以冒号隔开的字符串。冒号前面的minLength代表客户挑选的strategy

     对象，冒号后面的数字 6 表示在校验过程中所必需的一些参数。'minLength:6'的意思就是

     校验 registerForm.password 这个文本输入框的 value 最小长度为 6。如果这个字符串中不

     包含冒号，说明校验过程中不需要额外的参数信息，比如'isNonEmpty'。

   - 第三个参数校验未通过返回的错误信息

   规则添加完成一系列校验规则后，调用validator.start()方法启动校验

   **完成Validator类**

   ```javascript
   const Validator = function() {
       this.cache = []; //保存校验规则
   }
   
   Validator.prototype.add = function(field,rule,errorMsg) {
       const ary = rule.split(':')
       this.cache.push(function() {
           const strategy = ary.shift()
           ary.unshift(field.value)
           ary.push(errorMsg)
           return strategies[strategy].apply(field, ary)
       })
   }
   
   Validator.prototype.start = function() {
       for(let i = 0, validatorFunc; validatorFunc = this.cache[i++]) {
           const msg = validatorFunc()
           if(msg) {
               return msg
           }
       }
   }
   ```

   **给输入框添加多种校验规则**

   ```javascript
   /**************策略对象**************/
   const strategies = {
       isNonEmpty: function(value, errorMsg) {
          if(value === '') {
              return errorMsg
          }
       },
       minLength: function(value,length,errorMsg) {
           if(value.length < length) {
               return errorMsg
           }
       },
       isMobile: function( value, errorMsg ){ // 手机号码格式
            if ( !/(^1[3|5|8][0-9]{9}$)/.test( value ) ){ 
                return errorMsg;
            } 
       }
   }
   
   /**************Validator类**************/
   const Validator = function() {
       this.cache = []
   }
   
   Validator.prototype.add = function(field, rules) {
       const self = this
       
       for(let i = 0, rule; rule = rules[i++]) {
           (
           	function(rule) {
                   const strategyAry = rule.strategy.split( ':' );
                   const errorMsg = rule.errorMsg; 
                   
                   self.cache.push(function() {
                       const strategy = strategyAry.shift()
                       strategyAry.unshift(field.value)
                       strategyAry.push(errorMsg)
                       return strategies[strategy].apply(field, strategyAry)
                   })
               }
           )(rule)
       }
   }
   
   Validator.prototype.start = function() {
       for(let i = 0, validatorFunc; validatorFunc = this.cache[i++]) {
           const msg = validatorFunc()
           if(msg) {
               return msg
           }
       }
   }
   
   /*****************客户端代码****************/
   const registerForm = document.getElementById('registerForm')
   
   const validataFunc = function() {
       const validator = new Validator()
       
       validator.add(registerForm.userName, [{
           strategy: 'isNonEmpty',
           errorMsg: '用户名不能为空'
       }, {
           strategy: 'minLength:6',
           errorMsg: '密码长度不能小于6位'
       }]);
       
       validator.add( registerForm.password, [{
           strategy: 'minLength:6', 
           errorMsg: '密码长度不能小于6位' 
       }]);
       
       validator.add( registerForm.phoneNumber, [{
           strategy: 'isMobile', 
           errorMsg: '手机号码格式不正确'
       }]);
       
   	return validator.start()
   }
   
   registerForm.onsubmit = function() {
       const errorMsg = validataFunc()
       if(errorMsg) {
           alert(errorMsg)
           return false
       }
   }
   ```

### 3. 实际开发中策略模式的应用

1.  elementui 表单校验

   1. 新建validate.js，里面对应了校验的规则

      ```javascript
      // 手机号
      export const mobileRule = (val) => {
        const reg = /^(?:(?:\+|00)86)?1[3-9]\d{9}$/
        return reg.test(val)
      }
      
      // 小数位数校验
      export const decimalNumRule = (val, decimal) => {
        const reg = new RegExp(`^(([1-9]{1}\\d*)|(0{1}))(\\.\\d{1,${decimal}})?$`)
        return reg.test(val)
      }
      
      // 票面金额
      export const billAmountRule = (val) => {
        const reg = /^([1-9][0-9]{0,5}|(([1-9][0-9]{0,5}|0)\.\d{1,6}))$/
        return reg.test(val)
      }
      
      // 密码规则
      export const passwordRule = (val) => {
        const reg = /^[A-Za-z0-9]{6,}$/
        return reg.test(val)
      }
      
      // 只能是中文/汉字
      export const cnRule = (val) => {
        const reg = /^[\u4e00-\u9fa5]+$/
        return reg.test(val)
      }
      
      // 邮箱校验
      export const emailRule = (val) => {
          const reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
          return reg.test(str)	
      }
      ```

   2. 自定义校验函数

      ```javascript
      import * as Validates from './validate.js'
      
      export const formValidateGen = (key, msg) => (rule,value, cb) => {
          if(Validates[key](value)) {
              cb()
          } else {
              cb(new Error(msg))
          }
      }
      ```

   3. 使用

      ```vue
      <script>
          import * as Utils from '@/utils'
          
          export default {
              name: 'SubmitForm',
              data() {
                  return {
                      rules: {
                          userName: [{
                              validator: Utils.formValidateGen('cnRule', '请输入中文汉字'),
                              trigger: 'blur'
                          }],
                          mobile: [{
                              validator: Utils.formValidateGen('mobileRule', '手机号输入不合法'),
                              trigger: 'blur'
                          }],
                          password: [{
                              validator: Utils.formValidateGen('passwordRule', '密码输入不符合'),
                              trigger: 'blur'
                          }]
                      }
                  }
              }
          }
      </script>
      ```

      

2. 时间显示

   > 规则如下：
   >
   > 小于1分钟，显示刚刚
   >
   > 大于1分钟，小于1小时，显示多少分钟前
   >
   > 大于1小时，小于24小时，显示多少小时前
   >
   > 大于24小时，直接显示日期（YYYY-MM-DD HH:mm)
   >
   > 前置规则：
   >
   > ​	如果时间小于当天时间的00：00：00，那么直接显示日期

   1. 定义规则

      ```javascript
      const ONE_MINUTE_STAMP = 60 * 1000
      const ONE_HOUR_STAMP = 60 * 60 * 1000
      const ONE_DAY_STAMP = 24 * 60 * 60 * 1000
      
      export const dateFormat = (date, rule = 'YYYY-MM-DD') {
        if (!date) {
          return date
        }
        return dayjs(date).format(rule)
      }
      
      // 策略规则
      const timeStrategies = [{
          rule: (diffStamp) => diffStamp < ONE_MINUTE_STAMP,
          formatTimeCN: () => '刚刚'
      }, {
          rule: (diffStamp) => diffStamp < ONE_HOUR_STAMP,
          formatTimeCN: (diffStamp) => `${parseInt(diffStamp / ONE_MINUTE_STAMP)}分钟前`
      }, {
          rule: (diffStamp) => diffStamp < ONE_DAY_STAMP,
          formatTimeCN: (diffStamp) => `${parseInt(diffStamp / ONE_HOUR_STAMP)}小时前`
      }, {
          rule: (diffStamp) => diffStamp >= ONE_DAY_STAMP,
          formatTimeCN: (diffStamp) => dateFormat(diffStamp + +dayjs(), 'YYYY-MM-DD HH:mm:ss')
      }]
      
      export const genTimeCalcu = (targetTime) => {
          const targetStamp = +dayjs(targetTime)
          const diffStamp = +dayjs() - targetStamp
      	
            const timeStragieFinder = timeLineStragie.find(({ checker }) => checker(diffStamp))
        if (!timeStragieFinder) return dateFormat(value, rule)
        return timeStragieFinder.formatTimeCN(diffStamp)
      }
      ```

   2. 考虑前置规则

      ```javascript
      export const genTimeCalcu = (targetTime) => {
          const targetStamp = +dayjs(targetTime)
          // 获取当天时间的00:00:00 的时间戳
          const startDateStamp = +dayjs().startOf('date')
          // 目标时间和当前事件戳对比
          const isToday = targetStamp >= startDateStamp
          
          if(!isToday) return dateFormat(targetTime, rule)
          
          const diffStamp = +dayjs() - targetStamp
      
          const timeStragieFinder = timeLineStragie.find(({ checker }) => checker(diffStamp))
            if (!timeStragieFinder) return dateFormat(value, rule)
            return timeStragieFinder.formatTimeCN(diffStamp)
          }
      ```

   3.  使用

      ```javascript
      import { genTimeCalcu } from '@/utils/util'
      
      genTimeCalcu(time)
      ```
