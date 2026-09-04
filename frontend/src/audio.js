// Native Voice Assistant engine — ported 1:1 from LiteraAI's audio.ts
// Scoped to Surya's 6 supported languages: en, hi, ta, te, kn, ml
// Playback chain per chunk:
//   1) Google Translate TTS (direct, real native-accent speech)
//   2) Backend proxy /api/ai/tts (server-side Google TTS + Gemini TTS fallback)
//   3) Browser Web Speech Synthesis, but ONLY if a genuinely native voice
//      for the target language is installed (never lets an English voice
//      mispronounce non-English text)

const LANG_LOCALE = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
};

const LANG_NAMES = {
  en: 'english',
  hi: 'hindi',
  ta: 'tamil',
  te: 'telugu',
  kn: 'kannada',
  ml: 'malayalam',
};

export const getLangLocale = (lang) => LANG_LOCALE[lang] || 'en-IN';

// --- Global "is the voice guide currently speaking" state -----------------
// Lets UI (e.g. Red Bird's mouth) animate in sync with any voice playback,
// no matter which component triggered it.
const speakingListeners = new Set();
let isSpeakingGlobal = false;

const setSpeaking = (value) => {
  if (isSpeakingGlobal === value) return;
  isSpeakingGlobal = value;
  speakingListeners.forEach((cb) => {
    try { cb(value); } catch (e) { /* listener error, ignore */ }
  });
};

export const isSpeaking = () => isSpeakingGlobal;

export const subscribeSpeaking = (cb) => {
  speakingListeners.add(cb);
  return () => speakingListeners.delete(cb);
};

let currentAudioSource = null;
let currentAudioContext = null;
let currentHtml5Audio = null;
let pendingAudioObject = null;
let audioUnlocked = false;

// Global gesture listener to unlock audio on first click/touch anywhere
if (typeof window !== 'undefined') {
  const unlocker = () => {
    audioUnlocked = true;
    if (pendingAudioObject) {
      const audioToPlay = pendingAudioObject;
      pendingAudioObject = null;
      audioToPlay.play().catch(() => {});
    }
  };
  window.addEventListener('pointerdown', unlocker, { capture: true });
  window.addEventListener('click', unlocker, { capture: true });
  window.addEventListener('touchstart', unlocker, { capture: true });
}

export const stopSpeech = (force = false) => {
  if (force) {
    activeSpeakSessionId += 1;
    pendingAudioObject = null;
  }
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
    } catch (e) { /* already stopped */ }
    currentAudioSource = null;
  }
  if (currentHtml5Audio) {
    try {
      currentHtml5Audio.pause();
      currentHtml5Audio.currentTime = 0;
    } catch (e) { /* noop */ }
    currentHtml5Audio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  setSpeaking(false);
};

const isNativeVoice = (voice, lang) => {
  const vLang = voice.lang.toLowerCase();
  const lCode = lang.toLowerCase();

  if (vLang === lCode) return true;
  if (vLang.startsWith(`${lCode}-`) || vLang.startsWith(`${lCode}_`)) return true;

  const targetName = LANG_NAMES[lang];
  if (targetName) {
    const vName = voice.name.toLowerCase();
    if (vName.includes(targetName)) return true;
  }
  return false;
};

export const speakNativeWebSpeech = (text, lang) => new Promise((resolve) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    resolve(false);
    return;
  }

  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    /* ignore */
  }

  const runSynthesis = (voices) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLocale = getLangLocale(lang);
      utterance.lang = targetLocale;
      utterance.rate = 0.85;
      utterance.pitch = 1.0;

      let selectedVoice = voices.find((v) => (
        v.lang.toLowerCase() === targetLocale.toLowerCase()
        || v.lang.toLowerCase().replace('_', '-') === targetLocale.toLowerCase()
      ));

      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
      }

      if (!selectedVoice) {
        const targetName = LANG_NAMES[lang];
        if (targetName) {
          selectedVoice = voices.find((v) => v.name.toLowerCase().includes(targetName));
        }
      }

      if (selectedVoice) {
        // Prevent using an English voice if the target language is not English
        if (lang !== 'en' && selectedVoice.lang.toLowerCase().startsWith('en')) {
          resolve(false);
          return;
        }
        utterance.voice = selectedVoice;
      } else if (lang !== 'en') {
        // If no native voice pack for this non-English language is installed in browser,
        // fallback to authentic native online TTS proxy (Google Translate native voice)
        resolve(false);
        return;
      }

      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        resolve(true);
      };

      utterance.onend = done;
      utterance.onerror = () => done();

      // Guard timeout in case browser SpeechSynthesis utterance fails to trigger onend
      const duration = Math.max(2000, text.length * 120);
      setTimeout(done, duration);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      resolve(false);
    }
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    setTimeout(() => runSynthesis(voices), 20);
  } else {
    let fired = false;
    const handleVoicesChanged = () => {
      if (fired) return;
      fired = true;
      try {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      } catch (e) {}
      runSynthesis(window.speechSynthesis.getVoices() || []);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    setTimeout(() => {
      if (fired) return;
      fired = true;
      try {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      } catch (e) {}
      runSynthesis(window.speechSynthesis.getVoices() || []);
    }, 200);
  }
});

export const AUTOMATIC_VOICE_LIMIT = 1;
let autoVoiceLimit = AUTOMATIC_VOICE_LIMIT;
let autoVoiceCount = 0;

export const getAutoVoiceLimit = () => autoVoiceLimit;

export const setAutoVoiceLimit = (limit) => {
  autoVoiceLimit = typeof limit === 'number' && limit >= 0 ? limit : 1;
};

export const getAutoVoiceCount = () => autoVoiceCount;

export const resetAutoVoiceCount = () => {
  autoVoiceCount = 0;
};

let activeSpeakSessionId = 0;
const ttsAudioCache = new Map();

const splitTextIntoChunks = (text, maxLength = 150) => {
  if (text.length <= maxLength) return [text];

  const delimiters = /[।|.!?;:\n]/;
  const parts = text.split(delimiters);
  const chunks = [];
  let currentChunk = '';

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length + 1 <= maxLength) {
      currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
    } else {
      if (currentChunk) chunks.push(currentChunk);

      if (trimmed.length > maxLength) {
        const subParts = trimmed.split(/[,，、\s]+/);
        let subChunk = '';
        for (const word of subParts) {
          const wTrim = word.trim();
          if (!wTrim) continue;
          if (subChunk.length + wTrim.length + 1 <= maxLength) {
            subChunk = subChunk ? `${subChunk} ${wTrim}` : wTrim;
          } else {
            if (subChunk) chunks.push(subChunk);
            subChunk = wTrim;
          }
        }
        if (subChunk) currentChunk = subChunk;
      } else {
        currentChunk = trimmed;
      }
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
};

/**
 * Speak `input` (string or array of strings) in `lang` using native speech synthesis pipeline.
 * Sequential items (e.g. [birdMessage, questionText]) are spoken one after another.
 * Automatically spoken requests respect the automatic voice limit (default: 1).
 */
