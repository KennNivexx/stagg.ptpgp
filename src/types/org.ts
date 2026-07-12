export interface OrgUnit {
  id: string;
  code: string;
  name: string;
  level: number;
  leader_name: string;
  leader_email: string;
  children: OrgUnit[];
  isEmployee?: boolean;
  position?: string;
  jenis_unit?: string;
  singkatan?: string | null;
  deskripsi?: string | null;
  jumlah_formasi?: number;
  budget_cost_center?: number | null;
  kode_cost_center?: string | null;
  business_unit?: string | null;
  lokasi_kerja?: string | null;
  tanggal_berlaku?: string | null;
  tanggal_berakhir?: string | null;
  status?: string;
}

export interface FlatUnit {
  id: string;
  code: string;
  name: string;
  level: number;
  leader_name: string;
  leader_email: string;
}

export interface FlatDept {
  id?: string;
  code: string;
  name: string;
  parent_code: string | null;
  level: number;
  leader_name: string;
  leader_email: string;
  sort_order: number;
}

export interface Employee {
  id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
}
