# Roadmap & quyết định

## Quyết định đã chốt

| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-09-30 | Game **web HTML5**, không cài đặt | Nhân viên mở link là chơi, cập nhật tập trung, chạy PC + điện thoại |
| 2026-09-30 | **Phaser 4.2 + Vite + TypeScript** (thay vì Cocos Creator) | Code-first, AI agent viết/bảo trì được hoàn toàn bằng code; Cocos cần editor GUI |
| 2026-09-30 | UI chữ/số bằng **DOM**, thế giới game bằng **Phaser** | Tiếng Việt sắc nét, responsive, dễ bảo trì |
| 2026-09-30 | Phong cách **lấy cảm hứng Gunny**, không dùng asset Gunny | Bản quyền 7Road/VNG |
| 2026-09-30 | Boss Challenge = **trả lời đúng → được bắn góc/lực**, sai → Boss phản công | Giữ mục tiêu học, thêm cảm giác Gunny |
| 2026-09-30 | Theo kịch bản BTC: **6 chặng = 6 nhóm nội dung**, mỗi chặng nhiều level, cuối chặng là Boss | Cấu trúc Bản đồ → Chặng → Level kiểu Candy Crush |
| 2026-09-30 | Nội dung tách khỏi code (`data/content/`), mỗi level = dữ liệu + 1 dạng mini-game | BTC cập nhật nội dung hằng tuần mà không sửa logic |
| 2026-09-30 | Demo lưu tiến độ bằng localStorage, mở sẵn mọi chặng | Chưa có backend; tiện trình diễn |
| 2026-09-30 | File kịch bản `.docx` không đưa lên repo công khai | Tài liệu nội bộ |
| 2026-09-30 | Không dùng skill `spine-animation-ai` | Giấy phép PolyForm Noncommercial, không hợp dùng trong doanh nghiệp |

## Đã xong

**MVP giao diện (v0.1)**: khung dự án, bản đồ đảo bay, BXH, huy hiệu, nhóm, responsive.

**Demo theo kịch bản (v0.2)** – chi tiết đối chiếu: [game-design.md](game-design.md)
- [x] 6 chặng × 6 level (có Mystery và Boss mỗi chặng), đường level kiểu Candy Crush, mở khóa tuần tự
- [x] 10 dạng mini-game: Nếu là bạn?, Chọn cách nói, Soi lỗi, Ghép đúng, Sắp xếp/Time Attack, Đúng hay sai?, Tìm mối nguy, Điều tra sự cố, Escape Room, Boss Challenge
- [x] Mystery Level (6 kết quả), 1–3 sao, điểm, Double XP, xem giải thích, chơi lại
- [x] "Kho trò chơi" chơi thử mọi dạng; robot đồng hành (giới thiệu chặng, phản hồi đúng/sai)
- [x] BXH tuần/tháng/toàn mùa, vinh danh, thành phần điểm nhóm; form chia sẻ tình huống thực tế
- [x] Tiến độ lưu trình duyệt, cấp độ/XP tính từ điểm

## Tiếp theo (gợi ý thứ tự)

1. **Nội dung**: BTC cung cấp Sổ tay văn hóa, Bộ chuẩn mực & quy tắc, ATVSLĐ/5S, quy trình; biên tập
   thành level theo mẫu `data/content/*.ts` (thay `TODO(content)`), mỗi chặng 10–20 level.
2. **Backend** (`server/`): đăng nhập SSO nội bộ; API tiến độ/điểm/BXH/nhóm/huy hiệu; **chấm điểm phía server**
   (bỏ đáp án khỏi client); lưu tình huống chia sẻ.
3. **Trang quản trị BTC**: soạn level (form theo từng `type`), duyệt tình huống (thu thập → biên tập →
   ẩn thông tin → kịch bản → game), lịch mở level hằng tuần, trao huy hiệu hằng tháng, "Mùa chinh phục".
4. **Chốt luật**: trọng số điểm nhóm (TB + tham gia + thành tích kỳ), quy đổi điểm → cấp, tiêu chí vinh danh.
5. **Đồ họa & âm thanh**: asset thật theo [asset-pipeline.md](asset-pipeline.md), nhạc nền, SFX, animation robot.
6. **Game mở rộng**: "Mô phỏng một ngày làm việc", thêm cảnh "Tìm mối nguy" (hiện trường, phòng máy), Boss tháng.
7. **Vận hành**: deploy nội bộ, thống kê tham gia, sao lưu.
