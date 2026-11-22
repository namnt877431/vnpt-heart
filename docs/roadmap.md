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
| 2026-11-22 | Backend **Node.js + TypeScript (Fastify) + PostgreSQL 16 (Drizzle)**, kiểu & luật chung trong `shared/` | Cùng ngôn ngữ với client, chung công thức chấm điểm; chạy được cả Ubuntu lẫn Windows Server |
| 2026-11-22 | Demo trên **cloud Ubuntu** bằng Docker Compose + Caddy; sau có thể chuyển Ubuntu/Windows Server khác | Một lệnh cài/cập nhật; HTTPS tự động; Windows chạy Node + IIS (không đổi code) |
| 2026-11-22 | Đăng nhập **SSO/LDAP nội bộ** (provider cắm được); tạm dùng tài khoản dev đến khi CNTT gửi thông số | Không quản lý mật khẩu riêng |
| 2026-11-22 | Trang quản trị là trang thứ 2 của client (DOM + template, như game), form sinh từ khai báo | Dùng lại style, kiểu dữ liệu, "Chơi thử" bằng chính game |
| 2026-11-22 | Server chấm sao/điểm, bốc thăm Mystery; level đã đăng khóa `id`, xóa = lưu trữ | Chống sửa điểm phía trình duyệt; giữ tiến độ người chơi |
| 2026-11-22 | Bản GitHub Pages giữ chế độ demo offline (mock) | Trình diễn công khai không cần server, không có dữ liệu thật |
| 2026-11-22 | Tạm gác trình chỉnh avatar ghép bộ phận | Bộ hình mã nguồn mở không hợp phong cách; cần bộ hình chibi riêng (hướng "chọn nhân vật làm sẵn") |

## Đã xong

**MVP giao diện (v0.1)**: khung dự án, bản đồ đảo bay, BXH, huy hiệu, nhóm, responsive.

**Demo theo kịch bản (v0.2)** – chi tiết đối chiếu: [game-design.md](game-design.md)
- [x] 6 chặng × 6 level (có Mystery và Boss mỗi chặng), đường level kiểu Candy Crush, mở khóa tuần tự
- [x] 10 dạng mini-game: Nếu là bạn?, Chọn cách nói, Soi lỗi, Ghép đúng, Sắp xếp/Time Attack, Đúng hay sai?, Tìm mối nguy, Điều tra sự cố, Escape Room, Boss Challenge
- [x] Mystery Level (6 kết quả), 1–3 sao, điểm, Double XP, xem giải thích, chơi lại
- [x] "Kho trò chơi" chơi thử mọi dạng; robot đồng hành (giới thiệu chặng, phản hồi đúng/sai)
- [x] BXH tuần/tháng/toàn mùa, vinh danh, thành phần điểm nhóm; form chia sẻ tình huống thực tế
- [x] Tiến độ lưu trình duyệt, cấp độ/XP tính từ điểm

**Backend + quản trị (v0.3)** – chi tiết: [backend.md](backend.md), cài đặt: [../deploy/README.md](../deploy/README.md)
- [x] Server Fastify + PostgreSQL: người dùng, phiên, nội dung, lượt chơi, kỷ lục, BXH tuần/tháng/mùa, nhóm, vinh danh, huy hiệu, tình huống, mùa, nhật ký
- [x] Đăng nhập dev / LDAP; tự cấp quyền admin theo `ADMIN_USERNAMES`
- [x] Server chấm điểm + chặn kết quả bất hợp lý; Mystery bốc thăm ở server, trần điểm thưởng/ngày
- [x] Client chế độ api (đăng nhập, tiến độ & BXH thật), vẫn giữ chế độ demo
- [x] Trang quản trị: soạn level 10 dạng (form + JSON), chơi thử, đăng/hẹn giờ/gỡ, lịch sử & khôi phục; sửa chặng; duyệt tình huống → tạo level; người dùng/nhóm/import CSV; mùa & trao huy hiệu; thống kê; nhật ký; cấu hình
- [x] Docker Compose (PostgreSQL, API, Caddy HTTPS), backup hằng ngày, hướng dẫn Ubuntu + Windows Server
- [x] Ổn định: hàng đợi gửi lại kết quả khi mất mạng (không ghi trùng), timeout + thử lại API, font tự host, cache đúng; nhật ký lỗi theo tài khoản, chia nguyên nhân mạng / trình duyệt / cấu hình / máy chủ

## Tiếp theo (gợi ý thứ tự)

**Trước khi mở cho nhân viên:** CNTT gửi thông số LDAP (URL, Base DN, tài khoản dịch vụ, thuộc tính tên đăng nhập)
→ `AUTH_PROVIDER=ldap`; cài lên cloud Ubuntu (trong lúc còn tài khoản dev: chỉ mở cho mạng nội bộ/giới hạn IP);
chuyển repo sang private; tên miền + HTTPS; import danh sách nhóm; BTC chốt trọng số điểm nhóm.

**Kỹ thuật còn lại:** test trình duyệt tự động chạy mỗi lần push (CI); chạy thử tải vài trăm người; gỡ đáp án khỏi `GET /content` và chấm từng câu ở server; luật trao huy hiệu tự động;
tải ảnh cảnh "Tìm mối nguy" mới; CI tự deploy lên server; thêm chặng thứ 7+ (vị trí đảo trên bản đồ);
gói giao diện theo dịp lễ (Quốc khánh, Tết… — đổi màu/hình/nhạc theo lịch, biểu tượng quốc gia dùng file chuẩn);
trình chỉnh avatar (bộ nhân vật chibi riêng).

1. **Nội dung**: BTC cung cấp Sổ tay văn hóa, Bộ chuẩn mực & quy tắc, ATVSLĐ/5S, quy trình; soạn
   thành level trong trang quản trị (thay nội dung mẫu `TODO(content)`), mỗi chặng 10–20 level.
2. **Chốt luật**: trọng số điểm nhóm (TB + tham gia + thành tích kỳ), quy đổi điểm → cấp, tiêu chí vinh danh/huy hiệu.
3. **Đồ họa & âm thanh**: asset thật theo [asset-pipeline.md](asset-pipeline.md), nhạc nền, SFX, animation robot.
4. **Game mở rộng**: "Mô phỏng một ngày làm việc", thêm cảnh "Tìm mối nguy" (hiện trường, phòng máy), Boss tháng.
5. **Vận hành**: thông báo/sự kiện từ robot, nhắc mở level mới hằng tuần, báo cáo thống kê xuất Excel.
