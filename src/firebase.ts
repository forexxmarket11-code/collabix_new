import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  writeBatch,
  increment,
  deleteDoc,
  deleteField,
  Timestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {
  UserSession,
  UsersStatistics,
  SubscriptionStatus,
  AccountStatus,
  CatalogCreator,
  CreatorCategory,
  BriefData,
  BriefApplication,
  BriefCreatorStatus,
  RevenueStatistics,
  ReferralStatistics,
  MonthlyRevenueItem,
  ReferrerItem,
  ChatMessageItem,
  ChatConversationItem,
  NotificationItem,
  CancellationRecord,
  AgencyApplication,
  AgencyApplicationStatus,
  PaymentRequest,
  PaymentRequestStatus,
  PaymentPurpose,
} from './types';
import {
  isUserPro,
  getBloggerCatalogReadiness,
  isFilledSocialValue,
  isFilledPriceValue,
} from './utils/subscription';

// Provided Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAMTsX2H2MgRE4Mds2nqq27IWdEqz90K2g",
  authDomain: "collabix-f0e09.firebaseapp.com",
  projectId: "collabix-f0e09",
  storageBucket: "collabix-f0e09.firebasestorage.app",
  messagingSenderId: "104896553283",
  appId: "1:104896553283:web:3a37daed0de44322da4ff6",
  measurementId: "G-N72KK5LJF1",
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Safe Firebase Storage reference (graceful fallback if storage service is not provisioned)
export function getSafeStorage() {
  try {
    return getStorage(app);
  } catch {
    return null;
  }
}
export const storage = getSafeStorage();

// Configure Firestore with silent internal logging to prevent transient network retry logs from triggering error boundaries
try {
  setLogLevel('silent');
} catch {}

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  ignoreUndefinedProperties: true,
});

export const ADMIN_UID = 'iNS0otBw1ZalMMhyYUntV1W5ADF3';

export function isCurrentUserAdmin(): boolean {
  return Boolean(auth.currentUser && auth.currentUser.uid === ADMIN_UID);
}

export function requireAdminAuth(): void {
  if (!isCurrentUserAdmin()) {
    const err: any = new Error('Faqat vakolatli administrator ushbu amalni bajara oladi.');
    err.code = 'auth/not-admin';
    throw err;
  }
}

/**
 * Authenticate administrator strictly via Firebase Auth and verify UID === ADMIN_UID.
 * Converts username "sobirovv" internally to "sobirovv@collabix.uz".
 */
export async function loginAdmin(loginInput: string, password: string): Promise<FirebaseUser> {
  const trimmedLogin = loginInput.trim();
  const normalizedEmail =
    trimmedLogin.toLowerCase() === 'sobirovv'
      ? 'sobirovv@collabix.uz'
      : trimmedLogin;

  const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  const fbUser = userCredential.user;

  if (fbUser.uid !== ADMIN_UID) {
    await signOut(auth);
    const err: any = new Error('Sizda administrator huquqi mavjud emas.');
    err.code = 'auth/not-admin';
    throw err;
  }

  return fbUser;
}

/**
 * Normalize an email or Uzbekistan/international phone number to a valid Firebase Auth email
 */
export function normalizeContactToAuthEmail(rawInput: string): {
  authEmail: string;
  isPhone: boolean;
  displayContact: string;
  phoneNumber: string;
} {
  const trimmed = rawInput.trim();
  if (trimmed.includes('@')) {
    return {
      authEmail: trimmed.toLowerCase(),
      isPhone: false,
      displayContact: trimmed,
      phoneNumber: '',
    };
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 9 && digits.length <= 15) {
    const normalizedDigits = digits.length === 9 ? `998${digits}` : digits;
    const formattedPhone = `+${normalizedDigits}`;
    return {
      authEmail: `tel_${normalizedDigits}@collabix.uz`,
      isPhone: true,
      displayContact: formattedPhone,
      phoneNumber: formattedPhone,
    };
  }

  return {
    authEmail: trimmed,
    isPhone: false,
    displayContact: trimmed,
    phoneNumber: '',
  };
}

/**
 * Parolni tiklash: email bilan ro'yxatdan o'tganlarga Google xat yuboradi.
 * Telefon raqam bilan ro'yxatdan o'tganlarda email yo'q, ular adminga murojaat qiladi.
 */
export async function requestPasswordReset(rawContact: string): Promise<void> {
  const value = (rawContact || '').trim();
  if (!value) {
    throw new Error("Avval email manzilingizni yozing, keyin «Parolni unutdingizmi?» ni bosing.");
  }
  const { authEmail, isPhone } = normalizeContactToAuthEmail(value);
  if (isPhone || !authEmail.includes('@')) {
    throw new Error("Telefon raqam bilan roʻyxatdan oʻtgan boʻlsangiz, parolni tiklash uchun forexxmarket11@gmail.com ga roʻyxatdan oʻtgan raqamingizni yozing.");
  }
  try {
    await sendPasswordResetEmail(auth, authEmail);
  } catch (err: any) {
    const code = String(err?.code || '');
    if (code.includes('invalid-email')) {
      throw new Error("Email manzil notoʻgʻri yozilgan.");
    }
    if (code.includes('too-many-requests')) {
      throw new Error("Juda koʻp urinish boʻldi. Birozdan soʻng qayta urinib koʻring.");
    }
    // user-not-found va boshqalarda ham bir xil javob beramiz (kim ro'yxatdan o'tganini oshkor qilmaslik uchun)
  }
}

/**
 * Format Firebase Auth Error codes into friendly, clear Uzbek messages
 */
export function getUzbekAuthErrorMessage(error: any, isPhoneInput = false): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return isPhoneInput
        ? "Bu telefon raqami allaqachon roʻyxatdan oʻtgan. Tizimga kiring."
        : "Bu email allaqachon roʻyxatdan oʻtgan. Tizimga kiring.";
    case 'auth/invalid-email':
      return isPhoneInput
        ? "Telefon raqami notoʻgʻri kiritilgan. Qaytadan tekshirib koʻring."
        : "Email manzili notoʻgʻri kiritilgan. Qaytadan tekshirib koʻring.";
    case 'auth/weak-password':
      return "Parol juda qisqa — kamida 6 ta belgi kiriting.";
    case 'auth/user-not-found':
      return isPhoneInput
        ? "Bu telefon raqami bilan profil topilmadi. Avval roʻyxatdan oʻting."
        : "Bu email bilan profil topilmadi. Avval roʻyxatdan oʻting.";
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return "Login yoki parol notoʻgʻri. Qaytadan tekshirib koʻring.";
    case 'auth/too-many-requests':
      return "Urinishlar koʻpayib ketdi. Biroz kutib, qayta urinib koʻring.";
    case 'auth/network-request-failed':
      return "Internet aloqasi uzildi. Tarmoqni tekshirib, qayta urinib koʻring.";
    default:
      return "Xatolik yuz berdi. Iltimos, qaytadan urinib koʻring.";
  }
}

/**
 * Calculate user profile completion percentage (0 - 100%)
 * Blogerlar uchun: rasm, bio (20+ belgi), kategoriya, ijtimoiy tarmoq, narx (har biri 20%)
 * Brendlar uchun: ism, bio, kategoriya, byudjet, kontakt/ijtimoiy tarmoq (har biri 20%)
 */
export function calculateProfileCompletion(user: Partial<UserSession>): number {
  if (!user) return 0;

  if (user.role !== 'brend') {
    const readiness = getBloggerCatalogReadiness(user, false);
    let bloggerScore = 0;
    if (readiness.hasAvatar) bloggerScore += 20;
    if (readiness.hasBio) bloggerScore += 20;
    if (readiness.hasCategory) bloggerScore += 20;
    if (readiness.hasSocial) bloggerScore += 20;
    if (readiness.hasPrice) bloggerScore += 20;
    return Math.min(100, Math.max(0, bloggerScore));
  }

  let score = 0;

  // 1. Ism (20%)
  if (user.name && typeof user.name === 'string' && user.name.trim().length > 0) {
    score += 20;
  }

  // 2. Bio / qisqacha ma'lumot (20%)
  if (user.bio && typeof user.bio === 'string' && user.bio.trim().length > 0) {
    score += 20;
  }

  // 3. Kategoriya / soha (20%)
  if (Array.isArray(user.categories) && user.categories.length > 0) {
    score += 20;
  }

  // 4. Narx / byudjet oralig'i (20%)
  if (isFilledPriceValue(user.priceRange?.min) || isFilledPriceValue(user.priceRange?.max)) {
    score += 20;
  }

  // 5. Ijtimoiy tarmoqlar va kontaktlar (20%)
  const hasSocial = Boolean(
    isFilledSocialValue(user.instagramHandle) ||
      isFilledSocialValue(user.socialLinks?.instagram) ||
      isFilledSocialValue(user.socialLinks?.telegram) ||
      isFilledSocialValue(user.telegramUsername) ||
      (user.phoneNumber && user.phoneNumber.trim().length > 0) ||
      isFilledSocialValue(user.socialLinks?.tiktok) ||
      isFilledSocialValue(user.socialLinks?.youtube)
  );
  if (hasSocial) {
    score += 20;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Sign up a new user with Email and Password, and save their profile in Firestore 'users' collection
 */
/**
 * ===== Yopiq kontakt ma'lumotlari =====
 * Telefon, Telegram, email va login kontakti endi umumiy users/{uid} hujjatida emas,
 * users/{uid}/private/contact hujjatida saqlanadi. Uni faqat egasi, admin,
 * Pro brendlar, 72 soatlik kontakt ochgan brendlar va ruxsat (grant) berilganlar o'qiy oladi.
 */
export const PRIVATE_CONTACT_FIELDS = ['email', 'contact', 'phoneNumber', 'telegramUsername'] as const;
type PrivateContactField = (typeof PRIVATE_CONTACT_FIELDS)[number];
export type PrivateContact = Partial<Record<PrivateContactField, string>>;

function pickPrivateFields(raw: any): PrivateContact {
  const out: PrivateContact = {};
  for (const key of PRIVATE_CONTACT_FIELDS) {
    if (raw && typeof raw[key] === 'string') out[key] = raw[key];
  }
  return out;
}

function privateContactRef(uid: string) {
  return doc(db, 'users', uid, 'private', 'contact');
}

export function splitPrivateContact<T extends Record<string, any>>(
  data: T
): { publicPart: Record<string, any>; privatePart: PrivateContact; hasPrivate: boolean } {
  const publicPart: Record<string, any> = {};
  const privatePart: PrivateContact = {};
  let hasPrivate = false;
  for (const [key, value] of Object.entries(data || {})) {
    if ((PRIVATE_CONTACT_FIELDS as readonly string[]).includes(key)) {
      hasPrivate = true;
      if (typeof value === 'string') {
        privatePart[key as PrivateContactField] = value;
      }
    } else {
      publicPart[key] = value;
    }
  }
  return { publicPart, privatePart, hasPrivate };
}

/**
 * Kreator/brendning yopiq kontaktini o'qish. Ruxsat bo'lmasa null qaytaradi (xato chiqarmaydi).
 */
export async function fetchPrivateContact(uid: string): Promise<PrivateContact | null> {
  if (!uid || !auth.currentUser) return null;
  try {
    const snap = await getDoc(privateContactRef(uid));
    return snap.exists() ? pickPrivateFields(snap.data()) : {};
  } catch {
    return null;
  }
}

/**
 * Eski hujjatlarda umumiy profilda qolib ketgan kontaktlarni yopiq joyga ko'chiradi
 * (egasi yoki admin chaqiradi). Yopiq hujjatdagi yangi qiymatlar ustidan yozilmaydi.
 */
export async function migrateLegacyPrivateContact(uid: string, publicData: Record<string, any>): Promise<PrivateContact> {
  const { privatePart, hasPrivate } = splitPrivateContact(publicData || {});
  if (!hasPrivate || !auth.currentUser) return {};
  if (auth.currentUser.uid !== uid && !isCurrentUserAdmin()) return {};
  try {
    const existing = (await fetchPrivateContact(uid)) || {};
    const toWrite: PrivateContact = {};
    for (const key of PRIVATE_CONTACT_FIELDS) {
      if (!existing[key] && privatePart[key]) {
        toWrite[key] = privatePart[key];
      }
    }
    if (Object.keys(toWrite).length > 0) {
      await setDoc(privateContactRef(uid), { ...toWrite, updatedAt: serverTimestamp() }, { merge: true });
    }
    const removals: Record<string, any> = {};
    for (const key of PRIVATE_CONTACT_FIELDS) {
      if (key in publicData) removals[key] = deleteField();
    }
    await updateDoc(doc(db, 'users', uid), removals);
    return { ...privatePart, ...existing };
  } catch (err) {
    console.warn("Kontaktni yopiq joyga ko'chirishda xatolik:", err);
    return {};
  }
}

/**
 * Brif qabul qilinganda hamkorga o'z kontaktini ko'rish ruxsatini berish
 * (users/{ownerUid}/contactGrants/{granteeUid}). Faqat egasi yoza oladi.
 */
export async function grantContactAccess(granteeUid: string): Promise<void> {
  const ownerUid = auth.currentUser?.uid;
  if (!ownerUid || !granteeUid || ownerUid === granteeUid) return;
  try {
    await setDoc(doc(db, 'users', ownerUid, 'contactGrants', granteeUid), {
      granteeUid,
      grantedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Kontakt ruxsatini berishda xatolik:', err);
  }
}

/**
 * Telefon raqamini yopiq kontaktdan aniqlash (login kontakti email bo'lsa olinmaydi)
 */
export function pickPhoneFromContact(c?: PrivateContact | null): string | undefined {
  if (!c) return undefined;
  if (c.phoneNumber && c.phoneNumber.trim()) return c.phoneNumber.trim();
  if (c.contact && !c.contact.includes('@') && c.contact.trim()) return c.contact.trim();
  return undefined;
}

export async function registerUser(
  email: string,
  pass: string,
  fullName: string,
  role: 'bloger' | 'brend'
): Promise<UserSession> {
  const { authEmail, isPhone, displayContact, phoneNumber } = normalizeContactToAuthEmail(email);
  const userCredential = await createUserWithEmailAndPassword(auth, authEmail, pass);
  const fbUser = userCredential.user;

  const initialCompletion = calculateProfileCompletion({
    name: fullName.trim(),
    role: role,
    email: isPhone ? '' : displayContact,
    contact: displayContact,
    phoneNumber: phoneNumber,
    telegramUsername: '',
  });

  const newUserProfile: UserSession = {
    uid: fbUser.uid,
    email: isPhone ? '' : (fbUser.email || displayContact),
    name: fullName.trim(),
    contact: displayContact,
    phoneNumber: phoneNumber,
    telegramUsername: '',
    role: role,
    registeredAt: new Date().toLocaleDateString('uz-UZ'),
    city: '',
    profileCompletion: initialCompletion,
    subscriptionStatus: 'free',
    accountStatus: 'approved',
  };

  try {
    // Save to Firestore under 'users/{uid}' with serverTimestamp(), profileCompletion, and accountStatus: 'approved'
    const { publicPart: publicProfile, privatePart: privateProfile } = splitPrivateContact(newUserProfile);
    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        ...publicProfile,
        accountStatus: 'approved',
        profileCompletion: initialCompletion,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (initialWriteErr: any) {
      if (initialWriteErr?.code === 'permission-denied') {
        const { accountStatus: _omittedStatus, ...profileWithoutStatus } = publicProfile;
        await setDoc(doc(db, 'users', fbUser.uid), {
          ...profileWithoutStatus,
          profileCompletion: initialCompletion,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        throw initialWriteErr;
      }
    }
    // Telefon/email faqat yopiq hujjatga yoziladi
    try {
      await setDoc(privateContactRef(fbUser.uid), { ...privateProfile, updatedAt: serverTimestamp() }, { merge: true });
    } catch (privateErr) {
      console.warn("Yopiq kontaktni saqlashda xatolik:", privateErr);
    }
    console.log("[registerUser] Firestore'ga yangi foydalanuvchi hujjati muvaffaqiyatli saqlandi! UID:", fbUser.uid);

    // 2. Yangi ro'yxatdan o'tgan foydalanuvchi haqida server orqali adminga Telegram xabar yuborish
    try {
      const realName = fullName.trim() || "Noma'lum foydalanuvchi";
      const realRole = role === 'brend' ? 'brend' : 'bloger';

      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_user',
          data: {
            name: realName,
            role: realRole,
          },
        }),
      });
    } catch {
      // Xato bo'lsa jim o'tkazib yuboriladi (sayt ishlashi to'xtamaydi)
    }
  } catch (firestoreErr) {
    console.error("Firestore ga profil saqlashda xatolik:", firestoreErr);
  }

  // Cache locally for instant UX
  try {
    localStorage.setItem('collabix_user', JSON.stringify(newUserProfile));
  } catch {}

  return newUserProfile;
}

/**
 * Sign in existing user with Email and Password, and load their profile from Firestore
 */
export async function loginUser(email: string, pass: string): Promise<UserSession> {
  const { authEmail, isPhone, displayContact } = normalizeContactToAuthEmail(email);
  const userCredential = await signInWithEmailAndPassword(auth, authEmail, pass);
  const fbUser = userCredential.user;

  // Retrieve user document from Firestore
  let profile: UserSession | null = null;
  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const rawData = snap.data() as Record<string, any>;
      const migrated = await migrateLegacyPrivateContact(fbUser.uid, rawData);
      const privateData = (await fetchPrivateContact(fbUser.uid)) || {};
      profile = { ...(rawData as UserSession), ...migrated, ...privateData };
      if (!profile.accountStatus || profile.accountStatus === 'pending') {
        profile.accountStatus = 'approved';
      }
    }
  } catch (err) {
    console.error("Firestore dan foydalanuvchi ma'lumotlarini yuklashda xatolik:", err);
  }

  // If no document was found (or offline), create a reasonable session object
  if (!profile) {
    profile = {
      uid: fbUser.uid,
      email: isPhone ? '' : (fbUser.email || displayContact),
      name: fbUser.displayName || displayContact.split('@')[0],
      contact: displayContact,
      role: 'bloger',
      registeredAt: new Date().toLocaleDateString('uz-UZ'),
      city: '',
      accountStatus: 'approved',
    };
  }

  try {
    localStorage.setItem('collabix_user', JSON.stringify(profile));
  } catch {}

  return profile;
}

