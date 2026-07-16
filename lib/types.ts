export type ClientStatus = 'active' | 'pending' | 'suspended' | 'expired';
export type AuditType = 'Stage1' | 'Stage2' | 'SUR1' | 'SUR2' | 'RC';
export type AuditStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type NCType = 'MJ' | 'MN';
export type NCStatus = 'open' | 'response_received' | 'under_review' | 'closed';
export type ResultStatus = 'C' | 'O' | 'NCR';

export interface Client {
  id: string;
  client_number: string;
  name: string;
  name_ar: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  contact_person: string | null;
  position: string | null;
  employees: number;
  sites: number;
  shifts: number;
  is_integrated: boolean;
  standards: string[];
  iaf_codes: string[];
  scope: string | null;
  exclusions: string | null;
  risk_level: string | null;
  status: ClientStatus;
  cert_number: string | null;
  cert_issue_date: string | null;
  cert_expiry_date: string | null;
  accreditation: string | null;
  notes: string | null;
  created_at: string;
}

export interface Auditor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  certified_standards: string[];
  certified_iaf_codes: string[];
  iso13485_notes: string | null;
  color: string;
  is_active: boolean;
}

export interface Audit {
  id: string;
  client_id: string;
  calculation_id: string | null;
  audit_type: AuditType;
  status: AuditStatus;
  start_date: string | null;
  end_date: string | null;
  lead_auditor_id: string | null;
  team: string[];
  recommendation: string | null;
  summary: string | null;
  created_at: string;
  clients?: Pick<Client, 'id' | 'name' | 'name_ar' | 'client_number' | 'standards'>;
  auditors?: Pick<Auditor, 'id' | 'name' | 'color'>;
}

export interface AuditResult {
  id: string;
  audit_id: string;
  standard_code: string | null;
  clause: string;
  clause_name: string | null;
  status: ResultStatus;
  comments: string | null;
}

export interface NonConformity {
  id: string;
  audit_id: string | null;
  client_id: string;
  nc_number: string;
  nc_type: NCType;
  standard_code: string | null;
  clause: string | null;
  description: string | null;
  root_cause: string | null;
  corrections: string | null;
  corrective_actions: string | null;
  verification: string | null;
  deadline: string | null;
  status: NCStatus;
  closed_date: string | null;
  created_at: string;
  clients?: Pick<Client, 'id' | 'name' | 'name_ar'>;
}

export interface AuditCalculation {
  id: string;
  client_id: string | null;
  standards_breakdown: StandardBreakdown[];
  total_before_reduction: number;
  md5_reduction_percent: number;
  md9_reduction_percent: number;
  md11_reduction_percent: number;
  increase_percent: number;
  final_initial_audit_days: number;
  rounded_final_audit_days: number;
  stage1_days: number;
  stage2_days: number;
  surveillance_days: number;
  recert_days: number;
  increase_decrease_notes: unknown[];
  created_at: string;
}

export interface StandardBreakdown {
  standard: string;
  complexity: string;
  baseDays: number;
  reference: string;
}

export interface AuditRule {
  employees_min: number;
  employees_max: number;
  base_audit_days: number;
  risk_level: string;
}

export interface FormGenerated {
  id: string;
  client_id: string | null;
  audit_id: string | null;
  form_code: string;
  form_data: Record<string, unknown>;
  status: 'draft' | 'completed' | 'printed';
  created_at: string;
  updated_at: string;
}

export interface ActivityItem {
  id: string;
  entity: string;
  entity_id: string | null;
  client_id: string | null;
  action: string;
  description_ar: string;
  actor: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  title_ar: string;
  body_ar: string | null;
  kind: 'info' | 'warning' | 'danger' | 'success';
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export const STANDARD_CODES = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 13485', 'ISO 22301', 'ISO 50001'] as const;

export const AUDIT_TYPE_AR: Record<AuditType, string> = {
  Stage1: 'المرحلة الأولى',
  Stage2: 'المرحلة الثانية',
  SUR1: 'مراقبة أولى',
  SUR2: 'مراقبة ثانية',
  RC: 'إعادة اعتماد',
};

export const CLIENT_STATUS_AR: Record<ClientStatus, string> = {
  active: 'معتمد',
  pending: 'قيد الاعتماد',
  suspended: 'معلّق',
  expired: 'منتهي',
};

export const NC_STATUS_AR: Record<NCStatus, string> = {
  open: 'مفتوح',
  response_received: 'استلام الرد',
  under_review: 'قيد المراجعة',
  closed: 'مغلق',
};
