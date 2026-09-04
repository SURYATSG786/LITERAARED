import { randomUUID } from 'crypto';
import { getPool, findUserById, updateUser, sanitizeUser } from '../services/db.js';

function formatLearnerName(name) {
  if (!name) return 'Learner';
  return name.replace(/\s+/g, ' ').trim();
}

/**
 * GET /api/admin/dashboard
 * Live summary counts & 7-day trends from real Supabase Postgres data
 */
export async function getAdminDashboard(req, res) {
  try {
    const pool = getPool();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = new Date(now - 7 * oneDayMs).toISOString();
    const fourteenDaysAgo = new Date(now - 14 * oneDayMs).toISOString();

    // 1. Total Registered Students
    const totalStudentsRes = await pool.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN created_at >= $1 THEN 1 ELSE 0 END) as this_week,
             SUM(CASE WHEN created_at >= $2 AND created_at < $1 THEN 1 ELSE 0 END) as prev_week
      FROM users
      WHERE role != 'mentor' AND role != 'admin'
    `, [sevenDaysAgo, fourteenDaysAgo]);

    const totalStudentsRow = totalStudentsRes.rows[0];
    const totalStudents = parseInt(totalStudentsRow?.total || 0, 10);
    const studentsThisWeek = parseInt(totalStudentsRow?.this_week || 0, 10);
    const studentsPrevWeek = parseInt(totalStudentsRow?.prev_week || 0, 10);
    const studentsGrowth = studentsPrevWeek > 0
      ? Math.round(((studentsThisWeek - studentsPrevWeek) / studentsPrevWeek) * 100)
      : (studentsThisWeek > 0 ? 100 : 0);

    // 2. Completed Initial Assessment
    const assessmentStatsRes = await pool.query(`
      SELECT COUNT(*) as completed_count,
             AVG(assessment_score) as avg_score,
             SUM(CASE WHEN created_at >= $1 AND assessment_score IS NOT NULL THEN 1 ELSE 0 END) as this_week_completed,
             SUM(CASE WHEN created_at >= $2 AND created_at < $1 AND assessment_score IS NOT NULL THEN 1 ELSE 0 END) as prev_week_completed
      FROM users
      WHERE role != 'mentor' AND role != 'admin' AND assessment_score IS NOT NULL
    `, [sevenDaysAgo, fourteenDaysAgo]);

    const assessmentStatsRow = assessmentStatsRes.rows[0];
    const completedAssessments = parseInt(assessmentStatsRow?.completed_count || 0, 10);
    const avgScore = assessmentStatsRow?.avg_score ? Math.round(Number(assessmentStatsRow.avg_score)) : 0;
    const completedThisWeek = parseInt(assessmentStatsRow?.this_week_completed || 0, 10);
    const completedPrevWeek = parseInt(assessmentStatsRow?.prev_week_completed || 0, 10);
    const assessmentGrowth = completedPrevWeek > 0
      ? Math.round(((completedThisWeek - completedPrevWeek) / completedPrevWeek) * 100)
      : (completedThisWeek > 0 ? 100 : 0);

    // 3. Students Who Unlocked Courses (have assigned path or lesson progress)
    const unlockedCoursesRes = await pool.query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN user_course_lesson_progress p ON u.id = p.user_id
      WHERE u.role != 'mentor' AND u.role != 'admin'
        AND ((u.current_path IS NOT NULL AND u.current_path != '') OR p.user_id IS NOT NULL)
    `);
    const unlockedCourses = parseInt(unlockedCoursesRes.rows[0]?.count || 0, 10);

    // 4. Active Users (7 days)
    const activeUsersRes = await pool.query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN user_streaks s ON u.id = s.user_id
      WHERE u.role != 'mentor' AND u.role != 'admin'
        AND (s.last_activity >= $1 OR u.created_at >= $1)
    `, [sevenDaysAgo]);
    const activeUsersThisWeek = parseInt(activeUsersRes.rows[0]?.count || 0, 10);

    // 5. Total Certificates Issued
    const certsRes = await pool.query('SELECT COUNT(*) as count FROM certificates');
    const leagueCertsRes = await pool.query('SELECT COUNT(*) as count FROM league_certificates');
    const totalCerts = parseInt(certsRes.rows[0]?.count || 0, 10) + parseInt(leagueCertsRes.rows[0]?.count || 0, 10);

    // Recent activity & registrations
    const recentRegRes = await pool.query(`
      SELECT id, name, email, preferred_language, education_level, assessment_score, created_at
      FROM users
      WHERE role != 'mentor' AND role != 'admin'
      ORDER BY created_at DESC
      LIMIT 6
    `);
    const recentRegistrations = recentRegRes.rows.map((u) => ({
      ...u,
      name: formatLearnerName(u.name),
    }));

    const recentCertsRes = await pool.query(`
      SELECT c.credential_id, c.user_id, u.name as user_name, c.course_title, c.score, c.issued_date, 'course' as type
      FROM certificates c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.issued_date DESC
      LIMIT 5
    `);
    const recentCertificates = recentCertsRes.rows.map((c) => ({
      ...c,
      user_name: formatLearnerName(c.user_name),
    }));

    return res.json({
      stats: {
        totalStudents: {
          value: totalStudents,
          label: 'Total Registered Students',
          trend: studentsGrowth,
          trendDirection: studentsGrowth >= 0 ? 'up' : 'down',
          subtext: `${studentsThisWeek} new this week`,
        },
        completedAssessments: {
          value: completedAssessments,
          label: 'Assessments Completed',
          trend: assessmentGrowth,
          trendDirection: assessmentGrowth >= 0 ? 'up' : 'down',
          subtext: `${Math.round((completedAssessments / (totalStudents || 1)) * 100)}% completion rate`,
        },
        avgAssessmentScore: {
          value: avgScore,
          label: 'Average Assessment Score',
          trend: avgScore >= 60 ? 5 : -2,
          trendDirection: avgScore >= 60 ? 'up' : 'down',
          subtext: avgScore >= 60 ? 'Healthy comprehension' : 'Foundational support needed',
          unit: '%',
        },
        unlockedCourses: {
          value: unlockedCourses,
          label: 'Unlocked Courses & Progress',
          trend: Math.round((unlockedCourses / (totalStudents || 1)) * 100),
          trendDirection: 'up',
          subtext: `${unlockedCourses} active path learners`,
        },
      },
      overview: {
        totalStudents,
        completedAssessments,
        avgScore,
        unlockedCourses,
        activeUsersThisWeek,
        totalCerts,
      },
      recentRegistrations,
      recentCertificates,
    });
  } catch (err) {
    console.error('getAdminDashboard error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch admin dashboard' });
  }
}

/**
 * GET /api/admin/learners
 * Paginated, sortable, and searchable full roster with live DB joins
 */
export async function getAdminLearners(req, res) {
  try {
    const pool = getPool();
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      levelFilter = 'all',
      scoreFilter = 'all',
      education = 'all',
      scoreTier = 'all',
    } = req.query;

    const effectiveLevel = (education !== 'all' ? education : levelFilter) || 'all';
    const effectiveScore = (scoreTier !== 'all' ? scoreTier : scoreFilter) || 'all';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const sortColumns = {
      name: 'u.name',
      email: 'u.email',
      education: 'u.education_level',
      education_level: 'u.education_level',
      educationLevel: 'u.education_level',
      score: 'u.assessment_score',
      assessment_score: 'u.assessment_score',
      assessmentScore: 'u.assessment_score',
      streak: 'COALESCE(s.current_streak, 0)',
      streak_days: 'COALESCE(s.current_streak, 0)',
      streakDays: 'COALESCE(s.current_streak, 0)',
      xp: 'u.xp',
      gems: 'u.gems',
      league: 'u.league',
      created_at: 'u.created_at',
      createdAt: 'u.created_at',
      last_active: 'COALESCE(s.last_activity, u.created_at)',
      last_active_at: 'COALESCE(s.last_activity, u.created_at)',
      lastActiveAt: 'COALESCE(s.last_activity, u.created_at)',
    };
    const orderColumn = sortColumns[sortBy] || 'u.created_at';
    const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const conditions = ["u.role != 'mentor'", "u.role != 'admin'"];
    const params = [];

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    if (effectiveLevel && effectiveLevel !== 'all') {
      params.push(effectiveLevel);
      conditions.push(`u.education_level = $${params.length}`);
    }

    if (effectiveScore === 'low') {
      conditions.push('u.assessment_score < 40 AND u.assessment_score IS NOT NULL');
    } else if (effectiveScore === 'medium') {
      conditions.push('u.assessment_score >= 40 AND u.assessment_score <= 70');
    } else if (effectiveScore === 'high') {
      conditions.push('u.assessment_score > 70');
    } else if (effectiveScore === 'unassessed') {
      conditions.push('u.assessment_score IS NULL');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(`
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `, params);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);
    const totalPages = Math.ceil(total / limitNum);

    const queryParams = [...params, limitNum, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const learnersQuery = `
      SELECT u.id, u.name, u.email, u.preferred_language, u.ui_language, u.learning_language,
             u.education_level, u.assessment_score, u.current_path, u.xp, u.gems, u.league,
             u.created_at,
             COALESCE(s.current_streak, 0) as streak_days,
             COALESCE(s.last_activity, u.created_at) as last_active_at,
             (SELECT COUNT(*) FROM user_course_lesson_progress WHERE user_id = u.id) as lessons_completed,
             (SELECT COUNT(*) FROM certificates WHERE user_id = u.id) as course_certs_count
      FROM users u
      LEFT JOIN user_streaks s ON u.id = s.user_id
      ${whereClause}
      ORDER BY ${orderColumn} ${orderDirection}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const learnersRes = await pool.query(learnersQuery, queryParams);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const learners = learnersRes.rows.map((u) => {
      let daysInactive = 0;
      if (u.last_active_at) {
        const lastTime = new Date(u.last_active_at).getTime();
        daysInactive = Math.max(0, Math.floor((now - lastTime) / oneDayMs));
      }

      return {
        id: u.id,
        name: formatLearnerName(u.name),
        email: u.email,
        preferred_language: u.preferred_language || 'en',
        preferredLanguage: (u.preferred_language || 'en').toUpperCase(),
        ui_language: u.ui_language || u.preferred_language || 'en',
        uiLanguage: u.ui_language || u.preferred_language || 'en',
        learning_language: u.learning_language || u.preferred_language || 'en',
        learningLanguage: (u.learning_language || u.preferred_language || 'en').toUpperCase(),
        education_level: u.education_level || 'primary',
        educationLevel: u.education_level || 'primary',
        assessment_score: u.assessment_score,
        assessmentScore: u.assessment_score,
        current_path: u.current_path || 'Basic Literacy',
        currentPath: u.current_path || 'Basic Literacy',
        streak_days: parseInt(u.streak_days || 0, 10),
        streakDays: parseInt(u.streak_days || 0, 10),
        xp: u.xp || 0,
        gems: u.gems || 0,
        league: u.league || 'bronze',
        lessons_completed: parseInt(u.lessons_completed || 0, 10),
        lessonsCompleted: parseInt(u.lessons_completed || 0, 10),
        certificates_count: parseInt(u.course_certs_count || 0, 10),
        certificatesCount: parseInt(u.course_certs_count || 0, 10),
        created_at: u.created_at,
        createdAt: u.created_at,
        last_active_at: u.last_active_at,
        lastActiveAt: u.last_active_at,
        daysInactive,
        inactivityDays: daysInactive,
      };
    });

    return res.json({
      learners,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (err) {
    console.error('getAdminLearners error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch learners roster' });
  }
}

