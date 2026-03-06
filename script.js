(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Reveal animations
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // Leaflet maps (only if Leaflet exists)
  if (typeof L === "undefined") return;

  const maps = new Map(); // mapId -> {map, center, zoom, layers, activeKey}

  function fmtCoord(lat, lng) {
    const a = Math.abs;
    const f = (v) => (Math.round(v * 100000) / 100000).toFixed(5);
    return `${f(lat)}°, ${f(lng)}°`;
  }

  function setCoords(mapId, latlng) {
    const box = document.querySelector(`.mapCoords[data-coords="${mapId}"]`);
    if (!box || !latlng) return;
    box.textContent = fmtCoord(latlng.lat, latlng.lng);
  }

  function enableHoverWheel(mapEl, map) {
    mapEl.addEventListener("mouseenter", () => map.scrollWheelZoom.enable());
    mapEl.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());
    mapEl.addEventListener("focus", () => map.scrollWheelZoom.enable());
    mapEl.addEventListener("blur", () => map.scrollWheelZoom.disable());
  }

  function ensureBackdrop() {
    let b = document.querySelector(".fullscreenBackdrop");
    if (!b) {
      b = document.createElement("div");
      b.className = "fullscreenBackdrop";
      document.body.appendChild(b);
    }
    return b;
  }

  function toggleFullscreen(mapId) {
    const mapEl = document.getElementById(mapId);
    if (!mapEl) return;
    const isFull = mapEl.classList.contains("mapFullscreen");
    const backdrop = ensureBackdrop();

    if (!isFull) {
      backdrop.style.display = "block";
      mapEl.classList.add("mapFullscreen");
      backdrop.addEventListener(
        "click",
        () => {
          toggleFullscreen(mapId);
        },
        { once: true }
      );
    } else {
      mapEl.classList.remove("mapFullscreen");
      backdrop.style.display = "none";
    }

    const entry = maps.get(mapId);
    if (entry?.map) setTimeout(() => entry.map.invalidateSize(), 180);
  }

  function toggleLayer(mapId) {
    const entry = maps.get(mapId);
    if (!entry) return;
    const keys = Object.keys(entry.layers);
    if (!keys.length) return;

    const currentIdx = Math.max(0, keys.indexOf(entry.activeKey));
    const nextKey = keys[(currentIdx + 1) % keys.length];

    const map = entry.map;
    for (const k of keys) {
      try {
        map.removeLayer(entry.layers[k]);
      } catch (_) {}
    }
    entry.layers[nextKey].addTo(map);
    entry.activeKey = nextKey;
  }


  function resetView(mapId) {
    const entry = maps.get(mapId);
    if (!entry) return;
    entry.map.setView(entry.center, entry.zoom, { animate: true, duration: 0.6 });
  }

  function wireControls(mapId) {
    const wrap = document.querySelector(`.mapControls[data-map="${mapId}"]`);
    if (!wrap) return;

    wrap.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      if (action === "layer") toggleLayer(mapId);
      if (action === "reset") resetView(mapId);
      if (action === "fullscreen") toggleFullscreen(mapId);
    });
  }

  function initSatelliteViewer() {
    const el = document.getElementById("satMap");
    if (!el) return;

    const center = [40.6, 33.6]; // Çankırı çevresi
    const zoom = 7;

    const map = L.map("satMap", { zoomControl: true, scrollWheelZoom: false }).setView(center, zoom);

    const imagery = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "Tiles © Esri" }
    );

    const dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap © CARTO",
    });

    imagery.addTo(map);

    const layers = {
      "Uydu (Esri)": imagery,
      "Koyu (CARTO)": dark,
    };

    // Keep classic layers control (collapsed)
enableHoverWheel(el, map);

    map.on("mousemove", (e) => setCoords("satMap", e.latlng));
    map.on("mouseout", () => setCoords("satMap", null));
    setCoords("satMap", map.getCenter());

    maps.set("satMap", { map, center, zoom, layers, activeKey: "Uydu (Esri)" });
    wireControls("satMap");
  }

  
  function initOSMViewer() {
    const el = document.getElementById("osmMap");
    if (!el) return;

    const center = [40.6, 33.6]; // Çankırı çevresi
    const zoom = 7;

    const map = L.map("osmMap", { zoomControl: true, scrollWheelZoom: false }).setView(center, zoom);

    const dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap © CARTO",
    });

    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    });

    dark.addTo(map);

    enableHoverWheel(el, map);

    map.on("mousemove", (e) => setCoords("osmMap", e.latlng));
    map.on("mouseout", () => setCoords("osmMap", null));
    setCoords("osmMap", map.getCenter());

    maps.set("osmMap", {
      map,
      center,
      zoom,
      layers: { "Koyu (CARTO)": dark, "OSM": osm },
      activeKey: "Koyu (CARTO)"
    });
    wireControls("osmMap");
  }

