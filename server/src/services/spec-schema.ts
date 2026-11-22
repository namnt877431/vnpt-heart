import { z } from 'zod';
import type { GameSpec } from '../../../shared/game-types';

/**
 * Validation of level specs saved from the admin page — one schema per game
 * type in shared/game-types.ts. Keep in sync: the `GameSpec` annotation at the
 * bottom fails to compile if a schema no longer produces a valid spec.
 */

const text = (max = 2000) => z.string().trim().min(1, 'Không được để trống').max(max);
const optText = (max = 2000) => z.string().trim().max(max);

const choiceQuestion = z
  .object({
    text: text(),
    options: z.array(text(500)).min(2, 'Cần ít nhất 2 phương án').max(6),
    correct: z.number().int().min(0),
    explain: optText(),
  })
  .refine((q) => q.correct < q.options.length, { message: 'Đáp án đúng không nằm trong danh sách phương án', path: ['correct'] });

const base = {
  title: text(120),
  intro: optText(600),
  timeLimitSec: z.number().int().min(5).max(3600).optional(),
  parTimeSec: z.number().int().min(1).max(3600).optional(),
};

const spotPart = z.union([z.string(), z.object({ bad: text(500), why: text(500) })]);

export const gameSpecSchema = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('choice'), questions: z.array(choiceQuestion).min(1).max(30) }),
  z.object({
    ...base,
    type: z.literal('dialogue'),
    persona: z.object({ name: text(80), role: optText(80) }),
    turns: z
      .array(
        z.object({
          line: text(),
          options: z
            .array(z.object({ text: text(500), score: z.union([z.literal(0), z.literal(1), z.literal(2)]), reaction: optText(500) }))
            .min(2)
            .max(4),
        }),
      )
      .min(1)
      .max(10),
    explain: optText(),
  }),
  z
    .object({
      ...base,
      type: z.literal('spot-errors'),
      format: z.enum(['email', 'chat', 'doc']),
      header: z.object({ from: optText(200).optional(), to: optText(200).optional(), subject: optText(200).optional() }).optional(),
      lines: z.array(z.array(spotPart)).min(1).max(40),
    })
    .refine((s) => s.lines.flat().some((p) => typeof p !== 'string'), { message: 'Cần ít nhất 1 lỗi để tìm', path: ['lines'] }),
  z.object({
    ...base,
    type: z.literal('match'),
    leftLabel: text(60),
    rightLabel: text(60),
    pairs: z.array(z.object({ a: text(300), b: text(300), explain: optText(500).optional() })).min(2).max(10),
  }),
  z.object({ ...base, type: z.literal('order'), steps: z.array(text(300)).min(2).max(12), explain: optText() }),
  z.object({
    ...base,
    type: z.literal('binary'),
    labels: z.tuple([text(40), text(40)]),
    items: z.array(z.object({ text: text(500), answer: z.union([z.literal(0), z.literal(1)]), explain: optText(500) })).min(1).max(30),
  }),
  z.object({
    ...base,
    type: z.literal('hazard'),
    scene: z.literal('workplace'),
    hazards: z
      .array(
        z.object({
          id: text(40),
          x: z.number().min(0).max(800),
          y: z.number().min(0).max(450),
          r: z.number().min(10).max(200),
          label: text(120),
          explain: optText(500),
        }),
      )
      .min(1)
      .max(15),
  }),
  z.object({
    ...base,
    type: z.literal('investigate'),
    incident: text(),
    clues: z.array(z.object({ kind: z.enum(['email', 'chat', 'data', 'log']), title: text(120), body: text() })).min(1).max(10),
    minClues: z.number().int().min(0).max(10),
    question: choiceQuestion,
  }),
  z.object({ ...base, type: z.literal('escape'), locks: z.array(choiceQuestion).min(1).max(6) }),
  z.object({
    ...base,
    type: z.literal('boss'),
    bossName: text(80),
    steps: z.array(z.intersection(choiceQuestion, z.object({ label: text(80) }))).min(1).max(8),
  }),
]);

/** Parse an untrusted spec; throws ZodError with Vietnamese messages. */
export const parseSpec = (input: unknown): GameSpec => {
  const spec: GameSpec = gameSpecSchema.parse(input);
  return spec;
};