/**
 * GET /api/admin/learner/:id
 * Detailed learner drawer history from Supabase
 */
export async function getAdminLearnerDetails(req, res) {
  try {
    const pool = getPool();
    const { id } = req.params;

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    const lessonHistoryRes = await pool.query(`
      SELECT course_id, lesson_id, score, correct_count, total_questions, completed_at
      FROM user_course_lesson_progress
      WHERE user_id = $1
      ORDER BY completed_at DESC
    `, [id]);

    const courseCheckpointsRes = await pool.query(`
      SELECT course_id, checkpoint_passed, checkpoint_score, final_assessment_passed
      FROM user_course_progress
      WHERE user_id = $1
    `, [id]);

    const certHistoryRes = await pool.query(`
      SELECT credential_id, course_id, course_title, score, issued_date
      FROM certificates
      WHERE user_id = $1
      ORDER BY issued_date DESC
    `, [id]);

    const leagueCertsRes = await pool.query(`
      SELECT credential_id, league, league_title, score, issued_date
      FROM league_certificates
      WHERE user_id = $1
      ORDER BY issued_date DESC
    `, [id]);

    const remindersRes = await pool.query(`
      SELECT id, note, channel, status, created_at
      FROM admin_reminders
      WHERE learner_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);

    const userStreak = user.streak?.current || 0;
    const userLastActive = user.streak?.last_activity || user.created_at;

    return res.json({
      learner: {
        ...user,
        name: formatLearnerName(user.name),
        preferred_language: user.preferred_language || 'en',
        preferredLanguage: (user.preferred_language || 'en').toUpperCase(),
        learning_language: user.learning_language || user.preferred_language || 'en',
        learningLanguage: (user.learning_language || user.preferred_language || 'en').toUpperCase(),
        education_level: user.education_level || 'primary',
        educationLevel: user.education_level || 'primary',
        assessment_score: user.assessment_score,
        assessmentScore: user.assessment_score,
        current_path: user.current_path || 'Basic Literacy',
        currentPath: user.current_path || 'Basic Literacy',
        streak_days: userStreak,
        streakDays: userStreak,
        last_active_at: userLastActive,
        lastActiveAt: userLastActive,
      },
      diagnostic: user.assessment_score != null ? {
        score: user.assessment_score,
        assigned_level: user.current_path || 'Foundation',
        completed_at: user.created_at,
      } : null,
      lessonHistory: lessonHistoryRes.rows,
      courseProgress: lessonHistoryRes.rows,
      courseCheckpoints: courseCheckpointsRes.rows,
      certificates: [...certHistoryRes.rows, ...leagueCertsRes.rows],
      reminders: remindersRes.rows,
    });
  } catch (err) {
    console.error('getAdminLearnerDetails error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch learner details' });
  }
}

/**
 * GET /api/admin/needs-attention
 * Computed risk list with live badge count in header
 */
export async function getAdminNeedsAttention(req, res) {
  try {
    const pool = getPool();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const fiveDaysAgo = new Date(now - 5 * oneDayMs).toISOString();
    const threeDaysAgo = new Date(now - 3 * oneDayMs).toISOString();

    const queryStr = `
      SELECT u.id, u.name, u.email, u.preferred_language, u.ui_language, u.learning_language,
             u.education_level, u.assessment_score, u.current_path, u.created_at,
             COALESCE(s.current_streak, 0) as streak_days,
             COALESCE(s.last_activity, u.created_at) as last_active_at,
             (SELECT COUNT(*) FROM user_course_lesson_progress WHERE user_id = u.id) as lessons_completed
      FROM users u
      LEFT JOIN user_streaks s ON u.id = s.user_id
      WHERE u.role != 'mentor' AND u.role != 'admin'
        AND (
          COALESCE(s.last_activity, u.created_at) <= $1
          OR (u.assessment_score IS NOT NULL AND u.assessment_score < 40)
          OR (u.assessment_score IS NULL AND u.created_at <= $2)
        )
      ORDER BY u.assessment_score ASC NULLS FIRST, COALESCE(s.last_activity, u.created_at) ASC
      LIMIT 50
    `;

    const flaggedRes = await pool.query(queryStr, [fiveDaysAgo, threeDaysAgo]);
    const flaggedRows = flaggedRes.rows;

    const flaggedLearners = flaggedRows.map((u) => {
      let daysInactive = 0;
      if (u.last_active_at) {
        const lastTime = new Date(u.last_active_at).getTime();
        daysInactive = Math.max(0, Math.floor((now - lastTime) / oneDayMs));
      }

      let flagReason = 'Requires follow-up';
      let flagType = 'warning';
      let severity = 'warning';

      if (u.assessment_score != null && u.assessment_score < 40) {
        flagReason = `Low diagnostic score (${u.assessment_score}%) — Needs assessment retake`;
        flagType = 'low_score';
        severity = 'critical';
      } else if (daysInactive >= 5) {
        flagReason = `Inactive for ${daysInactive} days — Broken practice habit`;
        flagType = 'inactive';
        severity = daysInactive >= 10 ? 'critical' : 'warning';
      } else if (u.assessment_score == null) {
        flagReason = `Initial assessment not completed after ${daysInactive} days`;
        flagType = 'unassessed';
        severity = 'info';
      }

      return {
        id: u.id,
        name: formatLearnerName(u.name),
        email: u.email,
        preferred_language: u.preferred_language || 'en',
        preferredLanguage: (u.preferred_language || 'en').toUpperCase(),
        learning_language: u.learning_language || u.preferred_language || 'en',
        learningLanguage: (u.learning_language || u.preferred_language || 'en').toUpperCase(),
        education_level: u.education_level || 'primary',
        educationLevel: u.education_level || 'primary',
        assessment_score: u.assessment_score,
        assessmentScore: u.assessment_score,
        current_path: u.current_path || 'Basic Literacy',
        currentPath: u.current_path || 'Basic Literacy',
        streak_days: parseInt(u.streak_days || 0, 10),
        streakDays: parseInt(u.streak_days || 0, 10),
        daysInactive,
        inactivityDays: daysInactive,
        flagReason,
        reason: flagReason,
        flagType,
        severity,
        last_active_at: u.last_active_at,
        lastActiveAt: u.last_active_at,
        created_at: u.created_at,
        createdAt: u.created_at,
      };
    });

    return res.json({
      count: flaggedLearners.length,
      learners: flaggedLearners,
    });
  } catch (err) {
    console.error('getAdminNeedsAttention error:', err);
    return res.status(500).json({ error: err.message || 'Failed to calculate attention list' });
  }
}

/**
 * POST /api/admin/reminders
 * Logs and triggers a real learner reminder in database
 */
export async function sendAdminReminder(req, res) {
  try {
    const { learnerId, note = 'Daily practice reminder', channel = 'in_app' } = req.body;
    if (!learnerId) {
      return res.status(400).json({ error: 'learnerId is required' });
    }

    const pool = getPool();
    const reminderId = randomUUID();
    const createdAt = new Date().toISOString();

    await pool.query(`
      INSERT INTO admin_reminders (id, admin_id, learner_id, note, channel, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'sent', $6)
    `, [reminderId, req.user?.id || 'admin', learnerId, note, channel, createdAt]);

    return res.status(201).json({
      success: true,
      message: 'Reminder logged and sent successfully',
      reminderId,
      createdAt,
    });
  } catch (err) {
    console.error('sendAdminReminder error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send reminder' });
  }
}

/**
 * GET /api/admin/reports
 * SQL aggregates for registrations timeline, score histogram, course completion rates, and languages
 */
export async function getAdminReports(req, res) {
  try {
    const pool = getPool();

    // 1. Registrations Timeline (last 14 days)
    const timelineRes = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE role != 'mentor' AND role != 'admin'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      LIMIT 30
    `);

    // 2. Score Distribution
    const scoreBucketsRes = await pool.query(`
      SELECT
        SUM(CASE WHEN assessment_score >= 0 AND assessment_score <= 20 THEN 1 ELSE 0 END) as bucket_0_20,
        SUM(CASE WHEN assessment_score > 20 AND assessment_score <= 40 THEN 1 ELSE 0 END) as bucket_21_40,
        SUM(CASE WHEN assessment_score > 40 AND assessment_score <= 60 THEN 1 ELSE 0 END) as bucket_41_60,
        SUM(CASE WHEN assessment_score > 60 AND assessment_score <= 80 THEN 1 ELSE 0 END) as bucket_61_80,
        SUM(CASE WHEN assessment_score > 80 AND assessment_score <= 100 THEN 1 ELSE 0 END) as bucket_81_100
      FROM users
      WHERE role != 'mentor' AND role != 'admin' AND assessment_score IS NOT NULL
    `);

    const scoreBuckets = scoreBucketsRes.rows[0];
    const scoreDistribution = [
      { bucket: '0–20%', range: '0–20%', count: parseInt(scoreBuckets?.bucket_0_20 || 0, 10), color: '#ef4444' },
      { bucket: '21–40%', range: '21–40%', count: parseInt(scoreBuckets?.bucket_21_40 || 0, 10), color: '#f97316' },
      { bucket: '41–60%', range: '41–60%', count: parseInt(scoreBuckets?.bucket_41_60 || 0, 10), color: '#eab308' },
      { bucket: '61–80%', range: '61–80%', count: parseInt(scoreBuckets?.bucket_61_80 || 0, 10), color: '#0b6fb8' },
      { bucket: '81–100%', range: '81–100%', count: parseInt(scoreBuckets?.bucket_81_100 || 0, 10), color: '#10b981' },
    ];

    // 3. Course Completion Rates
    const coursesRes = await pool.query('SELECT id, title, path FROM courses');
    const courses = coursesRes.rows;

    const totalLearnersRes = await pool.query("SELECT COUNT(*) as count FROM users WHERE role != 'mentor' AND role != 'admin'");
    const totalLearnersCount = parseInt(totalLearnersRes.rows[0]?.count || 0, 10);

    const courseCompletionRates = await Promise.all(courses.map(async (c) => {
      let title = c.title;
      try { title = typeof c.title === 'string' ? JSON.parse(c.title) : c.title; } catch (_) {}
      const displayTitle = typeof title === 'object' ? title.en || 'Literacy Course' : String(title);

      const certsRes = await pool.query('SELECT COUNT(*) as count FROM certificates WHERE course_id = $1', [c.id]);
      const certsCount = parseInt(certsRes.rows[0]?.count || 0, 10);
      const enrolledCount = totalLearnersCount > 0 ? totalLearnersCount : 1;
      const completionRate = Math.round((certsCount / enrolledCount) * 100);

      return {
        id: c.id,
        course_title: displayTitle,
        title: displayTitle,
        enrolled: enrolledCount,
        completed: certsCount,
        completion_rate: completionRate,
        rate: completionRate,
      };
    }));

    // 4. Language Adoption
    const languageRes = await pool.query(`
      SELECT preferred_language as lang, COUNT(*) as count
      FROM users
      WHERE role != 'mentor' AND role != 'admin'
      GROUP BY preferred_language
      ORDER BY count DESC
    `);

    const languageNames = {
      ta: 'Tamil',
      te: 'Telugu',
      kn: 'Kannada',
      hi: 'Hindi',
      ml: 'Malayalam',
      en: 'English',
    };

    const languageDistribution = languageRes.rows.map((l) => ({
      code: l.lang || 'en',
      language: languageNames[l.lang?.toLowerCase()] || (l.lang ? l.lang.toUpperCase() : 'English'),
      name: languageNames[l.lang?.toLowerCase()] || (l.lang ? l.lang.toUpperCase() : 'English'),
      count: parseInt(l.count || 0, 10),
    }));

    return res.json({
      registrationsTimeline: timelineRes.rows,
      scoreDistribution,
      courseCompletionRates,
      languageDistribution,
      languagePopularity: languageDistribution,
    });
  } catch (err) {
    console.error('getAdminReports error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch reports analytics' });
  }
}

