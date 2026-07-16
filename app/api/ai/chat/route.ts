import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabase } from '@/lib/supabase/server';
import { toolDefinitions, runTool } from '@/lib/ai/tools';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SYSTEM_PROMPT = `أنت مساعد ذكي داخل نظام ISO CERT INTERNATIONAL لإدارة شهادات الأيزو.
مهمتك مساعدة الأدمن والمدققين في: البحث عن العملاء، حساب أيام التدقيق وفق قواعد IAF MD5/MD9/MD11،
التحقق من إتاحة المدققين، إضافة عملاء، إنشاء تقارير عدم المطابقة، وتقديم إحصائيات فورية.
قواعد صارمة:
- أي إجراء يغيّر البيانات (addClient / createNC) يتطلب تأكيداً صريحاً من المستخدم قبل التنفيذ — اعرض ملخص البيانات واطلب "تأكيد" أولاً، ولا تستدعِ الأداة إلا بعد أن يكتب المستخدم تأكيداً واضحاً.
- استخدم الأدوات لتنفيذ الإجراءات الفعلية، لا تخترع بيانات أو نتائج.
- تحدث بالعربية الفصحى المبسطة مع المصطلحات التقنية الإنجليزية عند الحاجة (IAF, NC, Stage 1...).
- كن موجزاً وعملياً.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function getApiKey(): Promise<{ key: string; model: string } | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase.from('app_settings').select('key, value').in('key', ['anthropic_api_key', 'ai_model']);
  const key = data?.find((r) => r.key === 'anthropic_api_key')?.value?.trim();
  const model = data?.find((r) => r.key === 'ai_model')?.value?.trim() || 'claude-sonnet-4-5';
  return key ? { key, model } : null;
}

// ===== مساعد محلي (بدون مفتاح Claude): ينفذ الأدوات بقواعد نصية =====
async function localAssistant(messages: ChatMessage[]): Promise<string> {
  const supabase = createServerSupabase();
  const last = messages[messages.length - 1]?.content ?? '';

  if (/إحصائ|احصائ|statistics/i.test(last)) {
    const s = (await runTool(supabase, 'getStatistics', {})) as Record<string, number>;
    return `📊 إحصائيات النظام الحالية:\n• إجمالي العملاء: ${s.totalClients}\n• العملاء المعتمدون: ${s.activeClients}\n• تدقيقات قادمة: ${s.upcomingAudits}\n• عدم مطابقات مفتوحة: ${s.openNCs}\n• شهادات تنتهي خلال 90 يوماً: ${s.expiringCertsIn90Days}`;
  }

  if (/احسب|حساب.*أيام|calculate/i.test(last)) {
    const employees = Number(last.match(/(\d+)\s*موظف/)?.[1] ?? last.match(/\d+/)?.[0] ?? 0);
    const standards = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 13485', 'ISO 22301', 'ISO 50001'].filter((s) =>
      new RegExp(s.replace(' ', '\\s*'), 'i').test(last)
    );
    if (!employees || standards.length === 0) {
      return 'لحساب أيام التدقيق أخبرني: عدد الموظفين + المواصفات المطلوبة، مثال:\n"احسب الأيام لـ 50 موظف ISO 9001 و ISO 14001 متكامل"';
    }
    const isIntegrated = /متكامل|integrated/i.test(last);
    const r = (await runTool(supabase, 'calculateAuditDays', { employees, standards, isIntegrated })) as Record<string, unknown>;
    return `🧮 نتيجة الحساب (${standards.join('، ')} — ${employees} موظف${isIntegrated ? ' — متكامل' : ''}):\n• الأيام قبل الخصم: ${r.totalBeforeReduction}\n• خصم MD9: ${r.md9ReductionPercent}% | خصم MD11: ${r.md11ReductionPercent}%\n• أيام التدقيق الأولي النهائية: ${r.roundedFinalAuditDays} يوم\n• المرحلة الأولى: ${r.stage1Days} | المرحلة الثانية: ${r.stage2Days}\n• المراقبة: ${r.surveillanceDays} | إعادة الاعتماد: ${r.recertDays}`;
  }

  if (/بحث|ابحث|عن عميل|search/i.test(last)) {
    const q = last.replace(/.*(?:بحث|ابحث)\s*(?:عن)?\s*/, '').trim();
    const r = (await runTool(supabase, 'searchClients', { query: q })) as { clients?: { name: string; client_number: string; status: string }[] };
    if (!r.clients?.length) return `لم أجد عملاء مطابقين لـ "${q}"`;
    return `🔎 نتائج البحث:\n${r.clients.map((c) => `• ${c.name} (${c.client_number}) — ${c.status}`).join('\n')}`;
  }

  if (/عميل جديد|إضافة عميل/i.test(last)) {
    return 'لإضافة عميل جديد استخدم معالج "عميل جديد" من صفحة العملاء، أو أرسل لي البيانات هنا بصيغة:\n"أضف عميل: [الاسم]، [عدد الموظفين] موظف، ISO 9001، مدينة الرياض" ثم أطلب تأكيدك قبل الحفظ.\n\n💡 لتفعيل الذكاء الكامل (فهم حر وتنفيذ مباشر) أضف مفتاح Claude API من صفحة الإعدادات.';
  }

  if (/^تأكيد/i.test(last)) {
    const prev = messages[messages.length - 2]?.content ?? '';
    const addMatch = prev.match(/أضف عميل[:\s]*(.+?)،\s*(\d+)\s*موظف/);
    if (addMatch) {
      const standards = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 13485'].filter((s) => prev.includes(s));
      const r = (await runTool(supabase, 'addClient', {
        name: addMatch[1].trim(),
        employees: Number(addMatch[2]),
        standards: standards.length ? standards : ['ISO 9001'],
      })) as { success?: boolean; client?: { client_number: string; name: string }; error?: string };
      return r.success ? `✅ تم إنشاء العميل ${r.client!.name} برقم ${r.client!.client_number}` : `❌ ${r.error}`;
    }
    return 'لا يوجد إجراء معلّق للتأكيد.';
  }

  if (/أضف عميل/i.test(last)) {
    return `سأضيف العميل التالي:\n${last.replace(/أضف عميل[:\s]*/, '')}\n\nاكتب "تأكيد" للحفظ الفعلي في قاعدة البيانات.`;
  }

  if (/NC|عدم مطابقة/i.test(last)) {
    return 'لإضافة تقرير عدم مطابقة: افتح صفحة "عدم المطابقة" أو صفحة التدقيق المعني واضغط NCR على البند المخالف.\nيمكنني عرض عدم المطابقات المفتوحة — اكتب "إحصائيات".';
  }

  return 'أستطيع مساعدتك في:\n• "إحصائيات" — أرقام النظام الفورية\n• "احسب الأيام لـ 50 موظف ISO 9001 متكامل"\n• "ابحث عن WRASS"\n• "أضف عميل: الاسم، 30 موظف، ISO 9001"\n\n💡 أضف مفتاح Claude API من الإعدادات لتفعيل الفهم الحر الكامل.';
}

// ===== وضع Claude API الكامل مع الأدوات =====
async function claudeAssistant(messages: ChatMessage[], apiKey: string, model: string): Promise<ReadableStream> {
  const supabase = createServerSupabase();
  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const convo: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));
        // حلقة الأدوات: حتى 5 جولات
        for (let round = 0; round < 5; round++) {
          const resp = await client.messages.create({
            model,
            max_tokens: 1500,
            system: SYSTEM_PROMPT,
            tools: toolDefinitions as Anthropic.Tool[],
            messages: convo,
          });
          const toolUses = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
          const text = resp.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('');
          if (text) controller.enqueue(encoder.encode(text));
          if (toolUses.length === 0) break;
          controller.enqueue(encoder.encode('\n⏳ جارٍ التنفيذ...\n'));
          convo.push({ role: 'assistant', content: resp.content });
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            const result = await runTool(supabase, tu.name, tu.input as Record<string, unknown>);
            results.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(result) });
          }
          convo.push({ role: 'user', content: results });
        }
      } catch (e) {
        controller.enqueue(encoder.encode(`\n❌ خطأ في الاتصال بـ Claude API: ${e instanceof Error ? e.message : 'unknown'}\nتحقق من صحة المفتاح في الإعدادات.`));
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(req: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  const { messages } = (await req.json()) as { messages: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) return new Response('bad request', { status: 400 });

  const cfg = await getApiKey();
  if (cfg) {
    const stream = await claudeAssistant(messages, cfg.key, cfg.model);
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  // بدون مفتاح: مساعد محلي بنفس الأدوات
  const text = await localAssistant(messages);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // بث تدريجي لمحاكاة الكتابة
      const words = text.split(/(?<=\s)/);
      for (const w of words) {
        controller.enqueue(encoder.encode(w));
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
