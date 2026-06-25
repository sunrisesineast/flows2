import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty, canReadProperty } from "@/lib/ownership";
import {
  assertRoomBelongsToProperty,
  getPropertyRentalMode,
  validateOverrideScope,
} from "@/lib/rental-mode";

// GET /api/date-overrides?propertyId=1[&roomId=2]
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    const roomIdParam = request.nextUrl.searchParams.get("roomId");

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const numId = Number(propertyId);
    if (!(await canReadProperty(numId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rentalMode = (await getPropertyRentalMode(numId)) ?? "whole";
    if (rentalMode === "per_room") {
      if (!roomIdParam) {
        return NextResponse.json({ error: "roomId is required for per-room properties" }, { status: 400 });
      }
      const roomId = Number(roomIdParam);
      if (!(await assertRoomBelongsToProperty(roomId, numId))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const overrides = await prisma.dateOverride.findMany({
        where: { roomId },
        orderBy: { date: "asc" },
      });
      return NextResponse.json(overrides);
    }

    const overrides = await prisma.dateOverride.findMany({
      where: { propertyId: numId, roomId: null },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(overrides);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/date-overrides — toggle a date override (create or delete)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { propertyId, roomId, date, type, note } = body;

    if (!date || !type) {
      return NextResponse.json({ error: "date and type are required" }, { status: 400 });
    }

    if (!["open", "closed", "cleaning"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'open', 'closed', or 'cleaning'" },
        { status: 400 },
      );
    }

    const numPropertyId = propertyId != null ? Number(propertyId) : null;
    const numRoomId = roomId != null ? Number(roomId) : null;

    let rentalMode = "whole" as "whole" | "per_room";
    let authPropertyId = numPropertyId;

    if (numPropertyId != null) {
      rentalMode = (await getPropertyRentalMode(numPropertyId)) ?? "whole";
      authPropertyId = numPropertyId;
    } else if (numRoomId != null) {
      const room = await prisma.room.findUnique({
        where: { id: numRoomId },
        select: { propertyId: true },
      });
      if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
      authPropertyId = room.propertyId;
      rentalMode = (await getPropertyRentalMode(room.propertyId)) ?? "whole";
    } else {
      return NextResponse.json({ error: "propertyId or roomId is required" }, { status: 400 });
    }

    if (
      authPropertyId == null ||
      !(await canManageProperty(authPropertyId, session.userId, session.role))
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const scopeError = validateOverrideScope(rentalMode, {
      propertyId: numPropertyId,
      roomId: numRoomId,
    });
    if (scopeError) {
      return NextResponse.json({ error: scopeError.error }, { status: scopeError.status });
    }

    if (
      rentalMode === "per_room" &&
      numRoomId != null &&
      !(await assertRoomBelongsToProperty(numRoomId, authPropertyId))
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing =
      rentalMode === "per_room" && numRoomId != null
        ? await prisma.dateOverride.findUnique({
            where: { roomId_date: { roomId: numRoomId, date } },
          })
        : await prisma.dateOverride.findFirst({
            where: { propertyId: authPropertyId, roomId: null, date },
          });

    if (existing && existing.type === type) {
      await prisma.dateOverride.delete({ where: { id: existing.id } });
      await logAudit(session.userId, "delete", "override", existing.id, {
        propertyId: authPropertyId,
        roomId: numRoomId,
        date,
        type,
      });
      return NextResponse.json({ action: "removed", date, type });
    }

    const override =
      existing != null
        ? await prisma.dateOverride.update({
            where: { id: existing.id },
            data: { type, note: note || "" },
          })
        : rentalMode === "per_room" && numRoomId != null
          ? await prisma.dateOverride.create({
              data: {
                roomId: numRoomId,
                date,
                type,
                note: note || "",
              },
            })
          : await prisma.dateOverride.create({
              data: {
                propertyId: authPropertyId,
                date,
                type,
                note: note || "",
              },
            });

    await logAudit(session.userId, existing ? "update" : "create", "override", override.id, {
      propertyId: authPropertyId,
      roomId: numRoomId,
      date,
      type,
    });

    return NextResponse.json({ action: "created", override });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/date-overrides?propertyId=1&date=2025-04-10[&roomId=2]
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    const roomIdParam = request.nextUrl.searchParams.get("roomId");
    const date = request.nextUrl.searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    let authPropertyId: number | null = propertyId ? Number(propertyId) : null;
    let roomId: number | null = roomIdParam ? Number(roomIdParam) : null;

    if (authPropertyId != null) {
      if (!(await canManageProperty(authPropertyId, session.userId, session.role))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    } else if (roomId != null) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { propertyId: true },
      });
      if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
      authPropertyId = room.propertyId;
      if (!(await canManageProperty(authPropertyId, session.userId, session.role))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "propertyId or roomId is required" }, { status: 400 });
    }

    const rentalMode = (await getPropertyRentalMode(authPropertyId!)) ?? "whole";
    const scopeError = validateOverrideScope(rentalMode, {
      propertyId: authPropertyId,
      roomId,
    });
    if (scopeError) {
      return NextResponse.json({ error: scopeError.error }, { status: scopeError.status });
    }

    try {
      const removed =
        rentalMode === "per_room" && roomId != null
          ? await prisma.dateOverride.delete({
              where: { roomId_date: { roomId, date } },
            })
          : await prisma.dateOverride.delete({
              where: { propertyId_date: { propertyId: authPropertyId!, date } },
            });
      await logAudit(session.userId, "delete", "override", removed.id, {
        propertyId: authPropertyId,
        roomId,
        date,
      });
      return NextResponse.json({ action: "removed", date });
    } catch {
      return NextResponse.json({ action: "not_found", date });
    }
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
