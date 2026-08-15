export const SOCIAL_PLATFORM_KEYS = [
  "facebook",
  "linkedin",
  "instagram",
  "threads",
  "x",
  "youtube",
  "pinterest",
  "tiktok",
  "reddit",
  "whatsapp",
  "telegram",
  "discord",
  "snapchat",
  "mastodon",
  "bluesky",
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORM_KEYS)[number];

export type SocialPlatformMeta = {
  label: string;
  maxChars: number;
  recommendedChars: number;
  dimensions: string;
  aspect: string;
  aiSize: "1024x1024" | "1024x1536" | "1536x1024";
  copyLabel: string;
  titleLabel?: string;
};

export const SOCIAL_PLATFORM_META: Record<SocialPlatformKey, SocialPlatformMeta> = {
  facebook: { label: "Facebook", maxChars: 63206, recommendedChars: 500, dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024", copyLabel: "Facebook post" },
  linkedin: { label: "LinkedIn", maxChars: 3000, recommendedChars: 900, dimensions: "1200 × 1200", aspect: "1/1", aiSize: "1024x1024", copyLabel: "LinkedIn post" },
  instagram: { label: "Instagram", maxChars: 2200, recommendedChars: 650, dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024", copyLabel: "Instagram caption" },
  threads: { label: "Threads", maxChars: 500, recommendedChars: 300, dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024", copyLabel: "Threads post" },
  x: { label: "X", maxChars: 280, recommendedChars: 240, dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024", copyLabel: "X post" },
  youtube: { label: "YouTube", maxChars: 5000, recommendedChars: 1200, dimensions: "1280 × 720", aspect: "16/9", aiSize: "1536x1024", copyLabel: "YouTube description", titleLabel: "Video title" },
  pinterest: { label: "Pinterest", maxChars: 800, recommendedChars: 450, dimensions: "1000 × 1500", aspect: "2/3", aiSize: "1024x1536", copyLabel: "Pin description", titleLabel: "Pin title" },
  tiktok: { label: "TikTok", maxChars: 2200, recommendedChars: 350, dimensions: "1080 × 1920", aspect: "9/16", aiSize: "1024x1536", copyLabel: "TikTok caption", titleLabel: "Video concept" },
  reddit: { label: "Reddit", maxChars: 40000, recommendedChars: 1200, dimensions: "1200 × 1200", aspect: "1/1", aiSize: "1024x1024", copyLabel: "Reddit post", titleLabel: "Post title" },
  whatsapp: { label: "WhatsApp", maxChars: 4096, recommendedChars: 650, dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024", copyLabel: "Broadcast message" },
  telegram: { label: "Telegram", maxChars: 4096, recommendedChars: 900, dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024", copyLabel: "Channel post" },
  discord: { label: "Discord", maxChars: 2000, recommendedChars: 900, dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024", copyLabel: "Community post" },
  snapchat: { label: "Snapchat", maxChars: 250, recommendedChars: 150, dimensions: "1080 × 1920", aspect: "9/16", aiSize: "1024x1536", copyLabel: "Story caption", titleLabel: "Story concept" },
  mastodon: { label: "Mastodon", maxChars: 500, recommendedChars: 420, dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024", copyLabel: "Mastodon post" },
  bluesky: { label: "Bluesky", maxChars: 300, recommendedChars: 260, dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024", copyLabel: "Bluesky post" },
};

export function clampPlatformText(platform: SocialPlatformKey, value: string) {
  const limit = SOCIAL_PLATFORM_META[platform].maxChars;
  if (value.length <= limit) return value;
  const shortened = value.slice(0, Math.max(0, limit - 1)).trimEnd();
  return `${shortened}…`;
}
