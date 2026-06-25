import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// RT-25.9 tick 26 — Aggregate read endpoint that powers
// /dashboard/admin/content/guest-forms. Returns every GuestFormTemplate
// the user can manage (own + managed properties), with property info +
// derived counts (fieldCount from the JSON fields blob, submissionCount
// from the related GuestFormSubmission table). Per-property edits keep
// going through /api/properties/[id]/guest-form (PUT) — that route
// stays the canonical write path.

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Cleaners do not see guest-form templates.
    if (session.role === "cleaner") {
      return NextResponse.json({ templates: [] });
    }

    const templates = await prisma.guestFormTemplate.findMany({
      where: {
        OR: [
          {
            property: {
              OR: [
                { userId: session.userId },
                { managers: { some: { managerId: session.userId } } },
              ],
            },
          },
          {
            room: {
              property: {
                OR: [
                  { userId: session.userId },
                  { managers: { some: { managerId: session.userId } } },
                ],
              },
            },
          },
        ],
      },
      include: {
        property: { select: { id: true, name: true } },
        room: {
          select: {
            id: true,
            name: true,
            property: { select: { id: true, name: true } },
          },
        },
        _count: { select: { submissions: true } },
      },
      orderBy: [{ propertyId: "asc" }, { createdAt: "asc" }],
    });

    const rows = templates.map((t) => {
      let fieldCount = 0;
      try {
        const parsed = JSON.parse(t.fields);
        if (Array.isArray(parsed)) fieldCount = parsed.length;
      } catch {
        fieldCount = 0;
      }
      const propertyMeta = t.property ?? t.room?.property;
      return {
        id: t.id,
        propertyId: t.propertyId ?? t.room?.property.id ?? null,
        roomId: t.roomId,
        name: t.name,
        fieldCount,
        submissionCount: t._count.submissions,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt ? t.updatedAt.toISOString() : null,
        property: propertyMeta
          ? { id: propertyMeta.id, name: propertyMeta.name }
          : null,
        room: t.room ? { id: t.room.id, name: t.room.name } : null,
      };
    });

    return NextResponse.json({ templates: rows });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
