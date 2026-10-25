/**
 * Portfolio video havolalarini to'g'ri pleyerga aylantirish.
 * Instagram/YouTube/TikTok/Vimeo/Google Drive sahifa havolalari <video> tegida
 * o'ynamaydi — ular uchun platformaning rasmiy embed (iframe) manzili ishlatiladi.
 */

export type VideoSource =
  | { kind: 'file'; src: string }
  | { kind: 'embed'; src: string; platform: string; thumb?: string; aspect: 'vertical' | 'horizontal' }
  | { kind: 'link'; href: string; platform: string };

function safeUrl(raw: string): URL | null {
  const t = (raw || '').trim();
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u;
  } catch {
    return null;
  }
}

export function resolveVideoSource(raw: string): VideoSource {
  const t = (raw || '').trim();
  if (/^(data:video\/|blob:)/i.test(t)) return { kind: 'file', src: t };

  const u = safeUrl(t);
  if (!u) return { kind: 'link', href: t, platform: 'Video' };
  const host = u.hostname.replace(/^www\.|^m\./, '').toLowerCase();
  const path = u.pathname;

  // To'g'ridan-to'g'ri video fayl
  if (/\.(mp4|webm|mov|m4v|ogg)$/i.test(path)) return { kind: 'file', src: u.toString() };

  // YouTube
  if (host === 'youtu.be' || host.endsWith('youtube.com')) {
    let id = '';
    if (host === 'youtu.be') id = path.split('/')[1] || '';
    else if (path.startsWith('/watch')) id = u.searchParams.get('v') || '';
    else {
      const m = path.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/);
      if (m) id = m[2];
    }
    id = id.replace(/[^A-Za-z0-9_-]/g, '');
    if (id) {
      return {
        kind: 'embed',
        src: `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`,
        platform: 'YouTube',
        thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        aspect: path.startsWith('/shorts') ? 'vertical' : 'horizontal',
      };
    }
    return { kind: 'link', href: u.toString(), platform: 'YouTube' };
  }

  // Instagram post / reel
  if (host.endsWith('instagram.com')) {
    const m = path.match(/^\/(?:[^/]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    if (m) {
      const type = m[1] === 'reels' ? 'reel' : m[1];
      return {
        kind: 'embed',
        src: `https://www.instagram.com/${type}/${m[2]}/embed/`,
        platform: 'Instagram',
        aspect: 'vertical',
      };
    }
    return { kind: 'link', href: u.toString(), platform: 'Instagram' };
  }

  // TikTok
  if (host.endsWith('tiktok.com')) {
    const m = path.match(/\/video\/(\d+)/);
    if (m) {
      return { kind: 'embed', src: `https://www.tiktok.com/embed/v2/${m[1]}`, platform: 'TikTok', aspect: 'vertical' };
    }
    return { kind: 'link', href: u.toString(), platform: 'TikTok' };
  }

  // Vimeo
  if (host.endsWith('vimeo.com')) {
    const m = path.match(/\/(\d+)/);
    if (m) {
      return { kind: 'embed', src: `https://player.vimeo.com/video/${m[1]}`, platform: 'Vimeo', aspect: 'horizontal' };
    }
    return { kind: 'link', href: u.toString(), platform: 'Vimeo' };
  }

  // Google Drive
  if (host === 'drive.google.com') {
    const m = path.match(/\/file\/d\/([^/]+)/);
    const id = m ? m[1] : u.searchParams.get('id') || '';
    if (id) {
      return {
        kind: 'embed',
        src: `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`,
        platform: 'Google Drive',
        aspect: 'vertical',
      };
    }
    return { kind: 'link', href: u.toString(), platform: 'Google Drive' };
  }

  // Noma'lum sahifa — tashqi havola sifatida ochiladi
  return { kind: 'link', href: u.toString(), platform: host };
}

/** Havola video ekanini aniqlash (galereyaga qo'shishda) */
export function looksLikeVideoUrl(raw: string): boolean {
  const t = (raw || '').toLowerCase();
  return (
    /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/.test(t) ||
    /youtu\.?be|vimeo\.com|tiktok\.com|instagram\.com\/(?:[^/]+\/)?(reel|reels|tv|p)\/|drive\.google\.com\/file/.test(t)
  );
}
