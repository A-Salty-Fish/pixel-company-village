# 评分写入

像素公司村只接收当日数字分数。聊天原文、群消息、截图和文件路径都不接收。

## 接口

- 方法 / 路径：`POST /api/ingest`
- 鉴权（二选一）：
  - `Authorization: Bearer $INGEST_SECRET`
  - `x-ingest-secret: $INGEST_SECRET`
- `Content-Type: application/json`

进村密码不能改分数。没有 `INGEST_SECRET` 的请求一律 401。把密钥只放在环境变量里。

## 字段

顶层：

| 字段 | 类型 | 说明 |
|---|---|---|
| `date` | `YYYY-MM-DD` | 必填 |
| `people` | 数组，1–100 人 | 必填。名册外但有雷达分的人也会入座 |
| `disclaimer` | 短字符串 | 可选，默认「代理信号≠绩效；摸鱼分是趣味雷达」 |

每人：

| 字段 | 别名 | 范围 |
|---|---|---|
| `name` | — | 显示名，1–24 字。演示数据用虚构名字 |
| `msgs` | `msg_count` | 消息**条数**，整数。不是消息正文 |
| `work` | `work_signal` | 约 0–3 |
| `fish` | `fish_signal` | 约 0–3 |
| `on_task` | `mostly_on_task`（数字或布尔） | 0–1；布尔 `true` → 0.85 |
| `scored` | — | `false` 表示今日未评分 |
| `tags` | — | 仅允许 `mostly_on_task` |

其他字段会被丢掉。出现聊天、群、截图、路径一类键名，或超长文本，整包拒绝。

`scored: false`，或 `work` / `fish` / `on_task` / `msgs` 为 `null`，表示今日未评分。三项雷达都是 0 时也按未评分：只有消息条数、没有雷达，不算已评分。

## 示例

下面的密钥和姓名都是占位。先在 `.env.local` 里自己生成 `INGEST_SECRET`。

```bash
curl -X POST "$SITE_URL/api/ingest" \
  -H "Authorization: Bearer $INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-09-24",
    "people": [
      {"name": "林小满", "msgs": 42, "work": 2.7, "fish": 0.4, "on_task": 0.91}
    ],
    "disclaimer": "代理信号≠绩效；摸鱼分是趣味雷达"
  }'
```

别名也可以：

```json
{
  "name": "林小满",
  "msg_count": 42,
  "work_signal": 2.7,
  "fish_signal": 0.4,
  "mostly_on_task": 0.91
}
```

成功时返回：

```json
{ "ok": true, "date": "2026-09-24", "people": 1, "store": "memory" }
```

`store` 目前只有 `memory`。分数在这台服务器进程的内存里，冷启动回到演示种子，或回到 `VILLAGE_SEED_B64`。多实例之间不会自动同步。Redis、Blob、KV 以后可以再接，现在不需要。

## 读取

`GET /api/scores` 需要站点密码 cookie，返回清洗后的姓名、日期和数字。写入请用 ingest。
