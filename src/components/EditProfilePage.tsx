import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  ArrowLeft,
  Check,
  AlertCircle,
  Instagram,
  Youtube,
  Send,
  Video,
  Sparkles,
  DollarSign,
  Globe,
  MapPin,
  User as UserIcon,
  Tag,
  Upload,
  CheckCircle2,
  Loader2,
  Trash2,
  Plus,
  Film,
  Image as ImageIcon,
  Layers,
  Eye,
  Phone,
  PhoneCall,
} from 'lucide-react';
import { UserSession, CreatorMediaItem } from '../types';
import { saveUserProfile, fetchUserProfile, calculateProfileCompletion } from '../firebase';
import { getBloggerCatalogReadiness, isFilledSocialValue } from '../utils/subscription';

// Bo'sh shablon havolalarni (masalan "https://instagram.com/") saqlamaslik uchun tozalash
function cleanSocialLinks<T extends Record<string, any>>(links: T): T {
  const out: Record<string, any> = { ...links };
  for (const key of ['instagram', 'tiktok', 'youtube', 'telegram']) {
    if (typeof out[key] === 'string' && !isFilledSocialValue(out[key])) {
      out[key] = '';
    }
  }
  return out as T;
}

interface EditProfilePageProps {
  user: UserSession | null;
  catalogProOnly?: boolean;
  onOpenProModal?: () => void;
  onSave: (updated: UserSession) => void;
  onBack: () => void;
  onOpenRegister: () => void;
}

// Available options
const CITIES = [
  'Toshkent',
  'Samarqand',
  'Buxoro',
  'Fargʻona',
  'Andijon',
  'Namangan',
  'Qarshi',
  'Nukus',
  'Xiva',
  'Navoiy',
  'Jizzax',
  'Termiz',
  'Guliston',
  'Boshqa shahar',
];

const LANGUAGES = ['Oʻzbek', 'Rus', 'Ingliz'];

const CATEGORIES = [
  { id: 'Blogger', label: 'Blogger' },
  { id: 'Mini Blogger', label: 'Mini Blogger' },
  { id: 'Model', label: 'Model' },
  { id: 'Brand Face', label: 'Brand Face' },
];

const CONTENT_TYPES = [
  'Reels',
  'Story',
  'Post',
  'Sharh',
  'Video',
  'Boshqa',
];


/**
 * Resizes and compresses image to prevent oversized data URLs from exceeding Firestore document limits
 */
