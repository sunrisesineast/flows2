import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canManageProperty } from "@/lib/ownership";
import {
  assertRoomBelongsToProperty,
  getPropertyRentalMode,
  validateTemplateScope,
} from "@/lib/rental-mode";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyIdParam = request.nextUrl.searchParams.get("propertyId");

    // Cleaners have no message-templates access; only owners and managers do.
    if (session.role === "cleaner") {
      return NextResponse.json({ templates: [] });
    }

    if (propertyIdParam !== null) {
      const propertyId = parseInt(propertyIdParam);
      if (isNaN(propertyId)) {
        return NextResponse.json({ error: "Invalid propertyId" }, { status: 400 });
      }
      if (!(await canManageProperty(propertyId, session.userId, session.role))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const roomIdParam = request.nextUrl.searchParams.get("roomId");
      const rentalMode = (await getPropertyRentalMode(propertyId)) ?? "whole";
      const templates = await prisma.messageTemplate.findMany({
        where:
          rentalMode === "per_room"
            ? roomIdParam
              ? { roomId: parseInt(roomIdParam) }
              : { room: { propertyId } }
            : { propertyId },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ templates });
    }

    // Aggregate mode (no propertyId) — return every template the user can
    // manage, with property metadata included for grouping. Used by the
    // /dashboard/admin/workspace/message-templates overview surface.
    const templates = await prisma.messageTemplate.findMany({
      where: {
        property: {
          OR: [
            { userId: session.userId },
            { managers: { some: { managerId: session.userId } } },
          ],
        },
      },
      include: { property: { select: { id: true, name: true } } },
      orderBy: [{ propertyId: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ templates });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const propertyId = body.propertyId != null ? Number(body.propertyId) : null;
    const roomId = body.roomId != null ? Number(body.roomId) : null;
    if ((!propertyId && !roomId) || !body.name?.trim() || !body.body?.trim()) {
      return NextResponse.json(
        { error: "propertyId or roomId, name, and body required" },
        { status: 400 },
      );
    }

    let authPropertyId = propertyId;
    let rentalMode = "whole" as "whole" | "per_room";
    if (propertyId) {
      rentalMode = (await getPropertyRentalMode(propertyId)) ?? "whole";
    } else if (roomId) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { propertyId: true },
      });
      if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
      authPropertyId = room.propertyId;
      rentalMode = (await getPropertyRentalMode(room.propertyId)) ?? "whole";
    }

    if (
      authPropertyId == null ||
      !(await canManageProperty(authPropertyId, session.userId, session.role))
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const scopeError = validateTemplateScope(rentalMode, { propertyId, roomId });
    if (scopeError) {
      return NextResponse.json({ error: scopeError.error }, { status: scopeError.status });
    }

    if (
      roomId != null &&
      !(await assertRoomBelongsToProperty(roomId, authPropertyId))
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const template = await prisma.messageTemplate.create({
      data: {
        propertyId: rentalMode === "whole" ? authPropertyId : null,
        roomId: rentalMode === "per_room" ? roomId : null,
        name: body.name.trim(),
        language: typeof body.language === "string" ? body.language : "en",
        subject: typeof body.subject === "string" ? body.subject : "",
        body: body.body,
      },
    });
    return NextResponse.json(template);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
