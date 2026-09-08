import type { LiveBoardStatus } from "./liveBoardStatus";

export const LIVE_BOARD_VIEW_STORAGE_KEY = "bio-ems-live-board-view";

export type LiveBoardDensity = "comfortable" | "compact";

export type LiveBoardViewPreferences = {
  alarmFocus: boolean;
  density: LiveBoardDensity;
  search: string;
  site: string;
  status: LiveBoardStatus | "ALL";
};

export const defaultLiveBoardViewPreferences: LiveBoardViewPreferences = {
  alarmFocus: false,
  density: "compact",
  search: "",
  site: "ALL",
  status: "ALL",
};

const validStatuses = new Set<LiveBoardStatus | "ALL">([
  "ALL",
  "NORMAL",
  "WARNING",
  "ALARM",
  "OFFLINE",
]);

export function readLiveBoardViewPreferences(): LiveBoardViewPreferences {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(LIVE_BOARD_VIEW_STORAGE_KEY) ?? "null",
    ) as Partial<LiveBoardViewPreferences> | null;

    if (!parsed || typeof parsed !== "object") {
      return defaultLiveBoardViewPreferences;
    }

    return {
      alarmFocus:
        typeof parsed.alarmFocus === "boolean"
          ? parsed.alarmFocus
          : defaultLiveBoardViewPreferences.alarmFocus,
      density:
        parsed.density === "comfortable" || parsed.density === "compact"
          ? parsed.density
          : defaultLiveBoardViewPreferences.density,
      search:
        typeof parsed.search === "string"
          ? parsed.search.slice(0, 200)
          : defaultLiveBoardViewPreferences.search,
      site:
        typeof parsed.site === "string" && parsed.site.length > 0
          ? parsed.site.slice(0, 200)
          : defaultLiveBoardViewPreferences.site,
      status:
        typeof parsed.status === "string" &&
        validStatuses.has(parsed.status)
          ? parsed.status
          : defaultLiveBoardViewPreferences.status,
    };
  } catch {
    return defaultLiveBoardViewPreferences;
  }
}

export function writeLiveBoardViewPreferences(
  preferences: LiveBoardViewPreferences,
) {
  try {
    localStorage.setItem(LIVE_BOARD_VIEW_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // The live board remains usable when browser storage is unavailable.
  }
}
