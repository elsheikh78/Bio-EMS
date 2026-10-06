import { describe, it, expect } from "vitest";
import { simMappingLabel } from "./simMapping";
describe("SIM channel mapping", () => {
  it.each([
    [1, 1, 1],
    [4, 1, 4],
    [5, 2, 1],
    [6, 2, 2],
    [8, 2, 4],
    [9, 3, 1],
    [12, 3, 4],
    [13, 4, 1],
    [16, 4, 4],
  ])("maps channel %i to SIM %i input %i", (channel, address, input) => {
    expect(simMappingLabel(channel, false)).toBe(
      `SIM ${address} · Input ${input} · Channel ${channel}`,
    );
  });
  it.each([0, 17, NaN, 1.5])("rejects invalid channel %s", (channel) => {
    expect(simMappingLabel(channel, false)).toBe("SIM mapping unavailable");
  });
});