/**
 * Foydalanuvchi o'z hisobini butunlay o'chiradi (Google Play talabi).
 * Profil, yopiq kontakt, kontakt ruxsatlari va ochish yozuvlari o'chiriladi,
 * keyin Firebase Auth hisobi o'chiriladi. Briflar, xabarlar va to'lov yozuvlari
 * boshqa foydalanuvchilar va hisobot uchun saqlanib qoladi.
 */
export async function deleteMyAccount(password: string): Promise<void> {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.email) {
    throw new Error('Hisobni oʻchirish uchun avval tizimga kiring.');
  }
  if (fbUser.uid === ADMIN_UID) {
    throw new Error('Admin hisobini bu yerdan oʻchirib boʻlmaydi.');
  }
  try {
    await reauthenticateWithCredential(fbUser, EmailAuthProvider.credential(fbUser.email, password));
  } catch (err: any) {
    const code = String(err?.code || '');
    if (code.includes('wrong-password') || code.includes('invalid-credential') || code.includes('invalid-login')) {
      throw new Error('Parol notoʻgʻri. Qaytadan urinib koʻring.');
    }
    if (code.includes('too-many-requests')) {
      throw new Error('Juda koʻp urinish boʻldi. Birozdan soʻng qayta urinib koʻring.');
    }
    throw new Error('Tasdiqlashda xatolik yuz berdi. Internetni tekshirib, qayta urinib koʻring.');
  }

  const uid = fbUser.uid;
  const subcollections = ['contactGrants', 'unlocks', 'private'];
  for (const sub of subcollections) {
    try {
      const snap = await getDocs(collection(db, 'users', uid, sub));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
    } catch {}
  }
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (err) {
    console.warn('Profil hujjatini oʻchirishda xatolik:', err);
  }

  await deleteUser(fbUser);

  try {
    localStorage.removeItem('collabix_user');
  } catch {}
}

/**
 * Sign out user from Firebase Auth
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } finally {
    try {
      localStorage.removeItem('collabix_user');
    } catch {}
  }
}

/**
 * Fetch user profile from Firestore by UID
 */
export async function fetchUserProfile(uid: string): Promise<UserSession | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const privateData = (await fetchPrivateContact(uid)) || {};
      return { ...(snap.data() as UserSession), ...privateData };
    }
  } catch (err) {
    console.error("fetchUserProfile xatosi:", err);
  }
  return null;
}

/**
 * Real-time subscription to a creator document in Firestore 'users' collection.
 * Calls onUpdate with profile or null (and notFound flag) strictly based on Firestore.
 */
export function subscribeToCreatorDocument(
  creatorId: string,
  onUpdate: (profile: UserSession | null, notFound: boolean) => void
): () => void {
  const userDocRef = doc(db, 'users', creatorId);

  const unsubscribe = onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserSession;
        onUpdate({ ...data, uid: snapshot.id }, false);
      } else {
        onUpdate(null, true);
      }
    },
    async (error) => {
      if (error?.code !== 'unavailable') {
        console.warn("Firestore onSnapshot error:", error?.message || error);
      }
      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          onUpdate({ ...(snap.data() as UserSession), uid: snap.id }, false);
        } else {
          onUpdate(null, true);
        }
      } catch {
        onUpdate(null, true);
      }
    }
  );

  return unsubscribe;
}

/**
 * Increment creator profile views in Firestore 'users' collection
 */
export async function incrementCreatorViews(creatorId: string): Promise<void> {
  if (!creatorId || creatorId === 'creator-profile' || creatorId === 'profil') return;
  // Faqat boshqa (tizimga kirgan) foydalanuvchi ko'rganda sanaladi; o'z profilini va admin ko'rishini sanamaymiz
  if (!auth.currentUser || auth.currentUser.uid === creatorId || isCurrentUserAdmin()) {
    return;
  }
  // Bir sessiyada bitta profil bir marta sanaladi
  const seenKey = `collabix_viewed_${creatorId}`;
  try {
    if (sessionStorage.getItem(seenKey)) return;
    sessionStorage.setItem(seenKey, '1');
  } catch {}
  try {
    await updateDoc(doc(db, 'users', creatorId), { views: increment(1) });
  } catch (err) {
    console.debug("Ko'rishlar sonini oshirib bo'lmadi:", err);
  }
}

/**
 * Check if a creator's contact is unlocked for a given brand user (either via Pro or pay-per-contact within 72 hours)
 */
export function isContactUnlockedForUser(
  currentUser: UserSession | null | undefined,
  creatorId: string
): { isUnlocked: boolean; expiresAt?: string; remainingHours?: number; source?: 'pro' | 'paid_unlock' } {
  if (!currentUser) {
    return { isUnlocked: false };
  }

  // 1. Pro brands have unlimited access (active & unexpired)
  if (isUserPro(currentUser) && currentUser.role === 'brend') {
    return { isUnlocked: true, source: 'pro' };
  }

  // 2. Bloggers looking at their own profile or each other
  if (currentUser.uid === creatorId) {
    return { isUnlocked: true, source: 'pro' };
  }

  // 3. Check 72-hour pay-per-contact unlock
  const safeCreatorKey = creatorId.replace(/\./g, '_');
  const unlockRecord = currentUser.unlockedCreators?.[creatorId] || currentUser.unlockedCreators?.[safeCreatorKey];
  if (unlockRecord?.expiresAt) {
    const expiresMs = new Date(unlockRecord.expiresAt).getTime();
    const nowMs = Date.now();
    if (expiresMs > nowMs) {
      const remainingHours = Math.max(1, Math.ceil((expiresMs - nowMs) / (1000 * 60 * 60)));
      return { isUnlocked: true, expiresAt: unlockRecord.expiresAt, remainingHours, source: 'paid_unlock' };
    }
  }

  return { isUnlocked: false };
}

/**
 * Purchase contact package for brand user
 */
export async function purchaseContactPackage(
  userId: string,
  packageType: 'single' | 'mini' | 'standard',
  contactsToAdd: number
): Promise<UserSession> {
  // Faqat admin to'lovni tasdiqlaganda chaqiriladi
  requireAdminAuth();
  const userDocRef = doc(db, 'users', userId);
  const snap = await getDoc(userDocRef);
  const existing = (snap.exists() ? snap.data() : {}) as UserSession;
  const currentCount = existing.unlockedContactsCount || 0;
  const newCount = currentCount + contactsToAdd;

  const updates: Partial<UserSession> = {
    unlockedContactsCount: newCount,
    updatedAt: serverTimestamp(),
  };

  await setDoc(userDocRef, updates, { merge: true });

  const updatedSession: UserSession = {
    ...existing,
    uid: userId,
    unlockedContactsCount: newCount,
  };

  try {
    const currentStr = localStorage.getItem('collabix_user');
    if (currentStr) {
      const parsed = JSON.parse(currentStr);
      localStorage.setItem('collabix_user', JSON.stringify({ ...parsed, ...updatedSession }));
    }
  } catch {}

  return updatedSession;
}

/**
 * Unlock a specific creator's contact for 72 hours using 1 balance point
 */
export async function unlockCreatorContact(
  userId: string,
  creatorId: string
): Promise<{ success: boolean; updatedUser: UserSession; expiresAt: string }> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Kontakt ochish uchun oʻz hisobingizga kiring.');
  }
  const userDocRef = doc(db, 'users', userId);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('Foydalanuvchi topilmadi');
  }

  const existing = snap.data() as UserSession;
  const balance = typeof existing.unlockedContactsCount === 'number' ? existing.unlockedContactsCount : 0;
  if (balance <= 0) {
    throw new Error("Sizda kontakt ochish balansi mavjud emas. Iltimos, paket xarid qiling.");
  }

  const now = new Date();
  const expiresDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 soat
  const expiresAt = expiresDate.toISOString();
  const unlockedAt = now.toISOString();

  const currentUnlockedMap = existing.unlockedCreators || {};
  const safeCreatorKey = creatorId.replace(/\./g, '_');
  const updatedUnlockedMap = {
    ...currentUnlockedMap,
    [safeCreatorKey]: { unlockedAt, expiresAt },
  };

  const newBalance = balance - 1;

  // Bitta paket ichida: ochish yozuvi + balansdan 1 ta yechish (qoidalar ikkalasini birga tekshiradi)
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', userId, 'unlocks', creatorId), {
    creatorId,
    unlockedAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresDate),
  });
  batch.update(userDocRef, {
    unlockedContactsCount: newBalance,
    unlockedCreators: updatedUnlockedMap,
    lastUnlockedCreatorId: creatorId,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  const updatedUser: UserSession = {
    ...existing,
    uid: userId,
    unlockedContactsCount: newBalance,
    unlockedCreators: updatedUnlockedMap,
  };

  try {
    const currentStr = localStorage.getItem('collabix_user');
    if (currentStr) {
      const parsed = JSON.parse(currentStr);
      localStorage.setItem('collabix_user', JSON.stringify({ ...parsed, ...updatedUser }));
    }
  } catch {}

  return { success: true, updatedUser, expiresAt };
}

/**
 * Activate or extend TOP placement for a creator
 */
export async function activateTopPlacement(
  creatorId: string,
  durationDays: number
): Promise<{ updatedUntil: string }> {
  // Faqat admin to'lovni tasdiqlaganda chaqiriladi
  requireAdminAuth();
  const userDocRef = doc(db, 'users', creatorId);
  const snap = await getDoc(userDocRef);
  const existing = (snap.exists() ? snap.data() : {}) as UserSession;

  const nowMs = Date.now();
  let baseMs = nowMs;
  if (existing.topPlacementUntil) {
    const curEndMs = new Date(existing.topPlacementUntil).getTime();
    if (curEndMs > nowMs) {
      baseMs = curEndMs; // extend existing TOP
    }
  }

  const newEndMs = baseMs + durationDays * 24 * 60 * 60 * 1000;
  const topPlacementUntil = new Date(newEndMs).toISOString();

  await setDoc(userDocRef, {
    topPlacementUntil,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  try {
    const currentStr = localStorage.getItem('collabix_user');
    if (currentStr) {
      const parsed = JSON.parse(currentStr);
      if (parsed.uid === creatorId) {
        localStorage.setItem('collabix_user', JSON.stringify({ ...parsed, topPlacementUntil }));
      }
    }
  } catch {}

  return { updatedUntil: topPlacementUntil };
}

/**
 * Deeply sanitizes data before writing to Firestore.
 * Prevents "Property array contains an invalid nested entity" errors:
 * - Flattens any nested arrays (Firestore strictly forbids arrays containing arrays)
 * - Removes undefined, functions, and symbols
 * - Strips invalid map keys (e.g. keys containing dots '.')
 * - Cleans array elements to be plain primitive values or valid maps without nested arrays
 */
export function sanitizeFirestoreData<T = any>(val: any): T {
  if (val === null || val === undefined) {
    return val;
  }

  // Preserve Firestore FieldValues (such as serverTimestamp())
  if (
    typeof val === 'object' &&
    ((val as any)._methodName || (val as any).toMillis || (val as any).nanoseconds !== undefined)
  ) {
    return val;
  }

  // Preserve Date instances
  if (val instanceof Date) {
    return val as any;
  }

  // Strip File, Blob, FileList, or DOM objects that cannot be serialized to Firestore
  if (
    typeof val === 'object' &&
    (typeof (val as any).arrayBuffer === 'function' ||
      (val as any).nodeType !== undefined ||
      (val as any).constructor?.name === 'File' ||
      (val as any).constructor?.name === 'Blob' ||
      (val as any).constructor?.name === 'FileList')
  ) {
    return undefined as any;
  }

  if (Array.isArray(val)) {
    // Strictly flatten all nested arrays so no array can ever contain an array
    const flat: any[] = [];
    const flatten = (arr: any[]) => {
      for (const item of arr) {
        if (Array.isArray(item)) {
          flatten(item);
        } else if (item !== undefined && typeof item !== 'function' && typeof item !== 'symbol') {
          flat.push(item);
        }
      }
    };
    flatten(val);

    return flat.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const cleanItem: Record<string, any> = {};
        for (const [k, v] of Object.entries(item)) {
          if (v !== undefined && typeof v !== 'function' && typeof v !== 'symbol') {
            const safeKey = k.replace(/\./g, '_');
            if (Array.isArray(v)) {
              // Ensure array inside map in array has no nested arrays
              const subFlat: any[] = [];
              const subFlatten = (subArr: any[]) => {
                for (const subItem of subArr) {
                  if (Array.isArray(subItem)) {
                    subFlatten(subItem);
                  } else if (subItem !== undefined && typeof subItem !== 'function' && typeof subItem !== 'symbol') {
                    subFlat.push(subItem);
                  }
                }
              };
              subFlatten(v);
              cleanItem[safeKey] = subFlat;
            } else if (typeof v === 'object' && v !== null) {
              cleanItem[safeKey] = sanitizeFirestoreData(v);
            } else {
              cleanItem[safeKey] = v;
            }
          }
        }
        return cleanItem;
      }
      return item;
    }) as any;
  }

  if (typeof val === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v === undefined || typeof v === 'function' || typeof v === 'symbol') {
        continue;
      }
      const safeKey = k.replace(/\./g, '_');
      cleanObj[safeKey] = sanitizeFirestoreData(v);
    }
    return cleanObj as T;
  }

  return val;
}

