"use client";

import { useEffect, useState } from "react";
import { getVenueStatus, weeklySchedule, type VenueStatus } from "@/lib/venue-hours";

const initialStatus: VenueStatus = {
  weekday: "МОСКОВСКОЕ ВРЕМЯ",
  open: weeklySchedule.monday.open,
  close: weeklySchedule.monday.close,
  status: "РАСПИСАНИЕ ОБНОВЛЯЕТСЯ",
  isOpen: false,
  activeScheduleDay: "monday",
};

const sameStatus = (left: VenueStatus, right: VenueStatus) =>
  left.weekday === right.weekday &&
  left.open === right.open &&
  left.close === right.close &&
  left.status === right.status &&
  left.isOpen === right.isOpen;

export default function VenueHours() {
  const [venueStatus, setVenueStatus] = useState(initialStatus);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const update = () => {
      const nextStatus = getVenueStatus();
      setVenueStatus((current) => sameStatus(current, nextStatus) ? current : nextStatus);
    };

    update();
    const delayToNextMinute = 60_000 - (Date.now() % 60_000) + 50;
    const timeoutId = window.setTimeout(() => {
      update();
      intervalId = setInterval(update, 60_000);
    }, delayToNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="venue-hours" aria-live="polite" aria-label={`Режим работы O’BLOCK: ${venueStatus.status}`}>
      <p><span>СЕГОДНЯ</span><i aria-hidden="true">·</i>{venueStatus.weekday}</p>
      <strong>{venueStatus.open} — {venueStatus.close}</strong>
      <small data-open={venueStatus.isOpen ? "true" : "false"}>{venueStatus.status}</small>
    </div>
  );
}
