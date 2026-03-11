import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
    Store, Search, Star, Download, Filter, Plus, X, ChevronRight,
    ChevronLeft, Loader2, Package, Eye, MessageSquare, Send, Globe, Lock, Tag
} from 'lucide-react'
import toast from 'react-hot-toast'
import marketplaceService from '../services/marketplaceService'

const CATEGORIES = [
    'All',
    'Project Management',
    'Software Dev',
    'Marketing',
    'Design',
    'HR',
    'Finance',
    'Operations',
    'Education',
]

const CATEGORY_COLORS = {
    'Project Management': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Software Dev': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    'Marketing': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Design': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'HR': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Finance': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'Operations': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Education': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

// ─── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({ rating, size = 14, interactive = false, onChange }) {
    const [hover, setHover] = useState(0)
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => interactive && onChange?.(star)}
                    onMouseEnter={() => interactive && setHover(star)}
                    onMouseLeave={() => interactive && setHover(0)}
                    className={interactive ? 'cursor-pointer' : 'cursor-default'}
                >
                    <Star
                        size={size}
                        className={`transition-colors ${
                            (interactive ? hover || rating : rating) >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-zinc-300 dark:text-zinc-600'
                        }`}
                    />
                </button>
            ))}
        </div>
    )
}

// ─── Template Card ──────────────────────────────────────────────────────────────
function TemplateCard({ template, onClick }) {
    const categoryClass = CATEGORY_COLORS[template.category] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'

    return (
        <div
            onClick={() => onClick(template)}
            className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md dark:hover:shadow-zinc-900/50 transition-all duration-200"
        >
            {/* Icon / Thumbnail */}
            <div className="flex items-start justify-between mb-4">
                <div className="size-11 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                    <Package size={20} className="text-zinc-500 dark:text-zinc-400" />
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryClass}`}>
                    {template.category}
                </span>
            </div>

            {/* Name & Description */}
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-1.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors line-clamp-1">
                {template.name}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2 leading-relaxed">
                {template.description}
            </p>

            {/* Author */}
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
                by <span className="text-zinc-600 dark:text-zinc-300 font-medium">{template.author?.name || 'Unknown'}</span>
            </p>

            {/* Footer: Rating, Installs, Button */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <StarRating rating={template.averageRating || 0} size={12} />
                        <span className="text-xs text-zinc-400 ml-0.5">
                            ({template.reviewCount || 0})
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Download size={11} />
                        <span>{template.installCount || 0}</span>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onClick(template)
                    }}
                    className="text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1"
                >
                    View <ChevronRight size={12} />
                </button>
            </div>
        </div>
    )
}

// ─── Featured Template Card ─────────────────────────────────────────────────────
function FeaturedCard({ template, onClick }) {
    const categoryClass = CATEGORY_COLORS[template.category] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'

    return (
        <div
            onClick={() => onClick(template)}
            className="min-w-[280px] max-w-[320px] flex-shrink-0 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 cursor-pointer hover:shadow-lg dark:hover:shadow-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 group"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
                    <Package size={18} className="text-white dark:text-zinc-900" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{template.name}</h4>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${categoryClass}`}>
                        {template.category}
                    </span>
                </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 leading-relaxed">{template.description}</p>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <StarRating rating={template.averageRating || 0} size={11} />
                    <span className="text-[10px] text-zinc-400 ml-1">{template.averageRating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Download size={10} />
                    <span>{template.installCount || 0}</span>
                </div>
            </div>
        </div>
    )
}

