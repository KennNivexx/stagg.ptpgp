import { getLocationsData } from "@/app/actions/infrastructure";
import LocationsClient from "./LocationsClient";
import HubTabs from "@/components/hrd/HubTabs";
import ShiftsPage from "../shifts/page";
import { MapPin, Clock } from "lucide-react";

export const dynamic = "force-dynamic";
async function LocationsTabContent() {
  const { locations, employees } = await getLocationsData();
  return <LocationsClient initialLocations={locations} employees={employees} />;
}

// Hub page for "Lokasi & Shift Kerja" — merges the former separate
// /hrd/infrastructure/locations and /hrd/infrastructure/shifts routes into
// one page with tabs (see src/components/hrd/HubTabs.tsx). Each tab reuses
// the original page's Server Component output untouched; the original route
// files remain intact for anyone navigating to them directly.
export default async function LokasiKerjaPage() {
  const [locationsContent, shiftsContent] = await Promise.all([
    LocationsTabContent(),
    ShiftsPage(),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <HubTabs
        tabs={[
          { id: "locations", label: "Lokasi Kerja", icon: <MapPin size={14} />, content: locationsContent },
          { id: "shifts", label: "Shift Kerja", icon: <Clock size={14} />, content: shiftsContent },
        ]}
        defaultTab="locations"
      />
    </div>
  );
}
