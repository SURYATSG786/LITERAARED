import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useToast } from './Toast';

export default function GenerateReportModal({ isOpen, onClose, learners = [], priorities = {} }) {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const exportCSV = () => {
    setDownloading(true);
    try {
      const headers = [
        'Learner ID',
        'Name',
        'Email',
        'UI Language',
        'Learning Language',
        'Education Level',
        'Current Course',
        'Progress %',
        'Lessons Completed',
        'Assessment Score %',
        'League',
        'XP',
        'Streak Days',
        'Days Inactive',
        'Status',
        'Notes',
      ];

      const rows = learners.map((l) => [
        `"${l.id}"`,
        `"${l.name}"`,
        `"${l.email}"`,
        `"${l.uiLanguage}"`,
        `"${l.learningLanguage}"`,
        `"${l.educationLevel}"`,
        `"${l.currentCourse}"`,
        l.progressPercent,
        l.lessonsCompleted,
        l.assessmentScore != null ? l.assessmentScore : 'N/A',
        `"${l.league}"`,
        l.xp,
        l.streak,
        l.daysInactive,
        `"${l.riskLevel === 'high' ? 'Needs Help' : l.riskLevel === 'medium' ? 'Making Progress' : 'Doing Well'}"`,
        `"${(l.riskReasons || []).join('; ')}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `LiteraAI_Progress_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Learner progress report downloaded successfully', 'success');
      onClose();
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-[#032038]/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-white/80 space-y-6"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
        >
          <div className="flex items-center justify-between border-b border-black/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-700">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#032038]">Download Progress Report</h3>
                <p className="text-xs font-bold text-[#032038]/60">Export learner progress to a spreadsheet (CSV)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 text-[#032038]/60 hover:text-[#032038] transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-black/5 text-xs font-bold text-[#032038]">
            <div className="flex items-center justify-between">
              <span className="text-[#032038]/70">Total Learners Included:</span>
              <span className="font-black text-sm">{learners.length} learners</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#032038]/70">Learners Needing Help:</span>
              <span className="font-black text-red-600">{priorities.requiringAttentionCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#032038]/70">Ready for Next Level:</span>
              <span className="font-black text-emerald-600">{priorities.readyPromotionCount || 0}</span>
            </div>
          </div>

          <p className="text-xs font-semibold text-[#032038]/75 leading-relaxed">
            The spreadsheet includes learner progress, lesson completions, assessment scores, and streak days for easy tracking and sharing.
          </p>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-black/5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-black text-[#032038]/70 hover:bg-black/5 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={exportCSV}
              disabled={downloading}
              className="btn-primary text-xs py-2.5 px-6 font-black flex items-center gap-2 shadow-md hover:scale-105 transition disabled:opacity-50"
            >
              <Download size={14} />
              {downloading ? 'Preparing…' : 'Download Progress Report'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