/**
 * Save / Update user profile in Firestore
 */
const PROTECTED_USER_FIELDS = new Set([
  'uid',
  'role',
  'isAdmin',
  'permissions',
  'accountStatus',
  'status',
  'rejectionReason',
  'verified',
  'isVerified',
  'subscriptionStatus',
  'isPro',
  'proStatus',
  'trialStartDate',
  'trialEndDate',
  'subscriptionPlanPrice',
  'topPlacementUntil',
  'paymentStatus',
  'paidAmount',
  'balance',
  'unlockedContactsCount',
  'unlockedCreators',
  'referralCount',
  'createdAt',
]);

/**
 * Save / Update user profile in Firestore
 */
export async function saveUserProfile(uid: string, profile: Partial<UserSession>): Promise<void> {
  if (!auth.currentUser || (auth.currentUser.uid !== uid && !isCurrentUserAdmin())) {
    throw new Error('Profilni tahrirlash uchun oʻz hisobingizga kiring.');
  }

  const docRef = doc(db, 'users', uid);

  // Recalculate profile completion if fields were provided
  let profileCompletion = profile.profileCompletion;
  if (typeof profileCompletion !== 'number') {
    profileCompletion = calculateProfileCompletion(profile);
  }

  const filteredProfile: Record<string, any> = {};
  const adminMode = isCurrentUserAdmin();

  for (const [key, value] of Object.entries(profile)) {
    if (!adminMode && PROTECTED_USER_FIELDS.has(key)) {
      continue;
    }
    filteredProfile[key] = value;
  }

  if (!adminMode) {
    try {
      const existingSnap = await getDoc(docRef);
      if (!existingSnap.exists()) {
        filteredProfile.uid = uid;
        filteredProfile.role = profile.role === 'brend' ? 'brend' : 'bloger';
        filteredProfile.accountStatus = 'approved';
        filteredProfile.subscriptionStatus = 'free';
        filteredProfile.createdAt = serverTimestamp();
      }
    } catch {}
  }

  const { publicPart, privatePart, hasPrivate } = splitPrivateContact(filteredProfile);

  const rawPayload = {
    ...publicPart,
    profileCompletion,
    updatedAt: serverTimestamp(),
  };

  const cleanPayload = sanitizeFirestoreData(rawPayload);

  await setDoc(docRef, cleanPayload, { merge: true });

  if (hasPrivate) {
    await setDoc(privateContactRef(uid), { ...privatePart, updatedAt: serverTimestamp() }, { merge: true });
  }

  // Update local storage
  try {
    const currentStr = localStorage.getItem('collabix_user');
    if (currentStr) {
      const parsed = JSON.parse(currentStr);
      localStorage.setItem('collabix_user', JSON.stringify({ ...parsed, ...cleanPayload, ...privatePart, profileCompletion }));
    }
  } catch {}
}

/**
 * Format date to natural Uzbek string: e.g. "21-oktabr 2026-yil"
 */
export function formatUzbekDate(isoOrDateStr?: string): string {
  if (!isoOrDateStr) return '';
  try {
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return isoOrDateStr;
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    return `${d.getDate()}-${months[d.getMonth()]} ${d.getFullYear()}-yil`;
  } catch {
    return isoOrDateStr;
  }
}

/**
 * Calculate the number of days remaining until trialEndDate
 */
