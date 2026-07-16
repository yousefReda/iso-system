import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { checkAuditorAssignment } from '@/lib/calculator/auditor-planning';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { auditorId, standardCode, iafCode, startDate, endDate, save, clientId, auditType } = await req.json();
  if (!auditorId || !startDate || !endDate) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
  }

  const { data: auditor, error } = await supabase
    .from('auditors')
    .select('id, name, certified_standards, certified_iaf_codes')
    .eq('id', auditorId)
    .single();
  if (error || !auditor) return NextResponse.json({ error: 'المدقق غير موجود' }, { status: 404 });

  const { data: bookings } = await supabase
    .from('auditor_planning')
    .select('auditor_id, start_date, end_date, clients(name)')
    .eq('auditor_id', auditorId);

  const result = checkAuditorAssignment({
    auditor: auditor as never,
    standardCode: standardCode ?? '',
    iafCode: iafCode ?? '',
    startDate,
    endDate,
    existingBookings: (bookings ?? []).map((b: Record<string, unknown>) => ({
      auditor_id: b.auditor_id as string,
      start_date: b.start_date as string,
      end_date: b.end_date as string,
      client_name: (b.clients as { name?: string } | null)?.name,
    })),
  });

  if (save && clientId) {
    await supabase.from('auditor_planning').insert({
      client_id: clientId,
      auditor_id: auditorId,
      standard_code: standardCode,
      iaf_code: iafCode,
      audit_type: auditType ?? 'Stage1',
      start_date: startDate,
      end_date: endDate,
      is_certified_standard: result.isCertifiedStandard,
      is_certified_iaf: result.isCertifiedIaf,
      has_date_conflict: result.hasDateConflict,
      final_status: result.finalStatus,
    });
  }

  return NextResponse.json(result);
}
