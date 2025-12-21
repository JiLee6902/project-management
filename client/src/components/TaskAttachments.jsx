import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  Paperclip,
  Upload,
  X,
  Download,
  Trash2,
  File,
  Image,
  FileText,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Archive,
  Loader2,
  Eye
} from 'lucide-react';
import { attachmentService } from '../services/attachmentService';
import toast from 'react-hot-toast';

const FileIcon = ({ mimeType, className = 'size-5' }) => {
  const type = attachmentService.getFileIcon(mimeType);

  const icons = {
    image: Image,
    video: FileVideo,
    audio: FileAudio,
    pdf: FileText,
    doc: FileText,
    excel: FileSpreadsheet,
    zip: Archive,
    file: File,
  };

  const IconComponent = icons[type] || File;
  return <IconComponent className={className} />;
};

const TaskAttachments = ({ taskId, projectId }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (taskId) {
      fetchAttachments();
    }
  }, [taskId]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const data = await attachmentService.getTaskAttachments(taskId);
      setAttachments(data);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);

      if (fileArray.length === 1) {
        const attachment = await attachmentService.uploadAttachment(taskId, projectId, fileArray[0]);
        setAttachments(prev => [attachment, ...prev]);
        toast.success('File uploaded successfully');
      } else {
        const newAttachments = await attachmentService.uploadMultipleAttachments(taskId, projectId, fileArray);
        setAttachments(prev => [...newAttachments, ...prev]);
        toast.success(`${newAttachments.length} files uploaded successfully`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachment) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await attachmentService.deleteAttachment(attachment.id, projectId);
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      toast.success('Attachment deleted');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete attachment');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
    e.target.value = '';
  };

  const isImage = (mimeType) => mimeType?.startsWith('image/');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="size-4 text-gray-500 dark:text-zinc-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">
            Attachments
          </h3>
          {attachments.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-zinc-500">
              ({attachments.length})
            </span>
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          Upload
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        <Upload className="size-8 mx-auto text-gray-400 dark:text-zinc-500 mb-2" />
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          Drag & drop files here or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">
          Max 10MB per file
        </p>
      </div>

      {/* Attachments List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="size-6 animate-spin text-gray-400" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-zinc-500 text-center py-2">
          No attachments yet
        </p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg group"
            >
              {/* Thumbnail or Icon */}
              <div className="flex-shrink-0">
                {isImage(attachment.mimeType) ? (
                  <button
                    onClick={() => setPreviewImage(attachment)}
                    className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-zinc-700 hover:opacity-80 transition"
                  >
                    <img
                      src={attachment.url}
                      alt={attachment.originalName}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                    <FileIcon mimeType={attachment.mimeType} className="size-6 text-gray-500 dark:text-zinc-400" />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                  {attachment.originalName}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-500">
                  {attachmentService.formatFileSize(attachment.size)} •{' '}
                  {attachment.uploader?.name || 'Unknown'} •{' '}
                  {format(new Date(attachment.createdAt), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                {isImage(attachment.mimeType) && (
                  <button
                    onClick={() => setPreviewImage(attachment)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg"
                    title="Preview"
                  >
                    <Eye className="size-4" />
                  </button>
                )}
                <a
                  href={attachment.url}
                  download={attachment.originalName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg"
                  title="Download"
                >
                  <Download className="size-4" />
                </a>
                <button
                  onClick={() => handleDelete(attachment)}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg"
          >
            <X className="size-6" />
          </button>
          <img
            src={previewImage.url}
            alt={previewImage.originalName}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default TaskAttachments;
