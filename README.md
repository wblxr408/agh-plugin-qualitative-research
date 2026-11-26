# 访谈主题分析

把访谈稿或开放式问答转成可逐层回查的研究报告。开放编码尽可能区分材料中有证据的具体概念，主轴编码汇总相关概念，选择性编码从已有范畴提炼有证据支持的候选研究主题。工作台可在不同主题之间切换，沿主轴范畴和开放编码回查原文。每条展示的引文都在指定片段内逐字匹配，报告标注文件名和原行号。报告包含各主题概要、下一步分析问题及论文写作指导。

## 演示

使用已构建的 [AGH CLI](https://github.com/AgnesAI-Labs/agnes-harness/blob/main/docs/guide/install.zh-CN.md)。在 AGH 工作区首次启用：

```powershell
agh plugins add git:https://github.com/wblxr408/agh-plugin-qualitative-research#runtime-v0.5.2
agh --new --agent '@wblxr408/qualitative-research-runtime#qualitative-research' -p '全量演示'
```

首次安装时按 CLI 提示审阅并启用。在 Web 的「智能体」页选择「访谈主题分析」，发送预填的「演示」会跑前两份访谈，发送「全量演示」会跑 25 份访谈、166,834 个英文字符。两条命令都使用预置规则和示例解释做离线演示，无需模型密钥。在会话文件卡打开 `report.html`，展开主轴范畴，再展开开放编码即可查看引文。另有 `report.md` 用于编辑和导出。两份报告也会写到工作区的 `fde-output/qualitative-research/`。

生成报告后，从 AGH 侧栏打开「访谈分析工作台」，或点报告所属会话顶部的「访谈报告」。未生成最终报告的会话不显示这个按钮。左侧可检索编码、引文和文件名。选中主题会高亮关联范畴，选中开放编码会在证据详情展示最多两条带出处的引文。更多引文见 Markdown 报告。切换「概要」「思路引导」或「写作指导」可浏览对应章节。

也可以将随插件分发的 25 份 TXT 放入会话工作区，发送包含 `"dataset":"industrial-symbiosis"` 和 `"files"` 的 JSON，列出 25 个工作区相对路径。插件会读取所列文件、核对公开数据集版本并保留导入路径作为引文出处。

## 更新并采用工作台

1. 在原 AGH 配置档案运行 `agh plugins add <新版本来源>`，审阅并确认更新。保留原工作区和会话，不需要卸载旧版。
2. 在 AGH 的「设置 → 应用」找到版本 `0.5.3`，点「预览」。确认导航入口列有「访谈分析工作台」，再点「采用」。安装或更新不等于采用。每个配置档案同时只能采用一个应用。
3. 从侧栏或原有 `?page=qualitative-research-studio` 书签打开工作台。在原会话可从「访谈报告」打开已保存的最终报告。

要停用工作台和会话顶部按钮，在 `?admin` 打开「应用恢复」，选择「恢复官方界面」。这个操作不会删除会话或报告文件。

## 用模型分析材料

在 AGH 会话里选择已配置且支持稳定 JSON 文本输出的模型。直接发送下面的 JSON，把路径和问题改成实际内容：

```json
{"files":["访谈/第一份.txt","访谈/第二份.md"],"question":"组织之间开展资源共享时遇到了哪些阻碍？"}
```

路径相对于会话工作区，使用正斜杠。最多 50 份 UTF-8 文件，总计最多 400,000 字符或 5,000 个片段，以先达到的上限为准。模型会逐批考虑文本，每批提取最多 12 条相关开放编码，并为每个编码返回可核对的引文。主题归纳最多采用出现次数最多的 100 个编码，全部编码保留在报告里。提纲是供研究者审阅的候选结果。任务随 AGH 会话在 daemon 中执行，失败后可用同一输入新建会话重跑。

要用所选模型分析内置数据，发送 `{"demo":"sample","model":true,"question":"哪些因素影响组织间的合作？"}`。将 `sample` 改为 `full` 可跑全量。

## 来源

演示使用 Erika Džajić Uršič 的 25 份斯洛文尼亚产业共生访谈英文稿，CC BY 4.0。转换后的 [TXT 原文](fixtures) 随插件分发，便于按报告行号核对。[Zenodo 原始资料](https://doi.org/10.5281/zenodo.16910966) · [署名与转换说明](NOTICE)

开放编码和主题归纳改编自 LLMCode 的编码提示与主题分组，采用 AGH 的现有模型路由与文件投递接口。[LLMCode 源码](https://github.com/PerttuHamalainen/LLMCode/tree/1fbea4b190cb6742a86ad58b3be0a1f418469330/llmcode) · [MIT 许可](LICENSE.LLMCode)

浏览器工作台使用 [Fuse.js 7.1.0](https://github.com/krisk/Fuse/tree/v7.1.0) 在本地搜索报告。随插件分发的库及署名见 [NOTICE](NOTICE)。
