import { useState } from 'react';
import {
  Sparkles,
  Brain,
  Clock,
  ArrowUp,
  ListTodo,
  FileText,
  Loader2,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { aiService } from '../services/aiService';

const ACTION_TABS = [
  { id: 'subtasks', label: 'Subtasks', icon: ListTodo },
  { id: 'priority', label: 'Priority', icon: ArrowUp },
  { id: 'estimate', label: 'Estimate', icon: Clock },
  { id: 'description', label: 'Description', icon: FileText },
];

const PRIORITY_COLORS = {
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function AiAssistantPanel({
  taskTitle,
  taskDescription,
  taskId,
  projectContext,
  onSubtasksGenerated,
  onPrioritySelected,
  onDescriptionImproved,
  onTimeEstimated,
  isOpen,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('subtasks');
  const [loading, setLoading] = useState(false);

  // Subtasks state
  const [subtasks, setSubtasks] = useState([]);
  const [selectedSubtasks, setSelectedSubtasks] = useState(new Set());

  // Priority state
  const [priorityResult, setPriorityResult] = useState(null);

  // Estimate state
  const [estimateResult, setEstimateResult] = useState(null);

  // Description state
  const [improvedDescription, setImprovedDescription] = useState('');

  const handleGenerateSubtasks = async () => {
    if (!taskTitle) {
      toast.error('Task title is required');
      return;
    }
    setLoading(true);
    setSubtasks([]);
    setSelectedSubtasks(new Set());
    try {
      const data = await aiService.generateSubtasks(taskTitle, taskDescription);
      const results = data.subtasks || [];
      setSubtasks(results);
      setSelectedSubtasks(new Set(results.map((_, i) => i)));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to generate subtasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestPriority = async () => {
    if (!taskTitle) {
      toast.error('Task title is required');
      return;
    }
    setLoading(true);
    setPriorityResult(null);
    try {
      const data = await aiService.suggestPriority(taskTitle, taskDescription, projectContext);
      setPriorityResult(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to suggest priority');
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateTime = async () => {
    if (!taskTitle) {
      toast.error('Task title is required');
      return;
    }
    setLoading(true);
    setEstimateResult(null);
    try {
      const data = await aiService.estimateTime(taskTitle, taskDescription, subtasks);
      setEstimateResult(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to estimate time');
    } finally {
      setLoading(false);
    }
  };

  const handleImproveDescription = async () => {
    if (!taskTitle) {
      toast.error('Task title is required');
      return;
    }
    setLoading(true);
    setImprovedDescription('');
    try {
      const data = await aiService.improveDescription(taskTitle, taskDescription);
      setImprovedDescription(data.description || '');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to improve description');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    switch (activeTab) {
      case 'subtasks':
        return handleGenerateSubtasks();
      case 'priority':
        return handleSuggestPriority();
      case 'estimate':
        return handleEstimateTime();
      case 'description':
        return handleImproveDescription();
    }
  };

  const toggleSubtask = (index) => {
    setSelectedSubtasks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAddSubtasks = () => {
    const selected = subtasks.filter((_, i) => selectedSubtasks.has(i));
    if (selected.length === 0) {
      toast.error('Select at least one subtask');
      return;
    }
    onSubtasksGenerated?.(selected);
    toast.success(`${selected.length} subtask${selected.length > 1 ? 's' : ''} added`);
    setSubtasks([]);
    setSelectedSubtasks(new Set());
  };

  const handleApplyPriority = () => {
    if (priorityResult?.priority) {
      onPrioritySelected?.(priorityResult.priority);
      toast.success(`Priority set to ${priorityResult.priority}`);
    }
  };

  const handleApplyDescription = () => {
    if (improvedDescription) {
      onDescriptionImproved?.(improvedDescription);
      toast.success('Description updated');
    }
  };

  const handleApplyEstimate = () => {
    if (estimateResult?.hours != null) {
      onTimeEstimated?.(estimateResult.hours);
      toast.success(`Time estimate of ${estimateResult.hours}h applied`);
    }
  };

  const getActionLabel = () => {
    switch (activeTab) {
      case 'subtasks':
        return 'Generate Subtasks';
      case 'priority':
        return 'Suggest Priority';
      case 'estimate':
        return 'Estimate Time';
      case 'description':
        return 'Improve Description';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md animate-slide-in-right">
      {/* Backdrop for mobile */}
      <div className="absolute inset-0 -left-full bg-black/20 dark:bg-black/40 lg:hidden" onClick={onClose} />

      <div className="relative h-full ml-auto w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Sparkles className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              AI Assistant
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab buttons */}
        <div className="grid grid-cols-4 gap-1 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
          {ACTION_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Task context */}
          <div className="mb-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Current Task
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {taskTitle || 'No title'}
            </p>
            {taskDescription && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {taskDescription}
              </p>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={handleAction}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                {getActionLabel()}
              </>
            )}
          </button>

          {/* Results */}
          {activeTab === 'subtasks' && subtasks.length > 0 && (
            <SubtasksResult
              subtasks={subtasks}
              selected={selectedSubtasks}
              onToggle={toggleSubtask}
              onAdd={handleAddSubtasks}
              onSelectAll={() => setSelectedSubtasks(new Set(subtasks.map((_, i) => i)))}
              onDeselectAll={() => setSelectedSubtasks(new Set())}
            />
          )}

          {activeTab === 'priority' && priorityResult && (
            <PriorityResult result={priorityResult} onApply={handleApplyPriority} />
          )}

          {activeTab === 'estimate' && estimateResult && (
            <EstimateResult result={estimateResult} onApply={handleApplyEstimate} />
          )}

          {activeTab === 'description' && improvedDescription && (
            <DescriptionResult
              description={improvedDescription}
              onApply={handleApplyDescription}
            />
          )}

          {/* Empty state when no results */}
          {!loading && !hasResults(activeTab, { subtasks, priorityResult, estimateResult, improvedDescription }) && (
            <div className="text-center py-10">
              <div className="inline-flex p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-3">
                <Sparkles className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Click the button above to get AI-powered suggestions
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

function hasResults(tab, state) {
  switch (tab) {
    case 'subtasks':
      return state.subtasks.length > 0;
    case 'priority':
      return !!state.priorityResult;
    case 'estimate':
      return !!state.estimateResult;
    case 'description':
      return !!state.improvedDescription;
    default:
      return false;
  }
}

function SubtasksResult({ subtasks, selected, onToggle, onAdd, onSelectAll, onDeselectAll }) {
  const allSelected = selected.size === subtasks.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Generated Subtasks
        </h3>
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="space-y-1.5">
        {subtasks.map((subtask, index) => {
          const isSelected = selected.has(index);
          const title = typeof subtask === 'string' ? subtask : subtask.title;

          return (
            <button
              key={index}
              onClick={() => onToggle(index)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-150 ${
                isSelected
                  ? 'border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/80'
                  : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700'
              }`}
            >
              <div
                className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100'
                    : 'border-zinc-300 dark:border-zinc-600'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white dark:text-zinc-900" />}
              </div>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{title}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onAdd}
        disabled={selected.size === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Check className="w-4 h-4" />
        Add {selected.size} Subtask{selected.size !== 1 ? 's' : ''}
      </button>
    </div>
  );
}

function PriorityResult({ result, onApply }) {
  const priority = result.priority || 'MEDIUM';
  const reasoning = result.reasoning || '';
  const colorClass = PRIORITY_COLORS[priority] || PRIORITY_COLORS.MEDIUM;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Suggested Priority
      </h3>

      <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50">
        <div className="flex items-center gap-3 mb-3">
          <ArrowUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colorClass}`}>
            {priority}
          </span>
        </div>
        {reasoning && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{reasoning}</p>
        )}
      </div>

      <button
        onClick={onApply}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        <Check className="w-4 h-4" />
        Apply Priority
      </button>
    </div>
  );
}

function EstimateResult({ result, onApply }) {
  const hours = result.hours ?? 0;
  const confidence = result.confidence || 'medium';
  const breakdown = result.breakdown || [];

  const confidenceColors = {
    high: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Time Estimate
      </h3>

      <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{hours}</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">hours</span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Confidence:</span>
          <span className={`text-xs font-semibold capitalize ${confidenceColors[confidence] || confidenceColors.medium}`}>
            {confidence}
          </span>
        </div>

        {breakdown.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-700 pt-3 mt-3">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Breakdown
            </p>
            <ul className="space-y-1.5">
              {breakdown.map((item, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {typeof item === 'string' ? item : item.task || item.label}
                  </span>
                  {typeof item === 'object' && item.hours != null && (
                    <span className="text-zinc-900 dark:text-zinc-200 font-medium text-xs">
                      {item.hours}h
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={onApply}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        <Check className="w-4 h-4" />
        Apply Estimate
      </button>
    </div>
  );
}

function DescriptionResult({ description, onApply }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Improved Description
      </h3>

      <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50">
        <p
          className={`text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap ${
            !expanded ? 'line-clamp-6' : ''
          }`}
        >
          {description}
        </p>
        {description.length > 300 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      <button
        onClick={onApply}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        <Check className="w-4 h-4" />
        Apply Description
      </button>
    </div>
  );
}
