import { requireAuth } from "@/lib/auth-guard";
import { getRooms, getBookings } from "@/app/actions/meetings";
import RoomsClient from "./RoomsClient";

export const dynamic = "force-dynamic";

export default async function MeetingRoomsPage() {
  const user = await requireAuth();
  const [rooms, bookings] = await Promise.all([getRooms(), getBookings()]);

  return (
    <RoomsClient
      rooms={rooms}
      bookings={bookings}
      canManage={user.role === "hrd" || user.role === "superadmin"}
    />
  );
}