export const speakText = (input, lang, forceNativeOnly = false, isAuto = false) => new Promise((resolveOuter) => {
  if (isAuto) {
    if (autoVoiceCount >= autoVoiceLimit) {
      resolveOuter();
      return;
    }
    autoVoiceCount += 1;
  }

  stopSpeech(true);

  const items = (Array.isArray(input) ? input : [input])
    .map((item) => String(item || '').trim())
    .filter((item) => item.length > 0);

  if (items.length === 0) {
    resolveOuter();
    return;
  }

  const targetLang = String(lang || 'en').split('-')[0].split('_')[0].toLowerCase();

  activeSpeakSessionId += 1;
  const sessionId = activeSpeakSessionId;
  setSpeaking(true);

  const resolve = () => {
    if (sessionId === activeSpeakSessionId) setSpeaking(false);
    resolveOuter();
  };

  const playItemIndex = (itemIdx) => {
    if (sessionId !== activeSpeakSessionId || itemIdx >= items.length) {
      resolve();
      return;
    }

    const text = items[itemIdx];
    const chunks = splitTextIntoChunks(text, 150);

    const playChunkIndex = (index) => {
      if (sessionId !== activeSpeakSessionId) {
        resolve();
        return;
      }
      if (index >= chunks.length) {
        playItemIndex(itemIdx + 1);
        return;
      }

      const chunkText = chunks[index];
      let chunkHandled = false;

      const advanceToNext = () => {
        if (sessionId !== activeSpeakSessionId) {
          resolve();
          return;
        }
        if (chunkHandled) return;
        chunkHandled = true;
        playChunkIndex(index + 1);
      };

      const fallbackToWebSpeech = () => {
        if (sessionId !== activeSpeakSessionId || chunkHandled) return;
        speakNativeWebSpeech(chunkText, targetLang).then(() => {
          advanceToNext();
        }).catch(() => {
          advanceToNext();
        });
      };

      // Check in-memory audio cache first for instantaneous playback
      const cacheKey = `${targetLang}:${chunkText}`;
      if (ttsAudioCache.has(cacheKey)) {
        const cachedBase64 = ttsAudioCache.get(cacheKey);
        const sAudio = new Audio(`data:audio/mp3;base64,${cachedBase64}`);
        currentHtml5Audio = sAudio;
        pendingAudioObject = sAudio;

        sAudio.onended = () => {
          if (currentHtml5Audio === sAudio) currentHtml5Audio = null;
          if (pendingAudioObject === sAudio) pendingAudioObject = null;
          advanceToNext();
        };
        sAudio.onerror = () => fallbackToWebSpeech();

        sAudio.play().then(() => {
          pendingAudioObject = null;
        }).catch(() => {
          // Keep in pendingAudioObject for user gesture unlocker
        });
        return;
      }

      // Fetch authentic native pronunciation from backend Google TTS proxy
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('literaai_token') : null;
      fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: chunkText, language: targetLang }),
      })
        .then((res) => {
          if (sessionId !== activeSpeakSessionId) throw new Error('Cancelled');
          if (!res.ok) throw new Error('TTS endpoint failed');
          return res.json();
        })
        .then((data) => {
          if (sessionId !== activeSpeakSessionId || chunkHandled) return;
          if (!data.audio) throw new Error('No audio data returned');

          if (data.format === 'mp3') {
            ttsAudioCache.set(cacheKey, data.audio);
            const sAudio = new Audio(`data:audio/mp3;base64,${data.audio}`);
            currentHtml5Audio = sAudio;
            pendingAudioObject = sAudio;

            sAudio.onended = () => {
              if (currentHtml5Audio === sAudio) currentHtml5Audio = null;
              if (pendingAudioObject === sAudio) pendingAudioObject = null;
              advanceToNext();
            };
            sAudio.onerror = () => fallbackToWebSpeech();

            sAudio.play().then(() => {
              pendingAudioObject = null;
            }).catch(() => {
              // Gesture unlocker will trigger
            });
          } else {
            fallbackToWebSpeech();
          }
        })
        .catch(() => fallbackToWebSpeech());
    };

    playChunkIndex(0);
  };

  playItemIndex(0);
});

