# VNPT Heart – Hành trình văn hóa VNPT Đắk Lắk

Web game nội bộ VNPT Đắk Lắk: "học mà chơi" văn hóa, quy tắc, tình huống thực tế, ATVSLĐ-5S,
quy trình, ứng dụng AI. Cấu trúc **Bản đồ → Chặng → Level → Mini-game → Sao → Mở khóa** (kiểu Candy Crush),
phong cách hình ảnh tham khảo Gunny, cuối mỗi chặng là Boss Challenge bắn góc/lực. Robot VNPT đồng hành.

**Trạng thái:** v0.3 — có backend (`server/`, PostgreSQL), đăng nhập (dev/LDAP), trang quản trị cho BTC
(`client/admin.html`), đóng gói Docker cho Ubuntu (`deploy/`). Bản demo GitHub Pages vẫn chạy offline (mock).
Xem [docs/backend.md](docs/backend.md), [docs/game-design.md](docs/game-design.md), [docs/roadmap.md](docs/roadmap.md).

## Đọc gì trước

| Cần làm | Đọc |
|---|---|
| Hiểu kiến trúc, luồng dữ liệu | [docs/architecture.md](docs/architecture.md) |
| Server, CSDL, API, trang quản trị, 2 chế độ client | [docs/backend.md](docs/backend.md) |
| Cài/cập nhật/sao lưu trên máy chủ (Ubuntu, Windows Server) | [deploy/README.md](deploy/README.md) |
| Thêm màn hình / ải / sự kiện / asset | [docs/how-to.md](docs/how-to.md) |
| Tạo/thay hình ảnh bằng AI (Scenario, Higgsfield) | [docs/asset-pipeline.md](docs/asset-pipeline.md) |
| Kịch bản BTC ↔ tính năng đã làm (chặng, dạng game, thi đua, vận hành) | [docs/game-design.md](docs/game-design.md) |
| Việc tiếp theo, quyết định đã chốt | [docs/roadmap.md](docs/roadmap.md) |

## Chạy

```bash
# Bản demo offline (mock, như GitHub Pages)
cd client && npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build -> client/dist
npx tsc --noEmit   # kiểm tra kiểu nhanh

# Bản có backend (không cần Docker: PostgreSQL nhúng PGlite)
cd server && npm install && cp .env.example .env
npm run db:seed && npm run dev           # API :3000; tài khoản dev admin/btc/lan… mật khẩu vnpt@123
cd ../client && npm run dev:api          # game :5173, quản trị :5173/admin.html
cd ../server && npm test                 # vitest
```

## Deploy

- Repo: https://github.com/namnt877431/vnpt-heart (public) — bản demo: https://namnt877431.github.io/vnpt-heart/
- Push lên `main` → workflow `.github/workflows/deploy.yml` tự build `client/` và đăng lên GitHub Pages (~1 phút).
- Bản demo công khai: chỉ dùng dữ liệu mock, không đưa dữ liệu nhân viên thật lên đây.
- Máy chủ thật (Ubuntu): `docker compose -f deploy/docker-compose.yml up -d --build` — xem [deploy/README.md](deploy/README.md)
  (có mục Windows Server + IIS).

## Cấu trúc thư mục

