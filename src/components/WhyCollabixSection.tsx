import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, FileText, MessageSquare, ArrowUpRight, Sparkles } from 'lucide-react';
import { WHY_COLLABIX_FEATURES } from '../data/creators';
import { observeReveal } from '../utils/scrollObserver';

interface WhyCollabixSectionProps {
  onExploreClick?: () => void;
}

export const WhyCollabixSection: React.FC<WhyCollabixSectionProps> = ({ onExploreClick }) => {
  const sectionRef = useRef<HTMLElement>(null);
  
  // Default to true so content is NEVER hidden if JS fails or lags (Progressive Enhancement)
  const [hasRevealed, setHasRevealed] = useState(true);

  useEffect(() => {
    return observeReveal(sectionRef.current, () => {
      setHasRevealed(true);
    });
  }, []);

  const featureThemes = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
      borderHover: 'hover:border-indigo-400 hover:shadow-indigo-500/10',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      gradientBar: 'from-indigo-500 to-purple-500',
      metricColor: 'text-indigo-600',
      arrowBg: 'group-hover:bg-indigo-600 group-hover:text-white',
    },
    {
      icon: <FileText className="w-6 h-6 text-pink-600" />,
      borderHover: 'hover:border-pink-400 hover:shadow-pink-500/10',
      badgeBg: 'bg-pink-50 text-pink-700 border-pink-100',
      gradientBar: 'from-pink-500 to-rose-500',
      metricColor: 'text-pink-600',
      arrowBg: 'group-hover:bg-pink-600 group-hover:text-white',
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-orange-600" />,
      borderHover: 'hover:border-orange-400 hover:shadow-orange-500/10',
      badgeBg: 'bg-orange-50 text-orange-700 border-orange-100',
      gradientBar: 'from-orange-500 to-amber-500',
      metricColor: 'text-orange-600',
      arrowBg: 'group-hover:bg-orange-600 group-hover:text-white',
    },
  ];

  return (
    <section
      id="why-collabix-section"
      ref={sectionRef}
      className="relative w-full py-20 lg:py-28 bg-white dark:bg-[#0B0F19] border-b border-indigo-100/60 dark:border-slate-800/80 overflow-hidden opacity-100 transition-colors duration-300"
    >
      {/* Soft background ambient glow */}
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-purple-100/40 dark:bg-purple-900/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Always guaranteed visible */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-slate-200 dark:border-slate-800 opacity-100 translate-y-0"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Nima uchun Collabix
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
              Reklama hamkorligida shaffoflik va tezkor natija
            </h2>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-body mt-4 md:mt-0 max-w-md">
            Haqiqiy tahliliy metrikalar, tezkor brifing tizimi va to'g'ridan-to'g'ri bog'lanish imkoniyati.
          </p>
        </div>

        {/* 3 Distinct Colorful Feature Cards: Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {WHY_COLLABIX_FEATURES.map((feature, idx) => {
            const theme = featureThemes[idx];
            return (
              <div
                key={feature.id}
                id={`feature-card-${idx + 1}`}
                className={`group relative p-8 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden opacity-100 translate-y-0 ${
                  theme.borderHover
                }`}
                style={{
                  opacity: 1,
                  transform: 'none',
                }}
              >
                {/* Top decorative gradient line on hover */}
                <div
                  className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${theme.gradientBar} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                {/* Card Header */}
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      QADAM {feature.number}
                    </span>
                    <div className="w-12 h-12 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {theme.icon}
                    </div>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-body mb-8">
                    {feature.description}
                  </p>
                </div>

                {/* Card Bottom Metric */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                  <div>
                    <span className={`font-heading text-2xl font-extrabold block ${theme.metricColor}`}>
                      {feature.metric}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {feature.metricLabel}
                    </span>
                  </div>

                  <div
                    className={`w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all ${theme.arrowBg}`}
                  >
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
