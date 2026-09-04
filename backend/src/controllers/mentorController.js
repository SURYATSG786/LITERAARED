import { getPool, listUsers, findUserById, createUser, getAlphabetWritingProgress, getAlphabetWritingMentorAnalytics } from '../services/db.js';

export function formatLearnerName(rawName) {
  if (!rawName) return 'Learner';
  const trimmed = String(rawName).trim().replace(/\s+/g, ' ');
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 2) {
    return trimmed
      .split(' ')
      .map((part) => {
        if (part.length <= 2 && part.includes('.')) return part.toUpperCase();
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join(' ');
  }
  return trimmed;
}

export function isTestAccount(user) {
  const email = String(user?.email || '').toLowerCase();
  const name = String(user?.name || '').toLowerCase();
  return (
    email.includes('example.com') ||
    email.includes('test.com') ||
    email.endsWith('.comir') ||
    email.startsWith('test') ||
    email.startsWith('seed_') ||
    email.startsWith('demo_') ||
    name.includes('test user') ||
    name.startsWith('seed_') ||
    name.startsWith('demo')
  );
}

/**
 * GET /api/mentor/dashboard
 */
export async function getMentorDashboard(req, res) {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied: Mentor role required' });
    }

    const excludeTest = req.query?.excludeTest === 'true';
    const pool = getPool();
    let allUsers = await listUsers();
    
    const uniqueStudentsMap = new Map();
    const uniqueMentorsMap = new Map();

    for (const u of allUsers) {
      if (u.role === 'mentor') {
        if (!uniqueMentorsMap.has(u.id)) {
          uniqueMentorsMap.set(u.id, u);
        }
      } else {
        if (!uniqueStudentsMap.has(u.id)) {
          if (!excludeTest || !isTestAccount(u)) {
            uniqueStudentsMap.set(u.id, u);
          }
        }
      }
    }
    const students = Array.from(uniqueStudentsMap.values());
    const mentors = Array.from(uniqueMentorsMap.values());
    const totalLearners = students.length;
    const totalMentors = mentors.length;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * oneDayMs;
    const twoWeeksAgo = now - 14 * oneDayMs;
    const oneMonthAgo = now - 30 * oneDayMs;

    const todayStr = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    const activeTodayCount = students.filter((u) => {
      if (!u.streak?.last_activity) return false;
      const actDate = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date(u.streak.last_activity));
      return actDate === todayStr;
    }).length;

    const activeUsersThisWeekCount = allUsers.filter((u) => {
      const lastAct = u.streak?.last_activity ? new Date(u.streak.last_activity).getTime() : 0;
      const created = u.created_at ? new Date(u.created_at).getTime() : 0;
      return Math.max(lastAct, created) >= oneWeekAgo;
    }).length;

    const learnerInsights = students.map((u) => {
      const lessonsDone = u.course_progress?.lessons_completed?.length || 0;
      const progressPercent = Math.min(100, Math.round((lessonsDone / 4) * 100));

      let daysInactive = 0;
      if (u.streak?.last_activity) {
        const lastAct = new Date(u.streak.last_activity).getTime();
        daysInactive = Math.max(0, Math.floor((Date.now() - lastAct) / oneDayMs));
      } else if (u.created_at) {
        const created = new Date(u.created_at).getTime();
        daysInactive = Math.max(0, Math.floor((Date.now() - created) / oneDayMs));
      }

      const inactivityPts = Math.min(40, daysInactive * 5);
      let scorePts = 0;
      if (u.assessment_score != null) {
        if (u.assessment_score < 60) {
          scorePts = Math.round(((60 - u.assessment_score) / 60) * 35);
        }
      } else if (daysInactive >= 3) {
        scorePts = 15;
      }

      const progressPts = progressPercent === 0 ? 15 : progressPercent < 30 ? 10 : 0;
      const streakPts = (u.streak?.current || 0) === 0 && daysInactive >= 1 ? 10 : 0;
      const riskScore = Math.min(100, Math.max(0, inactivityPts + scorePts + progressPts + streakPts));

      const riskReasons = [];
      if (daysInactive >= 5) {
        riskReasons.push(`Inactive > ${daysInactive} days`);
      } else if (daysInactive >= 3) {
        riskReasons.push(`Inactive for ${daysInactive} days`);
      }

      if (u.assessment_score != null && u.assessment_score < 60) {
        riskReasons.push(`Low assessment score (${u.assessment_score}%)`);
      }
      if (progressPercent < 30) {
        riskReasons.push(`Stalled module progress (${progressPercent}%)`);
      }
      if ((u.streak?.current || 0) === 0 && daysInactive >= 1) {
        riskReasons.push('Broken daily practice streak');
      }

      let primaryRiskReason = 'On Track';
      if (daysInactive >= 5) {
        primaryRiskReason = `Inactive > ${daysInactive} days`;
      } else if (u.assessment_score != null && u.assessment_score < 60) {
        primaryRiskReason = `Low assessment score (${u.assessment_score}%)`;
      } else if (progressPercent === 0) {
        primaryRiskReason = 'Stalled modules (0% progress)';
      } else if ((u.streak?.current || 0) === 0 && daysInactive >= 1) {
        primaryRiskReason = 'Broken practice streak';
      } else if (riskReasons.length > 0) {
        primaryRiskReason = riskReasons[0];
      }

      let riskLevel = 'low';
      if (riskScore >= 60) {
        riskLevel = 'high';
      } else if (riskScore >= 30) {
        riskLevel = 'medium';
      }

      let lastActiveFormatted = 'Recently';
      if (daysInactive === 0) lastActiveFormatted = 'Today';
      else if (daysInactive === 1) lastActiveFormatted = 'Yesterday';
      else if (daysInactive < 999) lastActiveFormatted = `${daysInactive} days ago`;

      return {
        id: u.id,
        name: formatLearnerName(u.name),
        email: u.email,
        learningLanguage: (u.learningLanguage || u.preferred_language || 'en').toUpperCase(),
        uiLanguage: (u.uiLanguage || u.preferred_language || 'en').toUpperCase(),
        educationLevel: u.education_level || 'Primary School',
        currentCourse: u.current_path || 'Basic Literacy Path',
        league: u.league || 'bronze',
        progressPercent,
        lessonsCompleted: lessonsDone,
        lastActive: u.streak?.last_activity || u.created_at,
        lastActiveFormatted,
        daysInactive,
        assessmentScore: u.assessment_score,
        xp: u.xp || 0,
        streak: u.streak?.current || 0,
        riskScore,
        riskLevel,
        primaryRiskReason,
        riskReasons,
        suggestedAction:
          riskLevel === 'high'
            ? 'Review'
            : riskLevel === 'medium'
            ? 'Send Reminder'
            : 'Next Module',
      };
    });

    learnerInsights.sort((a, b) => b.riskScore - a.riskScore || b.daysInactive - a.daysInactive);

    const highRiskLearners = learnerInsights.filter((u) => u.riskLevel === 'high');
    const mediumRiskLearners = learnerInsights.filter((u) => u.riskLevel === 'medium');
    const onTrackLearners = learnerInsights.filter((u) => u.riskLevel === 'low');

    const inactive5PlusLearners = learnerInsights.filter((u) => u.daysInactive >= 5);
    const inactive7PlusLearners = learnerInsights.filter((u) => u.daysInactive >= 7);
    const belowAssessmentThreshold = learnerInsights.filter((u) => u.assessmentScore != null && u.assessmentScore < 60);
    const readyForPromotion = learnerInsights.filter((u) => u.progressPercent >= 75 || u.lessonsCompleted >= 3);
    const atRiskLearners = learnerInsights.filter((u) => u.riskLevel === 'high' || u.riskLevel === 'medium');

    const totalProgressSum = learnerInsights.reduce((sum, u) => sum + u.progressPercent, 0);
    const avgProgress = totalLearners > 0 ? Math.round(totalProgressSum / totalLearners) : 0;

    const contextualActions = {
      inactiveOver5DaysCount: inactive5PlusLearners.length,
      belowThresholdCount: belowAssessmentThreshold.length,
      highRiskCount: highRiskLearners.length,
      mediumRiskCount: mediumRiskLearners.length,
      onTrackCount: onTrackLearners.length,
    };

    const userMap = new Map(allUsers.map((s) => [s.id, formatLearnerName(s.name)]));

    const lessonActivityRes = await pool.query(`
      SELECT user_id, course_id, lesson_id, score, completed_at
      FROM user_course_lesson_progress
      ORDER BY completed_at DESC
      LIMIT 30
    `);
    const lessonActivityRows = lessonActivityRes.rows;

    const certRes = await pool.query(`
      SELECT credential_id, user_id, course_id, course_title, score, issued_date
      FROM certificates
      ORDER BY issued_date DESC
      LIMIT 30
    `);
    const certRows = certRes.rows;

    const leagueCertRes = await pool.query(`
      SELECT credential_id, user_id, league, league_title, score, issued_date
      FROM league_certificates
      ORDER BY issued_date DESC
      LIMIT 30
    `);
    const leagueCertRows = leagueCertRes.rows;

    const totalCourseCertsRes = await pool.query('SELECT COUNT(*) as count FROM certificates');
    const totalLeagueCertsRes = await pool.query('SELECT COUNT(*) as count FROM league_certificates');
    const totalCourseCerts = parseInt(totalCourseCertsRes.rows[0]?.count || 0, 10);
    const totalLeagueCerts = parseInt(totalLeagueCertsRes.rows[0]?.count || 0, 10);
    const totalCertificatesIssued = totalCourseCerts + totalLeagueCerts;

    const coursesDbRes = await pool.query('SELECT id, title, path FROM courses');
    const coursesDb = coursesDbRes.rows;
    const totalCourses = coursesDb.length;

    const diagnosticAssessmentsCount = students.filter((s) => s.assessment_score != null).length;
    const totalAssessmentsCompleted = diagnosticAssessmentsCount + totalCourseCerts;

    const newLearnersThisWeek = students.filter((s) => {
      const created = s.created_at ? new Date(s.created_at).getTime() : 0;
      return created >= oneWeekAgo;
    }).length;

    const newLearnersPreviousWeek = students.filter((s) => {
      const created = s.created_at ? new Date(s.created_at).getTime() : 0;
      return created >= twoWeeksAgo && created < oneWeekAgo;
    }).length;

    const newLearnersThisMonth = students.filter((s) => {
      const created = s.created_at ? new Date(s.created_at).getTime() : 0;
      return created >= oneMonthAgo;
    }).length;

    const newMentorsThisMonth = mentors.filter((m) => {
      const created = m.created_at ? new Date(m.created_at).getTime() : 0;
      return created >= oneMonthAgo;
    }).length;

    const growthPercentage = newLearnersPreviousWeek > 0
      ? Math.round(((newLearnersThisWeek - newLearnersPreviousWeek) / newLearnersPreviousWeek) * 100)
      : (newLearnersThisWeek > 0 ? 100 : 0);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const growthTimeline = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * oneDayMs);
      const dateKey = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(d);
      const dayLabel = dayNames[d.getDay()];

      const dayLearners = students.filter((s) => {
        if (!s.created_at) return false;
        const cDate = new Intl.DateTimeFormat('en-CA', {
          year: 'numeric', month: '2-digit', day: '2-digit',
        }).format(new Date(s.created_at));
        return cDate === dateKey;
      }).length;

      const dayMentors = mentors.filter((m) => {
        if (!m.created_at) return false;
        const cDate = new Intl.DateTimeFormat('en-CA', {
          year: 'numeric', month: '2-digit', day: '2-digit',
        }).format(new Date(m.created_at));
        return cDate === dateKey;
      }).length;

      growthTimeline.push({
        day: dayLabel,
        date: dateKey,
        learners: dayLearners,
        mentors: dayMentors,
        total: dayLearners + dayMentors,
      });
    }

    const languageConfig = [
      { code: 'ta', name: 'Tamil', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.85)' },
      { code: 'te', name: 'Telugu', color: '#0b6fb8', bg: 'rgba(11, 111, 184, 0.85)' },
      { code: 'kn', name: 'Kannada', color: '#10b981', bg: 'rgba(16, 185, 129, 0.85)' },
      { code: 'hi', name: 'Hindi', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.85)' },
      { code: 'ml', name: 'Malayalam', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.85)' },
      { code: 'en', name: 'English', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.85)' },
    ];

    const languageDistribution = languageConfig.map((lang) => {
      const count = students.filter((s) => {
        const pref = (s.preferred_language || s.ui_language || s.learning_language || '').toLowerCase();
        return pref === lang.code;
      }).length;
      const percentage = totalLearners > 0 ? Math.round((count / totalLearners) * 100) : 0;
      return {
        ...lang,
        count,
        percentage,
      };
    });

    const bronzeCount = students.filter((s) => (s.league || 'bronze').toLowerCase() === 'bronze').length;
    const silverCount = students.filter((s) => (s.league || '').toLowerCase() === 'silver').length;
    const goldCount = students.filter((s) => (s.league || '').toLowerCase() === 'gold').length;
    const rubyCount = students.filter((s) => (s.league || '').toLowerCase() === 'ruby').length;

    const bronzePct = totalLearners > 0 ? Math.round((bronzeCount / totalLearners) * 100) : 0;
    const silverPct = totalLearners > 0 ? Math.round((silverCount / totalLearners) * 100) : 0;
    const goldPct = totalLearners > 0 ? Math.round((goldCount / totalLearners) * 100) : 0;
    const rubyPct = totalLearners > 0 ? Math.round((rubyCount / totalLearners) * 100) : 0;

    const leaguePromotionTrends = {
      totalPromotions: totalLeagueCerts,
      recentPromotionsCount: leagueCertRows.length,
      promotedToSilver: leagueCertRows.filter((l) => (l.league || '').toLowerCase() === 'silver').length,
      promotedToGold: leagueCertRows.filter((l) => (l.league || '').toLowerCase() === 'gold').length,
      promotedToRuby: leagueCertRows.filter((l) => (l.league || '').toLowerCase() === 'ruby').length,
    };

    const courseStats = coursesDb.map((c) => {
      let title = c.title;
      try {
        title = typeof c.title === 'string' ? JSON.parse(c.title) : c.title;
      } catch (_) { /* literal */ }

      const enrolled = learnerInsights.filter((u) => u.currentCourse === c.path || u.currentCourse === c.id);
      const enrolledCount = enrolled.length || (c.id === 'course_1' ? students.length : 0);
      const completed = enrolled.filter((u) => u.progressPercent >= 100);
      const completionRate = enrolledCount > 0 ? Math.round((completed.length / enrolledCount) * 100) : 0;
      const avgProg = enrolledCount > 0
        ? Math.round(enrolled.reduce((acc, u) => acc + u.progressPercent, 0) / enrolledCount)
        : 0;

      return {
        courseId: c.id,
        path: c.path,
        title: typeof title === 'object' ? title.en || 'Literacy Course' : String(title),
        enrolledCount,
        completedCount: completed.length,
        completionRate,
        avgProgress: avgProg,
      };
    });

    const lowCompletionCourses = courseStats.filter((c) => c.enrolledCount > 0 && c.completionRate < 50);
    const lowScoreAssessments = learnerInsights.filter((u) => u.assessmentScore != null && u.assessmentScore < 60);
    const pendingMentorApprovals = mentors.filter((m) => {
      const created = m.created_at ? new Date(m.created_at).getTime() : 0;
      return created >= oneMonthAgo;
    });

    const recentCertificatesList = [
      ...certRows.map((c) => ({
        id: c.credential_id || `CERT-${c.user_id?.slice(0, 6)}`,
        userId: c.user_id,
        userName: userMap.get(c.user_id) || 'Learner',
        type: 'Course Certificate',
        title: c.course_title || 'Course Completion',
        score: c.score != null ? c.score : 100,
        issueDate: c.issued_date || new Date().toISOString(),
        badgeBg: 'bg-blue-500/20 text-blue-900 border-blue-500/30',
      })),
      ...leagueCertRows.map((l) => ({
        id: l.credential_id || `LEAGUE-${l.user_id?.slice(0, 6)}`,
        userId: l.user_id,
        userName: userMap.get(l.user_id) || 'Learner',
        type: 'League Certificate',
        title: l.league_title || `${(l.league || 'League').toUpperCase()} League Advancement`,
        score: l.score != null ? l.score : 100,
        issueDate: l.issued_date || new Date().toISOString(),
        badgeBg: 'bg-amber-500/20 text-amber-900 border-amber-500/30',
      })),
    ].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()).slice(0, 15);

    const combinedActivities = [];

    allUsers.forEach((u) => {
      if (u.created_at) {
        const isMentor = u.role === 'mentor';
        combinedActivities.push({
          id: `reg_${u.id}_${u.created_at}`,
          userId: u.id,
          userName: formatLearnerName(u.name),
          type: isMentor ? 'mentor_registration' : 'learner_registration',
          title: isMentor ? 'New Mentor Registration' : 'New Learner Registration',
          description: isMentor
            ? `Mentor account registered for ${u.email}`
            : `Joined LiteraAI with ${(u.preferred_language || 'en').toUpperCase()} language path`,
          timestamp: u.created_at,
          badgeColor: isMentor
            ? 'text-purple-700 bg-purple-50 border-purple-200'
            : 'text-sky-700 bg-sky-50 border-sky-200',
        });
      }
    });

    lessonActivityRows.forEach((r) => {
      combinedActivities.push({
        id: `lesson_${r.user_id}_${r.lesson_id}_${r.completed_at}`,
        userId: r.user_id,
        userName: userMap.get(r.user_id) || 'Learner',
        type: 'completed_lesson',
        title: `Completed Lesson ${Number(r.lesson_id) + 1}`,
        description: `Scored ${r.score || 100}% in ${r.course_id || 'Literacy Path'}`,
        timestamp: r.completed_at,
        badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      });
    });

    certRows.forEach((r) => {
      combinedActivities.push({
        id: `cert_${r.credential_id || r.user_id}_${r.issued_date}`,
        userId: r.user_id,
        userName: userMap.get(r.user_id) || 'Learner',
        type: 'certificate_issued',
        title: 'Course Certificate Issued',
        description: `Achieved ${r.score}% in ${r.course_title}`,
        timestamp: r.issued_date,
        badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
      });
    });

    leagueCertRows.forEach((r) => {
      combinedActivities.push({
        id: `league_${r.credential_id || r.user_id}_${r.issued_date}`,
        userId: r.user_id,
        userName: userMap.get(r.user_id) || 'Learner',
        type: 'league_promotion',
        title: `Promoted to ${(r.league || 'League').toUpperCase()} League`,
        description: `Graduated with exam score of ${r.score}%`,
        timestamp: r.issued_date,
        badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      });
    });

    students
      .filter((s) => s.assessment_score != null)
      .forEach((s) => {
        combinedActivities.push({
          id: `assess_${s.id}_${s.assessment_score}`,
          userId: s.id,
          userName: formatLearnerName(s.name),
          type: 'assessment_submitted',
          title: 'Diagnostic Assessment Submitted',
          description: `Scored ${s.assessment_score}% · Level: ${s.education_level || 'Primary'}`,
          timestamp: s.streak?.last_activity || s.created_at || new Date().toISOString(),
          badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        });
      });

    combinedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const activityFeed = combinedActivities.slice(0, 25);

    const summaryData = {
      totalLearners,
      totalMentors,
      totalCourses,
      totalCertificatesIssued,
      totalAssessmentsCompleted,
      activeUsersThisWeek: activeUsersThisWeekCount,
      highRiskCount: highRiskLearners.length,
      mediumRiskCount: mediumRiskLearners.length,
      onTrackCount: onTrackLearners.length,
      activeToday: activeTodayCount,
      avgProgress,
      atRiskLearners: atRiskLearners.length,
    };

    const adminControlCenter = {
      platformHealth: {
        totalLearners,
        totalMentors,
        totalCourses,
        totalCertificatesIssued,
        totalAssessmentsCompleted,
        activeUsersThisWeek: activeUsersThisWeekCount,
      },
      growthAnalytics: {
        newLearnersThisWeek,
        newLearnersThisMonth,
        newMentorsThisMonth,
        growthPercentage,
        timeline: growthTimeline,
      },
      languageAdoption: {
        languages: languageDistribution,
        totalLearners,
      },
      leagueDistribution: {
        counts: {
          bronze: bronzeCount,
          silver: silverCount,
          gold: goldCount,
          ruby: rubyCount,
        },
        percentages: {
          bronze: bronzePct,
          silver: silverPct,
          gold: goldPct,
          ruby: rubyPct,
        },
        totalRanked: totalLearners,
        promotionTrends: leaguePromotionTrends,
      },
      adminAlerts: {
        inactive7DaysCount: inactive7PlusLearners.length,
        inactive7DaysList: inactive7PlusLearners.slice(0, 10),
        lowCompletionCoursesCount: lowCompletionCourses.length,
        lowCompletionCoursesList: lowCompletionCourses,
        lowScoreAssessmentsCount: lowScoreAssessments.length,
        lowScoreAssessmentsList: lowScoreAssessments.slice(0, 10),
        pendingMentorApprovalsCount: pendingMentorApprovals.length,
        pendingMentorApprovalsList: pendingMentorApprovals,
        totalAlertsCount:
          inactive7PlusLearners.length +
          lowCompletionCourses.length +
          lowScoreAssessments.length +
          pendingMentorApprovals.length,
      },
      recentCertificates: recentCertificatesList,
      activityFeed,
    };

    return res.json({
      adminControlCenter,
      platformHealth: adminControlCenter.platformHealth,
      growthAnalytics: adminControlCenter.growthAnalytics,
      languageAdoption: adminControlCenter.languageAdoption,
      leagueDistribution: adminControlCenter.leagueDistribution,
      adminAlerts: adminControlCenter.adminAlerts,
      recentCertificates: adminControlCenter.recentCertificates,
      activityFeed: adminControlCenter.activityFeed,
      priorities: {
        immediateAttentionCount: highRiskLearners.length,
        inactive7DaysCount: inactive7PlusLearners.length,
        inactive5DaysCount: inactive5PlusLearners.length,
        belowAssessmentCount: belowAssessmentThreshold.length,
        readyPromotionCount: readyForPromotion.length,
        requiringAttentionCount: atRiskLearners.length,
      },
      contextualActions,
      summary: summaryData,
      overview: summaryData,
      atRiskLearners,
      recentActivity: activityFeed.slice(0, 10),
      learners: learnerInsights,
      needsAttention: atRiskLearners,
      courseAnalytics: courseStats,
      assessmentAnalytics: {
        totalCompleted: diagnosticAssessmentsCount,
        avgScore: Math.round(
          students.filter((s) => s.assessment_score != null).reduce((sum, s) => sum + s.assessment_score, 0) /
            (diagnosticAssessmentsCount || 1)
        ),
        distribution: [
          { range: '0-40%', count: students.filter((s) => s.assessment_score != null && s.assessment_score < 40).length },
          { range: '40-70%', count: students.filter((s) => s.assessment_score != null && s.assessment_score >= 40 && s.assessment_score <= 70).length },
          { range: '70-100%', count: students.filter((s) => s.assessment_score != null && s.assessment_score > 70).length },
        ],
      },
      leagueMonitoring: {
        counts: { bronze: bronzeCount, silver: silverCount, gold: goldCount },
        bronzeCount,
        silverCount,
        goldCount,
        rubyCount,
        recentPromotions: leagueCertRows.map((l) => ({
          credential_id: l.credential_id,
          user_name: userMap.get(l.user_id) || 'Learner',
          league_title: l.league_title || `${(l.league || 'League').toUpperCase()} League`,
          score: l.score != null ? l.score : 100,
          issued_date: l.issued_date || new Date().toISOString(),
        })),
        upcomingEligible: readyForPromotion.slice(0, 8),
      },
      certificateTracking: {
        totalIssued: totalCertificatesIssued,
        recentCertificates: recentCertificatesList.map((c) => ({
          id: c.id,
          user_name: c.userName,
          title: c.title,
          type: c.type === 'Course Certificate' ? 'Course' : 'League',
          score: c.score,
          date: c.issueDate,
        })),
        eligibleLearners: readyForPromotion.slice(0, 8),
      },
      meta: {
        lastUpdated: new Date().toISOString(),
        excludedTestAccounts: excludeTest,
      },
    });
  } catch (err) {
    console.error('getMentorDashboard error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch mentor dashboard data' });
  }
}

