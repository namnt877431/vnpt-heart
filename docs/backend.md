# Backend, CSDL & trang quản trị

```
shared/   TS thuần dùng chung client ↔ server (không import npm, không DOM/Node)
server/   API Fastify 5 + Drizzle ORM + PostgreSQL 16
client/   game (index.html) + trang quản trị (admin.html, src/admin/)
deploy/   Docker Compose (db, api, Caddy), backup, hướng dẫn cài — xem deploy/README.md
```

## Hai chế độ của client

| | `npm run dev` / `build` (mặc định) | `npm run dev:api` / `build:api` |
|---|---|---|
| Dùng cho | Bản demo GitHub Pages | Máy chủ thật |
| Nội dung | `client/src/data/content/*.ts` | `GET /api/content` (soạn trong admin) |
| Tiến độ | localStorage | Server (`POST /api/plays`) |
| BXH, nhóm, huy hiệu | `data/mock.ts` | API |
| Đăng nhập, admin.html | Không | Có |

Biến `VITE_BACKEND=api` (file `client/.env.api`) bật chế độ API; `data/api.ts` export `API_MODE`.
Màn hình không phân biệt chế độ: đọc qua `core/progress.ts` (đồng bộ) và `data/selectors.ts` (`fetch*`, async).

Thứ tự khởi động ở chế độ API (`main.ts`): `GET /me` (hoặc form đăng nhập) → `GET /content` (`setChapters`)
→ `GET /progress` → mới tạo Phaser game. `?preview=<levelId>` mở thẳng level nháp cho BTC, không lưu.

## Chạy local (Windows/macOS/Linux, không cần Docker)

```bash
cd server && npm install
cp .env.example .env          # DATABASE_URL=pglite://./.data/pglite (PostgreSQL nhúng), AUTH_PROVIDER=dev
npm run db:seed               # 6 chặng mẫu + tài khoản dev (mật khẩu vnpt@123)
npm run dev                   # http://localhost:3000

cd ../client && npm run dev:api   # http://localhost:5173 (proxy /api, /uploads -> :3000)
                                  # quản trị: http://localhost:5173/admin.html
```

Tài khoản dev: `admin` (quản trị), `btc` (soạn nội dung), `lan`, `dung`, `hoang`, `mai`, `anh` (người chơi).

> PGlite chỉ cho **một tiến trình** mở thư mục dữ liệu. Không chạy 2 server cùng `.data/pglite`; tắt server
> bằng Ctrl+C (không kill cứng giữa lúc ghi), nếu không dữ liệu có thể hỏng — khi đó đổi tên thư mục và `npm run db:seed` lại.
> Máy chủ thật dùng PostgreSQL nên không có giới hạn này.

## Mạng chập chờn & theo dõi lỗi

- **Gọi API**: mọi request có thời gian chờ 15 giây; lệnh đọc (GET) tự thử lại 1 lần khi mất mạng/lỗi máy chủ (`data/api.ts`).
- **Hàng đợi kết quả** (`core/progress.ts`): kết quả chơi vào hàng đợi trong localStorage rồi mới gửi; mất mạng thì
  giữ lại và tự gửi lại khi có mạng, mỗi 20 giây, và ở lần vào game sau. Mỗi kết quả có `clientId` ngẫu nhiên,
  server (`plays.client_id`, unique theo người chơi) chỉ ghi một lần dù nhận nhiều lần. Người chơi thấy viên báo
  "Mất kết nối · N kết quả sẽ tự gửi khi có mạng".
- **Font tự host** (`styles/fonts.css`, gói `@fontsource`): không phụ thuộc Google Fonts (mạng nội bộ có thể chặn).
- **Cache** (Caddy): file có mã băm (`/assets/*-xxxxxxxx.js|css|woff2`) cache vĩnh viễn; HTML và ảnh giữ tên
  thì kiểm tra lại mỗi lần (304 rẻ) nên bản mới, ảnh/chủ đề mới hiện ngay.
- **Nhật ký lỗi** — trang quản trị → **Lỗi hệ thống**. `error_reports` = mỗi loại lỗi một dòng (gom theo dấu vân tay,
  có số lần, số tài khoản, trình duyệt); `error_events` = **từng lần gặp**: tài khoản, giờ, trình duyệt, IP, trang, chi tiết.
  Lọc theo nguyên nhân và theo tài khoản; bấm tên trong bảng để chỉ xem lỗi của người đó. Giữ 30 ngày.
  "Đã xử lý" xóa loại lỗi đó, nếu lặp lại sẽ hiện lại.

  | Nguyên nhân | Ghi khi nào | Ở đâu |
  |---|---|---|
  | **Mạng** | Mất kết nối (ghi khi có mạng lại: kéo dài bao lâu, mấy yêu cầu lỗi, trình duyệt có báo offline không, loại mạng 4g/3g), máy chủ chậm quá 15 giây, file tải hỏng nhưng vẫn có trên máy chủ, tải mã game bị gián đoạn | `core/error-report.ts` + `data/api.ts` (`setNetObserver`) |
  | **Trình duyệt** | Lỗi script chưa bắt trên máy người chơi. Xem cột trình duyệt: chỉ 1 loại/bản cũ bị → do trình duyệt; loại nào cũng bị → lỗi game | `core/error-report.ts` |
  | **Cấu hình** | Proxy báo 502/503/504 (dịch vụ API không chạy), file thiếu trên máy chủ (404), máy chủ không kết nối được LDAP/CSDL, sai mật khẩu trong `.env`, thiếu thư mục, chứng chỉ TLS | client + `services/errors.ts` (`classifyServerError`), `routes/auth.ts` (LDAP → 503) |
  | **Máy chủ** | Lỗi 500 còn lại (lỗi trong mã server) | `app.ts` (error handler) |

  Báo lỗi lúc mất mạng/API sập được giữ trong localStorage (`vnpt-heart:error-queue`) và gửi khi kết nối lại, kèm giờ
  xảy ra thật. Mỗi lỗi gửi 1 lần/lượt vào, tối đa 20; bỏ qua "Script error." không có nội dung (thường do extension).
  Chỉ gửi nội dung lỗi, trang, thông tin kết nối — không gửi dữ liệu form/đáp án.

