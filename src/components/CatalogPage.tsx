import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  MapPin,
  Instagram,
  Star,
  ShieldCheck,
  Users,
  RotateCcw,
  Sparkles,
  ArrowRight,
  X,
  Send,
  CheckCircle2,
  Filter,
  Loader2,
  UserX,
  Flame,
} from 'lucide-react';
import { CatalogCreator, CreatorCategory, UserSession } from '../types';
import { subscribeToApprovedCreators } from '../firebase';
import { checkProUserAndProceed, isUserPro } from '../utils/subscription';

interface CatalogPageProps {
  onBackToHome: () => void;
  onOpenRegister: () => void;
  onOpenChat?: (creatorId?: string) => void;
  currentUser?: UserSession | null;
  onOpenProModal?: () => void;
  onViewCreatorProfile?: (creator: CatalogCreator) => void;
  onSendBrief?: (creator: { id: string; name: string; avatar?: string; handle?: string }) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  onBackToHome,
  onOpenRegister,
  onOpenChat,
  currentUser,
  onOpenProModal,
  onViewCreatorProfile,
  onSendBrief,
}) => {
  const isPro = isUserPro(currentUser);
  
  // Real-time Firestore state for approved creators
  const [creators, setCreators] = useState<CatalogCreator[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToApprovedCreators(
      (loadedCreators) => {
        setCreators(loadedCreators);
        setIsLoading(false);
      },
      (error) => {
        if (error?.code !== 'permission-denied' && error?.code !== 'unavailable') {
          console.warn("Firestore creators subscription warning:", error?.message || error);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter States: Search query & category buttons only
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Detail / Brief Modal State
  const [selectedCreator, setSelectedCreator] = useState<CatalogCreator | null>(null);
  const [isBriefSubmitted, setIsBriefSubmitted] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [projectGoal, setProjectGoal] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  // Progressive rendering for optimal performance (renders 8 first, expands smoothly)
  const [displayCount, setDisplayCount] = useState(8);

  const handleCreatorCardSendBrief = (e: React.MouseEvent, creator: CatalogCreator) => {
    e.stopPropagation();
    checkProUserAndProceed({
      currentUser,
      onProceed: () => {
        if (onSendBrief) {
          onSendBrief({
            id: creator.id,
            name: creator.name,
            avatar: creator.avatar,
            handle: creator.handle,
          });
        }
      },
      onProRequired: () => {
        if (onOpenProModal) {
          onOpenProModal();
        }
      },
    });
  };

  // Categories list exactly as requested
  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'Barcha toifalar' },
    { key: 'Blogger', label: 'Blogger' },
    { key: 'Mini Blogger', label: 'Mini Blogger' },
    { key: 'Model', label: 'Model' },
    { key: 'Brand Face', label: 'Brand Face' },
  ];

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(8);
  }, [searchQuery, selectedCategory]);

  // Filter and sort logic (TOP creators first, then standard sorting)
  const filteredCreators = useMemo(() => {
    const list = creators.filter((creator) => {
      // Category filter
      if (selectedCategory !== 'all' && creator.category !== selectedCategory) {
        return false;
      }

      // Search query (name, handle, city, category, tags, bio, specialty)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = creator.name.toLowerCase().includes(query);
        const matchesHandle = creator.handle.toLowerCase().includes(query);
        const matchesCity = creator.city.toLowerCase().includes(query);
        const matchesCategory = creator.category.toLowerCase().includes(query);
        const matchesSpecialty = creator.specialty?.toLowerCase().includes(query);
        const matchesTags = creator.tags.some((t) => t.toLowerCase().includes(query));
        const matchesBio = creator.bio.toLowerCase().includes(query);

        if (
          !matchesName &&
          !matchesHandle &&
          !matchesCity &&
          !matchesCategory &&
          !matchesSpecialty &&
          !matchesTags &&
          !matchesBio
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort: TOP placement creators appear at the very beginning of the catalog
    return list.sort((a, b) => {
      const now = Date.now();
      const aIsTop = Boolean(a.topPlacementUntil && new Date(a.topPlacementUntil).getTime() > now);
      const bIsTop = Boolean(b.topPlacementUntil && new Date(b.topPlacementUntil).getTime() > now);

      if (aIsTop && !bIsTop) return -1;
      if (!aIsTop && bIsTop) return 1;
      return 0;
    });
  }, [creators, searchQuery, selectedCategory]);

  // Sliced creator items for instantaneous render & 60fps interaction
  const displayedCreators = useMemo(() => {
    return filteredCreators.slice(0, displayCount);
  }, [filteredCreators, displayCount]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const handleSendBrief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !contactInfo.trim()) return;

    checkProUserAndProceed({
      currentUser,
      onProceed: () => {
        setIsBriefSubmitted(true);
      },
      onProRequired: () => {
        if (onOpenProModal) {
          onOpenProModal();
        }
      },
    });
  };

  const handleCloseDetail = () => {
    setSelectedCreator(null);
    setIsBriefSubmitted(false);
    setBrandName('');
    setProjectGoal('');
    setContactInfo('');
  };

  return (
    <div id="catalog-page-container" className="pt-2.5 sm:pt-3.5 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Search and Filters Section (Compact, isolated layout) */}
      <div
        id="catalog-filters-panel"
        className="max-w-4xl mx-auto w-full bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-3 sm:p-4 shadow-sm dark:shadow-xl dark:shadow-black/40 mb-5 sm:mb-7 transition-all relative z-10 clear-both"
      >
        {/* Search Bar (Compact & ergonomic, >=16px on mobile to prevent iOS zoom) */}
        <div className="relative mb-2.5 sm:mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
          <input
            id="catalog-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism, @handle, mutaxassislik yoki shahar..."
            className="w-full min-h-[48px] pl-10 pr-11 py-2.5 rounded-xl bg-slate-50/90 dark:bg-[#12121A] border border-slate-200 dark:border-slate-700/80 text-base sm:text-sm font-body text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-[#161622] transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              id="btn-clear-search"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              aria-label="Qidiruvni tozalash"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}
        </div>

        {/* Category Buttons directly under search bar: single-line horizontal scroll with right fade */}
        <div className="relative flex items-center justify-between gap-2">
          {/* Scrollable buttons wrapper with overflow containment & fade indicator */}
          <div className="relative flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar scroll-smooth flex-nowrap pr-8 sm:pr-10">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    id={`cat-filter-${cat.key.toLowerCase().replace(/\s+/g, '-')}`}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`shrink-0 min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-[13.5px] sm:text-[13px] font-heading font-bold whitespace-nowrap transition-all duration-150 cursor-pointer inline-flex items-center justify-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-100 dark:bg-[#12121A] hover:bg-slate-200/85 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-slate-700/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Subtle gradient fade on the right edge indicating more scrollable items */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0.5 w-7 sm:w-10 bg-gradient-to-l from-white via-white/85 to-transparent dark:from-[#1A1A24] dark:via-[#1A1A24]/90 dark:to-transparent z-10" />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              id="btn-reset-filters"
              onClick={resetAllFilters}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl text-xs font-heading font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer shrink-0 z-20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* Creators Catalog List or Dynamic States */}
      {isLoading ? (
        /* Loading Skeleton State */
        <div id="catalog-loading-state" className="flex flex-col gap-4 max-w-4xl mx-auto w-full py-4">
          <div className="flex items-center justify-center gap-2.5 py-8 text-slate-500 dark:text-slate-400 font-heading font-medium text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Kreatorlar yuklanmoqda...</span>
          </div>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="w-full bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 animate-pulse flex flex-col gap-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="w-20 h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                  </div>
                </div>
                <div className="w-14 h-6 rounded-full bg-amber-100/60 dark:bg-amber-950/40" />
              </div>
              <div className="w-3/4 h-3 bg-slate-100 dark:bg-slate-800 rounded-md" />
              <div className="flex gap-2">
                <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : creators.length === 0 ? (
        /* Friendly Empty State when Firestore has no approved creators yet */
        <div
          id="catalog-no-creators-state"
          className="text-center py-16 px-6 bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs max-w-xl mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 mb-4 shadow-2xs">
            <Users className="w-8 h-8 stroke-[1.75]" />
          </div>

          <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white mb-2">
            Hozircha kreatorlar yoʻq, tez orada qoʻshiladi
          </h3>

          <p className="text-[15px] sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body leading-relaxed max-w-md mx-auto mb-6">
            Roʻyxatdan oʻtgan bloger va kreatorlar ushbu katalogda avtomatik ravishda paydo boʻladi.
          </p>

          <button
            type="button"
            id="btn-register-creator-empty"
            onClick={onOpenRegister}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <span>Kreator sifatida roʻyxatdan oʻtish</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      ) : filteredCreators.length > 0 ? (
        <div
          id="creators-catalog-list"
          className="flex flex-col gap-4 sm:gap-5 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          {filteredCreators.slice(0, displayCount).map((creator) => (
            <div
              key={creator.id}
              id={`creator-card-${creator.id}`}
              onClick={() => {
                if (onViewCreatorProfile) {
                  onViewCreatorProfile(creator);
                } else {
                  setSelectedCreator(creator);
                }
              }}
              className="group w-full bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400/80 dark:hover:border-indigo-500/80 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-transform duration-200 cursor-pointer flex flex-col gap-3.5"
            >
              {/* 1. Yuqori qator: chapda kichik doira avatar, uning yonida ism + tasdiqlangan belgi. O'ng chetida reyting */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                      loading="lazy"
                      decoding="async"
                      width={56}
                      height={56}
                    />
                    {creator.isTopPlacement && (
                      <span
                        title="TOP profil: tavsiya etilgan"
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs border border-white dark:border-slate-900"
                      >
                        <Flame className="w-3 h-3 fill-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {creator.name}
                      </h3>
                      {creator.verified && (
                        <CheckCircle2
                          className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-950/60 shrink-0"
                          aria-label="Tasdiqlangan"
                        />
                      )}
                      {creator.isTopPlacement && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-rose-500/15 border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 text-[10px] font-heading font-extrabold uppercase tracking-wide">
                          <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          <span>TOP</span>
                        </span>
                      )}
                    </div>

                    {/* 2. Ikkinchi qator: ism ostida, avatar bilan bir chiziqda — joylashuv icon (pin) + shahar nomi */}
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-body mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>{creator.city}</span>
                    </div>
                  </div>
                </div>

                {/* Reyting — yulduzcha icon + raqam, ochiq sariq/oltin rangdagi kichik pastilja (pill) ichida */}
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-heading font-bold shrink-0 shadow-2xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{creator.rating > 0 ? creator.rating.toFixed(1) : 'Yangi'}</span>
                </div>
              </div>

              {/* 3. Uchinchi qism: kreatorning qisqa bio/tavsif matni, 1-2 qatorga sig'adigan oddiy qora/kulrang matn */}
              <p className="text-[15px] sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body line-clamp-2 leading-relaxed break-words">
                {creator.bio}
              </p>

              {/* 4. To'rtinchi qator: kategoriya teglari — har biri kichik rangli nuqta (•) + matn ko'rinishida */}
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13.5px] sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                  <span>{creator.category}</span>
                </span>
                {creator.tags.slice(0, 3).map((tag, idx) => {
                  const dotColors = ['bg-purple-500', 'bg-pink-500', 'bg-amber-500'];
                  const dotColor = dotColors[idx % dotColors.length];
                  return (
                    <span key={tag} className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                      <span>{tag}</span>
                    </span>
                  );
                })}
              </div>

              {/* 5. Ingichka gorizontal ajratuvchi chiziq (divider) */}
              <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />

              {/* 6. Progress-bar qatori: chapda ingichka chiziq (Collabix brend gradienti), o'ng tomonda foiz raqami */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, creator.profileCompletion ?? 0))}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
                  {`${Math.min(100, Math.max(0, creator.profileCompletion ?? 0))}%`}
                </span>
              </div>

              {/* 7. Eng pastki qator: chapda ijtimoiy tarmoq ikonkalari + obunachilar soni, o'ngda buyurtmalar/ishlar soni va "Brif yuborish" tugmasi */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  {/* Instagram */}
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">
                    <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{creator.followers}</span>
                  </div>

                  {/* TikTok */}
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">
                    <svg
                      className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200 shrink-0 fill-current"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.17 1.15 2.15 2.31 2.39.81.18 1.67.07 2.39-.32.74-.41 1.23-1.14 1.37-1.96.11-.64.1-1.29.1-1.93.01-4.71.01-9.42 0-14.13z" />
                    </svg>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {creator.tiktokFollowers || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  {/* Completed works count */}
                  <span className="text-xs font-body text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{creator.reviewsCount || 0}</span> ta ish
                  </span>

                  {/* "Brif yuborish" direct action button on card (>=44px touch target) */}
                  {currentUser?.role !== 'bloger' && (
                  <button
                    type="button"
                    id={`btn-card-send-brief-${creator.id}`}
                    onClick={(e) => handleCreatorCardSendBrief(e, creator)}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-[13px] sm:text-xs shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Brif yuborish</span>
                  </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button for progressive pagination */}
          {filteredCreators.length > displayCount && (
            <div className="flex justify-center pt-2 pb-2">
              <button
                type="button"
                id="btn-load-more-creators"
                onClick={() => setDisplayCount((prev) => prev + 8)}
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#1A1A24] text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 font-heading font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs hover:shadow-sm cursor-pointer active:scale-98"
              >
                <span>Yana ko'proq ko'rsatish ({filteredCreators.length - displayCount} ta qoldi)</span>
                <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty Filter State: Warm, Natural, and Clear */
        <div
          id="catalog-empty-state"
          className="text-center py-14 sm:py-16 px-5 sm:px-6 bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs max-w-xl mx-auto"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 mb-4 shadow-2xs">
            <Filter className="w-6 h-6 stroke-[2]" />
          </div>

          <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white mb-2">
            Mos keluvchi kreatorlar topilmadi
          </h3>

          <p className="text-[15px] sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body leading-relaxed max-w-md mx-auto mb-6">
            Tanlangan parametrlar yoki qidiruv soʻrovi boʻyicha hech qanday profil chiqmadi. Filtrlarni oʻzgartirib yoki tozalab qayta izlab koʻring.
          </p>

          <button
            type="button"
            id="btn-empty-reset"
            onClick={resetAllFilters}
            className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Barcha filtrlarni tozalash</span>
          </button>
        </div>
      )}

      {/* Creator Detail & Direct Brief Modal */}
      {selectedCreator && (
        <div
          id="creator-detail-modal-backdrop"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-md"
          onClick={handleCloseDetail}
          role="dialog"
          aria-modal="true"
        >
          <div
            id="creator-detail-modal-content"
            className="relative w-full sm:max-w-2xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-[#1A1A24] rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header with Always-Visible Close Button */}
            <div className="shrink-0 flex items-center justify-between px-4 sm:px-7 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-xs z-10">
              <span className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate pr-2">
                {selectedCreator.name}
              </span>
              <button
                type="button"
                id="btn-close-creator-detail"
                onClick={handleCloseDetail}
                className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                aria-label="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-7 pb-[max(28px,calc(env(safe-area-inset-bottom,0px)+20px))] sm:pb-8"
              onFocusCapture={(e) => {
                const target = e.target as HTMLElement;
                if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
                  setTimeout(() => {
                    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
                  }, 280);
                }
              }}
            >
              {!isBriefSubmitted ? (
                <div>
                  {/* Creator Header Profile Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border-2 border-indigo-100 dark:border-indigo-900 shadow-sm">
                      <img
                        src={selectedCreator.avatar}
                        alt={selectedCreator.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        width={112}
                        height={112}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-heading font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                          {selectedCreator.category}
                        </span>
                        {selectedCreator.verified && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-heading font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Tekshirilgan profil</span>
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading break-words">
                        {selectedCreator.name}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base text-slate-600 dark:text-[#D0D0D8] mt-1 font-body">
                        <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-semibold break-all">
                          <Instagram className="w-4 h-4 shrink-0" />
                          {selectedCreator.handle}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          {selectedCreator.city}
                        </span>
                      </div>

                      {/* Stats strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Obunachilar</span>
                          <span className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">{selectedCreator.followers}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faollik (ER)</span>
                          <span className="font-heading font-extrabold text-base sm:text-lg text-emerald-600 dark:text-emerald-400">{selectedCreator.engagementRate}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reyting</span>
                          <span className="font-heading font-extrabold text-base sm:text-lg text-amber-500">{selectedCreator.rating > 0 ? `★ ${selectedCreator.rating} (${selectedCreator.reviewsCount})` : 'Hali baho yoʻq'}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Moʻljal narx</span>
                          <span className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white break-words">{selectedCreator.priceDisplay}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Creator Specialty & Bio */}
                  <div className="py-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                      <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 inline-block" />
                        Asosiy mutaxassislik yoʻnalishi
                      </div>
                      <p className="text-base sm:text-lg font-heading font-bold text-slate-900 dark:text-white break-words">
                        {selectedCreator.specialty}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Profil tavsifi (Bio)
                      </h4>
                      <p className="text-[15px] sm:text-base text-slate-700 dark:text-[#D0D0D8] font-body leading-relaxed break-words">
                        {selectedCreator.bio}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedCreator.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Direct Brief Form: Direct contact without barriers */}
                  <div className="pt-5">
                    <div className="mb-4">
                      <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
                        Kreatorga toʻgʻridan-toʻgʻri taklif yuborish
                      </h3>
                      <p className="text-[15px] sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body mt-0.5 leading-relaxed">
                        Quyidagi qisqa maʼlumotlarni toʻldiring, kreativ hamkorlikni boshlash uchun murojaatingiz toʻgʻridan-toʻgʻri yetkaziladi.
                      </p>
                    </div>

                    <form onSubmit={handleSendBrief} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="brief-brand-name"
                            className="block text-sm font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5"
                          >
                            Brend yoki kompaniyangiz nomi
                          </label>
                          <input
                            id="brief-brand-name"
                            type="text"
                            required
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            placeholder="TechStart yoki brend nomi"
                            className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-base sm:text-sm font-body text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-hidden bg-slate-50/50 dark:bg-[#12121A]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="brief-contact-info"
                            className="block text-sm font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5"
                          >
                            Bogʻlanish (Telegram yoki telefon raqam)
                          </label>
                          <input
                            id="brief-contact-info"
                            type="text"
                            required
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            placeholder="@username yoki +998 90 123 45 67"
                            className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-base sm:text-sm font-body text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-hidden bg-slate-50/50 dark:bg-[#12121A]"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="brief-project-goal"
                          className="block text-sm font-heading font-bold text-slate-800 dark:text-slate-200 mb-1.5"
                        >
                          Hamkorlik maqsadi yoki taklif matni (ixtiyoriy)
                        </label>
                        <textarea
                          id="brief-project-goal"
                          rows={3}
                          value={projectGoal}
                          onChange={(e) => setProjectGoal(e.target.value)}
                          placeholder="Reels integratsiyasi, fotosessiya, lookbook yoki rasmiy elchilik haqida qisqacha..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-base sm:text-sm font-body text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-hidden bg-slate-50/50 dark:bg-[#12121A] resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        id="btn-submit-creator-brief"
                        className="w-full min-h-[50px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-extrabold text-[15px] sm:text-base uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-5 h-5 shrink-0" />
                        <span>Taklifni yuborish</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* Success State after sending brief */
                <div id="brief-success-state" className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
                    <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                  </div>

                  <div>
                    <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white">
                      Taklifingiz muvaffaqiyatli yuborildi!
                    </h3>
                    <p className="text-[15px] sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body mt-2 max-w-md mx-auto leading-relaxed">
                      {selectedCreator.name} bilan bogʻlanish uchun maʼlumotlaringiz qabul qilindi. Tez orada siz bilan koʻrsatilgan aloqa vositasi orqali bogʻlaniladi.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleCloseDetail}
                      className="w-full sm:w-auto min-h-[48px] py-3 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center"
                    >
                      Katalogga qaytish
                    </button>
                    {onOpenChat && (
                      <button
                        type="button"
                        id="btn-catalog-go-to-messages"
                        onClick={() => {
                          handleCloseDetail();
                          onOpenChat(selectedCreator?.id);
                        }}
                        className="w-full sm:w-auto min-h-[48px] py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-600/20 flex items-center justify-center"
                      >
                        Xabarlarga oʻtish
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