export function getDaysRemainingInTrial(trialEndDateStr?: string): number {
  if (!trialEndDateStr) return 0;
  const endDate = new Date(trialEndDateStr).getTime();
  const now = Date.now();
  const diffMs = endDate - now;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Update user's subscription status in Firestore and localStorage
 */
export async function updateSubscriptionStatus(
  uid: string,
  status: SubscriptionStatus
): Promise<void> {
  requireAdminAuth();
  const docRef = doc(db, 'users', uid);
  await setDoc(
    docRef,
    {
      subscriptionStatus: status,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  try {
    const currentStr = localStorage.getItem('collabix_user');
    if (currentStr) {
      const parsed = JSON.parse(currentStr);
      if (parsed.uid === uid) {
        localStorage.setItem('collabix_user', JSON.stringify({ ...parsed, subscriptionStatus: status }));
      }
    }
  } catch {}
}

/**
 * Record subscription cancellation feedback and update status in Firestore
 */
export async function recordSubscriptionCancellation(params: {
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  userHandle?: string;
  reason: string;
  reasonDetails?: string;
}): Promise<CancellationRecord> {
  const actualUid = auth.currentUser?.uid || params.userId;
  if (!actualUid) {
    throw new Error('Obunani bekor qilish uchun tizimga kiring.');
  }

  const now = new Date();
  const cancelledAt = now.toISOString();
  const cancelledAtMillis = now.getTime();
  const id = `cancel_${cancelledAtMillis}_${actualUid.slice(0, 6)}`;

  const cancellationRecord: CancellationRecord = {
    id,
    userId: actualUid,
    ownerId: actualUid,
    userName: params.userName || "Noma'lum foydalanuvchi",
    userEmail: params.userEmail || '',
    userRole: params.userRole || '',
    userHandle: params.userHandle || '',
    cancelledAt,
    cancelledAtMillis,
    reason: params.reason,
    reasonDetails: params.reasonDetails?.trim() || '',
  };

  // 1. Save to cancellations collection in Firestore
  try {
    const cancelDocRef = doc(db, 'cancellations', id);
    await setDoc(cancelDocRef, cancellationRecord);
  } catch (err) {
    console.error("Firestore'ga bekor qilish ma'lumotlarini saqlashda xatolik:", err);
  }

  // 2. Save cancellation feedback on user doc (only admin modifies protected subscriptionStatus)
  try {
    const userDocRef = doc(db, 'users', actualUid);
    const userUpdates: Record<string, any> = {
      cancellationRequested: true,
      cancellationReason: params.reason,
      cancellationDetails: params.reasonDetails?.trim() || '',
      cancelledAt,
      updatedAt: serverTimestamp(),
    };
    if (isCurrentUserAdmin()) {
      userUpdates.subscriptionStatus = 'cancelled';
    }
    await setDoc(userDocRef, userUpdates, { merge: true });
  } catch (err) {
    console.error("Foydalanuvchi hujjatiga bekor qilish holatini yozishda xatolik:", err);
  }

  // 3. Update localStorage
  try {
    const currentStr = localStorage.getItem('collabix_user');
    if (currentStr) {
      const parsed = JSON.parse(currentStr);
      localStorage.setItem(
        'collabix_user',
        JSON.stringify({
          ...parsed,
          subscriptionStatus: 'cancelled',
          cancellationReason: params.reason,
          cancellationDetails: params.reasonDetails?.trim() || '',
        })
      );
    }
  } catch {}

  return cancellationRecord;
}

/**
 * Subscribe to real-time subscription cancellations list for Admin panel
 */
export function subscribeToCancellationRecords(
  callback: (records: CancellationRecord[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!isCurrentUserAdmin()) {
    callback([]);
    if (onError) onError(new Error('Faqat administrator koʻrishi mumkin.'));
    return () => {};
  }
  const cancellationsCol = collection(db, 'cancellations');
  return onSnapshot(
    cancellationsCol,
    (snapshot) => {
      const records: CancellationRecord[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId || '',
          ownerId: data.ownerId || data.userId || '',
          userName: data.userName || "Noma'lum foydalanuvchi",
          userEmail: data.userEmail || '',
          userRole: data.userRole || '',
          userHandle: data.userHandle || '',
          cancelledAt: data.cancelledAt || new Date().toISOString(),
          cancelledAtMillis: data.cancelledAtMillis || 0,
          reason: data.reason || 'Boshqa sabab',
          reasonDetails: data.reasonDetails || '',
        };
      });

      // Sort by newest cancelledAtMillis desc
      records.sort((a, b) => (b.cancelledAtMillis || 0) - (a.cancelledAtMillis || 0));
      callback(records);
    },
    (err: any) => {
      if (err?.code === 'permission-denied' || err?.code === 'unavailable') {
        callback([]);
        return;
      }
      console.warn("Bekor qilish ma'lumotlarini yuklashda xatolik:", err?.message || err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch one-off subscription cancellations list
 */
export async function fetchCancellationRecords(): Promise<CancellationRecord[]> {
  if (!isCurrentUserAdmin()) return [];
  try {
    const cancellationsCol = collection(db, 'cancellations');
    const snapshot = await getDocs(cancellationsCol);
    const records: CancellationRecord[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId || '',
        ownerId: data.ownerId || data.userId || '',
        userName: data.userName || "Noma'lum foydalanuvchi",
        userEmail: data.userEmail || '',
        userRole: data.userRole || '',
        userHandle: data.userHandle || '',
        cancelledAt: data.cancelledAt || new Date().toISOString(),
        cancelledAtMillis: data.cancelledAtMillis || 0,
        reason: data.reason || 'Boshqa sabab',
        reasonDetails: data.reasonDetails || '',
      };
    });

    records.sort((a, b) => (b.cancelledAtMillis || 0) - (a.cancelledAtMillis || 0));
    return records;
  } catch (err) {
    console.error("fetchCancellationRecords xatoligi:", err);
    return [];
  }
}

/**
 * Activate Pro mode with 59 000 so'm monthly subscription (Admin only)
 */
export async function activateProSubscription(
  uid: string
): Promise<{ trialStartDate: string; trialEndDate: string; subscriptionStatus: SubscriptionStatus; subscriptionPlanPrice: number }> {
  requireAdminAuth();
  const now = new Date();
  const trialStartDate = now.toISOString();
  const proEndMs = now.getTime() + 30 * 24 * 60 * 60 * 1000;
  const trialEndDate = new Date(proEndMs).toISOString();
  const subscriptionStatus: SubscriptionStatus = 'active';
  const subscriptionPlanPrice = 59000;

  const docRef = doc(db, 'users', uid);
  await setDoc(
    docRef,
    {
      trialStartDate,
      trialEndDate,
      proExpiresAtMillis: proEndMs,
      subscriptionStatus,
      subscriptionPlanPrice,
      reminderSent: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  try {
    const currentStr = localStorage.getItem('collabix_user');
    if (currentStr) {
      const parsed = JSON.parse(currentStr);
      if (parsed.uid === uid) {
        localStorage.setItem('collabix_user', JSON.stringify({
          ...parsed,
          trialStartDate,
          trialEndDate,
          subscriptionStatus,
          subscriptionPlanPrice,
          reminderSent: false,
        }));
      }
    }
  } catch {}

  return { trialStartDate, trialEndDate, subscriptionStatus, subscriptionPlanPrice };
}

/**
 * Mark that the trial expiration reminder has been sent / acknowledged
 */
export async function markReminderSent(uid: string): Promise<void> {
  if (!auth.currentUser || (auth.currentUser.uid !== uid && !isCurrentUserAdmin())) return;
  const docRef = doc(db, 'users', uid);
  await setDoc(
    docRef,
    {
      reminderSent: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  try {
    const currentStr = localStorage.getItem('collabix_user');
    if (currentStr) {
      const parsed = JSON.parse(currentStr);
      localStorage.setItem('collabix_user', JSON.stringify({ ...parsed, reminderSent: true }));
    }
  } catch {}
}

/**
 * Set demo trial days remaining (Admin only)
 */
export async function setDemoTrialDaysRemaining(
  uid: string,
  daysRemaining: number,
  resetReminder: boolean = true
): Promise<{ trialStartDate: string; trialEndDate: string; reminderSent: boolean }> {
  requireAdminAuth();
  const now = new Date();
  const trialStartDate = new Date(now.getTime() - (30 - daysRemaining) * 24 * 60 * 60 * 1000).toISOString();
  const trialEndDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000).toISOString();
  const reminderSent = !resetReminder;

  const docRef = doc(db, 'users', uid);
  await setDoc(
    docRef,
    {
      trialStartDate,
      trialEndDate,
      subscriptionStatus: 'trial',
      reminderSent,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  try {
    const currentStr = localStorage.getItem('collabix_user');
    if (currentStr) {
      const parsed = JSON.parse(currentStr);
      if (parsed.uid === uid) {
        localStorage.setItem('collabix_user', JSON.stringify({
          ...parsed,
          trialStartDate,
          trialEndDate,
          subscriptionStatus: 'trial',
          reminderSent,
        }));
      }
    }
  } catch {}

  return { trialStartDate, trialEndDate, reminderSent };
}

/**
 * Fetch users statistics directly from Firestore 'users' collection
 */
export async function fetchUsersStatistics(): Promise<UsersStatistics> {
  requireAdminAuth();
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    const docs = snap.docs;
    const totalUsers = docs.length;

    let bloggersCount = 0;
    let brandsCount = 0;
    let completedProfilesCount = 0;
    let totalCompletionSum = 0;
    let last30DaysCount = 0;

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    // 4 weekly buckets for user growth chart: Week 1 (oldest) to Week 4 (current)
    const weeklyBuckets = [
      { name: '1-hafta', blogger: 0, brand: 0, total: 0 },
      { name: '2-hafta', blogger: 0, brand: 0, total: 0 },
      { name: '3-hafta', blogger: 0, brand: 0, total: 0 },
      { name: '4-hafta', blogger: 0, brand: 0, total: 0 },
    ];

    docs.forEach((docSnapshot) => {
      const data = docSnapshot.data() as UserSession;
      const role = data.role === 'brend' ? 'brend' : 'bloger';
      if (role === 'bloger') {
        bloggersCount++;
      } else {
        brandsCount++;
      }

      // Profile completion (0 - 100%)
      const completion = typeof data.profileCompletion === 'number'
        ? data.profileCompletion
        : calculateProfileCompletion(data);

      if (completion === 100) {
        completedProfilesCount++;
      }
      totalCompletionSum += completion;

      // Extract registration/creation timestamp
      let createdTime: number | null = null;
      if (data.createdAt) {
        if (typeof data.createdAt.toMillis === 'function') {
          createdTime = data.createdAt.toMillis();
        } else if (typeof data.createdAt.toDate === 'function') {
          createdTime = data.createdAt.toDate().getTime();
        } else if (typeof data.createdAt.seconds === 'number') {
          createdTime = data.createdAt.seconds * 1000;
        } else if (typeof data.createdAt === 'string') {
          const parsed = new Date(data.createdAt).getTime();
          if (!isNaN(parsed)) createdTime = parsed;
        }
      }

      // Fallback to updatedAt if createdAt was not set
      if (createdTime === null && data.updatedAt) {
        if (typeof data.updatedAt.toMillis === 'function') {
          createdTime = data.updatedAt.toMillis();
        } else if (typeof data.updatedAt.toDate === 'function') {
          createdTime = data.updatedAt.toDate().getTime();
        } else if (typeof data.updatedAt.seconds === 'number') {
          createdTime = data.updatedAt.seconds * 1000;
        } else if (typeof data.updatedAt === 'string') {
          const parsed = new Date(data.updatedAt).getTime();
          if (!isNaN(parsed)) createdTime = parsed;
        }
      }

      // If document is newly created or without date, assume current time
      if (createdTime === null) {
        createdTime = now;
      }

      if (createdTime >= thirtyDaysAgo) {
        last30DaysCount++;

        // Calculate which of the 4 weeks it belongs to
        const diffMs = Math.max(0, now - createdTime);
        const weekIndex = Math.min(3, Math.max(0, 3 - Math.floor(diffMs / sevenDays)));
        if (role === 'bloger') {
          weeklyBuckets[weekIndex].blogger++;
        } else {
          weeklyBuckets[weekIndex].brand++;
        }
        weeklyBuckets[weekIndex].total++;
      }
    });

    const bloggerPercentage = totalUsers > 0
      ? Math.round((bloggersCount / totalUsers) * 1000) / 10
      : 0;
    const brandPercentage = totalUsers > 0
      ? Math.round((brandsCount / totalUsers) * 1000) / 10
      : 0;

    const averageCompletionPercentage = totalUsers > 0
      ? Math.round(totalCompletionSum / totalUsers)
      : 0;

    const nowFormatted = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

    return {
      totalUsers,
      bloggersCount,
      brandsCount,
      bloggerPercentage,
      brandPercentage,
      last30DaysCount,
      last30DaysGrowthRate: totalUsers > 0 ? Math.round((last30DaysCount / totalUsers) * 100) : 0,
      completedProfilesCount,
      averageCompletionPercentage,
      weeklyGrowth: weeklyBuckets,
      lastUpdated: `Bugun, ${nowFormatted}`,
    };
  } catch (err) {
    console.error("fetchUsersStatistics Firestore xatosi:", err);
    throw err;
  }
}

/**
 * Admin action: Update user's accountStatus ('approved' | 'rejected' | 'pending') and optional rejectionReason
 */
export async function updateUserAccountStatus(
  userId: string,
  status: 'pending' | 'approved' | 'rejected',
  rejectionReason?: string
): Promise<void> {
  requireAdminAuth();
  const docRef = doc(db, 'users', userId);
  const data: Record<string, any> = {
    accountStatus: status,
    updatedAt: serverTimestamp(),
  };
  if (status === 'rejected') {
    data.rejectionReason = rejectionReason ? rejectionReason.trim() : '';
  } else if (status === 'approved') {
    data.rejectionReason = '';
  }
  await setDoc(docRef, data, { merge: true });
}

/**
 * User action: Resubmit profile for admin approval after fixing information
 */
export async function resubmitForApproval(userId: string): Promise<void> {
  if (!auth.currentUser || (auth.currentUser.uid !== userId && !isCurrentUserAdmin())) {
    throw new Error('Faqat oʻz profilingizni qayta yuborishingiz mumkin.');
  }
  const docRef = doc(db, 'users', userId);
  if (isCurrentUserAdmin()) {
    await setDoc(
      docRef,
      {
        accountStatus: 'pending',
        rejectionReason: '',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    await setDoc(
      docRef,
      {
        resubmittedForReview: true,
        resubmittedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

/**
 * Real-time subscription to all users in Firestore for the Admin Panel
 */
export function subscribeToUsersForAdmin(
  callback: (users: UserSession[]) => void
): () => void {
  if (!isCurrentUserAdmin()) {
    callback([]);
    return () => {};
  }
  const usersCol = collection(db, 'users');
  const privateCache: Record<string, PrivateContact> = {};
  const migrated = new Set<string>();
  let generation = 0;
  return onSnapshot(
    usersCol,
    (snapshot) => {
      const currentGen = ++generation;
      const baseUsers: UserSession[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as UserSession;
        if (!migrated.has(docSnap.id) && splitPrivateContact(data as any).hasPrivate) {
          migrated.add(docSnap.id);
          migrateLegacyPrivateContact(docSnap.id, data as any)
            .then((moved) => {
              if (moved && Object.keys(moved).length > 0) {
                privateCache[docSnap.id] = { ...(privateCache[docSnap.id] || {}), ...pickPrivateFields(moved) };
              }
            })
            .catch(() => {});
        }
        return {
          ...data,
          ...(privateCache[docSnap.id] || {}),
          uid: docSnap.id,
          accountStatus: data.accountStatus || 'approved',
        };
      });
      callback(baseUsers);

      // Admin uchun yopiq kontaktlarni fon rejimida yuklash
      const missing = snapshot.docs.map((d) => d.id).filter((id) => !privateCache[id]);
      if (missing.length === 0) return;
      Promise.all(
        missing.map(async (id) => {
          const c = await fetchPrivateContact(id);
          privateCache[id] = c || {};
        })
      ).then(() => {
        if (currentGen !== generation) return;
        callback(baseUsers.map((u) => ({ ...u, ...(privateCache[u.uid || ''] || {}) })));
      });
    },
    (error) => {
      if (error?.code !== 'unavailable') {
        console.warn("Admin users onSnapshot xatosi:", error?.message || error);
      }
    }
  );
}

/**
 * Fetch all users list once for Admin Panel
 */
export async function fetchUsersForAdmin(): Promise<UserSession[]> {
  if (!isCurrentUserAdmin()) return [];
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    return await Promise.all(
      snap.docs.map(async (docSnap) => {
        const data = docSnap.data() as UserSession;
        const privateData = (await fetchPrivateContact(docSnap.id)) || {};
        return {
          ...data,
          ...privateData,
          uid: docSnap.id,
          accountStatus: data.accountStatus || 'approved',
        };
      })
    );
  } catch (err) {
    console.error("fetchUsersForAdmin xatosi:", err);
    return [];
  }
}

/**
 * Subscribe to Auth state changes and real-time user document changes in Firestore
 */
export function onAuthUserChanged(callback: (user: UserSession | null, fbUser: FirebaseUser | null) => void) {
  let docUnsubscribe: (() => void) | null = null;
  let privateUnsubscribe: (() => void) | null = null;

  const authUnsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    if (docUnsubscribe) {
      docUnsubscribe();
      docUnsubscribe = null;
    }
    if (privateUnsubscribe) {
      privateUnsubscribe();
      privateUnsubscribe = null;
    }

    if (fbUser) {
      const isSuperAdmin = fbUser.uid === ADMIN_UID;
      let latestPrivate: PrivateContact = {};
      let latestSnapshot: any = null;
      let migrationAttempted = false;
      let emitProfile: (() => void) | null = null;

      // O'z yopiq kontaktini real vaqtda kuzatish
      privateUnsubscribe = onSnapshot(
        privateContactRef(fbUser.uid),
        (privSnap) => {
          latestPrivate = privSnap.exists() ? pickPrivateFields(privSnap.data()) : {};
          if (emitProfile) emitProfile();
        },
        () => {}
      );

      // Attach real-time snapshot listener on the user's document in Firestore
      const userDocRef = doc(db, 'users', fbUser.uid);
      docUnsubscribe = onSnapshot(
        userDocRef,
        (snapshot) => {
          latestSnapshot = snapshot;
          emitProfile = () => {
          const snapshot = latestSnapshot;
          if (snapshot.exists()) {
            const data = snapshot.data() as UserSession;
            if (!migrationAttempted && splitPrivateContact(data as any).hasPrivate) {
              migrationAttempted = true;
              migrateLegacyPrivateContact(fbUser.uid, data as any).catch(() => {});
            }
            const fullProfile: UserSession = {
              uid: fbUser.uid,
              ...data,
              ...latestPrivate,
              accountStatus: isSuperAdmin
                ? 'approved'
                : data.accountStatus === 'rejected'
                ? 'rejected'
                : 'approved',
              subscriptionStatus: data.subscriptionStatus || 'free',
            };

            callback(fullProfile, fbUser);
            try {
              localStorage.setItem('collabix_user', JSON.stringify(fullProfile));
            } catch {}
          } else {
            // Document doesn't exist yet, provide fallback session
            const fallback: UserSession = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Foydalanuvchi',
              contact: fbUser.email || '',
              role: 'bloger',
              registeredAt: new Date().toLocaleDateString('uz-UZ'),
              accountStatus: 'approved',
              subscriptionStatus: 'free',
            };
            callback(fallback, fbUser);
          }
          };
          emitProfile();
        },
        (error) => {
          if (error?.code !== 'unavailable') {
            console.warn("User document onSnapshot xatosi:", error?.message || error);
          }
          // Fallback fetch
          fetchUserProfile(fbUser.uid).then((prof) => {
            if (prof) {
              callback(
                {
                  ...prof,
                  accountStatus: isSuperAdmin
                    ? 'approved'
                    : prof.accountStatus === 'rejected'
                    ? 'rejected'
                    : 'approved',
                },
                fbUser
              );
            }
          }).catch(() => {});
        }
      );
    } else {
      callback(null, null);
    }
  });

  return () => {
    if (docUnsubscribe) {
      docUnsubscribe();
    }
    if (privateUnsubscribe) {
      privateUnsubscribe();
    }
    authUnsubscribe();
  };
}

/**
 * Converts a Firestore UserSession document to a CatalogCreator format for rendering
 */
export function userSessionToCatalogCreator(user: UserSession): CatalogCreator {
  const minPrice = user.priceRange?.min || '';
  const maxPrice = user.priceRange?.max || '';
  let priceDisplay = 'Kelishuvga binoan';
  if (minPrice && maxPrice) {
    priceDisplay = `${minPrice} — ${maxPrice} soʻm`;
  } else if (minPrice) {
    priceDisplay = `${minPrice} soʻmdan`;
  } else if (maxPrice) {
    priceDisplay = `${maxPrice} soʻmgacha`;
  }

  const rawHandle =
    user.instagramHandle ||
    user.contact ||
    (user.name ? `@${user.name.toLowerCase().replace(/\s+/g, '_')}` : '@creator');
  const handle = rawHandle.startsWith('@')
    ? rawHandle
    : `@${rawHandle.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}`;

  const categoryRaw = (user.categories && user.categories[0]) || 'Blogger';
  let category: CreatorCategory = 'Blogger';
  if (
    categoryRaw === 'Mini Blogger' ||
    categoryRaw === 'Model' ||
    categoryRaw === 'Brand Face'
  ) {
    category = categoryRaw;
  }

  const followersStr =
    user.totalFollowers || user.socialLinks?.instagramFollowers || '—';

  return {
    id: user.uid || '',
    name: user.name || 'Kreator',
    handle,
    category,
    specialty: user.bio || (user.categories && user.categories.join(', ')) || 'Kreativ kontent muallifi',
    city: user.city || 'Oʻzbekiston',
    avatar:
      (user.avatar && !user.avatar.includes('images.unsplash.com') ? user.avatar : '') ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || user.uid || 'collabix')}`,
    followers: followersStr,
    followersCount: typeof (user as any).followersCount === 'number' ? (user as any).followersCount : 0,
    rating: typeof (user as any).rating === 'number' ? (user as any).rating : 0,
    reviewsCount: typeof (user as any).reviewsCount === 'number' ? (user as any).reviewsCount : 0,
    priceRange: '1.5m-5m',
    priceDisplay,
    verified: Boolean(user.verified ?? (user.accountStatus !== 'rejected')),
    engagementRate: user.engagementRate || '—',
    tiktokFollowers: user.socialLinks?.tiktokFollowers || '',
    profileCompletion: typeof user.profileCompletion === 'number' ? user.profileCompletion : undefined,
    bio: user.bio || '',
    tags: user.categories && user.categories.length > 0 ? user.categories : ['Blogger', 'Kontent'],
    height: user.height,
    weight: user.weight,
    age: user.age,
    experienceYears: user.experienceYears,
    views: typeof user.views === 'number' ? user.views : (user as any).viewsCount || 0,
    gallery: user.gallery || user.mediaGallery || [],
    topPlacementUntil: user.topPlacementUntil || null,
    isTopPlacement: Boolean(user.topPlacementUntil && new Date(user.topPlacementUntil).getTime() > Date.now()),
  };
}

/**
 * Subscribe in real-time to Firestore 'settings/catalog' document.
 * Default value when document does not exist: { catalogProOnly: true }.
 */
export function subscribeToCatalogSettings(
  callback: (settings: { catalogProOnly: boolean }) => void
): () => void {
  const settingsRef = doc(db, 'settings', 'catalog');

  return onSnapshot(
    settingsRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        const catalogProOnly =
          typeof data?.catalogProOnly === 'boolean'
            ? data.catalogProOnly
            : typeof data?.proOnly === 'boolean'
            ? data.proOnly
            : true;
        callback({ catalogProOnly });
      } else {
        callback({ catalogProOnly: true });
      }
    },
    () => {
      getDoc(settingsRef)
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data() as any;
            const catalogProOnly =
              typeof data?.catalogProOnly === 'boolean'
                ? data.catalogProOnly
                : typeof data?.proOnly === 'boolean'
                ? data.proOnly
                : true;
            callback({ catalogProOnly });
          } else {
            callback({ catalogProOnly: true });
          }
        })
        .catch(() => {
          callback({ catalogProOnly: true });
        });
    }
  );
}

/**
 * Admin action: Update 'Katalog faqat Pro uchun' setting in Firestore 'settings/catalog'
 */
export async function updateCatalogProOnlySetting(catalogProOnly: boolean): Promise<void> {
  requireAdminAuth();
  const settingsRef = doc(db, 'settings', 'catalog');
  await setDoc(
    settingsRef,
    {
      catalogProOnly,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.uid || ADMIN_UID,
    },
    { merge: true }
  );
}

/**
 * Real-time subscription to catalog-eligible creators from Firestore 'users' collection
 * Condition:
 * - role === 'bloger' (or 'kreator')
 * - accountStatus !== 'rejected'
 * - Complete profile (avatar, bio >= 20, category, >=1 social link, price)
 * - Active Pro subscription (unless settings/catalog has catalogProOnly === false)
 */
export function subscribeToApprovedCreators(
  callback: (creators: CatalogCreator[], rawUsers: UserSession[]) => void,
  onError?: (error: any) => void
): () => void {
  const usersCol = collection(db, 'users');
  const approvedQuery = usersCol;

  let isDisposed = false;
  let snapshotUnsub: (() => void) | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let lastUid: string | null | undefined = undefined;
  let hasEmitted = false;
  let catalogProOnly = true;
  let latestDocs: any[] | null = null;

  const parseDocs = (docs: any[]) => {
    latestDocs = docs;
    const approvedCreators: CatalogCreator[] = [];
    const rawApprovedUsers: UserSession[] = [];

    docs.forEach((docSnap) => {
      const data = docSnap.data() as UserSession;
      const uid = docSnap.id;
      const role = data.role || 'bloger';
      const isCreator = role === 'bloger' || (role as string) === 'kreator';
      if (!isCreator) return;

      const userObj: UserSession = {
        ...data,
        uid,
        accountStatus: data.accountStatus === 'rejected' ? 'rejected' : 'approved',
      };

      const readiness = getBloggerCatalogReadiness(userObj, catalogProOnly);
      if (readiness.isVisibleInCatalog) {
        rawApprovedUsers.push(userObj);
        approvedCreators.push(userSessionToCatalogCreator(userObj));
      }
    });

    hasEmitted = true;
    callback(approvedCreators, rawApprovedUsers);
  };

  const settingsUnsub = subscribeToCatalogSettings((settings) => {
    if (isDisposed) return;
    const prev = catalogProOnly;
    catalogProOnly = settings.catalogProOnly;
    if (prev !== catalogProOnly && latestDocs !== null) {
      parseDocs(latestDocs);
    }
  });

  const cleanupSnapshot = () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (snapshotUnsub) {
      snapshotUnsub();
      snapshotUnsub = null;
    }
  };

  const attachListener = (allowRetry: boolean) => {
    if (isDisposed) return;
    cleanupSnapshot();

    snapshotUnsub = onSnapshot(
      approvedQuery,
      (snapshot) => {
        if (isDisposed) return;
        parseDocs(snapshot.docs);
      },
      async (error) => {
        if (isDisposed) return;
        const code = error?.code || '';

        try {
          const fallbackSnap = await getDocs(approvedQuery);
          if (!isDisposed) {
            parseDocs(fallbackSnap.docs);
            return;
          }
        } catch {
          // Ignore fallback error; retry or resolve empty below
        }

        if (!hasEmitted && !isDisposed) {
          callback([], []);
        }

        if (allowRetry && !isDisposed && (code === 'permission-denied' || code === 'unavailable' || code === 'unauthenticated')) {
          retryTimer = setTimeout(() => {
            if (!isDisposed) {
              attachListener(false);
            }
          }, 2000);
          return;
        }

        if (code !== 'unavailable' && code !== 'permission-denied') {
          console.warn("subscribeToApprovedCreators warning:", error?.message || error);
          if (onError) onError(error);
        }
      }
    );
  };

  const authUnsub = onAuthStateChanged(auth, (fbUser) => {
    if (isDisposed) return;
    const nextUid = fbUser?.uid || null;
    if (lastUid === nextUid && snapshotUnsub) {
      return;
    }
    lastUid = nextUid;
    attachListener(true);
  });

  return () => {
    isDisposed = true;
    settingsUnsub();
    authUnsub();
    cleanupSnapshot();
  };
}

/**
 * Fetch real revenue statistics calculated from Firestore users collection
 */
export async function fetchRevenueStatistics(): Promise<RevenueStatistics> {
  requireAdminAuth();
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);

    let totalRevenue = 0;
    let thisMonthRevenue = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentyabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];

    // Build 6 past months buckets
    const past6Months: { name: string; year: number; monthIndex: number; totalUZS: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      past6Months.push({
        name: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        totalUZS: 0,
      });
    }

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data() as UserSession;
      // Check subscription
      const isSubscribed =
        data.subscriptionStatus === 'active' ||
        data.subscriptionStatus === 'trial';

      if (isSubscribed) {
        const planPrice = typeof data.subscriptionPlanPrice === 'number' && data.subscriptionPlanPrice > 0
          ? data.subscriptionPlanPrice
          : 59000;

        totalRevenue += planPrice;

        // Parse creation/subscription date
        let subDate: Date = now;
        if (data.trialStartDate) {
          subDate = new Date(data.trialStartDate);
        } else if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            subDate = data.createdAt.toDate();
          } else if (typeof data.createdAt.seconds === 'number') {
            subDate = new Date(data.createdAt.seconds * 1000);
          } else if (typeof data.createdAt === 'string') {
            subDate = new Date(data.createdAt);
          }
        }

        if (
          subDate.getFullYear() === currentYear &&
          subDate.getMonth() === currentMonth
        ) {
          thisMonthRevenue += planPrice;
        }

        // Add to corresponding month bucket
        const bucket = past6Months.find(
          (b) => b.year === subDate.getFullYear() && b.monthIndex === subDate.getMonth()
        );
        if (bucket) {
          bucket.totalUZS += planPrice;
        }
      }
    });

    const monthlyRevenueData: MonthlyRevenueItem[] = past6Months.map((b) => ({
      month: b.name,
      amount: Math.round((b.totalUZS / 1000000) * 10) / 10,
      formatted: b.totalUZS > 0 ? `${(b.totalUZS / 1000000).toFixed(1)} mln` : '0 mln',
      rawAmount: b.totalUZS,
    }));

    const averageMonthlyRevenue =
      past6Months.length > 0
        ? Math.round(totalRevenue / past6Months.length)
        : 0;

    const previousMonthTotal = past6Months.length > 1 ? past6Months[past6Months.length - 2].totalUZS : 0;
    const thisMonthGrowthRate =
      previousMonthTotal > 0
        ? Math.round(((thisMonthRevenue - previousMonthTotal) / previousMonthTotal) * 100)
        : thisMonthRevenue > 0
        ? 100
        : 0;

    return {
      totalRevenue,
      thisMonthRevenue,
      thisMonthGrowthRate,
      monthlyRevenueData,
      averageMonthlyRevenue,
    };
  } catch (err) {
    console.error("fetchRevenueStatistics xatosi:", err);
    return {
      totalRevenue: 0,
      thisMonthRevenue: 0,
      thisMonthGrowthRate: 0,
      monthlyRevenueData: [],
      averageMonthlyRevenue: 0,
    };
  }
}

/**
 * Fetch real referral statistics calculated from Firestore
 */
export async function fetchReferralStatistics(): Promise<ReferralStatistics> {
  requireAdminAuth();
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);

    const docs = snap.docs;
    let totalReferralUsers = 0;
    const referrersMap = new Map<string, {
      uid: string;
      name: string;
      handle: string;
      role: string;
      count: number;
    }>();

    docs.forEach((docSnap) => {
      const data = docSnap.data() as UserSession & { referredBy?: string; referralCount?: number };
      const uid = docSnap.id;

      if (data.referredBy) {
        totalReferralUsers++;
        const refId = data.referredBy;
        const existing = referrersMap.get(refId);
        if (existing) {
          existing.count++;
        } else {
          referrersMap.set(refId, {
            uid: refId,
            name: 'Foydalanuvchi',
            handle: '@id_' + refId.slice(0, 6),
            role: 'Bloger',
            count: 1,
          });
        }
      }

      if (typeof data.referralCount === 'number' && data.referralCount > 0) {
        const existing = referrersMap.get(uid);
        if (existing) {
          existing.count = Math.max(existing.count, data.referralCount);
        } else {
          referrersMap.set(uid, {
            uid,
            name: data.name || 'Foydalanuvchi',
            handle: data.instagramHandle || data.contact || '@' + uid.slice(0, 6),
            role: data.role === 'brend' ? 'Brend' : 'Bloger',
            count: data.referralCount,
          });
        }
      }
    });

    // Resolve referrer names from the docs list
    docs.forEach((docSnap) => {
      const uid = docSnap.id;
      if (referrersMap.has(uid)) {
        const data = docSnap.data() as UserSession;
        const ref = referrersMap.get(uid)!;
        ref.name = data.name || ref.name;
        ref.handle = data.instagramHandle || data.contact || ref.handle;
        ref.role = data.role === 'brend' ? 'Brend' : 'Bloger';
      }
    });

    const topReferrers: ReferrerItem[] = Array.from(referrersMap.values())
      .sort((a, b) => b.count - a.count)
      .map((r, idx) => ({
        id: r.uid,
        name: r.name,
        handle: r.handle.startsWith('@') ? r.handle : `@${r.handle}`,
        role: r.role,
        referralCount: r.count,
        rewardAmount: `${(r.count * 30000).toLocaleString('uz-UZ')} soʻm`,
        status: 'Toʻlangan',
      }));

    const totalRewardsPaid = totalReferralUsers * 30000;
    const referralPercentage =
      docs.length > 0
        ? Math.round((totalReferralUsers / docs.length) * 1000) / 10
        : 0;

    return {
      totalReferralUsers,
      referralPercentage,
      totalRewardsPaid,
      pendingRewards: 0,
      topReferrers,
    };
  } catch (err) {
    console.error("fetchReferralStatistics xatosi:", err);
    return {
      totalReferralUsers: 0,
      referralPercentage: 0,
      totalRewardsPaid: 0,
      pendingRewards: 0,
      topReferrers: [],
    };
  }
}

/**
 * Lightweight listener that resolves as soon as Firebase Auth restores session state
 */
export function onFirebaseAuthReady(
  callback: (uid: string | null) => void
): () => void {
  return onAuthStateChanged(auth, (fbUser) => {
    callback(fbUser?.uid || null);
  });
}

/**
 * Admin: eski briflarda saqlanib qolgan telefon/Telegram ma'lumotlarini tozalash.
 * (Avval ariza va qabul qilishda kontaktlar brifga yozilardi; ochiq briflar hammaga ko'rinadi.)
 */
export async function scrubContactsFromBriefs(): Promise<number> {
  if (!isCurrentUserAdmin()) return 0;
  const contactKeys = ['creatorPhoneNumber', 'creatorTelegramUsername', 'brandPhoneNumber', 'brandTelegramUsername'];
  let cleaned = 0;
  try {
    const snap = await getDocs(collection(db, 'briefs'));
    for (const d of snap.docs) {
      const data = d.data() as any;
      const updates: Record<string, any> = {};
      for (const k of contactKeys) {
        if (k in data) updates[k] = deleteField();
      }
      if (Array.isArray(data.applications)) {
        let appsChanged = false;
        const apps = data.applications.map((app: any) => {
          if (!app || typeof app !== 'object') return app;
          const copy = { ...app };
          for (const k of contactKeys) {
            if (k in copy) {
              delete copy[k];
              appsChanged = true;
            }
          }
          return copy;
        });
        if (appsChanged) updates.applications = apps;
      }
      if (Object.keys(updates).length > 0) {
        try {
          await updateDoc(d.ref, updates);
          cleaned++;
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Briflarni tozalashda xatolik:', err);
  }
  return cleaned;
}

/**
 * Real-time subscription to Briefs collection in Firestore
 * - Open briefs ('open') are loaded for the public directory.
 * - Direct briefs ('direct') are strictly loaded ONLY for the targeted creator (selectedCreatorId)
 *   or the creating brand (brandId). Other users' direct briefs are never fetched or displayed.
 */
export function subscribeToBriefs(
  callback: (briefs: BriefData[]) => void,
  onError?: (error: any) => void,
  currentUserId?: string
): () => void {
  const briefsCol = collection(db, 'briefs');

  const openBriefsMap = new Map<string, BriefData>();
  const creatorDirectMap = new Map<string, BriefData>();
  const brandDirectMap = new Map<string, BriefData>();

  function processDoc(docSnap: any): BriefData | null {
    const data = docSnap.data() as BriefData;
    const id = docSnap.id;
    const taskTitle = (data.taskTitle || '').trim();
    const desc = (data.description || '').trim();

    // Spam / Gibberish filter
    const isSpamGibberish =
      /shsjs/i.test(taskTitle) ||
      /shsjs/i.test(desc) ||
      /(.)\1{5,}/.test(taskTitle) ||
      /(.)\1{5,}/.test(desc) ||
      /^[a-z]{18,}$/i.test(taskTitle) ||
      /^[a-z]{18,}$/i.test(desc) ||
      (/test/i.test(taskTitle) && taskTitle.length < 8 && desc.length < 8);

    if (isSpamGibberish) {
      if (isCurrentUserAdmin()) {
        deleteDoc(doc(db, 'briefs', id)).catch(() => {});
      }
      return null;
    }

    return {
      ...data,
      id,
      applications: Array.isArray(data.applications) ? data.applications : [],
    };
  }

  function emitCombinedBriefs() {
    const allBriefsMap = new Map<string, BriefData>();
    openBriefsMap.forEach((b, k) => allBriefsMap.set(k, b));
    creatorDirectMap.forEach((b, k) => allBriefsMap.set(k, b));
    brandDirectMap.forEach((b, k) => allBriefsMap.set(k, b));

    const briefs = Array.from(allBriefsMap.values());
    briefs.sort((a, b) => {
      const timeA = (a as any).createdAtMillis || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = (b as any).createdAtMillis || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    callback(briefs);
  }

  const unsubs: Array<() => void> = [];

  // 1. Subscribe to all open briefs
  try {
    const openQuery = query(briefsCol, where('recipientType', '==', 'open'));
    const unsubOpen = onSnapshot(
      openQuery,
      (snapshot) => {
        openBriefsMap.clear();
        snapshot.docs.forEach((docSnap) => {
          const item = processDoc(docSnap);
          if (item) openBriefsMap.set(item.id, item);
        });
        emitCombinedBriefs();
      },
      (error) => {
        const code = error?.code || '';
        if (code !== 'unavailable' && code !== 'permission-denied') {
          console.warn("subscribeToBriefs (open) xatosi:", error?.message || error);
        }
        emitCombinedBriefs();
        if (onError && code !== 'permission-denied' && code !== 'unavailable') {
          onError(error);
        }
      }
    );
    unsubs.push(unsubOpen);
  } catch (err) {
    console.warn("Open briefs subscription warning:", err);
  }

  // 2. If current user is authenticated in Firebase Auth, subscribe to briefs where they are creator or brand
  const verifiedUid = auth.currentUser?.uid || '';
  const cleanUid = (currentUserId || '').trim();
  if (cleanUid && verifiedUid && cleanUid === verifiedUid) {
    try {
      const creatorBriefsQuery = query(
        briefsCol,
        where('selectedCreatorId', '==', cleanUid)
      );
      const unsubCreator = onSnapshot(
        creatorBriefsQuery,
        (snapshot) => {
          creatorDirectMap.clear();
          snapshot.docs.forEach((docSnap) => {
            const item = processDoc(docSnap);
            if (item) creatorDirectMap.set(item.id, item);
          });
          emitCombinedBriefs();
        },
        (error) => {
          const code = error?.code || '';
          if (code !== 'unavailable' && code !== 'permission-denied') {
            console.warn("subscribeToBriefs (creator) xatosi:", error?.message || error);
          }
          emitCombinedBriefs();
        }
      );
      unsubs.push(unsubCreator);
    } catch (err) {
      console.warn("Creator briefs subscription warning:", err);
    }

    try {
      const brandBriefsQuery = query(
        briefsCol,
        where('brandId', '==', cleanUid)
      );
      const unsubBrand = onSnapshot(
        brandBriefsQuery,
        (snapshot) => {
          brandDirectMap.clear();
          snapshot.docs.forEach((docSnap) => {
            const item = processDoc(docSnap);
            if (item) brandDirectMap.set(item.id, item);
          });
          emitCombinedBriefs();
        },
        (error) => {
          const code = error?.code || '';
          if (code !== 'unavailable' && code !== 'permission-denied') {
            console.warn("subscribeToBriefs (brand) xatosi:", error?.message || error);
          }
          emitCombinedBriefs();
        }
      );
      unsubs.push(unsubBrand);
    } catch (err) {
      console.warn("Brand briefs subscription warning:", err);
    }
  }

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

/**
 * Create a new Brief in Firestore 'briefs' collection
 */
export async function createBriefInFirestore(brief: BriefData): Promise<string> {
  const ownerUid = auth.currentUser?.uid;
  if (!ownerUid) {
    throw new Error('Brif yaratish uchun avval tizimga kiring.');
  }

  const briefId = brief.id || `brief_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const docRef = doc(db, 'briefs', briefId);

  const rawPayload = {
    ...brief,
    id: briefId,
    brandId: ownerUid,
    ownerId: ownerUid,
    creatorStatus: brief.creatorStatus || 'yangi',
    status: brief.status || 'open',
    createdAtMillis: brief.createdAtMillis || Date.now(),
    serverCreatedAt: serverTimestamp(),
  };

  // Strip undefined values for clean Firestore writes
  const payload = Object.fromEntries(
    Object.entries(rawPayload).filter(([_, v]) => v !== undefined)
  );

  await setDoc(docRef, payload);

  // If this is a direct brief, notify the selected creator immediately!
  if (brief.recipientType === 'direct' && brief.selectedCreatorId) {
    // Shaxsiy brif yuborgan brend kreatorga o'z kontaktini ko'rish ruxsatini beradi
    await grantContactAccess(brief.selectedCreatorId);
    try {
      await createNotificationInFirestore({
        userId: brief.selectedCreatorId,
        type: 'yangi_brif',
        title: 'Yangi shaxsiy brif',
        briefTitle: brief.taskTitle,
        briefId: briefId,
        senderId: ownerUid,
        senderName: brief.brandName || 'Brend',
        senderAvatar: brief.brandAvatar,
        message: `${brief.brandName || 'Brend'} sizga yangi brif yubordi: "${brief.taskTitle}"`,
        read: false,
        createdAt: new Date().toISOString(),
        createdAtMillis: Date.now(),
      });
    } catch (notifErr) {
      console.error("Kreatorga bildirishnoma yuborishda xatolik:", notifErr);
    }
  }

  return briefId;
}

/**
 * Apply to an open Brief in Firestore
 */
export async function applyToBriefInFirestore(
  briefId: string,
  application: BriefApplication
): Promise<void> {
  const docRef = doc(db, 'briefs', briefId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error("Brif topilmadi");
  }

  const data = snap.data() as BriefData;
  const existingApps = Array.isArray(data.applications) ? [...data.applications] : [];

  // Check if creator already applied
  const existingIndex = existingApps.findIndex((a) => a.creatorId === application.creatorId);
  if (existingIndex >= 0) {
    existingApps[existingIndex] = application;
  } else {
    existingApps.push(application);
  }

  await updateDoc(docRef, {
    applications: existingApps,
    updatedAt: serverTimestamp(),
  });

  // Ariza topshirgan kreator brendga o'z kontaktini ko'rish ruxsatini beradi
  if (data.brandId && auth.currentUser?.uid === application.creatorId) {
    await grantContactAccess(data.brandId);
  }

  // Notify the brand that a creator applied to their brief
  if (data.brandId && data.brandId !== application.creatorId) {
    try {
      await createNotificationInFirestore({
        userId: data.brandId,
        type: 'ariza_keldi',
        title: 'Yangi ariza keldi',
        briefTitle: data.taskTitle,
        briefId: briefId,
        senderId: application.creatorId,
        senderName: application.creatorName || 'Kreator',
        senderAvatar: application.creatorAvatar,
        message: `${application.creatorName || 'Kreator'} sizning "${data.taskTitle}" brifingizga ariza topshirdi`,
        read: false,
        createdAt: new Date().toISOString(),
        createdAtMillis: Date.now(),
      });
    } catch (notifErr) {
      console.error("Brendga bildirishnoma yuborishda xatolik:", notifErr);
    }
  }
}

/**
 * Respond to a Brief (Accept or Reject) by creator
 */
export async function respondToBriefInFirestore(
  briefId: string,
  status: 'qabul_qilindi' | 'rad_etildi',
  creator: {
    uid: string;
    name: string;
    avatar?: string;
    handle?: string;
    phoneNumber?: string;
    telegramUsername?: string;
  },
  rejectionReason?: string
): Promise<void> {
  const docRef = doc(db, 'briefs', briefId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error("Brif topilmadi");
  }

  const data = snap.data() as BriefData;
  const nowIso = new Date().toISOString();
  const nowMillis = Date.now();

  const updates: Record<string, any> = {
    creatorStatus: status,
    status: status === 'qabul_qilindi' ? 'in_progress' : 'cancelled',
    respondedAt: nowIso,
    respondedAtMillis: nowMillis,
    updatedAt: serverTimestamp(),
  };

  if (status === 'qabul_qilindi') {
    // Brifni qabul qilgan kreator brendga o'z kontaktini ko'rish ruxsatini beradi
    if (data.brandId) {
      await grantContactAccess(data.brandId);
    }
    let cPhone = creator.phoneNumber;
    let cTg = creator.telegramUsername;

    // If creator contact was not directly passed, attempt lookup in users collection
    if ((!cPhone || !cTg) && creator.uid) {
      try {
        const cDataProfile = await fetchUserProfile(creator.uid);
        if (cDataProfile) {
          const cData = cDataProfile as UserSession;
          if (!cPhone) cPhone = cData.phoneNumber || (cData as any).phone || (cData.contact && !cData.contact.includes('@') ? cData.contact : undefined);
          if (!cTg) cTg = cData.telegramUsername || (cData.socialLinks?.telegram ? cData.socialLinks.telegram.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '') : undefined);
        }
      } catch (err) {
        console.warn("Kreator kontaktini olishda xatolik:", err);
      }
    }


    // Also populate brand's contact from Firestore if missing on the brief
    if (data.brandId && (!data.brandPhoneNumber || !data.brandTelegramUsername)) {
      try {
        const bDataProfile = await fetchUserProfile(data.brandId);
        if (bDataProfile) {
          const bData = bDataProfile as UserSession;
          const bPhone = bData.phoneNumber || (bData as any).phone || (bData.contact && !bData.contact.includes('@') ? bData.contact : undefined);
          const bTg = bData.telegramUsername || (bData.socialLinks?.telegram ? bData.socialLinks.telegram.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '') : undefined);
        }
      } catch (err) {
        console.warn("Brend kontaktini olishda xatolik:", err);
      }
    }
  }

  if (status === 'rad_etildi') {
    updates.rejectionReason = rejectionReason ? rejectionReason.trim() : 'Sabab koʻrsatilmadi';
  }

  await updateDoc(docRef, updates);

  // Notify the brand
  if (data.brandId && data.brandId !== creator.uid) {
    try {
      if (status === 'qabul_qilindi') {
        await createNotificationInFirestore({
          userId: data.brandId,
          type: 'ariza_qabul',
          title: 'Brif qabul qilindi',
          briefTitle: data.taskTitle,
          briefId: briefId,
          senderId: creator.uid,
          senderName: creator.name || 'Kreator',
          senderAvatar: creator.avatar,
          message: `${creator.name || 'Kreator'} brifingizni qabul qildi! Endi xabar yozib, ishni boshlashingiz mumkin.`,
          read: false,
          createdAt: nowIso,
          createdAtMillis: nowMillis,
        });
      } else {
        const reasonText = rejectionReason && rejectionReason.trim()
          ? ` (Sabab: "${rejectionReason.trim()}")`
          : '';
        await createNotificationInFirestore({
          userId: data.brandId,
          type: 'tizim',
          title: 'Brif rad etildi',
          briefTitle: data.taskTitle,
          briefId: briefId,
          senderId: creator.uid,
          senderName: creator.name || 'Kreator',
          senderAvatar: creator.avatar,
          message: `${creator.name || 'Kreator'} brifingizni rad etdi${reasonText}`,
          read: false,
          createdAt: nowIso,
          createdAtMillis: nowMillis,
        });
      }
    } catch (notifErr) {
      console.error("Brendga bildirishnoma yuborishda xatolik:", notifErr);
    }
  }
}

/**
 * Update an application status on an open Brief (by brand)
 */
export async function respondToBriefApplicationInFirestore(
  briefId: string,
  applicationId: string,
  status: 'qabul_qilindi' | 'rad_etildi',
  brand: {
    uid: string;
    name: string;
    avatar?: string;
    phoneNumber?: string;
    telegramUsername?: string;
  },
  rejectionReason?: string
): Promise<void> {
  const docRef = doc(db, 'briefs', briefId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error("Brif topilmadi");
  }

  const data = snap.data() as BriefData;
  const existingApps = Array.isArray(data.applications) ? [...data.applications] : [];
  const appIndex = existingApps.findIndex((a) => a.id === applicationId);

  if (appIndex === -1) {
    throw new Error("Ariza topilmadi");
  }

  // Arizani qabul qilgan brend kreatorga o'z kontaktini ko'rish ruxsatini beradi
  if (status === 'qabul_qilindi' && existingApps[appIndex]?.creatorId) {
    await grantContactAccess(existingApps[appIndex].creatorId);
  }

  const targetApp = { ...existingApps[appIndex] };
  const nowIso = new Date().toISOString();

  targetApp.status = status === 'qabul_qilindi' ? 'accepted' : 'rejected';
  targetApp.creatorStatus = status;
  targetApp.respondedAt = nowIso;
  if (status === 'qabul_qilindi') {
    let bPhone = brand.phoneNumber;
    let bTg = brand.telegramUsername;

    // Lookup brand profile if missing
    if ((!bPhone || !bTg) && brand.uid) {
      try {
        const bDataProfile = await fetchUserProfile(brand.uid);
        if (bDataProfile) {
          const bData = bDataProfile as UserSession;
          if (!bPhone) bPhone = bData.phoneNumber || (bData as any).phone || (bData.contact && !bData.contact.includes('@') ? bData.contact : undefined);
          if (!bTg) bTg = bData.telegramUsername || (bData.socialLinks?.telegram ? bData.socialLinks.telegram.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '') : undefined);
        }
      } catch (err) {
        console.warn("Brend kontaktini olishda xatolik:", err);
      }
    }


    // Kontaktlar brifga yozilmaydi (ochiq briflar hammaga ko'rinadi); ular ruxsat orqali ochiladi
  }
  if (status === 'rad_etildi' && rejectionReason) {
    targetApp.rejectionReason = rejectionReason.trim();
  }

  delete (targetApp as any).creatorPhoneNumber;
  delete (targetApp as any).creatorTelegramUsername;
  delete (targetApp as any).brandPhoneNumber;
  delete (targetApp as any).brandTelegramUsername;
  existingApps[appIndex] = targetApp;

  const briefUpdates: Record<string, any> = {
    applications: existingApps,
    updatedAt: serverTimestamp(),
  };

  if (status === 'qabul_qilindi') {
    briefUpdates.selectedApplicationId = applicationId;
  }

  await updateDoc(docRef, briefUpdates);

  // Notify the applicant creator
  if (targetApp.creatorId && targetApp.creatorId !== brand.uid) {
    try {
      if (status === 'qabul_qilindi') {
        await createNotificationInFirestore({
          userId: targetApp.creatorId,
          type: 'ariza_qabul',
          title: 'Arizangiz qabul qilindi',
          briefTitle: data.taskTitle,
          briefId: briefId,
          senderId: brand.uid,
          senderName: brand.name || 'Brend',
          senderAvatar: brand.avatar,
          message: `${brand.name || 'Brend'} "${data.taskTitle}" boʻyicha arizangizni qabul qildi! Endi xabar yozishingiz mumkin.`,
          read: false,
          createdAt: nowIso,
          createdAtMillis: Date.now(),
        });
      } else {
        const reasonText = rejectionReason && rejectionReason.trim()
          ? ` (Sabab: "${rejectionReason.trim()}")`
          : '';
        await createNotificationInFirestore({
          userId: targetApp.creatorId,
          type: 'tizim',
          title: 'Ariza rad etildi',
          briefTitle: data.taskTitle,
          briefId: briefId,
          senderId: brand.uid,
          senderName: brand.name || 'Brend',
          senderAvatar: brand.avatar,
          message: `${brand.name || 'Brend'} "${data.taskTitle}" boʻyicha arizangizni rad etdi${reasonText}`,
          read: false,
          createdAt: nowIso,
          createdAtMillis: Date.now(),
        });
      }
    } catch (notifErr) {
      console.error("Kreatorga bildirishnoma yuborishda xatolik:", notifErr);
    }
  }
}

/**
 * 100% Pul qaytarish kafolati holatini tekshirish
 * Talab: "30 kun ichida javob kelmasa" degan kafolat mantig'ida, "rad etildi" ham "javob keldi"
 * deb hisoblanadi (chunki kreator ko'rib chiqib, javob bergan) — faqat "yangi" holatida
 * 30 kun davomida hech qanday harakat bo'lmasa, kafolat ishga tushadi.
 */
export function checkBriefGuaranteeStatus(brief: BriefData): {
  isEligibleForRefund: boolean;
  daysPassed: number;
  daysRemaining: number;
  statusText: string;
  hasResponse: boolean;
  responseType: BriefCreatorStatus;
} {
  const creatorStatus: BriefCreatorStatus =
    brief.creatorStatus ||
    (brief.status === 'in_progress'
      ? 'qabul_qilindi'
      : brief.status === 'cancelled'
      ? 'rad_etildi'
      : 'yangi');

  const hasResponse = creatorStatus === 'qabul_qilindi' || creatorStatus === 'rad_etildi';

  const createdTime =
    brief.createdAtMillis ||
    (brief.createdAt && !isNaN(new Date(brief.createdAt).getTime())
      ? new Date(brief.createdAt).getTime()
      : Date.now());
  const now = Date.now();
  const diffDays = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.max(0, diffDays);
  const daysRemaining = Math.max(0, 30 - daysPassed);

  if (hasResponse) {
    return {
      isEligibleForRefund: false,
      daysPassed,
      daysRemaining: 0,
      statusText:
        creatorStatus === 'qabul_qilindi'
          ? "Kreator qabul qildi (Javob olindi — kafolat talabi qanoatlantirildi)"
          : "Kreator rad etdi (Javob olindi — kafolat talabi qanoatlantirildi)",
      hasResponse: true,
      responseType: creatorStatus,
    };
  }

  // Still 'yangi' (waiting for response)
  const isEligibleForRefund = daysPassed >= 30;
  return {
    isEligibleForRefund,
    daysPassed,
    daysRemaining,
    statusText: isEligibleForRefund
      ? "30 kun ichida hech qanday javob olinmadi — 100% pul qaytarish kafolati amalda!"
      : `Javob kutilmoqda (Kafolat boʻyicha yana ${daysRemaining} kun qoldi)`,
    hasResponse: false,
    responseType: 'yangi',
  };
}

/**
 * Find or create a conversation between currentUser and targetUser in Firestore
 */
export async function getOrCreateConversation(
  currentUser: UserSession,
  targetUser: {
    uid: string;
    name: string;
    handle?: string;
    avatar?: string;
    role?: string;
  }
): Promise<string> {
  if (!currentUser.uid || !targetUser.uid) {
    throw new Error("Foydalanuvchi IDsi talab qilinadi");
  }

  // Generate deterministic ID or query existing
  const convId = [currentUser.uid, targetUser.uid].sort().join('_');
  const convRef = doc(db, 'conversations', convId);
  const snap = await getDoc(convRef);

  if (!snap.exists()) {
    const participantDetails: Record<string, any> = {
      [currentUser.uid]: {
        name: currentUser.name || 'Men',
        handle: currentUser.instagramHandle || currentUser.contact || '@men',
        avatar: currentUser.avatar || '',
        role: currentUser.role === 'brend' ? 'Brend' : 'Bloger',
      },
      [targetUser.uid]: {
        name: targetUser.name || 'Kreator',
        handle: targetUser.handle || '@creator',
        avatar: targetUser.avatar || '',
        role: targetUser.role || 'Bloger',
      },
    };

    await setDoc(convRef, {
      id: convId,
      participants: [currentUser.uid, targetUser.uid],
      participantDetails,
      lastMessage: '',
      lastMessageTime: '',
      createdAt: serverTimestamp(),
      updatedAtMillis: Date.now(),
    });
  }

  return convId;
}

/**
 * Subscribe to user's conversations from Firestore
 */
export function subscribeToUserConversations(
  uid: string,
  onUpdate: (conversations: any[]) => void,
  onError?: (err: Error) => void
): () => void {
  const convsRef = collection(db, 'conversations');
  const q = query(convsRef, where('participants', 'array-contains', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const convs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const otherUid = (data.participants || []).find((p: string) => p !== uid) || uid;
        const otherDetail = data.participantDetails?.[otherUid] || {};
        return {
          id: docSnap.id,
          name: otherDetail.name || 'Foydalanuvchi',
          handle: otherDetail.handle || '@foydalanuvchi',
          avatar: otherDetail.avatar || '',
          role: otherDetail.role || 'Hamkor',
          status: 'online',
          unreadCount: data.unreadCount?.[uid] || 0,
          lastMessageTime: data.lastMessageTime || '',
          lastMessageText: data.lastMessage || '',
          pinned: false,
          updatedAtMillis: data.updatedAtMillis || 0,
        };
      });
      // Sort newest first
      convs.sort((a, b) => (b.updatedAtMillis || 0) - (a.updatedAtMillis || 0));
      onUpdate(convs);
    },
    (err: any) => {
      if (err?.code === 'permission-denied' || err?.code === 'unavailable') {
        onUpdate([]);
        return;
      }
      console.warn("subscribeToUserConversations error:", err?.message || err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribe to messages of a conversation from Firestore
 */
export function subscribeToConversationMessages(
  conversationId: string,
  onUpdate: (messages: any[]) => void,
  onError?: (err: Error) => void
): () => void {
  const msgsRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(msgsRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          senderId: data.senderId,
          text: data.text || '',
          time: data.time || '',
          date: data.date || '',
          isRead: data.isRead ?? true,
          voiceNote: data.voiceNote,
          attachment: data.attachment,
          createdAt: data.createdAt,
        };
      });
      onUpdate(msgs);
    },
    (err: any) => {
      if (err?.code === 'permission-denied' || err?.code === 'unavailable') {
        onUpdate([]);
        return;
      }
      console.warn("subscribeToConversationMessages error:", err?.message || err);
      if (onError) onError(err);
    }
  );
}

/**
 * Send a message into a conversation in Firestore
 */
export async function sendMessageToFirestore(
  conversationId: string,
  senderId: string,
  messageData: {
    text?: string;
    attachment?: any;
    voiceNote?: any;
  }
): Promise<void> {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
  const dateStr = `${now.getDate()}-${months[now.getMonth()]}`;

  const msgsRef = collection(db, 'conversations', conversationId, 'messages');
  await addDoc(msgsRef, {
    senderId,
    text: messageData.text || '',
    attachment: messageData.attachment || null,
    voiceNote: messageData.voiceNote || null,
    time: timeStr,
    date: dateStr,
    isRead: false,
    createdAt: serverTimestamp(),
  });

  const convRef = doc(db, 'conversations', conversationId);
  await setDoc(
    convRef,
    {
      lastMessage: messageData.text || (messageData.voiceNote ? 'Ovozli xabar' : 'Fayl biriktirildi'),
      lastMessageTime: timeStr,
      updatedAtMillis: Date.now(),
    },
    { merge: true }
  );
}

/**
 * =========================================================================
 * NOTIFICATIONS SYSTEM (Real-time Firestore & Browser Notifications)
 * =========================================================================
 */

/**
 * Create a new notification document in Firestore 'notifications' collection
 */
export async function createNotificationInFirestore(
  notification: Omit<NotificationItem, 'id'> & { id?: string }
): Promise<string> {
  if (!auth.currentUser) {
    return '';
  }
  const notifId = notification.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const notifRef = doc(db, 'notifications', notifId);
  const rawPayload: Record<string, any> = {
    ...notification,
    id: notifId,
    recipientId: notification.userId,
    senderId: auth.currentUser.uid,
    read: notification.read ?? false,
    createdAt: notification.createdAt || new Date().toISOString(),
    createdAtMillis: notification.createdAtMillis || Date.now(),
  };
  const payload = Object.fromEntries(
    Object.entries(rawPayload).filter(([_, v]) => v !== undefined)
  );

  await setDoc(notifRef, payload);
  return notifId;
}

/**
 * Real-time subscription to notifications for a specific user
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: NotificationItem[]) => void
): () => void {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const notifsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    notifsQuery,
    (snapshot) => {
      const list: NotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as NotificationItem;
        list.push({
          ...data,
          id: docSnap.id,
        });
      });

      // Sort newest first by createdAtMillis or createdAt
      list.sort((a, b) => {
        const timeA = a.createdAtMillis || new Date(a.createdAt).getTime() || 0;
        const timeB = b.createdAtMillis || new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });

      callback(list);
    },
    (err) => {
      if (err?.code !== 'unavailable') {
        console.warn("Bildirishnomalarni olishda xatolik:", err?.message || err);
      }
    }
  );
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsReadInFirestore(notificationId: string): Promise<void> {
  if (!notificationId) return;
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (err) {
    console.error("Bildirishnomani o'qilgan deb belgilashda xatolik:", err);
  }
}

/**
 * Mark all unread notifications for a user as read
 */
export async function markAllNotificationsAsReadInFirestore(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.update(docSnap.ref, { read: true });
    });
    await batch.commit();
  } catch (err) {
    console.error("Barcha bildirishnomalarni o'qilgan deb belgilashda xatolik:", err);
  }
}

