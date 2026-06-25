import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty } from "@/lib/ownership";

async function loadRoom(propertyId: number, roomId: number) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || room.propertyId !== propertyId) return null;
  return room;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, roomId: roomIdParam } = await params;
    const propertyId = parseInt(id);
    const roomId = parseInt(roomIdParam);
    if (isNaN(propertyId) || isNaN(roomId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    if (!(await canManageProperty(propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = await loadRoom(propertyId, roomId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const data: { name?: string; sortOrder?: number } = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
      data.name = name;
    }
    if (body.sortOrder !== undefined) {
      if (!Number.isFinite(Number(body.sortOrder))) {
        return NextResponse.json({ error: "Invalid sortOrder" }, { status: 400 });
      }
      data.sortOrder = Number(body.sortOrder);
    }

    const room = await prisma.room.update({ where: { id: roomId }, data });
    await logAudit(session.userId, "update", "room", roomId, data);
    return NextResponse.json(room);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, roomId: roomIdParam } = await params;
    const propertyId = parseInt(id);
    const roomId = parseInt(roomIdParam);
    if (isNaN(propertyId) || isNaN(roomId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    if (!(await canManageProperty(propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = await loadRoom(propertyId, roomId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [reservations, overrides, cleaning, messageTemplates, guestForms] =
      await Promise.all([
        prisma.reservation.count({ where: { roomId } }),
        prisma.dateOverride.count({ where: { roomId } }),
        prisma.cleaningRecord.count({ where: { roomId } }),
        prisma.messageTemplate.count({ where: { roomId } }),
        prisma.guestFormTemplate.count({ where: { roomId } }),
      ]);

    const blocked =
      reservations + overrides + cleaning + messageTemplates + guestForms;
    if (blocked > 0) {
      return NextResponse.json(
        {
          error: "Room has dependent records",
          counts: {
            reservations,
            overrides,
            cleaning,
            messageTemplates,
            guestForms,
          },
        },
        { status: 409 },
      );
    }

    await prisma.room.delete({ where: { id: roomId } });
    await logAudit(session.userId, "delete", "room", roomId, { propertyId });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
