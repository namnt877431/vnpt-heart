# How-to: các thay đổi thường gặp

## Sửa / thêm nội dung (không cần biết code game)

**Bản chạy thật:** BTC soạn trong trang quản trị (`/admin.html` → *Nội dung* → *Thêm level*): chọn dạng
trò chơi, điền form, **Chơi thử**, rồi **Đăng ngay** hoặc **Hẹn giờ đăng**. Không cần sửa code.

**Bản demo / dữ liệu seed:** nội dung mẫu nằm trong `client/src/data/content/`, mỗi chặng một file. Mỗi level:

```ts
{ id: 'van-hoa-7', kind: 'normal', spec: { type: 'choice', title: '…', intro: '…', questions: [ … ] } }
```

- `id` phải **duy nhất** và **không đổi** sau khi phát hành (là khóa lưu tiến độ).
- `kind`: `'normal'` | `'mystery'` (không cần `spec`) | `'boss'` (đặt cuối chặng, `spec.type = 'boss'`).
- Các trường của từng `type` xem trong `client/src/data/game-types.ts` (có comment từng trường).
- `timeLimitSec`: bật đồng hồ đếm ngược; `parTimeSec`: phải xong trong thời gian này mới được 3 sao.
- Mỗi câu hỏi nên có `explain`, hiển thị trong phần "Xem kiến thức & giải thích".

## Thêm một chặng mới

Bản đồ có sẵn 6 vị trí đảo (6 chặng). Trang quản trị cho sửa tên/mô tả/lời giới thiệu chặng, chưa cho
thêm chặng thứ 7 (cần thêm vị trí đảo trước). Thêm chặng mới bằng code:

1. Tạo `client/src/data/content/<id>.ts` export một `Chapter` (xem các file có sẵn).
2. Thêm vào mảng `CHAPTERS` trong `data/content/index.ts` (thứ tự = `order`).
3. Thêm vị trí đảo cho `order` mới trong **cả hai** bố cục `MAP_LAYOUTS.landscape/portrait`
   (`client/src/config/layout.ts`); nếu quá chật thì nới `view.width/height`.
4. Công trình trên đảo: thêm SVG/PNG vào `public/assets/images/buildings/` và khai báo trong
   `config/assets.ts`; đặt `building` của chặng bằng key đó.
5. Bản có backend: chạy lại `npm run db:seed` (chỉ thêm chặng/level chưa có) hoặc thêm qua SQL.
   Server hiện tối đa `MAX_CHAPTERS = 6` (`server/src/services/content.ts`) — nâng cùng lúc với bố cục bản đồ.

## Thêm một dạng mini-game mới

1. Khai báo spec trong `shared/game-types.ts`: interface mới + thêm vào union `GameSpec` + thêm vào `GAME_TYPE_INFO`.
2. Tạo `client/src/ui/games/<type>.ts` export một `GameModule` (xem `types.ts`):
   - `mount(root, spec, api)` vẽ giao diện, khi xong gọi `api.finish({ correct, total, notes })`;
   - dùng `api.robot(text, mood)` để robot phản hồi;
   - trả về `{ destroy, timeout? }` (gỡ listener; `timeout` trả kết quả dở dang khi hết giờ).
3. Đăng ký trong `ui/games/index.ts` (TypeScript báo lỗi nếu quên).
4. CSS: thêm một section trong `client/src/styles/games.css`.
5. Nếu game cần scene Phaser riêng (như Boss), đặt `scene: '<SceneKey>'` và `fullScreen: true`.
6. Server & admin (TypeScript báo lỗi ở các `switch` nếu quên):
   - `shared/scoring.ts` → `expectedTotal`: `total` mà game báo khi chơi xong (server dùng để chặn gian lận);
   - `server/src/services/spec-schema.ts`: schema zod kiểm tra nội dung BTC lưu;
   - `client/src/admin/forms/specs.ts`: form (`SPEC_FIELDS`) + mẫu level mới (`newSpec`).
7. `cd server && npm test` — test "every sample level" chạy schema trên mọi level mẫu.

## Thêm API / thay đổi CSDL

1. Kiểu request/response trong `shared/api-types.ts`.
2. Route trong `server/src/routes/` (người chơi) hoặc `routes/admin/` (quyền `requireRole(req, 'editor' | 'admin')`),
   kiểm tra body bằng zod, lỗi trả `throw new HttpError(status, 'thông điệp tiếng Việt')`; thao tác quản trị ghi `audit()`.
3. Đổi bảng: sửa `server/src/db/schema.ts` → `npm run db:generate` → commit file trong `server/drizzle/`.
4. Client gọi qua `data/api.ts` (`apiGet`, `apiPost`, `api`); màn hình người chơi phải có nhánh demo (mock).
5. Thêm test trong `server/test/`.

## Thêm một màn hình mới

1. Thêm id vào `ScreenId` trong `client/src/core/screens.ts`.
2. Tạo `client/src/ui/screens/<ten>.ts` export `ScreenModule` (`mount` trả về hàm cleanup).
3. Đăng ký trong `client/src/ui/screens/index.ts`; nếu cần mục menu: mảng `NAV` trong `ui/shell.ts`.
4. CSS trong `styles/screens.css` hoặc `styles/games.css`. Bản đồ phía sau tự làm mờ ở mọi màn
   trừ `home` (selector `body[data-scene="Map"]:not([data-screen="home"])`).

## Thêm / thay asset hình ảnh

1. Đặt file vào `client/public/assets/images/<nhom>/` (quy ước: [asset-pipeline.md](asset-pipeline.md)).
2. Khai báo/sửa trong `client/src/config/assets.ts`:
   - SVG: `svg('key', 'assets/images/…/file.svg')`
   - PNG/WebP: `{ key: 'key', url: 'assets/images/…/file.png', type: 'image' }`
3. Scene dùng `ASSETS.xxx.key`; DOM dùng `ASSETS.xxx.url` hoặc `assetUrlByKey(key)`.

## Thêm sự kiện giữa UI và scene

1. Khai báo trong `GameEvents` (`client/src/core/events.ts`) kèm comment.
2. Phát `bus.emit(...)`, nghe `const off = bus.on(...)`; gỡ listener khi scene SHUTDOWN / khi màn cleanup.
3. Cập nhật bảng sự kiện trong [architecture.md](architecture.md).

## Playtest nhanh (dev)

- Demo: `npm run dev`. Có server: xem [backend.md](backend.md) mục "Chạy local" (`npm run dev:api`).
- `npm run dev`, mở http://localhost:5173.
- Menu **Chơi game** → "Chơi thử" từng dạng (không lưu tiến độ).
- Console: `__BUS__.emit('chapter:select', { chapterId: 'an-toan' })`, `__PHASER_GAME__`.
- Đặt lại tiến độ: Trang chủ → Cài đặt → "Đặt lại tiến độ demo" (hoặc xóa localStorage `vnpt-heart:progress:v1`).
