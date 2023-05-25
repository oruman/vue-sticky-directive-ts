# vue-sticky-directive-ts

vue-sticky-directive-ts is a powerful vue directive make element sticky and fork of [vue-sticky-directive](https://www.npmjs.com/package/vue-sticky-directive)

# Install
Using npm:

[![NPM](https://nodei.co/npm/vue-sticky-directive-ts.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/vue-sticky-directive-ts/)

```Bash
npm install vue-sticky-directive-ts --save
```

Using yarn:
```Bash
yarn add vue-sticky-directive-ts
```

ES2015
```JavaScript
// register globally
import Sticky from 'vue-sticky-directive-ts'
Vue.use(Sticky)
```

# Usage

Use `v-sticky` directive to enable element postion sticky. Sticky element will find its nearest element with `sticky-container` attribute or its parent node if faild as the releative element.

```HTML
<div sticky-container>
  <div v-sticky="{
    topOffset: 0,
    bottomOffset: 0,
    side: 'top',
    zIndex: 10,
    on: () => {}
  }">
    ...
  </div>
</div>
```

In styles set _position_ for `sticky-container`.
```css
[sticky-container] {
  position: relative;
}
```

# Options
* `topOffset`_(number)_ - set the top breakpoint offset (default: `0`)
* `bottomOffset`_(number)_ - set the top breakpoint offset (default: `0`)
* `side`_(string)_ - decide which side should be sticky, you can set `top`,`bottom` or `both` (default: `top`)
* `zIndex`_(number)_ - to set the z-index of element to stick
* `on` _(function)_ - callback when sticky and release, receiveing 1 argument with object indicating the state, like:

```json5
// The element is sticked on top
{
  bottom: false,
  top: true,
  sticked: true
}
```

# License

MIT