const TAMIL_PHONETIC_MAP = {
  // Letters
  'அ': ['a', 'ah', 'amma', 'an', 'aah'],
  'ஆ': ['aa', 'aadu', 'a', 'aah', 'aavanna'],
  'இ': ['i', 'ee', 'ilai', 'e', 'in'],
  'ஈ': ['ee', 'eetti', 'i', 'ea'],
  'உ': ['u', 'oo', 'ural', 'oo'],
  'ஊ': ['oo', 'oonjal', 'u'],
  'எ': ['e', 'eli', 'eh', 'ae'],
  'ஏ': ['ae', 'aeni', 'aey', 'e', 'ay'],
  'ஐ': ['ai', 'ainthu', 'eye', 'ay', 'i'],
  'ஒ': ['o', 'ottagam', 'oh'],
  'ஓ': ['oa', 'odam', 'oh', 'o'],
  'ஔ': ['au', 'avvaiyar', 'ow', 'ou'],
  'க்': ['ik', 'k', 'kokku', 'ikk', 'ka', 'kku', 'c'],
  'ங்': ['ing', 'ng', 'singam', 'nga', 'in'],
  'ச்': ['ich', 'ch', 'pachai', 'cha', 'sa', 'c'],
  'ஞ்': ['inj', 'nj', 'manjal', 'nya', 'in'],
  'ட்': ['it', 't', 'pattam', 'ta', 'tt'],
  'ண்': ['inn', 'nn', 'kan', 'na', 'n'],
  'த்': ['ith', 'th', 'nathai', 'tha'],
  'ந்': ['indh', 'nh', 'panthu', 'na', 'n', 'in'],
  'ப்': ['ip', 'p', 'kappal', 'pa', 'pp'],
  'ம்': ['im', 'm', 'maram', 'ma', 'mm'],
  'ய்': ['iy', 'y', 'naai', 'ya', 'i'],
  'ர்': ['ir', 'r', 'aer', 'ra'],
  'ல்': ['il', 'l', 'paal', 'la'],
  'வ்': ['iv', 'v', 'sevvanthi', 'va', 'w'],
  'ழ்': ['izh', 'zh', 'tamizh', 'zha', 'l', 'j'],
  'ள்': ['ill', 'll', 'vaal', 'la'],
  'ற்': ['irr', 'rr', 'kaatru', 'ra', 'tr'],
  'ன்': ['in', 'n', 'meen', 'na'],

  // Level 2 Words
  'அம்மா': ['amma', 'ama', 'mother', 'mom', 'uma', 'amaa'],
  'அப்பா': ['appa', 'apa', 'father', 'dad', 'abba', 'appaa'],
  'மரம்': ['maram', 'marm', 'tree', 'mara', 'maran'],
  'பூ': ['poo', 'pu', 'flower', 'phoo', 'fu', 'po'],
  'நாய்': ['naai', 'nai', 'naay', 'dog', 'nay', 'naa'],
  'பூனை': ['poonai', 'punai', 'poonay', 'cat', 'pune', 'ponai'],
  'வீடு': ['veedu', 'vidu', 'veetu', 'house', 'home', 'widu', 'veed'],
  'நீர்': ['neer', 'nir', 'water', 'thanneer', 'near', 'neer'],
  'புத்தகம்': ['puthagam', 'pusthakam', 'pusthak', 'book', 'puthakam', 'pustak'],
  'பள்ளி': ['palli', 'pally', 'pallikoodam', 'school', 'bali', 'pali'],

  // Level 3 Sentences Words
  'நான்': ['naan', 'nan', 'na', 'i'],
  'தினமும்': ['dhinamum', 'thinamum', 'dinamum', 'every', 'day'],
  'புதிய': ['puthiya', 'pudhiya', 'new'],
  'வார்த்தைகளை': ['vaarthaigalai', 'varthaigalai', 'words', 'vaarthai'],
  'கற்கிறேன்': ['karkiren', 'karkiraen', 'learn', 'karki'],
  'படிப்பதும்': ['padippadhum', 'padipathum', 'reading'],
  'எழுதுவதும்': ['ezhudhuvadhum', 'ezhuthuvathum', 'writing'],
  'அறிவை': ['arivai', 'knowledge', 'arivu'],
  'வளர்க்கும்': ['valarkkum', 'valarkum', 'build'],
  'கல்வி': ['kalvi', 'education'],
  'வெற்றியின்': ['vetriyin', 'success'],
  'அடித்தளம்': ['adithalam', 'foundation'],
  'ஆகும்': ['aagum', 'is'],
  'அறிவு': ['arivu', 'arive', 'knowledge'],
  'வாய்ப்புகளைத்': ['vaaippugalai', 'opportunities'],
  'திறக்கிறது': ['thirakkiradhu', 'opens'],
  'தொடர்ந்து': ['thodarnthu', 'continuous'],
  'பயிற்சி': ['payirchi', 'practice'],
  'செய்வது': ['seyvadhu', 'doing'],
  'முன்னேற்றத்தை': ['munnetrathai', 'progress'],
  'தருகிறது': ['tharugiradhu', 'brings'],
  'நல்ல': ['nalla', 'good'],
  'பழக்கங்கள்': ['pazhakkangal', 'habits'],
  'எதிர்காலத்தை': ['edhirkaalathai', 'future'],
  'உருவாக்கும்': ['uruvaakkum', 'builds'],
  'புத்தகங்கள்': ['puthagangal', 'books'],
  'நம்': ['nam', 'our'],
  'சிறந்த': ['sirantha', 'best'],
  'நண்பர்கள்': ['nanbargal', 'friends'],
  'தமிழ்': ['tamizh', 'tamil'],
  'மொழியை': ['mozhiyai', 'language'],
  'மகிழ்ச்சியுடன்': ['magizhchiyudan', 'joy'],
  'கடின': ['kadina', 'hard'],
  'உழைப்பு': ['uzhaippu', 'work'],
  'வெற்றியைத்': ['vetriyai', 'success'],
  'தரும்': ['tharum', 'gives'],
  'கற்றலுக்கு': ['katralukku', 'learning'],
  'முடிவு': ['mudivu', 'end'],
  'இல்லை': ['illai', 'no', 'never']
};

const TELUGU_PHONETIC_MAP = {
  // Letters (15 Achulu + 36 Hallulu)
  'అ': ['a', 'ah', 'amma', 'an', 'aa'],
  'ఆ': ['aa', 'aavu', 'a', 'aah'],
  'ఇ': ['i', 'ee', 'illu', 'e', 'in'],
  'ఈ': ['ee', 'eega', 'i', 'ea'],
  'ఉ': ['u', 'oo', 'udutha', 'oo'],
  'ఊ': ['oo', 'ooyala', 'u'],
  'ఋ': ['ru', 'rushi', 'rishi', 'ri'],
  'ఎ': ['e', 'eluka', 'eh', 'ae'],
  'ఏ': ['ae', 'enugu', 'aey', 'e', 'ay'],
  'ఐ': ['ai', 'aidu', 'eye', 'ay', 'i'],
  'ఒ': ['o', 'onte', 'oh'],
  'ఓ': ['oa', 'oda', 'oh', 'o'],
  'ఔ': ['au', 'aushadham', 'ow', 'ou'],
  'అం': ['am', 'ambaram', 'um'],
  'అః': ['aha', 'antahpuram'],

  'క': ['ka', 'kalam', 'k'],
  'ఖ': ['kha', 'khadgam', 'kh'],
  'గ': ['ga', 'gadiyaram', 'g'],
  'ఘ': ['gha', 'ghatam', 'gh'],
  'ఙ': ['nga', 'nya'],

  'చ': ['cha', 'chakram', 'ch'],
  'ఛ': ['chha', 'chhatram', 'chh'],
  'జ': ['ja', 'jada', 'j'],
  'ఝ': ['jha', 'jhasham', 'jh'],
  'ఞ': ['nya', 'jna'],

  'ట': ['ta', 'tapakaya', 't'],
  'ఠ': ['tha', 'kantham', 'th'],
  'డ': ['da', 'damarukam', 'd'],
  'ఢ': ['dha', 'dhanka', 'dh'],
  'ణ': ['na', 'banam', 'n'],

  'త': ['tha', 'tabala', 'th'],
  'థ': ['thha', 'ratham', 'th'],
  'ద': ['da', 'danda', 'd'],
  'ధ': ['dha', 'dhanussu', 'dh'],
  'న': ['na', 'nakka', 'n'],

  'ప': ['pa', 'palaka', 'p'],
  'ఫ': ['pha', 'phalam', 'ph', 'fa'],
  'బ': ['ba', 'banthi', 'b'],
  'భ': ['bha', 'bharani', 'bh'],
  'మ': ['ma', 'mancham', 'm'],

  'య': ['ya', 'yagnam', 'y'],
  'ర': ['ra', 'ratnam', 'r'],
  'ల': ['la', 'latha', 'l'],
  'వ': ['va', 'vala', 'v', 'w'],

  'శ': ['sha', 'shankham', 'sh'],
  'ష': ['ssha', 'shatkonam', 'sh'],
  'స': ['sa', 'sanchi', 's'],
  'హ': ['ha', 'hamsa', 'h'],

  'ళ': ['la', 'talam', 'll'],
  'క్ష': ['ksha', 'vruksham', 'x'],
  'ఱ': ['rra', 'gurram', 'rr'],

  // Level 2 Words
  'అమ్మ': ['amma', 'ama', 'mother', 'mom', 'uma', 'amaa'],
  'నాన్న': ['nanna', 'nana', 'father', 'dad', 'abba'],
  'చెట్టు': ['chettu', 'chetu', 'tree', 'vruksham', 'mara'],
  'పువ్వు': ['puvvu', 'puwu', 'flower', 'poo', 'pushpam'],
  'కుక్క': ['kukka', 'kuka', 'dog', 'kutta', 'shwanam'],
  'పిల్లి': ['pilli', 'pili', 'cat', 'billi', 'marjalam'],
  'ఇల్లు': ['illu', 'ilu', 'house', 'home', 'gruham'],
  'నీరు': ['neeru', 'niru', 'water', 'jalam', 'pani'],
  'పుస్తకం': ['pusthakam', 'pustakam', 'pustak', 'book', 'grantham'],
  'పాఠశాల': ['paatasaala', 'patasala', 'pathashala', 'school', 'badi', 'vidyalayam'],

  // Level 3 Sentences Words
  'నేను': ['nenu', 'nen', 'i'],
  'ప్రతిరోజూ': ['prathiroju', 'pratiroju', 'daily', 'everyday'],
  'కొత్త': ['kottha', 'kotha', 'new'],
  'పదాలను': ['padalanu', 'padalu', 'words'],
  'నేర్చుకుంటాను': ['nerchukuntanu', 'nerchukunta', 'learn'],
  'చదవడం': ['chadhavadam', 'chadavadam', 'reading'],
  'మరియు': ['mariyu', 'and'],
  'వ్రాయడం': ['vrayadam', 'rayadam', 'writing'],
  'జ్ఞానాన్ని': ['gnananni', 'jnananni', 'knowledge'],
  'పెంచుతాయి': ['penchutayi', 'increases'],
  'విద్య': ['vidhya', 'vidya', 'education'],
  'విజయానికి': ['vijayaniki', 'for success'],
  'పునాది': ['punaadi', 'punadi', 'foundation'],
  'జ్ఞానం': ['gnanam', 'jnanam', 'knowledge'],
  'అవకాశాలను': ['avakashalanu', 'opportunities'],
  'తెరుస్తుంది': ['terusthundhi', 'terustundi', 'opens'],
  'నిరంతర': ['niranthara', 'continuous'],
  'సాధన': ['sadhana', 'practice'],
  'అభివృద్ధికి': ['abhivruddhiki', 'progress', 'development'],
  'దారి': ['daari', 'way'],
  'తీస్తుంది': ['theesthundhi', 'teestundi', 'leads'],
  'మంచి': ['manchi', 'good'],
  'అలవాట్లు': ['alavaatlu', 'alavatlu', 'habits'],
  'భవిష్యత్తును': ['bhavishyatthunu', 'future'],
  'నిర్మిస్తాయి': ['nirmisthayi', 'nirmistayi', 'builds'],
  'పుస్తకాలు': ['pusthakalu', 'pustakalu', 'books'],
  'మనకు': ['manaku', 'to us'],
  'స్నేహితులు': ['snehithulu', 'snehitulu', 'friends'],
  'తెలుగు': ['telugu', 'theelugu'],
  'భాషను': ['bhashanu', 'language'],
  'ఆనందంగా': ['anandamga', 'happily', 'joyfully'],
  'నేర్చుకుంటున్నాను': ['nerchukuntunnanu', 'learning'],
  'కష్టపడి': ['kashtapadi', 'hard'],
  'పని': ['pani', 'work'],
  'చేస్తే': ['chesthe', 'if done'],
  'విజయం': ['vijayam', 'success'],
  'సాధించవచ్చు': ['sadhinchavachhu', 'can achieve'],
  'నేర్చుకోవడానికి': ['nerchukovadaniki', 'for learning'],
  'అంతం': ['antham', 'antam', 'end'],
  'లేదు': ['ledhu', 'ledu', 'no']
};

