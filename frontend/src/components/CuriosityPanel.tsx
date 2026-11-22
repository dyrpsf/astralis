import { useState, useEffect } from 'react';
import { Sparkles, Send, MessageSquare, X } from 'lucide-react';
import { API_BASE } from '../store/useSimulationStore';

interface CuriosityPanelProps {
  topic: string;
  context: string;
}

interface QAItem {
  q: string;
  a: string;
  source: string;
}

export function CuriosityPanel({ topic, context }: CuriosityPanelProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QAItem[]>([]);

  // Reset chat when user clicks a new planet, star, or cosmic stage
  useEffect(() => {
    setHistory([]);
  }, [topic]);

  const ask = async (customQ?: string) => {
    const q = (customQ || question).trim();
    if (!q || loading) return;
    setLoading(true);
    setQuestion('');

    try {
      const res = await fetch(`${API_BASE}/api/ai/curiosity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, context, question: q }),
      });
      const data = await res.json();
      setHistory((prev) => [...prev, { q, a: data.answer, source: data.source }]);
    } catch {
      setHistory((prev) => [
        ...prev,
        {
          q,
          a: 'Could not reach the ASTRALIS backend on port 8080. Make sure Spring Boot is running.',
          source: 'Offline',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="pointer-events-auto fixed bottom-6 left-6 z-30 flex items-center gap-2 rounded-full border border-indigo-400/50 bg-indigo-600/90 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-950/60 backdrop-blur-md transition hover:bg-indigo-500"
      >
        <Sparkles className="h-4 w-4 text-amber-300" />
        Ask Curiosity AI · {topic}
      </button>
    );
  }

  return (
    <div className="pointer-events-auto fixed bottom-6 left-6 z-30 flex w-84 md:w-96 flex-col rounded-2xl border border-indigo-500/40 bg-slate-950/92 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white">
            <MessageSquare className="h-4 w-4 text-indigo-400" />
            Curiosity Panel · Gemini AI
          </h3>
          <p className="text-[10px] font-mono text-cyan-400 truncate max-w-[260px]">
            Inspecting: {topic}
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800/80 px-3 py-2">
        {[
          `Can humans survive on ${topic}?`,
          `Biggest mystery of ${topic}?`,
          `How do we reach ${topic}?`,
        ].map((chip) => (
          <button
            key={chip}
            onClick={() => ask(chip)}
            className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[10px] text-indigo-200 hover:bg-indigo-500/25"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat History */}
      <div className="max-h-60 space-y-2.5 overflow-y-auto p-3 text-xs">
        {history.length === 0 && (
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Ask anything about <span className="text-white font-semibold">{topic}</span>—physics,
            colonization, radiation, propulsion, or wild "what-if" scenarios.
          </p>
        )}
        {history.map((item, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="ml-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1.5 text-cyan-100">
              {item.q}
            </div>
            <div className="mr-4 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-slate-200 leading-relaxed">
              <div className="mb-1 text-[9px] font-mono uppercase text-indigo-400">
                {item.source}
              </div>
              {item.a}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-[11px] font-mono text-indigo-300 animate-pulse">
            Querying Gemini Astrophysics Engine...
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
        className="flex gap-1.5 border-t border-slate-800 p-2.5"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask about ${topic}...`}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center rounded-lg bg-indigo-500 px-3 py-1.5 text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}