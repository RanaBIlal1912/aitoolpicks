// Multi-currency display. Base prices live in prices.js (USD). No API key needed.
// Rates: open.er-api.com, then jsdelivr currency-api, then cached rates, then built-in fallback.
(function () {
  "use strict";

  var CURRENCIES = {
    USD: { symbol: "$",  label: "USD ($)",  decimals: 2 },
    GBP: { symbol: "£",  label: "GBP (£)",  decimals: 2 },
    EUR: { symbol: "€",  label: "EUR (€)",  decimals: 2 },
    PKR: { symbol: "₨",  label: "PKR (₨)",  decimals: 0, roundTo: 10 },
    CAD: { symbol: "C$", label: "CAD (C$)", decimals: 2 },
    AUD: { symbol: "A$", label: "AUD (A$)", decimals: 2 }
  };
  var CODES = Object.keys(CURRENCIES);

  // Used only when no live or cached rates are available.
  var FALLBACK = { date: "2026-10-29", rates: { USD: 1, GBP: 0.75, EUR: 0.90, PKR: 277, CAD: 1.40, AUD: 1.42 } };

  var CACHE_KEY = "aff_rates_v1";
  var PICK_KEY = "aff_currency_v1";
  var MAX_AGE = 12 * 3600 * 1000;

  var SOURCES = [
    {
      name: "Exchange Rate API", url: "https://open.er-api.com/v6/latest/USD", credit: "https://www.exchangerate-api.com",
      parse: function (d) {
        if (!d || d.result !== "success" || !d.rates) return null;
        return { rates: d.rates, date: (d.time_last_update_utc || "").slice(5, 16) };
      }
    },
    {
      name: "currency-api", url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json", credit: "",
      parse: function (d) {
        if (!d || !d.usd) return null;
        var r = {};
        CODES.forEach(function (c) { r[c] = d.usd[c.toLowerCase()]; });
        return { rates: r, date: d.date };
      }
    }
  ];

  var EURO = "AT BE BG HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES".split(" ");
  var TZ_COUNTRY = {
    "Asia/Karachi": "PK", "Europe/London": "GB",
    "America/Toronto": "CA", "America/Vancouver": "CA", "America/Edmonton": "CA", "America/Winnipeg": "CA",
    "America/Halifax": "CA", "America/St_Johns": "CA", "America/Regina": "CA",
    "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU", "Australia/Perth": "AU",
    "Australia/Adelaide": "AU", "Australia/Hobart": "AU", "Australia/Darwin": "AU",
    "Europe/Berlin": "DE", "Europe/Paris": "FR", "Europe/Madrid": "ES", "Europe/Rome": "IT",
    "Europe/Amsterdam": "NL", "Europe/Dublin": "IE", "Europe/Brussels": "BE", "Europe/Vienna": "AT",
    "Europe/Lisbon": "PT", "Europe/Athens": "GR", "Europe/Helsinki": "FI"
  };

  var state = { cur: "USD", rates: FALLBACK.rates, date: FALLBACK.date, source: "fallback", credit: "" };

  function store(key, val) {
    try { if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch (e) { /* storage blocked */ }
  }
  function load(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function validRates(r) {
    return !!r && CODES.every(function (c) { return typeof r[c] === "number" && isFinite(r[c]) && r[c] > 0; });
  }

  function currencyForCountry(c) {
    if (c === "GB") return "GBP";
    if (c === "PK") return "PKR";
    if (c === "CA") return "CAD";
    if (c === "AU") return "AUD";
    if (EURO.indexOf(c) > -1) return "EUR";
    return null;
  }

  // Countries hinted by browser language (en-GB) and time zone. No IP lookup, so no third-party tracking.
  function countries() {
    var out = [];
    var langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ""];
    langs.forEach(function (l) {
      var m = /[-_]([A-Za-z]{2})\b/.exec(l || "");
      if (m) out.push(m[1].toUpperCase());
    });
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && TZ_COUNTRY[tz]) out.push(TZ_COUNTRY[tz]);
    } catch (e) { /* no Intl */ }
    return out;
  }

  function detectCountry() {
    var list = countries();
    for (var i = 0; i < list.length; i++) if (currencyForCountry(list[i])) return list[i];
    return list[0] || "";
  }

  function detectCurrency() {
    return currencyForCountry(detectCountry()) || "USD";
  }

  function convert(usd, cur, rates) {
    var c = CURRENCIES[cur];
    var v = usd * (rates || state.rates)[cur];
    if (c.roundTo) return Math.round(v / c.roundTo) * c.roundTo;
    return Math.round(v * 100) / 100;
  }

  function format(v, cur) {
    var c = CURRENCIES[cur];
    var whole = c.decimals === 0 || v === Math.floor(v);
    var d = whole ? 0 : c.decimals;
    return c.symbol + v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function fetchJson(url) {
    var ctl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
    return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }, function (e) { clearTimeout(timer); throw e; });
  }

  function readCache() {
    try {
      var c = JSON.parse(load(CACHE_KEY) || "null");
      if (c && validRates(c.rates)) return c;
    } catch (e) { /* bad cache */ }
    return null;
  }

  function loadRates() {
    var cached = readCache();
    if (cached && Date.now() - cached.t < MAX_AGE) return Promise.resolve(cached);

    function tryNext(i) {
      if (i >= SOURCES.length) return Promise.resolve(cached || null);
      var s = SOURCES[i];
      return fetchJson(s.url).then(function (d) {
        var p = s.parse(d);
        if (!p || !validRates(p.rates)) throw new Error("bad data");
        p.rates.USD = 1;
        var fresh = { t: Date.now(), rates: p.rates, date: p.date, source: s.name, credit: s.credit };
        store(CACHE_KEY, JSON.stringify(fresh));
        return fresh;
      }).catch(function () { return tryNext(i + 1); });
    }
    return tryNext(0);
  }

  function applyRates(r) {
    if (r && validRates(r.rates)) {
      state.rates = r.rates; state.date = r.date || ""; state.source = r.source || "cache"; state.credit = r.credit || "";
    } else {
      state.rates = FALLBACK.rates; state.date = FALLBACK.date; state.source = "fallback"; state.credit = "";
    }
  }

  function render() {
    var cur = state.cur;
    var items = (typeof PRICES !== "undefined" && PRICES.items) || {};
    document.querySelectorAll("[data-price]").forEach(function (el) {
      var item = items[el.getAttribute("data-price")];
      if (!item) { el.hidden = true; return; }
      var v = convert(item.usd, cur, state.rates);
      var amount = (cur === "USD" ? "" : "≈ ") + format(v, cur);
      el.textContent = "Typical price: " + amount + " per " + item.per + " (" + item.note + "). Check the official site for current pricing.";
      el.title = "Base price: $" + item.usd + " USD";
      el.hidden = false;
    });

    var note = document.getElementById("rate-note");
    if (note) {
      note.textContent = "";
      if (!document.querySelector("[data-price]")) { note.hidden = true; return; }
      note.hidden = false;
      if (cur === "USD") {
        note.textContent = "Prices are shown in US dollars, the base currency.";
      } else if (state.source === "fallback") {
        note.textContent = "Live exchange rates were unavailable, so these are approximate conversions from USD (rates of " + state.date + ").";
      } else {
        note.appendChild(document.createTextNode("Converted from USD, rates of " + state.date + " (" + state.source + "). Estimates only; your checkout price may differ. "));
        if (state.credit) {
          var a = document.createElement("a");
          a.href = state.credit; a.rel = "noopener nofollow"; a.target = "_blank"; a.textContent = "Rates By Exchange Rate API";
          note.appendChild(a);
        }
      }
    }
  }

  function setCurrency(cur, remember) {
    if (!CURRENCIES[cur]) cur = "USD";
    state.cur = cur;
    if (remember) store(PICK_KEY, cur);
    var sel = document.getElementById("currency");
    if (sel && sel.value !== cur) sel.value = cur;
    document.documentElement.setAttribute("data-currency", cur);
    render();
    document.dispatchEvent(new CustomEvent("currencychange", { detail: { currency: cur } }));
  }

  function buildSelector() {
    var wrap = document.querySelector("header.site .wrap");
    if (!wrap || document.getElementById("currency")) return;
    var label = document.createElement("label");
    label.className = "cur";
    var sr = document.createElement("span");
    sr.className = "sr"; sr.textContent = "Currency";
    var sel = document.createElement("select");
    sel.id = "currency"; sel.setAttribute("aria-label", "Currency");
    CODES.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c; o.textContent = CURRENCIES[c].label;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () { setCurrency(sel.value, true); });
    label.appendChild(sr); label.appendChild(sel);
    wrap.appendChild(label);
  }

  function buildNote() {
    var foot = document.querySelector("footer .wrap");
    if (!foot || document.getElementById("rate-note")) return;
    var p = document.createElement("p");
    p.id = "rate-note"; p.className = "rate-note"; p.hidden = true;
    foot.appendChild(p);
  }

  function init() {
    buildSelector();
    buildNote();
    var saved = load(PICK_KEY);
    var start = (saved && CURRENCIES[saved]) ? saved : detectCurrency();
    applyRates(readCache());
    setCurrency(start, false);
    loadRates().then(function (r) { applyRates(r); render(); }).catch(function () { /* keep current rates */ });
  }

  window.AffCurrency = {
    CURRENCIES: CURRENCIES, FALLBACK: FALLBACK, state: state,
    convert: convert, format: format, setCurrency: setCurrency, loadRates: loadRates,
    detectCountry: detectCountry, detectCurrency: detectCurrency, currencyForCountry: currencyForCountry
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