const MALAYALAM_PHONETIC_MAP = {
  // 15 Vowels
  'അ': ['a', 'ah', 'amma', 'an', 'aah', 'uh', 'അ', 'അമ്മ', 'ആ', 'അക്ഷരം', 'അക്ഷരം അ'],
  'ആ': ['aa', 'aana', 'a', 'aah', 'aavanna', 'ആ', 'ആന'],
  'ഇ': ['i', 'ee', 'ila', 'e', 'in', 'ഇ', 'ഇല', 'ഈ'],
  'ഈ': ['ee', 'eecha', 'i', 'ea', 'ഈ', 'ഈച്ച'],
  'ഉ': ['u', 'oo', 'urumpu', 'ഉ', 'ഉറുമ്പ്', 'ഊ'],
  'ഊ': ['oo', 'oonjal', 'u', 'ഊ', 'ഊഞ്ഞാൽ'],
  'ഋ': ['ri', 'ru', 'rishi', 'ഋ', 'ഋഷി', 'രി'],
  'എ': ['e', 'eli', 'eh', 'ae', 'എ', 'എലി', 'ഏ'],
  'ഏ': ['ae', 'eni', 'aey', 'e', 'ay', 'ഏ', 'ഏണി'],
  'ഐ': ['ai', 'ice', 'eye', 'ay', 'i', 'ഐ', 'ഐസ്'],
  'ഒ': ['o', 'ottakam', 'oh', 'ഒ', 'ഒട്ടകം', 'ഓ'],
  'ഓ': ['oa', 'odam', 'oh', 'o', 'ഓ', 'ഓടം'],
  'ഔ': ['au', 'oushadham', 'ow', 'ou', 'ഔ', 'ഔഷധം'],
  'അം': ['am', 'ambalam', 'um', 'ang', 'അം', 'അമ്പലം', 'അംബലം'],
  'അഃ': ['aha', 'ahaa', 'ah', 'അഃ', 'അഹ'],

  // 36 Consonants
  'ക': ['ka', 'kannu', 'k', 'kaa', 'ക', 'കണ്ണ്', 'ഖ', 'ഗ'],
  'ഖ': ['kha', 'khadgam', 'kh', 'ഖ', 'ഖഡ്ഗം', 'ക', 'ഗ'],
  'ഗ': ['ga', 'gajam', 'g', 'ഗ', 'ഗജം', 'ഘ', 'ക'],
  'ഘ': ['gha', 'ghadikaram', 'gh', 'ഘ', 'ഘടികാരം', 'ഗ', 'ക'],
  'ങ': ['nga', 'ng', 'maanga', 'ങ', 'മാങ്ങ', 'ങ്ങ'],
  'ച': ['cha', 'chakram', 'ch', 'ച', 'ചക്രം', 'ഛ', 'ജ'],
  'ഛ': ['chha', 'chhathram', 'chh', 'ഛ', 'ഛത്രം', 'ച'],
  'ജ': ['ja', 'jalam', 'j', 'ജ', 'ജലം', 'ഝ', 'ച'],
  'ഝ': ['jha', 'jhasham', 'jh', 'ഝ', 'ഝഷം', 'ജ'],
  'ഞ': ['nya', 'njandu', 'nj', 'ഞ', 'ഞണ്ട്', 'ഞ്ഞ'],
  'ട': ['ta', 'tomato', 't', 'ട', 'ടമാറ്റോ', 'ടോർച്ച്', 'ഠ', 'ഡ'],
  'ഠ': ['ttha', 'tth', 'paadam', 'ഠ', 'പാഠം', 'ട'],
  'ഡ': ['da', 'dappi', 'd', 'ഡ', 'ഡപ്പി', 'ഢ', 'ട'],
  'ഢ': ['dha', 'dhakka', 'dh', 'ഢ', 'ഢക്ക', 'ഡ'],
  'ണ': ['na', 'panam', 'n', 'ണ', 'പണം', 'ന'],
  'ത': ['tha', 'thatha', 'th', 'ത', 'തത്ത', 'ഥ', 'ദ'],
  'ഥ': ['thha', 'ratham', 'thh', 'ഥ', 'രഥം', 'ത'],
  'ദ': ['da', 'deepam', 'd', 'ദ', 'ദീപം', 'ധ', 'ത'],
  'ധ': ['dha', 'dhanussu', 'dh', 'ധ', 'ധനുസ്സ്', 'ദ'],
  'ന': ['na', 'nakshathram', 'n', 'ന', 'നക്ഷത്രം', 'ണ'],
  'പ': ['pa', 'panthu', 'p', 'പ', 'പന്ത്', 'ഫ', 'ബ'],
  'ഫ': ['pha', 'phalam', 'fa', 'f', 'ഫ', 'ഫലം', 'പ'],
  'ബ': ['ba', 'bus', 'b', 'ബ', 'ബസ്', 'ഭ', 'പ'],
  'ഭ': ['bha', 'bharatham', 'bh', 'ഭ', 'ഭാരതം', 'ബ'],
  'മ': ['ma', 'maram', 'm', 'മ', 'മരം'],
  'യ': ['ya', 'yaathra', 'y', 'യ', 'യാത്ര'],
  'ര': ['ra', 'ratham', 'r', 'ര', 'രഥം', 'റ'],
  'ല': ['la', 'laddu', 'l', 'ല', 'ലഡ്ഡു', 'ള'],
  'വ': ['va', 'vandi', 'v', 'w', 'വ', 'വണ്ടി'],
  'ശ': ['sha', 'shankh', 'sh', 'ശ', 'ശംഖ്', 'ഷ', 'സ'],
  'ഷ': ['ssha', 'shadpadam', 'sh', 'ഷ', 'ഷഡ്പദം', 'ശ'],
  'സ': ['sa', 'sooryan', 's', 'സ', 'സൂര്യൻ', 'ശ'],
  'ഹ': ['ha', 'hamsam', 'h', 'ഹ', 'ഹംസം'],
  'ള': ['la', 'vaal', 'll', 'ള', 'വാൾ', 'ല'],
  'ഴ': ['zha', 'mazha', 'zh', 'ഴ', 'മഴ', 'ള', 'റ'],
  'റ': ['ra', 'parava', 'rr', 'റ', 'പറവ', 'ര'],
  'ക്ഷ': ['ksha', 'vriksham', 'ksh', 'ക്ഷ', 'വൃക്ഷം'],

  // 10 Words
  'അമ്മ': ['amma', 'mother', 'mom', 'അമ്മ'],
  'അച്ഛൻ': ['achhan', 'achan', 'father', 'dad', 'അച്ഛൻ'],
  'മരം': ['maram', 'tree', 'മരം'],
  'പൂവ്': ['poovu', 'poov', 'flower', 'പൂവ്'],
  'നായ': ['naaya', 'naya', 'dog', 'നായ'],
  'പൂച്ച': ['poocha', 'cat', 'പൂച്ച'],
  'വീട്': ['veedu', 'veed', 'house', 'home', 'വീട്'],
  'വെള്ളം': ['vellam', 'water', 'വെള്ളം'],
  'പുസ്തകം': ['pusthakam', 'pustakam', 'book', 'പുസ്തകം'],
  'സ്കൂൾ': ['school', 'skool', 'സ്കൂൾ']
};

