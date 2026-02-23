const DEFAULT_SETTINGS = {
  defaultSource: 'readwise',
  defaultLocation: 'new',
  defaultDays: 7,
  previewLimit: 100,
  confirmActions: true,
  mockTts: true,
  ttsProvider: 'openai',
  ttsVoice: 'alloy',
  awsPollyVoice: 'Joanna',
  audioBackSeconds: 15,
  audioForwardSeconds: 30,
  maxOpenTabs: 5,
  playerAutoNext: true,
  playerAutoAction: 'none',
  gmailSelectedLabels: [],
};

async function getSettings(env) {
  try {
    const stored = await env.KV.get('settings');
    if (!stored) return { ...DEFAULT_SETTINGS };
    return sanitizeSettings(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function sanitizeSettings(input) {
  const source = input && typeof input === 'object' ? input : {};
  const defaultSource = source.defaultSource === 'gmail' || source.defaultSource === 'all'
    ? source.defaultSource
    : DEFAULT_SETTINGS.defaultSource;
  const defaultLocation = typeof source.defaultLocation === 'string' && source.defaultLocation.trim()
    ? source.defaultLocation.trim()
    : DEFAULT_SETTINGS.defaultLocation;
  const defaultDays = normalizeInt(source.defaultDays, DEFAULT_SETTINGS.defaultDays, 1, 3650);
  const previewLimit = normalizeInt(source.previewLimit, DEFAULT_SETTINGS.previewLimit, 1, 500);
  const confirmActions = typeof source.confirmActions === 'boolean'
    ? source.confirmActions
    : DEFAULT_SETTINGS.confirmActions;
  const mockTts = typeof source.mockTts === 'boolean'
    ? source.mockTts
    : DEFAULT_SETTINGS.mockTts;
  const allowedProviders = ['openai', 'aws_polly_standard'];
  const ttsProvider = typeof source.ttsProvider === 'string' && allowedProviders.includes(source.ttsProvider)
    ? source.ttsProvider
    : DEFAULT_SETTINGS.ttsProvider;
  const allowedVoices = ['alloy', 'onyx', 'echo', 'nova', 'shimmer'];
  const ttsVoice = typeof source.ttsVoice === 'string' && allowedVoices.includes(source.ttsVoice)
    ? source.ttsVoice
    : DEFAULT_SETTINGS.ttsVoice;
  const allowedAwsVoices = [
    'Joanna',
    'Matthew',
    'Salli',
    'Kimberly',
    'Kendra',
    'Ivy',
    'Justin',
    'Joey',
    'Ruth',
    'Stephen',
    'Kevin',
  ];
  const awsPollyVoice = typeof source.awsPollyVoice === 'string' && allowedAwsVoices.includes(source.awsPollyVoice)
    ? source.awsPollyVoice
    : DEFAULT_SETTINGS.awsPollyVoice;
  const audioBackSeconds = normalizeInt(source.audioBackSeconds, DEFAULT_SETTINGS.audioBackSeconds, 5, 120);
  const audioForwardSeconds = normalizeInt(source.audioForwardSeconds, DEFAULT_SETTINGS.audioForwardSeconds, 5, 180);
  const maxOpenTabs = normalizeInt(source.maxOpenTabs, DEFAULT_SETTINGS.maxOpenTabs, 1, 50);
  const playerAutoNext = typeof source.playerAutoNext === 'boolean'
    ? source.playerAutoNext
    : DEFAULT_SETTINGS.playerAutoNext;
  const playerAutoAction = source.playerAutoAction === 'archive' || source.playerAutoAction === 'delete'
    ? source.playerAutoAction
    : DEFAULT_SETTINGS.playerAutoAction;
  const gmailSelectedLabels = Array.isArray(source.gmailSelectedLabels)
    ? Array.from(new Set(source.gmailSelectedLabels
      .map((label) => typeof label === 'string' ? label.trim() : '')
      .filter(Boolean)))
        .slice(0, 200)
    : DEFAULT_SETTINGS.gmailSelectedLabels;

  return {
    defaultSource,
    defaultLocation,
    defaultDays,
    previewLimit,
    confirmActions,
    mockTts,
    ttsProvider,
    ttsVoice,
    awsPollyVoice,
    audioBackSeconds,
    audioForwardSeconds,
    maxOpenTabs,
    playerAutoNext,
    playerAutoAction,
    gmailSelectedLabels,
  };
}

function normalizeInt(value, fallback, min, max) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

export { DEFAULT_SETTINGS, getSettings, sanitizeSettings };
