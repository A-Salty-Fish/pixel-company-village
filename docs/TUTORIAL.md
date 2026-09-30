# 从零跑通像素公司村

演示名册是虚构的。下面的密码 `changeme` 只是例子，请换成你自己的。

## 1. 安装并填写环境变量

```bash
npm install
cp .env.example .env.local
```

编辑 `.env.local`：

```bash
SITE_PASSWORD=changeme
INGEST_SECRET=
```

`INGEST_SECRET` 用随机字符串，例如 `openssl rand -hex 32`。两个值都留在本机，不要提交。

## 2. 打开村子

```bash
npm run dev
```

浏览器打开 [http://127.0.0.1:43123](http://127.0.0.1:43123)。用你刚写的站点密码登录。

默认分数来自 `data/demo/seed.json`，日期 `2026-09-24`，人物是林小满、周晚风这一组虚构名字。灰色的人是未评分，点开写着「名册里有这个人，这一评分日没有三项雷达数字，不会编造。」

先在「体贴设置」里选定「我是谁」。没选定之前，页头下面会写着访客模式：可以看，不能关照。选定之后打开「村里新事」，天气、浇水、回家和罐头日记都在这一页，而且可以关掉。

## 3. 换成你自己的一份演示分数

仓库里的演示已经够看。若要再写一天，用占位密钥调用写入接口（字段说明见 [ingest.md](ingest.md)）：

```bash
export SITE_URL=http://127.0.0.1:43123
# 用你写在 .env.local 里的 INGEST_SECRET，不要用仓库里的空值。
export INGEST_SECRET=replace-with-your-own-secret

curl -X POST "$SITE_URL/api/ingest" \
  -H "Authorization: Bearer $INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-09-24",
    "people": [
      {"name": "林小满", "msgs": 42, "work": 2.7, "fish": 0.4, "on_task": 0.91, "scored": true}
    ]
  }'
```

刷新村子。这一天的数字记在服务器内存里，冷启动会回到演示种子。

正式名册不要放进 `data/demo/`。把 JSON 放在 gitignore 的 `data/private/`，再在部署环境设置 `VILLAGE_ROSTER_B64` 和 `VILLAGE_SEED_B64`。见 [README](../README.md)。

## 4. 选「我是谁」，试一次关照

1. 点「体贴设置」。
2. 在「我是谁」里选 **林小满**。这一选择只存在这台浏览器。
3. 点开一位已评分的村民，例如周晚风。
4. 点「本地互动」或「今日互动」（评分日不是今天时用前者），先选种子、咖啡、钓竿或浇水，再确认。确认后 3 秒内，按钮旁边可以撤销。同一人每天 1 次，每周 2 次。用完后按钮停用，并写明今天或本周已经用过。窄屏上信号卡是底部抽屉：标题和关闭钉在一起，正文自己滚动。
5. 打开「分数从哪来」。如果写着「分数来自某日 · 村里仍是此刻」，分数不是日历上的今天，浇水、挥手和关照仍按此刻算。
6. 挥手每人每小时一次。按钮旁会写「还可挥 1 次」或「先选定我是谁」。
7. 信号卡在侧栏或窄屏下半截，有关闭按钮。近 30 天的格子带日期。空格不是 0 分。
8. 「出村」会清掉登录，回到口令墙。安静村子默认开着，可以在体贴设置里关掉。

## 5. 跑端到端测试

另开一个终端，保持开发服务器在跑：

```bash
npm run test:e2e
npm run test:e2e:visual
```

Playwright 读取 `SITE_PASSWORD`（环境变量或 `.env.local`），开发服务器用的是同一个值。视觉对比（`@visual`）失败不会挡住 `test:e2e`。基线里有安静村子和忙村各一张地图。GitHub Actions 使用公开的 CI 演示口令 `ci-demo-pass`，不读取生产密码；Vercel 生产环境仍然使用你自己的 `SITE_PASSWORD`。基线画的是演示名册；不要在开着正式名册的环境里更新截图。

收藏名牌最多三枚，第四枚会提示「最多钉三枚名牌」。换「我是谁」之后钉、浇水和善意额度都跟着名字走。旧的未分人键 `village:wave-d-v0` 会在选定自己时迁到 `village:viewer:<名字>:wave-d`，然后删掉旧键。
