# VNPT Heart – Hành trình văn hóa VNPT Đắk Lắk

Game web (HTML5) học văn hóa doanh nghiệp cho nhân viên VNPT Đắk Lắk. Phong cách hình ảnh
tham khảo Gunny: nhân vật chibi 2D, đảo bay, UI viền dày, nút bóng 3D. Có 5 ải trên bản đồ,
câu hỏi trắc nghiệm, màn Boss Fight kiểu bắn góc, XP/sao, BXH cá nhân và nhóm, huy hiệu.

**Trạng thái:** MVP giao diện (chưa có backend, dữ liệu là mock). Xem [docs/roadmap.md](docs/roadmap.md).

## Đọc gì trước

| Cần làm | Đọc |
|---|---|
| Hiểu kiến trúc, luồng dữ liệu | [docs/architecture.md](docs/architecture.md) |
| Thêm màn hình / ải / sự kiện / asset | [docs/how-to.md](docs/how-to.md) |
| Tạo/thay hình ảnh bằng AI (Scenario, Higgsfield) | [docs/asset-pipeline.md](docs/asset-pipeline.md) |
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
        ├── config/            # assets.ts (manifest), layout.ts (toạ độ world), theme.ts (màu/font Phaser)
        ├── core/              # events.ts (event bus có kiểu), screens.ts (ScreenId), display.ts (DPR, camera fit)
        ├── data/              # types.ts (kiểu domain = hợp đồng API), mock.ts (dữ liệu giả)
        ├── scenes/            # Phaser: Boot -> Preloader -> Map | BossFight
        ├── ui/                # lớp DOM: shell, router, screens/, components/, icons, dom helpers
        └── styles/            # tokens.css, base.css, components.css, screens.css
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
   (8 chuẩn mực hành vi, ngân hàng câu hỏi). Không tự bịa nội dung "chính thức".
10. Không dùng/copy asset, nhân vật, giao diện gốc của Gunny (bản quyền 7Road/VNG), chỉ lấy cảm hứng phong cách.
    Logo VNPT: dùng file chính thức do đơn vị cung cấp, không để AI vẽ lại.

## Kiểm tra sau khi sửa

- `npx tsc --noEmit` trong `client/` phải sạch.
- Chạy `npm run dev`, xem ở 3 cỡ: 1600×900, 1280×720, 390×844 (điện thoại). Bản đồ tự đổi bố cục
  ngang/dọc theo tỉ lệ vùng trống (`MAP_LAYOUTS` trong `config/layout.ts`).
- Ở chế độ dev, `window.__PHASER_GAME__` trỏ tới instance Phaser để debug/playtest.

## Skill & công cụ có sẵn

- `phaser4-gamedev:*` (plugin): scene, animation, particles, UI, mobile, playtest cho Phaser 4.
- `scenario-*` (trong `.claude/skills/`): tạo ảnh, giữ nhân vật đồng nhất, sprite animation, game assets, quality gate.
  Cần đăng nhập Scenario MCP (`/mcp` → scenario) trước khi dùng.
- Higgsfield (connector claude.ai, nếu được kết nối): tạo ảnh, xóa nền, upscale — thay thế cho Scenario.
