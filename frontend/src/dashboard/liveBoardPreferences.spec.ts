import { beforeEach, describe, expect, it } from "vitest";
import {
  defaultLiveBoardViewPreferences,
  LIVE_BOARD_VIEW_STORAGE_KEY,
  readLiveBoardViewPreferences,
  writeLiveBoardViewPreferences,
} from "./liveBoardPreferences";

describe("live board view preferences", () => {
  beforeEach(() => localStorage.clear());

  it("uses compact safe defaults without stored preferences", () => {
    expect(readLiveBoardViewPreferences()).toEqual(
      defaultLiveBoardViewPreferences,
    );
  });

  it("persists trusted operational view choices", () => {
    writeLiveBoardViewPreferences({
      alarmFocus: true,
      density: "comfortable",
      search: "Cold Room",
      site: "Cairo Site",
      status: "WARNING",
    });

    expect(readLiveBoardViewPreferences()).toEqual({
      alarmFocus: true,
      density: "comfortable",
      search: "Cold Room",
      site: "Cairo Site",
      status: "WARNING",
    });
  });

  it("rejects corrupt and unsupported stored values", () => {
    localStorage.setItem(LIVE_BOARD_VIEW_STORAGE_KEY, "{broken");
    expect(readLiveBoardViewPreferences()).toEqual(
      defaultLiveBoardViewPreferences,
    );

    localStorage.setItem(
      LIVE_BOARD_VIEW_STORAGE_KEY,
      JSON.stringify({
        alarmFocus: "yes",
        density: "huge",
        search: 7,
        site: "",
        status: "CRITICAL",
      }),
    );
    expect(readLiveBoardViewPreferences()).toEqual(
      defaultLiveBoardViewPreferences,
    );
  });
});
