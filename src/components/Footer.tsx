import React from 'react';
import { ShieldCheck, Sparkles, Heart, Lock } from 'lucide-react';

interface FooterProps {
  onCatalogClick: () => void;
  onNavigate: (sectionId: string) => void;
  onReferralClick?: () => void;
  onAgencyClick?: () => void;
  onAdminClick?: () => void;
  onCreateBriefClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onCatalogClick, onNavigate, onReferralClick, onAgencyClick, onAdminClick, onCreateBriefClick }) => {
  return (
    <footer id="main-footer" className="w-full bg-white dark:bg-[#0B0F19] border-t border-indigo-100/70 dark:border-slate-800/80 py-14 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="font-brand font-extrabold text-2xl tracking-tighter bg-gradient-to-r from-slate-900 to-indigo-700 dark:from-white dark:to-indigo-400 bg-clip-text text-transparent">
                COLLABIX
              </span>
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 inline-block mb-1" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm font-body mb-4 leading-relaxed">
              Bloger va brendlarni tez, ishonchli va samarali bog'laydigan platforma. Faqat tekshirilgan profillar, maqsadli auditoriya va ishonchli natija.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>100% moderatsiyadan o'tgan rasmiy ma'lumotlar</span>
            </div>
          </div>

          {/* Nav links */}
          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              Platforma
            </h4>
            <ul className="space-y-2.5 text-sm font-heading font-semibold text-slate-700 dark:text-slate-300">
              <li>
                <button
                  onClick={onCatalogClick}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Kreatorlar katalogi
                </button>
              </li>
              {onCreateBriefClick && (
                <li>
                  <button
                    onClick={onCreateBriefClick}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    Brif yaratish (Brendlar uchun)
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => onNavigate('why-collabix-section')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Nima uchun Collabix
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('how-it-works-section')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Qanday ishlaydi
                </button>
              </li>
              {onReferralClick && (
                <li>
                  <button
                    onClick={onReferralClick}
                    className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                  >
                    <span>Doʻstlarni taklif qilish (+29 000 soʻm)</span>
                  </button>
                </li>
              )}
              {/* Agentliklar hamkorlik dasturi havolasi - Vaqtincha yashirilgan */}
              {/*
              {onAgencyClick && (
                <li>
                  <button
                    onClick={onAgencyClick}
                    className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-bold transition-colors cursor-pointer"
                  >
                    <span>Agentliklar uchun hamkorlik</span>
                  </button>
                </li>
              )}
              */}
            </ul>
          </div>

          {/* Quality Reassurance */}
          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              Kafolat va sifat
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Faqat tekshirilgan blogerlar</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Haqiqiy faollik ko'rsatkichi (ER)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                <span>Maqsadli auditoriya tahlili</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span>To'g'ridan-to'g'ri bog'lanish</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono gap-4">
          <div className="flex items-center gap-3">
            <p>© {new Date().getFullYear()} Collabix. Barcha huquqlar himoyalangan.</p>
            {onAdminClick && (
              <button
                type="button"
                onClick={onAdminClick}
                id="btn-footer-admin-link"
                className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Admin panelga kirish"
              >
                <Lock className="w-3 h-3" />
                <span>Admin</span>
              </button>
            )}
          </div>
          <p className="flex items-center gap-1">
            <span>Toshkent, O'zbekiston</span>
            <span>•</span>
            <span>Zamonaviy kreator-brend ekotizimi</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
