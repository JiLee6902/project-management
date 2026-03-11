import { useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  FileText,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { aiService } from '../services/aiService';

export default function AiSprintSummary({ tasks = [] }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleGenerate = async () => {
    if (!tasks.length) {
      toast.error('No tasks available to summarize');
      return;
    }
    setLoading(true);
    setSummary(null);
    try {
      const data = await aiService.summarizeSprint(tasks);
      setSummary(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to generate sprint summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Sparkles className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            AI Sprint Summary
          </h3>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {summary && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
              />
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading || !tasks.length}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {summary ? 'Regenerate' : 'Generate Summary'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {!summary && !loading && (
        <div className="px-5 py-10 text-center">
          <div className="inline-flex p-3 rounded-full bg-zinc-50 dark:bg-zinc-800/50 mb-3">
            <FileText className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Generate an AI-powered summary of your sprint progress
          </p>
        </div>
      )}

      {loading && (
        <div className="px-5 py-10 text-center">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Analyzing sprint tasks...</p>
        </div>
      )}

      {summary && !collapsed && (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {/* Summary text */}
          {summary.summary && (
            <SummarySection
              icon={FileText}
              title="Overview"
              accentColor="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {summary.summary}
              </p>
            </SummarySection>
          )}

          {/* Highlights */}
          {summary.highlights?.length > 0 && (
            <SummarySection
              icon={TrendingUp}
              title="Highlights"
              accentColor="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
            >
              <ul className="space-y-2">
                {summary.highlights.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </SummarySection>
          )}

          {/* Blockers */}
          {summary.blockers?.length > 0 && (
            <SummarySection
              icon={AlertTriangle}
              title="Blockers"
              accentColor="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            >
              <ul className="space-y-2">
                {summary.blockers.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </SummarySection>
          )}

          {/* Suggestions */}
          {summary.suggestions?.length > 0 && (
            <SummarySection
              icon={Lightbulb}
              title="Suggestions"
              accentColor="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
            >
              <ul className="space-y-2">
                {summary.suggestions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </SummarySection>
          )}
        </div>
      )}
    </div>
  );
}

function SummarySection({ icon: Icon, title, accentColor, children }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1 rounded-md ${accentColor}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}
