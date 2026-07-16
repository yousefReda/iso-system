// تعريفات النماذج الرسمية ISO-F06 — الحقول الصفراء = متغيرات تُملأ تلقائياً من قاعدة البيانات
import type { Audit, AuditCalculation, Client, NonConformity } from '@/lib/types';
import { AUDIT_TYPE_AR } from '@/lib/types';

export interface FormContext {
  client: Client | null;
  calc: AuditCalculation | null;
  audits: Audit[];
  ncs: NonConformity[];
}

export interface FormField {
  key: string;
  label: string;
  auto?: (ctx: FormContext) => string;
  type?: 'text' | 'textarea';
  span?: 2;
}

export interface FormSection {
  title?: string;
  fields: FormField[];
}

export interface FormDefinition {
  code: string;
  title_ar: string;
  title_en: string;
  rev: string;
  icon: string;
  sections: FormSection[];
}

const c = (fn: (client: Client) => string | null | undefined) => (ctx: FormContext) =>
  ctx.client ? String(fn(ctx.client) ?? '') : '';
const k = (fn: (calc: AuditCalculation) => string | number | null | undefined) => (ctx: FormContext) =>
  ctx.calc ? String(fn(ctx.calc) ?? '') : '';
const auditOf = (type: string) => (ctx: FormContext) => {
  const a = ctx.audits.find((x) => x.audit_type === type);
  return a ? `${a.start_date ?? ''}${a.end_date && a.end_date !== a.start_date ? ` → ${a.end_date}` : ''}` : '';
};
const leadOf = (type: string) => (ctx: FormContext) =>
  ctx.audits.find((x) => x.audit_type === type)?.auditors?.name ?? '';
const today = () => new Date().toISOString().slice(0, 10);

const CLIENT_HEADER: FormField[] = [
  { key: 'client_name', label: 'Client Organisation Name / اسم المنشأة', auto: c((x) => x.name) },
  { key: 'client_no', label: 'Client No. / رقم العميل', auto: c((x) => x.client_number) },
  { key: 'address', label: 'Address / العنوان', auto: c((x) => x.address), span: 2 },
  { key: 'contact', label: 'Contact Person / جهة الاتصال', auto: c((x) => x.contact_person) },
  { key: 'email', label: 'E-mail / البريد', auto: c((x) => x.email) },
  { key: 'employees', label: 'No. of Employees / عدد الموظفين', auto: c((x) => String(x.employees)) },
  { key: 'standards', label: 'Standard(s) / المواصفات', auto: c((x) => x.standards.join(', ')) },
];