// ─── Publish Template Modal ─────────────────────────────────────────────────────
function PublishModal({ isOpen, onClose }) {
    const [form, setForm] = useState({
        name: '',
        description: '',
        category: 'Project Management',
        type: 'project',
        templateData: '',
        tags: '',
        isPublic: true,
    })
    const [publishing, setPublishing] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.description.trim()) {
            toast.error('Name and description are required')
            return
        }

        let parsedData = {}
        if (form.templateData.trim()) {
            try {
                parsedData = JSON.parse(form.templateData)
            } catch {
                toast.error('Template data must be valid JSON')
                return
            }
        }

        setPublishing(true)
        try {
            await marketplaceService.publishTemplate({
                name: form.name.trim(),
                description: form.description.trim(),
                category: form.category,
                type: form.type,
                template_data: parsedData,
                tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
                is_public: form.isPublic,
            })
            toast.success('Template published successfully!')
            onClose()
            setForm({ name: '', description: '', category: 'Project Management', type: 'project', templateData: '', tags: '', isPublic: true })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to publish template')
        } finally {
            setPublishing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Publish Template</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X size={18} className="text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Template Name</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="My awesome template"
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe what this template provides..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all resize-none"
                        />
                    </div>

                    {/* Category & Type */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Category</label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all"
                            >
                                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all"
                            >
                                <option value="project">Project</option>
                                <option value="board">Board</option>
                                <option value="workflow">Workflow</option>
                                <option value="task_list">Task List</option>
                            </select>
                        </div>
                    </div>

                    {/* Template Data */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Template Data (JSON)</label>
                        <textarea
                            value={form.templateData}
                            onChange={(e) => setForm({ ...form, templateData: e.target.value })}
                            placeholder='{"columns": ["To Do", "In Progress", "Done"], "tasks": []}'
                            rows={4}
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all font-mono text-xs resize-none"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Tags (comma separated)</label>
                        <input
                            value={form.tags}
                            onChange={(e) => setForm({ ...form, tags: e.target.value })}
                            placeholder="agile, scrum, kanban"
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all"
                        />
                    </div>

                    {/* Public toggle */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                            {form.isPublic ? <Globe size={16} className="text-zinc-500" /> : <Lock size={16} className="text-zinc-500" />}
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                {form.isPublic ? 'Public — visible to everyone' : 'Private — only you can see this'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
                            className={`relative w-10 h-5.5 rounded-full transition-colors ${form.isPublic ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 size-4.5 rounded-full transition-transform ${form.isPublic ? 'translate-x-[18px] bg-white dark:bg-zinc-900' : 'bg-white dark:bg-zinc-300'}`} />
                        </button>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={publishing}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                    >
                        {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                        {publishing ? 'Publishing...' : 'Publish Template'}
                    </button>
                </form>
            </div>
        </div>
    )
}

// ─── Template Detail Modal ──────────────────────────────────────────────────────
function DetailModal({ template, isOpen, onClose }) {
    const [fullTemplate, setFullTemplate] = useState(null)
    const [loading, setLoading] = useState(false)
    const [installing, setInstalling] = useState(false)
    const [reviewText, setReviewText] = useState('')
    const [reviewRating, setReviewRating] = useState(0)
    const [submittingReview, setSubmittingReview] = useState(false)
    const [showTemplateData, setShowTemplateData] = useState(false)

    const workspaces = useSelector((state) => state?.workspace?.workspaces || [])
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace)
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(currentWorkspace?.id || '')

    useEffect(() => {
        if (isOpen && template?.id) {
            setLoading(true)
            marketplaceService.getTemplateById(template.id)
                .then((data) => setFullTemplate(data))
                .catch(() => setFullTemplate(template))
                .finally(() => setLoading(false))
        }
    }, [isOpen, template?.id])

    useEffect(() => {
        if (currentWorkspace?.id) {
            setSelectedWorkspaceId(currentWorkspace.id)
        }
    }, [currentWorkspace?.id])

    if (!isOpen || !template) return null

    const t = fullTemplate || template

    const handleInstall = async () => {
        if (!selectedWorkspaceId) {
            toast.error('Please select a workspace')
            return
        }
        setInstalling(true)
        try {
            await marketplaceService.installTemplate(t.id, selectedWorkspaceId)
            toast.success('Template installed successfully!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to install template')
        } finally {
            setInstalling(false)
        }
    }

    const handleReviewSubmit = async (e) => {
        e.preventDefault()
        if (reviewRating === 0) {
            toast.error('Please select a rating')
            return
        }
        setSubmittingReview(true)
        try {
            await marketplaceService.reviewTemplate(t.id, {
                rating: reviewRating,
                comment: reviewText.trim(),
            })
            toast.success('Review submitted!')
            setReviewText('')
            setReviewRating(0)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review')
        } finally {
            setSubmittingReview(false)
        }
    }

    const categoryClass = CATEGORY_COLORS[t.category] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            <Package size={18} className="text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">{t.name}</h2>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${categoryClass}`}>{t.category}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0">
                        <X size={18} className="text-zinc-500" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-zinc-400" />
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Meta info */}
                        <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                            <span>by <span className="text-zinc-700 dark:text-zinc-300 font-medium">{t.author?.name || 'Unknown'}</span></span>
                            <div className="flex items-center gap-1">
                                <StarRating rating={t.averageRating || 0} size={13} />
                                <span className="ml-1">{t.averageRating?.toFixed(1) || '0.0'} ({t.reviewCount || 0})</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Download size={13} />
                                <span>{t.installCount || 0} installs</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">Description</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                {t.description}
                            </p>
                        </div>

                        {/* Tags */}
                        {t.tags && t.tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag size={13} className="text-zinc-400" />
                                {t.tags.map((tag, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Template Data Preview */}
                        {t.template_data && (
                            <div>
                                <button
                                    onClick={() => setShowTemplateData(!showTemplateData)}
                                    className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                >
                                    <Eye size={14} />
                                    {showTemplateData ? 'Hide' : 'Preview'} Template Structure
                                    <ChevronRight size={14} className={`transition-transform ${showTemplateData ? 'rotate-90' : ''}`} />
                                </button>
                                {showTemplateData && (
                                    <pre className="mt-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto font-mono leading-relaxed">
                                        {JSON.stringify(t.template_data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* Install Section */}
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700/50">
                            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Install to Workspace</h3>
                            <div className="flex items-center gap-3">
                                <select
                                    value={selectedWorkspaceId}
                                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                                    className="flex-1 px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all"
                                >
                                    <option value="">Select workspace...</option>
                                    {workspaces.map((ws) => (
                                        <option key={ws.id} value={ws.id}>{ws.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleInstall}
                                    disabled={installing}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                                >
                                    {installing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    {installing ? 'Installing...' : 'Install'}
                                </button>
                            </div>
                        </div>

                        {/* Reviews */}
                        {t.reviews && t.reviews.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                                    <MessageSquare size={14} />
                                    Reviews ({t.reviews.length})
                                </h3>
                                <div className="space-y-3">
                                    {t.reviews.map((review, i) => (
                                        <div key={i} className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{review.user?.name || 'Anonymous'}</span>
                                                <StarRating rating={review.rating} size={11} />
                                            </div>
                                            {review.comment && (
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{review.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Write Review */}
                        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
                            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Leave a Review</h3>
                            <form onSubmit={handleReviewSubmit} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Rating:</span>
                                    <StarRating rating={reviewRating} size={18} interactive onChange={setReviewRating} />
                                </div>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="Share your experience with this template..."
                                    rows={2}
                                    className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all resize-none"
                                />
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
                                >
                                    {submittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
                                    Submit Review
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Main Marketplace Page ──────────────────────────────────────────────────────
export default function Marketplace() {
    const [templates, setTemplates] = useState([])
    const [featuredTemplates, setFeaturedTemplates] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [showPublishModal, setShowPublishModal] = useState(false)

    const PAGE_SIZE = 12

    const fetchTemplates = useCallback(async (reset = false) => {
        const currentPage = reset ? 1 : page
        if (reset) setLoading(true)
        else setLoadingMore(true)

        try {
            const params = {
                page: currentPage,
                limit: PAGE_SIZE,
            }
            if (searchTerm.trim()) params.search = searchTerm.trim()
            if (activeCategory !== 'All') params.category = activeCategory

            const data = await marketplaceService.searchTemplates(params)
            const items = data.templates || data.data || data || []

            if (reset) {
                setTemplates(items)
                setPage(1)
            } else {
                setTemplates((prev) => [...prev, ...items])
            }
            setHasMore(items.length === PAGE_SIZE)
        } catch (err) {
            console.error('Failed to fetch templates:', err)
            // Provide graceful fallback with empty state
            if (reset) setTemplates([])
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [page, searchTerm, activeCategory])

    const fetchFeatured = useCallback(async () => {
        try {
            const data = await marketplaceService.getFeaturedTemplates()
            setFeaturedTemplates(data.templates || data.data || data || [])
        } catch (err) {
            console.error('Failed to fetch featured templates:', err)
        }
    }, [])

    // Initial load
    useEffect(() => {
        fetchFeatured()
    }, [])

    // Fetch templates on filter change
    useEffect(() => {
        fetchTemplates(true)
    }, [searchTerm, activeCategory])

    const handleLoadMore = () => {
        setPage((prev) => prev + 1)
    }

    // Load more when page changes (but not on initial)
    useEffect(() => {
        if (page > 1) fetchTemplates(false)
    }, [page])

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <Store size={22} className="text-zinc-900 dark:text-white" />
                        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-white">
                            Template Marketplace
                        </h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Discover and install ready-made templates to accelerate your projects
                    </p>
                </div>
                <button
                    onClick={() => setShowPublishModal(true)}
                    className="flex items-center px-5 py-2 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg shadow-sm hover:shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200"
                >
                    <Plus className="size-4 mr-2" /> Publish Template
                </button>
            </div>

            {/* ── Search ──────────────────────────────────────────────────── */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 size-4" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200"
                />
            </div>

            {/* ── Category Pills ──────────────────────────────────────────── */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <Filter size={14} className="text-zinc-400 flex-shrink-0" />
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex-shrink-0 px-3.5 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${
                            activeCategory === cat
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* ── Featured Section ────────────────────────────────────────── */}
            {featuredTemplates.length > 0 && activeCategory === 'All' && !searchTerm && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Star size={16} className="fill-amber-400 text-amber-400" />
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Featured</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {featuredTemplates.map((tmpl) => (
                            <FeaturedCard
                                key={tmpl.id}
                                template={tmpl}
                                onClick={setSelectedTemplate}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Template Grid ───────────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-zinc-400" />
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-20">
                    <div className="size-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                        <Store size={28} className="text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1.5">No templates found</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        {searchTerm || activeCategory !== 'All'
                            ? 'Try adjusting your search or filters'
                            : 'Be the first to publish a template!'}
                    </p>
                    {(searchTerm || activeCategory !== 'All') && (
                        <button
                            onClick={() => { setSearchTerm(''); setActiveCategory('All') }}
                            className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {templates.map((tmpl) => (
                            <TemplateCard
                                key={tmpl.id}
                                template={tmpl}
                                onClick={setSelectedTemplate}
                            />
                        ))}
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
                            >
                                {loadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ── Modals ──────────────────────────────────────────────────── */}
            <DetailModal
                template={selectedTemplate}
                isOpen={!!selectedTemplate}
                onClose={() => setSelectedTemplate(null)}
            />

            <PublishModal
                isOpen={showPublishModal}
                onClose={() => setShowPublishModal(false)}
            />
        </div>
    )
}