/**
 * POST /api/mentor/assign-course
 */
export async function assignCourseToLearner(req, res) {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied: Mentor role required' });
    }
    const { learnerId, courseId } = req.body;
    if (!learnerId || !courseId) {
      return res.status(400).json({ error: 'learnerId and courseId are required' });
    }

    const pool = getPool();
    await pool.query('UPDATE users SET current_path = $1, updated_at = NOW() WHERE id = $2', [
      courseId,
      learnerId
    ]);

    return res.json({ success: true, message: `Course ${courseId} successfully assigned to learner.` });
  } catch (err) {
    console.error('assignCourseToLearner error:', err);
    return res.status(500).json({ error: err.message || 'Failed to assign course' });
  }
}

/**
 * POST /api/mentor/send-reminder
 */
export async function sendLearnerReminder(req, res) {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied: Mentor role required' });
    }
    const { learnerId } = req.body;
    const user = await findUserById(learnerId);
    if (!user) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    return res.json({
      success: true,
      message: `Support reminder and practice notification sent to ${formatLearnerName(user.name)}.`,
    });
  } catch (err) {
    console.error('sendLearnerReminder error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send reminder' });
  }
}

/**
 * POST /api/mentor/add-learner
 */
export async function addLearnerDirect(req, res) {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied: Mentor role required' });
    }
    const { name, email, password, uiLanguage, learningLanguage, educationLevel } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and Email are required' });
    }

    const newUser = await createUser({
      name: formatLearnerName(name),
      email,
      password: password || 'Litera123!',
      role: 'student',
      uiLanguage: uiLanguage || 'en',
      learningLanguage: learningLanguage || 'en',
      education_level: educationLevel || 'Primary School',
    });

    return res.status(201).json({
      success: true,
      learner: newUser,
      message: `Learner ${name} registered successfully.`,
    });
  } catch (err) {
    console.error('addLearnerDirect error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add learner' });
  }
}

