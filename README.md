# RSS Twitter Save

使用 RSSHub + WebDAV 自动抓取 Twitter 列表的媒体内容并备份到远端存储的脚本工程。

## 功能概览

1. **获取 RSS**：通过 `rss-parser` 拉取指定 Twitter 列表的 RSS 源，并过滤转推内容。
2. **解析媒体**：利用 `rss-parser` 的 `content` 字段提取 `<img>` 标签，解码其中的图片 URL。
3. **下载图片**：为每位作者建立临时目录，按发布时间命名文件（自动推断文件格式）。
4. **上传至 WebDAV**：通过 `webdav` 客户端递归上传目录，最终按 `twitter/<creator>` 目录结构存档。
5. **任务调度**：程序启动后立即执行一次同步，并使用 `setInterval` 每 6 小时增量抓取；同步完成会更新 `data.json` 中的 `lastSavedAt`，用于下次计算时间窗口。

## 目录结构

```
├─ src
│  ├─ index.ts            # 主流程：抓取 → 下载 → 上传 → 更新本地状态
│  ├─ utils
│  │  ├─ env.ts           # 环境变量校验与读取
│  │  └─ get-image.ts     # HTML 中提取图片 URL 的工具
│  └─ lib
│     ├─ rss.ts           # RSS 相关封装（由用户维护）
│     ├─ local-storage.ts # 读写 data.json，持久化 lastSavedAt
│     └─ webdav.ts        # 封装 WebDAV 上传逻辑
├─ data.json              # 记录最近一次成功同步时间
├─ package.json           # 脚本、依赖配置
└─ README.md              # 使用说明（本文档）
```

## 环境要求

- Node.js ≥ 24（项目使用 `node --import tsx` 运行 TS 源码）
- pnpm ≥ 8（建议使用 10.x，与项目锁定版本一致）

### 必须的环境变量

在 `.env` 中配置以下字段（`src/utils/env.ts` 会在启动时强校验）：

| 变量名                                | 作用                                                 |
| ------------------------------------- | ---------------------------------------------------- |
| `RSS_BASE_URL`                        | RSSHub 服务地址（示例：`https://rsshub.app`）        |
| `LIST_ID`                             | 目标 Twitter 列表 ID                                 |
| `WEBDAV_URL`                          | WebDAV 服务地址（例如 `https://example.com/webdav`） |
| `WEBDAV_USERNAME` / `WEBDAV_PASSWORD` | WebDAV 认证信息                                      |

## 常用脚本

| 命令            | 说明                                                                              |
| --------------- | --------------------------------------------------------------------------------- |
| `pnpm dev`      | 使用 `node --import tsx` 运行 `src/index.ts`（默认执行同步任务并进入 6 小时轮询） |
| `pnpm lint`     | ESLint 检查                                                                       |
| `pnpm prettier` | 使用 Prettier 修复 `src/**/*.ts`                                                  |
| `pnpm build`    | `tsup` 打包（若需要生成 `dist/`）                                                 |
| `pnpm test`     | 执行 `tests/index.ts`（可在其中撰写集成测试）                                     |

## 工作流说明

1. **初始化**：`main()` 先调用 `checkAndSave()` 立即同步一次，再以 6 小时为周期执行。
2. **增量抓取**：`getImageUrlsMap()` 会根据 `data.json` 的 `lastSavedAt` 计算 `filter_time` 参数，只拉取最近未备份的内容。
3. **下载 + 命名**：对每位作者建立临时目录（`temp/<creator>`），文件命名为 `safePublishedAt + 扩展名`，其中扩展名优先取自响应头的 `Content-Type`，否则回退到 URL。
4. **上传 + 清理**：调用 `webdav.copyDirectory(tempDir, /twitter/<creator>)` 上传，成功后删除临时目录并更新 `data.json`。
