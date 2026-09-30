# 用 CLI 部署（不改密钥）

Git 直连失败时，用已经登录过的 Vercel CLI 部署**当前提交**。不要在命令里写入或轮换 `SITE_PASSWORD`、`INGEST_SECRET`、`VILLAGE_ROSTER_B64`、`VILLAGE_SEED_B64`。这些只留在 Vercel 项目的环境变量里。

```bash
git rev-parse HEAD
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

云端代理没有 `VERCEL_TOKEN` 时，不要假装已经上了生产。把上面的 SHA 交给有权限的人，在已链接的项目里执行同一条命令。

生产只读冒烟（不写分数、不点关照）见 [prod-smoke.md](prod-smoke.md)。
