import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import AdminTopNav from '../components/admin/AdminTopNav';
import AdminDashboardOverview from '../components/admin/AdminDashboardOverview';
import LearnerTable from '../components/admin/LearnerTable';
import NeedsAttentionList from '../components/admin/NeedsAttentionList';
import ReportsCharts from '../components/admin/ReportsCharts';
import AdminSettings from '../components/admin/AdminSettings';
import AdminQuickFindModal from '../components/admin/AdminQuickFindModal';
import LearnerDetailDrawer from '../components/admin/LearnerDetailDrawer';
import api from '../api/client';

export default function AdminPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [needsAttentionCount, setNeedsAttentionCount] = useState(0);

  // Quick Find Modal State
  const [quickFindOpen, setQuickFindOpen] = useState(false);
  const [quickSelectedLearnerId, setQuickSelectedLearnerId] = useState(null);

  // Sync tab with URL
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Keep state synced if URL query parameter changes externally
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch initial at-risk count for the live badge
  useEffect(() => {
    api
      .getAdminNeedsAttention()
      .then((res) => setNeedsAttentionCount(res?.count || res?.learners?.length || 0))
      .catch(() => {});
  }, []);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickFindOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col pb-8 text-[#032038] relative">
      {/* Floating Glass Top Navigation Bar */}
      <AdminTopNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        needsAttentionCount={needsAttentionCount}
        onOpenQuickFind={() => setQuickFindOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-[1700px] px-3 sm:px-6 lg:px-8 pt-4 sm:pt-5">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <AdminDashboardOverview onNavigateTab={handleTabChange} />
            </motion.div>
          )}

          {activeTab === 'learners' && (
            <motion.div
              key="learners"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <LearnerTable />
            </motion.div>
          )}

          {activeTab === 'attention' && (
            <motion.div
              key="attention"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <NeedsAttentionList onBadgeUpdate={setNeedsAttentionCount} />
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <ReportsCharts />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <AdminSettings />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Quick Find Modal (⌘K) */}
      <AdminQuickFindModal
        isOpen={quickFindOpen}
        onClose={() => setQuickFindOpen(false)}
        onSelectLearner={(learnerId) => setQuickSelectedLearnerId(learnerId)}
      />

      {/* Learner Detail Drawer from Quick Find */}
      <LearnerDetailDrawer
        learnerId={quickSelectedLearnerId}
        isOpen={Boolean(quickSelectedLearnerId)}
        onClose={() => setQuickSelectedLearnerId(null)}
      />
    </div>
  );
}
