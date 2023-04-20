---
title: TS 模板字面量
date: 2023-03-09
categories: 
 - TypeScript
tags:
 - ts template
sidebar: auto
---

## 原文链接

[冴羽的typeScript系列](https://www.yuque.com/yayu/od8gmv/eqteva)
## 模板字面量类型

模板字面量类型以[字符串字面量类型](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)为基础，可以通过联合类型扩展成多个字符串。



它们跟 JavaScript 的模板字符串是相同的语法，但是只能用在类型操作中。当使用模板字面量类型时，它会替换模板中的变量，返回一个新的字符串字面量：

```typescript
type World = 'world'

type Greeting = `hello ${world}`
```

当模板字面量的多个变量是联合类型，结果会进行交叉相乘

```typescript
type AllLocaleIDs = `${EmailLocaleIDs | FooterLocaleIDs}_id`;
type Lang = "en" | "ja" | "pt";
 
type LocaleMessageIDs = `${Lang}_${AllLocaleIDs}`;
// type LocaleMessageIDs = "en_welcome_email_id" | "en_email_heading_id" | "en_footer_title_id" | "en_footer_sendoff_id" | "ja_welcome_email_id" | "ja_email_heading_id" | "ja_footer_title_id" | "ja_footer_sendoff_id" | "pt_welcome_email_id" | "pt_email_heading_id" | "pt_footer_title_id" | "pt_footer_sendoff_id"
```

## 类型中的字符串联合类型（String Unions in Types)

模板字面量最有用的地方在于你可以基于一个类型内部的信息，定义一个新的字符串

有这样一个函数` makeWatchedObject`， 它会给传入的对象添加了一个 on  方法。在 JavaScript 中，它的调用看起来是这样：`makeWatchedObject(baseObject)`，我们假设这个传入对象为：

```typescript
const passedObject = {
    firstName: 'Saoirse',
    lastName: 'Ronan',
    age: 26
}
```

这个 `on` 方法会被添加到这个传入对象上，该方法接受两个参数，`eventName` （ `string` 类型） 和 `callBack` （`function` 类型）：

```typescript
// 伪代码
const result = makeWatchedObject(baseObject)
result.on(eventName, callback)
```

希望得到的结果中`eventName`的名字是：`attributeInThePassedObject+ 'Changed'`，如：`passedObject`有一个属性`firstName`，对应产生的`eventName`为`firstNameChanged`，同理，`lastName`对应的是`lastNameChanged`，`age`对应的是`ageChanged`

当这个`callback`被调用的时候

- 应该被传入与 `attributeInThePassedObject` 相同类型的值。比如 `passedObject` 中， `firstName` 的值的类型为 `string` , 对应 `firstNameChanged` 事件的回调函数，则接受传入一个 `string`  类型的值。`age` 的值的类型为 `number`，对应 `ageChanged` 事件的回调函数，则接受传入一个 `number` 类型的值。
- 返回值类型为 `void` 类型。

`on()` 方法的签名最一开始是这样的：`on(eventName: string, callBack: (newValue: any) => void)`。 使用这样的签名，我们是不能实现上面所说的这些约束的，这个时候就可以使用模板字面量：

```typescript
const person = makeWatchedObject({
  firstName: "Saoirse",
  lastName: "Ronan",
  age: 26,
});
 
// makeWatchedObject has added `on` to the anonymous Object
person.on("firstNameChanged", (newValue) => {
  console.log(`firstName was changed to ${newValue}!`);
});
```

注意这个例子里，`on` 方法添加的事件名为 `"firstNameChanged"`， 而不仅仅是 `"firstName"`，而回调函数传入的值 `newValue` ，我们希望约束为 `string` 类型。我们先实现第一点。



在这个例子里，我们希望传入的事件名的类型，是对象属性名的联合，只是每个联合成员都还在最后拼接一个 `Changed` 字符，在 JavaScript 中，我们可以做这样一个计算：

```typescript
Object.keys(passedObject).map(x => ${x}Changed)
```

模板字面量提供了一个相似的字符串操作：

```typescript
type PropEventSource<Type> = {
    on(eventName: `${string & keyof Type}Changed`, callback: (newValue: any) => void): void;
};
 
/// Create a "watched object" with an 'on' method
/// so that you can watch for changes to properties.

declare function makeWatchedObject<Type>(obj: Type): Type & PropEventSource<Type>;
```

注意，我们在这里例子中，模板字面量里我们写的是 `string & keyof Type`，我们可不可以只写成 `keyof Type` 呢？如果我们这样写，会报错：

```typescript
type PropEventSource<Type> = {
    on(eventName: `${keyof Type}Changed`, callback: (newValue: any) => void): void;
};

// Type 'keyof Type' is not assignable to type 'string | number | bigint | boolean | null | undefined'.
// Type 'string | number | symbol' is not assignable to type 'string | number | bigint | boolean | null | undefined'.
// ...
```

从报错信息中，我们也可以看出报错原因，在 [《TypeScript 系列之 Keyof 操作符》](https://github.com/mqyqingfeng/Blog/issues/223)里，我们知道 `keyof` 操作符会返回 `string | number | symbol` 类型，但是模板字面量的变量要求的类型却是 `string | number | bigint | boolean | null | undefined`，比较一下，多了一个 symbol 类型，所以其实我们也可以这样写：

```typescript
type PropEventSource<Type> = {
    on(eventName: `${Exclude<keyof Type, symbol>}Changed`, callback: (newValue: any) => void): void;
};
```

再或者这样写：

```typescript
type PropEventSource<Type> = {
     on(eventName: `${Extract<keyof Type, string>}Changed`, callback: (newValue: any) => void): void;
};
```

使用这种方式，在我们使用错误的事件名时，TypeScript 会给出报错：

```typescript
const person = makeWatchedObject({
  firstName: "Saoirse",
  lastName: "Ronan",
  age: 26
});
 
person.on("firstNameChanged", () => {});
 
// Prevent easy human error (using the key instead of the event name)
person.on("firstName", () => {});
// Argument of type '"firstName"' is not assignable to parameter of type '"firstNameChanged" | "lastNameChanged" | "ageChanged"'.
 
// It's typo-resistant
person.on("frstNameChanged", () => {});
// Argument of type '"frstNameChanged"' is not assignable to parameter of type '"firstNameChanged" | "lastNameChanged" | "ageChanged"'.
```

## 模板字面量的推断

现在我们来实现第二点，回调函数传入的值的类型与对应的属性值的类型相同。我们现在只是简单的对 `callBack` 的参数使用 `any` 类型。实现这个约束的关键在于借助泛型函数：



1. 捕获泛型函数第一个参数的字面量，生成一个字面量类型
2. 该字面量类型可以被对象属性构成的联合约束
3. 对象属性的类型可以通过索引访问获取
4. 应用此类型，确保回调函数的参数类型与对象属性的类型是同一个类型

```typescript
type PropEventSource<Type> = {
    on<Key extends string & keyof Type>
        (eventName: `${Key}Changed`, callback: (newValue: Type[Key]) => void ): void;
};

declare function makeWatchedObject<Type>(obj: Type): Type & PropEventSource<Type>

const person = makeWatchedObject({
    firstName: 'Saorise',
    lastName: 'Ronon',
    age: 26
})

person.on("firstNameChanged", newName => {                             
														  // (parameter) newName: string
    console.log(`new name is ${newName.toUpperCase()}`);
});
 
person.on("ageChanged", newAge => {
                        // (parameter) newAge: number
    if (newAge < 0) {
        console.warn("warning! negative age");
    }
})
```

这里我们把 `on` 改成了一个泛型函数。



当一个用户调用的时候传入 `"firstNameChanged"`，TypeScript 会尝试着推断 `Key` 正确的类型。它会匹配 `key` 和 `"Changed"` 前的字符串 ，然后推断出字符串 `"firstName"` ，然后再获取原始对象的 `firstName` 属性的类型，在这个例子中，就是 `string` 类型。