function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(reader.result as string);
        }
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({
  user,
  catalogProOnly = true,
  onOpenProModal,
  onSave,
  onBack,
  onOpenRegister,
}) => {
  // 1. Avatar state (All hooks must execute unconditionally before any early returns)
  const [avatar, setAvatar] = useState<string>(user?.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Basic Info state
  const [name, setName] = useState<string>(user?.name || '');
  const [instagramHandle, setInstagramHandle] = useState<string>(user?.instagramHandle || '');
  const [city, setCity] = useState<string>(user?.city?.split(',')[0] || '');
  const [gender, setGender] = useState<'erkak' | 'ayol' | ''>(user?.gender || '');
  const [languages, setLanguages] = useState<string[]>(
    user?.languages && user.languages.length > 0 ? user.languages : ['Oʻzbek']
  );

  // Direct contact information (phone and telegram username)
  const [phoneNumber, setPhoneNumber] = useState<string>(
    user?.phoneNumber || (user as any)?.phone || ''
  );
  const [telegramUsername, setTelegramUsername] = useState<string>(
    user?.telegramUsername ||
      (user?.socialLinks?.telegram && user.socialLinks.telegram !== 'https://t.me/'
        ? user.socialLinks.telegram.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '')
        : '')
  );

  // 3. Bio state
  const [bio, setBio] = useState<string>(user?.bio || '');

  // 4. Categories & Content Types
  const [categories, setCategories] = useState<string[]>(
    user?.categories && user.categories.length > 0 ? user.categories : []
  );
  const [contentTypes, setContentTypes] = useState<string[]>(
    user?.contentTypes && user.contentTypes.length > 0
      ? user.contentTypes
      : ['Reels', 'Story', 'Post']
  );

  // 5. Pricing
  const [priceMin, setPriceMin] = useState<string>(
    user?.priceRange?.min && user.priceRange.min !== '0' ? user.priceRange.min : ''
  );
  const [priceMax, setPriceMax] = useState<string>(
    user?.priceRange?.max && user.priceRange.max !== '0' ? user.priceRange.max : ''
  );

  // 6. Social Links
  const [socialLinks, setSocialLinks] = useState({
    instagram: user?.socialLinks?.instagram || 'https://instagram.com/',
    instagramFollowers: user?.socialLinks?.instagramFollowers || '',
    tiktok: user?.socialLinks?.tiktok || 'https://tiktok.com/@',
    tiktokFollowers: user?.socialLinks?.tiktokFollowers || '',
    youtube: user?.socialLinks?.youtube || '',
    youtubeFollowers: user?.socialLinks?.youtubeFollowers || '',
    telegram: user?.socialLinks?.telegram || 'https://t.me/',
    telegramFollowers: user?.socialLinks?.telegramFollowers || '',
  });

  // Social platforms enabled toggle state
  const [enabledSocials, setEnabledSocials] = useState<{
    instagram: boolean;
    tiktok: boolean;
    youtube: boolean;
    telegram: boolean;
  }>({
    instagram: user?.socialLinks?.instagramEnabled ?? true,
    tiktok: user?.socialLinks?.tiktokEnabled ?? true,
    youtube: user?.socialLinks?.youtubeEnabled ?? Boolean(user?.socialLinks?.youtube),
    telegram: user?.socialLinks?.telegramEnabled ?? true,
  });

  // 7. Model & Brand Face attributes (conditionally used)
  const [height, setHeight] = useState<string>(user?.height?.toString() || '');
  const [weight, setWeight] = useState<string>(user?.weight?.toString() || '');
  const [age, setAge] = useState<string>(user?.age?.toString() || '');
  const [experienceYears, setExperienceYears] = useState<string>(user?.experienceYears?.toString() || '');

  // 8. Media Gallery state (photos & videos)
  const [gallery, setGallery] = useState<CreatorMediaItem[]>(() => {
    if (user?.gallery && Array.isArray(user.gallery) && user.gallery.length > 0) {
      return user.gallery;
    }
    if (user?.mediaGallery && Array.isArray(user.mediaGallery) && user.mediaGallery.length > 0) {
      return user.mediaGallery;
    }
    return [];
  });
  const [newMediaUrl, setNewMediaUrl] = useState<string>('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [galleryInputError, setGalleryInputError] = useState<string | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const [socialWarning, setSocialWarning] = useState<string | null>(null);

  const toggleSocialPlatform = (key: 'instagram' | 'tiktok' | 'youtube' | 'telegram') => {
    const activeCount = Object.values(enabledSocials).filter(Boolean).length;
    // Kamida bitta platforma yoniq bo'lishi shart
    if (enabledSocials[key] && activeCount <= 1) {
      setSocialWarning('Kamida bitta ijtimoiy tarmoq faol boʻlishi kerak');
      setTimeout(() => {
        setSocialWarning(null);
      }, 3500);
      return;
    }
    setSocialWarning(null);
    setEnabledSocials((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // UI status
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saveToast, setSaveToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load fresh profile data from Firestore if available
  useEffect(() => {
    if (user?.uid) {
      let isMounted = true;
      fetchUserProfile(user.uid).then((fresh) => {
        if (!isMounted || !fresh) return;
        if (fresh.avatar) setAvatar(fresh.avatar);
        if (fresh.name) setName(fresh.name);
        if (fresh.phoneNumber) setPhoneNumber(fresh.phoneNumber);
        if (fresh.telegramUsername) setTelegramUsername(fresh.telegramUsername);
        if (fresh.instagramHandle) setInstagramHandle(fresh.instagramHandle);
        if (fresh.city) setCity(fresh.city.split(',')[0]);
        if (fresh.gender) setGender(fresh.gender);
        if (fresh.languages && fresh.languages.length > 0) setLanguages(fresh.languages);
        if (fresh.bio) setBio(fresh.bio);
        if (fresh.categories && fresh.categories.length > 0) setCategories(fresh.categories);
        if (fresh.contentTypes && fresh.contentTypes.length > 0) setContentTypes(fresh.contentTypes);
        if (fresh.priceRange?.min) setPriceMin(fresh.priceRange.min);
        if (fresh.priceRange?.max) setPriceMax(fresh.priceRange.max);
        if (fresh.height) setHeight(fresh.height.toString());
        if (fresh.weight) setWeight(fresh.weight.toString());
        if (fresh.age) setAge(fresh.age.toString());
        if (fresh.experienceYears) setExperienceYears(fresh.experienceYears.toString());
        if (fresh.gallery && Array.isArray(fresh.gallery) && fresh.gallery.length > 0) {
          setGallery(fresh.gallery);
        } else if (fresh.mediaGallery && Array.isArray(fresh.mediaGallery) && fresh.mediaGallery.length > 0) {
          setGallery(fresh.mediaGallery);
        }
        if (fresh.socialLinks) {
          setSocialLinks((prev) => ({ ...prev, ...fresh.socialLinks }));
          setEnabledSocials({
            instagram: fresh.socialLinks.instagramEnabled ?? true,
            tiktok: fresh.socialLinks.tiktokEnabled ?? true,
            youtube: fresh.socialLinks.youtubeEnabled ?? Boolean(fresh.socialLinks.youtube),
            telegram: fresh.socialLinks.telegramEnabled ?? true,
          });
        }
      }).catch((err) => {
        console.error("Firestore profil yuklashda xatolik:", err);
      });

      return () => {
        isMounted = false;
      };
    }
  }, [user?.uid]);

  // Handle file upload with client-side image compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, avatar: 'Rasm hajmi 10MB dan oshmasligi kerak' }));
        return;
      }
      try {
        const compressed = await compressImage(file, 600, 600, 0.82);
        if (compressed) {
          setAvatar(compressed);
          setErrors((prev) => {
            const next = { ...prev };
            delete next.avatar;
            return next;
          });
        }
      } catch (err) {
        console.warn('Avatar yuklashda xatolik:', err);
      }
    }
  };

  // Toggle multi-select tags
  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter((l) => l !== lang));
      }
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const toggleCategory = (catId: string) => {
    if (categories.includes(catId)) {
      setCategories(categories.filter((c) => c !== catId));
    } else {
      setCategories([...categories, catId]);
    }
    if (errors.categories) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.categories;
        return next;
      });
    }
  };

  const toggleContentType = (type: string) => {
    if (contentTypes.includes(type)) {
      if (contentTypes.length > 1) {
        setContentTypes(contentTypes.filter((t) => t !== type));
      }
    } else {
      setContentTypes([...contentTypes, type]);
    }
  };

  // Gallery manipulation handlers
  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setGalleryInputError(null);
    const remainingSlots = 12 - gallery.length;
    if (remainingSlots <= 0) {
      setGalleryInputError('Maksimal 12 tagacha rasm va video yuklash mumkin.');
      return;
    }

    const filesToProcess: File[] = (Array.from(files) as File[]).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      const isVideo = file.type.startsWith('video');
      if (isVideo) {
        setGalleryInputError('Video fayllar uchun toʻgʻridan-toʻgʻri havola (YouTube, Vimeo) kiritish tavsiya etiladi.');
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        setGalleryInputError('Rasm hajmi 15MB dan oshmasligi kerak');
        continue;
      }

      try {
        const resultUrl = await compressImage(file, 1024, 1024, 0.78);
        if (resultUrl) {
          setGallery((prev) => [
            ...prev,
            {
              id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              url: resultUrl,
              type: 'image',
              title: file.name.replace(/\.[^/.]+$/, ''),
            },
          ]);
        }
      } catch (err) {
        console.warn('Galereya rasmini siqishda xatolik:', err);
      }
    }

    if (e.target) {
      e.target.value = '';
    }
  };

  const handleAddMediaUrl = () => {
    if (!newMediaUrl.trim()) return;
    setGalleryInputError(null);
    if (gallery.length >= 12) {
      setGalleryInputError('Maksimal 12 ta element qoʻshish mumkin');
      return;
    }

    const trimmed = newMediaUrl.trim();
    const isVideo = newMediaType === 'video' || trimmed.endsWith('.mp4') || trimmed.endsWith('.mov') || trimmed.includes('youtube') || trimmed.includes('vimeo');
    setGallery((prev) => [
      ...prev,
      {
        id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url: trimmed,
        type: isVideo ? 'video' : 'image',
        title: isVideo ? 'Video portfolio' : 'Foto portfolio',
      },
    ]);
    setNewMediaUrl('');
  };

  const handleRemoveGalleryItem = (id: string) => {
    setGallery((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLoadSampleModelGallery = () => {
    const sampleItems: CreatorMediaItem[] = [
      {
        id: 'sample_1',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=80',
        type: 'image',
        title: 'Asosiy portret',
      },
      {
        id: 'sample_2',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&auto=format&fit=crop&q=80',
        type: 'image',
        title: 'Studio lookbook',
      },
      {
        id: 'sample_3',
        url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=80',
        type: 'image',
        title: 'Moda haftaligi',
      },
      {
        id: 'sample_4',
        url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=80',
        type: 'image',
        title: 'Katalog fotosessiyasi',
      },
      {
        id: 'sample_5',
        url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=900&auto=format&fit=crop&q=80',
        type: 'image',
        title: 'Brend reklamasi',
      },
      {
        id: 'sample_6',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80',
        type: 'image',
        title: 'Podium backstage',
      },
      {
        id: 'sample_7',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&auto=format&fit=crop&q=80',
        type: 'image',
        title: 'Editorial foto',
      },
    ];
    setGallery(sampleItems);
  };

  // Form Validation & Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Toʻliq ism kiritilishi shart';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to top of form smoothly to show error
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);

    const cleanCategories = Array.isArray(categories)
      ? categories.flat(Infinity).filter((c) => typeof c === 'string' && c.trim().length > 0)
      : [];
    const cleanLanguages = Array.isArray(languages)
      ? languages.flat(Infinity).filter((l) => typeof l === 'string' && l.trim().length > 0)
      : ['Oʻzbek'];
    const cleanContentTypes = Array.isArray(contentTypes)
      ? contentTypes.flat(Infinity).filter((ct) => typeof ct === 'string' && ct.trim().length > 0)
      : ['Reels', 'Story', 'Post'];

    const cleanGallery = (gallery || []).map((item, idx) => ({
      id: String(item.id || `media_${Date.now()}_${idx}`),
      url: String(item.url || ''),
      type: (item.type === 'video' ? 'video' : 'image') as 'image' | 'video',
      title: String(item.title || ''),
    }));

    const cleanPhone = phoneNumber.trim();
    const cleanTg = telegramUsername.trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '');
    const cleanInstaHandle = instagramHandle.trim() === '@' ? '' : instagramHandle.trim();

    const completion = calculateProfileCompletion({
      role: user?.role || 'bloger',
      avatar: avatar.trim() || undefined,
      name: name.trim(),
      bio: bio.trim(),
      categories: cleanCategories,
      priceRange: {
        min: priceMin.trim(),
        max: priceMax.trim(),
      },
      instagramHandle: cleanInstaHandle,
      telegramUsername: cleanTg || undefined,
      phoneNumber: cleanPhone || undefined,
      socialLinks: {
        ...cleanSocialLinks(socialLinks),
        instagramEnabled: enabledSocials.instagram,
        tiktokEnabled: enabledSocials.tiktok,
        youtubeEnabled: enabledSocials.youtube,
        telegramEnabled: enabledSocials.telegram,
      },
    });

    const updatedUser: UserSession = {
      ...(user || ({} as UserSession)),
      name: name.trim(),
      phoneNumber: cleanPhone || undefined,
      telegramUsername: cleanTg || undefined,
      avatar: avatar.trim() || undefined,
      city: city.trim(),
      bio: bio.trim(),
      instagramHandle: cleanInstaHandle,
      gender: gender,
      languages: cleanLanguages,
      categories: cleanCategories,
      contentTypes: cleanContentTypes,
      priceRange: {
        min: priceMin.trim(),
        max: priceMax.trim(),
      },
      socialLinks: {
        ...cleanSocialLinks(socialLinks),
        instagramEnabled: enabledSocials.instagram,
        tiktokEnabled: enabledSocials.tiktok,
        youtubeEnabled: enabledSocials.youtube,
        telegramEnabled: enabledSocials.telegram,
      },
      height: height.trim() || undefined,
      weight: weight.trim() || undefined,
      age: age.trim() || undefined,
      experienceYears: experienceYears.trim() || undefined,
      gallery: cleanGallery,
      mediaGallery: cleanGallery,
      profileCompletion: completion,
      accountStatus: user?.accountStatus === 'rejected' ? 'rejected' : 'approved',
    };

    if (user?.uid) {
      try {
        await saveUserProfile(user.uid, updatedUser);
      } catch (err) {
        console.error("Firestore profil saqlashda xatolik:", err);
      }
    }

    onSave(updatedUser);
    setIsSaving(false);
    setSaveToast(true);

    // Auto-hide toast after 3.5 seconds
    setTimeout(() => {
      setSaveToast(false);
    }, 3500);
  };

  // If user is not logged in (safety guard after all hooks are executed)
  if (!user) {
    return (
      <div className="min-h-screen pb-28 pt-12 px-4 sm:px-6 max-w-lg mx-auto text-center">
        <div className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 mb-4">
            <UserIcon className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white mb-2">
            Profilga kirish talab etiladi
          </h2>
          <p className="text-[15px] sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body mb-6 leading-relaxed">
            Profil maʼlumotlarini tahrirlash uchun avval tizimga kiring yoki yangi hisob oching.
          </p>
          <button
            type="button"
            onClick={onOpenRegister}
            className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-heading font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Roʻyxatdan oʻtish / Kirish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFD] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 pb-[calc(124px+env(safe-area-inset-bottom,0px))] pt-4 sm:pt-10 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Top Header / Breadcrumb */}
      <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 min-h-[44px] py-2 text-xs sm:text-sm font-heading font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Profilga qaytish</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-heading font-medium text-slate-500 dark:text-slate-400">
          <span>Kreator sozlamalari</span>
        </div>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
          Profilni tahrirlash
        </h1>
        <p className="text-[15px] sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body mt-1 leading-relaxed">
          Brendlar va hamkorlar siz bilan bogʻlanishi uchun shaxsiy maʼlumotlaringiz, narxlar va yoʻnalishingizni yangilang.
        </p>
      </div>

      {/* Blogger Catalog Visibility 6-Step Checklist & Profile Completion Indicator */}
      {(() => {
        const cleanTgDraft = telegramUsername.trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '');
        const cleanInstaDraft = instagramHandle.trim() === '@' ? '' : instagramHandle.trim();
        const draftUser: Partial<UserSession> = {
          ...user,
          role: user.role || 'bloger',
          avatar: avatar.trim() || undefined,
          name: name.trim(),
          bio: bio.trim(),
          categories: categories,
          priceRange: { min: priceMin.trim(), max: priceMax.trim() },
          instagramHandle: cleanInstaDraft,
          telegramUsername: cleanTgDraft || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          socialLinks: {
            ...cleanSocialLinks(socialLinks),
            instagramEnabled: enabledSocials.instagram,
            tiktokEnabled: enabledSocials.tiktok,
            youtubeEnabled: enabledSocials.youtube,
            telegramEnabled: enabledSocials.telegram,
          },
        };

        const liveScore = calculateProfileCompletion(draftUser);
        const liveReadiness = getBloggerCatalogReadiness(draftUser, catalogProOnly);
        const isBloggerUser = user.role !== 'brend';

        const scrollToSection = (sectionId: string) => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };

        const steps = [
          {
            key: 'avatar',
            label: 'Rasm',
            done: liveReadiness.hasAvatar,
            onClick: () => scrollToSection('section-avatar-heading'),
          },
          {
            key: 'bio',
            label: 'Bio',
            done: liveReadiness.hasBio,
            onClick: () => scrollToSection('section-bio-heading'),
          },
          {
            key: 'category',
            label: 'Kategoriya',
            done: liveReadiness.hasCategory,
            onClick: () => scrollToSection('section-niche-heading'),
          },
          {
            key: 'social',
            label: 'Ijtimoiy tarmoq',
            done: liveReadiness.hasSocial,
            onClick: () => scrollToSection('section-socials-heading'),
          },
          {
            key: 'price',
            label: 'Narx',
            done: liveReadiness.hasPrice,
            onClick: () => scrollToSection('section-pricing-heading'),
          },
          {
            key: 'pro',
            label: 'Pro rejim',
            done: liveReadiness.hasPro,
            onClick: () => {
              if (onOpenProModal) {
                onOpenProModal();
              }
            },
          },
        ];

        return (
          <div
            id="blogger-onboarding-checklist"
            className="mb-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-heading font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className={`w-4 h-4 ${liveReadiness.isVisibleInCatalog ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`} />
                    <span>
                      {isBloggerUser
                        ? 'Katalogda koʻrinish qadamlari'
                        : 'Profil toʻldirilganlik darajasi'}
                    </span>
                  </span>
                  <span className="text-xs font-heading font-extrabold text-indigo-600 dark:text-indigo-400">
                    {liveScore}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      liveScore === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                    }`}
                    style={{ width: `${liveScore}%` }}
                  />
                </div>
              </div>

              {isBloggerUser && liveReadiness.isVisibleInCatalog && (
                <span className="shrink-0 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-heading font-bold border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                  Katalogda faol ✅
                </span>
              )}
            </div>

            {isBloggerUser && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                {steps.map((step) => (
                  <button
                    key={step.key}
                    type="button"
                    onClick={step.onClick}
                    className={`min-h-[44px] px-3 py-2.5 rounded-xl border text-left text-xs font-heading font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                      step.done
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
                        : step.key === 'pro'
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <span className="text-sm leading-none shrink-0" aria-hidden="true">
                      {step.done ? '✅' : '⬜'}
                    </span>
                    <span className="truncate">{step.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Form container with white card sections */}
      <form
        onSubmit={handleSave}
        onFocusCapture={(e) => {
          const target = e.target as HTMLElement;
          if (
            target &&
            (target.tagName === 'INPUT' ||
              target.tagName === 'TEXTAREA' ||
              target.tagName === 'SELECT')
          ) {
            setTimeout(() => {
              target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 250);
          }
        }}
        className="space-y-6"
      >

        {/* 1. YUQORI QISM: AVATAR RASMI */}
        <section
          aria-labelledby="section-avatar-heading"
          className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-xs"
        >
          <h2 id="section-avatar-heading" className="text-base font-heading font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Profil fotosurati</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Circular Avatar with Camera Icon */}
            <div className="relative group shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-950/80 shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer relative"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name || 'Profil fotosurati'}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-heading font-extrabold text-3xl">
                    {name ? name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}

                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-heading font-bold transition-opacity">
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Oʻzgartirish</span>
                </div>
              </div>

              {/* Camera Badge Icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Rasm yuklash"
                className="absolute -bottom-1 -right-1 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors cursor-pointer ring-2 ring-white dark:ring-slate-900"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Avatar upload guidance & preset picker */}
            <div className="flex-1 text-center sm:text-left">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] py-2 px-3 rounded-xl text-sm font-heading font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Rasmni oʻzgartirish</span>
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body mt-0.5">
                JPG, PNG yoki WEBP formatidagi tiniq rasm yuklang (maksimal 5MB).
              </p>


              {errors.avatar && (
                <p className="text-xs text-red-500 font-body mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.avatar}</span>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 2. ASOSIY MA'LUMOTLAR */}
        <section
          aria-labelledby="section-basic-heading"
          className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-xs"
        >
          <h2 id="section-basic-heading" className="text-base font-heading font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Asosiy maʼlumotlar</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label htmlFor="field-name" className="block text-sm font-heading font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Toʻliq ism <span className="text-red-500">*</span>
              </label>
              <input
                id="field-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.name;
                      return next;
                    });
                  }
                }}
                placeholder="Masalan: Madina Karimova"
                className={`w-full min-h-[48px] px-4 py-3 rounded-xl border text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] transition-colors focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 ${
                  errors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 font-body mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Instagram Handle */}
            <div>
              <label htmlFor="field-instagram-handle" className="block text-sm font-heading font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Instagram @handle
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-mono text-sm">
                  @
                </span>
                <input
                  id="field-instagram-handle"
                  type="text"
                  value={instagramHandle.replace(/^@/, '')}
                  onChange={(e) => setInstagramHandle(`@${e.target.value.replace(/^@/, '')}`)}
                  placeholder="madina_lifestyle"
                  className="w-full min-h-[48px] pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] transition-colors focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label htmlFor="field-city" className="block text-sm font-heading font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Shahar
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="field-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full min-h-[48px] pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] transition-colors focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 cursor-pointer"
                >
                  <option value="" disabled className="bg-white dark:bg-[#1A1A24] text-slate-500">
                    Shaharni tanlang
                  </option>
                  {CITIES.map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-[#1A1A24] text-slate-900 dark:text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gender */}
            <div>
              <span className="block text-sm font-heading font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Jins
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('erkak')}
                  className={`min-h-[48px] py-2.5 px-4 rounded-xl border text-sm font-heading font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    gender === 'erkak'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span>Erkak</span>
                  {gender === 'erkak' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => setGender('ayol')}
                  className={`min-h-[48px] py-2.5 px-4 rounded-xl border text-sm font-heading font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    gender === 'ayol'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span>Ayol</span>
                  {gender === 'ayol' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-sm font-heading font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Til(lar) <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(bir nechtasini tanlash mumkin)</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`min-h-[44px] py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{lang}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 2.5 BOGʻLANISH MAʼLUMOTLARI (TELEFON & TELEGRAM) */}
        <section
          aria-labelledby="section-contact-heading"
          className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 id="section-contact-heading" className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Bogʻlanish maʼlumotlari</span>
            </h2>
            <span className="text-[11px] font-heading font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Tezkor aloqa
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-body mb-5">
            Qabul qilingan brif va arizalarda tomonlar oʻzaro toʻgʻridan-toʻgʻri bogʻlanishi uchun ishlatiladi. Ikkala maydon ham ixtiyoriy, lekin kamida bittasini toʻldirish tavsiya etiladi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Telefon raqami */}
            <div>
              <label htmlFor="field-phone-number" className="block text-sm font-heading font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Telefon raqami
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="field-phone-number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full min-h-[48px] pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] transition-colors focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                />
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-body mt-1 block">
                Qoʻngʻiroq yoki SMS xabarlar uchun
              </span>
            </div>

            {/* Telegram username */}
            <div>
              <label htmlFor="field-telegram-username" className="block text-sm font-heading font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Telegram username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm pointer-events-none">
                  @
                </span>
                <input
                  id="field-telegram-username"
                  type="text"
                  value={telegramUsername.replace(/^@/, '')}
                  onChange={(e) => setTelegramUsername(e.target.value.replace(/^@/, '').trim())}
                  placeholder="username"
                  className="w-full min-h-[48px] pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] transition-colors focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-600"
                />
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-body mt-1 block">
                Telegramda toʻgʻridan-toʻgʻri yozish havolasi (t.me/username)
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 font-body leading-relaxed">
              <strong>Eslatma:</strong> Qabul qilingan briflarda bogʻlanish uchun kerak boʻladi. Brif yoki ariza qabul qilinmaguncha boshqa foydalanuvchilarga koʻrsatilmaydi.
            </p>
          </div>
        </section>

        {/* 3. O'ZI HAQIDA */}
        <section
          aria-labelledby="section-bio-heading"
          className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h2 id="section-bio-heading" className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Oʻzi haqida</span>
            </h2>
            <span
              className={`text-xs font-mono font-medium ${
                bio.trim().length > 0 && bio.trim().length < 20
                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                  : bio.length > 450
                  ? 'text-amber-600 font-bold'
                  : bio.trim().length >= 20
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {bio.trim().length}/500 (kamida 20 ta belgi)
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-body mb-3 leading-relaxed">
            Oʻzingiz, auditoriyangiz va qanday mavzularda kontent yaratishingiz haqida qisqacha maʼlumot bering (katalogda koʻrinish uchun kamida 20 ta belgi kiriting).
          </p>

          <textarea
            rows={4}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Oʻzingiz va kontentingiz haqida yozing..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] transition-colors focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 leading-relaxed resize-none"
          />
        </section>

        {/* 4. YO'NALISH VA KONTENT TURLARI */}
        <section
          aria-labelledby="section-niche-heading"
          className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-xs"
        >
          <h2 id="section-niche-heading" className="text-base font-heading font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Yoʻnalish va kontent turlari</span>
          </h2>

          {/* Categories */}
          <div className="mb-6">
            <label className="block text-sm font-heading font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Kategoriya <span className="text-red-500">*</span>{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(bir nechtasini tanlash mumkin)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`min-h-[48px] py-3 px-3 sm:px-3.5 rounded-xl border text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 text-left ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{cat.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
            {errors.categories && (
              <p className="text-xs text-red-500 font-body mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.categories}</span>
              </p>
            )}
          </div>

          {/* Content Types Chips */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-sm font-heading font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Kontent turlari{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(belgilash mumkin boʻlgan teglar)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((type) => {
                const isSelected = contentTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleContentType(type)}
                    className={`min-h-[44px] py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{type}</span>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <span className="text-slate-400">+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4.1 MODEL / BRAND FACE PARAMETRLARI VA PORTFOLIO GALEREYASI (faqat Model yoki Brand Face tanlanganda) */}
        {(categories.includes('Model') || categories.includes('Brand Face')) && (
          <section
            aria-labelledby="section-model-heading"
            className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 p-5 sm:p-8 shadow-xs space-y-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 id="section-model-heading" className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                  Model va Brand Face parametrlari
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                Model va Brand Face portfoliosi uchun muhim parametrlar va tashqi koʻrinish koʻrsatkichlari.
              </p>
            </div>

            {/* Parametrlar: Bo'y (sm), Vazn (kg), Yosh, Tajriba */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              <div>
                <label htmlFor="field-model-height" className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Boʻy (sm)
                </label>
                <div className="relative">
                  <input
                    id="field-model-height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="175"
                    className="w-full min-h-[48px] pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#12121A] text-base sm:text-sm font-body font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    sm
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="field-model-weight" className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Vazn (kg)
                </label>
                <div className="relative">
                  <input
                    id="field-model-weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="54"
                    className="w-full min-h-[48px] pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#12121A] text-base sm:text-sm font-body font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="field-model-age" className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Yosh
                </label>
                <div className="relative">
                  <input
                    id="field-model-age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="22"
                    className="w-full min-h-[48px] pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#12121A] text-base sm:text-sm font-body font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    yosh
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="field-model-experience" className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Tajriba (yil)
                </label>
                <div className="relative">
                  <input
                    id="field-model-experience"
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="3"
                    className="w-full min-h-[48px] pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#12121A] text-base sm:text-sm font-body font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    yil
                  </span>
                </div>
              </div>
            </div>

            {/* Surat va Video Galereyasi (Portfolio) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Surat va video galereyasi (kamida 7-10 tagacha)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-body mt-0.5">
                    Model profilingiz yuqori qismidagi slayd-shouda koʻrinadigan portfolio media fayllari.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleModelGallery}
                    className="min-h-[44px] py-2 px-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    Namunaviy toʻplam
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {gallery.length} / 12 ta
                  </span>
                </div>
              </div>

              {/* Upload Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* File Upload Button */}
                <div>
                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleGalleryFileUpload}
                    className="hidden"
                    id="input-gallery-files"
                  />
                  <label
                    htmlFor="input-gallery-files"
                    className="min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold cursor-pointer transition-colors w-full text-center"
                  >
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>Qurilmadan rasm / video yuklash</span>
                  </label>
                </div>

                {/* Direct URL Input */}
                <div className="flex items-center gap-2 min-w-0">
                  <select
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value as 'image' | 'video')}
                    className="min-h-[48px] shrink-0 py-2.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs font-heading font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <option value="image">Rasm</option>
                    <option value="video">Video</option>
                  </select>
                  <input
                    type="url"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="URL havola (https://...)"
                    className="flex-1 min-w-0 min-h-[48px] px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#12121A] text-base sm:text-xs font-body text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddMediaUrl}
                    aria-label="URL qoʻshish"
                    className="min-w-[48px] min-h-[48px] shrink-0 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-heading font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {galleryInputError && (
                <p className="text-xs text-red-500 font-body flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{galleryInputError}</span>
                </p>
              )}

              {/* Gallery Items Grid Preview */}
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                  {gallery.map((item, idx) => (
                    <div
                      key={item.id}
                      className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-2xs"
                    >
                      {item.type === 'video' ? (
                        <div className="w-full h-full relative bg-slate-900 flex items-center justify-center text-white">
                          <video
                            src={item.url}
                            className="w-full h-full object-cover opacity-80"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Film className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.title || `Portfolio ${idx + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Number badge */}
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 text-white font-mono text-[11px] font-bold">
                        {idx + 1}
                      </span>

                      {/* Type badge */}
                      {item.type === 'video' && (
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-purple-600/90 text-white font-mono text-[10px] font-bold flex items-center gap-0.5">
                          <Film className="w-3 h-3" />
                          <span>Video</span>
                        </span>
                      )}

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryItem(item.id)}
                        aria-label="Oʻchirish"
                        className="absolute top-1 right-1 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-red-600/90 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
                        title="Oʻchirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                  <Film className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-body">
                    Hozircha portfolio rasmlari yuklanmagan. "Qurilmadan yuklash" yoki "Namunaviy toʻplam" tugmasini bosing.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5. NARX (XIZMAT NARXI ORALIG'I) */}
        <section
          aria-labelledby="section-pricing-heading"
          className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-xs"
        >
          <h2 id="section-pricing-heading" className="text-base font-heading font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Xizmat narxi oraligʻi</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-body mb-5 leading-relaxed">
            Brendlar sizning taxminiy byudjet talablaringizni koʻrishi uchun minimal va maksimal xizmat narxini koʻrsating.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="field-price-min" className="block text-sm font-heading font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Minimal narx (dan)
              </label>
              <div className="relative">
                <input
                  id="field-price-min"
                  type="text"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="500 000"
                  className="w-full min-h-[48px] pl-4 pr-16 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-mono font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] transition-colors focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-heading font-bold text-slate-500 dark:text-slate-400 pointer-events-none">
                  soʻm
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="field-price-max" className="block text-sm font-heading font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Maksimal narx (gacha)
              </label>
              <div className="relative">
                <input
                  id="field-price-max"
                  type="text"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="3 000 000"
                  className="w-full min-h-[48px] pl-4 pr-16 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-mono font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] transition-colors focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-heading font-bold text-slate-500 dark:text-slate-400 pointer-events-none">
                  soʻm
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. IJTIMOIY TARMOQLAR */}
        <section
          aria-labelledby="section-socials-heading"
          className="bg-white dark:bg-[#1A1A24] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
            <h2 id="section-socials-heading" className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Ijtimoiy tarmoqlar va auditoriya</span>
            </h2>
            <span className="text-xs font-heading font-medium text-slate-500 dark:text-slate-400">
              Faol tarmoqlar: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{Object.values(enabledSocials).filter(Boolean).length}</strong> / 4
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-body mb-5 leading-relaxed">
            Oʻzingiz blog yuritadigan ijtimoiy tarmoqlarni yoqing. Har bir faol platforma uchun profil havolasi va obunachilar sonini kiriting.
          </p>

          {/* Warning banner if trying to disable all platforms */}
          {socialWarning && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-heading font-semibold flex items-center gap-2.5 transition-all animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{socialWarning}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* 1. Instagram */}
            <div
              id="social-row-instagram"
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                enabledSocials.instagram
                  ? 'border-indigo-100 dark:border-indigo-900/60 bg-white dark:bg-[#161622] shadow-xs'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-950/60 border border-pink-100 dark:border-pink-900/80 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-heading font-bold text-slate-900 dark:text-white">Instagram</span>
                      <span
                        className={`text-[11px] font-heading font-semibold px-2 py-0.5 rounded-full transition-colors ${
                          enabledSocials.instagram
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
                            : 'text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800'
                        }`}
                      >
                        {enabledSocials.instagram ? 'Faol' : 'Oʻchiq'}
                      </span>
                    </div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 font-body">
                      {enabledSocials.instagram ? 'Reels, Story va postlar' : 'Profilingizda koʻrsatilmaydi'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabledSocials.instagram}
                    id="toggle-social-instagram"
                    onClick={() => toggleSocialPlatform('instagram')}
                    className="min-w-[48px] min-h-[44px] inline-flex items-center justify-end cursor-pointer focus:outline-none"
                  >
                    <span className="sr-only">Instagramni yoqish yoki oʻchirish</span>
                    <span
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        enabledSocials.instagram
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          enabledSocials.instagram ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>

              {/* Collapsible Input Fields */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  enabledSocials.instagram
                    ? 'max-h-64 opacity-100 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800'
                    : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0 pointer-events-none'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2 relative">
                    <Instagram className="w-4 h-4 text-pink-600 dark:text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-social-instagram-url"
                      type="url"
                      value={socialLinks.instagram}
                      onChange={(e) =>
                        setSocialLinks((prev) => ({ ...prev, instagram: e.target.value }))
                      }
                      placeholder="https://instagram.com/profil_nomi"
                      className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <input
                      id="field-social-instagram-followers"
                      type="text"
                      value={socialLinks.instagramFollowers}
                      onChange={(e) =>
                        setSocialLinks((prev) => ({ ...prev, instagramFollowers: e.target.value }))
                      }
                      placeholder="Obunachilar: masalan 45K"
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TikTok */}
            <div
              id="social-row-tiktok"
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                enabledSocials.tiktok
                  ? 'border-indigo-100 dark:border-indigo-900/60 bg-white dark:bg-[#161622] shadow-xs'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-heading font-bold text-slate-900 dark:text-white">TikTok</span>
                      <span
                        className={`text-[11px] font-heading font-semibold px-2 py-0.5 rounded-full transition-colors ${
                          enabledSocials.tiktok
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
                            : 'text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800'
                        }`}
                      >
                        {enabledSocials.tiktok ? 'Faol' : 'Oʻchiq'}
                      </span>
                    </div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 font-body">
                      {enabledSocials.tiktok ? 'Qisqa trend videolar' : 'Profilingizda koʻrsatilmaydi'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabledSocials.tiktok}
                    id="toggle-social-tiktok"
                    onClick={() => toggleSocialPlatform('tiktok')}
                    className="min-w-[48px] min-h-[44px] inline-flex items-center justify-end cursor-pointer focus:outline-none"
                  >
                    <span className="sr-only">TikTokni yoqish yoki oʻchirish</span>
                    <span
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        enabledSocials.tiktok
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          enabledSocials.tiktok ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>

              {/* Collapsible Input Fields */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  enabledSocials.tiktok
                    ? 'max-h-64 opacity-100 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800'
                    : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0 pointer-events-none'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2 relative">
                    <Video className="w-4 h-4 text-slate-900 dark:text-slate-100 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-social-tiktok-url"
                      type="url"
                      value={socialLinks.tiktok}
                      onChange={(e) =>
                        setSocialLinks((prev) => ({ ...prev, tiktok: e.target.value }))
                      }
                      placeholder="https://tiktok.com/@profil_nomi"
                      className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <input
                      id="field-social-tiktok-followers"
                      type="text"
                      value={socialLinks.tiktokFollowers}
                      onChange={(e) =>
                        setSocialLinks((prev) => ({ ...prev, tiktokFollowers: e.target.value }))
                      }
                      placeholder="Obunachilar: masalan 25K"
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. YouTube */}
            <div
              id="social-row-youtube"
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                enabledSocials.youtube
                  ? 'border-indigo-100 dark:border-indigo-900/60 bg-white dark:bg-[#161622] shadow-xs'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/80 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-heading font-bold text-slate-900 dark:text-white">YouTube</span>
                      <span
                        className={`text-[11px] font-heading font-semibold px-2 py-0.5 rounded-full transition-colors ${
                          enabledSocials.youtube
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
                            : 'text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800'
                        }`}
                      >
                        {enabledSocials.youtube ? 'Faol' : 'Oʻchiq'}
                      </span>
                    </div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 font-body">
                      {enabledSocials.youtube ? 'Shorts va katta videolar' : 'Profilingizda koʻrsatilmaydi'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabledSocials.youtube}
                    id="toggle-social-youtube"
                    onClick={() => toggleSocialPlatform('youtube')}
                    className="min-w-[48px] min-h-[44px] inline-flex items-center justify-end cursor-pointer focus:outline-none"
                  >
                    <span className="sr-only">YouTubeni yoqish yoki oʻchirish</span>
                    <span
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        enabledSocials.youtube
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          enabledSocials.youtube ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>

              {/* Collapsible Input Fields */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  enabledSocials.youtube
                    ? 'max-h-64 opacity-100 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800'
                    : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0 pointer-events-none'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2 relative">
                    <Youtube className="w-4 h-4 text-red-600 dark:text-red-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-social-youtube-url"
                      type="url"
                      value={socialLinks.youtube}
                      onChange={(e) =>
                        setSocialLinks((prev) => ({ ...prev, youtube: e.target.value }))
                      }
                      placeholder="https://youtube.com/@kanal_nomi"
                      className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <input
                      id="field-social-youtube-followers"
                      type="text"
                      value={socialLinks.youtubeFollowers}
                      onChange={(e) =>
                        setSocialLinks((prev) => ({ ...prev, youtubeFollowers: e.target.value }))
                      }
                      placeholder="Obunachilar: masalan 10K"
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Telegram */}
            <div
              id="social-row-telegram"
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                enabledSocials.telegram
                  ? 'border-indigo-100 dark:border-indigo-900/60 bg-white dark:bg-[#161622] shadow-xs'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/80 flex items-center justify-center text-sky-500 shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-heading font-bold text-slate-900 dark:text-white">Telegram</span>
                      <span
                        className={`text-[11px] font-heading font-semibold px-2 py-0.5 rounded-full transition-colors ${
                          enabledSocials.telegram
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
                            : 'text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800'
                        }`}
                      >
                        {enabledSocials.telegram ? 'Faol' : 'Oʻchiq'}
                      </span>
                    </div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 font-body">
                      {enabledSocials.telegram ? 'Kanal yoki guruh' : 'Profilingizda koʻrsatilmaydi'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabledSocials.telegram}
                    id="toggle-social-telegram"
                    onClick={() => toggleSocialPlatform('telegram')}
                    className="min-w-[48px] min-h-[44px] inline-flex items-center justify-end cursor-pointer focus:outline-none"
                  >
                    <span className="sr-only">Telegramni yoqish yoki oʻchirish</span>
                    <span
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        enabledSocials.telegram
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          enabledSocials.telegram ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>

              {/* Collapsible Input Fields */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  enabledSocials.telegram
                    ? 'max-h-64 opacity-100 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800'
                    : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0 pointer-events-none'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2 relative">
                    <Send className="w-4 h-4 text-sky-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-social-telegram-url"
                      type="url"
                      value={socialLinks.telegram}
                      onChange={(e) =>
                        setSocialLinks((prev) => ({ ...prev, telegram: e.target.value }))
                      }
                      placeholder="https://t.me/kanal_nomi"
                      className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <input
                      id="field-social-telegram-followers"
                      type="text"
                      value={socialLinks.telegramFollowers}
                      onChange={(e) =>
                        setSocialLinks((prev) => ({ ...prev, telegramFollowers: e.target.value }))
                      }
                      placeholder="Aʼzolar: masalan 15K"
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-base sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </form>

      {/* 7. PASTKI QISM: STICKY SAVE BAR */}
      <div
        id="sticky-save-profile-bar"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] pt-3 pb-[max(12px,calc(env(safe-area-inset-bottom,0px)+8px))] px-4 sm:px-6 transition-all"
      >
        <div className="max-w-4xl mx-auto">
          {saveToast && (
            <div className="sm:hidden mb-2.5 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-heading font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Profil saqlandi ✓</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onBack}
                className="min-h-[48px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 font-heading font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 font-body">
                Oʻzgarishlar darhol hisobingizga kiritiladi
              </span>
            </div>

            <div className="flex items-center gap-3 flex-1 sm:flex-initial justify-end">
              {/* Quick success message badge inside sticky bar (desktop) */}
              {saveToast && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-heading font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Profil saqlandi ✓</span>
                </div>
              )}

              <button
                type="button"
                id="btn-save-creator-profile"
                onClick={() => handleSave()}
                disabled={isSaving}
                className="w-full sm:w-auto min-h-[48px] py-3 px-6 sm:px-7 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-heading font-bold text-sm shadow-md shadow-indigo-600/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saqlanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Saqlash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
