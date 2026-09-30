import type { Chapter } from './types';

// TODO(content): sample content for the "Ứng dụng AI trong công việc" track.
export const ai: Chapter = {
  id: 'ai',
  order: 6,
  title: 'ỨNG DỤNG AI',
  subtitle: 'Làm việc thông minh hơn',
  building: 'bld-ai',
  intro: 'Chặng 6: AI là trợ thủ, bạn là người quyết định! Viết prompt tốt, biết khi nào dùng AI và kiểm chứng kết quả.',
  levels: [
    {
      id: 'ai-1',
      kind: 'normal',
      spec: {
        type: 'choice',
        title: 'Prompt Master',
        intro: 'Prompt nào sẽ cho kết quả tốt hơn? Chọn prompt rõ ràng, đủ bối cảnh!',
        parTimeSec: 45,
        questions: [
          {
            text: 'Bạn cần AI viết email xin lỗi khách hàng vì lắp đặt trễ.',
            options: [
              '"Viết email xin lỗi."',
              '"Viết email xin lỗi khách hàng doanh nghiệp vì lắp đặt trễ 2 ngày do thiếu vật tư; giọng lịch sự, ngắn gọn, nêu lịch mới 15/10 và ưu đãi 1 tháng cước."',
              '"Email xin lỗi hay nhất có thể."',
            ],
            correct: 1,
            explain: 'Prompt tốt có bối cảnh, mục tiêu, giọng văn và thông tin cụ thể.',
          },
          {
            text: 'Bạn muốn AI tóm tắt báo cáo 20 trang cho lãnh đạo.',
            options: [
              '"Tóm tắt báo cáo này thành 5 ý chính, mỗi ý 1 câu, nêu rõ số liệu quan trọng và 2 đề xuất."',
              '"Tóm tắt đi."',
              '"Đọc và cho ý kiến."',
            ],
            correct: 0,
            explain: 'Chỉ rõ định dạng đầu ra giúp kết quả dùng được ngay.',
          },
        ],
      },
    },
    {
      id: 'ai-2',
      kind: 'normal',
      spec: {
        type: 'binary',
        title: 'AI hay làm thủ công?',
        intro: 'Việc nào nên nhờ AI hỗ trợ, việc nào nên tự làm? Phân loại nhé!',
        labels: ['NHỜ AI', 'TỰ LÀM'],
        timeLimitSec: 45,
        parTimeSec: 30,
        items: [
          { text: 'Soạn bản nháp thông báo nội bộ về lịch nghỉ lễ.', answer: 0, explain: 'AI soạn nháp nhanh, bạn chỉnh lại.' },
          { text: 'Dán danh sách số điện thoại, CCCD khách hàng vào công cụ AI công cộng để lọc.', answer: 1, explain: 'Không đưa dữ liệu cá nhân của khách hàng lên công cụ AI công cộng.' },
          { text: 'Gợi ý ý tưởng slogan cho chương trình khuyến mãi.', answer: 0, explain: 'AI rất tốt để gợi ý ý tưởng.' },
          { text: 'Quyết định phê duyệt hồ sơ thanh toán.', answer: 1, explain: 'Quyết định và trách nhiệm thuộc về con người.' },
          { text: 'Tóm tắt biên bản cuộc họp đã được phép chia sẻ.', answer: 0, explain: 'Tiết kiệm thời gian, nhớ kiểm tra lại.' },
        ],
      },
    },
    {
      id: 'ai-3',
      kind: 'normal',
      spec: {
        type: 'spot-errors',
        title: 'Đọc kết quả AI',
        intro: 'AI vừa trả lời câu hỏi về gói cước. Có vài chỗ AI "bịa". Tìm những thông tin cần kiểm chứng!',
        format: 'chat',
        timeLimitSec: 75,
        parTimeSec: 45,
        lines: [
          ['Gói Internet Home 300 phù hợp hộ gia đình 3–5 người. '],
          [{ bad: 'Gói này miễn phí vĩnh viễn thiết bị Mesh cho mọi khách hàng.', why: '"Vĩnh viễn", "mọi khách hàng" là cam kết tuyệt đối, cần kiểm chứng chính sách.' }],
          ['Tốc độ tối đa theo gói là 300 Mbps. '],
          [{ bad: 'Theo Thông tư 99/2030, nhà mạng phải hoàn tiền 200% khi mất mạng.', why: 'Trích dẫn văn bản pháp lý không rõ nguồn – dấu hiệu AI "ảo giác".' }],
          ['Bạn có thể đăng ký qua ứng dụng hoặc tại điểm giao dịch.'],
        ],
      },
    },
    { id: 'ai-4', kind: 'mystery' },
    {
      id: 'ai-5',
      kind: 'normal',
      spec: {
        type: 'binary',
        title: 'AI Detective',
        intro: 'Nội dung nào CẦN KIỂM CHỨNG trước khi dùng?',
        labels: ['CẦN KIỂM CHỨNG', 'DÙNG ĐƯỢC'],
        timeLimitSec: 40,
        parTimeSec: 25,
        items: [
          { text: 'AI đưa ra số liệu thị phần kèm "nguồn: báo cáo 2025" nhưng không có đường dẫn.', answer: 0, explain: 'Số liệu không có nguồn kiểm chứng được thì chưa dùng.' },
          { text: 'AI sửa lỗi chính tả trong đoạn văn bạn viết.', answer: 1, explain: 'Rủi ro thấp, bạn dễ tự kiểm tra.' },
          { text: 'AI trả lời về mức phạt theo một điều luật cụ thể.', answer: 0, explain: 'Nội dung pháp lý phải đối chiếu văn bản gốc.' },
          { text: 'AI gợi ý bố cục slide thuyết trình.', answer: 1, explain: 'Gợi ý hình thức, bạn tự quyết định nội dung.' },
        ],
      },
    },
    {
      id: 'ai-6',
      kind: 'boss',
      spec: {
        type: 'boss',
        title: 'Boss: AI Challenge',
        intro: 'Nhiệm vụ thật: dùng AI chuẩn bị báo cáo tuần cho lãnh đạo. Làm đúng từng bước để hạ Quái Ảo Giác!',
        bossName: 'Quái Ảo Giác',
        steps: [
          { label: 'Chuẩn bị dữ liệu', text: 'Dữ liệu báo cáo có thông tin khách hàng. Trước khi đưa vào AI:', options: ['Dán nguyên dữ liệu', 'Ẩn/loại bỏ thông tin cá nhân, dùng công cụ AI được đơn vị cho phép', 'Gửi qua email cá nhân rồi dùng'], correct: 1, explain: 'Bảo vệ dữ liệu khách hàng và dùng công cụ được phép.' },
          { label: 'Viết prompt', text: 'Prompt tốt nhất để AI tổng hợp:', options: ['"Làm báo cáo"', '"Tổng hợp số liệu tuần thành bảng: chỉ tiêu – kết quả – % so kế hoạch, kèm 3 nhận xét chính"', '"Báo cáo thật hay"'], correct: 1, explain: 'Định dạng đầu ra rõ ràng.' },
          { label: 'Kiểm chứng', text: 'AI trả kết quả, một số liệu có vẻ cao bất thường. Bạn:', options: ['Gửi luôn cho kịp', 'Đối chiếu lại với dữ liệu gốc trước khi gửi', 'Xóa dòng đó đi'], correct: 1, explain: 'Người dùng chịu trách nhiệm cuối cùng về kết quả.' },
        ],
      },
    },
  ],
};
