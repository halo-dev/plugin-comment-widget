# 作为组件使用

此插件的 UI 部分采用 [Lit Element](https://lit.dev/) 编写，并最终编译为 Web Component，所以理论上可以在任何 JS 框架中使用。这非常适用于将 Halo 作为 Headless CMS 使用的场景。例如使用 Vue、React 等框架编写网站，并调用 Halo 的 API 来渲染网页，这个时候文章评论的解决方案就可以直接使用此组件。

安装：

```bash
pnpm install @halo-dev/comment-widget
```

## Vue

在 Vue 组件中使用时，需要在 Vue 的编译选项中设置将此组件标记为非 Vue 组件，以下是 Vite 的配置示例：

```js
import vue from '@vitejs/plugin-vue'

export default {
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'comment-widget'
        }
      }
    })
  ]
}
```

然后在 SFC 中使用即可：

```vue
<script setup>
import '@halo-dev/comment-widget'
import '@halo-dev/comment-widget/var.css';
</script>

<template>
  <comment-widget
    baseUrl="https://demo.halo.run"
    group="content.halo.run"
    kind="Post"
    version="v1alpha1"
    name="e0507f6f-88bb-4d3c-a90a-a88aba222035"
  ></comment-widget>
</template>
```

## React

```ts
import "@halo-dev/comment-widget";
import "@halo-dev/comment-widget/var.css";

function App() {
  return (
    <>
      <comment-widget
        baseUrl="https://demo.halo.run"
        group="content.halo.run"
        kind="Post"
        version="v1alpha1"
        name="e0507f6f-88bb-4d3c-a90a-a88aba222035"
      ></comment-widget>
    </>
  );
}

export default App;
```
