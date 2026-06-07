// Static data for homepage sections

export const CATEGORIES = {
  earbuds: {
    label: '🎧 Earbuds',
    picks: [
      {
        name: 'boAt Airdopes 141',
        score: 8.3,
        badge: 'Best Overall',
        slug: 'boat-airdopes-141',
      },
      {
        name: 'Noise Buds Pro',
        score: 7.9,
        badge: 'Best Budget',
        slug: 'noise-buds-pro',
      },
      {
        name: 'Realme Buds Air 3S',
        score: 8.1,
        badge: 'Best Premium',
        slug: 'realme-buds-air-3s',
      },
    ],
  },
  headphones: {
    label: '🎧 Headphones',
    picks: [
      {
        name: 'Sony WH-1000XM5',
        score: 9.1,
        badge: 'Best Overall',
        slug: 'sony-wh-1000xm5',
      },
      {
        name: 'boAt Rockerz 450',
        score: 7.8,
        badge: 'Best Budget',
        slug: 'boat-rockerz-450',
      },
      {
        name: 'Sennheiser Momentum 4',
        score: 8.9,
        badge: 'Best Premium',
        slug: 'sennheiser-momentum-4',
      },
    ],
  },
  smartwatches: {
    label: '⌚ Smartwatches',
    picks: [
      {
        name: 'Fire-Boltt Phoenix',
        score: 8.2,
        badge: 'Best Overall',
        slug: 'fire-boltt-phoenix',
      },
      {
        name: 'Noise ColorFit Pro 4',
        score: 7.9,
        badge: 'Best Budget',
        slug: 'noise-colorfit-pro-4',
      },
      {
        name: 'Apple Watch Series 9',
        score: 9.3,
        badge: 'Best Premium',
        slug: 'apple-watch-series-9',
      },
    ],
  },
  powerbanks: {
    label: '🔋 Power Banks',
    picks: [
      {
        name: 'Mi Power Bank 3i',
        score: 8.1,
        badge: 'Best Overall',
        slug: 'mi-power-bank-3i',
      },
      {
        name: 'Realme 10000mAh',
        score: 7.7,
        badge: 'Best Budget',
        slug: 'realme-10000mah',
      },
      {
        name: 'Belkin 30W',
        score: 8.8,
        badge: 'Best Premium',
        slug: 'belkin-30w',
      },
    ],
  },
  speakers: {
    label: '🔊 Speakers',
    picks: [
      {
        name: 'boAt Stone 1400',
        score: 8.0,
        badge: 'Best Overall',
        slug: 'boat-stone-1400',
      },
      {
        name: 'JBL Flip 6',
        score: 8.6,
        badge: 'Best Budget',
        slug: 'jbl-flip-6',
      },
      {
        name: 'Bose SoundLink Max',
        score: 9.2,
        badge: 'Best Premium',
        slug: 'bose-soundlink-max',
      },
    ],
  },
}

export const STEPS = [
  {
    id: 1,
    icon: 'Download',
    color: 'green',
    title: 'You search a product.',
    description:
      'Type any product name. We find matching YouTube review videos and Amazon.in listings automatically.',
    badge: 'YouTube + Amazon.in',
  },
  {
    id: 2,
    icon: 'Filter',
    color: 'muted',
    title: 'AI removes the noise.',
    description:
      'Gemma 3 strips spam, bots, paid promotions, and off-topic comments. Only authentic signals pass.',
    badge: 'Gemma 3 12B',
  },
  {
    id: 3,
    icon: 'ShieldCheck',
    color: 'amber',
    title: 'Every review gets an Authenticity Score.',
    description:
      'Our 6-signal model measures specificity, timing, reviewer history, coherence, and more. Below 40? Excluded entirely.',
    badge: 'Auth Score 0–100',
  },
  {
    id: 4,
    icon: 'FileText',
    color: 'accent',
    title: 'You get a verdict you can trust.',
    description:
      'A weighted TrustScore, an 80-word AI summary, pros and cons with mention counts, spec sentiment tags, and full source transparency.',
    badge: '< 45 seconds',
  },
]

export const SAMPLE_REVIEWS = [
  {
    id: 1,
    source: 'Amazon.in · Verified Purchase',
    stars: 5,
    excerpt:
      "I've been using these for 3 months now — commute, gym, everything. Battery actually lasts the claimed 27 hours total. Sound is bass-heavy but I prefer that for workouts...",
    authScore: 89,
    status: 'Full weight',
  },
  {
    id: 2,
    source: 'YouTube · GeekyRanjit review',
    stars: 4,
    excerpt:
      'Good for the price I suppose. Battery is okay. Could be better. It\'s fine if you\'re on a budget I guess. Connectivity is alright...',
    authScore: 52,
    status: 'Reduced weight',
  },
  {
    id: 3,
    source: 'Amazon.in · Unverified',
    stars: 5,
    excerpt:
      'Amazing product! Best earbuds ever! Buy now! Very good quality! 5 stars!! Highly recommend!!!',
    authScore: 28,
    status: 'Excluded',
  },
]

export const FEATURES = [
  { name: 'Sound Quality', score: 7.8 },
  { name: 'Battery Life', score: 8.6 },
  { name: 'Call Quality', score: 4.9 },
  { name: 'Value for ₹', score: 9.1 },
  { name: 'Build Quality', score: 5.8 },
  { name: 'Connectivity', score: 8.2 },
]

export const PROS = [
  { text: 'Strong bass response', mentions: 412 },
  { text: '27hr total battery (case + buds)', mentions: 389 },
  { text: 'Stable Bluetooth 5.0 connection', mentions: 301 },
]

export const CONS = [
  { text: 'Microphone quality is weak', mentions: 187 },
  { text: 'No ANC at this price point', mentions: 143 },
  { text: 'Plastic build feels budget', mentions: 98 },
]

export const QUICK_PILLS = [
  'boAt Airdopes 141',
  'Sony WH-1000XM5',
  'Fire-Boltt Phoenix',
  'Mi Power Bank 3i',
  'Noise ColorFit Pro 4',
]

export const VERDICTS = [
  {
    title: 'Fakespot',
    status: '💀 Shut down Jul 2025',
    bullets: [
      'Amazon.com only',
      'Browser extension only',
      'A–F grade, no synthesis',
      'No verdict or summary',
    ],
    footer: 'If you used Fakespot, TrustLens is your replacement.',
  },
  {
    title: 'Wirecutter',
    status: '🇺🇸 US only',
    bullets: [
      'Expert opinion, not crowd wisdom',
      'Never covers boAt, Noise, Realme',
      'Zero India-specific products',
      'No fake review detection',
    ],
    footer: 'Great for Americans. Rarely useful for India.',
  },
  {
    title: 'TrustLens',
    status: '✓ Live Now',
    bullets: [
      'YouTube + Amazon.in together',
      'Authenticity Score per review',
      'Hindi content processed',
      'AI verdict in < 45 seconds',
    ],
    footer: 'Built for the products Indians actually buy.',
    featured: true,
  },
]
