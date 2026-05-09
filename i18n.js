// ═══════════════════════════════════════════════════════════
// i18n.js — Translation loader, manifest, language state, IDB cache
// Exposes window.GoldArkI18n. English data lives in app data files;
// non-English buckets are fetched from the translations CDN.
// ═══════════════════════════════════════════════════════════
(function(){
  var CDN_BASE = 'https://gold-ark-data.hooman-92b.workers.dev/data/islamic/translations';
  var MANIFEST_URL = CDN_BASE + '/manifest.json';
  var DB_NAME = 'gold-ark-translations';
  var STORE = 'buckets';
  var DB_VERSION = 1;
  var TTL = 24 * 60 * 60 * 1000; // 24h
  var BUCKETS = ['figures', 'events', 'books', 'journeys', 'eras', 'ui'];

  // Inline supplement for ui strings the auto-extractor missed (uppercase
  // view IDs, short words filtered as code-like). Used as fallback after
  // ui.json from CDN.
  var UI_FALLBACK = {
    ur: {
      'TIMELINE': 'ٹائم لائن',
      'SILSILA': 'سلسلہ',
      'FOLLOW': 'پیروی',
      'STUDY': 'مطالعہ',
      'BOOKS': 'کتابیں',
      'ERAS': 'ادوار',
      'EVENTS': 'واقعات',
      'THINK': 'سوچ',
      'MAP': 'نقشہ',
      'TALK': 'گفتگو',
      'ONE': 'ایک',
      'MONASTIC': 'موناسٹک',
      'EXPLAIN': 'تفسیر',
      'START': 'آغاز',
      'VISITOR': 'مہمان',
      'TOOLS': 'اوزار',
      '⚙ TOOLS': '⚙ اوزار',
      'HOW TO USE': 'طریقۂ استعمال',
      'Visitor': 'مہمان',
      'Sign In': 'سائن اِن',
      'Sign in': 'سائن اِن',
      'Sign up': 'سائن اَپ',
      'Sign out': 'سائن آؤٹ',
      'Browse as Guest': 'بطور مہمان دیکھیں',
      'Share': 'شیئر',
      'Snapshot': 'اسنیپ شاٹ',
      'Export': 'برآمد',
      'Report a problem': 'مسئلہ رپورٹ کریں',
      'Community forum': 'کمیونٹی فورم',
      'Suggest Correction': 'تصحیح تجویز کریں',
      'Updates': 'تازہ ترین',
      'Close': 'بند کریں',
      'Save': 'محفوظ کریں',
      'Cancel': 'منسوخ',
      'Search': 'تلاش',
      'Search figures': 'شخصیات تلاش کریں',
      'Search figures…': 'شخصیات تلاش کریں…',
      'Search figures...': 'شخصیات تلاش کریں...',
      'TYPE': 'قسم',
      'TRADITION': 'روایت',
      'HAS': 'موجود',
      'WHO WAS ALIVE IN': 'کون زندہ تھا',
      'FOR FOCUS, CLICK ON A PERSON': 'فوکس کے لیے، کسی شخصیت پر کلک کریں',
      'INFORMATION': 'معلومات',
      'PROPHETIC ERA': 'دورِ نبوی',
      'SAVED': 'محفوظ',
      'Everything important to the': 'سب کچھ جو اہم ہے',
      'One': 'ایک',
      'In order.': 'ترتیب میں۔',
      'Fifteen centuries of Monotheism': 'پندرہ صدیوں کا توحید',
      'AI-generated · independently verify': 'اے آئی سے تیار · آزادانہ تصدیق کریں',
      'Language': 'زبان',
      'English': 'انگریزی',
      'BORN': 'پیدائش',
      'DIED': 'وفات',
      'BCE': 'ق.م',
      'CE': 'ع',
      'legendary': 'افسانوی',
      'How This Works': 'یہ کیسے کام کرتا ہے',
      'HOW THIS WORKS': 'یہ کیسے کام کرتا ہے',
      'Important historical events': 'اہم تاریخی واقعات',
      'Show next 100': 'اگلے سو دکھائیں',
      'Browse the book library across themes, eras, and traditions': 'مختلف موضوعات، ادوار اور روایات بھر میں کتابوں کی لائبریری کا جائزہ لیں۔',
      'CATEGORY': 'قسم',
      'CENTURY': 'صدی',
      'Search…': 'تلاش…',
      'Search...': 'تلاش...',

      // Card section labels (shared across views)
      'BIOGRAPHY':'سوانح',
      'TEACHERS':'اساتذہ',
      'STUDENTS':'شاگرد',
      'WORKS & SOURCES':'تصانیف و مآخذ',
      'Sources':'مآخذ',
      'via Wikipedia':'بذریعہ ویکیپیڈیا',
      'Wikipedia ↗':'ویکیپیڈیا ↗',

      // Tooltip count words
      'teacher':'استاد',
      'teachers':'اساتذہ',
      'student':'شاگرد',
      'students':'شاگرد',

      // Filter action labels
      'All Types':'تمام اقسام',
      'All Traditions':'تمام روایات',
      'RESET':'ری سیٹ',
      'SAVED':'محفوظ',
      'SAVED ★':'محفوظ ★',
      'BOOKMARKS':'بک مارکس',
      'Figures':'شخصیات',
      '★ Saved':'★ محفوظ',
      'Reset':'ری سیٹ',
      '★ Saved':'★ محفوظ',
      'Reset':'ری سیٹ',

      // HTW shared headings + terms
      'What You Are Seeing':'آپ کیا دیکھ رہے ہیں',
      'Key Terms':'اہم اصطلاحات',
      'Tradition color':'روایت کا رنگ',
      'Line':'لکیر',
      'Silsila':'سلسلہ',
      'Data & Disclaimers':'ڈیٹا اور وضاحت',

      // Figure types
      'Prophet':'نبی',
      'Companion':'صحابی',
      'Scholar':'عالم',
      'Ruler':'حکمران',
      'Poet':'شاعر',
      'Sufi':'صوفی',
      'Founder':'بانی',
      'Genealogy':'نسب',
      'Sage':'حکیم',
      'Caliph':'خلیفہ',
      'Sahaba':'صحابی',
      'Sahabiyya':'صحابیہ',
      "Tabi'un":'تابعی',
      'Mufassir':'مفسر',
      'Mystic':'عارف',
      'Philosopher':'فلسفی',
      'Reformer':'مصلح',
      'Scientist':'سائنس دان',
      'Traveler':'سیاح',
      'Warrior':'جنگجو',
      'Historian':'مورخ',
      'Jurist':'فقیہ',
      'Vizier of Egypt':'وزیرِ مصر',
      'First Human':'پہلا انسان',
      'Ashra Mubashshara':'عشرہ مبشرہ',

      // Lane / tradition labels
      'Islamic History':'اسلامی تاریخ',
      'Quranic Prophets':'قرآنی انبیاء',
      'Companions':'صحابہ',
      'Companions (Women)':'صحابیات',
      'Followers':'تابعین',
      'Caliphs & Rulers':'خلفاء و حکمران',
      'Early Ascetics':'متقدمین زہّاد',
      'Hadith Sciences':'علم حدیث',
      'Islamic Sciences':'اسلامی علوم',
      'Islamic Jurisprudence':'فقہ اسلامی',
      'Islamic Philosophy':'اسلامی فلسفہ',
      'Islamic Theology':'علم کلام',
      'Khorasan School':'مکتبِ خراسان',
      'Baghdad School':'مکتبِ بغداد',
      'Persian Poetry':'فارسی شاعری',
      'Akbarian':'اکبریہ',
      'Mughal':'مغل',

      // Sufi orders
      'Qadiriyya':'قادریہ',
      'Naqshbandiyya':'نقشبندیہ',
      'Shadhiliyya':'شاذلیہ',
      'Chishti':'چشتیہ',
      'Suhrawardiyya':'سہروردیہ',
      'Mawlawiyya':'مولویہ',
      'Kubrawiyya':'کبرویہ',
      'Yeseviyya':'یسویہ',
      'Qalandari':'قلندریہ',
      'Badawiyya':'بدویہ',
      'Burhaniyya':'برہانیہ',
      'Ishraqiyya':'اشراقیہ',
      'Sindhi/Punjabi Sufism':'سندھی/پنجابی تصوف',
      'Tijaniyya':'تیجانیہ',
      'Bektashiyya':'بکتاشیہ',
      "Ni'matullahi":'نعمت اللہی',
      'Nizari Ismaili':'نزاری اسماعیلی',
      'Tayyibi Ismaili':'طیبی اسماعیلی',
      'Zaydi':'زیدی',
      'Ibadi':'اباضی',
      'Sanusiyya':'سنوسیہ',
      'Sudanese Mahdiyya':'سوڈانی مہدیہ',
      'Ahmadiyya':'احمدیہ',
      'Deobandi':'دیوبندی',
      'Almohad':'موحدی',

      // Languages
      'Arabic':'عربی',
      'Hebrew':'عبرانی',
      'Aramaic':'آرامی',
      'Persian':'فارسی',
      'Greek':'یونانی',
      'Syriac':'سریانی',
      'Turkish':'ترکی',
      'Urdu':'اردو',

      // Cities
      'Mesopotamia':'بین النہرین',
      'Eden':'عدن',
      'Canaan':'کنعان',
      'Egypt':'مصر',
      'Mecca':'مکہ',
      'Medina':'مدینہ',
      'Jerusalem':'القدس',
      'Damascus':'دمشق',
      'Baghdad':'بغداد',
      'Cairo':'قاہرہ',
      'Basra':'بصرہ',
      'Kufa':'کوفہ',
      'Arabian Peninsula':'جزیرہ نمائے عرب',

      // Tooltip help
      'Click node to highlight · Click again for details':'نوڈ کو نمایاں کرنے کے لیے کلک کریں۔ تفصیلات کے لیے دوبارہ کلک کریں۔',

      // Madhabs / fiqh schools
      'Hanafi':'حنفی',
      'Maliki':'مالکی',
      "Shafi'i":'شافعی',
      'Hanbali':'حنبلی',
      'Jafari':'جعفری',
      'Zahiri':'ظاہری',
      'Awzai':'اوزاعی',
      'Thawri':'ثوری',
      'Independent Mujtahid':'آزاد مجتہد',
      'Islamic Law':'فقہ اسلامی',
      'Mughal Literature':'مغل ادب',
      'Muridiyya':'مریدیہ',
      'Nahda':'نہضہ',
      'Ottoman Naval':'عثمانی بحریہ',
      'Ottoman Sciences':'عثمانی علوم',
      'Philosophy':'فلسفہ',
      'Quranic Sciences':'علوم القرآن',
      'Quranic Studies':'مطالعاتِ قرآن',
      "Rifa'iyya":'رفاعیہ',
      'Shia Theology':'شیعہ کلام',
      'Wahhabism':'وہابیت',
      'Sokoto Caliphate':'خلافتِ سوکوٹو',
      'Berber Sufism':'بربر تصوف',
      'West African Sufism':'مغربی افریقی تصوف',
      'East African Sufism':'مشرقی افریقی تصوف',
      'Islamic Reform Movements':'اصلاحی تحریکیں',
      'Modernist Islam':'جدید اسلام',
      'Pan-Islamism':'پان اسلامی تحریک',
      'Tariqa':'طریقہ',
      'Madhhab':'مذہب','Fiqh':'فقہ',
      'Imamate':'امامت','Caliphate':'خلافت',
      'Tafsir':'تفسیر','Hadith':'حدیث',
      'Kalam':'کلام','Falsafa':'فلسفہ',
      'Ismaili Thought':'فکرِ اسماعیلی',
      'Khalwatiyya':'خلوتیہ',
      'Sufi Poetry':'صوفی شاعری',
      'Sufi Studies':'صوفی مطالعات',
      'Sufism':'تصوف',
      'Sunni Reform':'سنی اصلاح',
      'Sunni Theology':'سنی کلام',
      'Turkish Literature':'ترکی ادب',
      'Persian Literature':'فارسی ادب',
      'Islamic Bioethics':'اسلامی حیاتیاتی اخلاقیات',
      'Comparative Religion':'تقابلِ ادیان',

      // Theology / sects / movements
      'Asharite':'اشعری',
      'Maturidi':'ماتریدی',
      'Mutazila':'معتزلہ',
      'Salafi':'سلفی',
      'Wahhabi':'وہابی',
      'Sunni':'سنی',
      'Shia':'شیعہ',
      'Twelver Shia':'اثنا عشری شیعہ',
      'Ismaili':'اسماعیلی',
      'Khariji':'خوارج',
      'Sufi':'صوفی',

      // Regional / cultural traditions
      'Andalusian Sciences':'اندلسی علوم',
      'Arabic Linguistics':'عربی لسانیات',
      'Arabic Literature':'عربی ادب',
      'Arabic Poetry':'عربی شاعری',
      'Islamic Literature':'اسلامی ادب',
      'Islamic Navigation':'اسلامی بحری علم',
      'Islamic Astronomy':'علم فلکیات',
      'Islamic Medicine':'طبِ اسلامی',
      'Islamic Mathematics':'ریاضیات',
      'Islamic Mysticism':'تصوفِ اسلامی',
      'Islamic Politics':'سیاستِ اسلامی',
      'Islamic Reform':'احیائے اسلامی',
      'Ottoman History':'تاریخِ عثمانیہ',
      'Mughal History':'تاریخِ مغل',
      'Andalusian History':'تاریخِ اندلس',
      'Persian History':'تاریخِ فارس',
      'African Sufism':'افریقی تصوف',
      'Indian Sufism':'برصغیر کا تصوف',
      'Yemeni Sufism':'یمنی تصوف',
      'Anatolian Sufism':'اناطولی تصوف',
      'Central Asian Sufism':'وسطی ایشیائی تصوف',

      // HTW key term lines (long)
      'Arabic for "chain" — unbroken teacher-to-student transmission':'عربی میں "زنجیر" — استاد سے شاگرد تک غیر منقطع منتقلی',
      'Arabic for \u201cchain\u201d \u2014 unbroken teacher-to-student transmission':'عربی میں "زنجیر" — استاد سے شاگرد تک غیر منقطع منتقلی'
    }
  };

  var _manifest = { languages: {}, default: 'en' };
  var _currentLang = 'en';
  var _userExplicitlySetLang = false;
  var _memoryCache = Object.create(null); // "<lang>:<bucket>" -> data
  var _inflight = Object.create(null);    // "<lang>:<bucket>" -> Promise
  var _initStarted = false;
  var _initPromise = null;

  // ─── IndexedDB ────────────────────────────────────────────
  var _dbPromise = null;
  function _openDb(){
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise(function(resolve, reject){
      if (!('indexedDB' in window)) return reject(new Error('No IDB'));
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(){
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = function(){ resolve(req.result); };
      req.onerror = function(){ reject(req.error); };
    });
    return _dbPromise;
  }
  function _idbGet(key){
    return _openDb().then(function(db){
      return new Promise(function(resolve, reject){
        var tx = db.transaction(STORE, 'readonly');
        var req = tx.objectStore(STORE).get(key);
        req.onsuccess = function(){ resolve(req.result || null); };
        req.onerror = function(){ reject(req.error); };
      });
    });
  }
  function _idbPut(key, value){
    return _openDb().then(function(db){
      return new Promise(function(resolve, reject){
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = function(){ resolve(); };
        tx.onerror = function(){ reject(tx.error); };
      });
    });
  }

  // ─── Manifest ─────────────────────────────────────────────
  function _loadManifest(){
    return _idbGet('__manifest__').catch(function(){ return null; }).then(function(cached){
      var fresh = cached && (Date.now() - cached.fetchedAt) < TTL;
      if (fresh) return cached.data;
      return fetch(MANIFEST_URL).then(function(res){
        if (!res.ok) throw new Error('manifest ' + res.status);
        return res.json();
      }).then(function(data){
        _idbPut('__manifest__', { data: data, fetchedAt: Date.now() }).catch(function(){});
        return data;
      }).catch(function(err){
        console.warn('[i18n] manifest fetch failed', err);
        if (cached) return cached.data;
        return _manifest; // English-only default
      });
    });
  }

  // ─── Bucket fetch + cache ─────────────────────────────────
  function _refreshBucket(lang, bucket){
    var url = CDN_BASE + '/' + lang + '/' + bucket + '.json';
    return fetch(url).then(function(res){
      if (!res.ok) throw new Error('bucket ' + url + ' ' + res.status);
      return res.json();
    }).then(function(data){
      _memoryCache[lang + ':' + bucket] = data;
      _idbPut(lang + ':' + bucket, { data: data, fetchedAt: Date.now() }).catch(function(){});
      return data;
    });
  }

  function loadBucket(lang, bucket){
    if (lang === 'en') return Promise.resolve(null); // English in-app
    var key = lang + ':' + bucket;
    if (_memoryCache[key] && _inflight[key] === undefined) {
      // Already in memory, no inflight refresh — serve from memory
      return Promise.resolve(_memoryCache[key]);
    }
    if (_inflight[key]) return _inflight[key];

    _inflight[key] = _idbGet(key).catch(function(){ return null; }).then(function(cached){
      var fresh = cached && (Date.now() - cached.fetchedAt) < TTL;
      if (fresh) {
        _memoryCache[key] = cached.data;
        return cached.data;
      }
      if (cached) {
        // Stale — serve immediately, refresh in background
        _memoryCache[key] = cached.data;
        _refreshBucket(lang, bucket).catch(function(e){
          console.warn('[i18n] bg refresh failed', key, e);
        });
        return cached.data;
      }
      return _refreshBucket(lang, bucket);
    });

    var p = _inflight[key];
    p.catch(function(){}).then(function(){ delete _inflight[key]; });
    return p;
  }

  // ─── Language detection ───────────────────────────────────
  function _isAvailable(code){
    if (!code) return false;
    if (code === 'en') return true;
    var langs = (_manifest && _manifest.languages) || {};
    return Object.prototype.hasOwnProperty.call(langs, code);
  }

  function _resolveInitialLang(){
    var u = window._gaUser;
    if (u && u.appLang && _isAvailable(u.appLang)) return u.appLang;
    try {
      var stored = localStorage.getItem('gold-ark-app-lang');
      if (stored && _isAvailable(stored)) return stored;
    } catch (e) {}
    var navLang = (navigator.language || 'en').toLowerCase().split('-')[0];
    if (_isAvailable(navLang)) return navLang;
    return 'en';
  }

  // ─── Lookup ───────────────────────────────────────────────
  function _lookup(lang, bucket, key, field){
    if (lang === 'en') return null; // English fallback handled by caller
    var ck = lang + ':' + bucket;
    var obj = _memoryCache[ck];
    if (!obj) {
      // Trigger lazy load for next time, but return null now
      loadBucket(lang, bucket).catch(function(){});
      return null;
    }
    if (bucket === 'ui') {
      return (typeof obj[key] === 'string') ? obj[key] : null;
    }
    var entry = obj[key];
    if (entry == null) return null;
    if (field === undefined) return entry;
    if (entry && typeof entry === 'object' && field in entry) return entry[field];
    return null;
  }

  function t(bucket, key, field){
    return _lookup(_currentLang, bucket, key, field);
  }

  function tForView(viewName, bucket, key, field){
    return _lookup(effectiveLangFor(viewName), bucket, key, field);
  }

  // ─── View overrides (sessionStorage map) ──────────────────
  function _readViewOverrides(){
    try { return JSON.parse(sessionStorage.getItem('gold-ark-view-lang') || '{}'); }
    catch (e) { return {}; }
  }
  function _writeViewOverrides(map){
    try { sessionStorage.setItem('gold-ark-view-lang', JSON.stringify(map)); } catch (e) {}
  }
  function getViewOverride(viewName){
    var map = _readViewOverrides();
    return map[viewName] || null;
  }
  function setViewOverride(viewName, lang){
    var map = _readViewOverrides();
    var prev = map[viewName] || null;
    if (lang == null) {
      delete map[viewName];
    } else {
      if (!_isAvailable(lang)) { console.warn('[i18n] unknown lang:', lang); return; }
      map[viewName] = lang;
    }
    _writeViewOverrides(map);
    document.dispatchEvent(new CustomEvent('gold-ark-view-lang-changed', {
      detail: { view: viewName, lang: (lang == null ? null : lang), prev: prev }
    }));
    if (lang && lang !== 'en') {
      BUCKETS.forEach(function(b){ loadBucket(lang, b).catch(function(){}); });
    }
  }
  function effectiveLangFor(viewName){
    return getViewOverride(viewName) || _currentLang;
  }

  // ─── Public API ───────────────────────────────────────────
  function getLang(){ return _currentLang; }

  function getAvailableLangs(){
    var out = [{ code: 'en', name: 'English', dir: 'ltr', font: null }];
    if (_manifest && _manifest.languages && typeof _manifest.languages === 'object') {
      Object.keys(_manifest.languages).forEach(function(code){
        var L = _manifest.languages[code];
        out.push({
          code: code,
          name: L.name_native || L.name_english || code,
          name_english: L.name_english || code,
          dir: L.dir || 'ltr',
          font: L.font || null,
          buckets: L.buckets || [],
          coverage: L.coverage || {}
        });
      });
    }
    return out;
  }

  function setLang(lang){
    if (!_isAvailable(lang)) {
      console.warn('[i18n] unknown lang:', lang);
      return Promise.resolve();
    }
    var prev = _currentLang;
    if (prev === lang) return Promise.resolve();
    _currentLang = lang;
    _userExplicitlySetLang = true;
    try { localStorage.setItem('gold-ark-app-lang', lang); } catch (e) {}
    if (window.GoldArkAuth && typeof window.GoldArkAuth.setAppLang === 'function' && window.GoldArkAuth.isSignedIn()) {
      window.GoldArkAuth.setAppLang(lang).catch(function(e){ console.warn('[i18n] firestore appLang write failed', e); });
    }
    document.dispatchEvent(new CustomEvent('gold-ark-lang-changed', { detail: { lang: lang, prev: prev } }));
    var loaders = (lang === 'en') ? [] : BUCKETS.map(function(b){ return loadBucket(lang, b).catch(function(){}); });
    return Promise.all(loaders).then(function(){
      // Fire a second event AFTER all CDN buckets land in memory.
      // Views' lang-changed handlers are idempotent — they re-render with full data.
      // Fixes mixed-language render race (rows Urdu / bio English etc.).
      document.dispatchEvent(new CustomEvent('gold-ark-lang-changed', { detail: { lang: lang, prev: prev, phase: 'buckets-loaded' } }));
    });
  }

  // ─── Init ─────────────────────────────────────────────────
  function _waitForDOM(){
    return new Promise(function(resolve){
      if (document.readyState !== 'loading') return resolve();
      document.addEventListener('DOMContentLoaded', function(){ resolve(); }, { once: true });
    });
  }

  function _waitForAuthReady(){
    return new Promise(function(resolve){
      if (window.GoldArkAuth) return resolve();
      var done = false;
      var finish = function(){ if (!done) { done = true; resolve(); } };
      document.addEventListener('gold-ark-auth-ready', finish, { once: true });
      setTimeout(finish, 2500);
    });
  }

  function _waitForAuthStable(){
    // Brief grace period for Firebase to populate _gaUser (or confirm null).
    // onAuthStateChanged fires shortly after auth.js loads.
    return new Promise(function(resolve){
      if (!window.GoldArkAuth) return resolve();
      var done = false;
      var finish = function(){ if (!done) { done = true; resolve(); } };
      var fires = 0;
      var unsub = window.GoldArkAuth.onStateChange(function(){
        fires++;
        // First fire is sync immediate (state may be null before Firebase resolves).
        // Second fire = real Firebase state.
        if (fires >= 2 || window._gaUser) { try { unsub(); } catch(e){} finish(); }
      });
      setTimeout(finish, 1200);
    });
  }

  function init(){
    if (_initStarted) return _initPromise;
    _initStarted = true;
    _initPromise = (function(){
      return _waitForDOM()
        .then(_waitForAuthReady)
        .then(_waitForAuthStable)
        .then(_loadManifest)
        .then(function(m){ _manifest = m || _manifest; })
        .then(function(){
          _currentLang = _resolveInitialLang();
          if (_currentLang !== 'en') {
            return loadBucket(_currentLang, 'ui').catch(function(e){
              console.warn('[i18n] ui preload failed', e);
            });
          }
        })
        .then(function(){
          // Honor Firestore appLang if user signs in later and hasn't been
          // explicitly overridden in this session.
          if (window.GoldArkAuth) {
            window.GoldArkAuth.onStateChange(function(u){
              if (u && u.appLang && !_userExplicitlySetLang && u.appLang !== _currentLang) {
                setLang(u.appLang).catch(function(){});
              }
            });
          }
          document.dispatchEvent(new CustomEvent('gold-ark-i18n-ready', {
            detail: { lang: _currentLang }
          }));
          console.log('[i18n] ready, lang =', _currentLang);
        })
        .catch(function(e){ console.error('[i18n] init failed', e); });
    })();
    return _initPromise;
  }

  // ─── tt() — UI string lookup with English fallthrough ─────
  function tt(en){
    if (en == null) return en;
    var lang = getLang();
    if (lang === 'en') return en;
    // 1. ui.json from CDN (RV-translated)
    var v = t('ui', en);
    if (v != null && v !== '') return v;
    // 2. Inline fallback dictionary
    var fb = UI_FALLBACK[lang];
    if (fb && fb[en] != null) return fb[en];
    // 3. English fallthrough — visible gap indicator
    return en;
  }

  // ─── DOM auto-translator ──────────────────────────────────
  function _applyDomTranslations(){
    try {
      var nodes = document.querySelectorAll('[data-i18n]');
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var key = n.getAttribute('data-i18n');
        if (!key) continue;
        n.textContent = tt(key);
      }
      var pNodes = document.querySelectorAll('[data-i18n-placeholder]');
      for (var j = 0; j < pNodes.length; j++) {
        var pn = pNodes[j];
        var pk = pn.getAttribute('data-i18n-placeholder');
        if (!pk) continue;
        pn.setAttribute('placeholder', tt(pk));
      }
      var tNodes = document.querySelectorAll('[data-i18n-title]');
      for (var k = 0; k < tNodes.length; k++) {
        var tn = tNodes[k];
        var tk = tn.getAttribute('data-i18n-title');
        if (!tk) continue;
        tn.setAttribute('title', tt(tk));
      }
    } catch (e) { console.warn('[i18n] DOM translate error:', e); }
  }

  document.addEventListener('gold-ark-lang-changed', _applyDomTranslations);
  document.addEventListener('gold-ark-i18n-ready', _applyDomTranslations);

  window.GoldArkI18n = {
    init: init,
    getLang: getLang,
    setLang: setLang,
    getAvailableLangs: getAvailableLangs,
    getViewOverride: getViewOverride,
    setViewOverride: setViewOverride,
    effectiveLangFor: effectiveLangFor,
    t: t,
    tForView: tForView,
    tt: tt,
    applyDomTranslations: _applyDomTranslations,
    loadBucket: loadBucket
  };

  // Auto-schedule init — no caller required.
  init();
})();
