# How-to: các thay đổi thường gặp

## Thêm một màn hình mới

1. Thêm id vào `ScreenId` trong `client/src/core/screens.ts`.
2. Tạo `client/src/ui/screens/<ten>.ts` theo mẫu:
   ```ts
   export const fooScreen: ScreenModule = {
     id: 'foo',
     scene: 'Map',                 // scene vẽ phía sau
     mount(root, { go, params }) {
       root.innerHTML = `<div class="screen screen--center"><section class="panel foo">…</section></div>`;
       return onAction($(root, '.screen'), { back: () => go('home') });   // trả cleanup
     },
   };
   ```
3. Đăng ký trong `client/src/ui/screens/index.ts`.
4. Nếu cần mục menu: thêm vào mảng `NAV` trong `client/src/ui/shell.ts`.
5. CSS: thêm một section `/* ==== foo ==== */` trong `client/src/styles/screens.css`.
   Nếu màn dạng panel che bản đồ, thêm `[data-screen="foo"]` vào selector làm mờ trong `styles/base.css`.

## Thêm / sửa một ải

- Dữ liệu ải: mảng `stages` trong `client/src/data/mock.ts` (sau này từ API).
- Vị trí đảo: `MAP_LAYOUTS.landscape.positions` **và** `MAP_LAYOUTS.portrait.positions`
  trong `client/src/config/layout.ts` (cả hai bố cục).
- Công trình trên đảo: `building` = key asset trong `config/assets.ts`.
- `mode: 'boss'` → mở màn Boss Fight; `'quiz'` → màn câu hỏi.

## Thêm / thay asset hình ảnh

1. Đặt file vào `client/public/assets/images/<nhom>/` (xem quy ước trong [asset-pipeline.md](asset-pipeline.md)).
2. Khai báo/sửa trong `client/src/config/assets.ts`:
   - SVG: `svg('key', 'assets/images/…/file.svg')`
   - PNG/WebP: `{ key: 'key', url: 'assets/images/…/file.png', type: 'image' }`
3. Dùng trong scene bằng `ASSETS.xxx.key`, trong DOM bằng `ASSETS.xxx.url`.
4. Nếu kích thước ảnh mới khác placeholder, chỉnh `setScale` ở chỗ dùng (MapScene: `ISLAND_SCALE`,
   scale công trình 0.52; BossFightScene: robot 0.4, boss 0.78).

## Thêm sự kiện giữa UI và scene

1. Khai báo trong `GameEvents` (`client/src/core/events.ts`) kèm comment ý nghĩa.
2. Phát: `bus.emit('ten:su-kien', payload)`; nghe: `const off = bus.on(...)`.
3. Trong scene: gỡ listener ở `this.events.once(Phaser.Scenes.Events.SHUTDOWN, …)`.
   Trong màn DOM: gỡ trong hàm cleanup của `mount`.
4. Cập nhật bảng sự kiện trong [architecture.md](architecture.md).

## Thêm icon

Thêm path SVG 24×24 vào `STROKE` (nét) hoặc `FILLED` (tô đặc) trong `client/src/ui/icons.ts`,
dùng `icon('ten', size)`.

## Thêm animation nhân vật (giai đoạn sau)

- Sprite sheet: đặt vào `public/assets/spritesheets/`, load bằng `this.load.spritesheet` trong
  PreloaderScene, tạo anim bằng `this.anims.create`. Tham khảo skill `phaser4-gamedev:phaser-animation`.
- Skeletal (Spine): dùng plugin Spine chính thức của Esoteric cho Phaser 4 (không dùng SpinePlugin cũ).
  Asset `.json + .atlas + .png` đặt trong `public/assets/atlases/`.
