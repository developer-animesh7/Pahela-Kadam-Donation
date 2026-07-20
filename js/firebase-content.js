/**
 * Firebase Content Loader for Main Website
 * Fetches gallery items and campaigns from Firestore and renders them.
 * If demo data exists in localStorage, uses that instead (demo mode).
 * Uses one-time getDocs() fetch with offline persistence for performance.
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

const DEMO_KEYS = {
  gallery: "demo_gallery_items",
  campaigns: "demo_campaign_items",
  pageImages: "demo_page_images",
  coverflow: "demo_coverflow_slides",
};

function getDemoData(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isDemoMode() {
  return !!(
    getDemoData(DEMO_KEYS.gallery) ||
    getDemoData(DEMO_KEYS.campaigns) ||
    getDemoData(DEMO_KEYS.pageImages) ||
    getDemoData(DEMO_KEYS.coverflow)
  );
}

// ==========================================
// GALLERY LOADER
// ==========================================

export async function loadGalleryItems() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  try {
    let items;
    const demoData = getDemoData(DEMO_KEYS.gallery);
    if (demoData) {
      items = demoData.sort((a, b) => (a.order || 0) - (b.order || 0));
    } else {
      const q = query(collection(db, "galleryItems"), orderBy("order", "asc"));
      const snap = await getDocs(q);
      items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    }

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

  try {
    let items;
    const demoData = getDemoData(DEMO_KEYS.campaigns);
    if (demoData) {
      items = demoData.sort((a, b) => (a.order || 0) - (b.order || 0));
    } else {
      const q = query(collection(db, "campaigns"), orderBy("order", "asc"));
      const snap = await getDocs(q);
      items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    }

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
              <a href="https://razorpay.me/@narayanicharitabletrust" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-full" style="justify-content:center;font-size:var(--text-xs);padding:0.7rem var(--space-4);">
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
// COVERFLOW SLIDES LOADER
// ==========================================

export async function loadCoverflowSlides() {
  const track = document.getElementById("coverflowTrack");
  if (!track) return;

  let items = [];
  try {
    const demoData = getDemoData(DEMO_KEYS.coverflow);
    if (demoData) {
      items = demoData.sort((a, b) => (a.order || 0) - (b.order || 0));
    } else {
      const q = query(
        collection(db, "coverflowSlides"),
        orderBy("order", "asc"),
      );
      const snap = await getDocs(q);
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.error("[Firebase Content] Coverflow load error:", err);
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
// PAGE IMAGES LOADER (Contact & Internship)
// ==========================================

export async function loadPageImages() {
  const pageImageEls = document.querySelectorAll("[data-page-image]");
  if (pageImageEls.length === 0) return;

  let images = {};
  try {
    const demoData = getDemoData(DEMO_KEYS.pageImages);
    if (demoData && typeof demoData === "object") {
      images = demoData;
    } else {
      const snap = await getDoc(doc(db, "pageImages", "images"));
      images = snap.exists() ? snap.data() : {};
    }
  } catch (err) {
    console.error("[Firebase Content] Page images load error:", err);
    return;
  }

  pageImageEls.forEach((el) => {
    const key = el.getAttribute("data-page-image");
    if (images[key]) {
      if (el.tagName === "IMG") {
        el.src = images[key];
      } else {
        el.style.backgroundImage = `url("${images[key]}")`;
      }
    }
  });
}

// ==========================================
// AUTO-INIT ON DOMContentLoaded
// ==========================================

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

  loadPageImages();
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
    cafe: "Nayi Udaan Cafe",
    activities: "School Activities",
    events: "Events & Rallies",
    camps: "Therapy & Camps",
    festivals: "Festivals",
  };
  return labels[cat] || cat;
}