## Server (`server/src/`)

```
config.ts          biến môi trường (.env)
app.ts             dựng Fastify: cookie, rate-limit, multipart, phiên đăng nhập, lỗi -> { error }
http.ts            HttpError, requireUser, requireRole (editor ⊂ admin)
db/schema.ts       bảng (Drizzle); db/client.ts mở PostgreSQL hoặc PGlite + chạy migration
db/seed.ts         dữ liệu ban đầu (idempotent, không ghi đè)
auth/              provider dev | ldap (interface AuthProvider), session (cookie httpOnly, lưu sha256)
services/          content (nội dung đã đăng), player (chấm điểm, mystery), leaderboard, spec-schema (zod),
                   settings, time (mốc tuần/tháng/mùa theo giờ VN), audit
routes/            auth, player, admin/{content,people,ops}
```

- **Chấm điểm**: `POST /plays` gửi `{levelId, correct, total, timeMs, failed}`; server kiểm tra level đã mở
  (luật `shared/progress-rules.ts`), `total` khớp spec, thời gian không nhanh bất thường
  (`shared/scoring.ts` → `invalidResult`), rồi tự tính sao/điểm bằng chính công thức client dùng.
  Điểm cộng vào tổng = phần vượt kỷ lục cũ (`plays.gained`).
- **Mystery**: `POST /mystery/:levelId` — server bốc thăm (`shared/mystery.ts`), cộng quà (có trần/ngày),
  hoặc lưu thử thách vào `player_state.pending_mystery` để chấm khi nộp kết quả.
- **BXH** kỳ = tổng `plays.gained` + `point_events.amount` trong kỳ. Tuần bắt đầu thứ Hai 00:00 giờ VN;
  "Toàn mùa" theo bảng `seasons` (không có mùa đang diễn ra = toàn thời gian).
- **Điểm nhóm** = Điểm TB × a + Tỷ lệ tham gia × b + Thành tích kỳ × c (hệ số trong *Cấu hình*).
- **Còn tin client ở**: `correct` và `timeMs` (đáp án vẫn gửi xuống trình duyệt). Giai đoạn sau: gỡ đáp án
  khỏi `GET /content` và cho server chấm từng câu trả lời.

## API

Người chơi (cần đăng nhập): `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`,
`GET /api/content`, `GET /api/progress`, `PATCH /api/progress/state`, `POST /api/plays`,
`POST /api/mystery/:levelId`, `POST /api/stories`, `POST /api/client-errors` (không cần đăng nhập), `GET /api/leaderboard?period=week|month|season`,
`GET /api/groups/ranking`, `GET /api/groups/mine`, `GET /api/honors`, `GET /api/badges/mine`.

Quản trị (`/api/admin`, quyền editor trở lên; đổi quyền/nhóm/mùa/cấu hình cần admin):
`content`, `chapters/:id`, `chapters/:id/order`, `levels` (CRUD), `levels/:id/publish|unpublish`,
`levels/:id/revisions[/:rev/restore]`, `uploads`, `stories`, `users`, `users/import`, `groups`,
`seasons`, `badges`, `badges/:id/award`, `stats`, `errors?category=&q=`, `errors/:id/events`, `audit`, `settings`.

Kiểu request/response: `shared/api-types.ts`.

## Trang quản trị (`client/src/admin/`)

- `main.ts` — đăng nhập, menu, router theo hash (`#/content`, `#/level/<id|new>`, `#/stories`…).
- `forms/engine.ts` — bộ sinh form khai báo (text, danh sách lặp, phương án + đáp án đúng, đánh dấu lỗi
  `[[sai|vì sao]]`, đặt điểm nguy trên ảnh); `forms/specs.ts` — form + mẫu của 10 dạng game.
- `views/*` — từng màn. Mọi giá trị động qua `esc()` như phần game.
- Level đã đăng: **khóa mã và chặng** (tiến độ gắn với `id`); xóa = lưu trữ. Mỗi lần lưu tạo một bản
  trong lịch sử, khôi phục được.

## Thay đổi CSDL

1. Sửa `server/src/db/schema.ts`.
2. `cd server && npm run db:generate` → file SQL mới trong `server/drizzle/` (commit file này).
3. Server tự chạy migration khi khởi động (local và Docker).

## Test

`cd server && npm test` — vitest trên PostgreSQL nhúng trong bộ nhớ: luật sao/điểm, schema 10 dạng
(kể cả toàn bộ level mẫu), mở khóa, chống gian lận, BXH, quyền, đăng/hẹn giờ/lịch sử level, import.