const KANNADA_PHONETIC_MAP = {
  // 15 Vowels
  'ಅ': ['a', 'ah', 'amma', 'an', 'aah', 'uh', 'ಅ', 'ಅಮ್ಮ', 'ಆ', 'ಅಕ್ಷರ'],
  'ಆ': ['aa', 'aane', 'a', 'aah', 'ಆ', 'ಆನೆ'],
  'ಇ': ['i', 'ee', 'ili', 'e', 'in', 'ಇ', 'ಇಲಿ', 'ಈ'],
  'ಈ': ['ee', 'eeju', 'i', 'ea', 'ಈ', 'ಈಜು'],
  'ಉ': ['u', 'oo', 'udupu', 'ಉ', 'ಉಡುಪು', 'ಊ'],
  'ಊ': ['oo', 'oota', 'u', 'ಊ', 'ಊಟ'],
  'ಋ': ['ru', 'ri', 'rushi', 'rishi', 'ಋ', 'ಋಷಿ'],
  'ಎ': ['e', 'ele', 'eh', 'ae', 'ಎ', 'ಎಲೆ', 'ಏ'],
  'ಏ': ['ae', 'eni', 'aey', 'e', 'ay', 'ಏ', 'ಏಣಿ'],
  'ಐ': ['ai', 'aidu', 'eye', 'ay', 'i', 'ಐ', 'ಐದು'],
  'ಒ': ['o', 'onte', 'oh', 'ಒ', 'ಒಂಟೆ', 'ಓ'],
  'ಓ': ['oa', 'oodu', 'odu', 'oh', 'o', 'ಓ', 'ಓದು'],
  'ಔ': ['au', 'aushadha', 'ow', 'ou', 'ಔ', 'ಔಷಧ'],
  'ಅಂ': ['am', 'ambara', 'um', 'ang', 'ಅಂ', 'ಅಂಬರ'],
  'ಅಃ': ['aha', 'ahaa', 'ah', 'ಅಃ'],

  // 36 Consonants
  'ಕ': ['ka', 'kamala', 'k', 'kaa', 'ಕ', 'ಕಮಲ', 'ಖ', 'ಗ'],
  'ಖ': ['kha', 'khadga', 'kh', 'ಖ', 'ಖಡ್ಗ', 'ಕ', 'ಗ'],
  'ಗ': ['ga', 'gadiyara', 'g', 'ಗ', 'ಗಡಿಯಾರ', 'ಘ', 'ಕ'],
  'ಘ': ['gha', 'ghante', 'gh', 'ಘ', 'ಘಂಟೆ', 'ಗ', 'ಕ'],
  'ಙ': ['nga', 'ng', 'ಙ'],
  'ಚ': ['cha', 'chakra', 'ch', 'ಚ', 'ಚಕ್ರ', 'ಛ', 'ಜ'],
  'ಛ': ['chha', 'chhatri', 'chh', 'ಛ', 'ಛತ್ರಿ', 'ಚ'],
  'ಜ': ['ja', 'jade', 'j', 'ಜ', 'ಜಡೆ', 'ಝ', 'ಚ'],
  'ಝ': ['jha', 'jhari', 'jh', 'ಝ', 'ಝರಿ', 'ಜ'],
  'ಞ': ['nya', 'ಞ'],
  'ಟ': ['ta', 'tomato', 't', 'ಟ', 'ಟೊಮೆಟೊ', 'ಠ', 'ಡ'],
  'ಠ': ['ttha', 'tth', 'kantha', 'ಠ', 'ಕಂಠ', 'ಟ'],
  'ಡ': ['da', 'damaru', 'd', 'ಡ', 'ಡಮರು', 'ಢ', 'ಟ'],
  'ಢ': ['dha', 'dhakke', 'dh', 'ಢ', 'ಢಕ್ಕೆ', 'ಡ'],
  'ಣ': ['na', 'baana', 'bana', 'n', 'ಣ', 'ಬಾಣ', 'ನ'],
  'ತ': ['tha', 'tabala', 'th', 'ತ', 'ತಬಲ', 'ಥ', 'ದ'],
  'ಥ': ['thha', 'ratha', 'thh', 'ಥ', 'ರಥ', 'ತ'],
  'ದ': ['da', 'deepa', 'd', 'ದ', 'ದೀಪ', 'ಧ', 'ತ'],
  'ಧ': ['dha', 'dhanussu', 'dh', 'ಧ', 'ಧನುಸ್ಸು', 'ದ'],
  'ನ': ['na', 'navilu', 'n', 'ನ', 'ನವಿಲು', 'ಣ'],
  'ಪ': ['pa', 'pata', 'p', 'ಪ', 'ಪಟ', 'ಫ', 'ಬ'],
  'ಫ': ['pha', 'phala', 'fa', 'f', 'ಫ', 'ಫಲ', 'ಪ'],
  'ಬ': ['ba', 'bassu', 'bus', 'b', 'ಬ', 'ಬಸ್ಸು', 'ಭ', 'ಪ'],
  'ಭ': ['bha', 'bharatha', 'bharata', 'bh', 'ಭ', 'ಭಾರತ', 'ಬ'],
  'ಮ': ['ma', 'mara', 'm', 'ಮ', 'ಮರ'],
  'ಯ': ['ya', 'yajna', 'y', 'ಯ', 'ಯಜ್ಞ'],
  'ರ': ['ra', 'ratna', 'r', 'ರ', 'ರತ್ನ'],
  'ಲ': ['la', 'laddu', 'l', 'ಲ', 'ಲಡ್ಡು', 'ಳ'],
  'ವ': ['va', 'vana', 'v', 'w', 'ವ', 'ವನ'],
  'ಶ': ['sha', 'shankha', 'sh', 'ಶ', 'ಶಂಖ', 'ಷ', 'ಸ'],
  'ಷ': ['ssha', 'shatkona', 'sh', 'ಷ', 'ಷಟ್ಕೋನ', 'ಶ'],
  'ಸ': ['sa', 'soorya', 'surya', 's', 'ಸ', 'ಸೂರ್ಯ', 'ಶ'],
  'ಹ': ['ha', 'hamsa', 'h', 'ಹ', 'ಹಂಸ'],
  'ಳ': ['la', 'beega', 'll', 'ಳ', 'ಬೀಗ', 'ಲ'],
  'ಕ್ಷ': ['ksha', 'vruksha', 'ksh', 'ಕ್ಷ', 'ವೃಕ್ಷ'],
  'ಜ್ಞ': ['jna', 'jnana', 'gyana', 'ಜ್ಞ', 'ಜ್ಞಾನ'],

  // 10 Words
  'ಅಮ್ಮ': ['amma', 'mother', 'mom', 'ಅಮ್ಮ'],
  'ಅಪ್ಪ': ['appa', 'father', 'dad', 'ಅಪ್ಪ'],
  'ಮರ': ['mara', 'tree', 'ಮರ'],
  'ಹೂವು': ['hoovu', 'hoovu', 'flower', 'ಹೂವು'],
  'ನಾಯಿ': ['naayi', 'nayi', 'dog', 'ನಾಯಿ'],
  'ಬೆಕ್ಕು': ['bekku', 'cat', 'ಬೆಕ್ಕು'],
  'ಮನೆ': ['mane', 'house', 'home', 'ಮನೆ'],
  'ನೀರು': ['neeru', 'niru', 'water', 'ನೀರು'],
  'ಪುಸ್ತಕ': ['pusthaka', 'pustaka', 'book', 'ಪುಸ್ತಕ'],
  'ಶಾಲೆ': ['shaale', 'shale', 'school', 'ಶಾಲೆ'],

  // Sentence Words
  'ನಾನು': ['naanu', 'nanu', 'i'],
  'ಪ್ರತಿದಿನ': ['prathidina', 'pratidina', 'everyday'],
  'ಹೊಸ': ['hosa', 'new'],
  'ಪದಗಳನ್ನು': ['padagalannu', 'words'],
  'ಕಲಿಯುತ್ತೇನೆ': ['kaliyuttene', 'kaliyuthene', 'learn'],
  'ಓದುವುದು': ['oduvudu', 'reading'],
  'ಮತ್ತು': ['mattu', 'and'],
  'ಬರೆಯುವುದು': ['bareyuvudu', 'writing'],
  'ಜ್ಞಾನವನ್ನು': ['jnanavannu', 'knowledge'],
  'ಹೆಚ್ಚಿಸುತ್ತದೆ': ['hecchisuttade', 'increases'],
  'ಶಿಕ್ಷಣವು': ['shikshanavu', 'education'],
  'ಯಶಸ್ಸಿನ': ['yashassina', 'success'],
  'ಅಡಿಪಾಯವಾಗಿದೆ': ['adipaayavaagide', 'foundation'],
  'ಜ್ಞಾನವು': ['jnanavu', 'knowledge'],
  'ಅವಕಾಶಗಳನ್ನು': ['avakaashagalannu', 'opportunities'],
  'ತೆರೆದಿಡುತ್ತದೆ': ['terediduttade', 'opens'],
  'ನಿರಂತರ': ['nirantara', 'continuous'],
  'ಅಭ್ಯಾಸವು': ['abhyasavu', 'practice'],
  'ಪ್ರಗತಿಗೆ': ['pragatige', 'progress'],
  'ದಾರಿ': ['daari', 'dari', 'way'],
  'ಮಾಡುತ್ತದೆ': ['maaduttade', 'leads'],
  'ಉತ್ತಮ': ['uttama', 'good'],
  'ಅಭ್ಯಾಸಗಳು': ['abhyasagalu', 'habits'],
  'ಭವಿಷ್ಯವನ್ನು': ['bhavishyavannu', 'future'],
  'ನಿರ್ಮಿಸುತ್ತವೆ': ['nirmisuttave', 'builds'],
  'ಪುಸ್ತಕಗಳು': ['pusthakagalu', 'pustakagalu', 'books'],
  'ನಮ್ಮ': ['namma', 'our'],
  'ಸ್ನೇಹಿತರು': ['snehitaru', 'friends'],
  'ಕನ್ನಡವನ್ನು': ['kannadavannu', 'kannada'],
  'ಸಂತೋಷದಿಂದ': ['santhoshadinda', 'happily'],
  'ಕಠಿಣ': ['kathina', 'hard'],
  'ಪರಿಶ್ರಮವು': ['parishramavu', 'effort'],
  'ಯಶಸ್ಸಿಗೆ': ['yashassige', 'success'],
  'ಕಲಿಕೆಗೆ': ['kalikege', 'learning'],
  'ಅಂತ್ಯವಿಲ್ಲ': ['antyavilla', 'no end']
};

