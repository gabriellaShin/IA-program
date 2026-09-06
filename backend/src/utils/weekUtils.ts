import { startOfWeek, endOfWeek, format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { WeekBounds } from '../types/index.js';

const TIMEZONE = 'Asia/Seoul';

/**
 * Get current week bounds (Sun–Sat)
 */
export function getCurrentWeekBounds(date: Date = new Date()): WeekBounds {
  const zonedDate = utcToZonedTime(date, TIMEZONE);
  const weekStart = startOfWeek(zonedDate, { weekStartsOn: 0 }); // 0 = Sunday
  const weekEnd = endOfWeek(zonedDate, { weekStartsOn: 0 }); // 6 = Saturday
  
  return {
    year: weekStart.getFullYear(),
    weekStartDate: format(weekStart, 'yyyy-MM-dd'),
    weekEndDate: format(weekEnd, 'yyyy-MM-dd')
  };
}

/**
 * Get last week bounds (Sun–Sat)
 */
export function getLastWeekBounds(date: Date = new Date()): WeekBounds {
  const lastWeekDate = new Date(date);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  return getCurrentWeekBounds(lastWeekDate);
}

/**
 * Get week bounds for a given date
 */
export function getWeekBoundsForDate(date: Date): WeekBounds {
  return getCurrentWeekBounds(date);
}

/**
 * Compare if two weeks are the same
 */
export function isSameWeek(week1: WeekBounds, week2: WeekBounds): boolean {
  return week1.year === week2.year && 
         week1.weekStartDate === week2.weekStartDate;
}
