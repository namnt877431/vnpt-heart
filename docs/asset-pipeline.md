# Asset pipeline (hình ảnh AI → game)

Hiện tại mọi hình là **SVG placeholder vẽ tay** để dựng giao diện. Bước tiếp theo là thay bằng
hình AI theo phong cách chibi 2D kiểu Gunny. Key trong `config/assets.ts` giữ nguyên, chỉ đổi file.

## Danh sách asset cần làm

| Key | File hiện tại | Mô tả cho AI | Yêu cầu |
|---|---|---|---|
| `robot` | characters/robot.svg | Mascot robot VNPT Heart: thân trắng, tai nghe xanh, mặt kính xanh đậm, mắt cười cyan, trái tim đỏ trên ngực, đang vẫy tay | PNG nền trong suốt, ~480×600, đứng thẳng, chân chạm đáy ảnh |
| `boss` | characters/boss.svg | Quái Thờ Ơ: đám mây giông tím, sừng vàng, mắt đỏ giận dữ, răng nhọn, tia sét | PNG trong suốt, ~600×560, đáy chạm mặt đất |
| `island` | environment/island.svg | Đảo bay: mặt cỏ xanh hình elip, đáy đá nâu nhọn, bụi cây | PNG trong suốt, 800×600, mặt đảo ở ~1/3 chiều cao |
| `cloud` | environment/cloud.svg | Đám mây trắng bồng bềnh | PNG trong suốt, 640×300 |
| `tree` | environment/tree.svg | Cây tròn hoạt hình | PNG trong suốt, 160×200 |
| `bld-heart` | buildings/… | Nhà xanh trắng, biển trái tim | PNG trong suốt, gốc công trình ở đáy giữa |
| `bld-rule` | buildings/… | Toà văn phòng kính xanh, biển quyển sổ quy tắc | như trên |
| `bld-5g` | buildings/… | Cột BTS đỏ trắng, sóng tín hiệu, chảo vệ tinh | như trên |
| `bld-boss` | buildings/… | Pháo đài tối, khiên xanh tia sét | như trên |
| `bld-master` | buildings/… | Toà tháp kính cao, vương miện vàng | như trên |

**Không đưa chữ vào ảnh** (tên ải, số, tiếng Việt): chữ do code vẽ.
Logo VNPT: dùng file chính thức, đặt tại `public/assets/images/brand/`.

## Quy trình đề xuất

1. **Chốt phong cách**: skill `scenario-inspiration` (moodboard) → chọn 1 hướng.
2. **Nhân vật**: `scenario-identity-library` tạo identity "VNPT Heart Robot" → `scenario-consistency`
   để mọi tư thế giống nhau.
3. **Đạo cụ/công trình/đảo**: `scenario-game-assets` (nền trong suốt, cùng style, batch).
4. **Kiểm tra**: `scenario-quality-gate` trước khi đưa vào game.
5. **Animation**: `scenario-sprite-animation` cho sprite sheet đơn giản (idle, vẫy tay, bắn);
   hoặc tách bộ phận để rig Spine/DragonBones cho chuyển động mượt kiểu Gunny.
6. Xuất PNG → đặt vào `public/assets/images/<nhom>/` → sửa `type: 'image'` + `url` trong `config/assets.ts`.

Thay thế: connector Higgsfield (generate_image, remove_background, upscale) nếu không dùng Scenario.

## Phương án miễn phí (ưu tiên hiện tại — dự án chưa có ngân sách cho công cụ AI trả phí)

Scenario và Higgsfield đều tính credit; hiện **chưa có tài khoản trả phí**, nên mặc định:
1. Giữ và trau chuốt **SVG vẽ bằng code** (các file trong `public/assets/images/`).
2. Bổ sung asset **CC0** (ví dụ Kenney.nl) — ghi nguồn vào `public/assets/CREDITS.md`.
3. Ảnh AI từ công cụ miễn phí (giới hạn lượt) → xóa nền → PNG → thay theo bảng trên.
4. Animation: tween/particle của Phaser, sprite sheet tự làm; skeletal dùng DragonBones (miễn phí) thay Spine.

## Quy ước

- Tên file: `kebab-case`, tiền tố theo nhóm (`bld-`, `fx-`, `ui-`, `char-`).
- Ảnh gốc độ phân giải cao lưu ngoài repo (hoặc `art-source/`), chỉ đưa bản tối ưu (WebP/PNG nén) vào `public/`.
- Mỗi lần thay asset: chạy game kiểm tra scale/anchor ở cả bố cục ngang và dọc.
