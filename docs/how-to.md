# How-to: các thay đổi thường gặp

## Sửa / thêm nội dung (không cần biết code game)

Nội dung nằm trong `client/src/data/content/`, mỗi chặng một file. Mỗi level:

```ts
{ id: 'van-hoa-7', kind: 'normal', spec: { type: 'choice', title: '…', intro: '…', questions: [ … ] } }
```

- `id` phải **duy nhất** và **không đổi** sau khi phát hành (là khóa lưu tiến độ).
- `kind`: `'normal'` | `'mystery'` (không cần `spec`) | `'boss'` (đặt cuối chặng, `spec.type = 'boss'`).
- Các trường của từng `type` xem trong `client/src/data/game-types.ts` (có comment từng trường).
- `timeLimitSec`: bật đồng hồ đếm ngược; `parTimeSec`: phải xong trong thời gian này mới được 3 sao.
- Mỗi câu hỏi nên có `explain`, hiển thị trong phần "Xem kiến thức & giải thích".

## Thêm một chặng mới

1. Tạo `client/src/data/content/<id>.ts` export một `Chapter` (xem các file có sẵn).
2. Thêm vào mảng `CHAPTERS` trong `data/content/index.ts` (thứ tự = `order`).
3. Thêm vị trí đảo cho `order` mới trong **cả hai** bố cục `MAP_LAYOUTS.landscape/portrait`
   (`client/src/config/layout.ts`); nếu quá chật thì nới `view.width/height`.
4. Công trình trên đảo: thêm SVG/PNG vào `public/assets/images/buildings/` và khai báo trong
   `config/assets.ts`; đặt `building` của chặng bằng key đó.

## Thêm một dạng mini-game mới

1. Khai báo spec trong `data/game-types.ts`: interface mới + thêm vào union `GameSpec` + thêm vào `GAME_TYPE_INFO`.
2. Tạo `client/src/ui/games/<type>.ts` export một `GameModule` (xem `types.ts`):
   - `mount(root, spec, api)` vẽ giao diện, khi xong gọi `api.finish({ correct, total, notes })`;
   - dùng `api.robot(text, mood)` để robot phản hồi;
   - trả về `{ destroy, timeout? }` (gỡ listener; `timeout` trả kết quả dở dang khi hết giờ).
3. Đăng ký trong `ui/games/index.ts` (TypeScript báo lỗi nếu quên).
4. CSS: thêm một section trong `client/src/styles/games.css`.
5. Nếu game cần scene Phaser riêng (như Boss), đặt `scene: '<SceneKey>'` và `fullScreen: true`.

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

- `npm run dev`, mở http://localhost:5173.
- Menu **Chơi game** → "Chơi thử" từng dạng (không lưu tiến độ).
- Console: `__BUS__.emit('chapter:select', { chapterId: 'an-toan' })`, `__PHASER_GAME__`.
- Đặt lại tiến độ: Trang chủ → Cài đặt → "Đặt lại tiến độ demo" (hoặc xóa localStorage `vnpt-heart:progress:v1`).
