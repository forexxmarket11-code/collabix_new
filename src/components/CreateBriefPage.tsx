import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Check,
  UploadCloud,
  FileText,
  X,
  UserCheck,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Package,
  Calendar,
  DollarSign,
  Repeat,
} from 'lucide-react';
import { CatalogCreator, BriefData, UserSession } from '../types';
import { subscribeToApprovedCreators } from '../firebase';

interface CreateBriefPageProps {
  onBack: () => void;
  onBriefCreated: (brief: BriefData) => void | Promise<boolean | void>;
  onViewOrders: () => void;
  preselectedCreator?: { id: string; name: string; avatar?: string; handle?: string } | null;
  currentUser?: UserSession | null;
}

const FORMAT_OPTIONS = [
  'Video',
  'Reels',
  'Story',
  'Post',
  'Sharh',
  'Boshqa',
];

const CATEGORY_OPTIONS = [
  'Fitness',
  'Moda',
  'Texnologiya',
  "Goʻzallik va parvarish",
  'Ovqat / Fud',
  'Turmush tarzi',
  "Ta'lim",
  'Biznes va moliya',
  'Boshqa',
];

interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

export const CreateBriefPage: React.FC<CreateBriefPageProps> = ({
  onBack,
  onBriefCreated,
  onViewOrders,
  preselectedCreator,
  currentUser,
}) => {
  // 1. Kimlarga yuborilsin (Brif turi)
  const [recipientType, setRecipientType] = useState<'open' | 'direct'>(
    preselectedCreator ? 'direct' : 'open'
  );
  const [approvedCreators, setApprovedCreators] = useState<CatalogCreator[]>([]);

  useEffect(() => {
    const unsub = subscribeToApprovedCreators((creators) => {
      setApprovedCreators(creators);
    });
    return () => unsub();
  }, []);

  const [selectedCreator, setSelectedCreator] = useState<CatalogCreator | null>(() => {
    if (preselectedCreator) {
      return {
        id: preselectedCreator.id,
        name: preselectedCreator.name,
        handle: preselectedCreator.handle || '@creator',
        category: 'Blogger',
        specialty: '',
        city: 'Toshkent',
        avatar: preselectedCreator.avatar || '',
        followers: '100K',
        followersCount: 100000,
        rating: 4.9,
        reviewsCount: 15,
        priceRange: '500k-1.5m',
        priceDisplay: '500 000 — 1 500 000 soʻm',
        verified: true,
        engagementRate: '8.0%',
        bio: '',
        tags: [],
      };
    }
    return null;
  });
  const [creatorSearchQuery, setCreatorSearchQuery] = useState('');

  // 2. Vazifa nomi (Task Title)
  const [taskTitle, setTaskTitle] = useState('');

  // 3. Tavsif (Description)
  const [description, setDescription] = useState('');

  // 4. Format (Formats - multi-select)
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  // 5. Kategoriya (Categories)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // 6. To'lov taklifi (Pul yoki Barter) & Muddat
  const [paymentType, setPaymentType] = useState<'money' | 'barter'>('money');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [barterDescription, setBarterDescription] = useState('');
  const [barterEstimatedValue, setBarterEstimatedValue] = useState('');
  const [deadline, setDeadline] = useState('');

  // 7. Fayl biriktirish (Attached files - optional)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form validation & submission states
  const [errors, setErrors] = useState<{
    taskTitle?: string;
    description?: string;
    formats?: string;
    categories?: string;
    creator?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBriefData, setCreatedBriefData] = useState<BriefData | null>(null);

  // Format toggle handler
  const handleToggleFormat = (format: string) => {
    setSelectedFormats((prev) => {
      const updated = prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format];
      if (updated.length > 0 && errors.formats) {
        setErrors((e) => ({ ...e, formats: undefined }));
      }
      return updated;
    });
  };

  // Category toggle handler
  const handleToggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const updated = prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category];
      if (updated.length > 0 && errors.categories) {
        setErrors((e) => ({ ...e, categories: undefined }));
      }
      return updated;
    });
  };

  // File upload simulation handler
  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles: AttachedFile[] = Array.from(files).map((file) => {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeDisplay = file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${sizeInMB} MB`;
      return {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: sizeDisplay,
        type: file.type,
      };
    });
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Filtered creators for direct selection
  const filteredCreators = approvedCreators.filter((c) => {
    if (!creatorSearchQuery.trim()) return true;
    const q = creatorSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q) ||
      c.specialty.toLowerCase().includes(q)
    );
  });

  // Submit handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newErrors: typeof errors = {};

    if (!taskTitle.trim()) {
      newErrors.taskTitle = 'Vazifa nomini kiritish majburiy';
    }

    if (!description.trim()) {
      newErrors.description = 'Kreator nima qilishi kerakligini yozing';
    }

    if (selectedFormats.length === 0) {
      newErrors.formats = 'Kamida bitta formatni tanlang';
    }

    // Ochiq e'lon uchun kategoriya majburiy
    if (recipientType === 'open' && selectedCategories.length === 0) {
      newErrors.categories = "Ochiq e'lon uchun kamida bitta kategoriya tanlash majburiy (mos kreatorlarni aniqlash uchun)";
    }

    if (recipientType === 'direct' && !selectedCreator) {
      newErrors.creator = 'Iltimos, taklif yuborish uchun aniq kreatorni tanlang';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const descClean = description.trim();
    const requirementsSummary =
      descClean.length > 140 ? `${descClean.slice(0, 137)}...` : descClean;

    const brief: BriefData = {
      id: `brief-${Date.now()}`,
      taskTitle: taskTitle.trim(),
      description: descClean,
      requirementsSummary,
      formats: selectedFormats,
      categories: selectedCategories,
      recipientType,
      selectedCreatorId: selectedCreator?.id,
      selectedCreatorName: selectedCreator?.name,
      selectedCreatorAvatar: selectedCreator?.avatar,
      brandName: currentUser?.name || 'Brend hamkor',
      brandAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=200&q=80',
      brandId: currentUser?.uid,
      paymentType,
      budgetMin: paymentType === 'money' ? (budgetMin.trim() || undefined) : undefined,
      budgetMax: paymentType === 'money' ? (budgetMax.trim() || undefined) : undefined,
      barterDescription: paymentType === 'barter' ? (barterDescription.trim() || undefined) : undefined,
      barterEstimatedValue: paymentType === 'barter' ? (barterEstimatedValue.trim() || undefined) : undefined,
      deadline: deadline.trim() || undefined,
      attachedFiles: attachedFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      applications: [],
      status: 'open',
      createdAt: 'Hozirgina',
    };

    setSubmitError(null);
    Promise.resolve(onBriefCreated(brief))
      .then((result) => {
        if (result === false) {
          setSubmitError("Brifni saqlab boʻlmadi. Internetni tekshirib, qaytadan yuboring.");
          return;
        }
        setIsSuccess(true);
        setCreatedBriefData(brief);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(() => {
        setSubmitError("Brifni saqlab boʻlmadi. Internetni tekshirib, qaytadan yuboring.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // SUCCESS CONFIRMATION VIEW
  if (isSuccess && createdBriefData) {
    return (
      <div className="min-h-screen bg-[#F8FAFD] dark:bg-[#0E0E15] py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-heading font-bold mb-3">
            <span>Muvaffaqiyatli yakunlandi</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Brif joylashtirildi ✓
          </h2>

          <p className="text-sm sm:text-base font-body text-slate-600 dark:text-[#D0D0D8] mb-6 leading-relaxed">
            {createdBriefData.recipientType === 'open' ? (
              <>
                Sizning <strong className="text-slate-900 dark:text-white">"{createdBriefData.taskTitle}"</strong> nomli brifingiz ochiq eʼlon sifatida joylandi. Mos kreatorlar tez orada oʻz takliflarini bildirishadi.
              </>
            ) : (
              <>
                Sizning <strong className="text-slate-900 dark:text-white">"{createdBriefData.taskTitle}"</strong> nomli taklifingiz{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">{createdBriefData.selectedCreatorName}</strong> ga bevosita yuborildi.
              </>
            )}
          </p>

          {/* Quick Summary Card */}
          <div className="bg-slate-50 dark:bg-[#12121A] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-8 text-left space-y-2.5 text-sm">
            <div className="flex items-start justify-between gap-2 text-slate-600 dark:text-[#D0D0D8]">
              <span className="font-medium shrink-0">Tanlangan formatlar:</span>
              <span className="font-heading font-bold text-slate-900 dark:text-white text-right break-words">
                {createdBriefData.formats.join(', ')}
              </span>
            </div>
            {createdBriefData.categories.length > 0 && (
              <div className="flex items-start justify-between gap-2 text-slate-600 dark:text-[#D0D0D8]">
                <span className="font-medium shrink-0">Kategoriya:</span>
                <span className="font-heading font-bold text-slate-900 dark:text-white text-right break-words">
                  {createdBriefData.categories.join(', ')}
                </span>
              </div>
            )}
            {createdBriefData.paymentType === 'barter' ? (
              <div className="flex items-start justify-between gap-2 text-slate-600 dark:text-[#D0D0D8]">
                <span className="font-medium shrink-0">Toʻlov turi:</span>
                <span className="font-heading font-bold text-amber-600 dark:text-amber-400 text-right break-words">
                  🔄 Barter{createdBriefData.barterDescription ? `: ${createdBriefData.barterDescription}` : ''}
                  {createdBriefData.barterEstimatedValue ? ` (taxm. ${createdBriefData.barterEstimatedValue} soʻm)` : ''}
                </span>
              </div>
            ) : (createdBriefData.budgetMin || createdBriefData.budgetMax) ? (
              <div className="flex items-start justify-between gap-2 text-slate-600 dark:text-[#D0D0D8]">
                <span className="font-medium shrink-0">Toʻlov byudjeti:</span>
                <span className="font-heading font-bold text-emerald-700 dark:text-emerald-400 text-right break-words">
                  {createdBriefData.budgetMin ? `${createdBriefData.budgetMin} soʻmdan` : ''}{' '}
                  {createdBriefData.budgetMax ? `${createdBriefData.budgetMax} soʻmgacha` : ''}
                </span>
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-2 text-slate-600 dark:text-[#D0D0D8]">
              <span className="font-medium shrink-0">Yuborilish turi:</span>
              <span className="font-heading font-bold text-slate-900 dark:text-white text-right break-words">
                {createdBriefData.recipientType === 'open'
                  ? 'Ochiq eʼlon (Barcha kreatorlarga)'
                  : `Shaxsiy taklif: ${createdBriefData.selectedCreatorName}`}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <button
              type="button"
              id="btn-brief-view-orders"
              onClick={onViewOrders}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-heading font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Briflarni koʻrish</span>
            </button>

            <button
              type="button"
              id="btn-brief-create-another"
              onClick={() => {
                setTaskTitle('');
                setDescription('');
                setSelectedFormats([]);
                setSelectedCategories([]);
                setRecipientType('open');
                setSelectedCreator(null);
                setPaymentType('money');
                setBudgetMin('');
                setBudgetMax('');
                setBarterDescription('');
                setBarterEstimatedValue('');
                setDeadline('');
                setAttachedFiles([]);
                setIsSuccess(false);
                setCreatedBriefData(null);
              }}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-heading font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Yana yangi brif yaratish</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFD] dark:bg-[#0E0E15] pb-[calc(140px+env(safe-area-inset-bottom,0px))] pt-6 sm:pt-10">
      <div className="max-w-3xl mx-auto px-3.5 sm:px-6">
        {/* Back Navigation Bar */}
        <div className="mb-5">
          <button
            type="button"
            id="btn-brief-back"
            onClick={onBack}
            className="inline-flex items-center gap-2 min-h-[44px] px-2.5 -ml-2.5 rounded-xl text-sm font-heading font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Orqaga qaytish</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/90 dark:border-indigo-900/60 text-xs font-heading font-bold text-indigo-700 dark:text-indigo-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Brendlar uchun hamkorlik brifi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
            Brif yaratish
          </h1>
          <p className="text-[15px] sm:text-base font-body text-slate-600 dark:text-[#D0D0D8] mt-1">
            Vazifa talablari, format va tafsilotlarni bir sahifada toʻldiring va eʼlonni joylashtiring.
          </p>
        </div>

        {/* SINGLE CONTINUOUS FORM CARD */}
        <form
          id="create-brief-form"
          onSubmit={handleSubmit}
          onFocusCapture={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
              setTimeout(() => {
                target.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }, 250);
            }
          }}
          className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-8 space-y-7 sm:space-y-8"
        >
          {/* SECTION 1: BRIF TURI (KIMLARGA YUBORILSIN) */}
          <div id="section-task-recipients" className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-[15px] sm:text-sm font-heading font-bold text-slate-900 dark:text-white">
                  1. Brif turi (kimlarga yuborilsin) <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-xs font-body text-slate-400 dark:text-slate-500">
                  Ochiq yoki shaxsiy
                </span>
              </div>
              <p className="text-sm sm:text-xs text-slate-500 dark:text-[#D0D0D8] font-body mt-1 leading-relaxed">
                Eʼlonni umumiy platformadagi barcha mos kreatorlarga joylaysizmi yoki bitta aniq kreatorga shaxsiy murojaat qilasizmi?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Open public brief */}
              <button
                type="button"
                id="btn-recipient-open"
                onClick={() => {
                  setRecipientType('open');
                  if (errors.creator) setErrors((prev) => ({ ...prev, creator: undefined }));
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  recipientType === 'open'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#12121A] hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      recipientType === 'open'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1A1A24]'
                    }`}
                  >
                    {recipientType === 'open' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-heading font-bold text-slate-900 dark:text-white">
                    Ochiq eʼlon sifatida joylash
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-[#D0D0D8] font-body mt-1">
                    Barcha mos kreatorlar koʻradi va oʻz arizalarini qoldirishadi. Kategoriya tanlash majburiy.
                  </p>
                </div>
              </button>

              {/* Option 2: Direct Creator Proposal */}
              <button
                type="button"
                id="btn-recipient-direct"
                onClick={() => setRecipientType('direct')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  recipientType === 'direct'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#12121A] hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-100/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      recipientType === 'direct'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1A1A24]'
                    }`}
                  >
                    {recipientType === 'direct' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-heading font-bold text-slate-900 dark:text-white">
                    Aniq kreatorga yuborish (shaxsiy)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-[#D0D0D8] font-body mt-1">
                    Katalogdan tanlangan aniq kreatorga shaxsiy taklif yoʻllanadi.
                  </p>
                </div>
              </button>
            </div>

            {/* CREATOR SELECTOR (Shows only if direct selection is chosen) */}
            {recipientType === 'direct' && (
              <div
                id="creator-picker-container"
                className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#12121A] border border-slate-200/90 dark:border-slate-800 space-y-4 animate-in fade-in"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-heading font-bold text-slate-900 dark:text-white">
                    Katalogdan kreator tanlang:
                  </span>
                  {selectedCreator && (
                    <span className="text-xs font-heading font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{selectedCreator.name} tanlandi</span>
                    </span>
                  )}
                </div>

                {/* Search input for creators */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={creatorSearchQuery}
                    onChange={(e) => setCreatorSearchQuery(e.target.value)}
                    placeholder="Ism, sahifa (@) yoki yoʻnalish boʻyicha qidirish..."
                    className="w-full min-h-[48px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-white dark:bg-[#1A1A24] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>

                {/* Creator List Grid */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {filteredCreators.slice(0, 8).map((creator) => {
                    const isPicked = selectedCreator?.id === creator.id;
                    return (
                      <div
                        key={creator.id}
                        onClick={() => {
                          setSelectedCreator(creator);
                          if (errors.creator) setErrors((prev) => ({ ...prev, creator: undefined }));
                        }}
                        className={`p-3 min-h-[56px] rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isPicked
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 ring-1 ring-indigo-500/20'
                            : 'bg-white dark:bg-[#1A1A24] border-slate-200/80 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {creator.avatar ? (
                            <img
                              src={creator.avatar}
                              alt={creator.name}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-heading font-bold text-xs shrink-0 select-none">
                              {(creator.name || 'K').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="block text-sm sm:text-xs font-heading font-bold text-slate-900 dark:text-white truncate">
                              {creator.name}
                            </span>
                            <span className="block text-xs text-slate-500 dark:text-[#D0D0D8] font-body truncate">
                              {creator.handle} • {creator.followers} obunachi
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-colors inline-block ${
                              isPicked
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isPicked ? 'Tanlandi' : 'Tanlash'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {errors.creator && (
                  <p className="text-xs font-heading font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.creator}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* SECTION 2: VAZIFA NOMI */}
          <div id="section-task-title" className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="input-brief-title"
                className="block text-[15px] sm:text-sm font-heading font-bold text-slate-900 dark:text-white"
              >
                2. Vazifa nomi <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-xs font-body text-slate-400 dark:text-slate-500">Qisqa va aniq</span>
            </div>
            <p className="text-sm sm:text-xs text-slate-500 dark:text-[#D0D0D8] font-body">
              Loyiha mazmunini bir qarashda ifodalovchi qisqa sarlavha.
            </p>
            <input
              id="input-brief-title"
              type="text"
              value={taskTitle}
              onChange={(e) => {
                setTaskTitle(e.target.value);
                if (errors.taskTitle) setErrors((prev) => ({ ...prev, taskTitle: undefined }));
              }}
              placeholder="Masalan: Yangi mahsulotni Reels'da tanishtirish"
              className={`w-full min-h-[48px] px-4 py-3 rounded-xl border text-base sm:text-sm font-body text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors ${
                errors.taskTitle
                  ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#12121A] focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
            {errors.taskTitle && (
              <p className="text-xs font-heading font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.taskTitle}</span>
              </p>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* SECTION 3: TAVSIF */}
          <div id="section-task-description" className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="input-brief-description"
                className="block text-[15px] sm:text-sm font-heading font-bold text-slate-900 dark:text-white"
              >
                3. Tavsif: Kreator nima qilishi kerak? <span className="text-rose-500 font-bold">*</span>
              </label>
              <span
                className={`text-xs font-mono font-medium shrink-0 ${
                  description.length > 950 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {description.length}/1000
              </span>
            </div>
            <p className="text-sm sm:text-xs text-slate-500 dark:text-[#D0D0D8] font-body leading-relaxed">
              Mahsulot xususiyatlari, asosiy urgʻu berilishi kerak boʻlgan jihatlar va kreatorga yoʻriqnomani yozing.
            </p>
            <textarea
              id="input-brief-description"
              rows={5}
              maxLength={1000}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder="Kreator video davomida mahsulotning asosiy foydali tomonlarini koʻrsatishi, oʻzining shaxsiy tajribasi bilan boʻlishishi va tomoshabinlarni havola orqali buyurtma berishga chaqirishi kerak..."
              className={`w-full px-4 py-3 rounded-xl border text-base sm:text-sm font-body text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors resize-y min-h-[130px] ${
                errors.description
                  ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#12121A] focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
            {errors.description && (
              <p className="text-xs font-heading font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* SECTION 4: FORMAT (Multi-select) */}
          <div id="section-task-format" className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-[15px] sm:text-sm font-heading font-bold text-slate-900 dark:text-white">
                4. Format <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-xs font-body text-slate-400 dark:text-slate-500">
                Bir nechtasini tanlash mumkin
              </span>
            </div>
            <p className="text-sm sm:text-xs text-slate-500 dark:text-[#D0D0D8] font-body">
              Kreator qaysi formatlarda kontent tayyorlashi lozim?
            </p>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((format) => {
                const isSelected = selectedFormats.includes(format);
                return (
                  <button
                    key={format}
                    type="button"
                    id={`btn-format-${format.toLowerCase()}`}
                    onClick={() => handleToggleFormat(format)}
                    className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-heading font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs border border-transparent'
                        : 'bg-slate-50 dark:bg-[#12121A] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] transition-colors ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'border border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span>{format}</span>
                  </button>
                );
              })}
            </div>
            {errors.formats && (
              <p className="text-xs font-heading font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.formats}</span>
              </p>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* SECTION 5: KATEGORIYA */}
          <div id="section-task-category" className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="block text-[15px] sm:text-sm font-heading font-bold text-slate-900 dark:text-white">
                  5. Kategoriya
                </label>
                {recipientType === 'open' ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-heading font-bold">
                    Ochiq eʼlon uchun majburiy *
                  </span>
                ) : (
                  <span className="text-xs font-body text-slate-400 dark:text-slate-500">
                    (ixtiyoriy)
                  </span>
                )}
              </div>
              <span className="text-xs font-body text-slate-400 dark:text-slate-500">
                Mos yoʻnalishlarni belgilang
              </span>
            </div>
            <p className="text-sm sm:text-xs text-slate-500 dark:text-[#D0D0D8] font-body leading-relaxed">
              {recipientType === 'open'
                ? 'Ochiq eʼlon barcha mos kreatorlarga koʻrinishi va ularning lentasida birinchi chiqishi uchun sohani belgilang.'
                : 'Brendingiz yoki mahsulotingiz tegishli boʻlgan sohalar.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    id={`btn-category-${cat.toLowerCase().replace(/['\s\/]/g, '-')}`}
                    onClick={() => handleToggleCategory(cat)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs border border-slate-900 dark:border-indigo-600'
                        : 'bg-white dark:bg-[#12121A] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isSelected ? `✓ ${cat}` : cat}
                  </button>
                );
              })}
            </div>
            {errors.categories && (
              <p className="text-xs font-heading font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.categories}</span>
              </p>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* SECTION 6: TO'LOV TAKLIFI VA MUDDAT (Ixtiyoriy) */}
          <div id="section-task-budget" className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-[15px] sm:text-sm font-heading font-bold text-slate-900 dark:text-white">
                6. Toʻlov taklifi va Muddat <span className="text-xs font-normal text-slate-500 dark:text-[#D0D0D8] font-body">(ixtiyoriy)</span>
              </label>
              <span className="text-xs font-body text-slate-400 dark:text-slate-500">Kelishuv asosida</span>
            </div>
            <p className="text-sm sm:text-xs text-slate-500 dark:text-[#D0D0D8] font-body leading-relaxed">
              Kreatorga toʻlovni pul shaklida yoki mahsulot/xizmat barteri evaziga taklif qilishingiz mumkin.
            </p>

            {/* 2. "PUL EVAZIGA" TO'LOV - Ikkita oddiy raqam maydoni */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="input-budget-min"
                  className="block text-xs font-heading font-semibold text-slate-600 dark:text-slate-300 mb-1"
                >
                  Byudjet (dan)
                </label>
                <div className="relative">
                  <input
                    id="input-budget-min"
                    type="text"
                    inputMode="numeric"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="Masalan: 2 500 000"
                    className="w-full min-h-[48px] pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-sm font-body text-slate-900 dark:text-white placeholder:text-slate-400 bg-white dark:bg-[#12121A] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-body text-slate-400 dark:text-slate-500 pointer-events-none">
                    soʻm
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-budget-max"
                  className="block text-xs font-heading font-semibold text-slate-600 dark:text-slate-300 mb-1"
                >
                  Byudjet (gacha)
                </label>
                <div className="relative">
                  <input
                    id="input-budget-max"
                    type="text"
                    inputMode="numeric"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="Masalan: 5 000 000"
                    className="w-full min-h-[48px] pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-sm font-body text-slate-900 dark:text-white placeholder:text-slate-400 bg-white dark:bg-[#12121A] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-body text-slate-400 dark:text-slate-500 pointer-events-none">
                    soʻm
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="input-brief-deadline"
                className="block text-xs font-heading font-semibold text-slate-600 dark:text-slate-300 mb-1"
              >
                Topshirish muddati
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-brief-deadline"
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="Masalan: 28-Sentabr, 2026 yoki 7 kun ichida"
                  className="w-full min-h-[48px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-base sm:text-sm font-body text-slate-900 dark:text-white placeholder:text-slate-400 bg-white dark:bg-[#12121A] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* SECTION 7: FAYL BIRIKTIRISH (Ixtiyoriy) */}
          <div id="section-task-files" className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-heading font-bold text-slate-900 dark:text-white">
                7. Fayl biriktirish <span className="text-xs font-normal text-slate-500 dark:text-[#D0D0D8] font-body">(ixtiyoriy)</span>
              </label>
              <span className="text-xs font-body text-slate-400 dark:text-slate-500">Rasm, logo yoki hujjat</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#D0D0D8] font-body">
              Referens materiallar, brend logotipi yoki maxsus qoʻllanma fayllarini yuklashingiz mumkin.
            </p>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.zip"
              className="hidden"
              onChange={(e) => handleFilesAdded(e.target.files)}
            />

            {/* Drag & Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesAdded(e.dataTransfer.files);
              }}
              className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2.5">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-heading font-semibold text-slate-800 dark:text-slate-200">
                Faylni tanlash uchun bosing
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-body mt-0.5">
                yoki faylni bu yerga sudrab olib keling (PNG, JPG, PDF, DOCX)
              </p>
            </div>

            {/* Uploaded files preview list */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="font-heading font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] shrink-0 font-mono">
                        ({file.size})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Oʻchirish"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div
        id="sticky-brief-footer"
        className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 pt-3 px-4 pb-[max(14px,calc(env(safe-area-inset-bottom,0px)+8px))] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.4)]"
      >
        {submitError && (
          <div className="max-w-3xl mx-auto mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300">
            {submitError}
          </div>
        )}
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="hidden sm:block text-xs text-slate-500 dark:text-[#D0D0D8] font-body">
            {selectedFormats.length > 0 ? (
              <span>
                Formatlar:{' '}
                <strong className="text-slate-800 dark:text-white font-heading">
                  {selectedFormats.join(', ')}
                </strong>{' '}
                • {recipientType === 'open' ? 'Ochiq eʼlon' : 'Shaxsiy taklif'}
              </span>
            ) : (
              <span>Majburiy maydonlarni toʻldiring (* bilan belgilangan)</span>
            )}
          </div>

          <button
            type="button"
            id="btn-submit-brief"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-sm sm:text-base tracking-tight shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Eʼlonni joylashtirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
