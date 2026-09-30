import type { GameNote } from '../../core/scoring';
import type { DialogueSpec } from '../../data/game-types';
import { avatar } from '../components/avatar';
import { $, esc, onAction } from '../dom';
import { icon } from '../icons';
import type { GameModule } from './types';

const MOOD_FACES = ['😡', '😠', '😐', '🙂', '😊'];

/** "Chọn cách nói": branching chat where each reply moves the customer's mood. */
export const dialogueGame: GameModule<DialogueSpec> = {
  type: 'dialogue',
  mount(root, spec, api) {
    let turn = 0;
    let mood = 40; // 0..100
    let score = 0;
    const notes: GameNote[] = [];
    const timers: number[] = [];

    root.innerHTML = `
      <section class="panel game game--dialogue">
        <header class="chat-head">
          ${avatar(spec.persona.name, 44)}
          <div><strong>${esc(spec.persona.name)}</strong><small>${esc(spec.persona.role)}</small></div>
          <div class="mood" title="Thái độ khách hàng">
            <span class="mood__face" data-face></span>
            <div class="mood__bar"><span data-mood></span></div>
          </div>
        </header>
        <div class="chat" data-chat></div>
        <div class="chat-replies" data-replies></div>
      </section>`;

    const chat = $(root, '[data-chat]');
    const replies = $(root, '[data-replies]');

    const renderMood = () => {
      $(root, '[data-mood]').style.width = `${mood}%`;
      $(root, '[data-face]').textContent = MOOD_FACES[Math.min(4, Math.floor(mood / 20.01))];
    };

    const bubble = (who: 'them' | 'me', text: string) => {
      const b = document.createElement('div');
      b.className = `bubble bubble--${who}`;
      b.textContent = text;
      chat.appendChild(b);
      chat.scrollTop = chat.scrollHeight;
    };

    const showTurn = () => {
      const t = spec.turns[turn];
      bubble('them', t.line);
      replies.innerHTML = t.options
        .map((o, i) => `<button class="reply" data-action="reply" data-i="${i}">${icon('chat', 18)}<span>${esc(o.text)}</span></button>`)
        .join('');
    };

    const stop = onAction(root, {
      reply: (el) => {
        const t = spec.turns[turn];
        const opt = t.options[Number(el.dataset.i)];
        replies.innerHTML = '';
        bubble('me', opt.text);
        score += opt.score;
        mood = Math.max(0, Math.min(100, mood + (opt.score - 1) * 25));
        renderMood();
        const best = t.options.find((o) => o.score === 2)!;
        notes.push({ ok: opt.score === 2, text: opt.score === 2 ? `Tốt: "${opt.text}"` : `Câu tốt hơn: "${best.text}"` });
        api.robot(
          opt.score === 2 ? 'Rất khéo! Khách đã dịu lại.' : opt.score === 1 ? 'Tạm được, nhưng có cách nói tốt hơn.' : 'Ối, câu này làm khách bực hơn rồi!',
          opt.score === 2 ? 'happy' : opt.score === 1 ? 'think' : 'sad',
        );
        timers.push(window.setTimeout(() => {
          bubble('them', opt.reaction);
          turn++;
          if (turn < spec.turns.length) timers.push(window.setTimeout(showTurn, 700));
          else timers.push(window.setTimeout(() => {
            notes.push({ ok: true, text: spec.explain });
            api.finish({ correct: score, total: spec.turns.length * 2, notes });
          }, 900));
        }, 600));
      },
    });

    renderMood();
    showTurn();
    return {
      destroy: () => {
        timers.forEach(clearTimeout);
        stop();
      },
      timeout: () => ({ correct: score, total: spec.turns.length * 2, notes }),
    };
  },
};
