// أدوات المساعد الذكي — تنفذ فعلياً عبر Supabase (تعمل مع Claude API أو المساعد المحلي)
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateAuditDays } from '@/lib/calculator/audit-calculator';
import { checkAuditorAssignment } from '@/lib/calculator/auditor-planning';
import type { AuditRule } from '@/lib/types';

export const toolDefinitions = [
  {
    name: 'searchClients',
    description: 'البحث عن عملاء بالاسم أو الرقم أو الحالة',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'نص البحث' },
        status: { type: 'string', enum: ['active', 'pending', 'suspended', 'expired'] },
      },
    },
  },
  {
    name: 'getStatistics',
    description: 'إحصائيات النظام: العملاء، التدقيقات القادمة، عدم المطابقات المفتوحة، الشهادات المنتهية قريباً',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'calculateAuditDays',
    description: 'حساب أيام التدقيق وفق IAF MD5/MD9/MD11',
    input_schema: {
      type: 'object' as const,
      properties: {
        employees: { type: 'number' },
        standards: { type: 'array', items: { type: 'string' }, description: 'مثل ["ISO 9001","ISO 14001"]' },
        isIntegrated: { type: 'boolean' },
        md5ReductionPercent: { type: 'number', description: '0-20' },
      },
      required: ['employees', 'standards'],
    },
  },
  {
    name: 'checkAuditorAvailability',
    description: 'التحقق من أهلية مدقق (المواصفة + IAF + تعارض المواعيد)',
    input_schema: {
      type: 'object' as const,
      properties: {
        auditorName: { type: 'string' },
        standardCode: { type: 'string' },
        iafCode: { type: 'string' },
        startDate: { type: 'string', description: 'YYYY-MM-DD' },
        endDate: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['auditorName', 'standardCode', 'iafCode', 'startDate', 'endDate'],
    },
  },
  {
    name: 'addClient',
    description: 'إضافة عميل جديد (يتطلب تأكيد المستخدم الصريح قبل الاستدعاء)',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' },
        employees: { type: 'number' },
        standards: { type: 'array', items: { type: 'string' } },
        iafCodes: { type: 'array', items: { type: 'string' } },
        isIntegrated: { type: 'boolean' },
        contactPerson: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        city: { type: 'string' },
        scope: { type: 'string' },
      },
      required: ['name', 'employees', 'standards'],
    },
  },
  {
    name: 'createNC',
    description: 'إنشاء تقرير عدم مطابقة لعميل (يتطلب تأكيد المستخدم الصريح قبل الاستدعاء)',
    input_schema: {
      type: 'object' as const,
      properties: {
        clientName: { type: 'string' },
        ncType: { type: 'string', enum: ['MJ', 'MN'] },
        standardCode: { type: 'string' },
        clause: { type: 'string' },
        description: { type: 'string' },
        deadline: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['clientName', 'ncType', 'description'],
    },
  },
];

