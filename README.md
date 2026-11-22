# VNPT Heart – Hành trình văn hóa VNPT Đắk Lắk

Web game nội bộ "học mà chơi": văn hóa, quy tắc ứng xử, tình huống thực tế, ATVSLĐ–5S, quy trình, ứng dụng AI.
Người chơi đi qua **Bản đồ → Chặng → Level → Mini-game**, lấy sao để mở khóa level tiếp theo, cuối mỗi chặng đấu
Boss bằng cách bắn theo góc và lực. Robot VNPT đồng hành. Chạy trên trình duyệt, cả máy tính lẫn điện thoại, không cần cài đặt.

**Bản demo:** https://namnt877431.github.io/vnpt-heart/ (chạy offline với dữ liệu mẫu: không có đăng nhập,
không có trang quản trị)

## Tiến độ (cập nhật 22/11/2026, bản v0.3)

| Hạng mục | Tình trạng |
|---|---|
| Giao diện, bản đồ đảo bay, 6 chặng × 6 level, Mystery, Boss | ✅ Xong |
| 10 dạng mini-game, sao/điểm, Double XP, chơi lại, xem giải thích | ✅ Xong |
| BXH tuần/tháng/mùa, thi đua nhóm, vinh danh, huy hiệu, chia sẻ tình huống | ✅ Xong |
| Máy chủ + CSDL (PostgreSQL): lưu tiến độ, máy chủ tự chấm điểm, chặn gửi điểm giả | ✅ Xong |
| Đăng nhập: tài khoản thử (dev) và LDAP nội bộ | ✅ Xong, LDAP **chờ CNTT gửi thông số** |
| Trang quản trị cho BTC: soạn level 10 dạng, chơi thử, đăng/hẹn giờ, lịch sử; duyệt tình huống; người chơi/nhóm; mùa, huy hiệu; thống kê; cấu hình | ✅ Xong |
| Đóng gói cài máy chủ (Docker cho Ubuntu, có hướng dẫn Windows Server), sao lưu hằng ngày | ✅ Xong, **chưa cài lên máy chủ cloud** |
| Chịu được mạng chập chờn: mất mạng không mất kết quả, tự gửi lại, không ghi trùng | ✅ Xong |
| Nhật ký lỗi theo tài khoản, chia nguyên nhân mạng / trình duyệt / cấu hình / máy chủ | ✅ Xong |
| Nội dung chính thức (sổ tay văn hóa, chuẩn mực, ATVSLĐ, quy trình) | ⏳ Đang dùng nội dung **mẫu**, chờ BTC |
| Đồ họa, âm thanh chính thức | ⏳ Đang dùng hình tạm (SVG) |
| Trình chỉnh avatar | ⏸ Tạm gác (chưa có bộ hình chibi phù hợp) |

Chi tiết từng phần và quyết định đã chốt: [docs/roadmap.md](docs/roadmap.md).

## Việc cần làm trước khi mở cho nhân viên

| Việc | Ai |
|---|---|
| Gửi thông số LDAP (URL `ldaps://`, Base DN, tài khoản dịch vụ, thuộc tính tên đăng nhập), xác nhận máy chủ cloud kết nối được tới LDAP | CNTT |
| Cài lên máy chủ cloud Ubuntu, gắn tên miền + HTTPS, bật sao lưu theo [deploy/README.md](deploy/README.md) | Kỹ thuật |
| Chuyển sang `AUTH_PROVIDER=ldap`, đặt `ADMIN_USERNAMES` là tài khoản thật của người quản trị | Kỹ thuật |
| Chuyển repo GitHub sang **private** | Chủ repo |
| Soạn nội dung chính thức trong trang quản trị, thay nội dung mẫu | BTC |
| Chốt trọng số điểm nhóm, mốc tuần/tháng/mùa, tiêu chí vinh danh/huy hiệu; nhập danh sách nhóm | BTC |
| Chạy thử với vài trăm người cùng lúc; bổ sung test trình duyệt tự động | Kỹ thuật |

## Lưu ý quan trọng

