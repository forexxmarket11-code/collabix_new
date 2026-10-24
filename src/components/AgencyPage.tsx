import React, { useState } from 'react';
import {
  Building2,
  Zap,
  Percent,
  ShieldCheck,
  ArrowLeft,
  Send,
  CheckCircle2,
  Sparkles,
  Check,
  Globe,
  Phone,
  User,
  AlertCircle,
} from 'lucide-react';
import { submitAgencyApplication } from '../firebase';

interface AgencyPageProps {
  onBackToHome: () => void;
}

export const AgencyPage: React.FC<AgencyPageProps> = ({ onBackToHome }) => {
  const [agencyName, setAgencyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [websiteOrInstagram, setWebsiteOrInstagram] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!agencyName.trim()) {
      setErrorMessage("Iltimos, agentlik nomini kiriting");
      return;
    }
    if (!contactPerson.trim()) {
      setErrorMessage("Iltimos, aloqa shaxsi ismini kiriting");
      return;
    }
    if (!phoneOrEmail.trim()) {
      setErrorMessage("Iltimos, telefon raqam yoki email kiriting");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAgencyApplication({
        agencyName,
        contactPerson,
        phoneOrEmail,
        websiteOrInstagram,
        notes,
      });

      setIsSuccess(true);
      setAgencyName('');
      setContactPerson('');
      setPhoneOrEmail('');
      setWebsiteOrInstagram('');
      setNotes('');
    } catch (err) {
      console.error("Agentlik arizasini topshirishda xatolik:", err);
      setErrorMessage("Arizani yuborishda xatolik yuz berdi. Iltimos, qayta urinib koʻring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-6 sm:pt-10 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Top Navigation / Back Button */}
      <div className="mb-6 sm:mb-8">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Bosh sahifaga qaytish</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-heading font-bold mb-4">
          <Building2 className="w-4 h-4" />
          <span>Marketing agentliklari uchun hamkorlik dasturi</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        </div>

        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight">
          Mijozlaringizga kreator topish osonroq.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400">
            Collabix bilan hamkor boʻling.
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-[#D0D0D8] font-body leading-relaxed max-w-2xl mx-auto">
          Mijozlaringizga bloger va inflyuenserlarni qidirib vaqt sarflamang. Collabix platformasi orqali saralangan kreatorlarni bir zumda toping va har bir jalb qilingan mijozdan doimiy komissiya oling.
        </p>
      </div>

      {/* 3 Main Benefit Cards - Requirement 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-12 sm:mb-16">
        {/* Card 1: Bepul Pro hisob */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 shadow-xs">
              <Zap className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white mb-2">
              Bepul Pro hisob
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body leading-relaxed">
              Oʻzingiz ham platformadan cheksiz foydalanasiz. Barcha kreatorlarning toʻliq aloqa maʼlumotlari, statistikasi va tahlillari doimo siz uchun ochiq.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-heading font-bold text-amber-600 dark:text-amber-400">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Cheksiz qidiruv va kontaktlar</span>
          </div>
        </div>

        {/* Card 2: Oylik komissiya */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-indigo-200/90 dark:border-indigo-800/80 p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 shadow-xs">
              <Percent className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white mb-2">
              Oylik komissiya
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body leading-relaxed">
              Har bir olib kelgan mijozdan doimiy foiz. Mijozingiz Collabix obunasidan foydalangan har bir oy uchun hisobingizga kafolatlangan komissiya tushadi.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-heading font-bold text-indigo-600 dark:text-indigo-400">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Har oy barqaror passiv daromad</span>
          </div>
        </div>

        {/* Card 3: Hech qanday xarajat yo'q */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white mb-2">
              Hech qanday xarajat yoʻq
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body leading-relaxed">
              Qoʻshilish va ishtirok etish butunlay bepul. Agentlikdan hech qanday aʼzolik toʻlovi yoki moliyaviy majburiyat talab qilinmaydi.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-heading font-bold text-emerald-600 dark:text-emerald-400">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>100% bepul va shartnomaviy hamkorlik</span>
          </div>
        </div>
      </div>

      {/* How it works steps */}
      <div className="bg-slate-100/70 dark:bg-[#15151F] rounded-3xl p-6 sm:p-8 mb-12 sm:mb-16 border border-slate-200/80 dark:border-slate-800">
        <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white text-center mb-6">
          Dastur qanday ishlaydi?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-heading font-extrabold text-sm flex items-center justify-center shadow-xs">
              1
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Ariza qoldiring</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-body">
              Quyidagi formani toʻldiring. Menejerimiz 24 soat ichida siz bilan bogʻlanib hamkorlik shartlarini taqdim etadi.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-heading font-extrabold text-sm flex items-center justify-center shadow-xs">
              2
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Pro hisobni oling</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-body">
              Agentligingiz uchun platformaga cheksiz bepul Pro kirish huquqi va shaxsiy hamkorlik havolasi beriladi.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-heading font-extrabold text-sm flex items-center justify-center shadow-xs">
              3
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Daromadni hisoblang</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-body">
              Mijozlaringiz Collabix'dan foydalangani sari har oylik komissiya toʻlovlari agentligingiz hisobiga oʻtkaziladi.
            </p>
          </div>
        </div>
      </div>

      {/* Application Form Section - Requirement 2 & 3 */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-lg">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white">
            Hamkorlik arizasi
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-[#D0D0D8] font-body">
            Qisqa maʼlumotlarni qoldiring, tez orada siz bilan bogʻlanamiz.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-7 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-emerald-900 dark:text-emerald-200">
              Arizangiz qabul qilindi! Tez orada siz bilan bog'lanamiz.
            </h3>
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-body leading-relaxed max-w-md mx-auto">
              Collabix hamkorlik dasturiga qiziqish bildirganingiz uchun rahmat. Masʼul mutaxassisimiz kiritilgan aloqa vositasi orqali tez orada aloqaga chiqadi.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="text-xs font-heading font-bold text-emerald-800 dark:text-emerald-200 hover:underline cursor-pointer"
              >
                Yangi ariza toʻldirish
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-heading font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Agentlik nomi */}
            <div>
              <label className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Agentlik nomi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Masalan: Nova Marketing Agency"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#1A1A24] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Aloqa shaxsi */}
            <div>
              <label className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Aloqa shaxsi (ismingiz) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Masalan: Sardor Rahimov"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#1A1A24] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Telefon / Email */}
            <div>
              <label className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Telefon raqam yoki Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  placeholder="+998 90 123 45 67 yoki agency@domain.uz"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#1A1A24] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Instagram / Veb-sayt (ixtiyoriy) */}
            <div>
              <label className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Instagram yoki veb-sayt <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={websiteOrInstagram}
                  onChange={(e) => setWebsiteOrInstagram(e.target.value)}
                  placeholder="@nova_agency yoki https://novaagency.uz"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#1A1A24] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Izoh / Taklif (ixtiyoriy) */}
            <div>
              <label className="block text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Qoʻshimcha savol yoki izoh <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agentligingiz haqida qisqacha maʼlumot yoki savollaringiz..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-body text-slate-900 dark:text-white bg-slate-50 dark:bg-[#12121A] focus:bg-white dark:focus:bg-[#1A1A24] focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-y"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-agency-application"
                disabled={isSubmitting}
                className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-heading font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Yuborilmoqda...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Ariza yuborish</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-400 font-body">
              Arizani yuborish orqali siz Collabix maxfiylik siyosatiga rozilik bildirasiz.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
