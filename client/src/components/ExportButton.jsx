import { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, Loader2, ChevronDown } from 'lucide-react';
import { exportService } from '../services/exportService';
import toast from 'react-hot-toast';

const ExportButton = ({ projectId, projectName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      setIsOpen(false);
      await exportService.downloadCsv(projectId, projectName);
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = async () => {
    try {
      setExporting(true);
      setIsOpen(false);
      await exportService.downloadJson(projectId, projectName);
      toast.success('JSON exported successfully');
    } catch (error) {
      toast.error('Failed to export JSON');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
      >
        {exporting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        <span>Export</span>
        <ChevronDown className="size-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 z-20 overflow-hidden">
            <button
              onClick={handleExportCsv}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <FileSpreadsheet className="size-4 text-green-500" />
              Export as CSV
            </button>
            <button
              onClick={handleExportJson}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <FileJson className="size-4 text-blue-500" />
              Export as JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