export const FORM_DEFINITIONS: FormDefinition[] = [
  {
    code: 'F06-01', title_ar: 'طلب عرض سعر للاعتماد', title_en: 'Application Request For Quotation', rev: 'Rev01', icon: '📋',
    sections: [
      { title: '1) General Information / معلومات عامة', fields: [
        ...CLIENT_HEADER,
        { key: 'phone', label: 'Tel Number / الهاتف', auto: c((x) => x.phone) },
        { key: 'city', label: 'Country/City / الدولة والمدينة', auto: c((x) => `${x.city ?? ''}, ${x.country ?? ''}`) },
        { key: 'position', label: 'Position / المنصب', auto: c((x) => x.position) },
      ]},
      { title: '4) Scope / نطاق الاعتماد', fields: [
        { key: 'scope', label: 'Scope of activities / وصف الأنشطة', auto: c((x) => x.scope), type: 'textarea', span: 2 },
        { key: 'iaf', label: 'IAF Codes / أكواد النشاط', auto: c((x) => x.iaf_codes.join(', ')) },
        { key: 'shifts', label: 'Number of Shifts / الورديات', auto: c((x) => String(x.shifts)) },
      ]},
      { title: '9) Certification Programme / برنامج الاعتماد', fields: [
        { key: 'programme', label: 'Programme Requested / البرنامج المطلوب', auto: () => 'Initial certification' },
        { key: 'combined', label: 'Combined or Separate / مدمج أم منفصل', auto: c((x) => (x.is_integrated ? 'Combined' : 'Separate')) },
        { key: 'exclusions', label: 'Non-applicable clauses / الاستثناءات', auto: c((x) => x.exclusions), type: 'textarea', span: 2 },
        { key: 'ready_date', label: 'Ready for audit date / تاريخ الجاهزية' },
      ]},
      { title: 'FOR ISO CERT USE ONLY — Application Review', fields: [
        { key: 'review_ok', label: 'Can the application be processed? / هل يمكن معالجة الطلب؟', auto: () => 'Yes' },
        { key: 'reviewer', label: 'CB Manager / مدير جهة المنح' },
        { key: 'review_date', label: 'Date / التاريخ', auto: today },
      ]},
    ],
  },
  {
    code: 'F06-02', title_ar: 'عرض سعر الاعتماد', title_en: 'Quotation for Certification', rev: 'Rev01', icon: '💰',
    sections: [
      { title: 'Client / بيانات العميل', fields: CLIENT_HEADER },
      { title: 'Quotation Details / تفاصيل العرض', fields: [
        { key: 'quote_no', label: 'Quotation No. / رقم العرض' },
        { key: 'date', label: 'Date / التاريخ', auto: today },
        { key: 'initial_days', label: 'Initial Audit Days / أيام التدقيق الأولي', auto: k((x) => x.rounded_final_audit_days) },
        { key: 'stage1', label: 'Stage 1 (MD)', auto: k((x) => x.stage1_days) },
        { key: 'stage2', label: 'Stage 2 (MD)', auto: k((x) => x.stage2_days) },
        { key: 'surv', label: 'Surveillance (MD)', auto: k((x) => x.surveillance_days) },
        { key: 'recert', label: 'Recertification (MD)', auto: k((x) => x.recert_days) },
        { key: 'fees', label: 'Total Fees / إجمالي الرسوم', type: 'text' },
        { key: 'validity', label: 'Quotation Validity / صلاحية العرض', auto: () => '30 يوماً' },
      ]},
    ],
  },
  {
    code: 'F06-03', title_ar: 'اتفاقية الاعتماد', title_en: 'Certification Agreement', rev: 'Rev01', icon: '🤝',
    sections: [
      { title: 'Parties / الأطراف', fields: [
        ...CLIENT_HEADER,
        { key: 'cb', label: 'Certification Body / جهة المنح', auto: () => 'ISO CERT INTERNATIONAL' },
        { key: 'agreement_date', label: 'Agreement Date / تاريخ الاتفاقية', auto: today },
      ]},
      { title: 'Scope of Agreement / نطاق الاتفاقية', fields: [
        { key: 'scope', label: 'Certification Scope / نطاق الاعتماد', auto: c((x) => x.scope), type: 'textarea', span: 2 },
        { key: 'accreditation', label: 'Accreditation / الاعتماد', auto: c((x) => x.accreditation) },
        { key: 'cycle', label: 'Certification Cycle / دورة الاعتماد', auto: () => '3 سنوات (Stage1+2, SUR1, SUR2, RC)' },
      ]},
      { title: 'Signatures / التوقيعات', fields: [
        { key: 'client_sig', label: 'Client Representative / ممثل العميل', auto: c((x) => x.contact_person) },
        { key: 'cb_sig', label: 'CB Manager / مدير جهة المنح' },
      ]},
    ],
  },
  {
    code: 'F06-04', title_ar: 'حساب وقت التدقيق', title_en: 'Audit Time Calculation', rev: 'Rev01', icon: '🧮',
    sections: [
      { title: 'Client / بيانات العميل', fields: [
        ...CLIENT_HEADER,
        { key: 'risk', label: 'Complexity / Risk category', auto: c((x) => x.risk_level) },
        { key: 'integration', label: 'Level of integration % / نسبة التكامل', auto: c((x) => (x.is_integrated ? '100 %' : 'NA')) },
      ]},
      { title: 'Audit Time Calculation / حساب وقت التدقيق', fields: [
        { key: 'breakdown', label: 'Standards Breakdown / تفصيل المواصفات', auto: k((x) => x.standards_breakdown.map((b) => `${b.standard}: ${b.baseDays} MD (${b.reference})`).join(' | ')), type: 'textarea', span: 2 },
        { key: 'total_before', label: 'Total Base (MD) / الإجمالي قبل الخصم', auto: k((x) => x.total_before_reduction) },
        { key: 'md5', label: 'MD5 Reduction % / خصم MD5', auto: k((x) => `${x.md5_reduction_percent}%`) },
        { key: 'md9', label: 'MD9 Reduction % / خصم MD9', auto: k((x) => `${x.md9_reduction_percent}%`) },
        { key: 'md11', label: 'MD11 Integration % / خصم التكامل', auto: k((x) => `${x.md11_reduction_percent}%`) },
        { key: 'final', label: 'Total Man-Days after Reduction / الأيام النهائية', auto: k((x) => `${x.rounded_final_audit_days} Man-Days`) },
      ]},
      { title: 'Stages Distribution / توزيع المراحل', fields: [
        { key: 'stage1', label: 'Stage 1', auto: k((x) => `${x.stage1_days} Days`) },
        { key: 'stage2', label: 'Stage 2', auto: k((x) => `${x.stage2_days} Days`) },
        { key: 'sur', label: 'Surveillance 1/2', auto: k((x) => `${x.surveillance_days} Days`) },
        { key: 'rc', label: 'Recertification', auto: k((x) => `${x.recert_days} Days`) },
        { key: 'cert_status', label: 'Certificate status / قرار المدير', auto: () => 'Accepted ☑' },
        { key: 'manager_date', label: 'Certification Manager Date', auto: today },
      ]},
    ],
  },
  {
    code: 'F06-05', title_ar: 'برنامج التدقيق', title_en: 'Audit Program', rev: 'Rev01', icon: '📅',
    sections: [
      { title: 'Client / بيانات العميل', fields: CLIENT_HEADER },
      { title: '3-Year Audit Program / برنامج ثلاث سنوات', fields: [
        { key: 'stage1', label: 'Stage 1 Date / المرحلة الأولى', auto: auditOf('Stage1') },
        { key: 'stage1_lead', label: 'Stage 1 Lead / قائد الفريق', auto: leadOf('Stage1') },
        { key: 'stage2', label: 'Stage 2 Date / المرحلة الثانية', auto: auditOf('Stage2') },
        { key: 'stage2_lead', label: 'Stage 2 Lead / قائد الفريق', auto: leadOf('Stage2') },
        { key: 'sur1', label: 'Surveillance 1 / المراقبة الأولى', auto: auditOf('SUR1') },
        { key: 'sur2', label: 'Surveillance 2 / المراقبة الثانية', auto: auditOf('SUR2') },
        { key: 'rc', label: 'Recertification / إعادة الاعتماد', auto: auditOf('RC') },
        { key: 'cert_expiry', label: 'Certificate Expiry / انتهاء الشهادة', auto: c((x) => x.cert_expiry_date) },
      ]},
    ],
  },
  {
    code: 'F06-06', title_ar: 'أمر مهمة — تخصيص مدقق', title_en: 'Auditor Allocation Form (Job Order)', rev: 'Rev01', icon: '👔',
    sections: [
      { title: 'Client / بيانات العميل', fields: CLIENT_HEADER },
      { title: 'Assignment / التكليف', fields: [
        { key: 'auditor', label: 'Auditor Name / اسم المدقق', auto: leadOf('Stage2') },
        { key: 'role', label: 'Role / الدور', auto: () => 'Team Leader' },
        { key: 'audit_type', label: 'Audit Type / نوع التدقيق' },
        { key: 'audit_dates', label: 'Audit Dates / مواعيد التدقيق', auto: auditOf('Stage2') },
        { key: 'iaf', label: 'IAF Code', auto: c((x) => x.iaf_codes.join(', ')) },
        { key: 'confidentiality', label: 'Confidentiality Declaration / إقرار السرية', auto: () => 'أتعهد بالحفاظ على سرية كل معلومات العميل ✔', type: 'textarea', span: 2 },
        { key: 'sign_date', label: 'Signature Date / تاريخ التوقيع', auto: today },
      ]},
    ],
  },
  {
    code: 'F06-07', title_ar: 'خطة تدقيق المرحلة الأولى', title_en: 'Stage 1 Audit Plan', rev: 'Rev01', icon: '🗓️',
    sections: [
      { title: 'Client / بيانات العميل', fields: CLIENT_HEADER },
      { title: 'Plan / الخطة', fields: [
        { key: 'date', label: 'Audit Date / تاريخ التدقيق', auto: auditOf('Stage1') },
        { key: 'lead', label: 'Team Leader / قائد الفريق', auto: leadOf('Stage1') },
        { key: 'objectives', label: 'Audit Objectives / أهداف التدقيق', auto: () => 'التحقق من جاهزية نظام الإدارة، مراجعة الوثائق، وتأكيد نطاق الاعتماد قبل المرحلة الثانية', type: 'textarea', span: 2 },
        { key: 'agenda', label: 'Agenda / الأجندة (09:00 اجتماع افتتاحي → مراجعة الوثائق → جولة ميدانية → اجتماع ختامي)', type: 'textarea', span: 2 },
      ]},
    ],
  },
  {
    code: 'F06-08', title_ar: 'تقرير تدقيق المرحلة الأولى', title_en: 'Stage 1 Audit Report', rev: 'Rev01', icon: '📝',
    sections: [
      { title: 'Client / بيانات العميل', fields: CLIENT_HEADER },
      { title: 'Audit Details / تفاصيل التدقيق', fields: [
        { key: 'date', label: 'Audit Date / تاريخ التدقيق', auto: auditOf('Stage1') },
        { key: 'team', label: 'Audit Team / فريق التدقيق', auto: (ctx) => (ctx.audits.find((a) => a.audit_type === 'Stage1')?.team ?? []).join(', ') },
        { key: 'positives', label: 'Positive Findings / النتائج الإيجابية', type: 'textarea', span: 2 },
        { key: 'concerns', label: 'Areas of Concern / مجالات القلق', type: 'textarea', span: 2 },
        { key: 'recommendation', label: 'Team Recommendation / التوصية', auto: (ctx) => (ctx.audits.find((a) => a.audit_type === 'Stage1')?.recommendation === 'proceed_stage2' ? '☑ التقدم للمرحلة الثانية' : '') },
        { key: 'sign_date', label: 'Date / التاريخ', auto: today },
      ]},
    ],
  },
  {
    code: 'F06-09', title_ar: 'خطة تدقيق المرحلة الثانية', title_en: 'Stage 2 Audit Plan', rev: 'Rev01', icon: '🗓️',
    sections: [
      { title: 'Client / بيانات العميل', fields: CLIENT_HEADER },
      { title: 'Plan / الخطة', fields: [
        { key: 'date', label: 'Audit Date / تاريخ التدقيق', auto: auditOf('Stage2') },
        { key: 'lead', label: 'Team Leader / قائد الفريق', auto: leadOf('Stage2') },
        { key: 'team', label: 'Audit Team / الفريق', auto: (ctx) => (ctx.audits.find((a) => a.audit_type === 'Stage2')?.team ?? []).join(', ') },
        { key: 'mandays', label: 'Man-Days', auto: k((x) => x.stage2_days) },
        { key: 'objectives', label: 'Audit Objectives / الأهداف', auto: () => 'تقييم فعالية التطبيق الكامل لنظام الإدارة والتحقق من الامتثال لمتطلبات المواصفة لغرض منح الشهادة', type: 'textarea', span: 2 },
        { key: 'agenda', label: 'Detailed Agenda / الأجندة التفصيلية', type: 'textarea', span: 2 },
      ]},
    ],
  },
  {
    code: 'F06-10', title_ar: 'تقرير تدقيق المرحلة الثانية / المراقبة / إعادة الاعتماد', title_en: 'Stage 2 / SUR / RE Audit Report', rev: 'Rev01', icon: '📄',
    sections: [
      { title: 'Client / بيانات العميل', fields: CLIENT_HEADER },
      { title: 'Audit / التدقيق', fields: [
        { key: 'type', label: 'Type of Audit / نوع التدقيق', auto: (ctx) => { const a = ctx.audits.find((x) => x.audit_type === 'Stage2'); return a ? AUDIT_TYPE_AR[a.audit_type] : ''; } },
        { key: 'date', label: 'Audit Date / التاريخ', auto: auditOf('Stage2') },
        { key: 'lead', label: 'Team Leader / قائد الفريق', auto: leadOf('Stage2') },
        { key: 'ncs', label: 'Nonconformities / عدم المطابقات', auto: (ctx) => ctx.ncs.map((n) => `${n.nc_number} (${n.nc_type}) ${n.standard_code} ${n.clause}`).join(' | ') || 'لا يوجد', type: 'textarea', span: 2 },
        { key: 'summary', label: 'Audit Summary / ملخص التدقيق', auto: (ctx) => ctx.audits.find((x) => x.audit_type === 'Stage2')?.summary ?? '', type: 'textarea', span: 2 },
        { key: 'recommendation', label: 'Recommendation / التوصية', auto: (ctx) => (ctx.audits.find((x) => x.audit_type === 'Stage2')?.recommendation === 'recommend_certification' ? '☑ التوصية بمنح الشهادة' : '') },
      ]},
    ],
  },
  {
    code: 'F06-11', title_ar: 'كشف الحضور', title_en: 'Attendance Sheet Form', rev: 'Rev01', icon: '✍️',
    sections: [
      { title: 'Client / بيانات العميل', fields: CLIENT_HEADER },
      { title: 'Attendance / الحضور', fields: [
        { key: 'meeting', label: 'Meeting Type / نوع الاجتماع', auto: () => 'Opening & Closing Meeting' },
        { key: 'date', label: 'Date / التاريخ', auto: auditOf('Stage2') },
        { key: 'attendees', label: 'Attendees (Name — Position — Signature) / الحضور', type: 'textarea', span: 2, auto: (ctx) => { const a = ctx.audits.find((x) => x.audit_type === 'Stage2'); return [...(a?.team ?? []).map((t) => `${t} — Auditor`), ctx.client?.contact_person ? `${ctx.client.contact_person} — ${ctx.client.position ?? ''}` : ''].filter(Boolean).join('\n'); } },
      ]},
    ],
  },
  {
    code: 'F06-12', title_ar: 'المراجعة الفنية وقرار الاعتماد', title_en: 'Technical Review & Certification Decision', rev: 'Rev01', icon: '⚖️',
    sections: [
      { title: 'Client / بيانات العميل', fields: CLIENT_HEADER },
      { title: 'Technical Review / المراجعة الفنية', fields: [
        { key: 'audit_dates', label: 'Audit Dates / مواعيد التدقيق', auto: auditOf('Stage2') },
        { key: 'ncs_closed', label: 'All NCs closed? / هل أُغلقت كل عدم المطابقات؟', auto: (ctx) => (ctx.ncs.every((n) => n.status === 'closed') ? 'Yes ☑' : 'No — يوجد NC مفتوح') },
        { key: 'report_ok', label: 'Audit report complete & adequate? / اكتمال التقرير', auto: () => 'Yes ☑' },
        { key: 'decision', label: 'Certification Decision / قرار الاعتماد', auto: c((x) => (x.status === 'active' ? '☑ Grant Certification — منح الشهادة' : 'قيد القرار')) },
        { key: 'cert_no', label: 'Certificate No. / رقم الشهادة', auto: c((x) => x.cert_number) },
        { key: 'issue_date', label: 'Issue Date / تاريخ الإصدار', auto: c((x) => x.cert_issue_date) },
        { key: 'expiry_date', label: 'Expiry Date / تاريخ الانتهاء', auto: c((x) => x.cert_expiry_date) },
        { key: 'reviewer', label: 'Technical Reviewer / المراجع الفني' },
      ]},
    ],
  },
  {
    code: 'F06-18', title_ar: 'تقرير عدم المطابقة', title_en: 'Non-Conformity Report', rev: 'Rev01', icon: '⚠️',
    sections: [
      { title: 'Client / بيانات العميل', fields: [
        ...CLIENT_HEADER,
        { key: 'cert_no', label: 'Certification No. / رقم الشهادة', auto: c((x) => x.cert_number ?? x.client_number) },
        { key: 'audit_date', label: 'Audit Date / تاريخ التدقيق', auto: auditOf('Stage2') },
      ]},
      { title: 'Non-Conformities / عدم المطابقات', fields: [
        { key: 'nc_details', label: 'NC Details (Type | Standard | Clause | Description) / التفاصيل', type: 'textarea', span: 2, auto: (ctx) => ctx.ncs.map((n) => `${n.nc_type} | ${n.standard_code} | ${n.clause}\n${n.description ?? ''}\nRoot Cause: ${n.root_cause ?? '—'}\nCorrective Actions: ${n.corrective_actions ?? '—'}`).join('\n\n') },
        { key: 'deadline', label: 'Submission Deadline / الموعد النهائي', auto: (ctx) => ctx.ncs[0]?.deadline ?? '' },
        { key: 'team_leader', label: 'Audit Team Leader / قائد الفريق', auto: leadOf('Stage2') },
        { key: 'verification', label: 'Auditor Acceptance & Verification / التحقق', type: 'textarea', span: 2, auto: (ctx) => ctx.ncs[0]?.verification ?? '' },
      ]},
    ],
  },
  {
    code: 'F06-13', title_ar: 'نموذج بيانات الشهادة', title_en: 'Certificate Data Form', rev: 'Rev00', icon: '🗂️',
    sections: [
      { title: 'CONFIRMATION OF DETAILS FOR CERTIFICATE PRINTING / تأكيد بيانات طباعة الشهادة', fields: [
        { key: 'org_name', label: 'Organization name / اسم المنشأة', auto: c((x) => x.name) },
        { key: 'locations', label: 'Physical location(s) / Address(s) / المواقع والعناوين', auto: c((x) => `${x.address ?? ''}, ${x.city ?? ''}, ${x.country ?? ''}`), type: 'textarea', span: 2 },
        { key: 'scope', label: 'Certification Scope / نطاق الاعتماد', auto: c((x) => x.scope), type: 'textarea', span: 2 },
        { key: 'ea_code', label: 'EA Code/Technical Category', auto: c((x) => x.iaf_codes.join(', ')) },
        { key: 'next_audit_type', label: 'Next Audit type / نوع التدقيق القادم', auto: (ctx) => { const next = ctx.audits.find((a) => a.status === 'planned'); return next ? next.audit_type : ''; } },
        { key: 'next_audit_date', label: 'Next audit date / تاريخ التدقيق القادم', auto: (ctx) => ctx.audits.find((a) => a.status === 'planned')?.start_date ?? '' },
      ]},
      { title: 'Declarations / الإقرارات', fields: [
        { key: 'lead_name', label: 'Lead Auditor Name / قائد الفريق', auto: leadOf('Stage2') },
        { key: 'client_rep', label: 'Client representative / ممثل العميل', auto: c((x) => x.contact_person) },
      ]},
    ],
  },
  {
    code: 'F06-14', title_ar: 'الشهادة', title_en: 'Certificate', rev: 'Rev00', icon: '🏅',
    sections: [
      { title: 'CERTIFICATE OF REGISTRATION / شهادة التسجيل', fields: [
        { key: 'org_name', label: 'This is to certify that / نشهد بأن', auto: c((x) => x.name) },
        { key: 'address', label: 'Address / العنوان', auto: c((x) => `${x.address ?? ''}, ${x.city ?? ''}, ${x.country ?? ''}`), span: 2 },
        { key: 'standards', label: 'Has been assessed and registered against / معتمدة وفق', auto: c((x) => x.standards.join(' | ')) },
        { key: 'scope', label: 'For the following scope / للنطاق التالي', auto: c((x) => x.scope), type: 'textarea', span: 2 },
        { key: 'cert_no', label: 'Certificate Number / رقم الشهادة', auto: c((x) => x.cert_number) },
        { key: 'issue_date', label: 'Date of Issue / تاريخ الإصدار', auto: c((x) => x.cert_issue_date) },
        { key: 'expiry_date', label: 'Valid Until / صالحة حتى', auto: c((x) => x.cert_expiry_date) },
        { key: 'accreditation', label: 'Accreditation / الاعتماد', auto: c((x) => x.accreditation) },
        { key: 'signatory', label: 'Authorized Signatory / التوقيع المعتمد' },
      ]},
    ],
  },
  {
    code: 'F06-15', title_ar: 'نموذج التغذية الراجعة', title_en: 'Feedback Form', rev: 'Rev00', icon: '⭐',
    sections: [
      { title: 'Audit Info / بيانات التدقيق', fields: [
        { key: 'client_name', label: 'Organization Name / اسم المنشأة', auto: c((x) => x.name) },
        { key: 'audit_type', label: 'Type of Audit (Certification / Re-certification / Surveillance)', auto: (ctx) => { const a = ctx.audits.find((x) => x.status === 'completed'); return a ? a.audit_type : ''; } },
        { key: 'date', label: 'Date / التاريخ', auto: today },
        { key: 'standard', label: 'Standard / المواصفة', auto: c((x) => x.standards.join(', ')) },
      ]},
      { title: 'Section 1-2: ISO CERT Office & Audit Team (5=Outstanding … 1=Poor)', fields: [
        { key: 'rate_resp', label: 'Responsiveness to your enquiries — Promptness' },
        { key: 'rate_quotes', label: 'Accuracy of the quotes communicated to you' },
        { key: 'rate_knowledge', label: 'Audit team demonstrated knowledge of program criteria' },
        { key: 'rate_courtesy', label: 'Courtesy, professionalism and constructive approach' },
        { key: 'rate_explained', label: 'Audit results clearly & fully explained' },
      ]},
      { title: 'Section 3-4: Auditors & Remarks', fields: [
        { key: 'leader_rating', label: 'Team Leader — Overall Rating', auto: leadOf('Stage2') },
        { key: 'plan_advance', label: 'Did you receive the audit plan sufficiently in advance? (Yes/No)' },
        { key: 'comments', label: 'Comments / Suggestions', type: 'textarea', span: 2 },
        { key: 'resp_name', label: 'Name & Designation', auto: c((x) => `${x.contact_person ?? ''} — ${x.position ?? ''}`) },
      ]},
    ],
  },
  {
    code: 'F06-16', title_ar: 'مراجعة ما قبل النقل', title_en: 'Pre-Transfer Review', rev: 'Rev00', icon: '🔁',
    sections: [
      { title: 'Client / بيانات العميل', fields: [
        { key: 'client_name', label: 'Name of Client / اسم العميل', auto: c((x) => x.name) },
        { key: 'address', label: 'Address of Client / العنوان', auto: c((x) => x.address), span: 2 },
        { key: 'contact', label: 'Client Contact / جهة الاتصال', auto: c((x) => x.contact_person) },
        { key: 'phone', label: 'Telephone Number / الهاتف', auto: c((x) => x.phone) },
        { key: 'enquiry_ref', label: 'Enquiry Reference No. / رقم الطلب' },
        { key: 'existing_cb', label: 'Existing Certification Body / جهة المنح الحالية' },
        { key: 'cert_no', label: 'Certificate Number / رقم الشهادة' },
        { key: 'eac', label: 'EAC Code', auto: c((x) => x.iaf_codes.join(', ')) },
        { key: 'scope', label: 'Scope of Activities / نطاق الأنشطة', auto: c((x) => x.scope), type: 'textarea', span: 2 },
        { key: 'transfer_reason', label: 'Reason for transfer / سبب النقل', type: 'textarea', span: 2 },
        { key: 'sites', label: 'No of sites / عدد المواقع', auto: c((x) => String(x.sites)) },
        { key: 'minor_open', label: 'Any minor non-conformity outstanding? / عدم مطابقة صغرى مفتوحة؟' },
        { key: 'major_open', label: 'Any major non-conformity outstanding? / عدم مطابقة كبرى مفتوحة؟' },
        { key: 'recert_due', label: 'When re-certification is due? / موعد إعادة الاعتماد' },
      ]},
      { title: 'Evidence Review (tick if acceptable) / مراجعة الأدلة', fields: [
        { key: 'ev1', label: '1. Is current certificate accredited by an IAF SAAC signatory?' },
        { key: 'ev2', label: '2. Is certificate valid (duration, scope, sites, EA code)?' },
        { key: 'ev3', label: '3. Do audit reports demonstrate a well implemented system?' },
        { key: 'ev4', label: '4. Are all non-compliances closed or progressing satisfactorily?' },
        { key: 'ev5', label: '5. Acceptable level of customer complaints, adequately handled?' },
        { key: 'approved', label: 'Certification Transfer approved? Yes / No' },
        { key: 'next_visit', label: 'Next Visit Due / الزيارة القادمة' },
        { key: 'reviewed_by', label: 'Reviewed by / روجع بواسطة' },
        { key: 'review_date', label: 'Date / التاريخ', auto: today },
      ]},
    ],
  },
  {
    code: 'F06-17', title_ar: 'ملاحظات المدقق', title_en: 'Auditor Notes', rev: 'Rev00', icon: '📓',
    sections: [
      { title: 'Audit Info / بيانات التدقيق', fields: [
        { key: 'client_name', label: 'CLIENT NAME / اسم العميل', auto: c((x) => x.name) },
        { key: 'location', label: 'LOCATION / الموقع', auto: c((x) => `${x.city ?? ''}, ${x.country ?? ''}`) },
        { key: 'standards', label: 'STANDARD(s) / المواصفات', auto: c((x) => x.standards.join(', ')) },
        { key: 'auditor', label: 'AUDITOR / المدقق', auto: leadOf('Stage2') },
        { key: 'audit_type', label: 'TYPE OF AUDIT / نوع التدقيق', auto: (ctx) => ctx.audits.find((a) => a.status === 'completed')?.audit_type ?? '' },
        { key: 'audit_date', label: 'AUDIT DATE / تاريخ التدقيق', auto: auditOf('Stage2') },
        { key: 'department', label: 'Department / القسم' },
      ]},
      { title: 'Notes / الملاحظات', fields: [
        { key: 'notes', label: 'Auditor Notes / ملاحظات المدقق', type: 'textarea', span: 2 },
      ]},
    ],
  },
];

export const FORM_LIST = FORM_DEFINITIONS.map(({ code, title_ar, title_en, icon }) => ({ code, title_ar, title_en, icon }));
