# VNPT Heart – Hành trình văn hóa VNPT Đắk Lắk

Web game nội bộ VNPT Đắk Lắk: "học mà chơi" văn hóa, quy tắc, tình huống thực tế, ATVSLĐ-5S,
quy trình, ứng dụng AI. Cấu trúc **Bản đồ → Chặng → Level → Mini-game → Sao → Mở khóa** (kiểu Candy Crush),
phong cách hình ảnh tham khảo Gunny, cuối mỗi chặng là Boss Challenge bắn góc/lực. Robot VNPT đồng hành.

**Trạng thái:** demo v0.2 theo kịch bản BTC, chưa có backend (tiến độ lưu localStorage, dữ liệu BXH là mock).
Xem [docs/game-design.md](docs/game-design.md) và [docs/roadmap.md](docs/roadmap.md).

## Đọc gì trước

| Cần làm | Đọc |
|---|---|
| Hiểu kiến trúc, luồng dữ liệu | [docs/architecture.md](docs/architecture.md) |
| Thêm màn hình / ải / sự kiện / asset | [docs/how-to.md](docs/how-to.md) |
| Tạo/thay hình ảnh bằng AI (Scenario, Higgsfield) | [docs/asset-pipeline.md](docs/asset-pipeline.md) |
| Kịch bản BTC ↔ tính năng đã làm (chặng, dạng game, thi đua, vận hành) | [docs/game-design.md](docs/game-design.md) |
| Việc tiếp theo, quyết định đã chốt | [docs/roadmap.md](docs/roadmap.md) |

## Chạy

```bash
cd client
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build -> client/dist
npx tsc --noEmit   # kiểm tra kiểu nhanh
```

## Deploy

- Repo: https://github.com/namnt877431/vnpt-heart (public) — bản demo: https://namnt877431.github.io/vnpt-heart/
- Push lên `main` → workflow `.github/workflows/deploy.yml` tự build `client/` và đăng lên GitHub Pages (~1 phút).
- Bản demo công khai: chỉ dùng dữ liệu mock, không đưa dữ liệu nhân viên thật lên đây.
- Triển khai nội bộ: `npm run build` rồi chép `client/dist/` lên IIS/Nginx (web tĩnh, `base: './'`).

## Cấu trúc thư mục

```
GameVNPT/
├── CLAUDE.md / AGENTS.md      # hướng dẫn cho AI agent (file này)
├── docs/                      # kiến trúc, how-to, asset pipeline, roadmap
├── .claude/skills/            # skill Scenario (tạo asset AI) — cài bằng `npx skills`
├── .claude/settings.json      # bật plugin phaser4-gamedev (skill Phaser 4)
├── .mcp.json                  # Scenario MCP server (cần đăng nhập /mcp)
└── client/                    # game web: Phaser 4 + Vite + TypeScript
    ├── index.html             # 2 lớp: #game-container (canvas) + #ui (DOM)
    ├── public/assets/
    │   ├── images/{characters,buildings,environment}/   # SVG placeholder -> thay bằng PNG AI
    │   ├── spritesheets/ atlases/ audio/ tilemaps/       # dành sẵn cho giai đoạn sau
    └── src/
        ├── main.ts            # khởi tạo Phaser + mount UI khi 'game:ready'
        ├── config/            # assets.ts (manifest), layout.ts (toạ độ world), theme.ts, demo.ts (công tắc demo)
        ├── core/              # events.ts (bus), screens.ts, display.ts, progress.ts (tiến độ), scoring.ts (sao/điểm)
        ├── data/
        │   ├── content/       # NỘI DUNG: mỗi chặng 1 file (level + câu hỏi) — sửa nội dung ở đây
        │   ├── game-types.ts  # kiểu spec của 10 dạng mini-game
        │   ├── types.ts, mock.ts, selectors.ts   # người chơi/BXH/nhóm (mock → API)
        ├── scenes/            # Phaser: Boot -> Preloader -> Map | BossFight
        ├── ui/
        │   ├── games/         # 10 module mini-game + registry (index.ts)
        │   ├── screens/       # home, chapter, level (+mystery), games, leaderboard, badges, group, share
        │   └── components/, shell.ts, router.ts, icons.ts, dom.ts
        └── styles/            # tokens.css, base.css, components.css, screens.css, games.css
```

