import type { Chapter } from './types';

// TODO(content): sample content. Replace with current official procedures/regulations.
export const quyTrinh: Chapter = {
  id: 'quy-trinh',
  order: 5,
  title: 'QUY TRÌNH',
  subtitle: 'Quy định & cơ chế',
  building: 'bld-process',
  intro: 'Chặng 5: đọc ít hơn, tương tác nhiều hơn! Sắp xếp quy trình, tìm điểm sai và vượt cửa kiểm soát.',
  levels: [
    {
      id: 'quy-trinh-1',
      kind: 'normal',
      spec: {
        type: 'order',
        title: 'Sắp xếp quy trình',
        intro: 'Sắp xếp các bước lắp đặt dịch vụ Internet cho khách hàng mới theo đúng thứ tự.',
        parTimeSec: 45,
        steps: ['Tiếp nhận yêu cầu, tư vấn gói cước', 'Ký hợp đồng, xác thực thông tin', 'Khảo sát hạ tầng', 'Thi công, lắp đặt thiết bị', 'Nghiệm thu, hướng dẫn sử dụng'],
        explain: 'Ký hợp đồng và xác thực thông tin trước khi khảo sát, thi công để đảm bảo đúng quy định.',
      },
    },
    {
      id: 'quy-trinh-2',
      kind: 'normal',
      spec: {
        type: 'choice',
        title: 'Chọn bước tiếp theo',
        intro: 'Quy trình đang dừng ở đây. Bước tiếp theo là gì?',
        parTimeSec: 40,
        questions: [
          {
            text: 'Khách hàng yêu cầu chuyển nhượng thuê bao. Bạn đã nhận đủ giấy tờ của hai bên. Bước tiếp theo?',
            options: ['Chuyển ngay cho bên nhận', 'Kiểm tra, đối chiếu giấy tờ và công nợ của thuê bao', 'Hẹn khách tuần sau'],
            correct: 1,
            explain: 'Phải đối chiếu hồ sơ và thanh toán công nợ trước khi chuyển nhượng.',
          },
          {
            text: 'Khách đề nghị tạm ngưng dịch vụ 2 tháng. Sau khi tiếp nhận yêu cầu, bạn cần:',
            options: ['Tạm ngưng luôn không cần ký', 'Lập phiếu yêu cầu có chữ ký khách và thông báo phí duy trì (nếu có)', 'Hủy hợp đồng'],
            correct: 1,
            explain: 'Mọi thay đổi hợp đồng cần có xác nhận của khách và minh bạch chi phí.',
          },
        ],
      },
    },
    {
      id: 'quy-trinh-3',
      kind: 'normal',
      spec: {
        type: 'spot-errors',
        title: 'Tìm điểm sai',
        intro: 'Biên bản nghiệm thu này có vài chỗ sai quy định. Tìm ra chúng!',
        format: 'doc',
        timeLimitSec: 75,
        parTimeSec: 45,
        header: { subject: 'BIÊN BẢN NGHIỆM THU LẮP ĐẶT' },
        lines: [
          ['Khách hàng: Nguyễn Văn A – Mã HĐ: 0045xxx'],
          ['Ngày nghiệm thu: ', { bad: '(để trống, điền sau)', why: 'Ngày nghiệm thu phải ghi ngay tại thời điểm nghiệm thu.' }],
          ['Thiết bị bàn giao: 01 modem Wi-Fi, ', { bad: 'không ghi số serial', why: 'Phải ghi serial thiết bị để quản lý tài sản.' }],
          ['Tốc độ đo thực tế: 300 Mbps (đạt).'],
          [{ bad: 'Kỹ thuật viên ký thay khách hàng vì khách đi vắng.', why: 'Không được ký thay; cần khách hoặc người được ủy quyền ký.' }],
          ['Đã hướng dẫn khách sử dụng ứng dụng quản lý Wi-Fi.'],
        ],
      },
    },
    {
      id: 'quy-trinh-4',
      kind: 'normal',
      spec: {
        type: 'escape',
        title: 'Vượt cửa kiểm soát',
        intro: 'Bạn bị nhốt trong "phòng quy trình"! Mỗi đáp án đúng mở một ổ khóa. Mở cả 3 để thoát!',
        parTimeSec: 60,
        locks: [
          { text: 'Ổ khóa 1: Hồ sơ đề nghị thanh toán cần có gì?', options: ['Chỉ cần hóa đơn', 'Đủ chứng từ hợp lệ và phê duyệt đúng thẩm quyền', 'Chữ ký của người đề nghị là đủ'], correct: 1, explain: 'Chứng từ hợp lệ + phê duyệt đúng thẩm quyền.' },
          { text: 'Ổ khóa 2: Mật khẩu hệ thống nghiệp vụ nên:', options: ['Dùng chung cho cả nhóm', 'Cá nhân, đủ mạnh, không chia sẻ', 'Dán cạnh màn hình cho dễ nhớ'], correct: 1, explain: 'Tài khoản là định danh cá nhân, không chia sẻ.' },
          { text: 'Ổ khóa 3: Khi quy định mới ban hành, bạn nên:', options: ['Chờ ai đó nhắc', 'Chủ động đọc, hỏi đầu mối nếu chưa rõ và áp dụng đúng hạn', 'Làm theo cách cũ cho quen'], correct: 1, explain: 'Chủ động cập nhật quy định mới.' },
        ],
      },
    },
    { id: 'quy-trinh-5', kind: 'mystery' },
    {
      id: 'quy-trinh-6',
      kind: 'boss',
      spec: {
        type: 'boss',
        title: 'Boss: Quái Tắt Bước',
        intro: 'Quái Tắt Bước luôn dụ người ta bỏ qua quy trình. Đi đúng từng bước để hạ nó!',
        bossName: 'Quái Tắt Bước',
        steps: [
          { label: 'Tiếp nhận', text: 'Khách hàng doanh nghiệp cần lắp gấp trong hôm nay nhưng chưa ký hợp đồng.', options: ['Lắp trước, ký sau', 'Hoàn tất hợp đồng điện tử nhanh rồi triển khai', 'Từ chối'], correct: 1, explain: 'Nhanh nhưng vẫn đúng quy trình, dùng công cụ số để rút ngắn.' },
          { label: 'Kiểm soát', text: 'Hạ tầng không đủ port. Bạn nên:', options: ['Dùng tạm port của khách khác', 'Báo đầu mối hạ tầng, hẹn lại lịch với khách', 'Không báo ai'], correct: 1, explain: 'Không ảnh hưởng khách hàng khác; minh bạch với khách.' },
          { label: 'Hoàn tất', text: 'Sau lắp đặt, hồ sơ cần:', options: ['Cập nhật đầy đủ lên hệ thống trong ngày', 'Để cuối tháng nhập một lần', 'Không cần'], correct: 0, explain: 'Cập nhật đúng hạn để dữ liệu chính xác cho các bộ phận khác.' },
        ],
      },
    },
  ],
};