/**
 * Request Web Browser Notification permission
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Display a native browser push notification
 */
export function showBrowserPushNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (err) {
      console.warn("Brauzer bildirishnomasi chiqarishda ogohlantirish:", err);
    }
  }
}

/**
 * Submit an Agency Partnership Application to Firestore 'agencyApplications'
 */
export async function submitAgencyApplication(data: {
  agencyName: string;
  contactPerson: string;
  phoneOrEmail: string;
  websiteOrInstagram?: string;
  notes?: string;
}): Promise<string> {
  const actualUid = auth.currentUser?.uid;
  if (!actualUid) {
    throw new Error('Ariza yuborish uchun avval tizimga kiring.');
  }

  const applicationId = `agency_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const docRef = doc(db, 'agencyApplications', applicationId);

  const nowIso = new Date().toISOString();
  const nowMillis = Date.now();

  const payload: AgencyApplication & { serverCreatedAt: any } = {
    id: applicationId,
    userId: actualUid,
    ownerId: actualUid,
    agencyName: data.agencyName.trim(),
    contactPerson: data.contactPerson.trim(),
    phoneOrEmail: data.phoneOrEmail.trim(),
    websiteOrInstagram: data.websiteOrInstagram ? data.websiteOrInstagram.trim() : '',
    status: 'yangi',
    createdAt: formatUzbekDate(nowIso),
    createdAtMillis: nowMillis,
    notes: data.notes ? data.notes.trim() : '',
    serverCreatedAt: serverTimestamp(),
  };

  await setDoc(docRef, payload);
  return applicationId;
}

/**
 * Subscribe in real-time to all Agency Partnership Applications (for Admin)
 */
export function subscribeToAgencyApplications(
  callback: (apps: AgencyApplication[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!isCurrentUserAdmin()) {
    callback([]);
    if (onError) onError(new Error('Faqat administrator koʻrishi mumkin.'));
    return () => {};
  }
  const appsCol = collection(db, 'agencyApplications');

  return onSnapshot(
    appsCol,
    (snapshot) => {
      const items: AgencyApplication[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as any;
        items.push({
          id: docSnap.id,
          userId: d.userId || d.ownerId || '',
          ownerId: d.ownerId || d.userId || '',
          agencyName: d.agencyName || 'Nomaʼlum agentlik',
          contactPerson: d.contactPerson || '',
          phoneOrEmail: d.phoneOrEmail || '',
          websiteOrInstagram: d.websiteOrInstagram || '',
          status: (d.status as AgencyApplicationStatus) || 'yangi',
          createdAt: d.createdAt || 'Nomaʼlum',
          createdAtMillis: d.createdAtMillis || 0,
          notes: d.notes || '',
        });
      });

      // Sort newest first
      items.sort((a, b) => (b.createdAtMillis || 0) - (a.createdAtMillis || 0));
      callback(items);
    },
    (err: any) => {
      if (err?.code === 'permission-denied' || err?.code === 'unavailable') {
        callback([]);
        return;
      }
      console.warn("Agentlik arizalarini tinglashda xatolik:", err?.message || err);
      if (onError) onError(err);
    }
  );
}

/**
 * Update Agency Application Status by Admin
 */
export async function updateAgencyApplicationStatus(
  applicationId: string,
  status: AgencyApplicationStatus,
  notes?: string
): Promise<void> {
  requireAdminAuth();
  const docRef = doc(db, 'agencyApplications', applicationId);
  const updates: Record<string, any> = {
    status: status,
    updatedAt: serverTimestamp(),
  };
  if (notes !== undefined) {
    updates.notes = notes;
  }
  await updateDoc(docRef, updates);
}

/**
 * Compress an image file or dataURL to a lightweight JPEG data URL
 * so receipt uploads never exceed Firestore's 1MB limit or stall on mobile networks.
 */
export function compressImageFile(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    let settled = false;
    let objectUrl: string | null = null;

    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
        objectUrl = null;
      }
    };

    const safeResolve = (val: string) => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(val);
      }
    };

    const timer = setTimeout(() => {
      console.warn('[compressImageFile] 4000ms timeout');
      safeResolve('');
    }, 4000);

    const drawToJpeg = (img: HTMLImageElement) => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (!width || !height) {
          safeResolve('');
          return;
        }
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          safeResolve('');
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        safeResolve(compressed);
      } catch {
        safeResolve('');
      }
    };

    try {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        clearTimeout(timer);
        drawToJpeg(img);
      };
      img.onerror = () => {
        clearTimeout(timer);
        safeResolve('');
      };
      img.src = objectUrl;
    } catch {
      clearTimeout(timer);
      safeResolve('');
    }
  });
}

function compressDataUrl(dataUrl: string, maxWidth = 650, quality = 0.6): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve('');
      return;
    }
    let settled = false;
    const done = (val: string) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };
    const timer = setTimeout(() => done(''), 3000);
    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          done('');
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL('image/jpeg', quality));
      } catch {
        done('');
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      done('');
    };
    img.src = dataUrl;
  });
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(parts[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Upload receipt screenshot or PDF to Firebase Storage under payment_receipts/{uid}/...
 * with cancellable timeout and compressed Base64 fallback for images.
 */
export async function uploadPaymentReceipt(file: File, userId: string): Promise<string> {
  const actualUid = auth.currentUser?.uid || userId;
  if (!auth.currentUser?.uid) {
    throw new Error("Chek yuklash uchun avval tizimga kiring.");
  }

  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  if (!isImage && !isPdf) {
    throw new Error("Faqat rasm (JPG, PNG) yoki PDF formatdagi chek yuklash mumkin.");
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Fayl hajmi 15 MB dan oshmasligi kerak.");
  }

  console.log('[uploadPaymentReceipt] Boshlandi. Fayl:', file.name, 'Hajmi:', file.size);

  // 1. Rasm bo'lsa, yengil JPEG formatga siqamiz
  let base64Preview = '';
  if (isImage) {
    try {
      base64Preview = await compressImageFile(file, 800, 0.68);
      if (base64Preview && base64Preview.length > 650000) {
        const smaller = await compressImageFile(file, 560, 0.52);
        if (smaller) base64Preview = smaller;
      }
    } catch (err) {
      console.warn('[uploadPaymentReceipt] compressImageFile muammo:', err);
    }
  }

  // 2. Firebase Storage: payment_receipts/{uid}/... papkasiga yuklash
  const currentStorage = storage || getSafeStorage();
  if (currentStorage) {
    let uploadTask: ReturnType<typeof uploadBytesResumable> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const uploadPayload = isPdf
        ? file
        : (base64Preview && dataUrlToBlob(base64Preview)) || file;
      const contentType = isPdf ? 'application/pdf' : 'image/jpeg';
      const ext = isPdf ? 'pdf' : 'jpg';

      if (uploadPayload.size <= 15 * 1024 * 1024) {
        const timestamp = Date.now();
        const storagePath = `payment_receipts/${actualUid}/${timestamp}_receipt.${ext}`;
        const storageRef = ref(currentStorage, storagePath);
        uploadTask = uploadBytesResumable(storageRef, uploadPayload, { contentType });

        const uploadPromise = new Promise<string>((resolve, reject) => {
          uploadTask!.on(
            'state_changed',
            undefined,
            (err) => reject(err),
            async () => {
              try {
                const url = await getDownloadURL(uploadTask!.snapshot.ref);
                resolve(url);
              } catch (err) {
                reject(err);
              }
            }
          );
        });

        const timeoutMs = isPdf ? 10000 : 5000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Storage upload ${timeoutMs}ms timeout`));
          }, timeoutMs);
        });

        const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);
        console.log('[uploadPaymentReceipt] Firebase Storage yuklash muvaffaqiyatli:', downloadUrl);
        return downloadUrl;
      }
    } catch (storageErr) {
      if (timeoutId) clearTimeout(timeoutId);
      if (uploadTask) {
        try {
          uploadTask.cancel();
        } catch {}
      }
      console.warn('[uploadPaymentReceipt] Storage yuklanmadi, fallback tekshirilmoqda:', storageErr);
    }
  }

  if (isPdf) {
    throw new Error("PDF chekni serverga yuklab bo'lmadi. Iltimos, chekning skrinshot (JPG/PNG) rasmini yuklang.");
  }

  return base64Preview;
}

