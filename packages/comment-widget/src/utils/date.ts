import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getLocale } from '../locale';

const localeMap = {
  'zh-CN': 'zh-cn',
  'zh-TW': 'zh-tw',
  en: 'en',
  es: 'es',
};

dayjs.extend(timezone);
dayjs.extend(relativeTime);

dayjs.locale(localeMap[getLocale()]);

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) {
    return '';
  }
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

export function timeAgo(date: string | Date | undefined | null): string {
  if (!date) {
    return '';
  }

  const currentDate = new Date();

  if (currentDate.getFullYear() - new Date(date).getFullYear() > 0) {
    return formatDate(new Date(date));
  }

  return dayjs().to(dayjs(date));
}
