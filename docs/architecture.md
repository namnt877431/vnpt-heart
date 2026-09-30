# Kiến trúc client

## Hai lớp chồng lên nhau

```
┌──────────────────────────────── viewport ────────────────────────────────┐
│ #ui  (DOM, z-index 1, pointer-events: none trừ panel/nút)                │
│   .topbar  ── shell.ts                                                   │
│   #screen-root ── màn hình hiện tại (ui/screens/*.ts)                    │
│        └─ phần tử [data-safe-area]  → vùng trống để scene vẽ thế giới    │
│   #modal-root, #toast-root ── ui/components/overlay.ts                   │
├──────────────────────────────────────────────────────────────────────────┤
│ #game-container (Phaser canvas, z-index 0, trong suốt, full màn hình)    │
│   MapScene (bản đồ chặng) | BossFightScene (đấu trường Boss)             │
└──────────────────────────────────────────────────────────────────────────┘
```

- **DOM** lo mọi thứ có chữ/số: menu, BXH, hồ sơ, toàn bộ mini-game, HUD trận Boss.
- **Phaser** lo thế giới game: đảo bay, mây, robot, Boss, quỹ đạo đạn, cháy nổ.

## Các tầng mã nguồn

```
data/content/*   nội dung (chặng, level, câu hỏi)      ← BTC/biên tập sửa ở đây
data/game-types  kiểu spec của 10 dạng mini-game
data/mock        dữ liệu giả (người chơi, BXH, nhóm)   ← thay bằng API
data/selectors   giá trị sống: điểm/cấp của tôi, BXH đã trộn điểm của tôi
core/progress    tiến độ (sao, điểm, mở khóa) – demo: localStorage
core/scoring     luật sao & điểm
core/events      event bus UI ↔ Phaser
ui/games/*       10 module mini-game (DOM) + registry
ui/screens/*     màn hình (home, chapter, level, games, leaderboard, badges, group, share)
scenes/*         Phaser: Boot → Preloader → Map | BossFight
```

## Luồng chơi

```
home (MapScene) --click đảo--> chapter (đường level) --click level--> level
level: resolve(params) → spec → ui/games/<type>.mount(root, spec, api)
       api.finish(result) → starsFor/pointsFor → progress.recordResult → modal kết quả
       mystery: lật thẻ → phần thưởng ngay hoặc go('level', { levelId, spec: <game bất ngờ> })
       spec.type === 'boss' → router chạy BossFightScene thay vì MapScene
```

## Event bus (`src/core/events.ts`)

| Sự kiện | Phát bởi | Nghe bởi | Ý nghĩa |
|---|---|---|---|
| `game:ready` | PreloaderScene | main.ts | asset xong, mount UI |
| `screen:changed` | router | shell (tô sáng menu) | đã đổi màn |
| `chapter:select` | MapScene (click đảo) | main.ts → `go('chapter')` | chỉ xử lý khi đang ở `home` |
| `progress:changed` | core/progress | MapScene (vẽ lại tiến độ đảo) | có kết quả mới / reset |
| `layout:safe-area` | ui/safe-area.ts | MapScene, BossFightScene | vùng trống (CSS px) để fit camera; `null` = full màn |
| `boss:aim` | ui/games/boss.ts | BossFightScene | góc, lực, gió → vẽ đường ngắm |
| `boss:fire` | ui/games/boss.ts | BossFightScene | bắn (kèm sát thương hiển thị) |
| `boss:shot-landed` | BossFightScene | ui/games/boss.ts | trúng/trượt → trừ máu Boss hoặc cho bắn lại |
| `boss:attack` | ui/games/boss.ts | BossFightScene | trả lời sai → Boss phản công |
| `boss:defeated` | ui/games/boss.ts | BossFightScene | hiệu ứng Boss bị hạ |

`bus.latest(event)` trả payload gần nhất (scene khởi động muộn vẫn đọc được layout).
Dev build: `window.__BUS__`, `window.__PHASER_GAME__` để playtest.

## Router & màn hình (`src/ui/router.ts`, `src/ui/screens/`)

- `ScreenModule { id, scene, mount(root, ctx) → cleanup }`; `scene` có thể là hàm của params
  (màn `level` chọn `BossFight` khi spec là boss).
- `router.go(id, params)`: cleanup màn cũ → đổi/restart scene nếu cần → đặt
  `body[data-screen]` + `body[data-scene]` (CSS dùng để làm mờ bản đồ, đổi nền) → `mount()`.
- Click trong màn dùng `onAction(root, { 'ten-action': handler })` với `data-action="ten-action"`.

## Mini-game (`src/ui/games/`)

- Hợp đồng `GameModule { type, scene?, fullScreen?, mount(root, spec, api) → { destroy, timeout? } }`.
- `GameApi`: `finish(result)`, `robot(text, mood)`, `exit()`. Màn `level` đo thời gian, chạy đồng hồ
  (`spec.timeLimitSec`), tính sao/điểm, lưu tiến độ, hiện kết quả + giải thích.
- `renderQuestion()` trong `choice.ts` là khối câu hỏi dùng chung (choice, investigate, escape, boss).

## Camera & độ phân giải

- Game size = kích thước CSS × `DPR` (tối đa 2), `scale.zoom = 1/DPR` → canvas sắc nét trên Retina.
- Mỗi scene có **view rect** (`config/layout.ts`), fit vào `layout:safe-area` bằng `fitWorldToRect`.
- MapScene có 2 bố cục (`MAP_LAYOUTS.landscape | portrait`) chọn theo tỉ lệ safe-area; đổi chiều → `scene.restart()`.

## Lưu ý

- Phaser nhận cả `pointerup` khi thả chuột trên DOM đè lên canvas: handler click trong scene phải
  kiểm tra `pointer.event?.target === this.game.canvas` (xem `MapScene.createIsland`).
- **Bảo mật đáp án:** demo gửi đáp án xuống trình duyệt. Khi có backend, server giữ `correct`/`answer`
  và chấm điểm; client chỉ gửi lựa chọn.
- Tiến độ demo lưu `localStorage` key `vnpt-heart:progress:v1` (chỉ trên máy đó).