- **Repo đang công khai.** Ai cũng xem được mã nguồn. Không đưa lên đây: dữ liệu nhân viên thật, file `.env`
  (mật khẩu CSDL, LDAP), file kịch bản `.docx` của BTC. Những file này đã nằm trong `.gitignore`.
- **Tài khoản thử dùng chung mật khẩu công khai** (`vnpt@123`, ghi ngay trong repo). Với `AUTH_PROVIDER=dev`,
  ai vào được địa chỉ máy chủ đều đăng nhập được cả tài khoản `admin`. Khi demo trên cloud: chỉ mở cho mạng nội bộ
  hoặc giới hạn IP, và chuyển sang LDAP sớm nhất có thể.
- **Bản GitHub Pages chỉ là demo**, dùng dữ liệu mẫu; mỗi lần push lên `main` sẽ tự cập nhật. Chuyển repo sang
  private thì GitHub Pages miễn phí ngừng chạy (cần gói trả phí hoặc đưa bản demo lên máy chủ nội bộ).
- **Nội dung đánh dấu `TODO(content)` là nội dung mẫu**, không phải tài liệu chính thức của VNPT. Nội dung chính thức
  do BTC soạn trong trang quản trị, lưu trong CSDL.
- **Không đổi mã (`id`) của level đã đăng**, vì tiến độ người chơi gắn với mã này. Trang quản trị đã khóa sẵn; xóa level đã đăng = lưu trữ.
- **Logo VNPT** dùng file chính thức do đơn vị cung cấp, không để AI vẽ lại. Phong cách chỉ *lấy cảm hứng* Gunny,
  không dùng hình ảnh hay nhân vật của Gunny (bản quyền 7Road/VNG).
- **Nhật ký lỗi lưu tài khoản và IP** của người chơi gặp lỗi, chỉ BTC/quản trị xem được, tự xóa sau 30 ngày.
- **CSDL thử trên máy (PGlite)** chỉ cho một tiến trình mở: không chạy 2 server cùng lúc, tắt bằng Ctrl+C.
  Máy chủ thật dùng PostgreSQL nên không bị giới hạn này.

## Chạy thử trên máy

```bash
# Bản demo offline (giống GitHub Pages)
cd client && npm install && npm run dev        # http://localhost:5173

# Bản có máy chủ (không cần Docker; CSDL nhúng PGlite)
cd server && npm install && cp .env.example .env
npm run db:seed && npm run dev                 # API http://localhost:3000
cd ../client && npm run dev:api                # game :5173, quản trị :5173/admin.html
# tài khoản thử: admin, btc, lan, dung, hoang, mai, anh — mật khẩu vnpt@123
```

Cần Node.js 22 trở lên. Cài lên máy chủ thật: [deploy/README.md](deploy/README.md).

## Cấu trúc & tài liệu

```
client/   game (Phaser 4 + Vite + TypeScript) và trang quản trị (admin.html)
server/   API (Fastify + Drizzle + PostgreSQL), migration, test
shared/   kiểu dữ liệu và luật chấm điểm dùng chung client ↔ server
deploy/   Docker Compose (PostgreSQL, API, Caddy), sao lưu, hướng dẫn cài
docs/     tài liệu
```

| Muốn biết | Đọc |
|---|---|
| Kiến trúc, luồng dữ liệu | [docs/architecture.md](docs/architecture.md) |
| Máy chủ, CSDL, API, trang quản trị, nhật ký lỗi | [docs/backend.md](docs/backend.md) |
| Kịch bản BTC ↔ tính năng đã làm | [docs/game-design.md](docs/game-design.md) |
| Thêm màn hình, level, dạng game, hình ảnh | [docs/how-to.md](docs/how-to.md) |
| Tạo hình ảnh bằng AI | [docs/asset-pipeline.md](docs/asset-pipeline.md) |
| Việc tiếp theo, quyết định đã chốt | [docs/roadmap.md](docs/roadmap.md) |
| Quy tắc cho AI agent khi sửa code | [CLAUDE.md](CLAUDE.md) |
