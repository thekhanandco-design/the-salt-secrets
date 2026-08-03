import { Globe2, MessageCircle } from "lucide-react";
import {
  FaDiscord, FaFacebookF, FaInstagram, FaLinkedinIn, FaMastodon, FaPinterestP,
  FaRedditAlien, FaSnapchat, FaTelegram, FaThreads, FaTiktok, FaVimeoV,
  FaWhatsapp, FaXTwitter, FaYoutube,
} from "react-icons/fa6";
import { SiBluesky } from "react-icons/si";

export const socialPlatformOptions = [
  ["facebook", "Facebook"], ["instagram", "Instagram"], ["linkedin", "LinkedIn"], ["pinterest", "Pinterest"],
  ["threads", "Threads"], ["x", "X / Twitter"], ["tiktok", "TikTok"], ["youtube", "YouTube"],
  ["whatsapp", "WhatsApp"], ["telegram", "Telegram"], ["reddit", "Reddit"], ["snapchat", "Snapchat"],
  ["vimeo", "Vimeo"], ["bluesky", "Bluesky"], ["mastodon", "Mastodon"], ["discord", "Discord"], ["website", "Other Website"],
] as const;

export function SocialPlatformIcon({ platform, className }: { platform?: string; className?: string }) {
  const key = String(platform || "website").toLowerCase();
  const props = { className };
  if (key === "facebook") return <FaFacebookF {...props}/>;
  if (key === "instagram") return <FaInstagram {...props}/>;
  if (key === "linkedin") return <FaLinkedinIn {...props}/>;
  if (key === "pinterest") return <FaPinterestP {...props}/>;
  if (key === "threads") return <FaThreads {...props}/>;
  if (key === "x" || key === "twitter") return <FaXTwitter {...props}/>;
  if (key === "tiktok") return <FaTiktok {...props}/>;
  if (key === "youtube") return <FaYoutube {...props}/>;
  if (key === "whatsapp") return <FaWhatsapp {...props}/>;
  if (key === "telegram") return <FaTelegram {...props}/>;
  if (key === "reddit") return <FaRedditAlien {...props}/>;
  if (key === "snapchat") return <FaSnapchat {...props}/>;
  if (key === "vimeo") return <FaVimeoV {...props}/>;
  if (key === "bluesky") return <SiBluesky {...props}/>;
  if (key === "mastodon") return <FaMastodon {...props}/>;
  if (key === "discord") return <FaDiscord {...props}/>;
  if (key === "message") return <MessageCircle {...props}/>;
  return <Globe2 {...props}/>;
}
