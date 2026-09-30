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
│   MapScene | BossFightScene                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

- **DOM** lo mọi thứ có chữ/số: menu, bảng xếp hạng, hồ sơ, câu hỏi, HUD trận đấu.
  Lý do: chữ tiếng Việt sắc nét, responsive dễ, dễ tiếp cận (a11y), dễ bảo trì.
- **Phaser** lo thế giới game: đảo bay, đường nối, mây, robot, boss, quỹ đạo, cháy nổ.

## Luồng khởi động

```
main.ts
 └─ new Phaser.Game(scene: [Boot, Preloader, Map, BossFight])
      Boot       – chờ web font (Baloo 2, Be Vietnam Pro) tải xong
      Preloader  – tải toàn bộ ASSETS (config/assets.ts), tạo texture nhỏ (sparkle, dot, shot)
                 – start('Map') rồi bus.emit('game:ready')
 └─ bus.on('game:ready') → mountShell() → createRouter() → router.go('home')
```

## Event bus (`src/core/events.ts`)

Kênh duy nhất giữa UI và scene. Có kiểu đầy đủ qua interface `GameEvents`.
`bus.latest(event)` trả payload gần nhất (scene khởi động muộn vẫn đọc được layout).

| Sự kiện | Phát bởi | Nghe bởi | Ý nghĩa |
|---|---|---|---|
| `game:ready` | PreloaderScene | main.ts | asset xong, mount UI |
| `screen:changed` | router | shell (tô sáng menu) | đã đổi màn |
| `stage:select` | MapScene (click đảo) | main.ts → mở modal chi tiết ải | chỉ xử lý khi đang ở `home` |
| `layout:safe-area` | ui/safe-area.ts | MapScene, BossFightScene | vùng trống (CSS px) để fit camera; `null` = full màn |
| `boss:aim` | ui/screens/boss.ts | BossFightScene | đổi góc/lực → vẽ lại đường ngắm |
| `boss:fire` | ui/screens/boss.ts | BossFightScene | bắn (demo) |

## Router & màn hình (`src/ui/router.ts`, `src/ui/screens/`)

- `ScreenId` = `'home' | 'play' | 'leaderboard' | 'badges' | 'group' | 'boss'` (`core/screens.ts`).
- Mỗi màn là một `ScreenModule { id, scene, mount(root, ctx) → cleanup }` (`screens/types.ts`),
  đăng ký trong `screens/index.ts`.
- `router.go(id, params)`:
  1. gọi cleanup của màn cũ (gỡ listener, timer, safe-area);
  2. nếu màn mới cần scene khác (`Map` ↔ `BossFight`) thì stop/start scene;
  3. đặt `body[data-screen=id]` (CSS dùng để làm mờ bản đồ phía sau các màn dạng panel);
  4. `mount()` màn mới.
- Click trong màn dùng `onAction(root, { 'ten-action': handler })` với `data-action="ten-action"`.

## Camera & độ phân giải

- Game size = kích thước CSS × `DPR` (tối đa 2), `scale.zoom = 1/DPR` → canvas sắc nét trên màn Retina.
- Mỗi scene khai báo một **view rect** trong world (`config/layout.ts`) và gọi
  `fitWorldToRect(camera, …, view, bus.latest('layout:safe-area'))` khi khởi động, khi resize,
  và khi UI báo safe-area mới.
- MapScene có 2 bố cục (`MAP_LAYOUTS.landscape | portrait`), chọn theo tỉ lệ safe-area
  (`mapLayoutFor`); khi tỉ lệ đổi chiều thì `scene.restart()`.

## Lưu ý về input

Phaser nhận cả sự kiện `pointerup` khi người dùng nhả chuột trên phần tử DOM nằm đè lên canvas.
Mọi handler click trong scene phải kiểm tra `pointer.event?.target === this.game.canvas`
(xem `MapScene.createIsland`).

## Dữ liệu

`src/data/types.ts` là hợp đồng kiểu cho API tương lai (Player, Stage, RankEntry, GroupRank,
Badge, Mission, QuizQuestion, BossInfo). `src/data/mock.ts` cung cấp dữ liệu giả cùng kiểu.
Khi có backend: tạo `src/data/api.ts` trả về cùng kiểu, thay import ở từng màn.
Đáp án câu hỏi **không** được gửi xuống client; server chấm điểm.
