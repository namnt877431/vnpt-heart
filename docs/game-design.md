# Thiết kế game & đối chiếu kịch bản

Nguồn: tài liệu nội bộ "Ý tưởng xây dựng web game dành riêng cho nội bộ VNPT Đắk Lắk"
(file `.docx` do BTC cung cấp, **không** đưa lên repo công khai). File này ghi lại cách từng ý
trong kịch bản được hiện thực trong code, để agent/dev tra cứu nhanh.

Trạng thái: ✅ có trong demo · 🟡 có giao diện, logic thật cần backend · ⏳ chưa làm

## 1. Cấu trúc chơi

**Bản đồ → Chặng → Level → Mini-game → Điểm/Sao → Mở khóa level tiếp theo**

| Kịch bản | Trạng thái | Ở đâu trong code |
|---|---|---|
| Bản đồ nhiều chặng kiểu Candy Crush | ✅ | Bản đồ thế giới: `scenes/MapScene.ts` (6 đảo = 6 chặng). Đường level trong chặng: `ui/screens/chapter.ts` |
| Mỗi chặng 10–20 vòng, độ khó tăng dần | 🟡 | Demo mỗi chặng 6 level (`data/content/*.ts`); thêm level chỉ là thêm dữ liệu |
| Mở khóa level/chặng | ✅ | `core/progress.ts` (`isLevelUnlocked`, `isChapterUnlocked`); demo mở sẵn mọi chặng (`config/demo.ts`) |
| 1/2/3 sao (hoàn thành / tốt / nhanh và chính xác) | ✅ | `core/scoring.ts` (`starsFor`, `pointsFor`), `parTimeSec` trong từng level |
| Chơi lại để cải thiện sao | ✅ | Nút "Chơi lại"; chỉ phần vượt kỷ lục mới cộng điểm (`recordResult`) |
| Xem kiến thức/giải thích sau level | ✅ | Modal kết quả trong `ui/screens/level.ts` (mục "Xem kiến thức & giải thích") |
| Đăng nhập | ⏳ | Cần backend + SSO nội bộ |

## 2. Sáu nhóm nội dung = sáu chặng

| # | Chặng (`data/content/`) | Nội dung kịch bản |
|---|---|---|
| 1 | `van-hoa.ts` — Sổ tay văn hóa | Nhận diện giá trị, ghép giá trị ↔ hành vi, Nếu là bạn? |
| 2 | `quy-tac.ts` — Quy tắc ứng xử | Soi lỗi VNPT, Chọn cách nói, Ai xử lý đúng?, Ghép đúng |
| 3 | `thuc-chien.ts` — Thực chiến | Tình huống thật: Time Attack, Điều tra sự cố, khách bức xúc |
| 4 | `an-toan.ts` — ATVSLĐ – 5S | Tìm mối nguy, Đúng hay sai?, 5S ghép đúng, Xử lý sự cố |
| 5 | `quy-trinh.ts` — Quy trình, quy định | Sắp xếp quy trình, Chọn bước tiếp theo, Tìm điểm sai, Vượt cửa kiểm soát |
| 6 | `ai.ts` — Ứng dụng AI | Prompt Master, AI hay thủ công?, Đọc kết quả AI, AI Detective, AI Challenge |

Toàn bộ nội dung câu hỏi hiện là **mẫu** (`TODO(content)`), BTC cần thay bằng tài liệu chính thức.

## 3. Các dạng trò chơi (`data/game-types.ts` ↔ `ui/games/`)

