import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import timezone from "dayjs/plugin/timezone";
import TimeAgo from "javascript-time-ago";
import zh from "javascript-time-ago/locale/zh";

dayjs.extend(timezone);

dayjs.locale("zh-cn");

TimeAgo.addDefaultLocale(zh);

export function formatDatetime(date: string | Date | undefined | null): string {
  if (!date) {
    return "";
  }
  return dayjs(date).format("YYYY-MM-DD HH:mm");
}

export function timeAgo(date: string | Date | undefined | null): string {
  if (!date) {
    return "";
  }

  const currentDate = new Date();

  if (currentDate.getFullYear() - new Date(date).getFullYear() > 0) {
    return formatDatetime(new Date(date));
  }

  const timeAgo = new TimeAgo("zh");

  return timeAgo.format(new Date(date));
}
