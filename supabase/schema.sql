-- ISO CERT INTERNATIONAL — Certification Management System schema
-- نفّذ هذا الملف في Supabase SQL Editor عند نقل النظام لمشروع جديد
create extension if not exists pgcrypto;

create table if not exists standards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_ar text not null,
  name_en text not null,
  reference_standard text not null default 'IAF MD 5',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists iaf_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description_en text not null,
  description_ar text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists audit_rules (
  id uuid primary key default gen_random_uuid(),
  employees_min int not null,
  employees_max int not null,
  base_audit_days numeric(5,2) not null,
  risk_level text not null,
  created_at timestamptz not null default now()
);

create table if not exists reduction_factors (
  id uuid primary key default gen_random_uuid(),
  factor_type text not null, -- MD5 | MD9
  description_ar text not null,
  description_en text not null,
  weight_percent numeric(5,2) not null,
  is_fixed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists md11_integration_factors (
  id uuid primary key default gen_random_uuid(),
  description_ar text not null,
  description_en text not null,
  weight_percent numeric(5,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists increase_decrease_rules (
  id uuid primary key default gen_random_uuid(),
  rule_type text not null, -- increase | decrease
  description_ar text not null,
  description_en text not null,
  weight_percent numeric(5,2) not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  client_number text unique not null,
  name text not null,
  name_ar text,
  address text,
  city text,
  country text,
  phone text,
  email text,
  website text,
  contact_person text,
  position text,
  employees int not null default 1,
  sites int not null default 1,
  shifts int not null default 1,
  is_integrated boolean not null default false,
  standards jsonb not null default '[]',
  iaf_codes jsonb not null default '[]',
  scope text,
  exclusions text,
  risk_level text default 'Low',
  status text not null default 'pending', -- active | pending | suspended | expired
  cert_number text,
  cert_issue_date date,
  cert_expiry_date date,
  accreditation text default 'SAAC',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists auditors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  role text default 'auditor', -- lead_auditor | auditor | technical_expert | reviewer
  certified_standards jsonb not null default '[]',
  certified_iaf_codes jsonb not null default '[]',
  iso13485_notes text,
  color text default '#2E5FA3',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists audit_calculations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  standards_breakdown jsonb not null default '[]',
  total_before_reduction numeric(6,2) not null default 0,
  md5_reduction_percent numeric(5,2) not null default 0,
  md9_reduction_percent numeric(5,2) not null default 0,
  md11_reduction_percent numeric(5,2) not null default 0,
  increase_percent numeric(5,2) not null default 0,
  final_initial_audit_days numeric(6,2) not null default 0,
  rounded_final_audit_days numeric(6,2) not null default 0,
  stage1_days numeric(5,2) not null default 0,
  stage2_days numeric(5,2) not null default 0,
  surveillance_days numeric(5,2) not null default 0,
  recert_days numeric(5,2) not null default 0,
  increase_decrease_notes jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists audits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  calculation_id uuid references audit_calculations(id) on delete set null,
  audit_type text not null, -- Stage1 | Stage2 | SUR1 | SUR2 | RC
  status text not null default 'planned', -- planned | in_progress | completed | cancelled
  start_date date,
  end_date date,
  lead_auditor_id uuid references auditors(id) on delete set null,
  team jsonb not null default '[]',
  recommendation text,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists audit_plan_items (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references audits(id) on delete cascade,
  day_no int not null default 1,
  time_from text,
  time_to text,
  activity text not null,
  auditor text,
  department text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists audit_results (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references audits(id) on delete cascade,
  standard_code text,
  clause text not null,
  clause_name text,
  status text not null default 'C', -- C | O | NCR
  comments text,
  evidence_refs text,
  created_at timestamptz not null default now()
);

create table if not exists non_conformities (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references audits(id) on delete set null,
  client_id uuid references clients(id) on delete cascade,
  nc_number text not null,
  nc_type text not null default 'MN', -- MJ | MN
  standard_code text,
  clause text,
  description text,
  root_cause text,
  corrections text,
  corrective_actions text,
  verification text,
  deadline date,
  status text not null default 'open', -- open | response_received | under_review | closed
  closed_date date,
  created_at timestamptz not null default now()
);

create table if not exists auditor_planning (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  auditor_id uuid references auditors(id) on delete cascade,
  standard_code text,
  iaf_code text,
  audit_type text default 'Stage1',
  start_date date not null,
  end_date date not null,
  is_certified_standard boolean not null default false,
  is_certified_iaf boolean not null default false,
  has_date_conflict boolean not null default false,
  final_status text not null default 'OK', -- OK | NOT_OK
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists forms_generated (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  audit_id uuid references audits(id) on delete set null,
  form_code text not null,
  form_data jsonb not null default '{}',
  status text not null default 'draft', -- draft | completed | printed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists client_attachments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  kind text not null default 'document', -- site_photo | audit_file | document
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists auditor_attachments (
  id uuid primary key default gen_random_uuid(),
  auditor_id uuid references auditors(id) on delete cascade,
  kind text not null default 'document', -- cv | certificate | contract | document
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id uuid,
  client_id uuid references clients(id) on delete cascade,
  action text not null,
  description_ar text not null,
  actor text default 'system',
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  body_ar text,
  kind text default 'info', -- info | warning | danger | success
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'viewer', -- admin | lead_auditor | auditor | viewer
  auditor_id uuid references auditors(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audits_client on audits(client_id);
create index if not exists idx_audits_dates on audits(start_date);
create index if not exists idx_nc_client on non_conformities(client_id);
create index if not exists idx_nc_status on non_conformities(status);
create index if not exists idx_planning_auditor on auditor_planning(auditor_id);
create index if not exists idx_planning_dates on auditor_planning(start_date, end_date);
create index if not exists idx_forms_client on forms_generated(client_id);
create index if not exists idx_attachments_client on client_attachments(client_id);
create index if not exists idx_activity_client on activity_log(client_id);
create index if not exists idx_clients_status on clients(status);

-- RLS: authenticated users get full access (internal staff tool v1)
do $$
declare t text;
begin
  foreach t in array array['standards','iaf_codes','audit_rules','reduction_factors','md11_integration_factors','increase_decrease_rules','clients','auditors','audit_calculations','audits','audit_plan_items','audit_results','non_conformities','auditor_planning','forms_generated','client_attachments','auditor_attachments','activity_log','notifications','app_settings','profiles']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "iso_auth_all_%s" on %I', t, t);
    execute format('create policy "iso_auth_all_%s" on %I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- سياسة التسجيل العام: يسمح للزائر بإدخال طلب عميل جديد فقط (status=pending)
drop policy if exists "iso_public_register" on clients;
create policy "iso_public_register" on clients for insert to anon with check (status = 'pending');
drop policy if exists "iso_public_notify" on notifications;
create policy "iso_public_notify" on notifications for insert to anon with check (true);
drop policy if exists "iso_public_activity" on activity_log;
create policy "iso_public_activity" on activity_log for insert to anon with check (true);

-- إدارة المستخدمين من داخل التطبيق (admin فقط) — security definer
create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.create_app_user(p_email text, p_password text, p_full_name text, p_role text)
returns uuid language plpgsql security definer as $$
declare uid uuid := gen_random_uuid();
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if p_role not in ('admin','lead_auditor','auditor','viewer') then raise exception 'invalid role'; end if;
  if exists (select 1 from auth.users where email = p_email) then raise exception 'user already exists'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_full_name), now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', p_email, 'email_verified', true), 'email', now(), now(), now());
  insert into public.profiles (id, email, full_name, role) values (uid, p_email, p_full_name, p_role);
  return uid;
end $$;

create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if p_role not in ('admin','lead_auditor','auditor','viewer') then raise exception 'invalid role'; end if;
  update public.profiles set role = p_role where id = p_user_id;
end $$;

create or replace function public.delete_app_user(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if p_user_id = auth.uid() then raise exception 'cannot delete yourself'; end if;
  delete from auth.users where id = p_user_id;
end $$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.create_app_user(text, text, text, text) to authenticated;
grant execute on function public.set_user_role(uuid, text) to authenticated;
grant execute on function public.delete_app_user(uuid) to authenticated;

-- Storage bucket for client files
insert into storage.buckets (id, name, public)
values ('client-files', 'client-files', true)
on conflict (id) do nothing;

drop policy if exists "iso_client_files_read" on storage.objects;
create policy "iso_client_files_read" on storage.objects for select using (bucket_id = 'client-files');
drop policy if exists "iso_client_files_write" on storage.objects;
create policy "iso_client_files_write" on storage.objects for insert to authenticated with check (bucket_id = 'client-files');
drop policy if exists "iso_client_files_update" on storage.objects;
create policy "iso_client_files_update" on storage.objects for update to authenticated using (bucket_id = 'client-files');
drop policy if exists "iso_client_files_delete" on storage.objects;
create policy "iso_client_files_delete" on storage.objects for delete to authenticated using (bucket_id = 'client-files');

-- إنشاء مستخدم admin افتراضي (admin@isocert.com / IsoCert@2026) — غيّر كلمة المرور بعد أول دخول
do $$
declare uid uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email='admin@isocert.com') then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', 'admin@isocert.com',
      crypt('IsoCert@2026', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"مدير النظام"}', now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', 'admin@isocert.com', 'email_verified', true), 'email', now(), now(), now());
    insert into profiles (id, email, full_name, role) values (uid, 'admin@isocert.com', 'مدير النظام', 'admin');
  end if;
end $$;
