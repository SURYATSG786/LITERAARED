import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  MessageSquare,
  Trophy,
  Heart,
  Trash2,
  Image as ImageIcon,
  Send,
  Filter,
  Sparkles,
  Flame,
  Gem,
  Award,
  X,
  Upload,
} from 'lucide-react';
import { RedBird } from '../components/RedBird';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

export default function Community() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'photo_feedback', 'comment', 'achievement'

  // Form states
  const [postType, setPostType] = useState('comment'); // 'photo_feedback', 'comment', 'achievement'
  const [content, setContent] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [achievementMeta, setAchievementMeta] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected image preview modal
  const [previewImage, setPreviewImage] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.getCommunityPosts();
      setPosts(res.posts || []);
    } catch (err) {
      console.error('Failed to load community posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file');
      return;
    }

    // Convert to compressed Base64 data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1000;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoDataUrl(dataUrl);
        setErrorMsg('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAchievement = (type) => {
    if (type === 'streak') {
      const streakDays = user?.streak?.current || 1;
      setAchievementMeta({
        title: t('streakMilestone', { days: streakDays }),
        badge: '🔥',
        streak: streakDays,
      });
      if (!content) {
        setContent(t('streakMilestone', { days: streakDays }));
      }
    } else if (type === 'gems') {
      const gems = user?.gems || 10;
      setAchievementMeta({
        title: t('gemsEarned', { gems }),
        badge: '💎',
        gems,
      });
      if (!content) {
        setContent(t('gemsEarned', { gems }));
      }
    } else if (type === 'league') {
      const leagueName = t(user?.league ? `${user.league}League` : 'bronzeLeague');
      setAchievementMeta({
        title: t('leaguePromoted', { league: leagueName }),
        badge: '🏆',
        league: leagueName,
      });
      if (!content) {
        setContent(t('leaguePromoted', { league: leagueName }));
      }
    } else if (type === 'checkpoint') {
      setAchievementMeta({
        title: t('passedCheckpoint'),
        badge: '📜',
      });
      if (!content) {
        setContent(t('passedCheckpoint'));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg('Please write a message or comment.');
      return;
    }
    if (postType === 'photo_feedback' && !photoDataUrl) {
      setErrorMsg('Please upload a photo for photo feedback.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const body = {
        type: postType,
        content: content.trim(),
        imageUrl: postType === 'photo_feedback' ? photoDataUrl : null,
        achievementMeta: postType === 'achievement' ? achievementMeta : null,
        language: i18n.language || 'en',
      };

      const res = await api.createCommunityPost(body);
      if (res.post) {
        setPosts((prev) => [res.post, ...prev]);
        setContent('');
        setPhotoDataUrl('');
        setAchievementMeta(null);
      }
    } catch (err) {
      setErrorMsg(err.message || t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.likeCommunityPost(postId);
      if (res.likes !== undefined) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likes: res.likes } : p))
        );
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.deleteCommunityPost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (filter === 'all') return true;
    return p.type === filter;
  });

  return (
    <div className="w-full space-y-6 pb-6">
      <div className="mx-auto w-full space-y-6">
        {/* Top Mascot Guidance Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 rounded-3xl glass-card p-5 sm:p-6 shadow-xl border-2 border-[#032038]/20 bg-gradient-to-r from-blue-500/15 via-amber-500/15 to-indigo-500/15">
          <RedBird size={64} className="shrink-0" />
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-black">
              {t('communityTitle')}
            </h1>
            <p className="text-sm sm:text-base font-bold text-black">
              {t('communitySubtitle')}
            </p>
          </div>
        </div>

        {/* Post Creation Box */}
        <motion.div
          className="rounded-3xl glass-card p-6 sm:p-8 shadow-xl border-2 border-[#032038]/20 bg-white/75 backdrop-blur-md"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between border-b-2 border-[#032038]/12 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-500" size={22} />
              <h2 className="text-xl font-black text-[#032038]">{t('createPost')}</h2>
            </div>
            <span className="text-xs font-black px-3.5 py-1 rounded-full bg-[#055f9e]/15 text-[#055f9e] uppercase border border-[#055f9e]/30">
              {i18n.language?.toUpperCase() || 'EN'}
            </span>
          </div>

          {/* Post Type Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setPostType('comment')}
              className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs sm:text-sm font-black transition cursor-pointer ${
                postType === 'comment'
                  ? 'btn-primary text-[#3b2800] shadow-md scale-101 !border-b-[4px]'
                  : 'bg-white/70 text-[#032038]/70 border-2 border-[#032038]/15 hover:bg-white hover:text-[#032038]'
              }`}
            >
              <MessageSquare size={16} />
              <span>{t('postComment')}</span>
            </button>

            <button
              type="button"
              onClick={() => setPostType('photo_feedback')}
              className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs sm:text-sm font-black transition cursor-pointer ${
                postType === 'photo_feedback'
                  ? 'btn-primary text-[#3b2800] shadow-md scale-101 !border-b-[4px]'
                  : 'bg-white/70 text-[#032038]/70 border-2 border-[#032038]/15 hover:bg-white hover:text-[#032038]'
              }`}
            >
              <Camera size={16} />
              <span>{t('postPhotoFeedback')}</span>
            </button>

            <button
              type="button"
              onClick={() => setPostType('achievement')}
              className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs sm:text-sm font-black transition cursor-pointer ${
                postType === 'achievement'
                  ? 'btn-primary text-[#3b2800] shadow-md scale-101 !border-b-[4px]'
                  : 'bg-white/70 text-[#032038]/70 border-2 border-[#032038]/15 hover:bg-white hover:text-[#032038]'
              }`}
            >
              <Trophy size={16} />
              <span>{t('shareAchievement')}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contextual Helpers based on selected Post Type */}
            {postType === 'photo_feedback' && (
              <div className="space-y-3 rounded-2xl bg-purple-50/80 p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-purple-900 flex items-center gap-2">
                    <ImageIcon size={18} />
                    {t('photoUploadLabel')}
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Upload size={14} />
                    {photoDataUrl ? t('changePhoto') : t('uploadPhoto')}
                  </button>
                </div>

                {/* Photo Preview */}
                {photoDataUrl ? (
                  <div className="relative inline-block mt-2">
                    <img
                      src={photoDataUrl}
                      alt="Feedback preview"
                      className="max-h-48 rounded-xl object-cover border-2 border-purple-400 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl('')}
                      className="absolute -top-2 -right-2 rounded-full bg-red-600 text-white p-1 shadow-md hover:bg-red-700 transition"
                      title={t('removePhoto')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-purple-700">
                    Upload an image file (e.g. photo of handwritten practice or certificate) to share feedback.
                  </p>
                )}
              </div>
            )}

            {postType === 'achievement' && (
              <div className="space-y-3 rounded-2xl bg-amber-50/90 p-4 border border-amber-200">
                <span className="text-xs sm:text-sm font-black text-amber-900 block">
                  {t('presetAchievementLabel')}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPresetAchievement('streak')}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 text-xs font-black shadow-sm hover:opacity-90 transition cursor-pointer"
                  >
                    <Flame size={14} />
                    {user?.streak?.current || 1} {t('days')} {t('streak')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPresetAchievement('league')}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-3 py-1.5 text-xs font-black shadow-sm hover:opacity-90 transition cursor-pointer"
                  >
                    <Trophy size={14} />
                    {t(user?.league ? `${user.league}League` : 'bronzeLeague')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPresetAchievement('gems')}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 text-xs font-black shadow-sm hover:opacity-90 transition cursor-pointer"
                  >
                    <Gem size={14} />
                    {user?.gems || 0} {t('gems')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPresetAchievement('checkpoint')}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1.5 text-xs font-black shadow-sm hover:opacity-90 transition cursor-pointer"
                  >
                    <Award size={14} />
                    {t('passedCheckpoint')}
                  </button>
                </div>

                {achievementMeta && (
                  <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-amber-300 mt-2">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-2">
                      <span className="text-lg">{achievementMeta.badge}</span>
                      {achievementMeta.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAchievementMeta(null)}
                      className="text-amber-700 hover:text-amber-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Textarea for message */}
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  postType === 'achievement'
                    ? t('achievementPlaceholder')
                    : t('postContentPlaceholder')
                }
                rows={3}
                className="w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm font-extrabold text-[#06304f] placeholder:text-[#06304f]/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner"
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {errorMsg}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center gap-2 px-8 py-3 text-sm font-black shadow-lg transition cursor-pointer disabled:opacity-50 !border-b-[4px]"
              >
                <Send size={16} />
                <span>{submitting ? t('posting') : t('submitPost')}</span>
              </button>
            </div>
          </form>
        </motion.div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-[#06304f]/60" />
            <span className="text-xs font-extrabold text-[#06304f]/70 uppercase tracking-wider">
              Filter Feed:
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: t('filterAll') },
              { id: 'photo_feedback', label: t('filterPhoto') },
              { id: 'comment', label: t('filterComment') },
              { id: 'achievement', label: t('filterAchievement') },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition cursor-pointer ${
                  filter === tab.id
                    ? 'btn-primary text-[#3b2800] shadow-md !border-b-[3px]'
                    : 'bg-white/60 text-[#06304f]/70 border-2 border-[#032038]/15 hover:bg-white hover:text-[#06304f]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Community Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-2 text-sm font-bold text-[#06304f]/60">{t('loading')}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl glass-card p-10 text-center space-y-2">
            <p className="text-base font-black text-[#06304f]">{t('noPostsYet')}</p>
            <p className="text-xs font-bold text-[#06304f]/60">{t('beFirstToPost')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const isOwner = post.user_id === user?.id;

              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-3xl glass-card p-5 shadow-lg border border-white/70 bg-white/80 hover:bg-white/95 transition space-y-3"
                >
                  {/* Post Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base shadow-md">
                        {post.user_name ? post.user_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-[#06304f] text-sm">
                            {post.user_name}
                          </h3>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 uppercase">
                            {post.language || 'en'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-[#06304f]/50">
                          {new Date(post.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Type Tag */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                          post.type === 'photo_feedback'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : post.type === 'achievement'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {post.type === 'photo_feedback' && <Camera size={13} />}
                        {post.type === 'achievement' && <Trophy size={13} />}
                        {post.type === 'comment' && <MessageSquare size={13} />}
                        <span>
                          {post.type === 'photo_feedback'
                            ? t('filterPhoto')
                            : post.type === 'achievement'
                            ? t('filterAchievement')
                            : t('filterComment')}
                        </span>
                      </span>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title={t('deletePost')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Achievement Banner if Achievement type */}
                  {post.achievement_meta && (
                    <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-yellow-500/15 p-3 border border-amber-300/60 flex items-center gap-3">
                      <span className="text-2xl">{post.achievement_meta.badge || '🏆'}</span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-amber-900">
                          {post.achievement_meta.title}
                        </h4>
                      </div>
                    </div>
                  )}

                  {/* Content Text */}
                  <p className="text-sm font-extrabold text-[#06304f]/90 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Photo Display if Photo Feedback */}
                  {post.image_url && (
                    <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/5">
                      <img
                        src={post.image_url}
                        alt="Photo feedback"
                        onClick={() => setPreviewImage(post.image_url)}
                        className="max-h-80 w-full object-cover cursor-pointer hover:scale-[1.01] transition duration-200"
                      />
                    </div>
                  )}

                  {/* Footer Actions (Like button) */}
                  <div className="flex items-center justify-between border-t border-black/5 pt-2.5">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black text-rose-600 hover:bg-rose-50 border border-rose-200/50 transition cursor-pointer"
                    >
                      <Heart size={15} className="fill-rose-500 text-rose-500" />
                      <span>{post.likes || 0}</span>
                      <span className="text-[#06304f]/60 font-bold">{t('likes')}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full image preview modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={previewImage}
                alt="Full preview"
                className="max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute -top-3 -right-3 rounded-full bg-white text-black p-2 shadow-lg hover:bg-gray-200 transition"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
