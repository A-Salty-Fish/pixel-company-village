# 生产只读冒烟

不写入关照、不挥手、不投喂。只确认口令墙、地图和一张信号卡。

```bash
PLAYWRIGHT_PROD=1 PLAYWRIGHT_BASE_URL=https://pixel-company-village.vercel.app SITE_PASSWORD=你的站点密码 npm run test:e2e:prod
```

密码从环境变量读，不要写进仓库，也不要打进日志。

脚本在通过时把 6 张图写到 `tmp/prod-smoke/`（已 gitignore）：`01-gate.png`、`02-map-ready.png`、`03-roster.png`、`04-scored-card.png`、`05-unscored-or-empty.png`、`06-left-village.png`。过程中不允许成功的 POST 打到 `/api/kindness`、`/api/wave` 或 ingest。没有生产口令时不要猜密码，把这一项标成跳过。

手测时：

1. 打开站点，确认未登录会停在口令墙。
2. 登录后地图应先出现铺地形的进度，而不是长时间空白绿块。失败时同屏有「再试一次」和「刷新今日分数」。页头和名册应立刻可见，不必先打开「村里的事」。
3. 点开一个人，看到信号卡和数据日。不要点「本地互动」「今日互动」或「挥手」。
4. 点「出村」，应回到口令墙。再登录一次，页头、名册和「全显」仍在，不用点「村里的事」。
5. 需要截图时，登录后依次保存：全图、信号卡、体贴设置、立春条幅、节日地图、窄屏分割。不要写入分数。

Git 部署失败时的 CLI 步骤见 [deploy-cli.md](deploy-cli.md)。不要改 `SITE_PASSWORD` 或名册环境变量。
