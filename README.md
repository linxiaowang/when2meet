# 约

发一个链接，大家点自己能来的时间。第一周只做 H5：创建约、分享 URL、点格子、热力图。不用登录。

基于现有 uni-vitesse（Vue 3 + uni-app），不是新项目。

## 本地（今晚可点）

```bash
pnpm i
pnpm dev:h5
```

浏览器打开终端里的 Local / Network 地址。手机和电脑要打到**同一台**开发机，数据在 `.data/events.json`，不是 localStorage。

用两个名字测：

1. 填标题，选几天，时间默认 09:00–21:00，点「生成链接」
2. 输入名字 A，点几个格子，点「保存我的时间」，复制链接
3. 无痕窗口打开同一链接，输入名字 B，点格子并保存
4. 回到 A 的页面刷新：应看到人数、热力图、点格子能看到谁选了

时区按 **Asia/Shanghai** 算日期。

## 环境变量

见 `.env.example`。

| 变量 | 谁用 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE` | 前端构建 | API 根路径。留空走同域 `/api`。只有 H5 和 API 不在同一域名时才需要，例如 `https://xxx.netlify.app` |
| Netlify Blobs | Functions 运行时 | 部署到 Netlify 后自动可用，不用手填。存事件 JSON |

没有用户系统。CORS 已在 API 上放开 `*`。

## 生产

仓库带 `netlify.toml`：H5 静态资源 + `/api/*` 转到 Netlify Function，事件写在 Blobs。

```bash
pnpm build:h5
```

输出在 `dist/build/h5`。连上 Netlify 后推 `main` 或手动 deploy 即可。没有现成 Netlify/Vercel 账号时，用上面的 `pnpm dev:h5`，把 Network 地址发到手机。

## 微信分享

`pages/index` 和 `pages/event` 已写 `onShareAppMessage` / `onShareTimeline`。卡片标题用约的标题（没有则「约」），path 带事件 id，`imageUrl` 为 `src/static/share.png`。今晚不提审小程序。
