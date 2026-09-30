import type { Chapter } from './types';

// TODO(content): sample cases. Real cases come from the "Chia sẻ tình huống thực tế" form.
export const thucChien: Chapter = {
  id: 'thuc-chien',
  order: 3,
  title: 'THỰC CHIẾN',
  subtitle: 'Người thật, việc thật',
  building: 'bld-5g',
  intro: 'Chặng 3 là kho kinh nghiệm thực chiến do chính người VNPT Đắk Lắk chia sẻ. Một tình huống, một bài học!',
  levels: [
    {
      id: 'thuc-chien-1',
      kind: 'normal',
      spec: {
        type: 'order',
        title: 'Time Attack: Khách đang chờ',
        intro: '⏱️ 60 giây! Khách hàng đang chờ. Sắp xếp các bước xử lý theo đúng thứ tự!',
        timeLimitSec: 60,
        parTimeSec: 30,
        steps: ['Tiếp nhận phản ánh', 'Xác minh thông tin', 'Phối hợp bộ phận liên quan', 'Xử lý sự cố', 'Phản hồi khách hàng'],
        explain: 'Tiếp nhận → Xác minh → Phối hợp → Xử lý → Phản hồi: bỏ bước nào cũng dễ xử lý sai hoặc khách không được cập nhật.',
      },
    },
    {
      id: 'thuc-chien-2',
      kind: 'normal',
      spec: {
        type: 'investigate',
        title: 'Điều tra sự cố',
        intro: 'Một trạm BTS mất liên lạc nhiều lần. Mở các manh mối rồi tìm nguyên nhân thật sự!',
        incident: 'Trạm BTS xã Ea Tu mất liên lạc 3 lần trong tuần, mỗi lần khoảng 20–40 phút, đều vào buổi chiều.',
        minClues: 3,
        clues: [
          { kind: 'log', title: 'Nhật ký cảnh báo', body: 'Cảnh báo "Mất điện lưới" lúc 14:05, 15:20, 16:10. Sau đó "Ắc quy điện áp thấp" sau ~15 phút.' },
          { kind: 'data', title: 'Số liệu ắc quy', body: 'Dung lượng ắc quy còn 35% so với thiết kế. Lần thay gần nhất: 5 năm trước.' },
          { kind: 'chat', title: 'Tin nhắn từ tổ kỹ thuật', body: '"Chiều nào điện lưới khu này cũng cắt luân phiên, bên điện lực có thông báo."' },
          { kind: 'email', title: 'Email của khách hàng', body: 'Khách phản ánh mất sóng vào giờ chiều, sáng thì bình thường.' },
        ],
        question: {
          text: 'Nguyên nhân gốc rễ và hướng xử lý đúng nhất là gì?',
          options: [
            'Thiết bị truyền dẫn lỗi, cần thay card',
            'Ắc quy xuống cấp không đủ duy trì khi cắt điện luân phiên; cần thay ắc quy và bố trí máy phát theo lịch cắt điện',
            'Khách hàng dùng điện thoại cũ',
            'Do thời tiết buổi chiều',
          ],
          correct: 1,
          explain: 'Cắt điện lưới + ắc quy chỉ còn 35% dung lượng → trạm tắt sau ~15 phút. Xử lý gốc là thay ắc quy và chủ động theo lịch cắt điện.',
        },
      },
    },
    {
      id: 'thuc-chien-3',
      kind: 'normal',
      spec: {
        type: 'dialogue',
        title: 'Khách hàng bức xúc',
        intro: 'Khách đến tận quầy vì bị trừ tiền cước lạ. Giữ bình tĩnh và chọn cách nói phù hợp!',
        persona: { name: 'Anh Tuấn', role: 'Khách hàng cá nhân' },
        explain: 'Không tranh cãi đúng/sai ngay; kiểm tra dữ liệu, giải thích minh bạch và đưa phương án.',
        turns: [
          {
            line: 'Tháng này tôi bị trừ thêm 150 nghìn mà không biết vì sao. Các anh lấy tiền của tôi à?',
            options: [
              { text: 'Hệ thống không bao giờ sai đâu anh.', score: 0, reaction: 'Vậy là tôi sai à?' },
              { text: 'Em hiểu anh lo lắng. Anh cho em kiểm tra chi tiết cước ngay nhé.', score: 2, reaction: 'Ừ, anh kiểm tra đi.' },
              { text: 'Anh tự xem trên ứng dụng nhé.', score: 0, reaction: 'Tôi đến đây để các anh giải thích cơ mà!' },
            ],
          },
          {
            line: 'Rồi, thế khoản đó là gì?',
            options: [
              { text: 'Đây là gói dịch vụ giá trị gia tăng đăng ký qua tin nhắn ngày 5. Em hủy ngay và hướng dẫn anh chặn đăng ký ngoài ý muốn nhé.', score: 2, reaction: 'À, ra vậy. Cảm ơn em.' },
              { text: 'Chắc anh bấm nhầm gì đó.', score: 1, reaction: 'Tôi không nhớ đã bấm gì cả.' },
              { text: 'Cái này không hoàn tiền được đâu.', score: 0, reaction: 'Thế thì tôi khiếu nại!' },
            ],
          },
        ],
      },
    },
    { id: 'thuc-chien-4', kind: 'mystery' },
    {
      id: 'thuc-chien-5',
      kind: 'normal',
      spec: {
        type: 'choice',
        title: 'Nếu là bạn?',
        intro: 'Kinh nghiệm từ hiện trường: bạn sẽ chọn cách nào?',
        parTimeSec: 40,
        questions: [
          {
            text: 'Đến nhà khách lắp đặt, bạn thấy vị trí khách muốn đặt modem sẽ làm sóng Wi-Fi rất yếu ở phòng làm việc.',
            options: ['Cứ lắp theo ý khách cho nhanh', 'Giải thích ngắn gọn, đề xuất vị trí tốt hơn và để khách quyết định', 'Tự đặt chỗ khác không cần hỏi'],
            correct: 1,
            explain: 'Tư vấn chuyên môn nhưng tôn trọng quyết định của khách giúp tránh khiếu nại về sau.',
          },
        ],
      },
    },
    {
      id: 'thuc-chien-6',
      kind: 'boss',
      spec: {
        type: 'boss',
        title: 'Boss: Sự cố diện rộng',
        intro: 'Sự cố cáp quang ảnh hưởng hàng trăm khách hàng! Xử lý từng bước để hạ Boss.',
        bossName: 'Quái Sự Cố',
        steps: [
          { label: 'Xác định vấn đề', text: 'Tổng đài nhận 50 cuộc gọi mất mạng cùng khu vực trong 10 phút. Việc đầu tiên?', options: ['Xử lý từng cuộc gọi riêng lẻ', 'Nhận diện sự cố diện rộng, báo ngay trực vận hành', 'Chờ thêm cuộc gọi cho chắc'], correct: 1, explain: 'Nhiều phản ánh cùng khu vực → khả năng cao là sự cố diện rộng.' },
          { label: 'Cập nhật', text: 'Khách tiếp tục gọi đến. Tổng đài viên nên:', options: ['Thông báo thống nhất: đang có sự cố, dự kiến khắc phục lúc 16h', 'Mỗi người trả lời một kiểu', 'Không nhấc máy'], correct: 0, explain: 'Thông tin thống nhất, có mốc thời gian giúp giảm bức xúc.' },
          { label: 'Tìm nguyên nhân', text: 'Nguyên nhân: xe công trình kéo đứt cáp. Việc tiếp theo?', options: ['Chỉ nối cáp là xong', 'Nối cáp, lập biên bản và làm việc với đơn vị thi công', 'Đổ lỗi cho thời tiết'], correct: 1, explain: 'Xử lý kỹ thuật kèm thủ tục để xác định trách nhiệm.' },
          { label: 'Phòng ngừa', text: 'Để phòng ngừa tái diễn:', options: ['Không cần làm gì', 'Treo biển cảnh báo tuyến cáp, phối hợp chính quyền nắm lịch thi công', 'Đi đường cáp khác mà không báo ai'], correct: 1, explain: 'Phòng ngừa chủ động rẻ hơn khắc phục.' },
        ],
      },
    },
  ],
};