export const HINDI_PHONETIC_MAP = {
  // Swar (13)
  'अ': ['a', 'ah', 'anar', 'अनार'],
  'आ': ['aa', 'aam', 'आम'],
  'इ': ['i', 'ee', 'imli', 'इमली'],
  'ई': ['ee', 'ii', 'eekh', 'ईख'],
  'उ': ['u', 'oo', 'ullu', 'उल्लू'],
  'ऊ': ['oo', 'uu', 'oon', 'ऊन'],
  'ऋ': ['ri', 'ru', 'rishi', 'ऋषि'],
  'ए': ['e', 'ae', 'edi', 'aedi', 'एड़ी'],
  'ऐ': ['ai', 'ei', 'ainak', 'ऐनक'],
  'ओ': ['o', 'oh', 'okhli', 'ओखली'],
  'औ': ['au', 'ow', 'ou', 'aurat', 'औरत'],
  'अं': ['am', 'an', 'angoor', 'अंगूर'],
  'अः': ['aha', 'ah', 'ahaa'],

  // Vyanjan (36)
  'क': ['ka', 'k', 'kamal', 'कमल'],
  'ख': ['kha', 'kh', 'khargosh', 'खरगोश'],
  'ग': ['ga', 'g', 'gamla', 'गमला'],
  'घ': ['gha', 'gh', 'ghadi', 'घड़ी'],
  'ङ': ['nga', 'ng'],
  'च': ['cha', 'ch', 'chammach', 'चम्मच'],
  'छ': ['chha', 'chh', 'chhata', 'छाता'],
  'ज': ['ja', 'j', 'jahaj', 'जहाज'],
  'झ': ['jha', 'jh', 'jhanda', 'झंडा'],
  'ञ': ['nya', 'ny'],
  'ट': ['ta', 't', 'tamatar', 'टमाटर'],
  'ठ': ['ttha', 'tth', 'thathera', 'ठठेरा'],
  'ड': ['da', 'd', 'damru', 'डमरू'],
  'ढ': ['dha', 'dh', 'dhakkan', 'ढक्कन'],
  'ण': ['na', 'n', 'baan', 'बाण'],
  'त': ['tha', 'th', 'tarbooj', 'तरबूज'],
  'थ': ['thha', 'thh', 'tharmas', 'थर्मस'],
  'द': ['da', 'd', 'dawaat', 'दवात'],
  'ध': ['dha', 'dh', 'dhanush', 'धनुष'],
  'न': ['na', 'n', 'nal', 'नल'],
  'प': ['pa', 'p', 'patang', 'पतंग'],
  'फ': ['pha', 'ph', 'fal', 'फल'],
  'ब': ['ba', 'b', 'bus', 'बस'],
  'भ': ['bha', 'bh', 'bhalu', 'भालू'],
  'म': ['ma', 'm', 'machhli', 'मछली'],
  'य': ['ya', 'y', 'yajna', 'यज्ञ'],
  'र': ['ra', 'r', 'rath', 'रथ'],
  'ल': ['la', 'l', 'lattu', 'लट्टू'],
  'व': ['va', 'v', 'van', 'वन'],
  'श': ['sha', 'sh', 'shankh', 'शंख'],
  'ष': ['ssha', 'sh', 'shatkon', 'षट्कोण'],
  'स': ['sa', 's', 'seb', 'सेब'],
  'ह': ['ha', 'h', 'haathi', 'हाथी'],
  'क्ष': ['ksha', 'ksh', 'kshatriya', 'क्षत्रिय'],
  'त्र': ['tra', 'tr', 'trishul', 'त्रिशूल'],
  'ज्ञ': ['gya', 'gy', 'gyani', 'ज्ञानी'],

  // Words (10)
  'माँ': ['maa', 'ma', 'mata', 'मां', 'मा', 'माता', 'मैया', 'mother'],
  'मां': ['maa', 'ma', 'mata', 'माँ', 'मा', 'माता', 'mother'],
  'पिता': ['pita', 'baap', 'pitaji', 'पिताजी', 'बाप', 'father'],
  'पेड़': ['ped', 'per', 'पेड़', 'पेड', 'tree'],
  'पेड़': ['ped', 'per', 'पेड़', 'पेड', 'tree'],
  'फूल': ['phool', 'fool', 'phul', 'फुल', 'फ़ूल', 'flower'],
  'कुत्ता': ['kutta', 'kuta', 'कुता', 'dog'],
  'बिल्ली': ['billi', 'bili', 'बिली', 'cat'],
  'घर': ['ghar', 'makan', 'मकान', 'house', 'home'],
  'पानी': ['paani', 'pani', 'जल', 'नीर', 'jal', 'water'],
  'पुस्तक': ['pustak', 'kitab', 'किताब', 'book'],
  'विद्यालय': ['vidyalaya', 'vidhyalay', 'स्कूल', 'पाठशाला', 'school'],

  // Sentences words
  'मैं': ['main', 'mai', 'मै', 'मे', 'i'],
  'हर': ['har', 'every'],
  'दिन': ['din', 'roz', 'रोज़', 'day'],
  'नए': ['naye', 'nae', 'नये', 'नया', 'new'],
  'शब्द': ['shabd', 'shabda', 'words', 'word'],
  'सीखता': ['seekhta', 'sikhta', 'seekhti', 'sikhti', 'सीखती', 'learn'],
  'सीखती': ['seekhti', 'sikhti', 'seekhta', 'sikhta', 'सीखता'],
  'हूँ': ['hoon', 'hun', 'hu', 'हूं', 'हु', 'हूँ'],
  'हूं': ['hoon', 'hun', 'hu', 'हूँ', 'हु'],
  'पढ़ना': ['padhna', 'parhna', 'padna', 'पढ़ना', 'पडना', 'read', 'reading'],
  'और': ['aur', 'or', 'evam', 'एवं', 'and'],
  'लिखना': ['likhna', 'likna', 'write', 'writing'],
  'ज्ञान': ['gyan', 'gnyan', 'jnan', 'ग्यान', 'knowledge'],
  'बढ़ाता': ['badhata', 'badhta', 'barhata', 'बढ़اتا', 'बढाता'],
  'है': ['hai', 'he', 'is'],
  'शिक्षा': ['shiksha', 'siksha', 'shikshya', 'education'],
  'सफलता': ['safalta', 'saphalta', 'success'],
  'की': ['ki', 'kee', 'of'],
  'नींव': ['neev', 'neenv', 'नीव', 'foundation'],
  'अवसरों': ['avsaron', 'avsaro', 'avsar', 'अवसरो', 'अवसर', 'opportunities'],
  'के': ['ke'],
  'द्वार': ['dwaar', 'dwar', 'darwaza', 'दरवाजा', 'doors'],
  'खोलता': ['kholta', 'kholti', 'खोलती', 'opens'],
  'निरंतर': ['nirantar', 'lagatar', 'लगातार', 'निरन्तर', 'continuous'],
  'अभ्यास': ['abhyas', 'abhyasa', 'practice'],
  'प्रगति': ['pragati', 'progress'],
  'ओर': ['or', 'aur', 'towards'],
  'ले': ['le'],
  'जाता': ['jaata', 'jata', 'jati', 'जाती', 'leads'],
  'अच्छी': ['achhi', 'acchi', 'acche', 'अच्छे', 'good'],
  'आदतें': ['aadatein', 'aadate', 'adatein', 'adate', 'आदते', 'habits'],
  'उज्ज्वल': ['ujjwal', 'ujwal', 'ujjaval', 'उज्वल', 'bright'],
  'भविष्य': ['bhavishya', 'future'],
  'बनाती': ['banati', 'banata', 'बनाता', 'builds'],
  'हैं': ['hain', 'hai', 'है', 'are'],
  'पुस्तकें': ['pustakein', 'pustake', 'kitabein', 'kitabe', 'पुस्तके', 'किताबें', 'books'],
  'हमारी': ['hamari', 'humari', 'our'],
  'सबसे': ['sabse', 'best'],
  'मित्र': ['mitra', 'dost', 'दोस्त', 'friends'],
  'खुशी': ['khushi', 'khusi', 'ख़ुशी', 'खुसी', 'happily'],
  'से': ['se', 'with'],
  'हिंदी': ['hindi', 'हिन्दी'],
  'सीख': ['seekh', 'sikh'],
  'रहा': ['raha', 'rahi', 'रही'],
  'रही': ['rahi', 'raha', 'रहा'],
  'कड़ी': ['kadi', 'kadee', 'kari', 'कड़ी', 'कडी', 'hard'],
  'मेहनत': ['mehnat', 'mehanat', 'work'],
  'दिलाती': ['dilati', 'dilata', 'दिलाता', 'leads'],
  'सीखने': ['seekhne', 'sikhne', 'learning'],
  'का': ['ka', 'of'],
  'कभी': ['kabhi', 'ever'],
  'अंत': ['ant', 'aant', 'अन्त', 'end'],
  'नहीं': ['nahi', 'nahin', 'नही', 'not', 'no'],
  'होता': ['hota', 'hoti', 'होती']
};

