import { prisma } from "@/lib/prisma";
import { parseRentalMode, type RentalMode } from "@/lib/rental-mode-rules";

export * from "@/lib/rental-mode-rules";

export async function getPropertyRentalMode(
  propertyId: number,
): Promise<RentalMode | null> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { rentalMode: true },
  });
  if (!property) return null;
  return parseRentalMode(property.rentalMode) ?? "whole";
}

export async function loadPropertyModeOrNull(propertyId: number) {
  return prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, rentalMode: true },
  });
}

export async function assertRoomBelongsToProperty(
  roomId: number,
  propertyId: number,
): Promise<boolean> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { propertyId: true },
  });
  return !!room && room.propertyId === propertyId;
}
