import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function AiAssistantButton({ onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {/* Tooltip */}
      {hovered && (
        <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium whitespace-nowrap shadow-lg animate-fade-in">
          AI Assistant
          <div className="absolute top-full right-4 w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45 -translate-y-1" />
        </div>
      )}

      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative w-12 h-12 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-ai-pulse" />

        <Sparkles className="w-5 h-5 relative z-10" />
      </button>

      <style>{`
        @keyframes ai-pulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.4); }
        }
        .animate-ai-pulse {
          animation: ai-pulse 3s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}
