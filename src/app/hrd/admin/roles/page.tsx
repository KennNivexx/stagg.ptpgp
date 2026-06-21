import RolesClient from "./RolesClient";

export default function RolePermission() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Role & Permission</h1>
        <p className="text-sm text-gray-500">Atur peran pengguna dan hak akses ke setiap modul sistem.</p>
      </div>
      <RolesClient />
    </div>
  );
}