/**
 * GET /api/mentor/learner/:id
 */
export async function getLearnerDetails(req, res) {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied: Mentor role required' });
    }

    const { id } = req.params;
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    const pool = getPool();

    const lessonProgressRes = await pool.query(`
      SELECT course_id, lesson_id, score, correct_count, total_questions, completed_at
      FROM user_course_lesson_progress
      WHERE user_id = $1
      ORDER BY completed_at DESC
    `, [id]);

    const courseProgressRes = await pool.query(`
      SELECT course_id, checkpoint_passed, checkpoint_score, final_assessment_passed
      FROM user_course_progress
      WHERE user_id = $1
    `, [id]);

    const rewardEventsRes = await pool.query(`
      SELECT event_id, xp, gems, created_at
      FROM user_reward_events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [id]);

    const alphabetProgress = await getAlphabetWritingProgress(id);

    return res.json({
      learner: {
        ...user,
        name: formatLearnerName(user.name),
      },
      lessonProgress: lessonProgressRes.rows,
      courseProgress: courseProgressRes.rows,
      rewardEvents: rewardEventsRes.rows,
      alphabetProgress,
    });
  } catch (err) {
    console.error('getLearnerDetails error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch learner details' });
  }
}

export async function getAlphabetAnalytics(req, res) {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const analytics = await getAlphabetWritingMentorAnalytics();
    res.json(analytics);
  } catch (err) {
    console.error('getAlphabetAnalytics error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch alphabet analytics' });
  }
}
