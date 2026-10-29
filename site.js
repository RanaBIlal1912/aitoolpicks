// Paste your affiliate links here once a program approves you. One place, used on every page.
// Until a link is filled in, the button stays "#" (do not link to the plain tool site, you would earn nothing).
const LINKS = {
  canva: "",
  grammarly: "",
  notion: "",
  chatgpt: "",
  jasper: "",
  hostinger: "",
  namecheap: ""
};
document.querySelectorAll("a[data-aff]").forEach(a => {
  const url = LINKS[a.dataset.aff];
  if (url) { a.href = url; a.rel = "sponsored nofollow noopener"; a.target = "_blank"; }
  else { a.href = "#"; a.title = "Affiliate link not set yet"; }
});
