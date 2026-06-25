import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty, canReadProperty } from "@/lib/ownership";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const propertyId = parseInt(id);
    if (isNaN(propertyId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    if (!(await canReadProperty(propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rooms = await prisma.room.findMany({
      where: { propertyId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(rooms);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const propertyId = parseInt(id);
    if (isNaN(propertyId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    if (!(await canManageProperty(propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const sortOrder =
      body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))
        ? Number(body.sortOrder)
        : 0;

    const room = await prisma.room.create({
      data: { propertyId, name, sortOrder },
    });
    await logAudit(session.userId, "create", "room", room.id, {
      propertyId,
      name: room.name,
    });
    return NextResponse.json(room);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
