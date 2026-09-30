import type { Chapter } from './types';

// TODO(content): sample content. Replace with official ATVSLĐ / 5S material.
export const anToan: Chapter = {
  id: 'an-toan',
  order: 4,
  title: 'AN TOÀN – 5S',
  subtitle: 'ATVSLĐ & nơi làm việc',
  building: 'bld-safety',
  intro: 'Chặng 4: an toàn là trên hết! Tìm mối nguy, phân loại hành vi và xử lý sự cố đúng cách.',
  levels: [
    {
      id: 'an-toan-1',
      kind: 'normal',
      spec: {
        type: 'hazard',
        title: 'Tìm mối nguy',
        intro: 'Văn phòng này có 5 mối nguy mất an toàn. Bấm vào chỗ bạn thấy nguy hiểm!',
        scene: 'workplace',
        timeLimitSec: 60,
        parTimeSec: 35,
        hazards: [
          { id: 'shelf', x: 95, y: 118, r: 50, label: 'Thùng nặng xếp trên cao', explain: 'Vật nặng phải để ở tầng thấp, tránh rơi khi lấy.' },
          { id: 'strip', x: 170, y: 398, r: 42, label: 'Ổ điện quá tải', explain: 'Không cắm quá nhiều thiết bị vào một ổ, nguy cơ cháy nổ.' },
          { id: 'cable', x: 345, y: 405, r: 48, label: 'Dây điện vắt ngang lối đi', explain: 'Dây điện phải đi trong máng, tránh vấp ngã.' },
          { id: 'puddle', x: 560, y: 412, r: 48, label: 'Sàn ướt không có biển báo', explain: 'Lau khô ngay hoặc đặt biển cảnh báo sàn trơn.' },
          { id: 'exit', x: 715, y: 250, r: 62, label: 'Lối thoát hiểm bị chắn', explain: 'Lối thoát hiểm phải luôn thông thoáng.' },
        ],
      },
    },
    {
      id: 'an-toan-2',
      kind: 'normal',
      spec: {
        type: 'binary',
        title: 'Đúng hay sai?',
        intro: 'Hành vi nào AN TOÀN? Chọn thật nhanh!',
        labels: ['AN TOÀN', 'NGUY HIỂM'],
        timeLimitSec: 40,
        parTimeSec: 25,
        items: [
          { text: 'Đeo dây an toàn khi leo cột dù chỉ lên "một chút".', answer: 0, explain: 'Làm việc trên cao luôn phải có dây an toàn.' },
          { text: 'Dùng tay trần kiểm tra dây điện nghi bị rò.', answer: 1, explain: 'Dùng bút thử điện và găng cách điện.' },
          { text: 'Cắt điện, treo biển "Cấm đóng điện" trước khi sửa tủ nguồn.', answer: 0, explain: 'Đúng quy trình cô lập nguồn điện.' },
          { text: 'Nghe điện thoại khi lái xe đi hiện trường.', answer: 1, explain: 'Dừng xe an toàn trước khi nghe máy.' },
          { text: 'Để bình chữa cháy ở vị trí dễ thấy, dễ lấy.', answer: 0, explain: 'Thiết bị PCCC phải sẵn sàng sử dụng.' },
        ],
      },
    },
    {
      id: 'an-toan-3',
      kind: 'normal',
      spec: {
        type: 'match',
        title: '5S: Ghép đúng',
        intro: 'Ghép mỗi chữ S với hành động tương ứng.',
        parTimeSec: 50,
        leftLabel: '5S',
        rightLabel: 'Hành động',
        pairs: [
          { a: 'Sàng lọc', b: 'Loại bỏ giấy tờ, vật dụng không còn dùng' },
          { a: 'Sắp xếp', b: 'Đặt dụng cụ đúng chỗ, dán nhãn dễ tìm' },
          { a: 'Sạch sẽ', b: 'Vệ sinh bàn làm việc, thiết bị hằng ngày' },
          { a: 'Săn sóc', b: 'Duy trì 3S trên thành tiêu chuẩn chung' },
          { a: 'Sẵn sàng', b: 'Mọi người tự giác thực hiện thành thói quen' },
        ],
      },
    },
    {
      id: 'an-toan-4',
      kind: 'normal',
      spec: {
        type: 'choice',
        title: 'Xử lý sự cố',
        intro: 'Sự cố mất an toàn xảy ra! Hành động đúng là gì?',
        parTimeSec: 30,
        questions: [
          {
            text: 'Đồng nghiệp bị điện giật đang dính vào dây điện.',
            options: ['Kéo tay đồng nghiệp ra ngay', 'Ngắt nguồn điện hoặc dùng vật cách điện tách nạn nhân ra, rồi gọi cấp cứu', 'Tạt nước vào'],
            correct: 1,
            explain: 'Không chạm trực tiếp; cắt nguồn hoặc dùng vật cách điện khô.',
          },
          {
            text: 'Phát hiện khói bốc ra từ tủ nguồn trong phòng máy.',
            options: ['Mở cửa tủ xem cho rõ', 'Báo động, ngắt nguồn nếu an toàn, dùng bình CO2 và gọi 114', 'Dùng bình nước để dập'],
            correct: 1,
            explain: 'Thiết bị điện dùng bình CO2/bột; không dùng nước.',
          },
        ],
      },
    },
    { id: 'an-toan-5', kind: 'mystery' },
    {
      id: 'an-toan-6',
      kind: 'boss',
      spec: {
        type: 'boss',
        title: 'Boss: Quái Chủ Quan',
        intro: '"Làm nhanh cho xong, an toàn tính sau" – đó là câu cửa miệng của Quái Chủ Quan. Hạ nó!',
        bossName: 'Quái Chủ Quan',
        steps: [
          { label: 'Chuẩn bị', text: 'Trước khi lên cột sửa cáp, việc đầu tiên?', options: ['Leo lên luôn cho nhanh', 'Kiểm tra dây an toàn, mũ, găng và cột', 'Nhờ người đứng dưới giữ thang là đủ'], correct: 1, explain: 'Kiểm tra bảo hộ và hiện trường trước khi làm việc trên cao.' },
          { label: 'Thi công', text: 'Trời bắt đầu có sấm sét khi đang trên cột.', options: ['Làm tiếp cho xong', 'Dừng việc, xuống cột, trú an toàn', 'Ngồi trên cột chờ hết mưa'], correct: 1, explain: 'Dừng ngay khi thời tiết nguy hiểm.' },
          { label: 'Kết thúc', text: 'Làm xong, bạn phát hiện một cáp treo thấp qua đường.', options: ['Không phải việc của mình', 'Báo cáo và xử lý/khoanh vùng cảnh báo', 'Chụp ảnh đăng mạng'], correct: 1, explain: 'Chủ động báo và xử lý mối nguy cho cộng đồng.' },
        ],
      },
    },
  ],
};
