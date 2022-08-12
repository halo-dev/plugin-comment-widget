# plugin-comment-widget

Halo 2.0 的评论模块插件，为前台提供完整的评论解决方案（WIP）

## 说明

使用 Vue 构建评论组件，最终产物（`comment-widget.iife.js` `style.css`）会被放置于 `src/main/resources/static`，插件需要配置 `ReverseProxy` 资源，如：

```yaml
apiVersion: plugin.halo.run/v1alpha1
kind: ReverseProxy
metadata:
  name: reverse-proxy-comment-widget
rules:
  - path: /static/**
    file:
      directory: static
```

最终可通过 `/assets/PluginCommentWidget/static/comment-widget.iife.js` 访问到评论组件的 JavaScript 资源。

根据 [RFC](https://github.com/halo-dev/rfcs/tree/main/theme#%E4%B8%BB%E9%A2%98%E5%85%AC%E5%85%B1%E6%A8%A1%E6%9D%BF%E6%89%A9%E5%B1%95)，最终主题使用该插件需要在对应扩展点插入以下代码：

```html
<div id="comment"></div>
<script src="/assets/PluginCommentWidget/static/comment-widget.iife.js"></script>
<script>
    CommentWidget.init("#comment", "/assets/PluginCommentWidget/static/style.css", {
        postId: 0,
    });
</script>
```

如果使用 Vue 构建 SPA 应用，也可以使用以下方式引入评论组件：

```bash
pnpm install @halo-dev/comment-widget
```

```vue
<script lang="ts" setup>
import { Comment } from "@halo-dev/comment-widget";
import "@halo-dev/comment-widget/dist/style.css";
</script>

<template>
  <Comment postId="0"></Comment>
</template>
```
