/**
 * VTT Parser Unit Tests
 * Tests for VTT parsing, sequence number filtering, and intro detection
 */

import { describe, it, expect } from 'vitest';
import { 
  parseVTT, 
  parseVTTWithIntroDetection, 
  isSequenceNumber, 
  findLectureStart,
  timestampToSeconds,
  secondsToTimestamp,
  validateVTTContent
} from '../lib/vtt';

describe('VTT Parser', () => {
  describe('isSequenceNumber', () => {
    it('should identify sequence numbers correctly', () => {
      expect(isSequenceNumber('1')).toBe(true);
      expect(isSequenceNumber('123')).toBe(true);
      expect(isSequenceNumber('  42  ')).toBe(true);
      expect(isSequenceNumber('0')).toBe(true);
    });

    it('should reject non-sequence numbers', () => {
      expect(isSequenceNumber('Hello')).toBe(false);
      expect(isSequenceNumber('Step 1')).toBe(false);
      expect(isSequenceNumber('Chapter 2')).toBe(false);
      expect(isSequenceNumber('1.5')).toBe(false);
      expect(isSequenceNumber('')).toBe(false);
    });
  });

  describe('parseVTT', () => {
    it('should parse valid VTT correctly', () => {
      const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:03.000
Hello world

2
00:00:03.000 --> 00:00:06.000
This is a test`;

      const segments = parseVTT(vtt);
      
      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({
        index: 0,
        startTime: '00:00:00.000',
        endTime: '00:00:03.000',
        text: 'Hello world'
      });
      expect(segments[1]).toEqual({
        index: 1,
        startTime: '00:00:03.000',
        endTime: '00:00:06.000',
        text: 'This is a test'
      });
    });

    it('should skip sequence numbers but preserve numbers in speech', () => {
      const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:03.000
Step 1 is important

2
00:00:03.000 --> 00:00:06.000
Chapter 2 begins here`;

      const segments = parseVTT(vtt);
      
      expect(segments).toHaveLength(2);
      expect(segments[0].text).toBe('Step 1 is important'); // "1" preserved in speech
      expect(segments[1].text).toBe('Chapter 2 begins here'); // "2" preserved in speech
    });

    it('should handle multi-line text content', () => {
      const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:05.000
This is a multi-line
text segment
with multiple lines

2
00:00:05.000 --> 00:00:08.000
Single line segment`;

      const segments = parseVTT(vtt);
      
      expect(segments).toHaveLength(2);
      expect(segments[0].text).toBe('This is a multi-line text segment with multiple lines');
      expect(segments[1].text).toBe('Single line segment');
    });

    it('should handle malformed VTT gracefully', () => {
      const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:03.000
Valid segment

2
Invalid timestamp line
This should be skipped

3
00:00:05.000 --> 00:00:08.000
Another valid segment`;

      const segments = parseVTT(vtt);
      
      expect(segments).toHaveLength(2);
      expect(segments[0].text).toBe('Valid segment');
      expect(segments[1].text).toBe('Another valid segment');
    });

    it('should throw error for invalid content', () => {
      expect(() => parseVTT('')).toThrow('Invalid VTT content');
      expect(() => parseVTT(null as any)).toThrow('Invalid VTT content');
      expect(() => parseVTT(undefined as any)).toThrow('Invalid VTT content');
    });
  });

  describe('findLectureStart', () => {
    it('should detect lecture start by keywords', () => {
      const segments = [
        { index: 0, text: 'Music playing...', startTime: '00:00:00.000', endTime: '00:00:05.000' },
        { index: 1, text: 'Welcome everyone', startTime: '00:00:05.000', endTime: '00:00:10.000' },
        { index: 2, text: 'Today we will cover Docker', startTime: '00:00:10.000', endTime: '00:00:15.000' },
        { index: 3, text: 'Let\'s start with the basics', startTime: '00:00:15.000', endTime: '00:00:20.000' }
      ];

      const startIndex = findLectureStart(segments);
      expect(startIndex).toBe(2); // Found "Today we will cover"
    });

    it('should use 10-minute fallback when no keywords found', () => {
      const segments = [
        { index: 0, text: 'Music', startTime: '00:00:00.000', endTime: '00:00:05.000' },
        { index: 1, text: 'Welcome', startTime: '00:00:05.000', endTime: '00:00:10.000' },
        { index: 2, text: 'Some intro content', startTime: '00:09:00.000', endTime: '00:09:05.000' },
        { index: 3, text: 'Docker is a containerization platform with many features', startTime: '00:10:30.000', endTime: '00:10:35.000' }
      ];

      const startIndex = findLectureStart(segments);
      expect(startIndex).toBe(3); // After 10 minutes with substantial content
    });

    it('should return 0 for empty segments', () => {
      const startIndex = findLectureStart([]);
      expect(startIndex).toBe(0);
    });
  });

  describe('parseVTTWithIntroDetection', () => {
    it('should parse VTT and detect lecture start', () => {
      const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:05.000
Music playing

2
00:00:05.000 --> 00:00:10.000
Welcome everyone

3
00:00:10.000 --> 00:00:15.000
Today we will cover Docker

4
00:00:15.000 --> 00:00:20.000
Let's start with the basics`;

      const result = parseVTTWithIntroDetection(vtt);
      
      expect(result.segments).toHaveLength(4);
      expect(result.lectureStartIndex).toBe(2); // "Today we will cover"
      expect(result.totalDuration).toBe(20);
    });
  });

  describe('timestampToSeconds', () => {
    it('should convert timestamps to seconds correctly', () => {
      expect(timestampToSeconds('00:00:00.000')).toBe(0);
      expect(timestampToSeconds('00:01:00.000')).toBe(60);
      expect(timestampToSeconds('01:00:00.000')).toBe(3600);
      expect(timestampToSeconds('01:30:45.500')).toBe(5445.5);
    });

    it('should handle milliseconds correctly', () => {
      expect(timestampToSeconds('00:00:01.250')).toBe(1.25);
      expect(timestampToSeconds('00:00:01.999')).toBe(1.999);
    });
  });

  describe('secondsToTimestamp', () => {
    it('should convert seconds to timestamps correctly', () => {
      expect(secondsToTimestamp(0)).toBe('00:00:00.000');
      expect(secondsToTimestamp(60)).toBe('00:01:00.000');
      expect(secondsToTimestamp(3600)).toBe('01:00:00.000');
      expect(secondsToTimestamp(5445.5)).toBe('01:30:45.500');
    });

    it('should handle milliseconds correctly', () => {
      expect(secondsToTimestamp(1.25)).toBe('00:00:01.250');
      expect(secondsToTimestamp(1.999)).toBe('00:00:01.999');
    });
  });

  describe('validateVTTContent', () => {
    it('should validate correct VTT content', () => {
      const validVTT = `WEBVTT

1
00:00:00.000 --> 00:00:03.000
Hello world`;

      const result = validateVTTContent(validVTT);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid VTT content', () => {
      const invalidVTT = `Just some text without VTT format`;

      const result = validateVTTContent(invalidVTT);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty content', () => {
      const result = validateVTTContent('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content must be a non-empty string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle VTT with no segments', () => {
      const vtt = `WEBVTT`;
      const segments = parseVTT(vtt);
      expect(segments).toHaveLength(0);
    });

    it('should handle VTT with only sequence numbers', () => {
      const vtt = `WEBVTT

1
2
3`;
      const segments = parseVTT(vtt);
      expect(segments).toHaveLength(0);
    });

    it('should handle VTT with malformed timestamps', () => {
      const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:03.000
Valid segment

2
Invalid timestamp
This should be skipped

3
00:00:05.000 --> 00:00:08.000
Another valid segment`;

      const segments = parseVTT(vtt);
      expect(segments).toHaveLength(2);
    });
  });
});
