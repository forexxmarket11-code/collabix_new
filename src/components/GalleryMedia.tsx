import React from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { resolveVideoSource } from '../utils/media';

/** Galereya elementi video sifatida ko'rsatilishi kerakmi (video turi yoki platforma havolasi) */
export function isVideoLikeItem(item: { type?: string; url: string }): boolean {
  if (item.type === 'video') return true;
  return resolveVideoSource(item.url).kind === 'embed';
}

/** Katta ko'rinishdagi video: fayl → <video>, platforma → rasmiy pleyer (iframe), boshqa → tashqi havola */
export const GalleryVideoPlayer: React.FC<{ url: string; title?: string }> = ({ url, title }) => {
  const source = resolveVideoSource(url);

  if (source.kind === 'file') {
    return (
      <video key={source.src} src={source.src} controls playsInline preload="metadata" className="w-full h-full object-contain bg-black" />
    );
  }

  if (source.kind === 'embed') {
    return (
      <iframe
        key={source.src}
        src={source.src}
        title={title || `${source.platform} video`}
        className="w-full h-full border-0 bg-black"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
        <Play className="w-8 h-8 text-white fill-white" />
      </div>
      <p className="text-sm text-slate-300 max-w-xs">Bu video saytda ochilmaydi. Uni asl sahifasida koʻring.</p>
      <a
        href={source.href}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="inline-flex items-center gap-2 min-h-[48px] px-5 rounded-2xl bg-white text-slate-900 font-heading font-bold text-sm"
      >
        <ExternalLink className="w-4 h-4" />
        Videoni ochish
      </a>
    </div>
  );
};

/** Kichik eskiz (thumbnail) */
export const GalleryVideoThumb: React.FC<{ url: string }> = ({ url }) => {
  const source = resolveVideoSource(url);
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
      {source.kind === 'file' ? (
        <video src={source.src} className="w-full h-full object-cover" muted preload="metadata" playsInline />
      ) : source.kind === 'embed' && source.thumb ? (
        <img src={source.thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <span className="absolute top-1 left-1 right-1 text-[9px] font-heading font-bold text-white/80 truncate">
          {source.platform}
        </span>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
        <Play className="w-4 h-4 fill-white" />
      </div>
    </div>
  );
};