/**
 * Submit manual bank card payment request to Firestore 'paymentRequests' collection
 */
export async function submitPaymentRequest(params: {
  userId: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  userRole?: string;
  screenshotFile: File | null;
  screenshotDataUrl?: string;
  purpose?: PaymentPurpose;
  amount?: number;
  contactsCount?: number;
  topDays?: number;
  purposeLabel?: string;
}): Promise<string> {
  const purpose: PaymentPurpose = params.purpose || 'pro';
  const amount = typeof params.amount === 'number' && params.amount > 0 ? Math.round(params.amount) : 59000;
  const purposeLabel = params.purposeLabel || (purpose === 'pro' ? 'Pro rejim — 1 oy' : purpose === 'contacts' ? 'Kontakt paketi' : 'TOP joylashuv');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error("Internet aloqasi yo'q. Iltimos, internetingizni tekshirib qayta urinib ko'ring.");
  }

  const actualUid = auth.currentUser?.uid;
  if (!actualUid) {
    throw new Error("To'lov so'rovini yuborish uchun avval tizimga kiring.");
  }

  console.log('[submitPaymentRequest] Chaqirildi:', {
    userId: actualUid,
    userName: params.userName,
    hasFile: !!params.screenshotFile,
    hasPreview: !!params.screenshotDataUrl,
  });

  let screenshotUrl = '';

  if (params.screenshotFile) {
    try {
      screenshotUrl = await uploadPaymentReceipt(params.screenshotFile, actualUid);
    } catch (uploadErr: any) {
      console.warn('[submitPaymentRequest] uploadPaymentReceipt xatosi:', uploadErr);
      if (params.screenshotFile.type === 'application/pdf') {
        throw uploadErr;
      }
    }
  }

  if (!screenshotUrl && params.screenshotDataUrl) {
    if (params.screenshotDataUrl.startsWith('data:image/') && params.screenshotDataUrl.length > 500000) {
      const compressed = await compressDataUrl(params.screenshotDataUrl, 600, 0.55);
      screenshotUrl = compressed || params.screenshotDataUrl;
    } else {
      screenshotUrl = params.screenshotDataUrl;
    }
  }

  // Firestore hujjat limiti 1MB bo'lgani uchun base64 juda katta bo'lsa qayta siqamiz yoki aniq xabar beramiz
  if (screenshotUrl && screenshotUrl.startsWith('data:image/') && screenshotUrl.length > 750000) {
    const tighter = params.screenshotFile
      ? await compressImageFile(params.screenshotFile, 480, 0.45)
      : await compressDataUrl(screenshotUrl, 480, 0.45);
    if (tighter && tighter.length <= 750000) {
      screenshotUrl = tighter;
    }
  }

  if (!screenshotUrl) {
    throw new Error("Chek rasmini o'qib bo'lmadi. Iltimos, PNG, JPG yoki PDF formatdagi chek yuklang.");
  }

  if (screenshotUrl.startsWith('data:') && screenshotUrl.length > 900000) {
    throw new Error("Chek fayli hajmi juda katta. Iltimos, kichikroq JPG/PNG skrinshot yuklang.");
  }

  console.log("[submitPaymentRequest] Firestore 'paymentRequests' kolleksiyasiga saqlanmoqda...");
  const now = new Date();
  const paymentRequestsCol = collection(db, 'paymentRequests');

  let firestoreTimer: ReturnType<typeof setTimeout> | null = null;
  let docRef;
  try {
    const addDocPromise = addDoc(paymentRequestsCol, {
      userId: actualUid,
      ownerId: actualUid,
      userName: params.userName || "Noma'lum foydalanuvchi",
      userPhone: params.userPhone || '',
      userEmail: params.userEmail || auth.currentUser?.email || '',
      userRole: params.userRole || '',
      amount,
      purpose,
      purposeLabel,
      ...(purpose === 'contacts' ? { contactsCount: Math.max(1, Math.round(params.contactsCount || 1)) } : {}),
      ...(purpose === 'top' ? { topDays: Math.max(1, Math.round(params.topDays || 7)) } : {}),
      screenshotUrl: screenshotUrl || '',
      sana: now.toISOString(),
      createdAtMillis: now.getTime(),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      firestoreTimer = setTimeout(() => {
        reject(new Error("Server bilan ulanish vaqti tugadi. Internet aloqangizni tekshirib, qayta urinib ko'ring."));
      }, 10000);
    });

    docRef = await Promise.race([addDocPromise, timeoutPromise]);
  } finally {
    if (firestoreTimer) clearTimeout(firestoreTimer);
  }

  console.log("[submitPaymentRequest] Firestore'ga muvaffaqiyatli saqlandi! Doc ID:", docRef.id);

  // Yangi to'lov so'rovi kelganda server orqali adminga Telegram xabar yuborish (4s timeout bilan, foydalanuvchini kutdirib qo'ymaslik uchun)
  const tgController = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const tgTimer = setTimeout(() => {
    try {
      tgController?.abort();
    } catch {}
  }, 4000);

  try {
    const realName = (params.userName || '').trim() || "Noma'lum foydalanuvchi";

    await fetch('/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment_request',
        data: {
          userName: realName,
          amount: `${amount.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm — ${purposeLabel}`,
        },
      }),
      ...(tgController ? { signal: tgController.signal } : {}),
    });
  } catch {
    // Xato bo'lsa jim o'tkazib yuboriladi (sayt ishlashi to'xtamaydi)
  } finally {
    clearTimeout(tgTimer);
  }

  return docRef.id;
}

