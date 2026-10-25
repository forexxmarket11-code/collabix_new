export type CreatorCategory = 'Blogger' | 'Mini Blogger' | 'Model' | 'Brand Face';

export type PriceRangeOption = 'all' | '500k-1.5m' | '1.5m-5m' | '5m-15m' | '15m+';

export interface CreatorMediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  title?: string;
  thumbnailUrl?: string;
}

export interface CatalogCreator {
  id: string;
  name: string;
  handle: string;
  category: CreatorCategory;
  specialty: string;
  city: string;
  avatar: string;
  followers: string;
  followersCount: number;
  rating: number;
  reviewsCount: number;
  priceRange: '500k-1.5m' | '1.5m-5m' | '5m-15m' | '15m+';
  priceDisplay: string;
  verified: boolean;
  engagementRate: string;
  bio: string;
  tags: string[];
  height?: string | number;
  weight?: string | number;
  age?: string | number;
  experienceYears?: string | number;
  views?: number;
  gallery?: CreatorMediaItem[];
  topPlacementUntil?: string | null;
  isTopPlacement?: boolean;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  niche: string;
  followers: string;
  engagementRate: string;
  avgReach: string;
  matchScore: string;
  avatar: string;
  location: string;
  platforms: ('instagram' | 'telegram' | 'youtube')[];
  verified: boolean;
  recentCollab: string;
  tags: string[];
}

export interface FeatureCard {
  id: string;
  number: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  highlight: string;
}

export type PageType =
  | 'home'
  | 'catalog'
  | 'orders'
  | 'messages'
  | 'profile'
  | 'referral'
  | 'agency'
  | 'edit-profile'
  | 'admin'
  | 'create-brief'
  | 'creator-profile'
  | 'pending-approval';

export type AgencyApplicationStatus = 'yangi' | 'boglanildi' | 'hamkor_boldi';

export interface AgencyApplication {
  id: string;
  userId?: string;
  ownerId?: string;
  agencyName: string;
  contactPerson: string;
  phoneOrEmail: string;
  websiteOrInstagram?: string;
  status: AgencyApplicationStatus;
  createdAt: string;
  createdAtMillis: number;
  notes?: string;
}

export type BriefCreatorStatus = 'yangi' | 'qabul_qilindi' | 'rad_etildi';

export interface BriefApplication {
  id: string;
  briefId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorHandle?: string;
  creatorPhoneNumber?: string;
  creatorTelegramUsername?: string;
  brandPhoneNumber?: string;
  brandTelegramUsername?: string;
  message: string;
  appliedAt?: string;
  createdAt?: string;
  proposedPrice?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'yangi' | 'qabul_qilindi' | 'rad_etildi';
  creatorStatus?: BriefCreatorStatus;
  rejectionReason?: string;
  respondedAt?: string;
}

export interface BriefData {
  id: string;
  taskTitle: string;
  description: string;
  formats: string[];
  categories: string[];
  recipientType: 'open' | 'direct';
  selectedCreatorId?: string;
  selectedCreatorName?: string;
  selectedCreatorAvatar?: string;
  creatorPhoneNumber?: string;
  creatorTelegramUsername?: string;
  budgetMin?: string;
  budgetMax?: string;
  paymentType?: 'money' | 'barter';
  barterDescription?: string;
  barterEstimatedValue?: string;
  deadline?: string;
  requirementsSummary?: string;
  brandName?: string;
  brandAvatar?: string;
  brandId?: string;
  ownerId?: string;
  brandPhoneNumber?: string;
  brandTelegramUsername?: string;
  attachedFiles?: { name: string; size: string; type: string }[];
  applications?: BriefApplication[];
  selectedApplicationId?: string;
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'yangi' | 'qabul_qilindi' | 'rad_etildi';
  creatorStatus?: BriefCreatorStatus;
  rejectionReason?: string;
  respondedAt?: string;
  respondedAtMillis?: number;
  createdAt: string;
  createdAtMillis?: number;
}

export type SubscriptionStatus = 'free' | 'none' | 'trial' | 'active' | 'cancelled';
export type AccountStatus = 'pending' | 'approved' | 'rejected';

