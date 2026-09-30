# Roadmap & quyết định

## Quyết định đã chốt

| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-09-30 | Game **web HTML5**, không cài đặt | Nhân viên mở link là chơi, cập nhật tập trung, chạy PC + điện thoại |
| 2026-09-30 | **Phaser 4.2 + Vite + TypeScript** (thay vì Cocos Creator) | Code-first, AI agent viết/bảo trì được hoàn toàn bằng code; Cocos cần editor GUI |
| 2026-09-30 | UI chữ/số bằng **DOM**, thế giới game bằng **Phaser** | Tiếng Việt sắc nét, responsive, dễ bảo trì |
| 2026-09-30 | Phong cách **lấy cảm hứng Gunny**, không dùng asset Gunny | Bản quyền 7Road/VNG |
| 2026-09-30 | Ải 4 Boss Fight = **trả lời đúng → được bắn góc/lực** | Giữ mục tiêu học văn hóa, thêm cảm giác Gunny |
| 2026-09-30 | Không dùng skill `spine-animation-ai` | Giấy phép PolyForm Noncommercial, không hợp dùng trong doanh nghiệp |

## Đã xong – MVP giao diện

- [x] Khung dự án, cấu trúc thư mục, tài liệu cho AI agent
- [x] Bản đồ đảo bay 5 ải (bố cục ngang + dọc), đường nối động, mây, robot, ghim ải hiện tại
- [x] Trang chủ: hồ sơ, XP, sao, BXH tuần/nhóm, nhiệm vụ hôm nay, nút Bắt đầu, dock tiện ích
- [x] Màn câu hỏi (chọn đáp án, đếm giờ hiển thị, gợi ý)
- [x] BXH (bục top 3, danh sách, hạng của tôi), Huy hiệu, Nhóm
- [x] Modal chi tiết ải, hướng dẫn, toast
- [x] Boss Fight: HUD kiểu Gunny (HP, lượt, gió, góc, lực, vật phẩm, nút BẮN), câu hỏi giành lượt, bắn demo
- [x] Responsive 1600×900 / 1280×720 / điện thoại 390×844

## Tiếp theo (gợi ý thứ tự)

1. **Nội dung**: nhận 8 chuẩn mực hành vi + ngân hàng câu hỏi chính thức (thay `TODO(content)`).
2. **Đồ họa**: chốt style + làm asset AI theo [asset-pipeline.md](asset-pipeline.md); logo chính thức.
3. **Backend** (`server/`): đăng nhập nhân viên, API người chơi/ải/câu hỏi/điểm/BXH/nhóm/huy hiệu,
   chấm điểm phía server, trang quản trị nhập câu hỏi.
4. **Logic game**: luồng câu hỏi (chấm, chuyển câu, tính sao), mở khóa ải, nhiệm vụ ngày, huy hiệu.
5. **Boss Fight thật**: lượt, gió ngẫu nhiên, sát thương, HP, vật phẩm, thắng/thua, boss phản công.
6. **Âm thanh & animation**: nhạc nền, SFX, animation nhân vật (sprite sheet hoặc Spine).
7. **Vận hành**: build/deploy nội bộ, thống kê.
