export interface Service {
  id: string;
  title: string;
  description: string;
  icon?: string;
  created_at?: string;
}

export interface Capability {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  created_at?: string;
}

export interface ReliabilityStat {
  id: string;
  label: string;
  value: string;
  created_at?: string;
}

export interface Tender {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline?: string;
  document_url?: string;
  created_at?: string;
}

export interface Job {
  id: string;
  title: string;
  department?: string;
  location?: string;
  description: string;
  requirements?: string[];
  created_at?: string;
  type?: string;
  job_desk?: string;
  education?: string;
  experience?: string;
  age_min?: number | null;
  age_max?: number | null;
  deadline?: string;
}

export interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  join_date?: string;
  status: string;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'hrd' | 'employee';
  full_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: string;
  created_at?: string;
}

export interface Leave {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  type: string;
  reason?: string;
  status: string;
  created_at?: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: string;
  created_at?: string;
}

export interface KPIEvaluation {
  id: string;
  employee_id: string;
  evaluator_id?: string;
  period: string;
  score?: number;
  comments?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  cover_letter?: string;
  status: string;
  applied_at?: string;
}

export interface Vendor {
  id: string;
  company_name: string;
  company_email: string;
  company_phone?: string;
  npwp?: string;
  nib?: string;
  address?: string;
  business_type?: string;
  created_at?: string;
}
