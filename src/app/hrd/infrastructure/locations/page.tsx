import { getLocationsData } from "@/app/actions/infrastructure";
import LocationsClient from "./LocationsClient";

export default async function LokasiKerjaPage() {
  const { locations, employees } = await getLocationsData();

  return <LocationsClient initialLocations={locations} employees={employees} />;
}
