import { detectTimezone, getDefaultOptimalSendTime, detectAndUpdateTimezone, bulkDetectTimezones } from './detection';
import { calculateOptimalSendTime, isBusinessHours, getNextBusinessDaySendTime } from './send-time';
export { locationToTimezone, countryToTimezone, timezoneOffsets } from './mappings';

export class TimezoneService {
  static detectAndUpdateTimezone = detectAndUpdateTimezone;
  static detectTimezone = detectTimezone;
  static getDefaultOptimalSendTime = getDefaultOptimalSendTime;
  static calculateOptimalSendTime = calculateOptimalSendTime;
  static isBusinessHours = isBusinessHours;
  static getNextBusinessDaySendTime = getNextBusinessDaySendTime;
  static bulkDetectTimezones = bulkDetectTimezones;
}
