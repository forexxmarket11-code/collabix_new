import React, { useRef, useState, useEffect } from 'react';
import { Search, UserCheck, MessageSquare, ArrowRight, Zap } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '../data/creators';
import { observeReveal } from '../utils/scrollObserver';

interface HowItWorksSectionProps {
  onStartStep1: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onStartStep1 }) => {
  const sectionRef = useRef<HTMLElement>(null);
  
  // Always default to true so it is 100% visible
  const [hasRevealed, setHasRevealed] = useState(true);

  useEffect(() => {
    return observeReveal(sectionRef.current, () => {
      setHasRevealed(true);
    });
  }, []);

  const stepDetails = [
    {
      icon: <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      tagBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900',
      accentBorder: 'border-indigo-200 dark:border-indigo-800',
      numColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      tagBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900',
      accentBorder: 'border-purple-200 dark:border-purple-800',
      numColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      tagBg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-900',
      accentBorder: 'border-orange-200 dark:border-orange-800',
      numColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <section
      id="how-it-works-section"
      ref={sectionRef}
      className="relative w-full py-20 lg:py-28 bg-gradient-to-b from-white to-[#F8FAFD] dark:from-[#0B0F19] dark:to-[#0F172A] border-b border-slate-200/80 dark:border-slate-800/80 opacity-100 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header: Guaranteed visible */}
        <div className="max-w-2xl mb-16 opacity-100 translate-y-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900 mb-3">
            <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Qanday ishlaydi
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 font-heading">
            3 ta oddiy qadamda birinchi hamkorlik
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-body">
            Ortiqcha muzokaralar va haftalab kutishlarsiz aniq maqsad va tezkor natijaga erishish yo'li.
          </p>
        </div>

        {/* 3 Step Cards: Guaranteed visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {HOW_IT_WORKS_STEPS.map((stepItem, idx) => {
            const detail = stepDetails[idx];
            return (
              <div
                key={stepItem.step}
                id={`how-it-works-step-${idx + 1}`}
                className="p-8 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between opacity-100 translate-y-0"
                style={{
                  opacity: 1,
                  transform: 'none',
                }}
              >
                <div>
                  <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
                    <span className={`font-heading font-extrabold text-4xl ${detail.numColor}`}>
                      {stepItem.step}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                      {detail.icon}
                    </div>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {stepItem.title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-body mb-6">
                    {stepItem.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span
                    className={`inline-block text-xs font-mono font-medium px-3 py-1.5 rounded-lg border ${detail.tagBg}`}
                  >
                    {stepItem.highlight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Fast Action Prompt Card */}
        <div
          className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900 border border-slate-800 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 opacity-100 translate-y-0"
        >
          <div className="max-w-xl">
            <h4 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
              Mos blogerlarni hoziroq saralang va brif yo'llang
            </h4>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1.5 font-body">
              Faqat haqiqiy va faol auditoriyaga ega bo'lgan saralangan blogerlar bazasi.
            </p>
          </div>

          <button
            id="btn-how-it-works-cta"
            onClick={onStartStep1}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-heading font-bold text-sm tracking-tight shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer w-full sm:w-auto justify-center"
          >
            <span>Katalogni ochish</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

      </div>
    </section>
  );
};
