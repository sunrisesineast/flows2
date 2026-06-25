import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty } from "@/lib/ownership";
import { sanitizeI18n } from "@/lib/guest-form-i18n";
import {
  assertRoomBelongsToProperty,
  getPropertyRentalMode,
  validateTemplateScope,
} from "@/lib/rental-mode";

// Field shape stored in GuestFormTemplate.fields (JSON). Kept in sync
// with the schema comment in prisma/schema.prisma. Validated at write
// time so a malformed PUT body cannot poison the JSON column.
type FieldType =
  | "short-text"
  | "long-text"
  | "number"
  | "email"
  | "select"
  | "multi-select"
  | "date"
  | "time"
  | "yes-no"
  | "phone";

const FIELD_TYPES: ReadonlySet<string> = new Set<FieldType>([
  "short-text",
  "long-text",
  "number",
  "email",
  "select",
  "multi-select",
  "date",
  "time",
  "yes-no",
  "phone",
]);

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  /** Optional helper text shown under the question on the guest form. */
  helpText?: string;
  options?: string[];
}

function sanitizeFields(input: unknown): FormField[] {
  if (!Array.isArray(input)) return [];
  const out: FormField[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const type = typeof r.type === "string" && FIELD_TYPES.has(r.type) ? (r.type as FieldType) : null;
    if (!type) continue;
    const id = typeof r.id === "string" && r.id ? r.id : crypto.randomUUID();
    const label = typeof r.label === "string" ? r.label.slice(0, 200) : "";
    const required = r.required === true;
    const field: FormField = { id, type, label, required };
    if (typeof r.helpText === "string" && r.helpText.trim()) {
      field.helpText = r.helpText.slice(0, 300);
    }
    if (type === "select" || type === "multi-select") {
      const opts = Array.isArray(r.options)
        ? r.options.filter((o): o is string => typeof o === "string").slice(0, 50)
        : [];
      field.options = opts;
    }
    out.push(field);
    if (out.length >= 50) break; // hard cap on fields per template
  }
  return out;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    if (!(await canManageProperty(numId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rentalMode = (await getPropertyRentalMode(numId)) ?? "whole";
    const roomIdParam = request.nextUrl.searchParams.get("roomId");
    if (rentalMode === "per_room" && !roomIdParam) {
      return NextResponse.json({ error: "roomId is required for per-room properties" }, { status: 400 });
    }
    const roomId = roomIdParam ? parseInt(roomIdParam) : null;
    if (roomId != null && !(await assertRoomBelongsToProperty(roomId, numId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const template = await prisma.guestFormTemplate.findFirst({
      where:
        rentalMode === "per_room" && roomId != null
          ? { roomId }
          : { propertyId: numId },
      orderBy: { createdAt: "asc" },
    });
    if (!template) return NextResponse.json({ template: null });

    const fields = sanitizeFields(JSON.parse(template.fields));
    let i18n = {};
    try {
      i18n = sanitizeI18n(JSON.parse(template.i18n || "{}"));
    } catch {
      // Malformed JSON in the column — fall back to English-only.
    }
    return NextResponse.json({
      template: {
        id: template.id,
        propertyId: template.propertyId,
        roomId: template.roomId,
        name: template.name,
        fields,
        i18n,
      },
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    if (!(await canManageProperty(numId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.slice(0, 200) : "";
    const fields = sanitizeFields(body?.fields);
    const fieldsJson = JSON.stringify(fields);
    const i18n = sanitizeI18n(body?.i18n);
    const i18nJson = JSON.stringify(i18n);

    const rentalMode = (await getPropertyRentalMode(numId)) ?? "whole";
    const roomIdParam = request.nextUrl.searchParams.get("roomId");
    const roomId = roomIdParam ? parseInt(roomIdParam) : null;
    const scopeError = validateTemplateScope(rentalMode, {
      propertyId: rentalMode === "whole" ? numId : null,
      roomId,
    });
    if (scopeError) {
      return NextResponse.json({ error: scopeError.error }, { status: scopeError.status });
    }
    if (roomId != null && !(await assertRoomBelongsToProperty(roomId, numId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = await prisma.guestFormTemplate.findFirst({
      where:
        rentalMode === "per_room" && roomId != null
          ? { roomId }
          : { propertyId: numId },
      orderBy: { createdAt: "asc" },
    });

    const saved = existing
      ? await prisma.guestFormTemplate.update({
          where: { id: existing.id },
          data: { name, fields: fieldsJson, i18n: i18nJson, updatedAt: new Date() },
        })
      : await prisma.guestFormTemplate.create({
          data: {
            propertyId: rentalMode === "whole" ? numId : null,
            roomId: rentalMode === "per_room" ? roomId : null,
            name,
            fields: fieldsJson,
            i18n: i18nJson,
          },
        });

    await logAudit(session.userId, existing ? "update" : "create", "guestFormTemplate", saved.id, {
      name,
      fieldCount: fields.length,
    });

    return NextResponse.json({
      template: {
        id: saved.id,
        propertyId: saved.propertyId,
        roomId: saved.roomId,
        name: saved.name,
        fields,
        i18n,
      },
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