/**
 * GET /api/admin/reports/export-csv
 * Streams standard CSV file of all learners
 */
export async function exportAdminLearnersCsv(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.preferred_language, u.education_level,
             u.assessment_score, u.xp, u.gems, u.league, u.created_at,
             COALESCE(s.current_streak, 0) as streak_days,
             COALESCE(s.last_activity, u.created_at) as last_active_at
      FROM users u
      LEFT JOIN user_streaks s ON u.id = s.user_id
      WHERE u.role != 'mentor' AND u.role != 'admin'
      ORDER BY u.created_at DESC
    `);
    const rows = result.rows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="literaai_learners_roster.csv"');

    res.write('ID,Name,Email,Language,Education Level,Assessment Score,Streak (Days),XP,Gems,League,Registered At,Last Active At\r\n');

    rows.forEach((r) => {
      const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      const line = [
        escape(r.id),
        escape(formatLearnerName(r.name)),
        escape(r.email),
        escape(r.preferred_language),
        escape(r.education_level),
        escape(r.assessment_score ?? 'N/A'),
        escape(r.streak_days),
        escape(r.xp),
        escape(r.gems),
        escape(r.league),
        escape(r.created_at),
        escape(r.last_active_at),
      ].join(',');
      res.write(line + '\r\n');
    });

    res.end();
  } catch (err) {
    console.error('exportAdminLearnersCsv error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate CSV' });
  }
}

/**
 * GET /api/admin/settings
 * Admin profile & platform configuration
 */
export async function getAdminSettings(req, res) {
  try {
    const pool = getPool();
    const liveUser = req.user?.id ? await findUserById(req.user.id) : null;
    const adminUser = liveUser ? sanitizeUser(liveUser) : req.user;

    const settingsRes = await pool.query('SELECT key, value FROM platform_settings');
    const settingsRows = settingsRes.rows;
    const settings = {
      platformName: 'LiteraAI Foundational Literacy',
      defaultStreakGoal: 14,
      assessmentPassThreshold: 40,
      inactivityAlertDays: 5,
      supportedLanguages: ['ta', 'te', 'kn', 'hi', 'ml', 'en'],
      emailNotifications: true,
      weeklyDigest: true,
    };

    settingsRows.forEach((r) => {
      try {
        settings[r.key] = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
      } catch (_) {
        settings[r.key] = r.value;
      }
    });

    const displayName = (adminUser?.name && adminUser.name.trim() !== '')
      ? adminUser.name.trim()
      : (adminUser?.email ? adminUser.email.split('@')[0].replace(/[._-]+/g, ' ').trim() : 'Administrator');

    return res.json({
      admin: {
        id: adminUser?.id,
        name: displayName,
        email: adminUser?.email || '',
        role: adminUser?.role || 'admin',
        preferred_language: adminUser?.preferred_language || 'en',
        ui_language: adminUser?.uiLanguage || adminUser?.ui_language || 'en',
        education_level: adminUser?.education_level || 'Primary School',
        created_at: adminUser?.created_at,
        last_active_at: adminUser?.streak?.last_activity || adminUser?.created_at,
      },
      settings,
    });
  } catch (err) {
    console.error('getAdminSettings error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
}

/**
 * PATCH /api/admin/settings
 * Save admin profile & platform configuration
 */
export async function updateAdminSettings(req, res) {
  try {
    const pool = getPool();
    const { name, email, preferred_language, uiLanguage, ui_language, education_level, settings = {} } = req.body;
    let updatedAdmin = req.user ? sanitizeUser((await findUserById(req.user.id)) || req.user) : null;

    if (req.user?.id) {
      const updates = {};
      if (name !== undefined && String(name).trim() !== '') updates.name = String(name).trim();
      if (email !== undefined && String(email).trim() !== '') updates.email = String(email).trim().toLowerCase();
      if (preferred_language !== undefined) updates.preferred_language = preferred_language;
      if (uiLanguage || ui_language) updates.ui_language = uiLanguage || ui_language;
      if (education_level !== undefined) updates.education_level = education_level;

      if (Object.keys(updates).length > 0) {
        updatedAdmin = await updateUser(req.user.id, updates);
      }
    }

    const now = new Date().toISOString();
    for (const [key, val] of Object.entries(settings)) {
      await pool.query(`
        INSERT INTO platform_settings (key, value, updated_at)
        VALUES ($1, $2, $3)
        ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
      `, [key, typeof val === 'object' ? JSON.stringify(val) : String(val), now]);
    }

    return res.json({
      success: true,
      message: 'Admin profile and settings saved successfully',
      admin: updatedAdmin ? {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        preferred_language: updatedAdmin.preferred_language,
        ui_language: updatedAdmin.uiLanguage || updatedAdmin.ui_language,
        education_level: updatedAdmin.education_level,
      } : null,
      user: updatedAdmin,
    });
  } catch (err) {
    console.error('updateAdminSettings error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Failed to update settings' });
  }
}

/**
 * GET /api/admin/quick-find
 * Real-time ⌘K search across users table
 */
export async function quickFindLearners(req, res) {
  try {
    const pool = getPool();
    const { q = '' } = req.query;
    if (!q.trim()) {
      return res.json({ results: [] });
    }

    const term = `%${q.trim()}%`;
    const resultsRes = await pool.query(`
      SELECT id, name, email, role, preferred_language, education_level, assessment_score
      FROM users
      WHERE name ILIKE $1 OR email ILIKE $1
      LIMIT 8
    `, [term]);

    const results = resultsRes.rows.map((u) => ({
      ...u,
      name: formatLearnerName(u.name),
    }));

    return res.json({ results });
  } catch (err) {
    console.error('quickFindLearners error:', err);
    return res.status(500).json({ error: err.message || 'Quick search failed' });
  }
}
