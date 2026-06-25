export type RentalMode = "whole" | "per_room";

export const RENTAL_MODES: RentalMode[] = ["whole", "per_room"];

export function parseRentalMode(value: unknown): RentalMode | null {
  if (value === "whole" || value === "per_room") return value;
  return null;
}

export function isWholeMode(mode: string): mode is "whole" {
  return mode === "whole";
}

export function isPerRoomMode(mode: string): mode is "per_room" {
  return mode === "per_room";
}

export type ScopeError = { error: string; status: number };

export function validateReservationScope(
  mode: RentalMode,
  input: { propertyId: number; roomId?: number | null },
): ScopeError | null {
  if (mode === "whole") {
    if (input.roomId != null) {
      return { error: "roomId is not allowed for whole-property rentals", status: 400 };
    }
    return null;
  }
  if (input.roomId == null || !Number.isFinite(input.roomId)) {
    return { error: "roomId is required for per-room properties", status: 400 };
  }
  return null;
}

export function validateOverrideScope(
  mode: RentalMode,
  input: { propertyId?: number | null; roomId?: number | null },
): ScopeError | null {
  if (mode === "whole") {
    if (input.roomId != null) {
      return { error: "roomId is not allowed for whole-property overrides", status: 400 };
    }
    if (input.propertyId == null) {
      return { error: "propertyId is required", status: 400 };
    }
    return null;
  }
  if (input.propertyId != null) {
    return { error: "propertyId is not allowed for per-room overrides", status: 400 };
  }
  if (input.roomId == null) {
    return { error: "roomId is required for per-room overrides", status: 400 };
  }
  return null;
}

export function validateCleaningScope(
  mode: RentalMode,
  input: { propertyId: number; roomId?: number | null },
): ScopeError | null {
  if (mode === "per_room") {
    if (input.roomId == null) {
      return { error: "roomId is required for per-room cleaning records", status: 400 };
    }
    return null;
  }
  return null;
}

export function validateTemplateScope(
  mode: RentalMode,
  input: { propertyId?: number | null; roomId?: number | null },
): ScopeError | null {
  if (mode === "whole") {
    if (input.roomId != null) {
      return { error: "roomId is not allowed for whole-property templates", status: 400 };
    }
    if (input.propertyId == null) {
      return { error: "propertyId is required", status: 400 };
    }
    return null;
  }
  if (input.propertyId != null) {
    return { error: "propertyId is not allowed for per-room templates", status: 400 };
  }
  if (input.roomId == null) {
    return { error: "roomId is required for per-room templates", status: 400 };
  }
  return null;
}

export function wholePropertySyncBlocked(mode: RentalMode): ScopeError | null {
  if (mode === "per_room") {
    return { error: "Calendar sync is not available for per-room properties", status: 403 };
  }
  return null;
}

export function reservationOverlapWhere(
  mode: RentalMode,
  propertyId: number,
  roomId: number | null | undefined,
  range: { checkIn: Date; checkOut: Date },
  excludeReservationId?: number,
) {
  const base = {
    checkIn: { lt: range.checkOut },
    checkOut: { gt: range.checkIn },
    ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
  };
  if (mode === "per_room" && roomId != null) {
    return { ...base, roomId };
  }
  return { ...base, propertyId, roomId: null };
}