/**
 * Fetch all payment requests from 'paymentRequests' collection (Admin only)
 */
export async function fetchPaymentRequests(): Promise<PaymentRequest[]> {
  if (!isCurrentUserAdmin()) return [];
  try {
    const requestsCol = collection(db, 'paymentRequests');
    const snapshot = await getDocs(requestsCol);
    const list: PaymentRequest[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId || '',
        ownerId: data.ownerId || data.userId || '',
        userName: data.userName || "Noma'lum foydalanuvchi",
        userPhone: data.userPhone || '',
        userEmail: data.userEmail || '',
        userRole: data.userRole || '',
        amount: data.amount || 59000,
        purpose: (data.purpose as PaymentPurpose) || 'pro',
        purposeLabel: data.purposeLabel || '',
        contactsCount: data.contactsCount,
        topDays: data.topDays,
        screenshotUrl: data.screenshotUrl || '',
        sana: data.sana || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()),
        createdAtMillis: data.createdAtMillis || 0,
        status: (data.status as PaymentRequestStatus) || 'pending',
        rejectionReason: data.rejectionReason || '',
        approvedAt: data.approvedAt || '',
        rejectedAt: data.rejectedAt || '',
        reviewedBy: data.reviewedBy || '',
      };
    });

    list.sort((a, b) => (b.createdAtMillis || 0) - (a.createdAtMillis || 0));
    return list;
  } catch (err) {
    console.error("fetchPaymentRequests xatosi:", err);
    return [];
  }
}

