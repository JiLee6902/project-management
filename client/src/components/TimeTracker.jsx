import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Clock, Play, Square, Trash2, Loader2 } from 'lucide-react';
import { timeTrackingService } from '../services/timeTrackingService';
import toast from 'react-hot-toast';

const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0s';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  if (mins > 0) {
    return `${mins}m`;
  }
  return `${secs}s`;
};

const TimeTracker = ({ taskId }) => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  const [description, setDescription] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (taskId) {
      fetchTimeEntries();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [taskId]);

  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        setTimerDisplay(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else {
      setTimerDisplay('00:00:00');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTimer]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const data = await timeTrackingService.getTaskTimeEntries(taskId);
      setTimeEntries(data.timeEntries || []);
      setTotalTime(data.totalTime || 0);

      const running = data.timeEntries?.find(e => !e.endTime);
      if (running) {
        setActiveTimer(running);
      }
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = async () => {
    try {
      const data = await timeTrackingService.startTimer(taskId, description);
      setActiveTimer(data.timeEntry);
      setDescription('');
      toast.success('Timer started');
    } catch (error) {
      toast.error('Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    try {
      await timeTrackingService.stopTimer(activeTimer.id);
      setActiveTimer(null);
      fetchTimeEntries();
      toast.success('Timer stopped');
    } catch (error) {
      toast.error('Failed to stop timer');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      await timeTrackingService.deleteTimeEntry(entryId);
      setTimeEntries(prev => prev.filter(e => e.id !== entryId));
      toast.success('Time entry deleted');
      fetchTimeEntries();
    } catch (error) {
      toast.error('Failed to delete time entry');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading time entries...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Clock className="size-4" />
          Time Tracking
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          Total: {formatDuration(totalTime)}
        </span>
      </div>

      <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-lg text-zinc-900 dark:text-zinc-100">
            {timerDisplay}
          </span>
          {activeTimer ? (
            <button
              onClick={handleStopTimer}
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
              title="Stop timer"
            >
              <Square className="size-4" />
            </button>
          ) : (
            <button
              onClick={handleStartTimer}
              className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
              title="Start timer"
            >
              <Play className="size-4" />
            </button>
          )}
        </div>
        {!activeTimer && (
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            className="w-full text-sm bg-transparent border-b border-zinc-300 dark:border-zinc-600 focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
          />
        )}
      </div>

      {timeEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">
            Recent entries
          </p>
          {timeEntries.slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded text-sm"
            >
              <div className="flex-1">
                <p className="text-zinc-900 dark:text-zinc-100">
                  {entry.description || 'No description'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {entry.startTime && format(new Date(entry.startTime), 'MMM d, HH:mm')}
                  {entry.endTime && ` - ${format(new Date(entry.endTime), 'HH:mm')}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-600 dark:text-zinc-400 font-mono">
                  {formatDuration(entry.duration)}
                </span>
                {entry.endTime && (
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
