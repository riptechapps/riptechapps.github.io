(function () {
  "use strict";

  var R = window.RT, FB = window.FIREBASE || {}, S = window.SITE || {};
  var esc = R.esc, ic = R.ic, DB = R.DB;
  var root = document.getElementById("adm");
  document.documentElement.style.scrollBehavior = "auto";

  var auth = { idToken: "", refresh: "", exp: 0 };
  var state = { list: [], counts: {}, form: null, busy: false };
  var ICON_NAMES = { shield: "حماية", lock: "قفل", bell: "تنبيه", moon: "وضع ليلي", chart: "إحصاءات", wifi: "واي فاي", user: "مستخدم", file: "ملف", search: "بحث", refresh: "تحديث", clock: "وقت", download: "تنزيل", bolt: "سرعة", phone: "جوال", wallet: "محفظة", globe: "شبكة", settings: "إعدادات", check: "صح", chat: "محادثة", image: "صورة" };
  var COLORS = ["#1565C0", "#B26A00", "#1B8A4B", "#8E3FB0", "#C62828", "#00838F", "#37474F"];

  var PRIVACY_TEMPLATE = "# ما نجمعه\n[اكتب هنا ما يجمعه التطبيق من بيانات، أو اكتب: لا يجمع هذا التطبيق أي بيانات شخصية.]\n\n# ما لا نجمعه\n- [مثال: جهات الاتصال]\n- [مثال: الموقع]\n\n# الأذونات التي يطلبها التطبيق\n- [اسم الإذن]: [سبب طلبه]\n\n# مدة الاحتفاظ بالبيانات\n[اكتب المدة وكيف تُحذف البيانات]\n\n# التواصل\n[اكتب طريقة التواصل لطلب حذف البيانات أو السؤال عنها]";
  var TERMS_TEMPLATE = "# الاستخدام\n[اكتب هنا كيف يجوز استخدام التطبيق]\n\n# ما لا يجوز\n- [مثال: نسخ التطبيق أو إعادة بيعه]\n\n# الضمان والمسؤولية\n[اكتب حدود مسؤوليتك عن التطبيق]\n\n# التواصل\n[اكتب طريقة التواصل]";

  /* ========== أدوات عامة ========== */
  function $(id) { return document.getElementById(id); }
  function apiKey() {
    var k = FB.apiKey || "";
    if (!k) { try { k = localStorage.getItem("rt_apikey") || ""; } catch (e) { k = ""; } }
    return k;
  }
  function authError(j) {
    var m = (j && j.error && j.error.message) || "";
    if (/EMAIL_NOT_FOUND|INVALID_PASSWORD|INVALID_LOGIN_CREDENTIALS/.test(m)) { return "البريد أو كلمة السر غير صحيحة."; }
    if (/TOO_MANY_ATTEMPTS/.test(m)) { return "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة."; }
    if (/OPERATION_NOT_ALLOWED/.test(m)) { return "تسجيل الدخول بالبريد غير مفعّل في فاير بيس. فعّله من قسم Authentication ثم Sign-in method."; }
    if (/API key|API_KEY/i.test(m)) { return "مفتاح الواجهة غير صحيح. تأكد من نسخه كاملاً."; }
    if (/USER_DISABLED/.test(m)) { return "هذا الحساب معطّل."; }
    return "تعذّر تسجيل الدخول (" + (m || "خطأ غير معروف") + ").";
  }
  function setBusy(b) { state.busy = b; Array.prototype.forEach.call(document.querySelectorAll("[data-busy]"), function (n) { n.disabled = b; n.style.opacity = b ? ".6" : ""; }); }
  var msgTimer = null;
  function msg(kind, text) {
    var m = $("msg");
    if (!m) { return; }
    clearTimeout(msgTimer);
    m.innerHTML = text ? '<div class="msg ' + kind + '">' + esc(text) + "</div>" : "";
    if (text && kind !== "err") { msgTimer = setTimeout(function () { m.innerHTML = ""; }, 5000); }
  }

  /* ========== الدخول ========== */
  function storeSession(refresh, remember) {
    try {
      sessionStorage.removeItem("rt_refresh"); localStorage.removeItem("rt_refresh");
      (remember ? localStorage : sessionStorage).setItem("rt_refresh", refresh);
    } catch (e) { /* ignore */ }
  }
  function readSession() {
    try { return sessionStorage.getItem("rt_refresh") || localStorage.getItem("rt_refresh") || ""; } catch (e) { return ""; }
  }
  function clearSession() { try { sessionStorage.removeItem("rt_refresh"); localStorage.removeItem("rt_refresh"); } catch (e) { /* ignore */ } auth = { idToken: "", refresh: "", exp: 0 }; }

  function signIn(email, pass, remember) {
    return fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + encodeURIComponent(apiKey()), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: pass, returnSecureToken: true })
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) { throw new Error(authError(j)); }
        auth = { idToken: j.idToken, refresh: j.refreshToken, exp: Date.now() + (Number(j.expiresIn) || 3600) * 1000 };
        storeSession(j.refreshToken, remember);
      });
    });
  }
  function refreshToken() {
    return fetch("https://securetoken.googleapis.com/v1/token?key=" + encodeURIComponent(apiKey()), {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(auth.refresh)
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) { throw new Error("انتهت الجلسة. سجّل الدخول من جديد."); }
        auth = { idToken: j.id_token, refresh: j.refresh_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
        var inLocal = false; try { inLocal = !!localStorage.getItem("rt_refresh"); } catch (e) { /* ignore */ }
        storeSession(j.refresh_token, inLocal);
      });
    });
  }
  function token() {
    if (auth.idToken && Date.now() < auth.exp - 60000) { return Promise.resolve(auth.idToken); }
    if (!auth.refresh) { return Promise.reject(new Error("سجّل الدخول أولاً.")); }
    return refreshToken().then(function () { return auth.idToken; });
  }

  /* ========== الكتابة في قاعدة البيانات ========== */
  function permissionMsg() {
    return "رفض الخادم الكتابة. تأكد أنك أضفت قواعد المتجر في فاير بيس وأن رقم حسابك (UID) كُتب فيها بشكل صحيح.";
  }
  function dbWrite(method, path, body) {
    return token().then(function (t) {
      return fetch(DB + "/" + path + ".json?auth=" + encodeURIComponent(t), { method: method, body: body === undefined ? undefined : JSON.stringify(body) });
    }).then(function (r) {
      if (r.status === 401 || r.status === 403) { throw new Error(permissionMsg()); }
      if (!r.ok) { throw new Error("تعذّر الحفظ (رمز " + r.status + ")."); }
      return r;
    });
  }
  function multiUpdate(map) {
    return dbWrite("PATCH", "store", map).catch(function () {
      return Object.keys(map).reduce(function (p, k) {
        return p.then(function () { return map[k] === null ? dbWrite("DELETE", "store/" + k) : dbWrite("PUT", "store/" + k, map[k]); });
      }, Promise.resolve());
    });
  }

  /* ========== معالجة الصور ========== */
  function fileToImage(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onerror = function () { rej(new Error("تعذّر قراءة الصورة. اختر صورة بصيغة عادية.")); };
      fr.onload = function () {
        var img = new Image();
        img.onload = function () { res(img); };
        img.onerror = function () { rej(new Error("تعذّر قراءة الصورة. اختر صورة بصيغة عادية.")); };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function makeIcon(file) {
    return fileToImage(file).then(function (img) {
      var side = Math.min(img.width, img.height), out = 160;
      var c = document.createElement("canvas"); c.width = out; c.height = out;
      var g = c.getContext("2d");
      g.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, out, out);
      var d = c.toDataURL("image/webp", 0.88);
      if (d.indexOf("data:image/webp") !== 0) { d = c.toDataURL("image/png"); }
      return d;
    });
  }
  function makeShot(file) {
    return fileToImage(file).then(function (img) {
      var w = img.width, h = img.height, k = Math.min(1, 400 / w, 900 / h);
      w = Math.round(w * k); h = Math.round(h * k);
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
      var type = "image/webp", q = 0.72, d = c.toDataURL(type, q);
      if (d.indexOf("data:image/webp") !== 0) { type = "image/jpeg"; d = c.toDataURL(type, q); }
      while (d.length > 90000 && q > 0.4) { q -= 0.08; d = c.toDataURL(type, q); }
      return d;
    });
  }

  /* ========== حجم الملف من جيت هب ========== */
  function githubSize(url) {
    var m = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/releases\/download\/([^\/]+)\/([^?#]+)$/.exec(url || "");
    if (!m) { return Promise.reject(new Error("الرابط ليس رابط إصدار من جيت هب، اكتب الحجم يدوياً.")); }
    var file = decodeURIComponent(m[4]);
    return fetch("https://api.github.com/repos/" + m[1] + "/" + m[2] + "/releases/tags/" + encodeURIComponent(decodeURIComponent(m[3]))).then(function (r) {
      if (!r.ok) { throw new Error("تعذّر الوصول لبيانات الإصدار (رمز " + r.status + "). تأكد أن المستودع عام، أو اكتب الحجم يدوياً."); }
      return r.json();
    }).then(function (j) {
      var found = (j.assets || []).filter(function (a) { return a.name === file; })[0];
      if (!found) { throw new Error("لم أجد الملف داخل الإصدار. تأكد من الرابط، أو اكتب الحجم يدوياً."); }
      return found.size;
    });
  }

  /* ========== الشاشات ========== */
  function topbar(showOut) {
    return '<div class="top"><h1>إدارة المتجر</h1>' + (showOut ? '<button class="linkbtn" type="button" data-act="logout">' + ic("logout") + "خروج</button>" : "") + "</div>";
  }

  function viewLogin(err) {
    var needKey = !apiKey();
    root.innerHTML = topbar(false) + '<main><div class="panel"><h2>تسجيل الدخول</h2><div id="msg">' + (err ? '<div class="msg err">' + esc(err) + "</div>" : "") + "</div>" +
      (needKey ? '<label for="l-key">مفتاح الواجهة (Web API Key)</label><input id="l-key" type="text" dir="ltr" autocomplete="off"><div class="hint">الصق المفتاح، أو الصق كل كود إعداد فاير بيس وسأستخرج المفتاح منه. يُحفظ في جوالك فقط.</div>' : "") +
      '<label for="l-mail">البريد الإلكتروني</label><input id="l-mail" type="email" dir="ltr" autocomplete="username">' +
      '<label for="l-pass">كلمة السر</label><input id="l-pass" type="password" dir="ltr" autocomplete="current-password">' +
      '<label class="chk"><input id="l-keep" type="checkbox"> ابقَ مسجلاً في هذا الجوال</label>' +
      '<div style="margin-top:14px"><button class="btn btn-gold" style="width:100%" type="button" data-act="login" data-busy>دخول</button></div></div></main>';
  }

  function viewList() {
    var n = state.list.length, hidden = state.list.filter(function (a) { return a.hidden; }).length;
    var items = state.list.map(function (a) {
      var img = R.safeImg(a.icon);
      return '<div class="item"><div class="thumb">' + (img ? '<img src="' + img + '" alt="">' : ic("image")) + "</div>" +
        '<div class="t"><b>' + esc(a.name) + (a.hidden ? '<span class="badge-h">مخفي</span>' : "") + "</b><small>الإصدار " + esc(a.version || "") + " · " + esc(String(Number(state.counts[a.id]) || 0)) + " تحميل</small></div>" +
        '<div class="acts"><button class="btn btn-dark sm" type="button" data-act="edit" data-id="' + esc(a.id) + '">' + ic("edit") + "تعديل</button>" +
        '<button class="btn btn-dark sm" type="button" data-act="toggle" data-id="' + esc(a.id) + '" aria-label="' + (a.hidden ? "إظهار" : "إخفاء") + '">' + ic(a.hidden ? "eye" : "eyeoff") + "</button>" +
        '<button class="btn btn-red sm" type="button" data-act="delete" data-id="' + esc(a.id) + '" aria-label="حذف">' + ic("trash") + "</button></div></div>";
    }).join("");
    root.innerHTML = topbar(true) + '<main><div id="msg"></div><div class="stat"><div><small>المنشورة</small><b>' + (n - hidden) + "</b></div><div><small>المخفية</small><b>" + hidden + "</b></div></div>" +
      '<div class="panel"><h2>التطبيقات</h2><div class="applist">' + (items || '<div class="hint">لا توجد تطبيقات بعد. أضف أول تطبيق.</div>') + "</div></div>" +
      '<button class="btn btn-gold" style="width:100%" type="button" data-act="new">' + ic("plus") + "إضافة تطبيق جديد</button>" +
      '<p class="hint" style="margin-top:14px"><a href="index.html" target="_blank" rel="noopener">فتح الموقع في صفحة جديدة</a></p></main>';
  }

  function emptyForm() {
    return {
      id: "", isNew: true, name: "", kicker: "", summary: "", about: "", features: [{ icon: "shield", title: "", text: "" }],
      version: "1.0", color: "#1565C0", icon: "", shots: [], apk: "", sizeMB: "", order: "", hidden: false, privacy: "", terms: "", created: Date.now()
    };
  }

  function viewForm() {
    var f = state.form;
    var sw = COLORS.map(function (c) { return '<button type="button" class="sw' + (f.color.toLowerCase() === c.toLowerCase() ? " on" : "") + '" style="background:' + c + '" data-act="color" data-c="' + c + '" aria-label="لون ' + c + '"></button>'; }).join("");
    root.innerHTML = topbar(true) + '<main><div id="msg"></div>' +
      '<div class="panel"><h2>' + (f.isNew ? "إضافة تطبيق جديد" : "تعديل التطبيق") + "</h2>" +
      '<label for="f-name">اسم التطبيق *</label><input id="f-name" type="text" value="' + esc(f.name) + '" maxlength="40">' +
      '<label for="f-kicker">سطر تعريفي قصير</label><input id="f-kicker" type="text" value="' + esc(f.kicker) + '" maxlength="60"><div class="hint">يظهر تحت الاسم، مثال: جدار حماية للإنترنت</div>' +
      '<label for="f-summary">وصف مختصر للبطاقة *</label><textarea id="f-summary" maxlength="220">' + esc(f.summary) + "</textarea>" +
      '<div class="row2"><div><label for="f-version">الإصدار *</label><input id="f-version" type="text" dir="ltr" value="' + esc(f.version) + '" maxlength="12"></div>' +
      '<div><label for="f-order">رقم الترتيب (اختياري)</label><input id="f-order" type="number" dir="ltr" value="' + esc(f.order) + '"></div></div><div class="hint">اتركه فارغاً ليظهر التطبيق الأحدث أولاً. وإن كتبت رقماً فالأصغر يظهر أولاً.</div>' +
      '<label>لون التطبيق</label><div class="swatches">' + sw + '<input id="f-color" type="color" value="' + esc(f.color) + '" aria-label="لون مخصص"></div></div>' +

      '<div class="panel"><h2>الأيقونة والصور *</h2><label for="f-icon">أيقونة التطبيق (مربعة، تُقصّ تلقائياً)</label>' +
      '<div class="iconprev" id="iconprev">' + (R.safeImg(f.icon) ? '<img src="' + R.safeImg(f.icon) + '" alt="">' : ic("image")) + '</div><input id="f-icon" type="file" accept="image/*">' +
      '<label for="f-shots">لقطات من التطبيق (حتى 6)</label><div class="shotsgrid" id="shotsgrid"></div><input id="f-shots" type="file" accept="image/*" multiple>' +
      '<div class="hint">تُصغَّر الصور تلقائياً قبل الحفظ.</div></div>' +

      '<div class="panel"><h2>التنزيل *</h2><label for="f-apk">رابط ملف التثبيت (من صفحة الإصدارات في جيت هب)</label><input id="f-apk" type="url" dir="ltr" value="' + esc(f.apk) + '" placeholder="https://github.com/...">' +
      '<label for="f-size">حجم الملف بالميجابايت</label><div class="row2"><input id="f-size" type="number" step="0.0001" dir="ltr" value="' + esc(f.sizeMB) + '"><button class="btn btn-dark sm" style="flex:none;min-height:44px" type="button" data-act="fetchsize" data-busy>' + ic("refresh") + "جلب تلقائي</button></div>" +
      '<div class="hint">الجلب التلقائي يعمل مع روابط جيت هب. وإن فشل اكتب الحجم بيدك.</div></div>' +

      '<div class="panel"><h2>التفاصيل</h2><label for="f-about">عن التطبيق (اترك سطراً فارغاً بين الفقرات)</label><textarea id="f-about" style="min-height:130px">' + esc(f.about) + "</textarea>" +
      '<label>المميزات</label><div id="featlist"></div><button class="btn btn-dark sm" type="button" data-act="addfeat">' + ic("plus") + "إضافة ميزة</button></div>" +

      '<div class="panel"><h2>الخصوصية والشروط</h2><label for="f-privacy">سياسة الخصوصية لهذا التطبيق *</label><textarea id="f-privacy" style="min-height:150px">' + esc(f.privacy) + "</textarea>" +
      '<button class="btn btn-dark sm" type="button" data-act="tpl-privacy" style="margin-top:6px">ملء قالب جاهز</button>' +
      '<div class="hint">سطر يبدأ بـ # يصبح عنواناً، وسطر يبدأ بـ - يصبح نقطة. عدّل القالب ليطابق تطبيقك فعلاً.</div>' +
      '<label for="f-terms">شروط الاستخدام لهذا التطبيق (اختياري)</label><textarea id="f-terms" style="min-height:110px">' + esc(f.terms) + "</textarea>" +
      '<button class="btn btn-dark sm" type="button" data-act="tpl-terms" style="margin-top:6px">ملء قالب جاهز</button>' +
      '<label class="chk"><input id="f-hidden" type="checkbox"' + (f.hidden ? " checked" : "") + "> إخفاء التطبيق عن الزوار</label></div>" +

      '<div class="savebar"><button class="btn btn-gold" type="button" data-act="save" data-busy>حفظ ونشر الآن</button><button class="btn btn-dark" type="button" data-act="cancel">إلغاء</button></div></main>';
    renderShots();
    renderFeats();
  }

  function setColor(c) {
    state.form.color = c;
    var inp = $("f-color");
    if (inp) { inp.value = c; }
    Array.prototype.forEach.call(document.querySelectorAll(".sw"), function (n) {
      n.classList.toggle("on", String(n.getAttribute("data-c")).toLowerCase() === String(c).toLowerCase());
    });
  }

  function renderShots() {
    var g = $("shotsgrid"); if (!g) { return; }
    g.innerHTML = state.form.shots.map(function (s, i) {
      return '<div class="sh"><img src="' + R.safeImg(s) + '" alt="لقطة ' + (i + 1) + '"><button type="button" data-act="rmshot" data-i="' + i + '" aria-label="حذف اللقطة">' + ic("x") + "</button></div>";
    }).join("");
  }
  function renderFeats() {
    var box = $("featlist"); if (!box) { return; }
    box.innerHTML = state.form.features.map(function (f, i) {
      var opts = R.FEATURE_ICONS.map(function (n) { return '<option value="' + n + '"' + (n === f.icon ? " selected" : "") + ">" + (ICON_NAMES[n] || n) + "</option>"; }).join("");
      return '<div class="frow"><div class="row2"><select data-fi="' + i + '" data-k="icon" aria-label="أيقونة الميزة" style="max-width:120px;flex:none">' + opts + '</select>' +
        '<input type="text" data-fi="' + i + '" data-k="title" value="' + esc(f.title) + '" placeholder="عنوان الميزة" maxlength="40"></div>' +
        '<input type="text" data-fi="' + i + '" data-k="text" value="' + esc(f.text) + '" placeholder="وصف قصير" maxlength="120">' +
        '<button class="btn btn-red sm" type="button" style="margin-top:6px" data-act="rmfeat" data-i="' + i + '">' + ic("trash") + "حذف الميزة</button></div>";
    }).join("");
  }

  /* ========== قراءة وجمع بيانات النموذج ========== */
  function collect() {
    var f = state.form;
    f.name = $("f-name").value.trim(); f.kicker = $("f-kicker").value.trim(); f.summary = $("f-summary").value.trim();
    f.version = $("f-version").value.trim(); f.order = $("f-order").value.trim() === "" ? "" : Number($("f-order").value);
    f.color = $("f-color").value; f.apk = $("f-apk").value.trim(); f.sizeMB = $("f-size").value.trim();
    f.about = $("f-about").value; f.privacy = $("f-privacy").value; f.terms = $("f-terms").value; f.hidden = $("f-hidden").checked;
  }

  function loadList() {
    return Promise.all([R.dbGet("store/apps"), R.dbGet("store/downloads")]).then(function (r) {
      state.list = R.listFrom(r[0] || {}, true); state.counts = r[1] || {};
    });
  }

  function openEdit(id) {
    setBusy(true); msg("info", "جارٍ تحميل التطبيق…");
    Promise.all([R.dbGet("store/apps/" + id), R.dbGet("store/detail/" + id), R.dbGet("store/shots/" + id), R.dbGet("store/policy/" + id)]).then(function (r) {
      var a = r[0] || {}, d = r[1] || {}, p = r[3] || {};
      state.form = {
        id: id, isNew: false, name: a.name || "", kicker: a.kicker || "", summary: a.summary || "",
        about: (Array.isArray(d.about) ? d.about : []).join("\n\n"),
        features: (Array.isArray(d.features) && d.features.length) ? d.features.map(function (f) { return { icon: f.icon || "check", title: f.title || "", text: f.text || "" }; }) : [{ icon: "shield", title: "", text: "" }],
        version: a.version || "", color: R.safeColor(a.color), icon: a.icon || "", shots: Array.isArray(r[2]) ? r[2] : [],
        apk: a.apk || "", sizeMB: a.size ? (a.size / 1048576).toFixed(4) : "", sizeBytes: a.size || 0, order: (a.order == null || Number(a.order) <= -1000000) ? "" : Number(a.order), autoOrder: a.order, hidden: !!a.hidden,
        privacy: p.privacy || "", terms: p.terms || "", created: a.created || Date.now()
      };
      setBusy(false); viewForm();
    }).catch(function () { setBusy(false); msg("err", "تعذّر تحميل التطبيق. أعد المحاولة."); });
  }

  function validate(f) {
    if (!f.name) { return "اكتب اسم التطبيق."; }
    if (!f.summary) { return "اكتب الوصف المختصر."; }
    if (!f.version) { return "اكتب رقم الإصدار."; }
    if (!R.safeUrl(f.apk)) { return "رابط التنزيل يجب أن يبدأ بـ https://"; }
    if (!R.safeImg(f.icon)) { return "اختر أيقونة التطبيق."; }
    if (!f.privacy.trim()) { return "اكتب سياسة الخصوصية لهذا التطبيق."; }
    if (/\[[^\]\n]*\]/.test(f.privacy) || /\[[^\]\n]*\]/.test(f.terms)) { return "ما زالت في نص الخصوصية أو الشروط أقواس مربعة [ ] من القالب. استبدلها بمعلومات تطبيقك أو احذفها."; }
    if (!(Number(f.sizeMB) > 0)) { return "حجم الملف ناقص. اضغط جلب تلقائي أو اكتبه بيدك."; }
    return "";
  }

  function save() {
    collect();
    var f = state.form;
    var run = function () {
      var err = validate(f);
      if (err) { msg("err", err); return Promise.resolve(); }
      if (!f.shots.length && !window.confirm("لم تضف أي لقطة من التطبيق. سيظهر بدونها. هل تريد المتابعة؟")) { return Promise.resolve(); }
      var id = f.id || ("a" + Date.now().toString(36));
      var feats = f.features.filter(function (x) { return x.title.trim(); }).map(function (x) { return { icon: x.icon, title: x.title.trim(), text: x.text.trim() }; });
      var about = f.about.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
      var map = {};
      map["apps/" + id] = {
        name: f.name, kicker: f.kicker, summary: f.summary, version: f.version, color: f.color, icon: f.icon,
        apk: f.apk, size: (f.sizeBytes && Math.abs(f.sizeBytes / 1048576 - Number(f.sizeMB)) < 0.0005) ? f.sizeBytes : Math.round(Number(f.sizeMB) * 1048576), order: (f.order === "" ? (f.autoOrder != null && Number(f.autoOrder) <= -1000000 ? f.autoOrder : -Math.floor(Date.now() / 1000)) : f.order), hidden: !!f.hidden,
        hp: !!f.privacy.trim(), ht: !!f.terms.trim(), ns: f.shots.length, created: f.created, updated: Date.now()
      };
      map["detail/" + id] = { about: about, features: feats };
      map["shots/" + id] = f.shots.length ? f.shots : null;
      map["policy/" + id] = { privacy: f.privacy.trim(), terms: f.terms.trim() };
      setBusy(true); msg("info", "جارٍ الحفظ…");
      return multiUpdate(map).then(function () { return loadList(); }).then(function () {
        setBusy(false); viewList();
        msg("ok", "تم الحفظ. التطبيق ظاهر الآن في الموقع.");
      });
    };
    var pre = Promise.resolve();
    if (!(Number(f.sizeMB) > 0) && R.safeUrl(f.apk)) {
      pre = githubSize(f.apk).then(function (b) { f.sizeBytes = b; f.sizeMB = (b / 1048576).toFixed(4); }).catch(function () { /* يُطلب الحجم يدوياً */ });
    }
    pre.then(run).catch(function (e) { setBusy(false); msg("err", e.message || "تعذّر الحفظ."); });
  }

  function remove(id) {
    var a = state.list.filter(function (x) { return x.id === id; })[0];
    if (!a || !window.confirm("حذف " + a.name + " نهائياً مع صوره وسياسته وعدد تحميلاته؟")) { return; }
    var map = {}; ["apps", "detail", "shots", "policy", "downloads"].forEach(function (k) { map[k + "/" + id] = null; });
    setBusy(true);
    multiUpdate(map).then(loadList).then(function () { setBusy(false); viewList(); msg("ok", "تم حذف التطبيق."); })
      .catch(function (e) { setBusy(false); msg("err", e.message); });
  }
  function toggle(id) {
    var a = state.list.filter(function (x) { return x.id === id; })[0]; if (!a) { return; }
    setBusy(true);
    dbWrite("PUT", "store/apps/" + id + "/hidden", !a.hidden).then(loadList).then(function () { setBusy(false); viewList(); })
      .catch(function (e) { setBusy(false); msg("err", e.message); });
  }

  function login() {
    var raw = $("l-key") ? $("l-key").value : "";
    var found = /AIza[0-9A-Za-z_\-]{30,}/.exec(raw);
    var key = found ? found[0] : raw.trim();
    if (key) { try { localStorage.setItem("rt_apikey", key); } catch (e) { /* ignore */ } }
    if (!apiKey()) { msg("err", "اكتب مفتاح الواجهة أولاً."); return; }
    var mail = $("l-mail").value.trim(), pass = $("l-pass").value;
    if (!mail || !pass) { msg("err", "اكتب البريد وكلمة السر."); return; }
    setBusy(true); msg("info", "جارٍ تسجيل الدخول…");
    signIn(mail, pass, $("l-keep").checked).then(enter).catch(function (e) { setBusy(false); msg("err", e.message || "تعذّر تسجيل الدخول."); });
  }
  function enter() {
    return loadList().then(function () { setBusy(false); viewList(); }).catch(function () { setBusy(false); viewList(); msg("err", "تعذّر قراءة قائمة التطبيقات. تحقق من الاتصال."); });
  }

  /* ========== الأحداث ========== */
  root.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#msg .msg")) { msg("", ""); return; }
    var b = e.target.closest ? e.target.closest("[data-act]") : null;
    if (!b || state.busy) { return; }
    var act = b.getAttribute("data-act"), id = b.getAttribute("data-id");
    if (act === "login") { login(); }
    else if (act === "logout") { clearSession(); viewLogin(); }
    else if (act === "new") { state.form = emptyForm(); viewForm(); }
    else if (act === "edit") { openEdit(id); }
    else if (act === "toggle") { toggle(id); }
    else if (act === "delete") { remove(id); }
    else if (act === "cancel") { viewList(); }
    else if (act === "save") { save(); }
    else if (act === "color") { setColor(b.getAttribute("data-c")); }
    else if (act === "addfeat") { collect(); state.form.features.push({ icon: "check", title: "", text: "" }); renderFeats(); }
    else if (act === "rmfeat") { state.form.features.splice(Number(b.getAttribute("data-i")), 1); if (!state.form.features.length) { state.form.features.push({ icon: "check", title: "", text: "" }); } renderFeats(); }
    else if (act === "rmshot") { state.form.shots.splice(Number(b.getAttribute("data-i")), 1); renderShots(); }
    else if (act === "tpl-privacy") { var p = $("f-privacy"); if (!p.value.trim() || window.confirm("استبدال النص الحالي بالقالب؟")) { p.value = PRIVACY_TEMPLATE; } }
    else if (act === "tpl-terms") { var t = $("f-terms"); if (!t.value.trim() || window.confirm("استبدال النص الحالي بالقالب؟")) { t.value = TERMS_TEMPLATE; } }
    else if (act === "fetchsize") {
      collect(); setBusy(true); msg("info", "جارٍ قراءة الحجم من جيت هب…");
      githubSize(state.form.apk).then(function (bytes) { state.form.sizeBytes = bytes; $("f-size").value = (bytes / 1048576).toFixed(4); state.form.sizeMB = $("f-size").value; setBusy(false); msg("ok", "تم جلب الحجم."); })
        .catch(function (err) { setBusy(false); msg("err", err.message); });
    }
  });

  root.addEventListener("input", function (e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute("data-fi") !== null) {
      var row = state.form.features[Number(t.getAttribute("data-fi"))];
      if (row) { row[t.getAttribute("data-k")] = t.value; }
    }
  });
  root.addEventListener("change", function (e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute("data-fi") !== null) {
      var row = state.form.features[Number(t.getAttribute("data-fi"))];
      if (row) { row[t.getAttribute("data-k")] = t.value; }
    } else if (t.id === "f-color") {
      setColor(t.value);
    } else if (t.id === "f-icon" && t.files && t.files[0]) {
      msg("info", "جارٍ تجهيز الأيقونة…");
      makeIcon(t.files[0]).then(function (d) { state.form.icon = d; $("iconprev").innerHTML = '<img src="' + d + '" alt="">'; msg("", ""); })
        .catch(function (err) { msg("err", err.message); });
    } else if (t.id === "f-shots" && t.files && t.files.length) {
      var room = 6 - state.form.shots.length;
      var files = Array.prototype.slice.call(t.files, 0, Math.max(0, room));
      if (!files.length) { msg("err", "وصلت للحد الأقصى: 6 لقطات."); return; }
      msg("info", "جارٍ تجهيز الصور…");
      files.reduce(function (p, f) { return p.then(function () { return makeShot(f).then(function (d) { state.form.shots.push(d); }); }); }, Promise.resolve())
        .then(function () { renderShots(); t.value = ""; msg("", ""); })
        .catch(function (err) { msg("err", err.message); });
    }
  });

  /* ========== التشغيل ========== */
  var saved = readSession();
  if (!DB) {
    root.innerHTML = topbar(false) + '<main><div class="panel"><h2>الإعداد ناقص</h2><div class="msg err">لم يُكتب رابط قاعدة البيانات في ملف config.js. اكتبه في خانة dbUrl ثم أعد رفع الملف.</div></div></main>';
    return;
  }
  if (saved && apiKey()) {
    auth.refresh = saved;
    root.innerHTML = topbar(false) + '<main><div class="loading" style="color:#8E9BB5;text-align:center;padding:40px">جارٍ الدخول…</div></main>';
    refreshToken().then(enter).catch(function () { clearSession(); viewLogin(); });
  } else {
    viewLogin();
  }
})();
