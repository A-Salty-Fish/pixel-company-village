# 生产只读冒烟

不写入关照、不挥手、不投喂。只确认口令墙、地图和一张信号卡。

```bash
PLAYWRIGHT_PROD=1 PLAYWRIGHT_BASE_URL=https://pixel-company-village.vercel.app SITE_PASSWORD=你的站点密码 npm run test:e2e:prod
```

密码从环境变量读，不要写进仓库，也不要打进日志。

手测时：

1. 打开站点，确认未登录会停在口令墙。
2. 登录后地图应先出现铺地形的进度，而不是长时间空白绿块。失败时同屏有「再试一次」和「刷新今日分数」。
3. 点开一个人，看到信号卡和数据日。不要点「今日互动」或「挥手」。
4. 点「出村」，应回到口令墙。
