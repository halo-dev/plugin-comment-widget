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

## IP 属地数据库

`processResources` 会通过 `prepareIpLocationDatabase` 下载固定提交的 ip2region 源码归档并校验 SHA-256，使用官方 Java maker 的 `--field-list=0,1,4` 从 IPv4/IPv6 数据中仅保留国家、省份、国家代码，再将精简库和许可证打入 JAR。maker 使用项目的 JDK 编译，仅在构建时运行，不打入插件。更新数据时需要同时修改 `build.gradle` 中的提交和归档校验值，并运行属地解析测试。数据库生成在 `build/generated/ip-location`，不提交二进制文件。

运行时首次解析会将数据库解压到临时目录（约 23 MiB），使用索引缓存查询，避免将整个数据库载入堆内存；插件销毁时关闭文件并删除临时文件。已持久化的属地不会因数据库更新自动改变。
