export const VENUE_TIME_ZONE = "Europe/Moscow";
export const VENUE_NAME = "O’BLOCK";
export const VENUE_CITY = "Иваново";
export const VENUE_STREET_ADDRESS = "ул. Смирнова, д. 7";
export const VENUE_ADDRESS = `г. ${VENUE_CITY}, ${VENUE_STREET_ADDRESS}`;

export const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export const weeklySchedule: Record<WeekdayKey, {
  label: string;
  schemaDay: string;
  open: string;
  close: string;
}> = {
  sunday: { label: "ВОСКРЕСЕНЬЕ", schemaDay: "Sunday", open: "17:00", close: "00:00" },
  monday: { label: "ПОНЕДЕЛЬНИК", schemaDay: "Monday", open: "17:00", close: "00:00" },
  tuesday: { label: "ВТОРНИК", schemaDay: "Tuesday", open: "17:00", close: "00:00" },
  wednesday: { label: "СРЕДА", schemaDay: "Wednesday", open: "17:00", close: "00:00" },
  thursday: { label: "ЧЕТВЕРГ", schemaDay: "Thursday", open: "17:00", close: "00:00" },
  friday: { label: "ПЯТНИЦА", schemaDay: "Friday", open: "17:00", close: "03:00" },
  saturday: { label: "СУББОТА", schemaDay: "Saturday", open: "17:00", close: "03:00" },
};

const weekdayIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const venueClockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: VENUE_TIME_ZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const getVenueClock = (date: Date) => {
  const parts = Object.fromEntries(
    venueClockFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const dayIndex = weekdayIndex[parts.weekday];
  return {
    dayIndex,
    minuteOfDay: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

export type VenueStatus = {
  weekday: string;
  open: string;
  close: string;
  status: string;
  isOpen: boolean;
  activeScheduleDay: WeekdayKey;
};

export function getVenueStatus(date = new Date()): VenueStatus {
  const { dayIndex, minuteOfDay } = getVenueClock(date);
  const todayKey = WEEKDAY_KEYS[dayIndex];
  const previousKey = WEEKDAY_KEYS[(dayIndex + 6) % 7];
  const today = weeklySchedule[todayKey];
  const previous = weeklySchedule[previousKey];

  const todayOpen = timeToMinutes(today.open);
  const todayClose = timeToMinutes(today.close);
  const previousOpen = timeToMinutes(previous.open);
  const previousClose = timeToMinutes(previous.close);

  const previousRunsOvernight = previousClose <= previousOpen && previousClose > 0;
  const openFromPreviousDay = previousRunsOvernight && minuteOfDay < previousClose;
  const todayRunsOvernight = todayClose <= todayOpen;
  const openInTodayPeriod = minuteOfDay >= todayOpen && (todayRunsOvernight || minuteOfDay < todayClose);

  if (openFromPreviousDay) {
    return {
      weekday: today.label,
      open: previous.open,
      close: previous.close,
      status: `ОТКРЫТО ДО ${previous.close}`,
      isOpen: true,
      activeScheduleDay: previousKey,
    };
  }

  if (openInTodayPeriod) {
    return {
      weekday: today.label,
      open: today.open,
      close: today.close,
      status: `ОТКРЫТО ДО ${today.close}`,
      isOpen: true,
      activeScheduleDay: todayKey,
    };
  }

  return {
    weekday: today.label,
    open: today.open,
    close: today.close,
    status: `ОТКРОЕМСЯ В ${today.open}`,
    isOpen: false,
    activeScheduleDay: todayKey,
  };
}

export const openingHoursSpecification = WEEKDAY_KEYS.map((key) => ({
  "@type": "OpeningHoursSpecification",
  dayOfWeek: `https://schema.org/${weeklySchedule[key].schemaDay}`,
  opens: weeklySchedule[key].open,
  closes: weeklySchedule[key].close,
}));
