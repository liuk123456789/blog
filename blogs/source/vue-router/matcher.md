---
title: vue-router 第二篇
date: 2023-05-18
categories: 
 - 源码解读
tags:
 - vue router
sidebar: auto
---

## 1. createRouterMatcher

功能说明：定义的路由表每个路由都会被解析对应的`matcher`，路由的增删改查都是通过`matcher`完成，而`matcher`就是通过`createRouterMatcher`创建而来

**参数说明**

- routes：Readonly<RouteRecordRaw[]> 初始路由表

- globalOptions: PathParserOptions 

  ```typescript
  /**
   * @internal
   */
  export interface _PathParserOptions {
    /**
     * Makes the RegExp case-sensitive.
     *
     * @defaultValue `false`
     */
    sensitive?: boolean
  
    /**
     * Whether to disallow a trailing slash or not.
     *
     * @defaultValue `false`
     */
    strict?: boolean
  
    /**
     * Should the RegExp match from the beginning by prepending a `^` to it.
     * @internal
     *
     * @defaultValue `true`
     */
    start?: boolean
  
    /**
     * Should the RegExp match until the end by appending a `$` to it.
     *
     * @defaultValue `true`
     */
    end?: boolean
  }
  
  export type PathParserOptions = Pick<
    _PathParserOptions,
    'end' | 'sensitive' | 'strict'
  >
  ```

**返回说明**

```typescript
return {
    addRoute, // 新增路由
    resolve, // 解析路由对象
    removeRoute, // 删除路由
    getRoutes, // 获取路由
    getRecordMatcher // 根据路由名获取对应matcher。
}
```

## 2. addRoute

参数：

- record:  RouteRecordRaw 新增的路由
- parent?: RouteRecordMatcher 父matcher
- originalRecord?: RouteRecordMatcher 原始matcher

代码如下

```typescript
  function addRoute(
    record: RouteRecordRaw,
    parent?: RouteRecordMatcher,
    originalRecord?: RouteRecordMatcher
  ) {
    // used later on to remove by name
    const isRootAdd = !originalRecord
    // 标准化路由对象
    const mainNormalizedRecord = normalizeRouteRecord(record)
    if (__DEV__) {
      checkChildMissingNameWithEmptyPath(mainNormalizedRecord, parent)
    }
    // 路由对象是否是另外路由对象的别名
    mainNormalizedRecord.aliasOf = originalRecord && originalRecord.record
    // 合并配置选项
    const options: PathParserOptions = mergeOptions(globalOptions, record)
    // 初始化一个标准化路由对象用于记录配置了alias的路由对象
    const normalizedRecords: (typeof mainNormalizedRecord)[] = [
      mainNormalizedRecord,
    ]
    if ('alias' in record) {
      const aliases =
        typeof record.alias === 'string' ? [record.alias] : record.alias!
      // 遍历别名数组，并根据别名创建记录存储到normalizedRecords中
      for (const alias of aliases) {
        normalizedRecords.push(
          assign({}, mainNormalizedRecord, {
            // this allows us to hold a copy of the `components` option
            // so that async components cache is hold on the original record
            components: originalRecord
              ? originalRecord.record.components
              : mainNormalizedRecord.components,
            path: alias,
            // 如果有原始记录，aliasOf为原始记录，如果没有原始记录就是它自己
            aliasOf: originalRecord
              ? originalRecord.record
              : mainNormalizedRecord,
          }) as typeof mainNormalizedRecord
        )
      }
    }

    let matcher: RouteRecordMatcher
    let originalMatcher: RouteRecordMatcher | undefined
	// 遍历标准化路由对象
    for (const normalizedRecord of normalizedRecords) {
      const { path } = normalizedRecord
	  // // 如果path不是以/开头，那么说明它不是根路由，需要拼接为完整的path
      if (parent && path[0] !== '/') {
        const parentPath = parent.record.path
        const connectingSlash =
          parentPath[parentPath.length - 1] === '/' ? '' : '/'
        // 完整路径
        // 根路径的无需拼接/
        // 非根路径需要拼接/
        normalizedRecord.path =
          parent.record.path + (path && connectingSlash + path)
      }
	  // 提示*应使用正则表示式形式
      if (__DEV__ && normalizedRecord.path === '*') {
        throw new Error(
          'Catch all routes ("*") must now be defined using a param with a custom regexp.\n' +
            'See more at https://next.router.vuejs.org/guide/migration/#removed-star-or-catch-all-routes.'
        )
      }

      // 创建一个路由记录匹配器
      matcher = createRouteRecordMatcher(normalizedRecord, parent, options)

      if (__DEV__ && parent && path[0] === '/')
        checkMissingParamsInAbsolutePath(matcher, parent)

      // if we are an alias we must tell the original record that we exist,
      // so we can be removed
      if (originalRecord) {
        originalRecord.alias.push(matcher)
        if (__DEV__) {
          checkSameParams(originalRecord, matcher)
        }
      } else {
        // otherwise, the first record is the original and others are aliases
        originalMatcher = originalMatcher || matcher
        if (originalMatcher !== matcher) originalMatcher.alias.push(matcher)

        // remove the route if named and only for the top record (avoid in nested calls)
        // this works because the original record is the first one
        if (isRootAdd && record.name && !isAliasRecord(matcher))
          removeRoute(record.name)
      }

      if (mainNormalizedRecord.children) {
        const children = mainNormalizedRecord.children
        for (let i = 0; i < children.length; i++) {
          addRoute(
            children[i],
            matcher,
            originalRecord && originalRecord.children[i]
          )
        }
      }

      // if there was no original record, then the first one was not an alias and all
      // other aliases (if any) need to reference this record when adding children
      originalRecord = originalRecord || matcher

      // TODO: add normalized records for more flexibility
      // if (parent && isAliasRecord(originalRecord)) {
      //   parent.children.push(originalRecord)
      // }

      // Avoid adding a record that doesn't display anything. This allows passing through records without a component to
      // not be reached and pass through the catch all route
      if (
        (matcher.record.components &&
          Object.keys(matcher.record.components).length) ||
        matcher.record.name ||
        matcher.record.redirect
      ) {
        insertMatcher(matcher)
      }
    }

    return originalMatcher
      ? () => {
          // since other matchers are aliases, they should be removed by the original matcher
          removeRoute(originalMatcher!)
        }
      : noop
  }

```