export interface UserSession {
  uid?: string;
  email?: string;
  name: string;
  contact: string;
  phoneNumber?: string;
  telegramUsername?: string;
  role: 'bloger' | 'brend';
  avatar?: string;
  registeredAt?: string;
  bio?: string;
  city?: string;
  instagramHandle?: string;
  gender?: 'erkak' | 'ayol' | '';
  languages?: string[];
  categories?: string[];
  contentTypes?: string[];
  priceRange?: {
    min: string;
    max: string;
  };
  socialLinks?: {
    instagram?: string;
    instagramFollowers?: string;
    instagramEnabled?: boolean;
    tiktok?: string;
    tiktokFollowers?: string;
    tiktokEnabled?: boolean;
    youtube?: string;
    youtubeFollowers?: string;
    youtubeEnabled?: boolean;
    telegram?: string;
    telegramFollowers?: string;
    telegramEnabled?: boolean;
  };
  profileCompletion?: number;
  trialStartDate?: string;
  trialEndDate?: string;
  subscriptionStatus?: SubscriptionStatus;
  reminderSent?: boolean;
  subscriptionPlanPrice?: number;
  cancellationReason?: string;
  handle?: string;
  accountStatus?: AccountStatus;
  rejectionReason?: string;
  rating?: number;
  reviewsCount?: number;
  engagementRate?: string;
  totalFollowers?: string;
  completedOrdersCount?: number;
  verified?: boolean;
  height?: string | number;
  weight?: string | number;
  age?: string | number;
  experienceYears?: string | number;
  views?: number;
  gallery?: CreatorMediaItem[];
  mediaGallery?: CreatorMediaItem[];
  unlockedContactsCount?: number;
  unlockedCreators?: Record<string, { unlockedAt: string; expiresAt: string }>;
  lastUnlockedCreatorId?: string;
  proExpiresAtMillis?: number;
  topPlacementUntil?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface UsersStatistics {
  totalUsers: number;
  bloggersCount: number;
  brandsCount: number;
  bloggerPercentage: number;
  brandPercentage: number;
  last30DaysCount: number;
  last30DaysGrowthRate?: number;
  completedProfilesCount: number;
  averageCompletionPercentage: number;
  weeklyGrowth: {
    name: string;
    blogger: number;
    brand: number;
    total: number;
  }[];
  lastUpdated: string;
}

export interface MonthlyRevenueItem {
  month: string;
  amount: number;
  formatted: string;
  rawAmount: number;
}

export interface RevenueStatistics {
  totalRevenue: number;
  thisMonthRevenue: number;
  thisMonthGrowthRate: number;
  monthlyRevenueData: MonthlyRevenueItem[];
  averageMonthlyRevenue: number;
}

export interface ReferrerItem {
  id: string;
  name: string;
  handle: string;
  role: string;
  referralCount: number;
  rewardAmount: string;
  status: string;
}

export interface ReferralStatistics {
  totalReferralUsers: number;
  referralPercentage: number;
  totalRewardsPaid: number;
  pendingRewards: number;
  topReferrers: ReferrerItem[];
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  text: string;
  time: string;
  createdAt?: any;
  isRead?: boolean;
}

export interface ChatConversationItem {
  id: string;
  participants: string[];
  participantDetails: Record<string, {
    name: string;
    handle: string;
    avatar: string;
    role: string;
  }>;
  lastMessage?: string;
  lastMessageTime?: string;
  updatedAt?: any;
  unreadCount?: number;
}

export type ThemeMode = 'light' | 'dark';

export type NotificationType = 'yangi_brif' | 'ariza_keldi' | 'ariza_qabul' | 'tizim';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  briefTitle?: string;
  briefId?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  message: string;
  read: boolean;
  createdAt: string;
  createdAtMillis?: number;
}

export const CANCELLATION_REASONS = [
  "Narx men uchun qimmat",
  "Kerakli kreator/brendni topa olmadim",
  "Platforma qulay emas / texnik muammolar",
  "Boshqa maqsadga o'tdim / kerak emas",
  "Boshqa sabab",
] as const;

export type CancellationReasonType = typeof CANCELLATION_REASONS[number];

export interface CancellationRecord {
  id: string;
  userId: string;
  ownerId?: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  userHandle?: string;
  cancelledAt: string;
  cancelledAtMillis: number;
  reason: string;
  reasonDetails?: string;
}

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id: string;
  userId: string;
  ownerId?: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  userRole?: string;
  amount: number;
  screenshotUrl: string;
  sana: string;
  createdAtMillis?: number;
  status: PaymentRequestStatus;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  reviewedBy?: string;
  /** Nima uchun to'lov: Pro obuna, kontakt paketi yoki TOP joylashuv */
  purpose?: PaymentPurpose;
  /** Kontakt paketi uchun: nechta kontakt */
  contactsCount?: number;
  /** TOP uchun: necha kun */
  topDays?: number;
  /** Ko'rinadigan nom, masalan "TOP — 7 kun" */
  purposeLabel?: string;
}

export type PaymentPurpose = 'pro' | 'contacts' | 'top';