function initContactMap() {
    const el = document.getElementById("contactMap");
    if (!el) return;

    const center = [40.6013, 33.6134]; // Çankırı merkez yaklaşık
    const zoom = 12;

    const map = L.map("contactMap", { scrollWheelZoom: false }).setView(center, zoom);

    const dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap © CARTO",
    });

    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    });

    dark.addTo(map);

    const marker = L.circleMarker(center, {
      radius: 7,
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
    }).addTo(map);

    marker.bindPopup("<b>Çankırı</b><br/>Türkiye");

    enableHoverWheel(el, map);

    map.on("mousemove", (e) => setCoords("contactMap", e.latlng));
    map.on("mouseout", () => setCoords("contactMap", null));
    setCoords("contactMap", map.getCenter());

    const layers = {
      "Koyu (CARTO)": dark,
      "OSM": osm,
    };
maps.set("contactMap", { map, center, zoom, layers, activeKey: "Koyu (CARTO)" });
    wireControls("contactMap");
  }

  initSatelliteViewer();
  initOSMViewer();
  initContactMap();

  // ESC closes fullscreen if open
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    for (const mapId of ["satMap", "osmMap", "contactMap"]) {
      const el = document.getElementById(mapId);
      if (el && el.classList.contains("mapFullscreen")) toggleFullscreen(mapId);
    }
  });

  // ---- WORLD GLOBE (Canvas, no external libraries) ----
  (function initGlobe(){
    const canvas = document.getElementById("globeCanvas");
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    if(!ctx) return;

    const DPR = window.devicePixelRatio || 1;

    function resize(){
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * DPR));
      canvas.height = Math.max(1, Math.floor(r.height * DPR));
    }
    resize();
    window.addEventListener("resize", resize);

    const t0 = performance.now();

    function draw(now){
      const w = canvas.width, h = canvas.height;
      const cx = w/2, cy = h/2;
      const R = Math.min(w,h) * 0.36;

      ctx.clearRect(0,0,w,h);

      // space bg
      const bg = ctx.createRadialGradient(cx, cy, R*0.2, cx, cy, R*2.2);
      bg.addColorStop(0, "rgba(10,16,28,0.0)");
      bg.addColorStop(1, "rgba(6,9,16,0.55)");
      ctx.fillStyle = bg;
      ctx.fillRect(0,0,w,h);

      // stars
      ctx.save();
      ctx.globalAlpha = 0.35;
      for(let i=0;i<80;i++){
        const x=(i*997)%w, y=(i*619)%h;
        const s=((i*37)%3)+1;
        ctx.fillStyle="rgba(190,210,255,0.35)";
        ctx.fillRect(x,y,s,s);
      }
      ctx.restore();

      const phase=(now-t0)/1000;
      const rot=phase*0.35;

      ctx.save();
      ctx.translate(cx,cy);

      // glow
      const glow=ctx.createRadialGradient(0,0,R*0.6,0,0,R*1.35);
      glow.addColorStop(0,"rgba(60,110,255,0.18)");
      glow.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=glow;
      ctx.beginPath(); ctx.arc(0,0,R*1.25,0,Math.PI*2); ctx.fill();

      // sphere
      const sphere=ctx.createRadialGradient(-R*0.35,-R*0.25,R*0.2,0,0,R*1.1);
      sphere.addColorStop(0,"rgba(40,95,220,0.90)");
      sphere.addColorStop(0.55,"rgba(18,36,80,0.95)");
      sphere.addColorStop(1,"rgba(5,8,16,1)");
      ctx.fillStyle=sphere;
      ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.fill();

      ctx.strokeStyle="rgba(200,220,255,0.6)";
      ctx.lineWidth=Math.max(1,R*0.006);

      // longitudes
      for(let k=0;k<12;k++){
        const a=(k/12)*Math.PI*2+rot;
        const x0=Math.cos(a)*R;
        const scale=Math.abs(Math.cos(a));
        ctx.globalAlpha=0.12+scale*0.18;
        ctx.beginPath();
        for(let y=-R;y<=R;y+=R/24){
          const yy=y;
          const xx=x0*Math.sqrt(1-(yy*yy)/(R*R));
          const px=xx*scale, py=yy;
          if(y===-R) ctx.moveTo(px,py); else ctx.lineTo(px,py);
        }
        ctx.stroke();
      }

      // latitudes
      for(let j=-4;j<=4;j++){
        const lat=(j/5)*(Math.PI/2)*0.78;
        const ry=Math.sin(lat)*R;
        const rx=Math.cos(lat)*R;
        ctx.beginPath();
        for(let th=0; th<=Math.PI*2+0.001; th+=Math.PI/90){
          const a=th+rot;
          const x=Math.cos(a)*rx;
          const z=Math.sin(a)*rx;
          const p=(z+R)/(2*R);
          ctx.globalAlpha=0.08+p*0.22;
          ctx.lineTo(x,ry);
        }
        ctx.closePath(); ctx.stroke();
      }
      ctx.globalAlpha=1;

      // terminator shadow
      const term=ctx.createLinearGradient(-R,0,R,0);
      term.addColorStop(0,"rgba(0,0,0,0.65)");
      term.addColorStop(0.55,"rgba(0,0,0,0.05)");
      term.addColorStop(1,"rgba(0,0,0,0.55)");
      ctx.fillStyle=term;
      ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.fill();

      ctx.restore();

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();

})();