## Quy tắc bắt buộc

1. **UI (DOM) và Phaser không import lẫn nhau.** Mọi giao tiếp qua `bus` trong `src/core/events.ts`.
   Thêm sự kiện = khai báo trong `GameEvents` trước.
2. **Chữ tiếng Việt, số liệu, BXH, nút bấm → DOM/CSS**, không vẽ vào ảnh. Phaser chỉ vẽ thế giới
   game (đảo, nhân vật, hiệu ứng) và nhãn ngắn.
3. **Asset chỉ khai báo trong `src/config/assets.ts`.** Code tham chiếu bằng `key`, không hard-code đường dẫn.
4. **Dữ liệu chỉ lấy từ `src/data/`.** Khi có backend, thay `mock.ts` bằng API nhưng giữ nguyên kiểu trong `types.ts`.
5. **Mọi giá trị động chèn vào template HTML phải qua `esc()`** (`src/ui/dom.ts`).
6. **Màu/font:** CSS dùng token trong `styles/tokens.css`; Phaser dùng `config/theme.ts`. Đổi màu phải sửa cả hai.
7. **Phaser 4.2** (không phải Phaser 3): dùng `Phaser.Math.Vector2` (không có `Geom.Point`), không dùng
   geometry mask, Spine dùng plugin chính thức của Esoteric. Tra skill `phaser4-gamedev:phaser-migrate` khi nghi ngờ API.
8. Canvas render ở độ phân giải thiết bị (`DPR`): toạ độ DOM phải nhân `DPR` khi dùng trong scene
   (đã gói trong `fitWorldToRect`).
9. Nội dung đánh dấu `TODO(content)` là placeholder, phải thay bằng tài liệu chính thức của VNPT
   (sổ tay văn hóa, chuẩn mực, quy trình, ATVSLĐ). Không tự bịa nội dung "chính thức".
   Nội dung chỉ nằm trong `data/content/`; `id` level không được đổi sau khi phát hành (khóa tiến độ).
10. Không dùng/copy asset, nhân vật, giao diện gốc của Gunny (bản quyền 7Road/VNG), chỉ lấy cảm hứng phong cách.
    Logo VNPT: dùng file chính thức do đơn vị cung cấp, không để AI vẽ lại.
11. Mini-game mới = spec trong `data/game-types.ts` + module trong `ui/games/` + đăng ký registry
    (xem docs/how-to.md). Game gọi `api.finish()`; không tự tính sao/lưu tiến độ.
12. File kịch bản `.docx` của BTC là tài liệu nội bộ: không commit (đã có trong `.gitignore`).

## Kiểm tra sau khi sửa

- `npx tsc --noEmit` trong `client/` phải sạch.
- Chạy `npm run dev`, xem ở 3 cỡ: 1600×900, 1280×720, 390×844 (điện thoại). Bản đồ tự đổi bố cục
  ngang/dọc theo tỉ lệ vùng trống (`MAP_LAYOUTS` trong `config/layout.ts`).
- Ở chế độ dev, `window.__PHASER_GAME__` và `window.__BUS__` để debug/playtest.
- Mini-game: menu **Chơi game** → "Chơi thử" từng dạng, chơi hết tới modal kết quả, không có lỗi console.

## Skill & công cụ có sẵn

- `phaser4-gamedev:*` (plugin): scene, animation, particles, UI, mobile, playtest cho Phaser 4.
- `scenario-*` (trong `.claude/skills/`): tạo ảnh, giữ nhân vật đồng nhất, sprite animation, game assets, quality gate.
  Cần đăng nhập Scenario MCP (`/mcp` → scenario) trước khi dùng.
- Higgsfield (connector claude.ai, nếu được kết nối): tạo ảnh, xóa nền, upscale — thay thế cho Scenario.
