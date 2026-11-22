// Section backgrounds, like phone wallpapers: every part of the site has its own picture, and it fades when you move between parts.
// Pictures live in public/assets/<name>.svg (the drawings that come with the site).
// To use a real photo for a section, upload it as public/assets/<name>.webp (or .jpg) and list it in PHOTOS below.
(function () {
  var PHOTOS = {};   // example: { login: "webp", certs: "jpg" }  (the photo is shown instead of the drawing)
  var MAP = { signin: "login", signup: "login", forgot: "login", reset: "login", app: "dashboard", live: "live",
    course: "learn", quiz: "learn", teach: "learn", courses: "learn", skills: "growth", roleplay: "growth", play: "growth", coach: "growth", journal: "growth",
    practice: "people", certs: "certs", cert: "certs", verify: "certs", feedback: "support", help: "support", terms: "support", privacy: "support", refund: "support", faq: "support", admin: "admin" };
  var VEIL = { login: .46, dashboard: .62, live: .6, learn: .62, growth: .58, people: .64, certs: .6, support: .66, admin: .6 };   // how dark the picture is (0 to 1). Photos usually need about .75
  var de = document.documentElement, nv = navigator, cur = null, front = 0, layers = [], wrap = null;
  // slow phones and "data saver": no blur effects, nothing preloaded
  var lite = (nv.deviceMemory && nv.deviceMemory <= 2) || (nv.hardwareConcurrency && nv.hardwareConcurrency <= 2) || (nv.connection && nv.connection.saveData);
  if (lite) de.classList.add("lite");
  function url(n) { return (PHOTOS[n] ? "url(/assets/" + n + "." + PHOTOS[n] + ")," : "") + "url(/assets/" + n + ".svg)"; }
  function mount() {
    if (wrap) return;
    wrap = document.createElement("div"); wrap.className = "bgwrap"; wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = '<div class="bgl"></div><div class="bgl"></div><div class="bgveil"></div><div class="bgvig"></div>';
    document.body.insertBefore(wrap, document.body.firstChild); layers = [].slice.call(wrap.querySelectorAll(".bgl"));
  }
  function slot() { var r = (location.hash.slice(1) || "/").split("/")[1] || ""; return MAP[r] || (r === "" ? "login" : "dashboard"); }
  function set() {
    mount(); var n = slot(); if (n === cur) return; cur = n;
    var next = layers[front ^ 1], prev = layers[front];
    next.style.backgroundImage = url(n); wrap.style.setProperty("--veil", VEIL[n] || .6);
    requestAnimationFrame(function () { next.classList.add("on"); prev.classList.remove("on"); });
    front ^= 1; document.body.setAttribute("data-bg", n);
  }
  function preload() {
    if (lite) return;
    var seen = {}; Object.keys(MAP).forEach(function (k) { seen[MAP[k]] = 1; });
    (window.requestIdleCallback || function (f) { setTimeout(f, 1500); })(function () {
      Object.keys(seen).forEach(function (n) { var i = new Image(); i.src = "/assets/" + (PHOTOS[n] ? n + "." + PHOTOS[n] : n + ".svg"); });
    });
  }
  function start() { set(); window.addEventListener("hashchange", set); window.addEventListener("load", preload); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
