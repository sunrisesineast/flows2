import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canReadProperty, listAccessiblePropertyIds } from "@/lib/ownership";
import {
  assertRoomBelongsToProperty,
  getPropertyRentalMode,
  validateCleaningScope,
} from "@/lib/rental-mode";

export const dynamic = "force-dynamic";

// GET /api/cleaning-records?propertyId=X[&propertyIds=1,2,3][&roomId=Y]
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    const propertyIdsRaw = request.nextUrl.searchParams.get("propertyIds");
    const roomIdParam = request.nextUrl.searchParams.get("roomId");

    let scopedIds: number[] = [];
    if (propertyId) {
      const numId = parseInt(propertyId);
      if (isNaN(numId)) {
        return NextResponse.json({ error: "Invalid propertyId" }, { status: 400 });
      }
      if (!(await canReadProperty(numId, session.userId, session.role))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      scopedIds = [numId];
    } else if (propertyIdsRaw) {
      const ids = propertyIdsRaw
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));
      const allowed = await Promise.all(
        ids.map((id) => canReadProperty(id, session.userId, session.role)),
      );
      scopedIds = ids.filter((_, i) => allowed[i]);
    } else {
      scopedIds = await listAccessiblePropertyIds(session.userId, session.role);
    }

    if (scopedIds.length === 0) {
      return NextResponse.json({ records: [] });
    }

    const where: { propertyId: { in: number[] }; roomId?: number } = {
      propertyId: { in: scopedIds },
    };
    if (roomIdParam) {
      const roomId = parseInt(roomIdParam);
      if (!isNaN(roomId)) where.roomId = roomId;
    }

    const records = await prisma.cleaningRecord.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ records });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/cleaning-records — body { propertyId, date, status, notes?, roomId? }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { propertyId, roomId, date, status, notes } = await request.json();
    if (!propertyId || !date || !status) {
      return NextResponse.json(
        { error: "propertyId, date, and status are required" },
        { status: 400 },
      );
    }
    if (!["pending", "done", "skipped"].includes(status)) {
      return NextResponse.json(
        { error: "status must be pending, done, or skipped" },
        { status: 400 },
      );
    }
    const numId = Number(propertyId);
    if (!(await canReadProperty(numId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rentalMode = (await getPropertyRentalMode(numId)) ?? "whole";
    const parsedRoomId = roomId != null ? Number(roomId) : null;
    const scopeError = validateCleaningScope(rentalMode, {
      propertyId: numId,
      roomId: parsedRoomId,
    });
    if (scopeError) {
      return NextResponse.json({ error: scopeError.error }, { status: scopeError.status });
    }

    if (
      parsedRoomId != null &&
      !(await assertRoomBelongsToProperty(parsedRoomId, numId))
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date();
    const updateData = {
      status,
      notes: typeof notes === "string" ? notes : undefined,
      doneAt: status === "done" ? now : null,
      doneByUserId: status === "done" ? session.userId : null,
      updatedAt: now,
    };
    const createData = {
      propertyId: numId,
      roomId: parsedRoomId,
      date,
      status,
      notes: typeof notes === "string" ? notes : "",
      doneAt: status === "done" ? now : null,
      doneByUserId: status === "done" ? session.userId : null,
    };

    let record;
    if (parsedRoomId != null) {
      record = await prisma.cleaningRecord.upsert({
        where: { roomId_date: { roomId: parsedRoomId, date } },
        update: updateData,
        create: createData,
      });
    } else {
      const existing = await prisma.cleaningRecord.findFirst({
        where: { propertyId: numId, roomId: null, date },
      });
      record = existing
        ? await prisma.cleaningRecord.update({
            where: { id: existing.id },
            data: updateData,
          })
        : await prisma.cleaningRecord.create({ data: createData });
    }

    return NextResponse.json({ record });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
