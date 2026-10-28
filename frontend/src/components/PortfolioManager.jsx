import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Code,
  Brain,
  Award,
  FolderGit2,
  Briefcase,
  Trophy,
  BookOpen,
  Globe2,
  Users,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import PortfolioFormModal from './PortfolioFormModal';

const CATEGORIES = [
  { id: 'personal_info', label: 'Personal Information', icon: User },
  { id: 'professional_summaries', label: 'Professional Summary', icon: FileText },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'technical_skills', label: 'Technical Skills', icon: Code },
  { id: 'soft_skills', label: 'Soft Skills', icon: Brain },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'experience', label: 'Experience & Internships', icon: Briefcase },
  { id: 'achievements', label: 'Achievements & Awards', icon: Trophy },
  { id: 'publications', label: 'Publications', icon: BookOpen },
  { id: 'languages', label: 'Languages', icon: Globe2 },
  { id: 'extracurricular', label: 'Extracurricular', icon: Users },
];

export default function PortfolioManager({
  portfolio,
  onRefresh,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}) {
  const [activeCategory, setActiveCategory] = useState('projects');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [notification, setNotification] = useState(null);

  const categoriesData = portfolio?.categories || {};
  const currentItems = categoriesData[activeCategory] || [];
  const currentCategoryMeta = CATEGORIES.find((c) => c.id === activeCategory);

  const showNotification = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSaveModal = async (formData) => {
    try {
      if (editingItem) {
        await onUpdateItem(activeCategory, editingItem.id, formData);
        showNotification('Record updated successfully.');
      } else {
        await onCreateItem(activeCategory, formData);
        showNotification('New record added successfully.');
      }
      onRefresh();
    } catch (err) {
      showNotification(err.message || 'Operation failed', true);
      throw err;
    }
  };

  const handleDelete = async (id) => {
    try {
      await onDeleteItem(activeCategory, id);
      setDeleteConfirmId(null);
      showNotification('Record deleted successfully.');
      onRefresh();
    } catch (err) {
      showNotification(err.message || 'Failed to delete record', true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Portfolio Records</h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
              SQLite Centralized
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your master academic, technical, and professional portfolio records.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add {currentCategoryMeta?.label}</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center space-x-2 text-xs font-medium ${
            notification.isError
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {notification.isError ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Category Tabs & Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Category Selector Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3 space-y-1">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Portfolio Categories
          </div>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = (categoriesData[cat.id] || []).length;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">{cat.label}</span>
                </div>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-blue-200/60 text-blue-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Records Display */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {currentCategoryMeta?.label}
              </h2>
              <span className="text-xs text-slate-500">
                {currentItems.length} record{currentItems.length === 1 ? '' : 's'} stored
              </span>
            </div>
            <button
              onClick={handleOpenAdd}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          </div>

          {/* Empty State */}
          {currentItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No records in {currentCategoryMeta?.label}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven't added any records for this category yet. Click below to add your first entry or use the AI Assistant to import unstructured notes.
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {item.title ||
                            item.skill_name ||
                            item.full_name ||
                            item.name ||
                            item.institution ||
                            item.company ||
                            item.organization ||
                            item.language_name ||
                            `Record #${item.id}`}
                        </span>
                        {item.is_sample === 1 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            Fictional Sample
                          </span>
                        )}
                        {item.proficiency && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                            {item.proficiency}
                          </span>
                        )}
                        {item.category && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        )}
                        {item.role && (
                          <span className="text-xs text-slate-500 font-medium">
                            • {item.role}
                          </span>
                        )}
                      </div>

                      {/* Subtitle / Details line */}
                      {(item.degree || item.company || item.issuing_organization || item.headline) && (
                        <p className="text-xs font-medium text-slate-600">
                          {item.degree ? `${item.degree} in ${item.field_of_study}` : ''}
                          {item.company ? `${item.company} • ${item.location || ''}` : ''}
                          {item.issuing_organization ? item.issuing_organization : ''}
                          {item.headline ? item.headline : ''}
                        </p>
                      )}

                      {/* Date tags */}
                      {(item.start_date || item.issue_date || item.date_awarded || item.publication_date) && (
                        <p className="text-[11px] text-slate-400">
                          {item.start_date ? `${item.start_date} – ${item.end_date || 'Present'}` : ''}
                          {item.issue_date ? `Issued: ${item.issue_date}` : ''}
                          {item.date_awarded ? `Awarded: ${item.date_awarded}` : ''}
                          {item.publication_date ? `Published: ${item.publication_date}` : ''}
                          {item.grade ? ` • GPA/Score: ${item.grade}` : ''}
                        </p>
                      )}
                    </div>

                    {/* Edit & Delete Controls */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit record"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Text / Description */}
                  {(item.description || item.content || item.summary || item.evidence_note || item.context) && (
                    <p className="text-xs text-slate-700 leading-relaxed pt-1 border-t border-slate-100">
                      {item.description || item.content || item.summary || item.evidence_note || item.context}
                    </p>
                  )}

                  {/* Tech stack badge list */}
                  {item.tech_stack && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {item.tech_stack.split(',').map((tech, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono"
                        >
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Delete Confirmation Alert Inline */}
                  {deleteConfirmId === item.id && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
                      <span className="font-semibold">Confirm delete this record permanently?</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-2.5 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Add / Edit */}
      <PortfolioFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        category={activeCategory}
        categoryMeta={currentCategoryMeta}
        item={editingItem}
        onSave={handleSaveModal}
      />
    </div>
  );
}
