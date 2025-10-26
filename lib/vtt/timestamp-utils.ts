/**
 * Timestamp Utilities for VTT Processing
 * Handles conversion between VTT timestamps and seconds
 */

/**
 * Converts VTT timestamp to seconds
 * @param timestamp VTT timestamp format (HH:MM:SS.mmm)
 * @returns seconds as number
 */
export function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid timestamp format: ${timestamp}`);
  }

  const [hours, minutes, secondsWithMs] = parts;
  const [seconds, milliseconds] = secondsWithMs.split('.');

  const totalSeconds = 
    parseInt(hours) * 3600 + 
    parseInt(minutes) * 60 + 
    parseInt(seconds) + 
    parseInt(milliseconds || '0') / 1000;

  return totalSeconds;
}

/**
 * Converts seconds to VTT timestamp format
 * @param seconds Number of seconds
 * @returns VTT timestamp string (HH:MM:SS.mmm)
 */
export function secondsToTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Calculates duration between two timestamps
 * @param startTime Start timestamp
 * @param endTime End timestamp
 * @returns Duration in seconds
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return timestampToSeconds(endTime) - timestampToSeconds(startTime);
}

/**
 * Checks if a timestamp is valid VTT format
 * @param timestamp Timestamp to validate
 * @returns true if valid VTT timestamp
 */
export function isValidTimestamp(timestamp: string): boolean {
  const vttRegex = /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
  return vttRegex.test(timestamp);
}

/**
 * Parses VTT timestamp line (e.g., "00:00:10.000 --> 00:00:15.000")
 * @param line VTT timestamp line
 * @returns Object with start and end timestamps
 */
export function parseTimestampLine(line: string): { startTime: string; endTime: string } | null {
  const arrowMatch = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
  
  if (!arrowMatch) {
    return null;
  }

  return {
    startTime: arrowMatch[1],
    endTime: arrowMatch[2]
  };
}