export async function runTool(
  supabase: SupabaseClient,
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case 'searchClients': {
      let q = supabase
        .from('clients')
        .select('client_number, name, name_ar, status, standards, employees, cert_expiry_date')
        .limit(10);
      if (input.query) q = q.or(`name.ilike.%${input.query}%,name_ar.ilike.%${input.query}%,client_number.ilike.%${input.query}%`);
      if (input.status) q = q.eq('status', input.status);
      const { data, error } = await q;
      return error ? { error: error.message } : { clients: data };
    }
    case 'getStatistics': {
      const today = new Date().toISOString().slice(0, 10);
      const in90 = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
      const [clients, activeClients, upcoming, openNcs, expiring] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('audits').select('id', { count: 'exact', head: true }).eq('status', 'planned').gte('start_date', today),
        supabase.from('non_conformities').select('id', { count: 'exact', head: true }).neq('status', 'closed'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).gte('cert_expiry_date', today).lte('cert_expiry_date', in90),
      ]);
      return {
        totalClients: clients.count,
        activeClients: activeClients.count,
        upcomingAudits: upcoming.count,
        openNCs: openNcs.count,
        expiringCertsIn90Days: expiring.count,
      };
    }
    case 'calculateAuditDays': {
      const { data: rules } = await supabase.from('audit_rules').select('*').order('employees_min');
      const result = calculateAuditDays({
        employees: Number(input.employees ?? 1),
        sites: 1,
        isIntegrated: Boolean(input.isIntegrated),
        selectedStandards: (input.standards as string[]) ?? [],
        md5ReductionPercent: Number(input.md5ReductionPercent ?? 0),
        rules: (rules as AuditRule[]) ?? [],
      });
      return result;
    }
    case 'checkAuditorAvailability': {
      const { data: auditor } = await supabase
        .from('auditors')
        .select('id, name, certified_standards, certified_iaf_codes')
        .ilike('name', `%${input.auditorName}%`)
        .limit(1)
        .maybeSingle();
      if (!auditor) return { error: `لم يتم العثور على مدقق باسم ${input.auditorName}` };
      const { data: bookings } = await supabase
        .from('auditor_planning')
        .select('auditor_id, start_date, end_date, clients(name)')
        .eq('auditor_id', auditor.id);
      return checkAuditorAssignment({
        auditor: auditor as never,
        standardCode: String(input.standardCode),
        iafCode: String(input.iafCode),
        startDate: String(input.startDate),
        endDate: String(input.endDate),
        existingBookings: (bookings ?? []).map((b: Record<string, unknown>) => ({
          auditor_id: b.auditor_id as string,
          start_date: b.start_date as string,
          end_date: b.end_date as string,
          client_name: (b.clients as { name?: string } | null)?.name,
        })),
      });
    }
    case 'addClient': {
      const num = `SA-${String(Math.floor(Math.random() * 900) + 100)}-${new Date().getFullYear()}`;
      const { data, error } = await supabase
        .from('clients')
        .insert({
          client_number: num,
          name: input.name,
          employees: Number(input.employees ?? 1),
          standards: input.standards ?? [],
          iaf_codes: input.iafCodes ?? [],
          is_integrated: Boolean(input.isIntegrated),
          contact_person: input.contactPerson ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          city: input.city ?? null,
          scope: input.scope ?? null,
          status: 'pending',
        })
        .select('id, client_number, name')
        .single();
      if (error) return { error: error.message };
      await supabase.from('activity_log').insert({
        entity: 'client', entity_id: data.id, client_id: data.id,
        action: 'create', description_ar: `إضافة عميل جديد عبر المساعد الذكي: ${data.name}`, actor: 'AI Assistant',
      });
      return { success: true, client: data };
    }
    case 'createNC': {
      const { data: client } = await supabase
        .from('clients')
        .select('id, name')
        .or(`name.ilike.%${input.clientName}%,name_ar.ilike.%${input.clientName}%`)
        .limit(1)
        .maybeSingle();
      if (!client) return { error: `لم يتم العثور على عميل باسم ${input.clientName}` };
      const ncNumber = `NC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
      const { data, error } = await supabase
        .from('non_conformities')
        .insert({
          client_id: client.id,
          nc_number: ncNumber,
          nc_type: input.ncType ?? 'MN',
          standard_code: input.standardCode ?? null,
          clause: input.clause ?? null,
          description: input.description,
          deadline: input.deadline ?? null,
          status: 'open',
        })
        .select('id, nc_number')
        .single();
      if (error) return { error: error.message };
      await supabase.from('activity_log').insert({
        entity: 'nc', entity_id: data.id, client_id: client.id,
        action: 'open', description_ar: `فتح ${ncNumber} لعميل ${client.name} عبر المساعد الذكي`, actor: 'AI Assistant',
      });
      return { success: true, nc: data, client: client.name };
    }
    default:
      return { error: `أداة غير معروفة: ${name}` };
  }
}
