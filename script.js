// Footer yılı
const y = document.getElementById("year");
if (y) y.textContent = new Date().getFullYear();

// Uzmanlık paneli aç/kapat
const btn = document.getElementById("toggleExpertise");
const panel = document.getElementById("expertisePanel");

if (btn && panel) {
  btn.addEventListener("click", () => {
    const isHidden = panel.hasAttribute("hidden");
    if (isHidden) {
      panel.removeAttribute("hidden");
      btn.textContent = "Gizle";
    } else {
      panel.setAttribute("hidden", "");
      btn.textContent = "Tümünü Göster";
    }
  });
}

// İletişim formu demo
function fakeSubmit(e){
  e.preventDefault();
  const msg = document.getElementById("formMsg");
  if (msg) msg.textContent = "Mesaj alındı (demo). GitHub Pages üzerinde sunucu olmadığı için gönderim yapılmaz.";
  return false;
}

// Premium Leaflet harita yardımcı fonksiyonu
function initPremiumLeafletMap(containerId, opts) {
  if (typeof L === "undefined") return; // Leaflet yüklenmediyse çık
  const el = document.getElementById(containerId);
  if (!el) return;

  const center = opts.center || [40.6013, 33.6134];
  const zoom = opts.zoom ?? 12;

  const map = L.map(containerId, {
    scrollWheelZoom: opts.scrollWheelZoom ?? false,
    zoomControl: opts.zoomControl ?? true,
    dragging: opts.dragging ?? true,
    attributionControl: opts.attributionControl ?? true
  }).setView(center, zoom);

  // Koyu tema (Carto Dark Matter)
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap katkıcıları, &copy; CARTO'
  }).addTo(map);

  // Premium marker (divIcon)
  const icon = L.divIcon({
    className: "premium-marker",
    html: '<span class="premium-marker__dot"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  const marker = L.marker(center, { icon }).addTo(map);

  if (opts.popupHtml) {
    marker.bindPopup(opts.popupHtml, { closeButton: false, offset: [0, -4] });
    if (opts.openPopup) marker.openPopup();
  }

  if (opts.circleRadius) {
    L.circle(center, { radius: opts.circleRadius, className: "premium-circle" }).addTo(map);
  }

  // Harita içinde scroll ile sayfa kaymasını engellemek için:
  map.on("focus", () => map.scrollWheelZoom.enable());
  map.on("blur", () => map.scrollWheelZoom.disable());

  return map;
}
