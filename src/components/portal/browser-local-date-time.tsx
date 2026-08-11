"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function BrowserLocalDateTime({ value }: { value: string }) {
  const hasHydrated = useHasHydrated();
  let formattedValue = "—";

  if (hasHydrated) {
    const date = new Date(value);
    formattedValue = Number.isNaN(date.getTime())
      ? "Unavailable"
      : new Intl.DateTimeFormat("en-US", {
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          month: "short",
          timeZoneName: "short",
          year: "numeric",
        }).format(date);
  }

  return <time dateTime={value}>{formattedValue}</time>;
}
