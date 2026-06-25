import { describe, it, expect } from "vitest";
import {
  parseRentalMode,
  validateReservationScope,
  validateOverrideScope,
  validateCleaningScope,
  validateTemplateScope,
  wholePropertySyncBlocked,
} from "./rental-mode-rules";

describe("parseRentalMode", () => {
  it("accepts whole and per_room", () => {
    expect(parseRentalMode("whole")).toBe("whole");
    expect(parseRentalMode("per_room")).toBe("per_room");
  });

  it("rejects unknown values", () => {
    expect(parseRentalMode("hotel")).toBeNull();
    expect(parseRentalMode(null)).toBeNull();
  });
});

describe("validateReservationScope", () => {
  it("whole mode rejects roomId", () => {
    expect(validateReservationScope("whole", { propertyId: 1, roomId: 2 })).toEqual({
      error: "roomId is not allowed for whole-property rentals",
      status: 400,
    });
  });

  it("whole mode accepts property-only", () => {
    expect(validateReservationScope("whole", { propertyId: 1 })).toBeNull();
  });

  it("per_room requires roomId", () => {
    expect(validateReservationScope("per_room", { propertyId: 1 })).toEqual({
      error: "roomId is required for per-room properties",
      status: 400,
    });
    expect(validateReservationScope("per_room", { propertyId: 1, roomId: 5 })).toBeNull();
  });
});

describe("validateOverrideScope", () => {
  it("whole mode requires propertyId and no roomId", () => {
    expect(validateOverrideScope("whole", { propertyId: 1, roomId: 2 })).not.toBeNull();
    expect(validateOverrideScope("whole", { propertyId: 1 })).toBeNull();
  });

  it("per_room requires roomId only", () => {
    expect(validateOverrideScope("per_room", { propertyId: 1 })).not.toBeNull();
    expect(validateOverrideScope("per_room", { roomId: 3 })).toBeNull();
  });
});

describe("validateCleaningScope", () => {
  it("per_room requires roomId", () => {
    expect(validateCleaningScope("per_room", { propertyId: 1 })).not.toBeNull();
    expect(validateCleaningScope("per_room", { propertyId: 1, roomId: 2 })).toBeNull();
  });

  it("whole mode allows optional roomId", () => {
    expect(validateCleaningScope("whole", { propertyId: 1 })).toBeNull();
    expect(validateCleaningScope("whole", { propertyId: 1, roomId: 2 })).toBeNull();
  });
});

describe("validateTemplateScope", () => {
  it("mirrors override rules for templates", () => {
    expect(validateTemplateScope("whole", { propertyId: 1 })).toBeNull();
    expect(validateTemplateScope("per_room", { roomId: 1 })).toBeNull();
  });
});

describe("wholePropertySyncBlocked", () => {
  it("blocks per_room", () => {
    expect(wholePropertySyncBlocked("per_room")).toEqual({
      error: "Calendar sync is not available for per-room properties",
      status: 403,
    });
  });

  it("allows whole", () => {
    expect(wholePropertySyncBlocked("whole")).toBeNull();
  });
});
