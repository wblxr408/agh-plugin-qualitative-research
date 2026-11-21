# 访谈主题分析 · Qualitative Research

这个市场版本提供 AGH 配置 Bundle。访谈主题分析的实际运行功能由独立组件 `@wblxr408/qualitative-research-runtime` 提供。

## 安装

1. 安装经固定提交发布的运行组件。在 AGH 中审核其权限，再信任和启用。

   ```sh
   agh plugins add git:https://github.com/wblxr408/agh-plugin-qualitative-research#2a2dbdf79168a861a89cb325dab3a4ded4769886
   ```

2. 在 AGH 市场安装并启用 `@wblxr408/qualitative-research` 0.6.1。启动访谈编码流程，再打开访谈分析工作台核对主题和原文引文。

分析时请从「智能体」启动运行组件提供的「访谈主题分析」。市场 Bundle 的「访谈主题分析配置说明」提供只读配置指导。导入自有材料时按组件文档配置模型。

```sh
agh --new --agent '@wblxr408/qualitative-research-runtime#qualitative-research' -p '全量演示'
```

如果已安装本仓库的旧版插件，请先用市场 Bundle 更新旧版，再安装新的运行组件，避免同一功能同时加载两个版本。

[运行组件文档](https://github.com/wblxr408/agh-plugin-qualitative-research/tree/runtime-v0.5.2) · [AGH 插件安装指南](https://github.com/AgnesAI-Labs/agnes-harness/blob/main/docs/guide/packages.zh-CN.md)
