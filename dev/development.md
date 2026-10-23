# 开发环境

环境要求：Java 21、Node.js 24、pnpm 12.4.2（与根目录 `packageManager` 一致）。Gradle 使用项目自带的 Wrapper，无需单独安装。

```bash
git clone git@github.com:halo-dev/plugin-comment-widget.git

# 或者当你 fork 之后

git clone git@github.com:{your_github_id}/plugin-comment-widget.git
```

```bash
cd path/to/plugin-comment-widget
```

```bash
./gradlew pnpmInstall

# 启动一个 Docker 容器作为开发环境并自动加载此插件
./gradlew haloServer
```

Halo 插件的详细开发文档可查阅 [插件开发](https://docs.halo.run/category/%E6%8F%92%E4%BB%B6%E5%BC%80%E5%8F%91)。
