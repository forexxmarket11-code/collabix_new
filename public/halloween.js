/*!
 * Collabix — Halloween bezaklari
 * - Burchaklarda o'rgimchak to'rlari + osilib turgan o'rgimchak
 * - Saytga kirganda pastda yonib turgan qovoqchalar
 * - Katalog kartasi ustiga borganda kichik qovoq belgisi
 * 2026-yil 10-noyabr 23:59 (Toshkent vaqti) dan keyin o'zi o'chadi.
 *
 * Ulash: index.html ichida </body> dan oldin:
 *   <script src="/halloween.js" defer></script>
 * Katalog kartasiga data-creator-card atributini qo'shing:
 *   <div class="..." data-creator-card> ... </div>
 */
(function () {
  "use strict";

  var CONFIG = {
    // Bezaklar shu vaqtgacha ko'rinadi (Toshkent, UTC+5)
    endsAt: new Date("2026-11-10T23:59:59+05:00"),
    // Katalog kartalarini topish uchun selektor
    cardSelector: "[data-creator-card], .creator-card",
  };

  if (new Date() > CONFIG.endsAt) return;
  if (document.getElementById("cx-halloween")) return;

  var NS = "http://www.w3.org/2000/svg";

  /* ---------- O'rgimchak to'ri (SVG) ---------- */
  function webSVG(size) {
    var spokes = 7, rings = 6, pad = 2;
    var angles = [];
    for (var i = 0; i < spokes; i++) angles.push((Math.PI / 2) * (i / (spokes - 1)));
    var svg = '<svg xmlns="' + NS + '" viewBox="0 0 ' + size + " " + size + '" width="' + size + '" height="' + size + '">';
    svg += '<g fill="none" stroke="currentColor" stroke-linecap="round">';
    // nurlar
    angles.forEach(function (a) {
      svg += '<line x1="' + pad + '" y1="' + pad + '" x2="' + (Math.cos(a) * size).toFixed(1) + '" y2="' + (Math.sin(a) * size).toFixed(1) + '" stroke-width="1.1"/>';
    });
    // halqalar (biroz egilgan)
    for (var r = 1; r <= rings; r++) {
      var rad = (size * 0.95 * r) / rings;
      var d = "";
      for (var k = 0; k < angles.length; k++) {
        var x = Math.cos(angles[k]) * rad, y = Math.sin(angles[k]) * rad;
        if (k === 0) { d += "M" + x.toFixed(1) + " " + y.toFixed(1); continue; }
        var mid = (angles[k] + angles[k - 1]) / 2, sag = rad * 0.86;
        d += " Q" + (Math.cos(mid) * sag).toFixed(1) + " " + (Math.sin(mid) * sag).toFixed(1) + " " + x.toFixed(1) + " " + y.toFixed(1);
      }
      svg += '<path d="' + d + '" stroke-width="' + (0.9 + r * 0.05).toFixed(2) + '"/>';
    }
    svg += "</g></svg>";
    return svg;
  }

  /* ---------- O'rgimchak ---------- */
  var SPIDER =
    '<svg xmlns="' + NS + '" viewBox="0 0 40 34" width="30" height="26">' +
    '<g stroke="#1b1424" stroke-width="2" fill="none" stroke-linecap="round">' +
    '<path d="M14 14 Q6 8 2 12"/><path d="M14 17 Q5 15 1 20"/><path d="M14 20 Q6 22 3 28"/><path d="M15 22 Q10 28 8 33"/>' +
    '<path d="M26 14 Q34 8 38 12"/><path d="M26 17 Q35 15 39 20"/><path d="M26 20 Q34 22 37 28"/><path d="M25 22 Q30 28 32 33"/>' +
    "</g>" +
    '<ellipse cx="20" cy="21" rx="7" ry="8" fill="#1b1424"/>' +
    '<circle cx="20" cy="11" r="4.5" fill="#1b1424"/>' +
    '<circle cx="18.3" cy="10.5" r="1.3" fill="#ffb347"/><circle cx="21.7" cy="10.5" r="1.3" fill="#ffb347"/>' +
    "</svg>";

  /* ---------- Qovoq ---------- */
  function pumpkinSVG(w, face) {
    var faces = [
      // 0: kulayotgan
      '<path d="M30 34 L37 26 L41 35 Z"/><path d="M70 34 L63 26 L59 35 Z"/>' +
        '<path d="M30 48 Q50 64 70 48 L64 51 L60 46 L55 52 L50 47 L45 52 L40 46 L36 51 Z"/>',
      // 1: ko'z qisgan
      '<path d="M29 35 Q36 27 43 35 Q36 31 29 35 Z"/><path d="M71 35 L63 26 L58 36 Z"/>' +
        '<path d="M33 48 Q50 60 67 48 Q50 54 33 48 Z"/>',
      // 2: hayron
      '<circle cx="36" cy="33" r="5"/><circle cx="64" cy="33" r="5"/>' +
        '<ellipse cx="50" cy="51" rx="7" ry="8"/>',
    ][face % 3];
    return (
      '<svg xmlns="' + NS + '" viewBox="0 0 100 80" width="' + w + '">' +
      '<path d="M48 12 Q47 4 54 2 Q52 7 53 13 Z" fill="#4f6b2d"/>' +
      '<path d="M53 8 Q62 2 66 8" stroke="#5f8a34" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="30" cy="44" rx="24" ry="31" fill="#e8651b"/>' +
      '<ellipse cx="70" cy="44" rx="24" ry="31" fill="#e8651b"/>' +
      '<ellipse cx="50" cy="44" rx="22" ry="33" fill="#f7832a"/>' +
      '<path d="M50 12 Q42 44 50 77 M50 12 Q58 44 50 77" stroke="#d45812" stroke-width="1.5" fill="none" opacity=".7"/>' +
      '<g class="cx-glow" fill="#ffd24a">' + faces + "</g>" +
      "</svg>"
    );
  }

  /* ---------- Stillar ---------- */
  var css =
    "#cx-halloween{position:fixed;inset:0;pointer-events:none;z-index:9990;overflow:hidden}" +
    "#cx-halloween .cx-web{position:absolute;top:0;color:rgba(120,110,135,.55);filter:drop-shadow(0 1px 0 rgba(255,255,255,.35));opacity:0;animation:cxFade 1.2s .2s ease forwards}" +
    "#cx-halloween .cx-web.l{left:0}" +
    "#cx-halloween .cx-web.r{right:0;transform:scaleX(-1)}" +
    "@media (prefers-color-scheme:dark){#cx-halloween .cx-web{color:rgba(225,220,235,.35);filter:none}}" +
    "#cx-halloween .cx-spider{position:absolute;top:0;display:flex;flex-direction:column;align-items:center;transform-origin:top center;animation:cxDrop 1.6s .6s cubic-bezier(.3,1.4,.5,1) both,cxSway 4s 2.2s ease-in-out infinite}" +
    "#cx-halloween .cx-spider i{display:block;width:1px;background:rgba(110,100,125,.7)}" +
    "#cx-halloween .cx-pumpkins{position:absolute;bottom:-4px;display:flex;align-items:flex-end;gap:2px}" +
    "#cx-halloween .cx-pumpkins.l{left:8px}" +
    "#cx-halloween .cx-pumpkins.r{right:8px}" +
    "#cx-halloween .cx-pk{opacity:0;transform:translateY(40px) scale(.6);animation:cxPop .7s cubic-bezier(.3,1.6,.5,1) forwards;filter:drop-shadow(0 4px 10px rgba(232,101,27,.35))}" +
    "#cx-halloween .cx-pk svg{display:block;height:auto}" +
    "#cx-halloween .cx-glow{animation:cxFlicker 2.6s ease-in-out infinite}" +
    "@keyframes cxFade{to{opacity:1}}" +
    "@keyframes cxDrop{from{transform:translateY(-120%)}to{transform:translateY(0)}}" +
    "@keyframes cxSway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}" +
    "@keyframes cxPop{to{opacity:1;transform:translateY(0) scale(1)}}" +
    "@keyframes cxFlicker{0%,100%{fill:#ffd24a}45%{fill:#ffb02e}50%{fill:#ffe68a}55%{fill:#ffc23a}}" +
    // Katalog kartasi: ustiga borganda qovoq
    CONFIG.cardSelector.split(",").map(function (s) { return s.trim(); }).join(",") +
    "{position:relative}" +
    CONFIG.cardSelector.split(",").map(function (s) { return s.trim() + "::after"; }).join(",") +
    '{content:"";position:absolute;top:-16px;right:18px;width:34px;height:28px;background:url("data:image/svg+xml;utf8,' +
    encodeURIComponent(pumpkinSVG(34, 0)) +
    '") center/contain no-repeat;opacity:0;transform:translateY(6px) rotate(-12deg) scale(.6);transition:all .35s cubic-bezier(.3,1.6,.5,1);pointer-events:none;z-index:5;filter:drop-shadow(0 3px 6px rgba(0,0,0,.25))}' +
    CONFIG.cardSelector.split(",").map(function (s) { return s.trim() + ":hover::after"; }).join(",") +
    "{opacity:1;transform:translateY(0) rotate(8deg) scale(1)}" +
    // Telefon
    "@media (max-width:640px){#cx-halloween .cx-web svg{width:110px;height:110px}#cx-halloween .cx-spider{display:none}#cx-halloween .cx-pk svg{width:38px!important}#cx-halloween .cx-pk.big svg{width:50px!important}}" +
    // Harakatsiz rejim
    "@media (prefers-reduced-motion:reduce){#cx-halloween *,#cx-halloween *::before{animation:none!important;opacity:1!important;transform:none!important}#cx-halloween .cx-web.r{transform:scaleX(-1)!important}}";

  function build() {
    var style = document.createElement("style");
    style.id = "cx-halloween-style";
    style.textContent = css;
    document.head.appendChild(style);

    var root = document.createElement("div");
    root.id = "cx-halloween";
    root.setAttribute("aria-hidden", "true");

    // To'rlar
    root.innerHTML =
      '<div class="cx-web l">' + webSVG(170) + "</div>" +
      '<div class="cx-web r">' + webSVG(150) + "</div>" +
      // o'rgimchak o'ng to'rdan osilgan
      '<div class="cx-spider" style="right:70px"><i style="height:120px"></i>' + SPIDER + "</div>";

    // Qovoqchalar
    function pk(w, face, delay, big) {
      return '<div class="cx-pk' + (big ? " big" : "") + '" style="animation-delay:' + delay + 's">' + pumpkinSVG(w, face) + "</div>";
    }
    root.innerHTML +=
      '<div class="cx-pumpkins l">' + pk(66, 0, 0.5, true) + pk(46, 1, 0.75) + "</div>" +
      '<div class="cx-pumpkins r">' + pk(42, 2, 0.9) + pk(60, 1, 0.65, true) + "</div>";

    document.body.appendChild(root);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
