(function (w) {
  "use strict";

  var FB = w.FIREBASE || {};
  var DB = String(FB.dbUrl || "").replace(/\/+$/, "");

  var PATHS = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    download: '<path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14"/>',
    shield: '<path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/>',
    shieldlock: '<path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/><rect x="9" y="11" width="6" height="4.5" rx="1"/><path d="M10 11V9.8a2 2 0 0 1 4 0V11"/>',
    notebook: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12.5 8h3M12.5 12h3"/>',
    headset: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19v1a2 2 0 0 1-2 2h-4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.5-3.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14.5 3.5L20 15M20 20v-5h-5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
    whatsapp: '<path d="M3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 8.8c.4 2.2 2.7 4.5 5 5.4l1.3-1.3-2-1-.8.8c-.8-.4-1.5-1.1-1.9-1.9l.8-.8-1-2z"/>',
    back: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    forward: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chevron: '<path d="M15 6l-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0"/><path d="M12 19h.01"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>',
    bell: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/>',
    chart: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    file: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h6"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    wallet: '<path d="M4 7a2 2 0 0 1 2-2h11v4"/><rect x="4" y="7" width="16" height="12" rx="2"/><path d="M16 13h2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 6.2A9.5 9.5 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.2 7.5A17 17 0 0 0 2 12s4 7 10 7a9.3 9.3 0 0 0 3.8-.8"/>',
    upload: '<path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M5 20h14"/>',
    logout: '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="9" r="1.3"/>'
  };

  var FEATURE_ICONS = ["shield", "lock", "bell", "moon", "chart", "wifi", "user", "file", "search", "refresh", "clock", "download", "bolt", "phone", "wallet", "globe", "settings", "check", "chat", "image"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function ic(name) {
    return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (PATHS[name] || PATHS.info) + "</svg>";
  }

  /* ---- الشعار: مربعات التطبيقات تشكّل حرف R ---- */
  var LOGO_CELLS = [[0, 0], [1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [1, 2], [2, 2], [0, 3], [2, 3], [0, 4]];
  function logo(variant, size) {
    var light = variant === "light";
    var bg = light ? "#FFFFFF" : "#1B2A4A";
    var fg = light ? "#1B2A4A" : "#FFFFFF";
    var s = size || 36;
    var rects = LOGO_CELLS.map(function (c) {
      return '<rect x="' + (16 + 8 * c[0]) + '" y="' + (12 + 8 * c[1]) + '" width="7" height="7" rx="1.6" fill="' + fg + '"/>';
    }).join("");
    return '<svg class="logo" width="' + s + '" height="' + s + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="16" fill="' + bg + '"/>' +
      rects + '<rect x="40" y="44" width="7" height="7" rx="1.6" fill="#F5A623"/></svg>';
  }

  /* ---- تحقق وتنظيف البيانات القادمة من قاعدة البيانات ---- */
  function safeImg(s) {
    return typeof s === "string" && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(s) ? s : "";
  }
  function safeUrl(u) {
    return /^https:\/\/[^\s"'<>]+$/.test(String(u || "")) ? String(u) : "";
  }
  function safeColor(c) {
    return /^#[0-9a-fA-F]{6}$/.test(String(c || "")) ? c : "#1565C0";
  }
  function safeId(id) {
    return /^[A-Za-z0-9_-]{1,40}$/.test(String(id || "")) ? String(id) : "";
  }
  function luminance(hex) {
    var h = safeColor(hex).slice(1);
    var r = parseInt(h.substr(0, 2), 16) / 255, g = parseInt(h.substr(2, 2), 16) / 255, b = parseInt(h.substr(4, 2), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  function onColor(hex) { return luminance(hex) > 0.62 ? "#1B2A4A" : "#FFFFFF"; }
  function tint(hex, amount) {
    var h = safeColor(hex).slice(1);
    var a = amount == null ? 0.88 : amount;
    function mix(v) { return Math.round(parseInt(v, 16) * (1 - a) + 255 * a); }
    function hx(n) { var t = n.toString(16); return t.length < 2 ? "0" + t : t; }
    return "#" + hx(mix(h.substr(0, 2))) + hx(mix(h.substr(2, 2))) + hx(mix(h.substr(4, 2)));
  }

  function fmtSize(bytes) {
    var b = Number(bytes) || 0;
    if (b <= 0) { return ""; }
    if (b >= 1048576) { return (b / 1048576).toFixed(b >= 104857600 ? 0 : 1).replace(/\.0$/, "") + " ميجابايت"; }
    return Math.max(1, Math.round(b / 1024)) + " كيلوبايت";
  }
  function fmtNum(n) {
    n = Number(n) || 0;
    if (n >= 1000000) { return (n / 1000000).toFixed(1).replace(/\.0$/, "") + " مليون"; }
    if (n >= 1000) { return (n / 1000).toFixed(1).replace(/\.0$/, "") + " ألف"; }
    return String(n);
  }
  function fmtDate(ts) {
    var t = Number(ts);
    if (!t) { return ""; }
    var d = new Date(t);
    var m = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return d.getDate() + " " + m[d.getMonth()] + " " + d.getFullYear();
  }

  /* ---- نص بسيط: سطر يبدأ بـ # عنوان، وسطر يبدأ بـ - نقطة، والباقي فقرات ---- */
  function renderDoc(text) {
    var lines = String(text || "").replace(/\r/g, "").split("\n");
    var out = "", list = false, para = [];
    function flushPara() { if (para.length) { out += "<p>" + esc(para.join(" ")) + "</p>"; para = []; } }
    function closeList() { if (list) { out += "</ul>"; list = false; } }
    lines.forEach(function (raw) {
      var line = raw.trim();
      if (!line) { flushPara(); closeList(); return; }
      if (line.indexOf("# ") === 0) { flushPara(); closeList(); out += "<h2>" + esc(line.slice(2)) + "</h2>"; return; }
      if (line.indexOf("- ") === 0) { flushPara(); if (!list) { out += "<ul>"; list = true; } out += "<li>" + esc(line.slice(2)) + "</li>"; return; }
      closeList(); para.push(line);
    });
    flushPara(); closeList();
    return out;
  }

  /* ---- قراءة قاعدة البيانات (عامة، بدون تسجيل دخول) ---- */
  function dbGet(path) {
    if (!DB) { return Promise.reject(new Error("no db")); }
    return fetch(DB + "/" + path + ".json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) { throw new Error("http " + r.status); }
      return r.json();
    });
  }

  function listFrom(apps, admin) {
    var out = [];
    Object.keys(apps || {}).forEach(function (id) {
      var a = apps[id];
      if (!a || typeof a !== "object" || !safeId(id)) { return; }
      if (a.hidden && !admin) { return; }
      var item = {};
      Object.keys(a).forEach(function (k) { item[k] = a[k]; });
      item.id = id;
      out.push(item);
    });
    out.sort(function (x, y) { return (Number(x.order) || 0) - (Number(y.order) || 0); });
    return out;
  }

  function loadStore() {
    if (!DB) { return Promise.resolve({ apps: {}, downloads: {} }); }
    return Promise.all([dbGet("store/apps"), dbGet("store/downloads")]).then(function (r) {
      var data = { apps: r[0] || {}, downloads: r[1] || {} };
      try { localStorage.setItem("rt_store_v1", JSON.stringify(data)); } catch (e) { /* ignore */ }
      return data;
    }).catch(function (err) {
      try {
        var c = JSON.parse(localStorage.getItem("rt_store_v1") || "null");
        if (c && c.apps) { c.cached = true; return c; }
      } catch (e) { /* ignore */ }
      throw err;
    });
  }

  /* ---- عدّاد التحميلات: مرة واحدة لكل جهاز لكل إصدار ---- */
  function countDownload(id, version) {
    id = safeId(id);
    if (!id || !DB) { return; }
    var key = "rt_dl_" + id + "_" + String(version || "");
    try { if (localStorage.getItem(key)) { return; } } catch (e) { /* ignore */ }
    var url = DB + "/store/downloads/" + id + ".json";
    fetch(url, { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (n) {
      n = typeof n === "number" ? n : 0;
      return fetch(url, { method: "PUT", body: JSON.stringify(n + 1) });
    }).then(function (r) {
      if (r && r.ok) { try { localStorage.setItem(key, "1"); } catch (e) { /* ignore */ } }
    }).catch(function () { /* ignore */ });
  }

  w.RT = {
    PATHS: PATHS, FEATURE_ICONS: FEATURE_ICONS, DB: DB,
    esc: esc, ic: ic, logo: logo,
    safeImg: safeImg, safeUrl: safeUrl, safeColor: safeColor, safeId: safeId,
    onColor: onColor, tint: tint,
    fmtSize: fmtSize, fmtNum: fmtNum, fmtDate: fmtDate, renderDoc: renderDoc,
    dbGet: dbGet, listFrom: listFrom, loadStore: loadStore, countDownload: countDownload
  };
})(window);