export const gradePronunciation = (original, spoken, variants = []) => {
  const cleanString = (str) => String(str || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_~`()?।॥]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const devanagariNormalize = (str) => cleanString(str)
    .replace(/\u0901/g, '\u0902')
    .replace(/[\u093C]/g, '');

  const origClean = cleanString(original);
  const spokenClean = cleanString(spoken);

  if (!origClean || !spokenClean) return { score: 0, words: [] };

  const origDeva = devanagariNormalize(original);
  const spokenDeva = devanagariNormalize(spoken);

  // Full-match shortcut
  if (origClean === spokenClean || origDeva === spokenDeva) {
    return {
      score: 100,
      words: origClean.split(' ').map(text => ({ text, correct: true }))
    };
  }

  const origWords = origClean.split(' ').filter(Boolean);
  const spokenWords = spokenClean.split(' ').filter(Boolean);
  const spokenDevaWords = spokenDeva.split(' ').filter(Boolean);

  if (origWords.length === 0) return { score: 100, words: [] };

  const cleanVariants = (Array.isArray(variants) ? variants : []).map(cleanString).filter(Boolean);
  const devaVariants = (Array.isArray(variants) ? variants : []).map(devanagariNormalize).filter(Boolean);

  // Single letter/word instant evaluation
  if (origWords.length === 1) {
    const target = origWords[0];
    const targetDeva = devanagariNormalize(target);
    const phonetics = (HINDI_PHONETIC_MAP[target] || KANNADA_PHONETIC_MAP[target] || MALAYALAM_PHONETIC_MAP[target] || TAMIL_PHONETIC_MAP[target] || TELUGU_PHONETIC_MAP[target] || []).map(cleanString);
    const validMatches = [target, targetDeva, ...phonetics, ...cleanVariants, ...devaVariants];

    const matchFound = spokenWords.some(sw => {
      const swDeva = devanagariNormalize(sw);
      return validMatches.some(vm => {
        if (!vm) return false;
        if (sw === vm || swDeva === vm || spokenClean === vm || spokenDeva === vm) return true;
        if (sw.includes(vm) || vm.includes(sw)) return true;
        if (swDeva.includes(vm) || vm.includes(swDeva)) return true;
        if (spokenClean.includes(vm) || vm.includes(spokenClean)) return true;
        if (spokenDeva.includes(vm) || vm.includes(spokenDeva)) return true;
        return false;
      });
    });

    if (matchFound) {
      return { score: 100, words: [{ text: target, correct: true }] };
    }
  }

  const gradedWords = origWords.map((origW) => {
    const origWDeva = devanagariNormalize(origW);
    const wordPhonetics = (HINDI_PHONETIC_MAP[origW] || KANNADA_PHONETIC_MAP[origW] || TAMIL_PHONETIC_MAP[origW] || TELUGU_PHONETIC_MAP[origW] || MALAYALAM_PHONETIC_MAP[origW] || []).map(cleanString);
    const allExpected = [origW, origWDeva, ...wordPhonetics, ...cleanVariants, ...devaVariants];

    const isCorrect = spokenWords.some((spokenW, idx) => {
      const spokenWDeva = spokenDevaWords[idx] || devanagariNormalize(spokenW);
      return allExpected.some((expected) => {
        if (!expected) return false;
        if (spokenW === expected || spokenWDeva === expected) return true;
        if (spokenClean === expected || spokenDeva === expected) return true;
        if (spokenW.includes(expected) || expected.includes(spokenW)) return true;
        if (spokenWDeva.includes(expected) || expected.includes(spokenWDeva)) return true;
        if (spokenClean.includes(expected) || expected.includes(spokenClean)) return true;
        if (spokenDeva.includes(expected) || expected.includes(spokenDeva)) return true;
        return false;
      });
    });

    return { text: origW, correct: isCorrect };
  });

  const correctCount = gradedWords.filter((w) => w.correct).length;
  let score = Math.round((correctCount / origWords.length) * 100);

  if (score < 70 && (
    cleanVariants.some(v => spokenClean.includes(v) || v.includes(spokenClean)) ||
    devaVariants.some(v => spokenDeva.includes(v) || v.includes(spokenDeva))
  )) {
    score = 100;
    gradedWords.forEach(w => { w.correct = true; });
  }

  return { score, words: gradedWords };
};
