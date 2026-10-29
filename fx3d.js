// 3D effects for the home page: a floating Three.js scene in the hero and a tilt effect on cards.
// Everything here is decoration. The page works fully without it (no WebGL, no JS, reduced motion, data saver).
(function () {
  "use strict";

  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  // ---------- Card tilt ----------
  function initTilt() {
    if (reduced || !finePointer) return;
    var els = document.querySelectorAll(".card, .tool, .how div");
    els.forEach(function (el) {
      el.classList.add("tilt");
      var raf = 0;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.transform = "perspective(900px) rotateX(" + ((0.5 - y) * 9).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 11).toFixed(2) + "deg) translateZ(6px)";
          el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
          el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        });
      });
      el.addEventListener("pointerleave", function () {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = "";
      });
    });
  }

  // ---------- Hero 3D scene ----------
  function initHero() {
    var canvas = document.getElementById("hero3d");
    if (!canvas || saveData) return;
    var hero = canvas.parentElement;

    function start() {
      var T = window.THREE;
      if (!T) return;
      var renderer;
      try {
        renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: "low-power" });
      } catch (e) { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      var scene = new T.Scene();
      var camera = new T.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.z = 9;

      scene.add(new T.AmbientLight(0xffffff, 0.75));
      var key = new T.DirectionalLight(0xffffff, 0.95); key.position.set(4, 6, 8); scene.add(key);
      var rim = new T.PointLight(0x34d399, 1.3, 30); rim.position.set(-6, -3, 4); scene.add(rim);

      var group = new T.Group();
      scene.add(group);

      var icoGeo = new T.IcosahedronGeometry(1.5, 0);
      var ico = new T.Mesh(icoGeo, new T.MeshStandardMaterial({ color: 0x0f766e, flatShading: true, roughness: 0.35, metalness: 0.25 }));
      var shell = new T.Mesh(icoGeo, new T.MeshBasicMaterial({ color: 0x2dd4bf, wireframe: true, transparent: true, opacity: 0.45 }));
      shell.scale.setScalar(1.38);
      var core = new T.Group(); core.add(ico); core.add(shell); group.add(core);

      var torus = new T.Mesh(new T.TorusGeometry(0.85, 0.27, 16, 48), new T.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.3 }));
      torus.position.set(-2.6, 1.5, -0.5); group.add(torus);

      var octa = new T.Mesh(new T.OctahedronGeometry(0.62), new T.MeshStandardMaterial({ color: 0x34d399, flatShading: true, roughness: 0.3, metalness: 0.2 }));
      octa.position.set(2.5, -1.7, 0.4); group.add(octa);

      var orbiters = [];
      [0xf59e0b, 0x2dd4bf, 0xf59e0b, 0x34d399].forEach(function (c, i) {
        var m = new T.Mesh(new T.SphereGeometry(0.2 + (i % 2) * 0.06, 20, 20), new T.MeshStandardMaterial({ color: c, roughness: 0.25, metalness: 0.2 }));
        m.userData = { a: (i / 4) * Math.PI * 2, r: 2.6 + i * 0.35, s: 0.4 + i * 0.12, y: (i - 1.5) * 0.45 };
        group.add(m); orbiters.push(m);
      });

      var px = 0, py = 0, tx = 0, ty = 0, t = 0, last = 0, running = false, visible = true, raf = 0;

      function resize() {
        var w = hero.clientWidth, h = hero.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        var visW = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect;
        var wide = camera.aspect > 1.3;
        // Keep the shapes on the right so they never cover the headline; shrink them on narrower heroes.
        var s = wide ? Math.max(0.55, Math.min(1, camera.aspect / 2.4)) : 0.8;
        group.position.x = wide ? Math.min(visW * 0.3, 5.6) : 0;
        group.scale.setScalar(s);
      }

      function frame(now) {
        raf = 0;
        if (!running) return;
        var dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
        px += (tx - px) * 0.06; py += (ty - py) * 0.06;
        core.rotation.x = t * 0.22; core.rotation.y = t * 0.34;
        torus.rotation.x = t * 0.5; torus.rotation.y = t * 0.3; torus.position.y = 1.5 + Math.sin(t * 0.9) * 0.18;
        octa.rotation.y = t * 0.6; octa.rotation.x = t * 0.25; octa.position.y = -1.7 + Math.cos(t * 0.8) * 0.16;
        orbiters.forEach(function (m) {
          var d = m.userData, a = d.a + t * d.s;
          m.position.set(Math.cos(a) * d.r, d.y + Math.sin(a * 1.3) * 0.3, Math.sin(a) * d.r * 0.6);
        });
        group.rotation.y = px * 0.45; group.rotation.x = -py * 0.3;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      }

      function setRunning() {
        var want = visible && !document.hidden && !reduced;
        if (want && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
        else if (!want && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
      }

      resize();
      if (window.ResizeObserver) new ResizeObserver(resize).observe(hero); else window.addEventListener("resize", resize);

      if (reduced) {
        // One still frame, no animation.
        core.rotation.set(0.5, 0.7, 0);
        renderer.render(scene, camera);
      } else {
        if (finePointer) {
          hero.addEventListener("pointermove", function (e) {
            var r = hero.getBoundingClientRect();
            tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
            ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
          });
          hero.addEventListener("pointerleave", function () { tx = 0; ty = 0; });
        }
        if ("IntersectionObserver" in window) {
          new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRunning(); }).observe(hero);
        }
        document.addEventListener("visibilitychange", setRunning);
        setRunning();
      }

      document.documentElement.classList.add("has-3d");
      window.__fx3d = { ok: true };
    }

    function load() {
      if (window.THREE) { start(); return; }
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = start;
      s.onerror = function () { /* keep the plain gradient hero */ };
      document.head.appendChild(s);
    }

    // Load the library only after the page itself has finished, so it never delays content.
    var go = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(load); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
  }

  initTilt();
  initHero();
})();
