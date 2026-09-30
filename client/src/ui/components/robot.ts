import { ASSETS } from '../../config/assets';
import { esc } from '../dom';

/**
 * Robot VNPT guide: the mascot plus a speech bubble. Moods drive small CSS
 * animations (see .robot-guide[data-mood] in games.css).
 */
export type RobotMood = 'idle' | 'happy' | 'sad' | 'think';

export const robotGuide = (text: string, className = ''): string => `
  <div class="robot-guide ${className}" data-robot data-mood="idle" aria-live="polite">
    <div class="speech speech--left" data-robot-text>${esc(text)}</div>
    <img src="${ASSETS.robot.url}" alt="Robot VNPT" draggable="false" />
  </div>`;

export const setRobot = (root: ParentNode, text: string, mood: RobotMood = 'idle'): void => {
  const el = root.querySelector<HTMLElement>('[data-robot]');
  if (!el) return;
  el.querySelector<HTMLElement>('[data-robot-text]')!.textContent = text;
  // restart the animation even when the mood repeats
  el.dataset.mood = 'idle';
  void el.offsetWidth;
  el.dataset.mood = mood;
};
