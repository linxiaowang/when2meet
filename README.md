# 约

发一个链接，大家勾能到的时间格子，创建者看重叠。时区固定 `Asia/Shanghai`。

本仓库从 [uni-vitesse](https://github.com/Ares-Chang/uni-vitesse) 起步，第一周只做 H5。

## 本地运行

```bash
pnpm i
pnpm dev:h5
```

浏览器打开终端里给出的本地地址（一般是 `http://localhost:5173`）。首屏就是创建页。

生产构建：

```bash
pnpm build:h5
```

产物在 `dist/build/h5`。仓库已有 `netlify.toml`，把站点连上 Netlify 即可部署 H5。

## 环境变量

| 变量 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- |
| `VITE_EVENT_STORE_BASE` | 否 | `https://api.restful-api.dev/objects` | 共享 JSON 存储根路径。H5 直连，已验证 CORS `Access-Control-Allow-Origin: *` |

复制 `.env.example` 为 `.env` 即可覆盖。不设也能跑。

活动数据存在该远程 JSON 库里，**不是** `localStorage`。刷新、无痕、第二台设备只要打开同一条带 `id` 的链接就能看到同一份格子。

验证存储本身：

```bash
pnpm verify:store
```

## 两人怎么测

1. 创建页填标题，勾几天，选小时范围（默认 9:00–21:00）和 30/60 分钟粒度，点「生成链接」。
2. 进入活动页，点「复制链接」。
3. 显示名填 `甲`，点几个格子，点「保存」。
4. 无痕窗口打开刚才的链接，显示名填 `乙`，勾部分重叠的格子，保存。
5. 刷新：热力图数字还在；点格子能看到谁勾了。

分享 URL 形如：

```
http://localhost:5173/#/pages/event?id=<id>
```
