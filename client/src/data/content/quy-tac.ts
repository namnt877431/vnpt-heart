import type { Chapter } from './types';

// TODO(content): sample content. Replace with the official "Bộ Chuẩn mực và Quy tắc ứng xử của Người VNPT".
export const quyTac: Chapter = {
  id: 'quy-tac',
  order: 2,
  title: 'QUY TẮC ỨNG XỬ',
  subtitle: 'Chuẩn mực người VNPT',
  building: 'bld-rule',
  intro: 'Chặng 2: từ BIẾT quy tắc đến BIẾT CÁCH HÀNH ĐỘNG. Soi lỗi, chọn cách nói và ghép đúng quy tắc nhé!',
  levels: [
    {
      id: 'quy-tac-1',
      kind: 'normal',
      spec: {
        type: 'spot-errors',
        title: 'Soi lỗi VNPT',
        intro: 'Email này gửi khách hàng có nhiều chỗ chưa phù hợp. Bấm vào những đoạn bạn thấy có lỗi!',
        format: 'email',
        timeLimitSec: 90,
        parTimeSec: 50,
        header: { from: 'nv.kinhdoanh@…', to: 'khachhang@…', subject: 're: phan anh cham lap dat!!!' },
        lines: [
          [{ bad: 'Gửi anh/chị,', why: 'Nên xưng hô cụ thể, lịch sự: "Kính gửi Anh Minh".' }],
          ['Về việc lắp đặt chậm, ', { bad: 'lỗi này là do bên kỹ thuật chứ không phải bên em.', why: 'Không đổ lỗi cho đơn vị khác trước khách hàng.' }],
          ['Hiện tại lịch lắp đặt ', { bad: 'chắc khoảng tuần sau hay tuần sau nữa gì đó.', why: 'Cần cam kết mốc thời gian rõ ràng.' }],
          [{ bad: 'Anh chị cứ bình tĩnh, làm gì căng!!!', why: 'Giọng điệu thiếu tôn trọng, dùng dấu chấm than quá mức.' }],
          ['Mọi thắc mắc vui lòng liên hệ tổng đài 18001166.'],
          [{ bad: 'Thân', why: 'Thiếu chữ ký: họ tên, chức danh, số điện thoại liên hệ.' }],
        ],
      },
    },
    {
      id: 'quy-tac-2',
      kind: 'normal',
      spec: {
        type: 'dialogue',
        title: 'Chọn cách nói',
        intro: 'Khách hàng đang không vui. Mỗi câu bạn chọn sẽ làm khách dịu lại… hoặc nóng hơn!',
        persona: { name: 'Chị Hạnh', role: 'Khách hàng doanh nghiệp' },
        explain: 'Công thức: Đồng cảm → Nhận trách nhiệm → Giải pháp cụ thể → Cam kết theo dõi.',
        turns: [
          {
            line: 'Công ty tôi mất mạng từ sáng, cả phòng kế toán ngồi chơi. Các anh làm ăn kiểu gì vậy?',
            options: [
              { text: 'Em rất xin lỗi chị, mất mạng cả buổi sáng thật sự ảnh hưởng lớn. Em kiểm tra ngay cho chị.', score: 2, reaction: 'Ừ… kiểm tra nhanh giúp tôi.' },
              { text: 'Chị bình tĩnh, lỗi này bình thường mà chị.', score: 0, reaction: 'Bình thường?! Anh nói vậy mà nghe được à?' },
              { text: 'Chị cho em xin mã hợp đồng.', score: 1, reaction: 'Mã gì thì anh tự tra đi chứ.' },
            ],
          },
          {
            line: 'Vậy bao giờ có mạng lại? Chiều nay tôi phải nộp báo cáo thuế.',
            options: [
              { text: 'Em không biết được, tùy bên kỹ thuật chị ạ.', score: 0, reaction: 'Vậy tôi gọi cho anh làm gì?' },
              { text: 'Kỹ thuật sẽ có mặt trong 1 giờ. Trong lúc chờ, em hỗ trợ chị phát 4G tạm để nộp báo cáo nhé.', score: 2, reaction: 'Được, vậy thì ổn.' },
              { text: 'Chắc chiều là có thôi chị.', score: 1, reaction: 'Chắc? Tôi cần chắc chắn cơ.' },
            ],
          },
          {
            line: 'Lần sau còn như vậy thì tôi chuyển nhà mạng đấy.',
            options: [
              { text: 'Tùy chị thôi ạ.', score: 0, reaction: 'Được, tôi sẽ cân nhắc.' },
              { text: 'Em ghi nhận góp ý. Sau khi khắc phục em sẽ gọi lại báo nguyên nhân và cách phòng ngừa cho chị.', score: 2, reaction: 'Cảm ơn em, vậy chị chờ nhé.' },
              { text: 'Nhà mạng nào cũng vậy thôi chị.', score: 0, reaction: 'Vậy à? Để tôi xem.' },
            ],
          },
        ],
      },
    },
    {
      id: 'quy-tac-3',
      kind: 'normal',
      spec: {
        type: 'choice',
        title: 'Ai xử lý đúng?',
        intro: 'Ba đồng nghiệp, ba cách làm. Ai xử lý đúng quy tắc ứng xử?',
        parTimeSec: 45,
        questions: [
          {
            text: 'Trong nhóm chat công việc, một đồng nghiệp gửi thông tin chưa chính xác về chính sách giá.',
            options: [
              'An: chụp màn hình gửi nhóm khác để cười',
              'Bình: nhắn riêng, góp ý nhẹ nhàng và gửi văn bản đúng',
              'Chi: im lặng vì "không phải việc của mình"',
            ],
            correct: 1,
            explain: 'Góp ý riêng, tôn trọng và kèm thông tin đúng giúp tránh sai sót lan rộng.',
          },
          {
            text: 'Đối tác mời đi ăn tối "để bàn thêm" trong lúc đang chấm hồ sơ gói thầu.',
            options: [
              'Dũng: nhận lời vì chỉ là bữa ăn',
              'Hà: từ chối lịch sự, đề nghị trao đổi tại cơ quan có đủ thành phần',
              'Khoa: nhận lời nhưng không báo ai',
            ],
            correct: 1,
            explain: 'Tránh xung đột lợi ích; trao đổi công việc minh bạch, đúng quy định.',
          },
        ],
      },
    },
    {
      id: 'quy-tac-4',
      kind: 'normal',
      spec: {
        type: 'match',
        title: 'Ghép quy tắc với tình huống',
        intro: 'Mỗi tình huống cần áp dụng quy tắc nào? Ghép cho đúng nhé!',
        parTimeSec: 60,
        leftLabel: 'Quy tắc',
        rightLabel: 'Tình huống',
        pairs: [
          { a: 'Bảo mật thông tin', b: 'Người lạ gọi điện xin số điện thoại của khách hàng' },
          { a: 'Tôn trọng đồng nghiệp', b: 'Góp ý bài thuyết trình của bạn trong cuộc họp' },
          { a: 'Minh bạch, liêm chính', b: 'Nhận được phong bì cảm ơn từ khách hàng' },
          { a: 'Hình ảnh người VNPT', b: 'Mặc đồng phục đi làm hiện trường' },
        ],
      },
    },
    { id: 'quy-tac-5', kind: 'mystery' },
    {
      id: 'quy-tac-6',
      kind: 'boss',
      spec: {
        type: 'boss',
        title: 'Boss: Quái Đùn Đẩy',
        intro: 'Quái Đùn Đẩy chỉ sợ những người dám nhận trách nhiệm. Tấn công nào!',
        bossName: 'Quái Đùn Đẩy',
        steps: [
          {
            label: 'Nhận việc',
            text: 'Khách phản ánh một lỗi không thuộc phòng bạn. Bạn nên:',
            options: ['Nói "không phải việc của tôi"', 'Tiếp nhận, ghi đủ thông tin và chuyển đúng đầu mối, báo lại khách', 'Bảo khách tự gọi phòng kia'],
            correct: 1,
            explain: 'Người đầu tiên tiếp nhận có trách nhiệm dẫn đường cho khách.',
          },
          {
            label: 'Phối hợp',
            text: 'Đầu mối phòng kia chưa phản hồi sau 1 ngày. Bạn:',
            options: ['Nhắc lại, kèm mốc thời gian và báo cấp quản lý nếu cần', 'Bỏ qua vì đã chuyển rồi', 'Than phiền trong nhóm chat chung'],
            correct: 0,
            explain: 'Theo dõi đến cùng và leo thang đúng kênh khi cần.',
          },
          {
            label: 'Đóng vòng',
            text: 'Sự cố đã xử lý xong. Bước cuối cùng là:',
            options: ['Không cần làm gì thêm', 'Gọi xác nhận với khách và ghi nhận bài học vào hệ thống', 'Chờ khách gọi lại nếu còn lỗi'],
            correct: 1,
            explain: 'Đóng vòng với khách hàng và lưu bài học để phòng ngừa tái diễn.',
          },
        ],
      },
    },
  ],
};