上述代码大部分都进行了注释标记功能，需要额外说明的是以下这些

**createRouteRecordMatcher**

用于创建路由记录的`matcher`，这个`matcher`到底是什么？然后具有什么作用，可以从`createRouteRecordMatcher`代码中进行验证，`createRouteRecordMatcher`的核心是`tokenizePath`，`tokensToParser`

1. `tokenizePath`

   ```typescript
   export function tokenizePath(path: string): Array<Token[]> {
     // path 为空 返回[[]] 
     if (!path) return [[]]
     // 根路径 返回[[{ type: 0 value: '' }]]
     if (path === '/') return [[ROOT_TOKEN]]
     // path 格式不以 '/'开头
     if (!path.startsWith('/')) {
       throw new Error(
         __DEV__
           ? `Route paths should start with a "/": "${path}" should be "/${path}".`
           : `Invalid path "${path}"`
       )
     }
   
     // if (tokenCache.has(path)) return tokenCache.get(path)!
   
     function crash(message: string) {
       throw new Error(`ERR (${state})/"${buffer}": ${message}`)
     }
     // token状态	
     let state: TokenizerState = TokenizerState.Static
     // 前一个状态
     let previousState: TokenizerState = state
     const tokens: Array<Token[]> = []
     // segment片段，最终存放入tokens中
     let segment!: Token[]
   
     // 重置segment片段  
     function finalizeSegment() {
       if (segment) tokens.push(segment)
       segment = []
     }
   
     // index on the path
     let i = 0
     // char at index
     let char: string
     // buffer of the value read
     let buffer: string = ''
     // custom regexp for a param
     let customRe: string = ''
   
     function consumeBuffer() {
       if (!buffer) return
   
       if (state === TokenizerState.Static) {
         segment.push({
           type: TokenType.Static,
           value: buffer,
         })
       } else if (
         state === TokenizerState.Param ||
         state === TokenizerState.ParamRegExp ||
         state === TokenizerState.ParamRegExpEnd
       ) {
         if (segment.length > 1 && (char === '*' || char === '+'))
           crash(
             `A repeatable param (${buffer}) must be alone in its segment. eg: '/:ids+.`
           )
         segment.push({
           type: TokenType.Param,
           value: buffer,
           regexp: customRe,
           repeatable: char === '*' || char === '+',
           optional: char === '*' || char === '?',
         })
       } else {
         crash('Invalid state to consume buffer')
       }
       buffer = ''
     }
   
     function addCharToBuffer() {
       buffer += char
     }
     // path的几种格式
     // /test 常规路由 /test/:id 动添路由
     // 404等 /:path(.*)*
     // 正则路由 /:orderId(\\d+)  代表匹配orderId为数字的路由
     // 可重复路由 /:chapters+
     while (i < path.length) {
       char = path[i++]
   	
       if (char === '\\' && state !== TokenizerState.ParamRegExp) {
         previousState = state
         state = TokenizerState.EscapeNext
         continue
       }
       switch (state) {
         case TokenizerState.Static:
           if (char === '/') {
             if (buffer) {
               consumeBuffer()
             }
             finalizeSegment()
           } else if (char === ':') {
             consumeBuffer()
             state = TokenizerState.Param
           } else {
             addCharToBuffer()
           }
           break
   
         case TokenizerState.EscapeNext:
           addCharToBuffer()
           state = previousState
           break
   
         case TokenizerState.Param:
           if (char === '(') {
             state = TokenizerState.ParamRegExp
           } else if (VALID_PARAM_RE.test(char)) {
             addCharToBuffer()
           } else {
             consumeBuffer()
             state = TokenizerState.Static
             // go back one character if we were not modifying
             if (char !== '*' && char !== '?' && char !== '+') i--
           }
           break
   
         case TokenizerState.ParamRegExp:
           // TODO: is it worth handling nested regexp? like :p(?:prefix_([^/]+)_suffix)
           // it already works by escaping the closing )
           // https://paths.esm.dev/?p=AAMeJbiAwQEcDKbAoAAkP60PG2R6QAvgNaA6AFACM2ABuQBB#
           // is this really something people need since you can also write
           // /prefix_:p()_suffix
           if (char === ')') {
             // handle the escaped )
             if (customRe[customRe.length - 1] == '\\')
               customRe = customRe.slice(0, -1) + char
             else state = TokenizerState.ParamRegExpEnd
           } else {
             customRe += char
           }
           break
   
         case TokenizerState.ParamRegExpEnd:
           // same as finalizing a param
           consumeBuffer()
           state = TokenizerState.Static
           // go back one character if we were not modifying
           if (char !== '*' && char !== '?' && char !== '+') i--
           customRe = ''
           break
   
         default:
           crash('Unknown state')
           break
       }
     }
   
     if (state === TokenizerState.ParamRegExp)
       crash(`Unfinished custom RegExp for param "${buffer}"`)
   
     consumeBuffer()
     finalizeSegment()
   
     // tokenCache.set(path, tokens)
   
     return tokens
   }
   ```

   `switch case`我们使用`path`为`/:orderId(\\d+)`进行梳理

   1. `i=0 char='/'`，进入`Static`分支，`buffer=null` `segment=[]  i=1`
   2. `i=1 char=':'`，进入`Static`分支，执行`consumeBuffer`，因为`buffer=''`，所以`consumeBuffer`中什么都没做，最后`state=TokenizerState.Param`，该轮结束后发生变化的是`state=TokenizerState.Param; i=2; char=':'`
   3. `i=2 char='o'`，进入`Param`分支，此时` buffer='';`，执行`addCharToBuffer`，该轮结束后发生变化的是`buffer='o'; i=3; char='o';`
   4. 重复步骤3，直到`i=8 char=d`，进入`Param`分支，结束后，`buffer=orderId;i=9;char='d'`
   5. `i=9,char='('`，进入`Param`分支，此时`state=TokenizerState.ParamRegExp;char='(';i=10`
   6. `i=10,char='\\'`，进入`ParamRegExp`，此时`char='\\';buffer='orderId'`，执行`customRe+=char`，结束后，`i=11;char='\\';customRe='\\'`
   7. 重复步骤6，直到`i=12`，最终变化`i=13;char='+';customRe='\\d+'`
   8. `i=13,char=')'`，进入`ParamRegExp`，此时`state=TokenizerState.ParamRegExpEnd;char=')';i=14`
   9. `i=14`，
   10. 结束遍历，执行`consumeBuffer`，向`segment`添加`{type: TokenType.Static, value: 'orderId'}`一条记录并将`buffer`置为空字符串。然后执行`finalizeSegment`，将`segment`添加到`tokens`中，并将`segment`置为空数组

   最终的`tokens`

   ```typescript
   [
     [
       {
         type: 1,
         value: 'orderId',
         regexp: '\\d+',
         repeatable: false,
         optional: false
       }
     ]
   ]
   ```

   很明显，这段代码就是状态模式，通过`state`状态变化执行对应的逻辑

2. `tokensToParser`

   逻辑就是通过传入的`segments`，获取路由记录的`score`

   ```typescript
   /**
    * Creates a path parser from an array of Segments (a segment is an array of Tokens)
    *
    * @param segments - array of segments returned by tokenizePath
    * @param extraOptions - optional options for the regexp
    * @returns a PathParser
    */
   export function tokensToParser(
     segments: Array<Token[]>,
     extraOptions?: _PathParserOptions
   ): PathParser {
     // BASE_PATH_PARSE_OPTIONS = {
       	sentitive: false // sensitive RegExp 区分大小写
       	strict: false // strict 禁止尾部斜线
       	start: true //  匹配开头
       	end: true // RegExp 是否应该在末尾加一个 $ 以匹配到末尾
     // }
     const options = assign({}, BASE_PATH_PARSER_OPTIONS, extraOptions)
   
     const score: Array<number[]> = []
     
     // 配置了start:true 那么pattern:'^'
     let pattern = options.start ? '^' : ''
   
     const keys: PathParserParamKey[] = []
   
     for (const segment of segments) {
       // 根路径 [PathScore.Root]
       const segmentScores: number[] = segment.length ? [] : [PathScore.Root]
   
       // 允许尾部斜线
       if (options.strict && !segment.length) pattern += '/'
       for (let tokenIndex = 0; tokenIndex < segment.length; tokenIndex++) {
         const token = segment[tokenIndex]
         // resets the score if we are inside a sub-segment /:a-other-:b
         let subSegmentScore: number =
           // 基础分数 + 是否区分大小写？BounsCaseSensitive : 0 
           PathScore.Segment +
           (options.sensitive ? PathScore.BonusCaseSensitive : 0)
   
         if (token.type === TokenType.Static) {
           // prepend the slash if we are starting a new segment
           if (!tokenIndex) pattern += '/'
           pattern += token.value.replace(REGEX_CHARS_RE, '\\$&')
           // 静态路由的分数 
           subSegmentScore += PathScore.Static
         } else if (token.type === TokenType.Param) { // 动态路由
           const { value, repeatable, optional, regexp } = token
           keys.push({
             name: value,
             repeatable,
             optional,
           })
           const re = regexp ? regexp : BASE_PARAM_PATTERN
           // the user provided a custom regexp /:id(\\d+)
           if (re !== BASE_PARAM_PATTERN) {
             subSegmentScore += PathScore.BonusCustomRegExp
             // 校验路由中的正则是否合法
             try {
               new RegExp(`(${re})`)
             } catch (err) {
               throw new Error(
                 `Invalid custom RegExp for param "${value}" (${re}): ` +
                   (err as Error).message
               )
             }
           }
   
           // 是否可以重复 /:id(\\d+)* 或者 /:id(\\d+)+ 这种格式的路由
           let subPattern = repeatable ? `((?:${re})(?:/(?:${re}))*)` : `(${re})`
   
           // prepend the slash if we are starting a new segment
           if (!tokenIndex)
             subPattern =
               // avoid an optional / if there are more segments e.g. /:p?-static
               // or /:p?-:p2
               optional && segment.length < 2
                 ? `(?:/${subPattern})`
                 : '/' + subPattern
           if (optional) subPattern += '?'
   
           pattern += subPattern
   		
           subSegmentScore += PathScore.Dynamic
           if (optional) subSegmentScore += PathScore.BonusOptional
           if (repeatable) subSegmentScore += PathScore.BonusRepeatable
           if (re === '.*') subSegmentScore += PathScore.BonusWildcard
         }
   
         segmentScores.push(subSegmentScore)
       }
   
       // an empty array like /home/ -> [[{home}], []]
       // if (!segment.length) pattern += '/'
   
       score.push(segmentScores)
     }
   
     // only apply the strict bonus to the last score
     if (options.strict && options.end) {
       const i = score.length - 1
       score[i][score[i].length - 1] += PathScore.BonusStrict
     }
   
     // TODO: dev only warn double trailing slash
     if (!options.strict) pattern += '/?'
   
     if (options.end) pattern += '$'
     // allow paths like /dynamic to only match dynamic or dynamic/... but not dynamic_something_else
     else if (options.strict) pattern += '(?:/|$)'
   
     const re = new RegExp(pattern, options.sensitive ? '' : 'i')
   
     function parse(path: string): PathParams | null {
       const match = path.match(re)
       const params: PathParams = {}
   
       if (!match) return null
   
       for (let i = 1; i < match.length; i++) {
         const value: string = match[i] || ''
         const key = keys[i - 1]
         params[key.name] = value && key.repeatable ? value.split('/') : value
       }
   
       return params
     }
   
     function stringify(params: PathParams): string {
       let path = ''
       // for optional parameters to allow to be empty
       let avoidDuplicatedSlash: boolean = false
       for (const segment of segments) {
         if (!avoidDuplicatedSlash || !path.endsWith('/')) path += '/'
         avoidDuplicatedSlash = false
   
         for (const token of segment) {
           if (token.type === TokenType.Static) {
             path += token.value
           } else if (token.type === TokenType.Param) {
             const { value, repeatable, optional } = token
             const param: string | readonly string[] =
               value in params ? params[value] : ''
   
             if (isArray(param) && !repeatable) {
               throw new Error(
                 `Provided param "${value}" is an array but it is not repeatable (* or + modifiers)`
               )
             }
   
             const text: string = isArray(param)
               ? (param as string[]).join('/')
               : (param as string)
             if (!text) {
               if (optional) {
                 // if we have more than one optional param like /:a?-static we don't need to care about the optional param
                 if (segment.length < 2) {
                   // remove the last slash as we could be at the end
                   if (path.endsWith('/')) path = path.slice(0, -1)
                   // do not append a slash on the next iteration
                   else avoidDuplicatedSlash = true
                 }
               } else throw new Error(`Missing required param "${value}"`)
             }
             path += text
           }
         }
       }
   
       // avoid empty path when we have multiple optional params
       return path || '/'
     }
   
     return {
       re,
       score,
       keys,
       parse,
       stringify,
     }
   }
   ```

   **PathScore**枚举配置

   ```typescript
   const enum PathScore {
     _multiplier = 10,
     Root = 9 * _multiplier, // just / 根路径
     Segment = 4 * _multiplier, // /a-segment
     SubSegment = 3 * _multiplier, // /multiple-:things-in-one-:segment
     Static = 4 * _multiplier, // /static
     Dynamic = 2 * _multiplier, // /:someId
     BonusCustomRegExp = 1 * _multiplier, // /:someId(\\d+)
     BonusWildcard = -4 * _multiplier - BonusCustomRegExp, // /:namedWildcard(.*) we remove the bonus added by the custom regexp
     BonusRepeatable = -2 * _multiplier, // /:w+ or /:w*
     BonusOptional = -0.8 * _multiplier, // /:w? or /:w*
     // these two have to be under 0.1 so a strict /:page is still lower than /:a-:b
     BonusStrict = 0.07 * _multiplier, // when options strict: true is passed, as the regex omits \/?
     BonusCaseSensitive = 0.025 * _multiplier, // when options strict: true is passed, as the regex omits \/?
   }
   ```

   **其中存在一些pattern的转化，因为个人正则确实不怎么好，所以暂时没有特别详细的说这里的内容**

回到`createRouteRecordMatcher`

```typescript
export function createRouteRecordMatcher(
  record: Readonly<RouteRecord>,
  parent: RouteRecordMatcher | undefined,
  options?: PathParserOptions
): RouteRecordMatcher {
  // 生成parser对象 
  const parser = tokensToParser(tokenizePath(record.path), options)

  // 如果有重复的动态参数命名进行提示
  if (__DEV__) {
    const existingKeys = new Set<string>()
    for (const key of parser.keys) {
      if (existingKeys.has(key.name))
        warn(
          `Found duplicated params with name "${key.name}" for path "${record.path}". Only the last one will be available on "$route.params".`
        )
      existingKeys.add(key.name)
    }
  }
  // 将record，parent合并到parser中，同时新增children，alias属性，默认值为空数组
  const matcher: RouteRecordMatcher = assign(parser, {
    record,
    parent,
    // these needs to be populated by the parent
    children: [],
    alias: [],
  })

  if (parent) {
	// 两者都是alias或两者都不是alias
    if (!matcher.record.aliasOf === !parent.record.aliasOf)
      parent.children.push(matcher)
  }

  return matcher
}
```

## 3. resolve

`resolve`根据传入的`location`进行路由匹配，找到对应的`matcher`的路由信息。方法接收一个`location`和`currentLocation`参数，返回一个`MatcherLocation`类型的对象，该对象的属性包含：`name`、`path`、`params`、`matched`、`meta`。

**代码如下**

```typescript
function resolve(
    location: Readonly<MatcherLocationRaw>,
    currentLocation: Readonly<MatcherLocation>
  ): MatcherLocation {
    let matcher: RouteRecordMatcher | undefined
    let params: PathParams = {}
    let path: MatcherLocation['path']
    let name: MatcherLocation['name']

    if ('name' in location && location.name) {
      matcher = matcherMap.get(location.name)

      if (!matcher)
        throw createRouterError<MatcherError>(ErrorTypes.MATCHER_NOT_FOUND, {
          location,
        })

      // warn if the user is passing invalid params so they can debug it better when they get removed
      if (__DEV__) {
        const invalidParams: string[] = Object.keys(
          location.params || {}
        ).filter(paramName => !matcher!.keys.find(k => k.name === paramName))

        if (invalidParams.length) {
          warn(
            `Discarded invalid param(s) "${invalidParams.join(
              '", "'
            )}" when navigating. See https://github.com/vuejs/router/blob/main/packages/router/CHANGELOG.md#414-2022-08-22 for more details.`
          )
        }
      }

      name = matcher.record.name
      params = assign(
        // paramsFromLocation is a new object
        paramsFromLocation(
          currentLocation.params,
          // only keep params that exist in the resolved location
          // TODO: only keep optional params coming from a parent record
          matcher.keys.filter(k => !k.optional).map(k => k.name)
        ),
        // discard any existing params in the current location that do not exist here
        // #1497 this ensures better active/exact matching
        location.params &&
          paramsFromLocation(
            location.params,
            matcher.keys.map(k => k.name)
          )
      )
      // throws if cannot be stringified
      path = matcher.stringify(params)
    } else if ('path' in location) {
      // no need to resolve the path with the matcher as it was provided
      // this also allows the user to control the encoding
      path = location.path

      if (__DEV__ && !path.startsWith('/')) {
        warn(
          `The Matcher cannot resolve relative paths but received "${path}". Unless you directly called \`matcher.resolve("${path}")\`, this is probably a bug in vue-router. Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/router.`
        )
      }

      matcher = matchers.find(m => m.re.test(path))
      // matcher should have a value after the loop

      if (matcher) {
        // we know the matcher works because we tested the regexp
        params = matcher.parse(path)!
        name = matcher.record.name
      }
      // location is a relative path
    } else {
      // match by name or path of current route
      matcher = currentLocation.name
        ? matcherMap.get(currentLocation.name)
        : matchers.find(m => m.re.test(currentLocation.path))
      if (!matcher)
        throw createRouterError<MatcherError>(ErrorTypes.MATCHER_NOT_FOUND, {
          location,
          currentLocation,
        })
      name = matcher.record.name
      // since we are navigating to the same location, we don't need to pick the
      // params like when `name` is provided
      params = assign({}, currentLocation.params, location.params)
      path = matcher.stringify(params)
    }

    const matched: MatcherLocation['matched'] = []
    let parentMatcher: RouteRecordMatcher | undefined = matcher
    while (parentMatcher) {
      // reversed order so parents are at the beginning

      matched.unshift(parentMatcher.record)
      parentMatcher = parentMatcher.parent
    }

    return {
      name,
      path,
      params,
      matched,
      meta: mergeMetaFields(matched),
    }
}
```

## 4. removeRoute

删除路由。参数是`matcherRef`，`removeRoute`会将`matcherRef`对应的`matcher`从`matcherMap`和`matchers`中删除，并清空`matcherRef`对应`matcher`的`children`与`alias`属性。由于`matcherRef`对应的`matcher`被删除后，其子孙及别名也就没用了，也需要把他们从`matcherMap`中和`matchers`中删除。

**代码如下**

```typescript
function removeRoute(matcherRef: RouteRecordName | RouteRecordMatcher) {
    if (isRouteName(matcherRef)) {
      const matcher = matcherMap.get(matcherRef)
      if (matcher) {
        matcherMap.delete(matcherRef)
        matchers.splice(matchers.indexOf(matcher), 1)
        matcher.children.forEach(removeRoute)
        matcher.alias.forEach(removeRoute)
      }
    } else {
      const index = matchers.indexOf(matcherRef)
      if (index > -1) {
        matchers.splice(index, 1)
        if (matcherRef.record.name) matcherMap.delete(matcherRef.record.name)
        matcherRef.children.forEach(removeRoute)
        matcherRef.alias.forEach(removeRoute)
      }
    }
}
```

## 5. insertMatcher

**代码如下**

```typescript
function insertMatcher(matcher: RouteRecordMatcher) {
    let i = 0
    while (
      i < matchers.length &&
      comparePathParserScore(matcher, matchers[i]) >= 0 &&
      // Adding children with empty path should still appear before the parent
      // https://github.com/vuejs/router/issues/1124
      (matcher.record.path !== matchers[i].record.path ||
        !isRecordChildOf(matcher, matchers[i]))
    )
      i++
    matchers.splice(i, 0, matcher)
    // only add the original record to the name map
    if (matcher.record.name && !isAliasRecord(matcher))
      matcherMap.set(matcher.record.name, matcher)
}
```

**核心方法comparePathParserScore**

```typescript
export function comparePathParserScore(a: PathParser, b: PathParser): number {
  let i = 0
  const aScore = a.score
  const bScore = b.score
  while (i < aScore.length && i < bScore.length) {
    const comp = compareScoreArray(aScore[i], bScore[i])
    // do not return if both are equal
    if (comp) return comp

    i++
  }
  if (Math.abs(bScore.length - aScore.length) === 1) {
    if (isLastScoreNegative(aScore)) return 1
    if (isLastScoreNegative(bScore)) return -1
  }

  // if a and b share the same score entries but b has more, sort b first
  return bScore.length - aScore.length
  // this is the ternary version
  // return aScore.length < bScore.length
  //   ? 1
  //   : aScore.length > bScore.length
  //   ? -1
  //   : 0
}
```

`compareScoreArray`

```typescript
function compareScoreArray(a: number[], b: number[]): number {
  let i = 0
  while (i < a.length && i < b.length) {
    const diff = b[i] - a[i]
    // only keep going if diff === 0
    if (diff) return diff

    i++
  }

  // if the last subsegment was Static, the shorter segments should be sorted first
  // otherwise sort the longest segment first
  if (a.length < b.length) {
    return a.length === 1 && a[0] === PathScore.Static + PathScore.Segment
      ? -1
      : 1
  } else if (a.length > b.length) {
    return b.length === 1 && b[0] === PathScore.Static + PathScore.Segment
      ? 1
      : -1
  }

  return 0
}
```

**栗子如下：**

假设`matcherA`是需要添加的，`matchers`中此时只有一个`matcherB`，`matcherA.score=[[20, 30]]`，`matcherB.score=[[20,40]`，那么`matcherA`是怎么添加到`matchers`中的呢？过程如下：

1. 比较`matcherA.score[0][0]`和`matcherB.score[0][0]`，`matcherB.score[0][0]-matcherA.score[0][0] === 0`继续比较
2. `matcherA.score[0][1]`和`matcherB.score[0][1]`，因为`matcherB.score[0][1]-matcherA.score[0][1] > 0`，所以`i++`
3. `i=1`，因为`i===matcherA.length`，循环结束
4. 将目标`matcher`插入到源`matcher`中
