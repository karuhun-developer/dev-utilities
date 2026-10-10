/// <reference types="bun" />
import { describe, expect, it } from 'bun:test';
import { formatTimestamp, normalizeCues, serializeSrt, SubtitleError } from './audio-to-srt';

describe('SRT subtitles', () => {
  it('carries rounded milliseconds into the next minute and hour', () => {
    const times = [59_999.6, 3_599_999.6, 36_000_123];
    const formatted = times.map(formatTimestamp);
    expect(formatted).toEqual(['00:01:00,000', '01:00:00,000', '10:00:00,123']);
  });

  it('uses the audio duration when the final model timestamp is missing', () => {
    const result = { text: 'Halo dunia', chunks: [{ text: ' Halo dunia ', timestamp: [1.2345, null] }] };
    const cues = normalizeCues(result, 4.5678);
    expect(cues).toEqual([{ startMs: 1235, endMs: 4568, text: 'Halo dunia' }]);
  });

  it('uses the next segment start when an intermediate end is missing', () => {
    const result = { text: 'One. Two.', chunks: [
      { text: 'One.', timestamp: [0, null] },
      { text: 'Two.', timestamp: [2, 8] },
    ] };
    const cues = normalizeCues(result, 5);
    expect(cues).toEqual([{ startMs: 0, endMs: 2000, text: 'One.' }, { startMs: 2000, endMs: 5000, text: 'Two.' }]);
  });

  it('exports edited Unicode text with contiguous numbering and no empty blocks', () => {
    const cues = [
      { startMs: 0, endMs: 1500, text: '  Halo, dunia!  ' },
      { startMs: 1500, endMs: 2000, text: ' \n ' },
      { startMs: 2000, endMs: 4000, text: '日本語\n\nBaris kedua' },
    ];
    const output = serializeSrt(cues);
    expect(output).toBe('1\r\n00:00:00,000 --> 00:00:01,500\r\nHalo, dunia!\r\n\r\n2\r\n00:00:02,000 --> 00:00:04,000\r\n日本語\r\nBaris kedua\r\n');
  });

  it('returns no cues when the model detects no speech', () => {
    const result = { text: ' ', chunks: [] };
    const cues = normalizeCues(result, 10);
    expect(cues).toEqual([]);
  });

  it('rejects recognized text without timings instead of inventing subtitles', () => {
    const result = { text: 'Detected speech' };
    const action = () => normalizeCues(result, 10);
    expect(action).toThrow(SubtitleError);
  });

  it.each([
    { timestamps: [[null, 2]] },
    { timestamps: [[3, 2]] },
    { timestamps: [[0, 0]] },
    { timestamps: [[8, 10]] },
    { timestamps: [[2, 3], [1, 4]] },
  ])('rejects invalid or unordered model timings %j', ({ timestamps }) => {
    const result = { text: 'Speech', chunks: timestamps.map(timestamp => ({ text: 'Speech', timestamp })) };
    const action = () => normalizeCues(result, 5);
    expect(action).toThrow(SubtitleError);
  });
});
