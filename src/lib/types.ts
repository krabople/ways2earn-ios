export type Member = {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl?: string | null;
  role: "member" | "moderator" | "admin";
  status: string;
};

export type Opportunity = {
  id: string;
  slug: string;
  type: "Earn" | "Freebie" | "Deal";
  category: string;
  title: string;
  summary: string;
  body: string;
  reward: string;
  requiredSpend: string;
  effort: string;
  difficulty: string;
  requiresId: boolean;
  eligibility: string;
  payout: string;
  merchant: string;
  author: string;
  authorHandle: string;
  authorAvatar?: string | null;
  authorId: string;
  image: string;
  expires: string | null;
  createdAt: string;
  publishedAt: string | null;
  status: string;
  tags: string[];
  sourceUrl: string | null;
  disclosure: string;
  voucherCode?: string | null;
  temperature: number;
  comments: number;
  confirmations: number;
  failures: number;
  bookmarks: number;
  vote: number;
  saved: boolean;
  outcome: string | null;
  progress: string | null;
  editSnapshot?: Record<string, unknown> | null;
};

export type Topic = {
  id: string;
  title: string;
  body: string;
  category: string;
  author: string;
  handle: string;
  replies: number;
  createdAt: string;
  updatedAt: string;
};

export type AlertItem = {
  id: string;
  kind: string;
  payload_json: string;
  read_at: string | null;
  created_at: string;
};

export type Feed = {
  user: Member | null;
  votePower: number;
  opportunities: Opportunity[];
  discussions: Topic[];
  categories: string[];
  notifications?: AlertItem[];
  unread: number;
  unreadMessages: number;
  pushEnabled?: boolean;
};

export function age(value: string) {
  const iso = value.endsWith("Z") ? value : `${value.replace(" ", "T")}Z`;
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000),
  );
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}
