import {
  findUserById,
  updateUser,
  awardUserReward,
  awardUserBadge,
  sanitizeUser,
  recordAlphabetWritingAttempt,
  getAlphabetWritingProgress,
  buyUserSkin,
  equipUserSkin,
  buyUserStreakSaver,
  useUserStreakSaver,
} from '../services/db.js';
import { LANGUAGES, EDUCATION_LEVELS } from '../utils/auth.js';

export async function getMe(req, res) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateMe(req, res) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { name, preferred_language, uiLanguage, learningLanguage, ui_language, learning_language, education_level, streak_goal } = req.body || {};
    const updates = {};
    if (name) updates.name = String(name).trim();
    if (preferred_language) {
      if (!LANGUAGES.includes(preferred_language)) {
        return res.status(400).json({ error: 'Invalid preferred language' });
      }
      updates.preferred_language = preferred_language;
    }
    const requestedUiLanguage = uiLanguage || ui_language;
    const requestedLearningLanguage = learningLanguage || learning_language;
    if (requestedUiLanguage) {
      if (!LANGUAGES.includes(requestedUiLanguage)) return res.status(400).json({ error: 'Invalid interface language' });
      updates.uiLanguage = requestedUiLanguage;
    }
    if (requestedLearningLanguage) {
      if (!LANGUAGES.includes(requestedLearningLanguage)) return res.status(400).json({ error: 'Invalid learning language' });
      updates.learningLanguage = requestedLearningLanguage;
    }
    // Legacy clients still send one preference; retain their historical
    // single-language behaviour unless they explicitly opt into the split.
    if (preferred_language && !requestedUiLanguage && !requestedLearningLanguage) {
      updates.uiLanguage = preferred_language;
      updates.learningLanguage = preferred_language;
    }
    if (education_level) {
      if (!EDUCATION_LEVELS.includes(education_level)) {
        return res.status(400).json({ error: 'Invalid education level' });
      }
      updates.education_level = education_level;
    }
    if (streak_goal !== undefined) {
      const goal = Number(streak_goal);
      if (!Number.isInteger(goal) || goal < 1 || goal > 365) {
        return res.status(400).json({ error: 'Streak goal must be a whole number between 1 and 365' });
      }
      updates.streak = { goal };
    }

    const updated = await updateUser(user.id, updates);
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function awardWritingReward(req, res) {
  try {
    const { event_id, reward_type } = req.body || {};
    const rewards = {
      challenge: { xp: 10, gems: 1 },
      completion: { xp: 50, gems: 5 },
    };
    const reward = rewards[reward_type];
    if (!reward) return res.status(400).json({ error: 'Invalid writing reward type' });
    let user = await awardUserReward(req.user.id, { eventId: event_id, ...reward });
    if (reward_type === 'completion') {
      user = await awardUserBadge(req.user.id, 'writing_master');
    }
    res.json({ user, awarded: reward });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function awardPracticeReward(req, res) {
  try {
    const { event_id, reward_type } = req.body || {};
    const rewards = {
      voice_sentence: { xp: 10, gems: 1 },
      voice_completion: { xp: 50, gems: 5 },
    };
    const reward = rewards[reward_type];
    if (!reward) return res.status(400).json({ error: 'Invalid practice reward type' });
    let user = await awardUserReward(req.user.id, { eventId: event_id, ...reward });
    if (reward_type === 'voice_completion') {
      user = await awardUserBadge(req.user.id, 'voice_master');
    }
    res.json({ user, awarded: reward });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function awardBadge(req, res) {
  try {
    const { badge_id } = req.body || {};
    if (!badge_id) return res.status(400).json({ error: 'Badge ID is required' });
    const user = await awardUserBadge(req.user.id, badge_id);
    res.json({ user, badge_id });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function recordAlphabetProgress(req, res) {
  try {
    const { letter, type, word, score, timeSpent, event_id } = req.body || {};
    if (!letter) return res.status(400).json({ error: 'Letter is required' });
    const result = await recordAlphabetWritingAttempt({
      userId: req.user.id,
      letter,
      type: type || 'letter',
      word: word || '',
      score: Number(score) || 0,
      timeSpent: Number(timeSpent) || 0,
      eventId: event_id,
    });
    const progress = await getAlphabetWritingProgress(req.user.id);
    res.json({ ...result, progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAlphabetProgress(req, res) {
  try {
    const progress = await getAlphabetWritingProgress(req.user.id);
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function buySkin(req, res) {
  try {
    const { skin } = req.body || {};
    if (!skin) return res.status(400).json({ error: 'Skin identifier is required' });
    const user = await buyUserSkin(req.user.id, skin);
    res.json({ user, success: true, skin });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function equipSkin(req, res) {
  try {
    const { skin } = req.body || {};
    if (!skin) return res.status(400).json({ error: 'Skin identifier is required' });
    const user = await equipUserSkin(req.user.id, skin);
    res.json({ user, success: true, skin });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function buyStreakSaver(req, res) {
  try {
    const user = await buyUserStreakSaver(req.user.id);
    res.json({ user, success: true, streak_savers: user.streak_savers });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function useStreakSaver(req, res) {
  try {
    const user = await useUserStreakSaver(req.user.id);
    res.json({ user, success: true, streak_savers: user.streak_savers });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
