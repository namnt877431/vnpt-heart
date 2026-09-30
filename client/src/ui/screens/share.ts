import { addStory, stories } from '../../core/progress';
import { robotGuide, setRobot } from '../components/robot';
import { toast } from '../components/overlay';
import { $, esc, onAction } from '../dom';
import { icon } from '../icons';
import type { ScreenModule } from './types';

const UNITS = ['Kinh doanh', 'Kỹ thuật', 'Hạ tầng', 'Chăm sóc khách hàng', 'Văn phòng', 'Khác'];

const FIELDS: { name: keyof Omit<ReturnType<typeof stories>[number], 'at' | 'unit' | 'anonymous'>; label: string; hint: string; required?: boolean }[] = [
  { name: 'situation', label: 'Tình huống đã từng gặp', hint: 'Chuyện gì đã xảy ra? Ở đâu, khi nào (không cần tên thật)?', required: true },
  { name: 'problem', label: 'Vấn đề phát sinh', hint: 'Khó khăn cốt lõi của tình huống là gì?' },
  { name: 'handling', label: 'Cách xử lý thực tế', hint: 'Bạn/đồng nghiệp đã làm gì, theo thứ tự nào?', required: true },
  { name: 'difficulty', label: 'Khó khăn / vướng mắc', hint: 'Điều gì làm việc xử lý chậm hoặc khó?' },
  { name: 'outcome', label: 'Kết quả xử lý', hint: 'Khách hàng/công việc được giải quyết ra sao?' },
  { name: 'lesson', label: 'Bài học / kinh nghiệm rút ra', hint: 'Nếu gặp lại, nên làm gì? Điều gì nên tránh?', required: true },
];

const PIPELINE = ['Thu thập', 'Biên tập', 'Ẩn thông tin nhạy cảm', 'Chuyển thành kịch bản', 'Thiết kế game', 'Đưa lên nền tảng'];

/**
 * "Chia sẻ tình huống thực tế" form (script section IV.6). DEMO: submissions
 * are kept in this browser only; production sends them to the backend for
 * the organising team to review.
 */
export const shareScreen: ScreenModule = {
  id: 'share',
  scene: 'Map',
  mount(root, { go }) {
    const render = () => `
      <div class="screen screen--center">
        <section class="panel share">
          <header class="panel__ribbon">${icon('chat', 26)} CHIA SẺ TÌNH HUỐNG THỰC TẾ</header>
          <div class="share__grid">
            <form class="share__form" data-form novalidate>
              <p class="share__lead">
                Mỗi tình huống bạn chia sẻ có thể trở thành một màn chơi cho cả đơn vị:
                <b>một tình huống → một bài học → một trò chơi → một kinh nghiệm được lan tỏa.</b>
              </p>
              <label class="field">
                <span>Khối / đơn vị</span>
                <select name="unit">${UNITS.map((u) => `<option>${esc(u)}</option>`).join('')}</select>
              </label>
              ${FIELDS.map((f) => `
                <label class="field">
                  <span>${esc(f.label)}${f.required ? ' <i>*</i>' : ''}</span>
                  <textarea name="${f.name}" rows="2" placeholder="${esc(f.hint)}" ${f.required ? 'required' : ''}></textarea>
                </label>`).join('')}
              <label class="check"><input type="checkbox" name="anonymous" checked /> Gửi ẩn danh</label>
              <label class="check"><input type="checkbox" name="consent" /> Tôi đồng ý để Ban tổ chức biên tập và ẩn thông tin nhạy cảm trước khi đưa vào game <i>*</i></label>
              <p class="share__warn">${icon('shield', 16)} Không ghi số điện thoại, CCCD, địa chỉ hay thông tin cá nhân của khách hàng.</p>
              <button class="btn btn--gold" type="submit">Gửi tình huống ${icon('chevronRight', 18)}</button>
            </form>
            <aside class="share__side">
              ${robotGuide('Kinh nghiệm của bạn rất quý! Chia sẻ để đồng nghiệp học hỏi nhé.')}
              <h3>Tình huống sẽ đi qua</h3>
              <ol class="pipeline">${PIPELINE.map((p, i) => `<li><span>${i + 1}</span>${esc(p)}</li>`).join('')}</ol>
              <p class="share__count">${icon('book', 16)} Bạn đã gửi <b data-count>${stories().length}</b> tình huống</p>
              <p class="share__demo">Bản demo: dữ liệu chỉ lưu trên trình duyệt này.</p>
            </aside>
          </div>
          <button class="btn btn--ghost btn--sm board__back" type="button" data-action="back">${icon('chevronLeft', 16)} Bản đồ</button>
        </section>
      </div>`;

    root.innerHTML = render();
    const screen = $(root, '.screen');
    const form = $<HTMLFormElement>(screen, '[data-form]');

    const onSubmit = (e: SubmitEvent) => {
      e.preventDefault();
      const fd = new FormData(form);
      const missing = FIELDS.filter((f) => f.required && !String(fd.get(f.name) ?? '').trim());
      if (missing.length) {
        setRobot(screen, `Bạn điền giúp mình mục "${missing[0].label}" nhé.`, 'think');
        form.querySelector<HTMLTextAreaElement>(`[name="${missing[0].name}"]`)?.focus();
        return;
      }
      if (!fd.get('consent')) {
        setRobot(screen, 'Bạn cần đồng ý để Ban tổ chức biên tập tình huống nhé.', 'think');
        return;
      }
      addStory({
        at: new Date().toISOString(),
        unit: String(fd.get('unit')),
        situation: String(fd.get('situation')),
        problem: String(fd.get('problem') ?? ''),
        handling: String(fd.get('handling')),
        difficulty: String(fd.get('difficulty') ?? ''),
        outcome: String(fd.get('outcome') ?? ''),
        lesson: String(fd.get('lesson')),
        anonymous: !!fd.get('anonymous'),
      });
      form.reset();
      $(screen, '[data-count]').textContent = String(stories().length);
      screen.querySelector('.pipeline li')?.classList.add('is-active');
      setRobot(screen, 'Cảm ơn bạn! Tình huống đã vào bước "Thu thập". Ban tổ chức sẽ biên tập và đưa vào game.', 'happy');
      toast('Đã gửi tình huống. Cảm ơn bạn!', 'check');
    };
    form.addEventListener('submit', onSubmit);
    const stop = onAction(screen, { back: () => go('home') });

    return () => {
      form.removeEventListener('submit', onSubmit);
      stop();
    };
  },
};
