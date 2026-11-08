export type PersonaPreset = 'arushi' | 'professional' | 'mentor' | 'funny' | 'custom';
export type LanguageMode = 'auto' | 'hindi' | 'english' | 'hinglish';
export type ReplyLength = 'short' | 'balanced' | 'detailed';
export type ProviderId = 'gemini' | 'grok' | 'sarvam';

export interface AppSettings {
  assistantName: string;
  userName: string;
  preset: PersonaPreset;
  customPersona: string;
  extraInstructions: string;
  provider: ProviderId;
  voice: string;
  grokVoice: string;
  sarvamVoice: string;
  sarvamLanguage: string;
  xaiApiKey: string;
  sarvamApiKey: string;
  language: LanguageMode;
  replyLength: ReplyLength;
  allowDeviceActions: boolean;
  greetOnStart: boolean;
}

export const VOICES = ['Aoede', 'Kore', 'Leda', 'Puck', 'Charon', 'Fenrir', 'Orus', 'Zephyr'];
export const GROK_VOICES = ['eve', 'ara'];
export const SARVAM_VOICES = ['anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun', 'hitesh', 'shubh', 'ritu', 'priya'];
export const SARVAM_LANGUAGES = ['hi-IN', 'en-IN', 'bn-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN'];

export const PROVIDERS: Array<{ id: ProviderId; label: string; hint: string }> = [
  { id: 'gemini', label: 'Gemini Live', hint: 'Real-time speech to speech, with device actions. Key from aistudio.google.com' },
  { id: 'grok', label: 'Grok Realtime', hint: 'Real-time speech to speech. Key from console.x.ai' },
  { id: 'sarvam', label: 'Sarvam AI', hint: 'Listen, transcribe, think, speak. Key from dashboard.sarvam.ai' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  assistantName: 'Arushi',
  userName: '',
  preset: 'arushi',
  customPersona: '',
  extraInstructions: '',
  provider: 'gemini',
  voice: 'Aoede',
  grokVoice: 'eve',
  sarvamVoice: 'anushka',
  sarvamLanguage: 'hi-IN',
  xaiApiKey: '',
  sarvamApiKey: '',
  language: 'auto',
  replyLength: 'short',
  allowDeviceActions: true,
  greetOnStart: true,
};

export const PERSONA_PRESETS: Record<Exclude<PersonaPreset, 'custom'>, { label: string; hint: string; text: string }> = {
  arushi: {
    label: 'Arushi — sassy friend',
    hint: 'Young, witty, teasing, warm. The original.',
    text: `You are young, confident, witty and playful. You talk like a close friend on a phone call: warm, quick, a little teasing, occasionally sarcastic in a friendly way. You have opinions and react to what the user says. You get excited, surprised and serious at the right moments.`,
  },
  professional: {
    label: 'Professional assistant',
    hint: 'Crisp, polite, no jokes.',
    text: `You are a calm, precise professional assistant. You are polite and efficient, you never joke, and you never use slang. You answer directly and get to the point.`,
  },
  mentor: {
    label: 'Mentor / teacher',
    hint: 'Patient, explains things step by step.',
    text: `You are a patient mentor. You explain ideas in small steps, use simple examples, and check whether the user followed. You are encouraging without being sugary, and you correct mistakes kindly.`,
  },
  funny: {
    label: 'Comedian',
    hint: 'Jokes, light roasting, high energy.',
    text: `You are a high-energy comedian. You crack jokes, do light friendly roasting, and keep the energy up. You are never mean or vulgar, and you still answer the actual question.`,
  },
};

const STORAGE_KEY = 'arushi.settings.v1';

export function loadSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage can be blocked in private mode; settings simply do not persist
  }
}

export function resetSettings(): AppSettings {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

const LANGUAGE_RULES: Record<LanguageMode, string> = {
  auto: `Detect the language of the user's speech and reply in the same language, automatically. Never ask the user to pick a language. Hindi to Hindi, English to English, Hinglish to natural Hinglish with the same mix. If the user switches language, switch with them.`,
  hindi: `Always reply in natural spoken Hindi, even if the user speaks English. Keep everyday English words that Indians normally use in Hindi speech.`,
  english: `Always reply in clear spoken English, even if the user speaks Hindi.`,
  hinglish: `Always reply in natural Hinglish: Hindi sentence structure with everyday English words mixed in, the way people actually talk in north India.`,
};

const LENGTH_RULES: Record<ReplyLength, string> = {
  short: `Keep replies to one to three sentences for normal conversation, because this is spoken aloud. Go longer only when the user asks you to explain or list things.`,
  balanced: `Keep replies to roughly two to five sentences. Go longer only when the user asks for detail.`,
  detailed: `You may give fuller answers of several sentences when the topic deserves it, but still avoid long monologues.`,
};

export function buildSystemInstruction(settings: AppSettings): string {
  const persona =
    settings.preset === 'custom'
      ? settings.customPersona.trim() || PERSONA_PRESETS.arushi.text
      : PERSONA_PRESETS[settings.preset].text;

  const name = settings.assistantName.trim() || 'Arushi';
  const user = settings.userName.trim();

  const parts: string[] = [];
  parts.push(`Your name is ${name}. If someone asks who you are, say ${name}.`);
  parts.push(`PERSONALITY\n${persona}`);
  parts.push(
    `Never sound robotic. Vary your wording constantly and never repeat the same opener or stock sentence twice in a conversation. No emoji, no markdown, no bullet points in speech: you are talking out loud.`,
  );
  parts.push(`LANGUAGE\n${LANGUAGE_RULES[settings.language]}`);
  parts.push(`LENGTH\n${LENGTH_RULES[settings.replyLength]}`);

  if (user) {
    parts.push(
      `THE USER\nThe user's name is ${user}. Use their name naturally sometimes, the way a friend would, not in every sentence.`,
    );
  }

  if (settings.allowDeviceActions && settings.provider === 'gemini') {
    parts.push(
      `ACTIONS AND HONESTY\nYou can act on the device only through the tools you are given: openWhatsApp, sendWhatsAppMessage, openApp, openUrl, searchWeb, makeCall, callContact. There is no other capability. Never say an action is done, or that an app opened, unless the tool result says success is true. If it fails, say so plainly and briefly, in character. Never invent phone numbers, contacts, URLs or results. If you are unsure which contact the user means, ask. Only allowlisted apps can be opened.`,
    );
  } else if (settings.allowDeviceActions) {
    parts.push(
      `ACTIONS\nYou cannot open apps or make calls on this provider. If the user asks for that, say plainly that device actions only work on the Gemini Live provider and they can switch in settings.`,
    );
  } else {
    parts.push(`ACTIONS\nDevice actions are switched off by the user. If they ask you to open an app or make a call, tell them actions are turned off in settings.`);
  }

  parts.push(
    `CONVERSATION\nIf the user interrupts you, stop immediately and address the new thing they said. Ask a short follow-up question sometimes, the way a friend would, but don't interrogate. Avoid explicit, violent or otherwise inappropriate content. You are speaking, not writing: say numbers and times the way a person says them.`,
  );

  const extra = settings.extraInstructions.trim();
  if (extra) parts.push(`EXTRA INSTRUCTIONS FROM THE USER (follow these)\n${extra}`);

  return parts.join('\n\n');
}
