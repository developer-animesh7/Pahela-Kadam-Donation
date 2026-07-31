/**
 * Firebase Content Loader for Main Website
 * Fetches gallery items, campaigns, coverflow, and page images from Firestore.
 * Uses memory-only cache (no persistent IndexedDB) — fresh data on every
 * page load, fast within-session caching for repeat reads.
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

// ==========================================
// GALLERY LOADER
// ==========================================

export async function loadGalleryItems() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  try {
    let items;
    const snap = await getDocs(collection(db, "galleryItems"));
    items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (items.length === 0) {
      grid.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:var(--space-12);color:var(--text-muted);font-style:italic;">No gallery items available yet.</div>';
      return;
    }

    grid.innerHTML = items
      .map((item, i) => {
        const bento = item.bentoClass ? " " + item.bentoClass : "";
        const delay = Math.min(i * 50, 600);
        return `
        <div class="gallery-item show${bento}" style="animation-delay:${delay}ms" data-category="${escapeAttr(item.category || "")}">
          <div class="gallery-card-img-wrap">
            <span class="card-category-tag">${escapeHtml(item.categoryLabel || categoryLabel(item.category || ""))}</span>
            <img src="${escapeAttr(item.imageUrl || "")}" alt="${escapeAttr(item.title || "")}" loading="lazy" decoding="async">
            <div class="expand-indicator">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </div>
          </div>
          <div class="gallery-card-content">
            <h3>${escapeHtml(item.title || "")}</h3>
            <p>${escapeHtml(item.description || "")}</p>
            <span>${escapeHtml(item.date || "")}</span>
          </div>
        </div>`;
      })
      .join("");

    // Re-trigger scroll reveal if engine exists
    if (window.ScrollRevealEngine) {
      window.ScrollRevealEngine.init();
    }

    // Re-initialize lightbox for new items
    if (window.initGalleryLightbox) {
      window.initGalleryLightbox();
    }
  } catch (err) {
    console.error("[Firebase Content] Gallery load error:", err);
    grid.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:var(--space-12);color:var(--text-muted);font-style:italic;">Unable to load gallery. Please check back later.</div>';
  }
}

// ==========================================
// CAMPAIGN LOADER
// ==========================================

export async function loadCampaigns() {
  const container = document.getElementById("campaignContainer");
  if (!container) return;

  const limit = parseInt(container.getAttribute("data-limit") || "0", 10);

  try {
    let items;
    const snap = await getDocs(collection(db, "campaigns"));
    items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (limit > 0) items = items.slice(0, limit);

    if (items.length === 0) {
      container.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:var(--space-12);color:var(--text-muted);font-style:italic;">No active campaigns yet.</div>';
      return;
    }

    container.innerHTML = items
      .map((item) => {
        const pct =
          item.goal > 0
            ? Math.min(Math.round((item.raised / item.goal) * 100), 100)
            : 0;
        const daysLabel =
          item.daysLeft <= 8
            ? `<span style="font-weight:600;color:var(--warning);">${item.daysLeft} Days Left</span>`
            : `<span style="font-weight:600;color:var(--text-secondary);">${item.daysLeft} Days Left</span>`;
        return `
        <div class="campaign-card campaigns-card-hover reveal" style="background:#ffffff;border:1px solid var(--border-color);border-radius:var(--radius-xl);overflow:hidden;display:flex;flex-direction:column;transition:transform 250ms ease-out,box-shadow 250ms ease-out;box-shadow:var(--shadow-sm);">
          <div style="position:relative;overflow:hidden;aspect-ratio:16/10;">
            <img src="${escapeAttr(item.imageUrl || "")}" alt="${escapeAttr(item.title || "")}" class="campaigns-card-img" style="width:100%;height:100%;object-fit:cover;transition:transform 250ms ease-out;will-change:transform;" loading="lazy" decoding="async">
            <span style="position:absolute;top:var(--space-3);left:var(--space-3);background:rgba(15,25,35,0.75);backdrop-filter:blur(4px);color:#ffffff;font-size:10px;font-weight:700;padding:4px 10px;border-radius:var(--radius-full);text-transform:uppercase;">${escapeHtml(item.tag || "")}</span>
          </div>
          <div style="padding:var(--space-5);display:flex;flex-direction:column;flex-grow:1;gap:var(--space-4);">
            <div>
              <h3 style="font-size:var(--text-base);font-weight:700;color:var(--text-primary);margin:0 0 var(--space-2);line-height:1.3;">${escapeHtml(item.title || "")}</h3>
              <p style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.7;margin:0;font-style:italic;">"${escapeHtml(item.tagline || "")}"</p>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;margin-bottom:var(--space-1);font-weight:600;">
                <span style="color:var(--text-primary);">₹${(item.raised || 0).toLocaleString("en-IN")} <span style="color:var(--text-secondary);font-weight:400;">Raised</span></span>
                <span style="color:var(--primary);font-weight:700;">${pct}%</span>
              </div>
              <div style="width:100%;height:6px;background-color:var(--border-light);border-radius:var(--radius-full);overflow:hidden;">
                <div class="progress-fill" data-percent="${pct}" style="width:0%;height:100%;background:var(--gradient-primary);border-radius:var(--radius-full);transition:width 1s cubic-bezier(0.16,1,0.3,1);"></div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--text-muted);margin-top:4px;">
                <span>Goal: ₹${(item.goal || 0).toLocaleString("en-IN")}</span>
                ${daysLabel}
              </div>
            </div>
            <div style="margin-top:auto;">
              <a href="https://razorpay.me/@narayanicharitabletrust" data-donate-link target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-full" style="justify-content:center;font-size:var(--text-xs);padding:0.7rem var(--space-4);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span>Donate Now</span>
              </a>
            </div>
          </div>
        </div>`;
      })
      .join("");

    // Animate progress bars
    setTimeout(() => {
      container.querySelectorAll(".progress-fill").forEach((bar) => {
        bar.style.width = bar.getAttribute("data-percent") + "%";
      });
    }, 300);

    // Re-trigger scroll reveal
    if (window.ScrollRevealEngine) {
      window.ScrollRevealEngine.init();
    }
  } catch (err) {
    console.error("[Firebase Content] Campaigns load error:", err);
    container.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:var(--space-12);color:var(--text-muted);font-style:italic;">Unable to load campaigns. Please check back later.</div>';
  }
}

// ==========================================
// PARTNERS & SUPPORTERS LOADER
// ==========================================

export async function loadPartners() {
  const track = document.getElementById("partnersTrack");
  if (!track) return;

  try {
    const snap = await getDocs(collection(db, "partners"));
    let items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

    // Only active partners, sorted by display order
    items = items
      .filter((item) => item.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // If Firestore has no partner docs yet, keep the static fallback
    // markup already in the DOM instead of showing an empty section.
    if (items.length === 0) return;

    const cardHtml = (item) => `
        <div class="partner-card">
          <img src="${escapeAttr(item.imageUrl || "")}" alt="${escapeAttr(item.name || "")}" class="partner-logo" loading="lazy" decoding="async">
        </div>`;

    // Render the set twice back-to-back so the CSS marquee keyframe
    // (translateX(-50%)) loops seamlessly, matching the original markup.
    track.innerHTML = items.map(cardHtml).join("") + items.map(cardHtml).join("");
  } catch (err) {
    console.error("[Firebase Content] Partners load error:", err);
  }
}

// ==========================================
// FEATURED CAMPAIGN LOADER
// ==========================================

export async function loadFeaturedCampaign() {
  const container = document.getElementById("featuredCampaignSection");
  if (!container) return;

  let item = null;
  try {
    const snap = await getDoc(doc(db, "featuredCampaign", "current"));
    if (snap.exists()) item = snap.data();
  } catch (err) {
    console.error("[Firebase Content] Featured campaign load error:", err);
  }

  if (!item) {
    container.style.display = "none";
    return;
  }

  const pct =
    item.goal > 0
      ? Math.min(Math.round((item.raised / item.goal) * 100), 100)
      : 0;
  const daysLabel =
    item.daysLeft <= 8
      ? `<span style="font-weight:600;color:var(--warning);">${item.daysLeft} Days Left</span>`
      : `<span style="font-weight:600;color:var(--text-secondary);">${item.daysLeft} Days Left</span>`;

  container.innerHTML = `
    <div class="container">
      <div style="margin-bottom: var(--space-5)">
        <span class="text-muted-label" style="color: var(--accent); font-weight: 700">FEATURED CAMPAIGN</span>
      </div>
      <div class="featured-card reveal">
        <div class="featured-card-img-wrap">
          <img src="${escapeAttr(item.imageUrl || "")}" alt="${escapeAttr(item.title || "")}" class="featured-card-img" loading="lazy" decoding="async" />
          <span style="position:absolute;top:var(--space-4);left:var(--space-4);background:rgba(15,25,35,0.8);backdrop-filter:blur(4px);color:#ffffff;font-size:10px;font-weight:700;padding:4px 10px;border-radius:var(--radius-full);text-transform:uppercase;">${escapeHtml(item.tag || "")}</span>
        </div>
        <div style="padding:var(--space-5) var(--space-6);display:flex;flex-direction:column;justify-content:center;gap:var(--space-4);">
          <div>
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);">
              <span style="display:inline-flex;align-items:center;gap:3px;font-size:9px;font-weight:700;color:var(--accent);background:var(--accent-soft);padding:2px 6px;border-radius:var(--radius-sm);text-transform:uppercase;">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12" /></svg>
                Verified Campaign
              </span>
            </div>
            <h2 style="font-size:var(--text-xl);font-weight:800;color:var(--primary-dark);margin:0;line-height:1.25;">${escapeHtml(item.title || "")}</h2>
            <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.7;margin-top:var(--space-3);font-style:italic;">"${escapeHtml(item.tagline || "")}"</p>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;margin-bottom:var(--space-1);font-weight:600;">
              <span style="color:var(--text-primary);">₹${(item.raised || 0).toLocaleString("en-IN")} <span style="color:var(--text-secondary);font-weight:400;">Raised</span></span>
              <span style="color:var(--primary);font-weight:700;">${pct}%</span>
            </div>
            <div style="width:100%;height:6px;background-color:var(--border-light);border-radius:var(--radius-full);overflow:hidden;">
              <div class="progress-fill" data-percent="${pct}" style="width:0%;height:100%;background:var(--gradient-primary);border-radius:var(--radius-full);transition:width 1s cubic-bezier(0.16,1,0.3,1);"></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--text-muted);margin-top:4px;">
              <span>Goal: ₹${(item.goal || 0).toLocaleString("en-IN")}</span>
              ${daysLabel}
            </div>
          </div>
          <a href="https://razorpay.me/@narayanicharitabletrust" data-donate-link target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-lg" style="align-self:flex-start;justify-content:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span>Donate Now</span>
          </a>
        </div>
      </div>
    </div>`;

  // Animate progress bar
  setTimeout(() => {
    container.querySelectorAll(".progress-fill").forEach((bar) => {
      bar.style.width = bar.getAttribute("data-percent") + "%";
    });
  }, 300);

  // Re-trigger scroll reveal
  if (window.ScrollRevealEngine) {
    window.ScrollRevealEngine.init();
  }
}

// ==========================================
// COVERFLOW SLIDES LOADER
// ==========================================

export async function loadCoverflowSlides() {
  const track = document.getElementById("coverflowTrack");
  if (!track) return;

  let items = [];
  try {
    const snap = await getDocs(collection(db, "coverflowSlides"));
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    items.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.error("[Firebase Content] Coverflow load error:", err);
  }

  if (items.length === 0) {
    track.innerHTML =
      '<div style="color:var(--text-muted);padding:2rem;text-align:center;">No coverflow slides.</div>';
    return;
  }

  track.innerHTML = items
    .map((item) => {
      const fetchPriority =
        item.imageUrl && item.imageUrl.includes("president")
          ? 'fetchpriority="high"'
          : "";
      return `<div class="coverflow-slide" data-title="${escapeAttr(item.title || "")}" data-desc="${escapeAttr(item.desc || "")}">
        <img src="${escapeAttr(item.imageUrl || "")}" alt="${escapeAttr(item.title || "")}" loading="lazy" decoding="async" ${fetchPriority} />
      </div>`;
    })
    .join("");

  if (window.initCoverflow) {
    window.initCoverflow();
  }
}

// ==========================================
// FACILITIES LOADER (Therapies & Rehabilitation)
// Renders cards from Firestore. Each img gets data-page-image attribute
// so the shared page images system applies image overrides automatically.
// ==========================================

export async function loadFacilities() {
  const grid = document.getElementById("facilityGrid");
  if (!grid) return;

  try {
    const snap = await getDocs(collection(db, "facilities"));
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (items.length === 0) {
      // No Firestore data — keep static HTML cards as fallback
      return;
    }

    grid.innerHTML = items
      .map((item) => {
        const icon = item.icon ? escapeHtml(item.icon) : "";
        const hoverTitle = escapeHtml(item.title || "");
        const title = escapeHtml(item.title || "");
        const desc = escapeHtml(item.description || "");
        const badge = escapeHtml(item.badge || "Therapy");
        const pageImageKey = escapeAttr(item.pageImageKey || "");
        // Fallback: use imageUrl from old schema if pageImageKey is missing
        const fallbackSrc = item.imageUrl
          ? escapeAttr(item.imageUrl.replace(/ /g, "%20"))
          : "";
        const imgAlt = escapeAttr(item.title || "");
        const imgAttrs = pageImageKey
          ? `src="" data-page-image="${pageImageKey}"`
          : `src="${fallbackSrc}"`;
        return `
        <div class="facility-card reveal">
          <div class="facility-card-image">
            <img ${imgAttrs} alt="${imgAlt}" loading="lazy" class="lazy-img" />
            <span class="facility-icon-overlay">${icon}</span>
            <span class="facility-hover-title">${hoverTitle}</span>
          </div>
          <div class="facility-card-content">
            <h4>${title}</h4>
            <p>${desc}</p>
            <span class="facility-badge">${badge}</span>
          </div>
        </div>`;
      })
      .join("");

    // Re-trigger scroll reveal if engine exists
    if (window.ScrollRevealEngine) {
      window.ScrollRevealEngine.init();
    }

    // Apply lazy-load to dynamically inserted images
    // (the about.html IntersectionObserver only runs on DOMContentLoaded,
    //  so images added later by Firestore never get the "loaded" class)
    grid.querySelectorAll(".lazy-img").forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add("loaded");
      } else {
        img.addEventListener("load", () => img.classList.add("loaded"));
        img.addEventListener("error", () => img.classList.add("loaded"));
      }
    });

    // The shared page images system (loadPageImages) will apply image
    // overrides via MutationObserver when these elements appear.
  } catch (err) {
    console.error("[Firebase Content] Facilities load error:", err);
    // Keep static HTML cards as fallback on error
  }
}

// ==========================================
// PAGE IMAGES LOADER (Contact & Internship)
// ==========================================

// Page Images — fetch from Firestore once, then apply to all matching elements.
// Uses MutationObserver so images inside late-loading components (hero, navbar)
// are updated automatically when they appear — same reliability as campaigns.
export async function loadPageImages() {
  let images = {};
  try {
    const snap = await getDoc(doc(db, "pageImages", "images"));
    images = snap.exists() ? snap.data() : {};
  } catch (err) {
    console.error("[Firebase Content] Page images load error:", err);
    // On error, reveal fallback images so page isn't blank
    document
      .querySelectorAll("[data-page-image]")
      .forEach((el) => el.classList.add("img-loaded"));
    return;
  }

  // Apply images to any elements that exist right now
  applyPageImages(images);

  // Watch for future elements (hero component, navbar, etc. loaded later)
  const observer = new MutationObserver(() => applyPageImages(images));
  observer.observe(document.body, { childList: true, subtree: true });
  // Stop observing after 5 seconds to avoid memory leaks
  setTimeout(() => observer.disconnect(), 5000);

  // Reveal any elements that have no Firestore image (use fallback) immediately.
  // Skip elements with a pending override (img-override) — those reveal on load.
  requestAnimationFrame(() => {
    document
      .querySelectorAll("[data-page-image]:not(.img-loaded):not(.img-override)")
      .forEach((el) => el.classList.add("img-loaded"));
  });
}

function applyPageImages(images) {
  const els = document.querySelectorAll("[data-page-image]");
  els.forEach((el) => {
    const key = el.getAttribute("data-page-image");
    if (images[key]) {
      const url = images[key];
      el.classList.add("img-override");
      if (el.tagName === "IMG") {
        // Already showing the target image — just reveal
        if (el.src === url) {
          el.classList.add("img-loaded");
          return;
        }
        // Preload the Firestore image, then swap src seamlessly.
        // The fallback stays visible until the new image is ready,
        // then a quick fade prevents any visible flash.
        const preloader = new Image();
        preloader.onload = () => {
          el.classList.add("img-swapping");
          el.src = url;
          // Brief fade: hide old, then fade in new on next frame
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.classList.remove("img-swapping");
              el.classList.add("img-loaded", "img-fade-in");
            });
          });
        };
        preloader.onerror = () => {
          // If preload fails, keep the fallback and reveal it
          el.classList.add("img-loaded");
        };
        preloader.src = url;
      } else {
        el.style.backgroundImage = `url("${url}")`;
        el.classList.add("img-loaded");
      }
    } else if (
      !el.classList.contains("img-loaded") &&
      !el.classList.contains("img-override")
    ) {
      // No override for this key — reveal the fallback immediately
      el.classList.add("img-loaded");
    }
  });
}

// ==========================================
// DONATE LINK LOADER
// ==========================================

export async function loadDonateLink() {
  const DEFAULT_DONATE_URL = "https://razorpay.me/@narayanicharitabletrust";

  let url = DEFAULT_DONATE_URL;
  try {
    const snap = await getDoc(doc(db, "siteSettings", "donateLink"));
    if (snap.exists()) url = snap.data().url;
  } catch (err) {
    console.error("[Firebase Content] Donate link load error:", err);
  }

  // Apply to any links that exist right now
  applyDonateLink(url);

  // Watch for future elements (navbar, hero, campaign cards loaded later)
  const observer = new MutationObserver(() => applyDonateLink(url));
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 5000);
}

function applyDonateLink(url) {
  document.querySelectorAll("[data-donate-link]").forEach((el) => {
    el.href = url;
  });
}

// ==========================================
// GOVERNMENT SUPPORT LOADER
// ==========================================

export async function loadGovSupport() {
  const container = document.getElementById("govSupportGrid");
  if (!container) return;

  try {
    const snap = await getDocs(collection(db, "govSupport"));
    let items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    items = items.filter((item) => item.active !== false);
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (items.length === 0) return; // keep fallback HTML

    container.innerHTML = items
      .map(
        (item) => `<div class="gov-card reveal">
  <span class="gov-value"><span class="counter" data-target="${item.value}">0</span>+</span>
  <span class="gov-label">${escapeHtml(item.title)}</span>
</div>`,
      )
      .join("");

    if (window.ScrollRevealEngine) window.ScrollRevealEngine.refresh();
  } catch (err) {
    console.error("Error loading gov support:", err);
  }
}

// ==========================================
// TEAM STATISTICS LOADER
// ==========================================

export async function loadTeamStats() {
  const container = document.getElementById("teamStatsGrid");
  if (!container) return;

  try {
    const snap = await getDocs(collection(db, "teamStats"));
    let items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    items = items.filter((item) => item.active !== false);
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (items.length === 0) return; // keep fallback HTML

    container.innerHTML = items
      .map(
        (item) => `<div class="team-stat-card${item.isHighlight ? " is-highlight" : ""} reveal">
  <span class="team-stat-value"><span class="counter" data-target="${item.value}">0</span></span>
  <span class="team-stat-label">${escapeHtml(item.title)}</span>
</div>`,
      )
      .join("");

    if (window.ScrollRevealEngine) window.ScrollRevealEngine.refresh();
  } catch (err) {
    console.error("Error loading team stats:", err);
  }
}

// ==========================================
// HERO STATISTICS LOADER
// ==========================================

export async function loadHeroStats() {
  const container = document.getElementById("heroStatsRow");
  if (!container) return;

  try {
    const snap = await getDocs(collection(db, "heroStats"));
    let items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    items = items.filter((item) => item.active !== false);
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (items.length === 0) return; // keep fallback HTML

    container.innerHTML = items
      .map(
        (item) => `<div class="stat-item">
  <div class="stat-count d-flex" style="color: var(--primary)">
    <span class="counter" data-target="${item.value}">0</span>
    <span>${escapeHtml(item.suffix || "+")}</span>
  </div>
  <span class="stat-label">${escapeHtml(item.label)}</span>
</div>`,
      )
      .join("");

    if (window.ScrollRevealEngine) window.ScrollRevealEngine.refresh();
  } catch (err) {
    console.error("Error loading hero stats:", err);
  }
}

// Expose to window so app.js and component lifecycle hooks can call them reliably
window.loadHeroStats = loadHeroStats;
window.loadGovSupport = loadGovSupport;
window.loadTeamStats = loadTeamStats;

// ==========================================
// AUTO-INIT ON DOMContentLoaded
// ==========================================

// Inject CSS: hide only background-image elements (no fallback) until loaded.
// IMG elements with a src fallback remain visible — their src is swapped
// seamlessly after the Firestore image preloads, with a fade transition.
const hideStyle = document.createElement("style");
hideStyle.textContent =
  "[data-page-image]:not(img):not(.img-loaded){opacity:0;transition:opacity 0.4s ease-out;}" +
  "[data-page-image].img-loaded{opacity:1;}" +
  "img[data-page-image].img-swapping{opacity:0;transition:opacity 0.3s ease-out !important;}" +
  "img[data-page-image].img-fade-in{opacity:1;transition:opacity 0.3s ease-out !important;}";
(document.head || document.documentElement).appendChild(hideStyle);

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("galleryGrid");
  const campaignContainer = document.getElementById("campaignContainer");

  if (grid) {
    // Show loading skeleton
    grid.innerHTML = Array(6)
      .fill(
        '<div class="gallery-item show" style="min-height:280px;"><div class="gallery-card-img-wrap" style="background:#f1f5f9;animation:pulse 1.5s ease-in-out infinite;"></div></div>',
      )
      .join("");
    loadGalleryItems();
  }

  loadCoverflowSlides();

  if (campaignContainer) {
    campaignContainer.innerHTML = Array(3)
      .fill(
        '<div class="campaign-card" style="background:#f1f5f9;border-radius:var(--radius-xl);min-height:380px;animation:pulse 1.5s ease-in-out infinite;"></div>',
      )
      .join("");
    loadCampaigns();
  }

  loadFeaturedCampaign();
  loadFacilities();
  loadPageImages();
  loadDonateLink();
  loadPartners();
  loadGovSupport();
  loadTeamStats();
  // loadHeroStats() is intentionally NOT called here.
  // #heroStatsRow is inside components/hero.html which is fetched async by
  // ComponentLoaderInstance.loadAll() in app.js. Calling loadHeroStats() here
  // races against that fetch and finds the container null, silently returning.
  // Instead, app.js calls window.loadHeroStats() after loadAll() completes.
});

// ==========================================
// HELPERS
// ==========================================

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function categoryLabel(cat) {
  const labels = {
    activities: "School Activities",
    events: "Events & Rallies",
    camps: "Therapy & Camps",
    festivals: "Festivals",
  };
  return labels[cat] || cat;
}
