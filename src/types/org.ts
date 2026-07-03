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