```
GameVNPT/
├── CLAUDE.md / AGENTS.md      # hướng dẫn cho AI agent (file này)
├── docs/                      # kiến trúc, backend, how-to, asset pipeline, roadmap
├── shared/                    # TS thuần dùng chung client ↔ server: kiểu spec, luật sao/điểm, mở khóa, mystery, kiểu API
├── server/                    # API Fastify + Drizzle + PostgreSQL (src/, drizzle/ migration, test/)
├── deploy/                    # docker-compose (db, api, Caddy), Caddyfile, backup.sh, README cài đặt
├── .claude/skills/            # skill Scenario (tạo asset AI) — cài bằng `npx skills`
├── .claude/settings.json      # bật plugin phaser4-gamedev (skill Phaser 4)
├── .mcp.json                  # Scenario MCP server (cần đăng nhập /mcp)
└── client/                    # game web: Phaser 4 + Vite + TypeScript
    ├── index.html             # 2 lớp: #game-container (canvas) + #ui (DOM)
    ├── admin.html             # trang quản trị (chỉ build ở chế độ api)
    ├── public/assets/
    │   ├── images/{characters,buildings,environment}/   # SVG placeholder -> thay bằng PNG AI
    │   ├── spritesheets/ atlases/ audio/ tilemaps/       # dành sẵn cho giai đoạn sau
    └── src/
        ├── main.ts            # khởi tạo Phaser + mount UI khi 'game:ready'
        ├── config/            # assets.ts (manifest), layout.ts (toạ độ world), theme.ts, demo.ts (công tắc demo)
        ├── core/              # events.ts (bus), screens.ts, display.ts, progress.ts (tiến độ), scoring.ts (sao/điểm)
        ├── data/
        │   ├── content/       # nội dung MẪU cho bản demo + seed (nội dung chính thức soạn trong admin)
        │   ├── game-types.ts, types.ts   # re-export từ shared/
        │   ├── api.ts         # fetch /api, API_MODE; player.ts (người đang đăng nhập)
        │   ├── mock.ts, selectors.ts     # demo: mock; api: fetch* từ server (cùng kiểu)
        ├── scenes/            # Phaser: Boot -> Preloader -> Map | BossFight
        ├── admin/             # trang quản trị: main.ts, forms/ (bộ sinh form 10 dạng), views/
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
4. **Dữ liệu chỉ lấy từ `src/data/`** (game) và qua API (`data/api.ts`). Kiểu dùng chung nằm trong `shared/`;
   `shared/` không import npm và không dùng DOM/Node. Màn hình phải chạy được ở **cả hai chế độ** (demo + api).
5. **Mọi giá trị động chèn vào template HTML phải qua `esc()`** (`src/ui/dom.ts`).
6. **Màu/font:** CSS dùng token trong `styles/tokens.css`; Phaser dùng `config/theme.ts`. Đổi màu phải sửa cả hai.
7. **Phaser 4.2** (không phải Phaser 3): dùng `Phaser.Math.Vector2` (không có `Geom.Point`), không dùng
   geometry mask, Spine dùng plugin chính thức của Esoteric. Tra skill `phaser4-gamedev:phaser-migrate` khi nghi ngờ API.
8. Canvas render ở độ phân giải thiết bị (`DPR`): toạ độ DOM phải nhân `DPR` khi dùng trong scene
   (đã gói trong `fitWorldToRect`).
9. Nội dung đánh dấu `TODO(content)` là placeholder, phải thay bằng tài liệu chính thức của VNPT
   (sổ tay văn hóa, chuẩn mực, quy trình, ATVSLĐ). Không tự bịa nội dung "chính thức".
   Nội dung chính thức do BTC soạn trong trang quản trị (lưu CSDL); `data/content/` chỉ là mẫu cho demo/seed.
   `id` level không được đổi sau khi phát hành (khóa tiến độ) — server khóa sẵn.
10. Không dùng/copy asset, nhân vật, giao diện gốc của Gunny (bản quyền 7Road/VNG), chỉ lấy cảm hứng phong cách.
    Logo VNPT: dùng file chính thức do đơn vị cung cấp, không để AI vẽ lại.
11. Mini-game mới = spec trong `shared/game-types.ts` + module trong `ui/games/` + đăng ký registry
    + `expectedTotal` trong `shared/scoring.ts` + schema zod `server/src/services/spec-schema.ts`
    + form admin `client/src/admin/forms/specs.ts` (xem docs/how-to.md). Game gọi `api.finish()`; không tự tính sao/lưu tiến độ.
12. File kịch bản `.docx` của BTC là tài liệu nội bộ: không commit (đã có trong `.gitignore`).
13. **Server là nơi quyết định** điểm, sao, mở khóa, phần thưởng Mystery. Client chỉ hiển thị tạm rồi lấy số của server.
    Đổi CSDL = sửa `server/src/db/schema.ts` → `npm run db:generate` → commit migration.
14. Không commit `server/.env`, `deploy/.env`, dữ liệu nhân viên thật. Repo đang công khai.

## Kiểm tra sau khi sửa

- `npx tsc --noEmit` trong `client/` và `server/` phải sạch; `npm test` trong `server/` phải xanh.
- Sửa màn hình người chơi: kiểm tra cả `npm run dev` (demo) và `npm run dev:api` (có server).
- Chạy `npm run dev`, xem ở 3 cỡ: 1600×900, 1280×720, 390×844 (điện thoại). Bản đồ tự đổi bố cục
  ngang/dọc theo tỉ lệ vùng trống (`MAP_LAYOUTS` trong `config/layout.ts`).
- Ở chế độ dev, `window.__PHASER_GAME__` và `window.__BUS__` để debug/playtest.
- Mini-game: menu **Chơi game** → "Chơi thử" từng dạng, chơi hết tới modal kết quả, không có lỗi console.

## Skill & công cụ có sẵn

- `phaser4-gamedev:*` (plugin): scene, animation, particles, UI, mobile, playtest cho Phaser 4.
- `scenario-*` (trong `.claude/skills/`): tạo ảnh, giữ nhân vật đồng nhất, sprite animation, game assets, quality gate.
  Cần đăng nhập Scenario MCP (`/mcp` → scenario) trước khi dùng.
- Higgsfield (connector claude.ai, nếu được kết nối): tạo ảnh, xóa nền, upscale — thay thế cho Scenario.