| Kịch bản | `type` | Trạng thái |
|---|---|---|
| "Nếu là bạn?", "Ai xử lý đúng?", "Chọn bước tiếp theo", "Prompt Master" | `choice` | ✅ |
| "Chọn cách nói" (hội thoại rẽ nhánh) | `dialogue` | ✅ thanh cảm xúc khách hàng thay đổi theo câu trả lời |
| "Soi lỗi" (email/tin nhắn/văn bản/kết quả AI) | `spot-errors` | ✅ bấm nhầm bị trừ điểm |
| "Kéo – thả / Ghép đúng" | `match` | ✅ chạm hoặc kéo thả |
| "Sắp xếp đúng quy trình", "Time Attack" | `order` (+ `timeLimitSec`) | ✅ |
| "Đúng hay sai?", "AI hay làm thủ công?", "AI Detective" | `binary` | ✅ phím ←/→ |
| "Tìm mối nguy", "5S Detective" | `hazard` | ✅ 1 cảnh văn phòng (`ui/games/hazard-scenes.ts`) |
| "Điều tra sự cố" | `investigate` | ✅ phải mở đủ manh mối mới được kết luận |
| "Escape Room" | `escape` | ✅ 3 ổ khóa |
| "Boss Challenge" (tình huống lớn nhiều bước) | `boss` | ✅ kiểu Gunny: trả lời đúng → bắn; sai → Boss phản công (-1 tim) |
| "Mystery Level" | level `kind: 'mystery'` | ✅ lật thẻ: 🎁 quà, 💰 Double XP, ⚡ tốc độ, 🧩 puzzle, 🎯 câu hỏi đặc biệt, 🔥 mini boss (`ui/screens/mystery.ts`) |
| "Mô phỏng một ngày làm việc", "Xử lý theo thời gian thực" | — | ⏳ ghép nhiều game liên tiếp; đề xuất cho mùa 2 |

"Kho trò chơi" (menu **Chơi game**) cho chơi thử mọi dạng mà không lưu tiến độ.

## 4. Thi đua

| Kịch bản | Trạng thái | Ghi chú |
|---|---|---|
| BXH tuần / tháng / toàn mùa | 🟡 | `ui/screens/leaderboard.ts`; dữ liệu mock, điểm của "tôi" cộng live từ tiến độ |
| Vinh danh: tích cực nhất, tiến bộ nhất, nhiều thử thách nhất, nhiều 3 sao nhất | 🟡 | Tab "Vinh danh" |
| Điểm nhóm = điểm TB + tỷ lệ tham gia + thành tích kỳ | 🟡 | Hiển thị cả 3 thành phần; **trọng số chưa chốt** (BTC quyết định), xếp hạng tạm theo điểm TB |
| Huy hiệu/danh hiệu | 🟡 | `ui/screens/badges.ts` (mock) |
| Tích điểm → tăng cấp | ✅ | `data/selectors.ts` (`playerStats`: 300 XP/cấp) |

## 5. Vận hành

| Kịch bản | Trạng thái |
|---|---|
| Form "Chia sẻ tình huống thực tế" (6 trường + ẩn danh + đồng ý biên tập) | 🟡 `ui/screens/share.ts`; demo lưu trên trình duyệt |
| Quy trình: Thu thập → Biên tập → Ẩn thông tin nhạy cảm → Kịch bản → Game → Lên nền tảng | ⏳ cần trang quản trị cho BTC |
| Hằng tuần mở level mới, cập nhật BXH, truyền thông | ⏳ cần backend + lịch phát hành nội dung |
| Hằng tháng trao huy hiệu, Boss đặc biệt | ⏳ |
| "Mùa chinh phục" theo quý | 🟡 nhãn "Mùa 1" trên giao diện; dữ liệu mùa cần backend |

## 6. Robot VNPT

| Vai trò | Trạng thái |
|---|---|
| Giới thiệu chặng | ✅ modal lần đầu mở chặng (`Chapter.intro`) |
| Hướng dẫn, đưa thử thách | ✅ `spec.intro` ở đầu mỗi level |
| Phản hồi đúng/sai, gợi ý | ✅ `api.robot(text, mood)`: vui/buồn/suy nghĩ |
| Chúc mừng vượt ải | ✅ theo số sao |
| Xuất hiện trong Boss Challenge | ✅ robot là nhân vật bắn |
| Công bố nhiệm vụ mới, sự kiện đặc biệt | ⏳ cần backend |