/**
 * Real-time listener for payment requests (Admin only)
 */
export function subscribeToPaymentRequests(
  callback: (requests: PaymentRequest[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!isCurrentUserAdmin()) {
    callback([]);
    if (onError) onError(new Error('Faqat administrator koʻrishi mumkin.'));
    return () => {};
  }
  const requestsCol = collection(db, 'paymentRequests');
  return onSnapshot(
    requestsCol,
    (snapshot) => {
      const list: PaymentRequest[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId || '',
          ownerId: data.ownerId || data.userId || '',
          userName: data.userName || "Noma'lum foydalanuvchi",
          userPhone: data.userPhone || '',
          userEmail: data.userEmail || '',
          userRole: data.userRole || '',
          amount: data.amount || 59000,
          purpose: (data.purpose as PaymentPurpose) || 'pro',
          purposeLabel: data.purposeLabel || '',
          contactsCount: data.contactsCount,
          topDays: data.topDays,
          screenshotUrl: data.screenshotUrl || '',
          sana: data.sana || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()),
          createdAtMillis: data.createdAtMillis || 0,
          status: (data.status as PaymentRequestStatus) || 'pending',
          rejectionReason: data.rejectionReason || '',
          approvedAt: data.approvedAt || '',
          rejectedAt: data.rejectedAt || '',
          reviewedBy: data.reviewedBy || '',
        };
      });
      list.sort((a, b) => (b.createdAtMillis || 0) - (a.createdAtMillis || 0));
      callback(list);
    },
    (err: any) => {
      if (err?.code === 'permission-denied' || err?.code === 'unavailable') {
        callback([]);
        return;
      }
      console.warn("subscribeToPaymentRequests xatosi:", err?.message || err);
      if (onError) onError(err);
    }
  );
}

/**
 * Approve payment request: changes request status to 'approved' and activates Pro subscription for the user (30 days)
 */
export async function approvePaymentRequest(
  requestId: string,
  userId: string,
  reviewerName: string = 'Admin'
): Promise<void> {
  requireAdminAuth();
  const reqRef = doc(db, 'paymentRequests', requestId);
  const reqSnap = await getDoc(reqRef);
  const reqData = (reqSnap.exists() ? reqSnap.data() : {}) as Partial<PaymentRequest>;
  if (reqData.status === 'approved') {
    return; // ikki marta tasdiqlanib, ikki marta berilib ketmasin
  }
  const purpose: PaymentPurpose = reqData.purpose || 'pro';
  const targetUid = userId || reqData.userId || '';
  const now = new Date();

  if (targetUid) {
    const userRef = doc(db, 'users', targetUid);
    if (purpose === 'contacts') {
      const count = Math.max(1, Math.round(reqData.contactsCount || 1));
      await setDoc(userRef, { unlockedContactsCount: increment(count), updatedAt: serverTimestamp() }, { merge: true });
    } else if (purpose === 'top') {
      await activateTopPlacement(targetUid, Math.max(1, Math.round(reqData.topDays || 7)));
    } else {
      const trialStartDate = now.toISOString();
      const endMs = now.getTime() + 30 * 24 * 60 * 60 * 1000;
      const trialEndDate = new Date(endMs).toISOString();
      await setDoc(
        userRef,
        {
          subscriptionStatus: 'active',
          trialStartDate,
          trialEndDate,
          proExpiresAtMillis: endMs,
          subscriptionPlanPrice: 59000,
          reminderSent: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  await updateDoc(reqRef, {
    status: 'approved',
    approvedAt: now.toISOString(),
    reviewedBy: reviewerName,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Reject payment request with optional reason
 */
export async function rejectPaymentRequest(
  requestId: string,
  reason?: string,
  reviewerName: string = 'Admin'
): Promise<void> {
  requireAdminAuth();
  const reqRef = doc(db, 'paymentRequests', requestId);
  const now = new Date();
  await updateDoc(reqRef, {
    status: 'rejected',
    rejectionReason: reason || 'Toʻlov cheki maʼlumotlari tasdiqlanmadi',
    rejectedAt: now.toISOString(),
    reviewedBy: reviewerName,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fetch latest payment request for specific user (scoped to owner or admin)
 */
export async function fetchUserLatestPaymentRequest(userId: string, purposeFilter: PaymentPurpose = 'pro'): Promise<PaymentRequest | null> {
  const targetUid = userId || auth.currentUser?.uid || '';
  if (!targetUid || !auth.currentUser) return null;
  if (auth.currentUser.uid !== targetUid && !isCurrentUserAdmin()) return null;

  try {
    const q = query(collection(db, 'paymentRequests'), where('userId', '==', targetUid));
    const snapshot = await getDocs(q);
    const userReqs: PaymentRequest[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId || '',
        ownerId: data.ownerId || data.userId || '',
        userName: data.userName || "Noma'lum foydalanuvchi",
        userPhone: data.userPhone || '',
        userEmail: data.userEmail || '',
        userRole: data.userRole || '',
        amount: data.amount || 59000,
        purpose: (data.purpose as PaymentPurpose) || 'pro',
        purposeLabel: data.purposeLabel || '',
        contactsCount: data.contactsCount,
        topDays: data.topDays,
        screenshotUrl: data.screenshotUrl || '',
        sana: data.sana || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()),
        createdAtMillis: data.createdAtMillis || 0,
        status: (data.status as PaymentRequestStatus) || 'pending',
        rejectionReason: data.rejectionReason || '',
        approvedAt: data.approvedAt || '',
        rejectedAt: data.rejectedAt || '',
        reviewedBy: data.reviewedBy || '',
      };
    });
    const filtered = userReqs.filter((r) => (r.purpose || 'pro') === purposeFilter);
    filtered.sort((a, b) => (b.createdAtMillis || 0) - (a.createdAtMillis || 0));
    return filtered[0] || null;
  } catch {
    return null;
  }
}



