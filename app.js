(function () {
  "use strict";

  var R = window.RT, S = window.SITE || {};
  var esc = R.esc, ic = R.ic;
  var current = null;
  var RM = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  document.documentElement.classList.add("js");

  function $(id) { return document.getElementById(id); }
  function param(k) {
    try { return new URLSearchParams(location.search).get(k) || ""; } catch (e) { return ""; }
  }
  function wa(msg) {
    var n = String(S.whatsapp || "").replace(/\D/g, "");
    if (!n) { return ""; }
    return "https://wa.me/" + n + (msg ? "?text=" + encodeURIComponent(msg) : "");
  }
  function toast(text) {
    var t = $("toast");
    if (!t) { return; }
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toast._h);
    toast._h = setTimeout(function () { t.classList.remove("show"); }, 3600);
  }

  /* ---------- حركة خفيفة ---------- */
  var revealIO = null;
  function initReveal(root) {
    var items = (root || document).querySelectorAll("[data-reveal]:not(.in)");
    Array.prototype.forEach.call(items, function (el, i) {
      if (RM || !("IntersectionObserver" in window)) { el.classList.add("in"); return; }
      el.style.transitionDelay = ((i % 5) * 70) + "ms";
      if (!revealIO) {
        revealIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) { en.target.classList.add("in"); revealIO.unobserve(en.target); }
          });
        }, { threshold: 0.12 });
      }
      revealIO.observe(el);
    });
  }
  function countUp(el) {
    var n = Number(el.getAttribute("data-n")) || 0;
    if (RM || n < 20) { el.textContent = R.fmtNum(n); return; }
    var t0 = null, dur = 900;
    function step(ts) {
      if (!t0) { t0 = ts; }
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = R.fmtNum(Math.round(n * e));
      if (p < 1) { requestAnimationFrame(step); } else { el.textContent = R.fmtNum(n); }
    }
    requestAnimationFrame(step);
  }
  function initCounters(root) {
    var els = (root || document).querySelectorAll(".cnt[data-n]");
    Array.prototype.forEach.call(els, function (el) {
      if (RM || !("IntersectionObserver" in window)) { el.textContent = R.fmtNum(Number(el.getAttribute("data-n"))); return; }
      el.textContent = "0";
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { countUp(el); io.disconnect(); } });
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }
  function animateDl(a) {
    var t = a.querySelector(".t");
    if (!t || a.getAttribute("data-busy")) { return; }
    a.setAttribute("data-busy", "1");
    var label = t.textContent;
    if (!RM) { a.classList.add("run"); }
    setTimeout(function () { a.classList.add("ok"); t.textContent = "بدأ التنزيل ✓"; }, RM ? 0 : 1000);
    setTimeout(function () {
      a.classList.remove("run"); a.classList.remove("ok"); t.textContent = label; a.removeAttribute("data-busy");
    }, 3600);
  }

  /* ---------- الهيكل المشترك ---------- */
  function headerHtml() {
    var contact = wa() ? '<a href="index.html#contact">تواصل معنا</a>' : "";
    return '<a class="skip" href="#main">انتقل إلى المحتوى</a>' +
      '<header class="site-header"><div class="wrap bar">' +
      '<a class="brand" href="index.html" aria-label="' + esc(S.name) + ' - الصفحة الرئيسية">' + R.logo("dark", 36) + "<span>" + esc(S.name) + "</span></a>" +
      '<button class="menu-btn" id="menuBtn" type="button" aria-label="القائمة" aria-expanded="false" aria-controls="nav">' + ic("menu") + "</button>" +
      '<nav class="nav" id="nav" aria-label="القائمة الرئيسية">' +
      '<a href="index.html#products">التطبيقات</a><a href="index.html#start">كيف تبدأ</a><a href="about.html">من نحن</a>' + contact +
      "</nav></div></header>";
  }
  function footerHtml() {
    return '<footer class="site-footer"><div class="wrap foot">' +
      '<a class="brand" href="index.html">' + R.logo("light", 30) + "<span>" + esc(S.name) + "</span></a>" +
      '<nav aria-label="روابط الموقع"><a href="about.html">من نحن</a><a href="privacy.html">سياسة الخصوصية</a><a href="terms.html">شروط الاستخدام</a></nav>' +
      "<span>© " + esc(S.year) + " " + esc(S.name) + " - جميع الحقوق محفوظة</span></div></footer>" +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
  }
  function layout() {
    var h = $("app-header"); if (h) { h.innerHTML = headerHtml(); }
    var f = $("app-footer"); if (f) { f.innerHTML = footerHtml(); }
    Array.prototype.forEach.call(document.querySelectorAll("[data-ic]"), function (n) { n.innerHTML = ic(n.getAttribute("data-ic")); });
    var has = !!wa();
    Array.prototype.forEach.call(document.querySelectorAll("[data-needs-wa]"), function (n) { if (!has && n.parentNode) { n.parentNode.removeChild(n); } });
    Array.prototype.forEach.call(document.querySelectorAll("a[data-wa]"), function (n) {
      n.setAttribute("href", wa(n.getAttribute("data-msg") || ""));
      n.setAttribute("target", "_blank");
      n.setAttribute("rel", "noopener");
    });
    if (S.floatWhatsApp && has && !$("waFab")) {
      var fab = document.createElement("a");
      fab.id = "waFab"; fab.className = "wa-fab"; fab.href = wa("مرحباً، عندي استفسار");
      fab.target = "_blank"; fab.rel = "noopener"; fab.setAttribute("aria-label", "راسلنا على واتساب");
      fab.innerHTML = ic("whatsapp");
      document.body.appendChild(fab);
      var lastY = window.pageYOffset || 0;
      window.addEventListener("scroll", function () {
        var y = window.pageYOffset || 0;
        if (y > lastY + 8 && y > 200) { fab.classList.add("hide"); }
        else if (y < lastY - 8 || y <= 200) { fab.classList.remove("hide"); }
        lastY = y;
      }, { passive: true });
    }
  }

  /* ---------- مكونات التطبيق ---------- */
  function iconBox(a) {
    var img = R.safeImg(a.icon);
    if (img) { return '<div class="app-icon"><img src="' + img + '" alt=""></div>'; }
    return '<div class="app-icon" aria-hidden="true">' + esc(String(a.name || "؟").charAt(0)) + "</div>";
  }
  function dlLabel(n) {
    return n >= 10 ? '<b class="cnt" data-n="' + n + '">' + esc(R.fmtNum(n)) + "</b> تحميل" : "جديد";
  }
  function metaRow(a, n) {
    var parts = ["<span>" + ic("download") + dlLabel(n) + "</span>"];
    if (a.size) { parts.push("<span>" + ic("box") + esc(R.fmtSize(a.size)) + "</span>"); }
    if (a.version) { parts.push("<span>" + ic("tag") + "الإصدار " + esc(a.version) + "</span>"); }
    return '<div class="meta-row">' + parts.join("") + "</div>";
  }
  function dlButton(a, label, style, cls) {
    var url = R.safeUrl(a.apk);
    if (!url) { return '<span class="btn ' + (cls || "") + '" aria-disabled="true">' + ic("clock") + "قريباً</span>"; }
    return '<a class="btn dl ' + (cls || "") + '" style="' + (style || "") + '" href="' + esc(url) + '" download rel="noopener" data-dl="' + esc(a.id) + '" data-ver="' + esc(a.version || "") + '"><i class="fill"></i><span class="lbl">' + ic("download") + '<span class="t">' + esc(label) + "</span></span></a>";
  }
  function card(a, counts) {
    var color = R.safeColor(a.color), fg = R.onColor(color);
    var n = Number(counts[a.id]) || 0;
    return '<article class="card" data-reveal><div class="card-top" style="background:' + color + ";color:" + fg + '">' + iconBox(a) +
      "<div><h3>" + esc(a.name) + '</h3><div class="sub">' + esc(a.kicker) + "</div></div></div>" +
      '<div class="card-body"><p>' + esc(a.summary) + "</p>" + metaRow(a, n) +
      '<div class="card-actions">' + dlButton(a, "تنزيل", "background:" + color + ";color:" + fg, "") +
      '<a class="btn" style="background:' + R.tint(color, 0.88) + ";color:" + (fg === "#FFFFFF" ? color : "#1B2A4A") + '" href="app.html?id=' + encodeURIComponent(a.id) + '">التفاصيل</a></div></div></article>';
  }

  var PIX = [[0, 0, ""], [1, 0, ""], [2, 0, ""], [0, 1, "w"], [3, 1, ""], [0, 2, "w"], [1, 2, ""], [2, 2, ""], [0, 3, "w"], [2, 3, ""], [0, 4, "w"], [3, 4, "a"]];
  function pixHtml() {
    var out = "";
    PIX.forEach(function (p, i) {
      out += '<i class="' + p[2] + '" style="grid-column:' + (p[0] + 1) + ";grid-row:" + (p[1] + 1) + ";animation-delay:" + (0.15 + i * 0.07).toFixed(2) + 's"></i>';
    });
    return '<div class="pix" aria-hidden="true">' + out + "</div>";
  }

  /* ---------- الصفحة الرئيسية ---------- */
  function home() {
    var art = $("heroArt");
    if (art) { art.innerHTML = pixHtml(); }
    var grid = $("productGrid");
    if (!grid) { return; }
    grid.innerHTML = '<div class="loading" style="grid-column:1/-1">جارٍ تحميل التطبيقات…</div>';
    R.loadStore().then(function (d) {
      var list = R.listFrom(d.apps, false);
      if (!list.length) {
        grid.className = "grid"; grid.style.display = "block";
        grid.innerHTML = '<div class="empty">' + pixHtml() +
          "<h3>أول تطبيقاتنا قيد الإعداد</h3><p>نجهّز التطبيقات الأولى لتنزيلها من هنا مباشرة. عد قريباً.</p>" +
          (wa() ? '<a class="btn btn-navy" data-wa data-msg="مرحباً، أريد أن أعرف متى تصدر التطبيقات">' + ic("whatsapp") + "اسألنا عن موعد الإصدار</a>" : "") + "</div>";
        layout();
        return;
      }
      grid.style.display = "";
      grid.className = "grid" + (list.length === 1 ? " one" : "");
      grid.innerHTML = list.map(function (a) { return card(a, d.downloads); }).join("");
      initReveal(grid); initCounters(grid);
    }).catch(function () {
      grid.style.display = "block";
      grid.innerHTML = '<div class="empty"><h3>تعذّر تحميل التطبيقات</h3><p>تحقق من اتصالك بالإنترنت ثم أعد المحاولة.</p><button class="btn btn-navy" type="button" id="retryBtn">إعادة المحاولة</button></div>';
    });
  }

  /* ---------- صفحة من نحن ---------- */
  function aboutPage() {
    var A = S.about || {}, m = $("main");
    if (!m) { return; }
    document.title = (A.kicker || "من نحن") + " | " + S.name;
    var h = '<section class="ab-hero"><div class="wrap"><div class="kick">' + esc(A.kicker || "من نحن") + "</div><h1>" + (A.title || []).map(esc).join("<br>") + "</h1><p>" + esc(A.lead || "") + "</p></div></section>";
    if ((A.story || []).length) {
      h += '<section class="section"><div class="wrap ab-story" data-reveal>' + A.story.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div></section>";
    }
    if ((A.steps || []).length) {
      h += '<section class="section pale"><div class="wrap"><h2 data-reveal>' + esc(A.stepsTitle || "كيف نعمل") + '</h2><div class="timeline" id="tl" style="margin-top:20px"><span class="line"></span>' +
        A.steps.map(function (s) { return '<div class="tl-item" data-reveal><i></i><b>' + esc(s.t) + "</b><span>" + esc(s.d) + "</span></div>"; }).join("") + "</div></div></section>";
    }
    if ((A.values || []).length) {
      h += '<section class="section"><div class="wrap"><h2 data-reveal>' + esc(A.valuesTitle || "ما نؤمن به") + '</h2><div class="values" style="margin-top:16px">' +
        A.values.map(function (v, i) {
          var icn = R.FEATURE_ICONS.indexOf(v.icon) >= 0 ? v.icon : "check";
          return '<div class="val b' + (i % 3 + 1) + '" data-reveal>' + ic(icn) + "<b>" + esc(v.t) + "</b><span>" + esc(v.d) + "</span></div>";
        }).join("") + "</div></div></section>";
    }
    if (wa() && A.cta) {
      h += '<section class="cta"><div class="wrap"><h2>' + esc(A.cta.title || "") + '</h2><p>نرد عليك مباشرة</p><a class="btn btn-navy" data-wa data-msg="مرحباً، عندي سؤال أو فكرة">' + ic("whatsapp") + esc(A.cta.text || "راسلنا") + "</a></div></section>";
    }
    m.innerHTML = h;
    layout();
    initReveal(m);
    var tl = $("tl");
    if (tl) {
      if (RM || !("IntersectionObserver" in window)) { tl.classList.add("in"); }
      else {
        var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { tl.classList.add("in"); io.disconnect(); } }, { threshold: 0.2 });
        io.observe(tl);
      }
    }
  }

  /* ---------- صفحة التطبيق ---------- */
  function notFound(main) {
    main.innerHTML = '<section class="section"><div class="wrap"><h2>لم نجد هذا التطبيق</h2>' +
      '<p class="lead">قد يكون الرابط قديماً أو التطبيق غير متاح الآن.</p>' +
      '<a class="btn btn-primary" href="index.html#products">عرض كل التطبيقات</a></div></section>';
  }
  function section(title, inner) {
    return '<div class="wrap sec-pad" data-reveal><h2>' + esc(title) + "</h2>" + inner + "</div>";
  }
  function permIcon(name) {
    var n = String(name || "");
    if (/افتراضية|VPN/i.test(n)) { return "shieldlock"; }
    if (/إشعار|تنبيه/.test(n)) { return "bell"; }
    if (/استخدام|إحصاء/.test(n)) { return "chart"; }
    if (/شبكة|إنترنت|اتصال|واي|وايفاي/.test(n)) { return "wifi"; }
    if (/موقع/.test(n)) { return "globe"; }
    if (/تخزين|ملفات|صور/.test(n)) { return "file"; }
    if (/جهات|حسابات/.test(n)) { return "user"; }
    if (/كاميرا|ميكروفون|صوت|هاتف|جوال/.test(n)) { return "phone"; }
    return "lock";
  }

  function appPage() {
    var main = $("main");
    var id = R.safeId(param("id"));
    if (!id) { notFound(main); return; }
    main.innerHTML = '<div class="wrap"><div class="loading">جارٍ التحميل…</div></div>';
    Promise.all([
      R.dbGet("store/apps/" + id), R.dbGet("store/detail/" + id),
      R.dbGet("store/downloads/" + id), R.loadStore().catch(function () { return null; })
    ]).then(function (r) {
      var a = r[0];
      if (!a || typeof a !== "object" || a.hidden) { notFound(main); return; }
      a.id = id;
      renderApp(main, a, r[1] || {}, Number(r[2]) || 0, r[3]);
      loadShots(a);
    }).catch(function () {
      main.innerHTML = '<section class="section"><div class="wrap"><h2>تعذّر تحميل الصفحة</h2><p class="lead">تحقق من اتصالك بالإنترنت ثم أعد المحاولة.</p><a class="btn btn-primary" href="">إعادة المحاولة</a></div></section>';
    });
  }

  function renderApp(main, a, d, n, store) {
    current = a;
    var color = R.safeColor(a.color), fg = R.onColor(color), tint = R.tint(color, 0.9);
    document.title = a.name + " | " + S.name;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) { meta.setAttribute("content", a.summary || ""); }

    var chips = '<span class="chip">' + ic("tag") + "الإصدار " + esc(a.version || "") + "</span>";
    if (a.size) { chips += '<span class="chip">' + ic("box") + esc(R.fmtSize(a.size)) + "</span>"; }
    chips += '<span class="chip">' + ic("download") + dlLabel(n) + "</span>";

    var h = '<section class="app-hero" style="background:' + color + ";color:" + fg + '"><div class="wrap">' +
      '<a class="back" href="index.html#products">' + ic("back") + "كل التطبيقات</a>" +
      '<div class="row">' + iconBox(a) + "<div><h1>" + esc(a.name) + '</h1><div class="sub">' + esc(a.kicker) + "</div></div></div>" +
      '<div class="chips">' + chips + "</div>" +
      '<div class="actions">' + dlButton(a, "تنزيل التطبيق", "color:" + (fg === "#FFFFFF" ? color : "#1B2A4A"), "btn-white") +
      '<button class="btn sq" id="shareBtn" type="button" aria-label="مشاركة التطبيق" style="background:rgba(255,255,255,.2);color:' + fg + '">' + ic("share") + "</button></div></div></section>";

    if (a.ns === undefined || Number(a.ns) > 0) {
      h += section("صور من التطبيق", '<div id="shotsBox"><div class="shots-wait">جارٍ تحميل الصور…</div></div>');
    }

    var about = Array.isArray(d.about) ? d.about : [];
    if (about.length) {
      h += section("عن التطبيق", '<div class="prose-block">' + about.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>");
    }

    var feats = Array.isArray(d.features) ? d.features : [];
    if (feats.length) {
      h += section("المميزات", '<div class="feat-list">' + feats.map(function (f) {
        var icn = R.FEATURE_ICONS.indexOf(f.icon) >= 0 ? f.icon : "check";
        return '<div class="feat" style="background:' + tint + '"><div class="fi" style="color:' + color + '">' + ic(icn) + "</div><div><h3>" + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></div></div>";
      }).join("") + "</div>");
    }

    var news = Array.isArray(d.whatsnew) ? d.whatsnew.filter(Boolean) : [];
    if (news.length) {
      h += section("ما الجديد في الإصدار " + (a.version || ""), '<div class="news">' + news.map(function (t) { return "<div>" + ic("check") + "<span>" + esc(t) + "</span></div>"; }).join("") + "</div>");
    }

    if (d.minAndroid) {
      h += section("المتطلبات", '<div class="req">' + ic("phone") + "<div>يعمل على أندرويد <b>" + esc(d.minAndroid) + "</b> فما فوق</div></div>");
    }

    var perms = Array.isArray(d.perms) ? d.perms.filter(function (p) { return p && p.name; }) : [];
    if (perms.length) {
      h += section("الأذونات التي يطلبها التطبيق", '<div class="perms">' + perms.map(function (p) {
        return '<div class="perm">' + ic(permIcon(p.name)) + "<div><b>" + esc(p.name) + "</b>" + (p.why ? "<span>" + esc(p.why) + "</span>" : "") + "</div></div>";
      }).join("") + "</div>");
    }

    var links = "";
    if (a.hp) { links += '<a class="linkrow" href="policy.html?id=' + encodeURIComponent(a.id) + '&t=privacy">' + ic("lock") + "<span>سياسة خصوصية " + esc(a.name) + "</span>" + ic("chevron") + "</a>"; }
    if (a.ht) { links += '<a class="linkrow" href="policy.html?id=' + encodeURIComponent(a.id) + '&t=terms">' + ic("file") + "<span>شروط استخدام " + esc(a.name) + "</span>" + ic("chevron") + "</a>"; }
    if (links) { h += section("الخصوصية والشروط", links); }

    var help = '<details><summary>كيف أثبّت التطبيق؟</summary><div class="body">بعد اكتمال التنزيل افتح الملف من إشعار المتصفح أو من مجلد التنزيلات في جوالك، ثم اضغط تثبيت.</div></details>' +
      '<details><summary>ظهرت رسالة تمنع التثبيت</summary><div class="body">اضغط الإعدادات في الرسالة، ثم فعّل السماح بالتثبيت من هذا المصدر للمتصفح الذي نزّلت منه، وارجع واضغط تثبيت.</div></details>' +
      '<details><summary>المتصفح يحذّر من الملف عند التنزيل</summary><div class="body">قد يعرض كروم تنبيهاً بأن هذا النوع من الملفات قد يضر بجهازك. هذا تحذير عام يظهر مع أي ملف تثبيت، فاضغط الاحتفاظ ثم أكمل التنزيل.</div></details>' +
      '<details><summary>ظهر تحذير من حماية جوجل بلاي</summary><div class="body">هذا التطبيق غير منشور في المتجر الرسمي، لذلك قد يظهر تحذير عام مع أي تطبيق من خارج المتجر. اضغط المزيد من التفاصيل ثم التثبيت على أي حال.</div></details>';
    h += section("مساعدة في التثبيت", help);

    var rows = "<tr><td>الناشر</td><td>" + esc(S.name) + "</td></tr>" +
      "<tr><td>الإصدار</td><td>" + esc(a.version || "") + "</td></tr>";
    if (a.size) { rows += "<tr><td>الحجم</td><td>" + esc(R.fmtSize(a.size)) + "</td></tr>"; }
    if (a.updated) { rows += "<tr><td>آخر تحديث</td><td>" + esc(R.fmtDate(a.updated)) + "</td></tr>"; }
    rows += "<tr><td>النظام</td><td>أندرويد</td></tr>";
    h += section("معلومات التطبيق", '<table class="info"><tbody>' + rows + "</tbody></table>");

    if (store) {
      var others = R.listFrom(store.apps, false).filter(function (x) { return x.id !== a.id; });
      if (others.length) {
        h += section("تطبيقات أخرى", '<div class="mini-grid">' + others.map(function (o) {
          return '<a class="mini" href="app.html?id=' + encodeURIComponent(o.id) + '"><div class="app-icon" style="background:' + R.safeColor(o.color) + ";color:" + R.onColor(R.safeColor(o.color)) + '">' + (R.safeImg(o.icon) ? '<img src="' + R.safeImg(o.icon) + '" alt="">' : esc(String(o.name || "؟").charAt(0))) + "</div><div><b>" + esc(o.name) + "</b><span>" + esc(o.kicker) + "</span></div></a>";
        }).join("") + "</div>");
      }
    }

    if (wa()) {
      h += '<div class="wrap sec-pad" data-reveal><a class="btn btn-navy" style="width:100%" data-wa data-msg="' + esc("مرحباً، عندي استفسار عن تطبيق " + a.name) + '">' + ic("whatsapp") + "عندك سؤال؟ راسلنا على واتساب</a></div>";
    }
    h += '<div class="page-end"></div>';
    main.innerHTML = h;
    layout();
    initReveal(main);
    initCounters(main);
  }

  /* ---------- معرض اللقطات ---------- */
  function initGallery(n) {
    var tr = $("galTrack"), cnt = $("galCount"), dots = $("galDots");
    if (!tr) { return; }
    var frames = tr.querySelectorAll(".frame");
    function update() {
      var c = tr.getBoundingClientRect(), mid = c.left + c.width / 2, best = 0, bd = 1e9;
      Array.prototype.forEach.call(frames, function (f, i) {
        var r = f.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bd) { bd = d; best = i; }
      });
      cnt.textContent = (best + 1) + " / " + n;
      Array.prototype.forEach.call(dots.children, function (dt, i) { dt.classList.toggle("on", i === best); });
    }
    var tick = false;
    tr.addEventListener("scroll", function () {
      if (tick) { return; }
      tick = true;
      requestAnimationFrame(function () { tick = false; update(); });
    }, { passive: true });
    dots.addEventListener("click", function (e) {
      var d = e.target.closest ? e.target.closest("[data-i]") : null;
      if (!d) { return; }
      var f = frames[Number(d.getAttribute("data-i"))];
      if (f && f.scrollIntoView) { f.scrollIntoView({ inline: "center", block: "nearest", behavior: RM ? "auto" : "smooth" }); }
    });
    update();
  }

  function loadShots(a) {
    var box = $("shotsBox");
    if (!box) { return; }
    var slow = setTimeout(function () {
      var w = box.querySelector(".shots-wait");
      if (w) { w.textContent = "الاتصال بطيء، الصور في الطريق…"; }
    }, 8000);
    var key = "rt_shots_" + a.id + "_" + (a.updated || 0), cached = null;
    try { cached = JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { cached = null; }
    var p = cached ? Promise.resolve(cached) : R.dbGet("store/shots/" + a.id);
    p.then(function (arr) {
      clearTimeout(slow);
      var good = (Array.isArray(arr) ? arr : []).map(R.safeImg).filter(Boolean);
      if (!good.length) {
        var sec = box.parentNode;
        if (sec && sec.parentNode) { sec.parentNode.removeChild(sec); }
        return;
      }
      if (!cached) {
        try {
          for (var i = localStorage.length - 1; i >= 0; i--) {
            var k = localStorage.key(i);
            if (k && k.indexOf("rt_shots_" + a.id + "_") === 0) { localStorage.removeItem(k); }
          }
          localStorage.setItem(key, JSON.stringify(good));
        } catch (e) { /* ignore */ }
      }
      current._shots = good;
      var n = good.length;
      box.innerHTML = '<div class="gal">' + (n > 1 ? '<span class="gal-count" id="galCount" dir="ltr">1 / ' + n + "</span>" : '<span id="galCount" hidden></span>') +
        '<div class="gal-track" id="galTrack">' + good.map(function (s, i) {
          return '<button class="frame" type="button" data-shot="' + i + '" aria-label="تكبير الصورة ' + (i + 1) + '"><img src="' + s + '" alt="لقطة ' + (i + 1) + " من تطبيق " + esc(a.name) + '"></button>';
        }).join("") + "</div>" +
        '<div class="dots" id="galDots"' + (n > 1 ? "" : " hidden") + ">" + good.map(function (s, i) { return '<i data-i="' + i + '"' + (i === 0 ? ' class="on"' : "") + "></i>"; }).join("") + "</div></div>";
      initGallery(n);
    }).catch(function () {
      clearTimeout(slow);
      box.innerHTML = '<div class="shots-wait">تعذّر تحميل الصور. أعد تحميل الصفحة.</div>';
    });
  }

  /* ---------- صفحة سياسة التطبيق ---------- */
  function policyPage() {
    var main = $("main");
    var id = R.safeId(param("id"));
    var type = param("t") === "terms" ? "terms" : "privacy";
    if (!id) { notFound(main); return; }
    main.innerHTML = '<div class="wrap prose"><div class="loading">جارٍ التحميل…</div></div>';
    Promise.all([R.dbGet("store/apps/" + id), R.dbGet("store/policy/" + id)]).then(function (r) {
      var a = r[0], p = r[1] || {};
      if (!a || typeof a !== "object") { notFound(main); return; }
      var text = type === "terms" ? p.terms : p.privacy;
      var title = (type === "terms" ? "شروط استخدام " : "سياسة خصوصية ") + a.name;
      document.title = title + " | " + S.name;
      var other = type === "terms" ? "privacy" : "terms";
      var otherOk = type === "terms" ? a.hp : a.ht;
      main.innerHTML = '<div class="wrap prose"><a class="back" style="color:var(--blue);padding:0 0 8px" href="app.html?id=' + encodeURIComponent(id) + '">' + ic("back") + "العودة إلى صفحة " + esc(a.name) + "</a>" +
        "<h1>" + esc(title) + "</h1>" +
        (a.updated ? '<p class="updated">آخر تحديث: ' + esc(R.fmtDate(a.updated)) + "</p>" : "") +
        (text ? R.renderDoc(text) : "<p>لم يُنشر هذا النص بعد.</p>") +
        (otherOk ? '<p><a href="policy.html?id=' + encodeURIComponent(id) + "&t=" + other + '">' + (other === "terms" ? "شروط الاستخدام" : "سياسة الخصوصية") + " الخاصة بهذا التطبيق</a></p>" : "") + "</div>";
    }).catch(function () {
      main.innerHTML = '<div class="wrap prose"><h1>تعذّر تحميل الصفحة</h1><p>تحقق من اتصالك بالإنترنت ثم أعد المحاولة.</p></div>';
    });
  }

  /* ---------- قائمة سياسات التطبيقات داخل صفحتي الخصوصية والشروط العامتين ---------- */
  function policyList() {
    var box = $("appPolicies");
    if (!box) { return; }
    var type = box.getAttribute("data-type") === "terms" ? "terms" : "privacy";
    R.loadStore().then(function (d) {
      var list = R.listFrom(d.apps, false).filter(function (a) { return type === "terms" ? a.ht : a.hp; });
      if (!list.length) { box.innerHTML = "<p>لم تُنشر تطبيقات بعد.</p>"; return; }
      box.innerHTML = "<ul>" + list.map(function (a) {
        return '<li><a href="policy.html?id=' + encodeURIComponent(a.id) + "&t=" + type + '">' + esc(a.name) + "</a></li>";
      }).join("") + "</ul>";
    }).catch(function () { box.innerHTML = ""; });
  }

  /* ---------- الأحداث ---------- */
  function openShot(i) {
    var lb = $("lightbox");
    if (!lb || !current || !current._shots || !current._shots[i]) { return; }
    lb.querySelector("img").src = current._shots[i];
    lb.classList.add("open");
  }
  function closeShot() {
    var lb = $("lightbox");
    if (lb) { lb.classList.remove("open"); }
  }
  function share() {
    if (!current) { return; }
    var data = { title: current.name + " | " + S.name, text: current.summary || "", url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); }
    else if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(location.href).then(function () { toast("تم نسخ الرابط"); }); }
    else { toast(location.href); }
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t.closest) { return; }
    var dl = t.closest("a[data-dl]");
    if (dl) {
      R.countDownload(dl.getAttribute("data-dl"), dl.getAttribute("data-ver"));
      toast("بدأ التنزيل. افتح الملف بعد اكتماله لتثبيته.");
      animateDl(dl);
    }
    if (t.closest("#shareBtn")) { share(); }
    if (t.closest("#retryBtn")) { home(); }
    var sh = t.closest("[data-shot]");
    if (sh) { openShot(Number(sh.getAttribute("data-shot"))); }
    if (t.closest("#lightbox")) { closeShot(); }
    var mb = t.closest("#menuBtn"), nav = $("nav");
    if (mb && nav) {
      var open = nav.classList.toggle("open");
      mb.setAttribute("aria-expanded", open ? "true" : "false");
    } else if (nav && t.closest("#nav a")) {
      nav.classList.remove("open");
      var b = $("menuBtn"); if (b) { b.setAttribute("aria-expanded", "false"); }
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeShot(); } });

  /* ---------- التشغيل ---------- */
  var page = document.body.getAttribute("data-page");
  layout();
  if (page === "home") { home(); initReveal(document); }
  else if (page === "app") { appPage(); }
  else if (page === "about") { aboutPage(); }
  else if (page === "policy") { policyPage(); }
  else { policyList(); }
})();
