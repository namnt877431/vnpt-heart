import type { Chapter } from './types';

// TODO(content): sample content. Replace with the official "Sổ tay Văn hóa VNPT".
export const vanHoa: Chapter = {
  id: 'van-hoa',
  order: 1,
  title: 'SỔ TAY VĂN HÓA',
  subtitle: 'Giá trị & tinh thần VNPT',
  building: 'bld-heart',
  intro: 'Chào mừng đến chặng 1! Ở đây mình cùng nhận diện các giá trị văn hóa và cách chúng thể hiện trong công việc hằng ngày.',
  levels: [
    {
      id: 'van-hoa-1',
      kind: 'normal',
      spec: {
        type: 'choice',
        title: 'Nhận diện giá trị',
        intro: 'Mỗi hành động dưới đây thể hiện giá trị nào? Chọn đáp án đúng nhất nhé!',
        parTimeSec: 60,
        questions: [
          {
            text: 'Nhân viên kỹ thuật ở lại thêm 30 phút để khôi phục đường truyền cho một bệnh viện trước giờ trực đêm. Hành động này thể hiện rõ nhất điều gì?',
            options: ['Tận tâm với khách hàng', 'Tiết kiệm chi phí', 'Tuân thủ giờ giấc', 'Cạnh tranh nội bộ'],
            correct: 0,
            explain: 'Đặt nhu cầu thiết yếu của khách hàng lên trước là biểu hiện của sự tận tâm.',
          },
          {
            text: 'Phát hiện số liệu báo cáo của chính mình bị sai, bạn chủ động báo lại cho trưởng nhóm dù chưa ai phát hiện. Đây là:',
            options: ['Làm phiền cấp trên', 'Chính trực, trung thực', 'Thiếu tự tin', 'Không cần thiết'],
            correct: 1,
            explain: 'Chủ động nhận và sửa sai là biểu hiện của sự chính trực.',
          },
          {
            text: 'Hai phòng ban cùng lập một nhóm chat chung để xử lý nhanh sự cố cho khách hàng doanh nghiệp. Điều này thể hiện:',
            options: ['Hợp tác, cùng chia sẻ', 'Lấn quyền phòng khác', 'Làm việc riêng lẻ', 'Đùn đẩy trách nhiệm'],
            correct: 0,
            explain: 'Phối hợp liên phòng ban vì mục tiêu chung là tinh thần hợp tác.',
          },
        ],
      },
    },
    {
      id: 'van-hoa-2',
      kind: 'normal',
      spec: {
        type: 'match',
        title: 'Ghép giá trị với hành vi',
        intro: 'Chọn một giá trị ở cột trái, rồi chọn hành vi phù hợp ở cột phải.',
        parTimeSec: 60,
        leftLabel: 'Giá trị',
        rightLabel: 'Hành vi',
        pairs: [
          { a: 'Tận tâm', b: 'Gọi lại hỏi thăm khách hàng sau khi xử lý sự cố' },
          { a: 'Chính trực', b: 'Từ chối quà biếu của đối tác đang đấu thầu' },
          { a: 'Sáng tạo', b: 'Đề xuất cách làm mới giúp rút ngắn thời gian lắp đặt' },
          { a: 'Hợp tác', b: 'Chủ động chia sẻ tài liệu cho đồng nghiệp phòng khác' },
        ],
      },
    },
    {
      id: 'van-hoa-3',
      kind: 'normal',
      spec: {
        type: 'binary',
        title: 'Đúng hay sai?',
        intro: 'Thẻ nào là hành vi phù hợp với văn hóa VNPT? Chọn ĐÚNG hoặc SAI thật nhanh!',
        labels: ['ĐÚNG', 'SAI'],
        timeLimitSec: 45,
        parTimeSec: 30,
        items: [
          { text: 'Đến muộn cuộc họp nhưng không báo trước vì "ai cũng vậy".', answer: 1, explain: 'Tôn trọng thời gian của người khác là tác phong chuyên nghiệp.' },
          { text: 'Chủ động giới thiệu dịch vụ phù hợp khi khách hỏi về sự cố.', answer: 0, explain: 'Hiểu nhu cầu và tư vấn đúng lúc là phục vụ khách hàng tận tâm.' },
          { text: 'Đăng ảnh tài liệu nội bộ lên mạng xã hội cá nhân để "khoe" công việc.', answer: 1, explain: 'Tài liệu nội bộ cần được bảo mật.' },
          { text: 'Ghi nhận và cảm ơn đồng nghiệp đã hỗ trợ mình trước cả nhóm.', answer: 0, explain: 'Ghi nhận đóng góp giúp tập thể gắn kết.' },
          { text: 'Nói xấu đơn vị bạn với khách hàng để tránh bị trách.', answer: 1, explain: 'Người VNPT là một tập thể thống nhất trước khách hàng.' },
        ],
      },
    },
    { id: 'van-hoa-4', kind: 'mystery' },
    {
      id: 'van-hoa-5',
      kind: 'normal',
      spec: {
        type: 'choice',
        title: 'Nếu là bạn?',
        intro: 'Tình huống thật, lựa chọn của bạn. Nếu là bạn, bạn sẽ làm gì?',
        parTimeSec: 60,
        questions: [
          {
            text: 'Khách hàng lớn tuổi đến quầy hỏi cách đăng ký dịch vụ trên ứng dụng nhưng không rành điện thoại. Hàng chờ phía sau đang dài.',
            options: [
              'Đưa tờ hướng dẫn và mời khách tự làm ở nhà',
              'Hướng dẫn nhanh từng bước, nhờ đồng nghiệp hỗ trợ hàng chờ nếu cần',
              'Bảo khách quay lại khi vắng người',
              'Đăng ký hộ nhưng không giải thích gì',
            ],
            correct: 1,
            explain: 'Vừa hỗ trợ tận tình vừa phối hợp đồng nghiệp để không ảnh hưởng người khác.',
          },
          {
            text: 'Deadline báo cáo là 17h nhưng bạn cần số liệu từ phòng khác, họ chưa gửi.',
            options: [
              'Chờ đến 17h rồi báo là do phòng kia',
              'Tự ước tính số liệu cho kịp',
              'Liên hệ sớm, nêu rõ thời hạn và báo trưởng nhóm nếu có rủi ro trễ',
              'Bỏ qua phần số liệu đó',
            ],
            correct: 2,
            explain: 'Chủ động phối hợp và minh bạch rủi ro sớm là cách làm việc chuyên nghiệp.',
          },
        ],
      },
    },
    {
      id: 'van-hoa-6',
      kind: 'boss',
      spec: {
        type: 'boss',
        title: 'Boss: Quái Thờ Ơ',
        intro: 'Quái Thờ Ơ xuất hiện! Mỗi câu trả lời đúng cho bạn một phát bắn. Trả lời sai, Boss sẽ phản công!',
        bossName: 'Quái Thờ Ơ',
        steps: [
          {
            label: 'Tiếp nhận',
            text: 'Khách hàng gọi đến, giọng bực bội vì mạng chập chờn cả tuần. Việc đầu tiên?',
            options: ['Lắng nghe hết, ghi nhận và xin lỗi vì bất tiện', 'Giải thích ngay nguyên nhân kỹ thuật', 'Chuyển máy sang bộ phận khác'],
            correct: 0,
            explain: 'Khách cần được lắng nghe trước khi nghe giải thích.',
          },
          {
            label: 'Xác định vấn đề',
            text: 'Để xác định đúng vấn đề, bạn nên:',
            options: ['Đoán theo kinh nghiệm', 'Hỏi thời điểm, thiết bị, hiện tượng cụ thể và kiểm tra lịch sử', 'Yêu cầu khách khởi động lại modem rồi cúp máy'],
            correct: 1,
            explain: 'Thu thập thông tin cụ thể giúp xử lý đúng ngay từ đầu.',
          },
          {
            label: 'Phối hợp & phản hồi',
            text: 'Sự cố cần kỹ thuật đến tận nơi. Bạn nói gì với khách?',
            options: ['"Chị chờ đi, bao giờ có người thì họ tới"', '"Em đã tạo phiếu, kỹ thuật sẽ liên hệ trong 2 giờ, em sẽ gọi lại cập nhật cho chị"', '"Việc này không thuộc bộ phận em"'],
            correct: 1,
            explain: 'Hẹn mốc thời gian rõ ràng và chủ động cập nhật giúp khách yên tâm.',
          },
        ],
      },
    },
  ],
};
