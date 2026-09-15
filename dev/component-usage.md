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

## 评论固定链接

插件及独立 npm 组件要求 Halo 2.27.0 或更高版本。点击评论或回复的发布时间，可以查看完整时间并复制 Core 返回的顶层 `permalink`。缺少链接时仅显示日期，不提供复制入口，也不自行拼造链接。相对链接在复制时基于当前前台 URL 解析为完整地址，绝对链接保持原样；不会使用 API 的 `baseUrl` 替换前台地址：

```text
/archives/example#halo-comment=<commentName>
/archives/example#halo-comment=<commentName>&reply=<replyName>
```

组件初始化时识别上述 hash，直接进入详情模式，不请求主评论列表：

- 评论链接展示根评论并分页加载回复。
- 回复链接展示根评论和指定回复；点击“查看全部回复”后才加载回复列表。
- 点击“返回评论列表”清除定位参数并加载正常列表，浏览器后退可返回详情。
- 根评论必须属于当前组件的 `group`、`kind`、`name`；不存在或不可见的内容不会展示。

主题保持原来的挂载方式即可。相同页面内修改 hash 会更新详情；Headless 应用若通过 `history.pushState` 切换 URL，需要由应用通知组件（派发 `hashchange`）或重新挂载。使用 hash 路由的应用需自行协调路由片段，不能直接覆盖其路由 hash。内容页地址变更后的旧链接跳转由站点维护。

指定回复通过 Halo Core 公开接口查询：

```text
GET /apis/api.halo.run/v1alpha1/comments/{commentName}/reply/{replyName}
```

接口校验根评论、回复归属和当前访问者的可见性，并返回脱敏展示数据；根评论详情及回复列表同样使用 Halo Core 接口。网络或服务失败时可以重试；不存在或不可见时提供返回列表入口。不保留旧 Core 的接口回退。
