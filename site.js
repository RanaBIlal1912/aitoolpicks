// Paste your affiliate links here once a program approves you. One place, used on every page.
// Until a link is filled in, the button stays "#" (do not link to the plain tool site, you would earn nothing).
//
// Each value is either a plain URL string, or an object with an optional link per country:
//   canva: { default: "https://...", GB: "https://...", PK: "https://..." }
// Use only the official link your affiliate program gave you for that country. If a country has no
// link of its own, the "default" link is used. The link is chosen once, when the page loads, from the
// visitor's country. Changing the currency in the header NEVER changes or rewrites any link.
const LINKS = {
  canva: "",
  grammarly: "",
  notion: "",
  chatgpt: "",
  jasper: "",
  hostinger: "",
  namecheap: ""
};

(function () {
  var country = (window.AffCurrency && window.AffCurrency.detectCountry) ? window.AffCurrency.detectCountry() : "";
  function pick(v) {
    if (typeof v === "string") return v;
    if (v && typeof v === "object") return v[country] || v.default || "";
    return "";
  }
  document.querySelectorAll("a[data-aff]").forEach(function (a) {
    var url = pick(LINKS[a.dataset.aff]);
    if (/^https:\/\//i.test(url)) { a.href = url; a.rel = "sponsored nofollow noopener"; a.target = "_blank"; }
    else { a.href = "#"; a.title = "Affiliate link not set yet"; }
  });
})();
