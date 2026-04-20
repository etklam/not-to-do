# 挑戰 = 不做清單 + 協作規格（v1）

## 1. 目標

定義「挑戰（challenge）」為「一般不做清單（not-to-do item）」的協作模式，而不是另一套獨立流程。

- 個人模式：自己追蹤、自己完成
- 挑戰模式：同樣的追蹤規則，但可分享、可邀請、可查看彼此進度

核心原則：同一套打卡/連續天數邏輯，僅在挑戰模式加上分享與成員關係。

## 2. 統一資料模型

### 2.1 `not_to_dos`（主體仍是同一張表）

新增欄位：

- `mode` `varchar(20)` not null default `'personal'`
  - 可用值：`'personal' | 'challenge'`
- `challenge_id` `uuid` null references `challenges.id` on delete set null

約束：

- `mode='personal'` 時 `challenge_id` 必須為 `null`
- `mode='challenge'` 時 `challenge_id` 必須非空

說明：

- 每位使用者在挑戰內仍持有自己的 item（各自 streak）
- 挑戰頁聚合每位成員對應的 challenge item

### 2.2 `challenges`（只放協作層資料）

保留現有欄位：

- `id`, `title`, `description`, `slug`, `creator_id`, `is_public`, `created_at`

新增欄位：

- `share_code` `varchar(32)` unique not null
- `status` `varchar(20)` not null default `'active'`
  - 可用值：`'active' | 'archived'`

說明：

- `slug` 走人類可讀路徑（SEO/可讀）
- `share_code` 用於短連結與邀請碼

### 2.3 `challenge_participants`

沿用現有結構：

- `challenge_id`, `user_id`, `not_to_do_id`, `joined_at`
- unique(`challenge_id`, `user_id`)

補強約束（應用層或 DB trigger）：

- `challenge_participants.not_to_do_id` 的 `mode` 必須為 `challenge`
- `challenge_participants.not_to_do_id.challenge_id = challenge_participants.challenge_id`

## 3. API 契約

### 3.1 Items（同流程）

### `GET /api/items`

回傳 item 增加：

- `mode`
- `challengeId`（對應 DB `challenge_id`）

### `POST /api/items`

請求：

```json
{
  "title": "不滑短影音",
  "description": "",
  "mode": "personal",
  "challengeId": null
}
```

規則：

- `mode` 省略時預設 `personal`
- `mode=personal` 不可帶 `challengeId`
- `mode=challenge` 必須帶 `challengeId`

### `PATCH /api/items/:id`

沿用現有更新邏輯，新增限制：

- 不允許直接把已存在 item 在 `personal/challenge` 間互轉
- 需要轉換時以「建立新 item + 關聯挑戰」流程處理，避免 streak 意義混亂

### 3.2 Challenges（協作層）

### `GET /api/challenges`

回傳維持現有欄位，補充：

- `shareCode`
- `shareUrl`（伺服器組合）
- `status`

### `POST /api/challenges`

用途：建立挑戰並自動建立「建立者自己的 challenge item」

請求：

```json
{
  "title": "7天不熬夜",
  "description": "11:30 前上床",
  "isPublic": true,
  "sourceItemId": "uuid"
}
```

行為：

1. 建立 `challenges`
2. 以 `sourceItemId` 的 title/description 建立 `mode=challenge` 的 item（或複製來源）
3. 建立 `challenge_participants`（creator 綁定新 item）
4. 回傳 `challenge`, `participant`, `item`

### `GET /api/challenges/:slug`

回傳：

- `challenge`（含 `shareCode/shareUrl/status`）
- `participants[]`
  - `userId`, `userName`
  - `itemId`, `streak`, `bestStreak`, `lastCheckin`, `isActive`
  - `joinedAt`

### `POST /api/challenges/:slug/join`

請求：

```json
{
  "sourceItemId": "uuid"
}
```

行為：

1. 驗證可加入（未超過上限、尚未加入）
2. 由 `sourceItemId` 建立使用者自己的 `mode=challenge` item（challenge 專用副本）
3. 寫入 `challenge_participants`
4. 回傳 `participant`, `item`

### `POST /api/challenges/:slug/leave`

行為：

- 退出挑戰，刪除 `challenge_participants`
- 參與者對應 challenge item 預設做軟封存（`is_active=false`），不直接硬刪除

### `GET /api/challenges/share/:shareCode`（新增）

用途：

- 給未登入/外部連結預覽挑戰卡片
- 已登入可直接導向 join flow

### `POST /api/challenges/share/:shareCode/join`（新增，可選）

用途：

- 讓分享連結可直接加入（等價 `/:slug/join`）

## 4. 前端最小變更

- `ItemCard` 增加模式標記：`個人` / `挑戰`
- 挑戰詳情頁增加：
  - 成員清單
  - 分享按鈕（複製 `shareUrl`）
  - 共同進度區塊（排序：`streak desc`）
- 個人 item 詳情不改打卡流程，challenge item 同樣使用既有 check-in API

## 5. 相容與遷移

### 5.1 既有資料

- 舊資料 `not_to_dos` 預設補 `mode='personal'`
- 舊 `challenge_participants.not_to_do_id` 對應的 item 回填：
  - `mode='challenge'`
  - `challenge_id = challenge_participants.challenge_id`

### 5.2 版本相容

- 舊客戶端不傳 `mode` 時仍可建立 personal item
- 回應新增欄位採「向後相容新增」，不移除既有欄位

## 6. 驗收條件（UAT）

1. 使用者建立 personal item，流程與現在完全一致。
2. 使用者可用既有 item 開啟 challenge，自己會成為第一位參與者。
3. 被邀請者加入 challenge 後，會自動生成自己的 challenge item。
4. 兩位以上成員每天各自 check-in，挑戰頁可即時看到各自 streak。
5. 成員離開挑戰後，不再出現在成員列表；其 challenge item 不影響個人 item。
6. 分享連結可被他人打開並完成加入流程。
