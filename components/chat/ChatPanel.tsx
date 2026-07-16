'use client';
import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X, Loader2, Sparkles } from 'lucide-react';
import { useLang } from '@/lib/i18n';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, dir } = useLang();
  const welcome =
    lang === 'ar'
      ? 'أهلاً بك! أنا مساعد ISO الذكي 🤖\nأستطيع البحث عن العملاء، حساب أيام التدقيق، عرض الإحصائيات، إضافة عملاء وتقارير عدم مطابقة.\nجرّب: "احسب الأيام لـ 50 موظف ISO 9001 و ISO 14001 متكامل"'
      : 'Welcome! I am the ISO Smart Assistant 🤖\nI can search clients, calculate audit days, show statistics, add clients and NC reports.\nTry: "Calculate days for 50 employees ISO 9001 and ISO 14001 integrated"';

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chips = [t('chip_new_client'), t('chip_add_nc'), t('chip_calc'), t('chip_stats')];
  const shown = messages.length === 0 ? [{ role: 'assistant' as const, content: welcome }] : messages;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-12), lang }),
      });
      if (!res.ok || !res.body) throw new Error('bad response');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      setMessages((m) => [...m, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: t('ai_error') }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`no-print chat-slide fixed inset-y-0 end-0 z-50 flex w-full max-w-[400px] flex-col border-s border-surface-border bg-white shadow-card-hover dark:border-navy-600 dark:bg-navy-800 ${
        open ? 'flex' : 'hidden'
      }`}
      role="dialog"
      aria-label={t('ai_title')}
    >
      <div className="flex items-center gap-3 border-b border-surface-border bg-navy-700 px-4 py-3 text-white dark:border-navy-600">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-navy-900">
          <Bot className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold">{t('ai_title')}</p>
          <p className="text-[11px] text-navy-100">{t('ai_connected')}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-navy-600" aria-label={t('ai_close')}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {shown.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-ss-sm bg-navy-700 text-white'
                  : 'bg-surface-gray text-navy-800 dark:bg-navy-700 dark:text-slate-100'
              }`}
            >
              {m.content}
              {busy && i === shown.length - 1 && m.role === 'assistant' && (
                <span className="ms-1 inline-block h-4 w-1.5 animate-blink bg-gold align-middle" aria-hidden />
              )}
            </div>
          </div>
        ))}
        {busy && shown[shown.length - 1]?.role === 'user' && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 rounded-2xl bg-surface-gray px-3.5 py-2.5 text-sm text-navy-400 dark:bg-navy-700">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('ai_thinking')}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-surface-border p-3 dark:border-navy-600">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => send(c)}
              className="flex items-center gap-1 rounded-full border border-surface-border bg-white px-3 py-1 text-xs font-semibold text-navy-600 hover:border-gold hover:bg-gold-50 dark:bg-navy-700 dark:border-navy-600"
            >
              <Sparkles className="h-3 w-3 text-gold" aria-hidden />
              {c}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input flex-1"
            placeholder={t('ai_placeholder')}
            aria-label={t('ai_placeholder')}
            disabled={busy}
          />
          <button type="submit" className="btn-primary px-3" disabled={busy || !input.trim()} aria-label={t('ai_send')}>
            <Send className={`h-4 w-4 ${dir === 'rtl' ? '-scale-x-100' : ''}`} />
          </button>
        </form>
      </div>
    </div>
  );
}
