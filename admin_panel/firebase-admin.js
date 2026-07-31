/**
 * Firebase Admin Panel Logic
 * Handles: Google Auth, Gallery CRUD, Campaign CRUD, Image Upload with Compression
 */

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { auth, db, provider } from "/js/firebase-config.js";

// Cloudflare Worker URL — handles GitHub uploads server-side (token is hidden)
const UPLOAD_WORKER_URL =
  "https://pahelakadm-uploader.pahelakadam.workers.dev/upload";

// Whitelisted admin emails
const ADMIN_EMAILS = ["pahelakadamweb@gmail.com"];

let currentUser = null;
let activeTab = "home";
let galleryItems = [];
let campaignItems = [];
let pageImages = {};
let coverflowItems = [];
let facilityItems = [];
let editingId = null;
let editingPageKey = null;

const PAGE_IMAGE_DEFS = {
  home_hero: "Hero Image (Child in Classroom)",
  home_about: "About Us Section Image",
  home_mission: "Our Vision & Goals Section Image",
  about_founder: "Founder Photo (Anita Agarwal)",
  about_founder_president: "Founder with President of India",
  about_helping_today: "Helping Today Image",
  about_our_mission: "Our Mission Image",
  about_facility_speech: "Facility: Speech Therapy",
  about_facility_occupational: "Facility: Occupational Therapy",
  about_facility_water: "Facility: Water Therapy",
  about_facility_physiotherapy: "Facility: Physiotherapy",
  about_facility_art_craft: "Facility: Art & Craft",
  about_facility_dance_music: "Facility: Dance & Music",
  about_facility_smart_classroom: "Facility: Smart Classroom",
  about_facility_computer_lab: "Facility: Computer Lab",
  about_facility_library: "Facility: Library",
  about_facility_sports: "Facility: Sports",
  about_facility_parent_awareness: "Facility: Parent Awareness",
  about_facility_vocational: "Facility: Vocational Training",
  about_facility_doctor: "Facility: Doctor Chamber",
  about_facility_audiology: "Facility: Audiology",
  about_facility_sensory: "Facility: Sensory Therapy",
  contact_founder: "Founder Photo",
  contact_facility_cafe: "Facility: Nayi Udaan Cafe",
  contact_facility_classroom: "Facility: Special Classrooms",
  contact_facility_therapy: "Facility: Pediatric Therapy",
  contact_facility_sports: "Facility: Inclusion Sports",
  internship_hero: "Internship Hero Image",
  internship_track_speech: "Track: Speech Therapy",
  internship_track_occupational: "Track: Occupational Therapy",
  internship_track_behaviour: "Track: Behaviour Modification",
  internship_track_physiotherapy: "Track: Child Physiotherapy",
  internship_track_education: "Track: Special Education",
  internship_track_vocational: "Track: Vocational Training",
  internship_track_adl: "Track: ADL Training",
  internship_track_aqua: "Track: Aqua Therapy",
  internship_track_counselling: "Track: Counselling",
  internship_gallery_1: "Gallery: Therapy Observation",
  internship_gallery_2: "Gallery: Sensory Integration",
  internship_gallery_3: "Gallery: Special Education Class",
  internship_gallery_4: "Gallery: Vocational Rehabilitation",
};

// Default fallback images (the hardcoded ones from the website)
const PAGE_IMAGE_DEFAULTS = {
  home_hero: "/assets/images/hero/child image.png",
  home_about: "/assets/images/hero/about us.png",
  home_mission: "/assets/images/hero/our missions.png",
  about_helping_today: "/assets/images/stories/helping today .png",
  about_our_mission: "/assets/images/stories/our mission.png",
  about_founder: "/assets/images/founder/Anita Agarwal.png",
  about_founder_president: "/assets/images/founder/with president.png",
  about_facility_speech: "/assets/images/facilities/speech thraphy.png",
  about_facility_occupational: "/assets/images/facilities/occu theraphy.png",
  about_facility_water: "/assets/images/facilities/water theraphy.png",
  about_facility_physiotherapy: "/assets/images/facilities/Physiotherapy.png",
  about_facility_art_craft: "/assets/images/facilities/art and craft.png",
  about_facility_dance_music: "/assets/images/facilities/dance and music.png",
  about_facility_smart_classroom:
    "/assets/images/facilities/smart classroom.png",
  about_facility_computer_lab: "/assets/images/facilities/computer lab.png",
  about_facility_library: "/assets/images/facilities/librariry.png",
  about_facility_sports: "/assets/images/facilities/sports.png",
  about_facility_parent_awareness:
    "/assets/images/facilities/parent awareness.png",
  about_facility_vocational:
    "/assets/images/facilities/vocational training.png",
  about_facility_doctor: "/assets/images/facilities/dr chember.png",
  about_facility_audiology: "/assets/images/facilities/audiology.png",
  about_facility_sensory: "/assets/images/facilities/sensor theraphy.png",
  contact_founder: "/assets/images/founder/Anita Agarwal.png",
  contact_facility_cafe: "/assets/images/gallery/journey_inauguration_1.png",
  contact_facility_classroom: "/assets/images/gallery/report_classroom_4.png",
  contact_facility_therapy: "/assets/images/gallery/report_therapy_2.png",
  contact_facility_sports: "/assets/images/gallery/journey_event_4.png",
  internship_hero: "/assets/images/gallery/report_classroom_4.png",
  internship_track_speech: "/assets/images/facilities/speech thraphy.png",
  internship_track_occupational: "/assets/images/facilities/occu theraphy.png",
  internship_track_behaviour: "/assets/images/facilities/dr chember.png",
  internship_track_physiotherapy: "/assets/images/facilities/Physiotherapy.png",
  internship_track_education: "/assets/images/facilities/smart classroom.png",
  internship_track_vocational:
    "/assets/images/facilities/vocational training.png",
  internship_track_adl: "/assets/images/facilities/helping t help t.png",
  internship_track_aqua: "/assets/images/facilities/aqua theraphy.png",
  internship_track_counselling:
    "/assets/images/facilities/parent awareness.png",
  internship_gallery_1: "/assets/images/gallery/report_therapy_2.png",
  internship_gallery_2: "/assets/images/gallery/report_child_learning_1.jpeg",
  internship_gallery_3: "/assets/images/gallery/journey_classroom_3.jpeg",
  internship_gallery_4: "/assets/images/gallery/journey_activity_special.jpeg",
};

// ==========================================
// AUTH
// ==========================================

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (ADMIN_EMAILS.includes(user.email)) {
      currentUser = user;
      showDashboard(user);
      loadAllData();
    } else {
      currentUser = null;
      showLoginError("Access denied. Your email is not authorized.");
      signOut(auth);
    }
  } else {
    currentUser = null;
    showLogin();
  }
});

function handleGoogleLogin() {
  signInWithPopup(auth, provider).catch((err) => {
    showLoginError("Sign-in failed: " + err.message);
  });
}

function handleLogout() {
  signOut(auth);
  currentUser = null;
  showLogin();
}

// ==========================================
// UI STATE MANAGEMENT
// ==========================================

function showLogin() {
  document.getElementById("login-view").style.display = "flex";
  document.getElementById("dashboard-view").style.display = "none";
  document.getElementById("login-error").style.display = "none";
}

function showLoginError(msg) {
  const el = document.getElementById("login-error");
  el.textContent = msg;
  el.style.display = "block";
}

function showDashboard(user) {
  document.getElementById("login-view").style.display = "none";
  document.getElementById("dashboard-view").style.display = "block";
  document.getElementById("admin-email").textContent = user.email;
  document.getElementById("admin-avatar").src =
    user.photoURL ||
    "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.email);
}

function switchTab(tab) {
  activeTab = tab;
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add("active");
  document
    .querySelectorAll(".tab-panel")
    .forEach((p) => (p.style.display = "none"));
  document.getElementById(`tab-${tab}`).style.display = "block";
}

// ==========================================
// DATA LOADING
// ==========================================

async function loadAllData() {
  await Promise.all([
    loadGalleryItems(),
    loadCampaignItems(),
    loadFeaturedCampaign(),
    loadPageImages(),
    loadCoverflowItems(),
    loadFacilityItems(),
    loadDonateLink(),
  ]);
}

async function loadGalleryItems() {
  try {
    const snap = await getDocs(collection(db, "galleryItems"));
    galleryItems = [];
    snap.forEach((d) => galleryItems.push({ id: d.id, ...d.data() }));
    galleryItems.sort((a, b) => (a.order || 0) - (b.order || 0));
    renderGalleryTable();
  } catch (err) {
    console.error("Error loading gallery:", err);
    document.getElementById("gallery-table-body").innerHTML =
      '<tr><td colspan="5" class="admin-empty">Failed to load. Check Firebase config.</td></tr>';
  }
}

async function loadCampaignItems() {
  try {
    const snap = await getDocs(collection(db, "campaigns"));
    campaignItems = [];
    snap.forEach((d) => campaignItems.push({ id: d.id, ...d.data() }));
    campaignItems.sort((a, b) => (a.order || 0) - (b.order || 0));
    renderCampaignTable();
  } catch (err) {
    console.error("Error loading campaigns:", err);
    document.getElementById("campaign-table-body").innerHTML =
      '<tr><td colspan="5" class="admin-empty">Failed to load. Check Firebase config.</td></tr>';
  }
}

// ==========================================
// GALLERY TABLE RENDER
// ==========================================

function renderGalleryTable() {
  const tbody = document.getElementById("gallery-table-body");
  if (galleryItems.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="admin-empty">No gallery items yet. Click "Add New" to create one.</td></tr>';
    return;
  }
  tbody.innerHTML = galleryItems
    .map(
      (item) => `
    <tr>
      <td><img src="${item.imageUrl || ""}" alt="" class="admin-thumb" onerror="this.style.opacity=0"></td>
      <td>${escapeHtml(item.title || "")}</td>
      <td>${escapeHtml(item.category || "")}</td>
      <td>${escapeHtml(item.date || "")}</td>
      <td class="admin-actions">
        <button class="btn-edit" onclick="window.adminAPI.editGallery('${item.id}')">Edit</button>
        <button class="btn-delete" onclick="window.adminAPI.deleteGallery('${item.id}')">Delete</button>
      </td>
    </tr>`,
    )
    .join("");
}

// ==========================================
// CAMPAIGN TABLE RENDER
// ==========================================

function renderCampaignTable() {
  const tbody = document.getElementById("campaign-table-body");
  if (campaignItems.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="admin-empty">No campaigns yet. Click "Add New" to create one.</td></tr>';
    return;
  }
  tbody.innerHTML = campaignItems
    .map(
      (item) => `
    <tr>
      <td><img src="${item.imageUrl || ""}" alt="" class="admin-thumb" onerror="this.style.opacity=0"></td>
      <td>${escapeHtml(item.title || "")}</td>
      <td>₹${(item.raised || 0).toLocaleString("en-IN")}</td>
      <td>₹${(item.goal || 0).toLocaleString("en-IN")}</td>
      <td class="admin-actions">
        <button class="btn-edit" onclick="window.adminAPI.editCampaign('${item.id}')">Edit</button>
        <button class="btn-delete" onclick="window.adminAPI.deleteCampaign('${item.id}')">Delete</button>
      </td>
    </tr>`,
    )
    .join("");
}

// ==========================================
// GALLERY CRUD
// ==========================================

function openGalleryForm(id) {
  editingId = id;
  const item = id ? galleryItems.find((g) => g.id === id) : null;
  document.getElementById("gallery-form-title").textContent = id
    ? "Edit Gallery Item"
    : "Add Gallery Item";
  document.getElementById("gallery-id").value = id || "";
  document.getElementById("gallery-title").value = item?.title || "";
  document.getElementById("gallery-category").value =
    item?.category || "activities";
  document.getElementById("gallery-date").value = item?.date || "";
  document.getElementById("gallery-description").value =
    item?.description || "";
  // Store original URL (with cache-buster) for fallback
  const origUrl = item?.imageUrl || "";
  document.getElementById("gallery-current-img").dataset.originalUrl = origUrl;
  document.getElementById("gallery-current-img").src = origUrl;
  document.getElementById("gallery-current-img-wrap").style.display = origUrl
    ? "block"
    : "none";
  document.getElementById("gallery-file").value = "";
  document.getElementById("gallery-modal").style.display = "flex";
}

function closeGalleryForm() {
  document.getElementById("gallery-modal").style.display = "none";
  editingId = null;
}

async function saveGalleryItem() {
  const title = document.getElementById("gallery-title").value.trim();
  if (!title) {
    alert("Title is required.");
    return;
  }

  const fileInput = document.getElementById("gallery-file");
  const file = fileInput.files[0];
  // Use original URL from data attribute (not the preview data URL)
  let imageUrl =
    document.getElementById("gallery-current-img").dataset.originalUrl || "";

  if (file) {
    // Delete old image from R2 before uploading new one
    await deleteOldImage(imageUrl);
    const compressed = await compressImage(file, 1200, 0.82);
    const uploadedUrl = await uploadImage(
      compressed,
      "gallery/" + makeWebpFilename(title),
    );
    imageUrl = uploadedUrl;
  }

  // Always cache-bust so browser fetches fresh image
  imageUrl = cacheBustUrl(imageUrl);

  if (!imageUrl) {
    alert("An image is required.");
    return;
  }

  const data = {
    title,
    category: document.getElementById("gallery-category").value,
    date: document.getElementById("gallery-date").value.trim(),
    description: document.getElementById("gallery-description").value.trim(),
    order: editingId
      ? (galleryItems.find((g) => g.id === editingId)?.order ?? Date.now())
      : Date.now(),
    imageUrl,
    updatedAt: Date.now(),
  };

  try {
    if (editingId) {
      await updateDoc(doc(db, "galleryItems", editingId), data);
    } else {
      await addDoc(collection(db, "galleryItems"), data);
    }
    closeGalleryForm();
    await loadGalleryItems();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

async function deleteGalleryItem(id) {
  if (!confirm("Delete this gallery item? This cannot be undone.")) return;
  try {
    // Note: image stays in GitHub repo (git history) but is removed from Firestore
    await deleteDoc(doc(db, "galleryItems", id));
    await loadGalleryItems();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

// ==========================================
// CAMPAIGN CRUD
// ==========================================

function openCampaignForm(id) {
  editingId = id;
  const item = id ? campaignItems.find((c) => c.id === id) : null;
  document.getElementById("campaign-form-title").textContent = id
    ? "Edit Campaign"
    : "Add Campaign";
  document.getElementById("campaign-id").value = id || "";
  document.getElementById("campaign-title").value = item?.title || "";
  document.getElementById("campaign-tagline").value = item?.tagline || "";
  document.getElementById("campaign-tag").value = item?.tag || "";
  document.getElementById("campaign-goal").value = item?.goal || 0;
  document.getElementById("campaign-raised").value = item?.raised || 0;
  document.getElementById("campaign-days").value = item?.daysLeft || 0;
  const origUrl = item?.imageUrl || "";
  document.getElementById("campaign-current-img").dataset.originalUrl = origUrl;
  document.getElementById("campaign-current-img").src = origUrl;
  document.getElementById("campaign-current-img-wrap").style.display = origUrl
    ? "block"
    : "none";
  document.getElementById("campaign-file").value = "";
  document.getElementById("campaign-modal").style.display = "flex";
}

function closeCampaignForm() {
  document.getElementById("campaign-modal").style.display = "none";
  editingId = null;
}

async function saveCampaignItem() {
  const title = document.getElementById("campaign-title").value.trim();
  if (!title) {
    alert("Title is required.");
    return;
  }

  const fileInput = document.getElementById("campaign-file");
  const file = fileInput.files[0];
  let imageUrl =
    document.getElementById("campaign-current-img").dataset.originalUrl || "";

  if (file) {
    // Delete old image from R2 before uploading new one
    await deleteOldImage(imageUrl);
    const compressed = await compressImage(file, 1200, 0.82);
    const uploadedUrl = await uploadImage(
      compressed,
      "campaigns/" + makeWebpFilename(title),
    );
    imageUrl = uploadedUrl;
  }

  // Always cache-bust so browser fetches fresh image
  imageUrl = cacheBustUrl(imageUrl);

  if (!imageUrl) {
    alert("An image is required.");
    return;
  }

  const data = {
    title,
    tagline: document.getElementById("campaign-tagline").value.trim(),
    tag: document.getElementById("campaign-tag").value.trim(),
    goal: parseInt(document.getElementById("campaign-goal").value) || 0,
    raised: parseInt(document.getElementById("campaign-raised").value) || 0,
    daysLeft: parseInt(document.getElementById("campaign-days").value) || 0,
    order: editingId
      ? (campaignItems.find((c) => c.id === editingId)?.order ?? Date.now())
      : Date.now(),
    imageUrl,
    updatedAt: Date.now(),
  };

  try {
    if (editingId) {
      await updateDoc(doc(db, "campaigns", editingId), data);
    } else {
      await addDoc(collection(db, "campaigns"), data);
    }
    closeCampaignForm();
    await loadCampaignItems();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

async function deleteCampaignItem(id) {
  if (!confirm("Delete this campaign? This cannot be undone.")) return;
  try {
    await deleteDoc(doc(db, "campaigns", id));
    await loadCampaignItems();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

// ==========================================
// FEATURED CAMPAIGN (single document in Firestore)
// ==========================================

let featuredCampaign = null;

async function loadFeaturedCampaign() {
  try {
    const snap = await getDoc(doc(db, "featuredCampaign", "current"));
    if (snap.exists()) {
      featuredCampaign = { id: snap.id, ...snap.data() };
    } else {
      featuredCampaign = null;
    }
    renderFeaturedCampaignTable();
  } catch (err) {
    console.error("Error loading featured campaign:", err);
  }
}

function renderFeaturedCampaignTable() {
  const emptyEl = document.getElementById("featured-campaign-empty");
  const loadedEl = document.getElementById("featured-campaign-loaded");
  const tbody = document.getElementById("featured-campaign-table-body");

  if (!featuredCampaign) {
    emptyEl.style.display = "block";
    loadedEl.style.display = "none";
    return;
  }

  emptyEl.style.display = "none";
  loadedEl.style.display = "block";
  tbody.innerHTML = `
    <tr>
      <td><img src="${featuredCampaign.imageUrl || ""}" alt="" class="admin-thumb" onerror="this.style.opacity=0"></td>
      <td>${escapeHtml(featuredCampaign.title || "")}</td>
      <td>${escapeHtml(featuredCampaign.tag || "")}</td>
      <td>₹${(featuredCampaign.raised || 0).toLocaleString("en-IN")}</td>
      <td>₹${(featuredCampaign.goal || 0).toLocaleString("en-IN")}</td>
      <td>${featuredCampaign.daysLeft || 0}</td>
      <td class="admin-actions">
        <button class="btn-edit" onclick="window.adminAPI.editFeaturedCampaign()">Edit</button>
        <button class="btn-delete" onclick="window.adminAPI.deleteFeaturedCampaign()">Delete</button>
      </td>
    </tr>`;
}

function openFeaturedCampaignForm() {
  const item = featuredCampaign;
  document.getElementById("featured-campaign-form-title").textContent = item
    ? "Edit Featured Campaign"
    : "Add Featured Campaign";
  document.getElementById("featured-campaign-title").value = item?.title || "";
  document.getElementById("featured-campaign-tagline").value =
    item?.tagline || "";
  document.getElementById("featured-campaign-tag").value = item?.tag || "";
  document.getElementById("featured-campaign-goal").value = item?.goal || 0;
  document.getElementById("featured-campaign-raised").value = item?.raised || 0;
  document.getElementById("featured-campaign-days").value = item?.daysLeft || 0;

  const imgEl = document.getElementById("featured-campaign-current-img");
  const wrap = document.getElementById("featured-campaign-current-img-wrap");
  const origUrl = item?.imageUrl || "";
  imgEl.dataset.originalUrl = origUrl;
  imgEl.src = origUrl;
  wrap.style.display = origUrl ? "block" : "none";
  document.getElementById("featured-campaign-file").value = "";
  document.getElementById("featured-campaign-modal").style.display = "flex";
}

function closeFeaturedCampaignForm() {
  document.getElementById("featured-campaign-modal").style.display = "none";
}

function previewFeaturedCampaignFile(input) {
  const file = input.files[0];
  if (!file) return;
  const imgEl = document.getElementById("featured-campaign-current-img");
  const wrap = document.getElementById("featured-campaign-current-img-wrap");
  const reader = new FileReader();
  reader.onload = (e) => {
    imgEl.src = e.target.result;
    wrap.style.display = "block";
  };
  reader.readAsDataURL(file);
}

async function saveFeaturedCampaign() {
  const title = document.getElementById("featured-campaign-title").value.trim();
  if (!title) {
    alert("Title is required.");
    return;
  }

  const fileInput = document.getElementById("featured-campaign-file");
  const file = fileInput.files[0];
  let imageUrl =
    document.getElementById("featured-campaign-current-img").dataset
      .originalUrl || "";

  if (file) {
    // Delete old image from R2 before uploading new one
    await deleteOldImage(imageUrl);
    const compressed = await compressImage(file, 1600, 0.82);
    const uploadedUrl = await uploadImage(
      compressed,
      "featured-campaign/featured.webp",
    );
    imageUrl = uploadedUrl;
  }

  // Always cache-bust so browser fetches fresh image
  imageUrl = cacheBustUrl(imageUrl);

  if (!imageUrl) {
    alert("An image is required.");
    return;
  }

  const data = {
    title,
    tagline: document.getElementById("featured-campaign-tagline").value.trim(),
    tag: document.getElementById("featured-campaign-tag").value.trim(),
    goal:
      parseInt(document.getElementById("featured-campaign-goal").value) || 0,
    raised:
      parseInt(document.getElementById("featured-campaign-raised").value) || 0,
    daysLeft:
      parseInt(document.getElementById("featured-campaign-days").value) || 0,
    imageUrl,
    updatedAt: Date.now(),
  };

  try {
    await setDoc(doc(db, "featuredCampaign", "current"), data, { merge: true });
    closeFeaturedCampaignForm();
    await loadFeaturedCampaign();
  } catch (err) {
    alert("Failed to save: " + err.message);
  }
}

async function deleteFeaturedCampaign() {
  if (!confirm("Delete the featured campaign? This cannot be undone.")) return;
  try {
    // Delete image from R2
    if (featuredCampaign?.imageUrl) {
      await deleteOldImage(featuredCampaign.imageUrl);
    }
    await deleteDoc(doc(db, "featuredCampaign", "current"));
    featuredCampaign = null;
    renderFeaturedCampaignTable();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

// ==========================================
// IMAGE COMPRESSION (Canvas API)
// ==========================================

// ==========================================
// IMAGE COMPRESSION (client-side, WebP output)
// Converts any image to WebP at optimal quality.
// WebP: 35% smaller than JPEG at same visual quality, 97%+ browser support.
// Preserves transparency for PNGs with alpha channel.
// ==========================================

function compressImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        // Detect if the original image has transparency (PNG with alpha)
        // Draw it first to check for alpha channel
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        let hasTransparency = false;
        // Sample pixels to check for alpha < 255
        for (let i = 3; i < imageData.data.length; i += 400) {
          if (imageData.data[i] < 250) {
            hasTransparency = true;
            break;
          }
        }

        // Redraw: if no transparency, fill white background first (for photos)
        // If transparency exists, keep it (WebP supports alpha channel)
        ctx.clearRect(0, 0, w, h);
        if (!hasTransparency) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);

        // Convert to WebP — best quality/size ratio for web images
        canvas.toBlob(
          (blob) => {
            if (blob && blob.type === "image/webp" && blob.size > 0) {
              // Smart check: if WebP is larger than original (e.g., small
              // logos, simple graphics), keep the original file instead
              if (blob.size >= file.size && file.size < 200 * 1024) {
                console.info(
                  "WebP larger than original, keeping original:",
                  file.name,
                );
                resolve(file);
              } else {
                resolve(blob);
              }
            } else {
              // Fallback to JPEG if browser doesn't support WebP encoding
              console.warn("WebP not supported, falling back to JPEG");
              canvas.toBlob(
                (jpegBlob) =>
                  jpegBlob
                    ? resolve(jpegBlob)
                    : reject(new Error("Compression failed")),
                "image/jpeg",
                quality,
              );
            }
          },
          "image/webp",
          quality,
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: generate a clean slug from a title (e.g. "Cafe Ribbon Cutting!" → "cafe-ribbon-cutting")
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces → dashes
    .replace(/-+/g, "-") // collapse multiple dashes
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}

// ==========================================
// UNIFIED CACHE-BUST HELPER
// Strips any existing ?v= param and appends a fresh timestamp.
// Used by ALL image save functions (gallery, campaign, coverflow, page images)
// so the browser always fetches the latest image after an update.
// ==========================================
function cacheBustUrl(url) {
  if (!url) return url;
  const base = url.split("?")[0];
  return `${base}?v=${Date.now()}`;
}

// ==========================================
// UNIFIED OLD IMAGE DELETION
// Extracts the R2 path from an old image URL and deletes it from R2.
// Called before uploading a new image to replace an existing one.
// Silently ignores errors (old image may not exist if first upload).
// ==========================================
async function deleteOldImage(oldUrl) {
  try {
    if (!oldUrl) return;
    // Extract path from URL: https://...workers.dev/img/coverflow/foo.webp?v=123
    // → coverflow/foo.webp
    const urlObj = new URL(oldUrl);
    const path = urlObj.pathname.replace(/^\/img\//, "");
    if (!path) return;

    const idToken = await currentUser.getIdToken();
    await fetch(UPLOAD_WORKER_URL.replace("/upload", "/delete"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ path }),
    });
  } catch (err) {
    // Silently ignore — old image may not exist
    console.warn("Old image deletion failed (non-critical):", err.message);
  }
}

// Helper: generate a clean filename from the item title (falls back to timestamp)
function makeWebpFilename(title) {
  const slug = slugify(title);
  if (slug && slug.length > 0) {
    return slug + ".webp";
  }
  // Fallback if no title: use timestamp
  return Date.now() + ".webp";
}

// ==========================================
// IMAGE UPLOAD (via Cloudflare Worker → GitHub → jsDelivr CDN)
// The Worker holds the GitHub token server-side (never exposed to browser).
// The Worker also verifies the Firebase auth token before uploading.
// ==========================================
// IMAGE UPLOAD (via Cloudflare Worker → R2 storage)
// The Worker holds the R2 binding server-side (no token exposed).
// The Worker verifies the Firebase auth token before uploading.
// Images are served via Cloudflare CDN (free, unlimited bandwidth).
// ==========================================

async function uploadImage(blob, path) {
  // Convert blob to base64 (without the data: prefix)
  const base64 = await blobToBase64(blob);

  // Get the current user's Firebase ID token for authentication
  const idToken = await currentUser.getIdToken();

  // Show progress
  const bar = document.getElementById("upload-progress");
  if (bar) {
    bar.style.width = "30%";
    bar.textContent = "Uploading...";
  }

  // Call the Cloudflare Worker (which handles R2 upload server-side)
  const resp = await fetch(UPLOAD_WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      path: path,
      content: base64,
      contentType: blob.type || "image/webp",
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Upload failed (${resp.status}): ${errBody}`);
  }

  const data = await resp.json();
  const cdnUrl = data.url;

  if (bar) {
    bar.style.width = "100%";
    bar.textContent = "Done!";
    setTimeout(() => {
      bar.style.width = "0%";
      bar.textContent = "";
    }, 1500);
  }

  return cdnUrl;
}

// Helper: convert Blob to base64 string (without data: prefix)
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Strip the "data:image/jpeg;base64," prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ==========================================
// HELPERS
// ==========================================

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ==========================================
// DATA MIGRATION (Import JSON → Firestore)
// ==========================================

async function importGalleryJSON() {
  try {
    const resp = await fetch("../data/gallery.json");
    const items = await resp.json();
    for (const item of items) {
      await addDoc(collection(db, "galleryItems"), {
        title: item.title || "",
        category: (item.category || "").toLowerCase().replace(/\s+/g, "-"),
        date: item.date || "",
        description: item.description || "",
        imageUrl: item.image || "",
        order: Date.now() + items.indexOf(item),
        bentoClass: "",
        updatedAt: Date.now(),
      });
    }
    alert("Imported " + items.length + " gallery items.");
    await loadGalleryItems();
  } catch (err) {
    alert("Import failed: " + err.message);
  }
}

async function importCampaignsJSON() {
  try {
    const resp = await fetch("../data/campaigns.json");
    const items = await resp.json();
    for (const item of items) {
      await addDoc(collection(db, "campaigns"), {
        title: item.title || "",
        tagline: item.tagline || "",
        tag: item.tag || "",
        goal: item.goal || 0,
        raised: item.raised || 0,
        daysLeft: item.daysLeft || 0,
        imageUrl: item.image || "",
        order: Date.now() + items.indexOf(item),
        updatedAt: Date.now(),
      });
    }
    alert("Imported " + items.length + " campaigns.");
    await loadCampaignItems();
  } catch (err) {
    alert("Import failed: " + err.message);
  }
}

// ==========================================
// EXPORT API FOR HTML ONCLICK HANDLERS
// ==========================================

window.adminAPI = {
  handleGoogleLogin,
  handleLogout,
  switchTab,
  editGallery: (id) => openGalleryForm(id),
  deleteGallery: (id) => deleteGalleryItem(id),
  saveGallery: saveGalleryItem,
  closeGallery: closeGalleryForm,
  openGalleryAdd: () => openGalleryForm(null),
  editCampaign: (id) => openCampaignForm(id),
  deleteCampaign: (id) => deleteCampaignItem(id),
  saveCampaign: saveCampaignItem,
  closeCampaign: closeCampaignForm,
  openCampaignAdd: () => openCampaignForm(null),
  openFeaturedCampaignForm,
  editFeaturedCampaign: () => openFeaturedCampaignForm(),
  deleteFeaturedCampaign,
  saveFeaturedCampaign,
  closeFeaturedCampaign: closeFeaturedCampaignForm,
  previewFeaturedCampaignFile,
  importGalleryJSON,
  importCampaignsJSON,
  editPageImage,
  previewPageImageFile,
  previewGalleryFile,
  previewCoverflowFile,
  previewCampaignFile,
  savePageImage,
  closePageImage,
  openCoverflowAdd: () => openCoverflowForm(null),
  editCoverflow: (id) => openCoverflowForm(id),
  deleteCoverflow: (id) => deleteCoverflowItem(id),
  saveCoverflow: saveCoverflowItem,
  closeCoverflow: closeCoverflowForm,
  openFacilityAdd: () => openFacilityForm(null),
  editFacility: (id) => openFacilityForm(id),
  deleteFacility: (id) => deleteFacilityItem(id),
  saveFacility: saveFacilityItem,
  closeFacility: closeFacilityForm,
  previewFacilityFile,
  saveDonateLink,
  editDonateLink,
  cancelEditDonateLink,
};

// ==========================================
// PAGE IMAGES (Contact & Internship)
// ==========================================

// ==========================================
// DONATE LINK
// ==========================================

const DEFAULT_DONATE_URL = "https://razorpay.me/@narayanicharitabletrust";

async function loadDonateLink() {
  const input = document.getElementById("donate-link-input");
  if (!input) return;
  try {
    const snap = await getDoc(doc(db, "siteSettings", "donateLink"));
    input.value = snap.exists() ? snap.data().url : DEFAULT_DONATE_URL;
  } catch (err) {
    console.error("Error loading donate link:", err);
    input.value = DEFAULT_DONATE_URL;
  }
  // Ensure input starts disabled (read-only mode)
  input.disabled = true;
  input.style.background = "#f1f5f9";
  input.style.color = "var(--text-secondary)";
  document.getElementById("donate-link-edit-btn").style.display = "inline-flex";
  document.getElementById("donate-link-save-btn").style.display = "none";
  document.getElementById("donate-link-cancel-btn").style.display = "none";
}

async function saveDonateLink() {
  const input = document.getElementById("donate-link-input");
  if (!input) return;
  const url = input.value.trim();
  if (!url) {
    alert("Please enter a donation URL.");
    return;
  }
  try {
    await setDoc(doc(db, "siteSettings", "donateLink"), { url });
    cancelEditDonateLink();
    alert("Donation link updated! It will now be used on all pages.");
  } catch (err) {
    console.error("Error saving donate link:", err);
    alert("Failed to save donation link. Check console for details.");
  }
}

function editDonateLink() {
  const input = document.getElementById("donate-link-input");
  input.disabled = false;
  input.style.background = "#ffffff";
  input.style.color = "var(--text-primary)";
  input.focus();
  document.getElementById("donate-link-edit-btn").style.display = "none";
  document.getElementById("donate-link-save-btn").style.display = "inline-flex";
  document.getElementById("donate-link-cancel-btn").style.display =
    "inline-flex";
}

function cancelEditDonateLink() {
  const input = document.getElementById("donate-link-input");
  input.disabled = true;
  input.style.background = "#f1f5f9";
  input.style.color = "var(--text-secondary)";
  document.getElementById("donate-link-edit-btn").style.display = "inline-flex";
  document.getElementById("donate-link-save-btn").style.display = "none";
  document.getElementById("donate-link-cancel-btn").style.display = "none";
  loadDonateLink();
}

async function loadPageImages() {
  try {
    const snap = await getDoc(doc(db, "pageImages", "images"));
    pageImages = snap.exists() ? snap.data() : {};
    renderPageImageTables();
  } catch (err) {
    console.error("Error loading page images:", err);
    pageImages = {};
    renderPageImageTables();
  }
}

function renderPageImageTables() {
  const homeKeys = Object.keys(PAGE_IMAGE_DEFS).filter((k) =>
    k.startsWith("home_"),
  );

  // About page — split into sections
  const aboutSection1 = ["about_helping_today"];
  const aboutSection2 = ["about_our_mission"];
  const aboutSection3 = ["about_founder", "about_founder_president"];
  // Section 4 (facilities) is now managed by full CRUD — images handled in facility form
  const aboutSection4 = [];

  // Contact page — split into sections
  const contactHeroKeys = Object.keys(PAGE_IMAGE_DEFS).filter(
    (k) => k.startsWith("contact_") && !k.startsWith("contact_facility_"),
  );
  const contactFacilityKeys = Object.keys(PAGE_IMAGE_DEFS).filter((k) =>
    k.startsWith("contact_facility_"),
  );

  // Internship page — split into sections
  const internshipHeroKeys = ["internship_hero"];
  const internshipServicesKeys = Object.keys(PAGE_IMAGE_DEFS).filter((k) =>
    k.startsWith("internship_track_"),
  );
  const internshipGalleryKeys = Object.keys(PAGE_IMAGE_DEFS).filter((k) =>
    k.startsWith("internship_gallery_"),
  );

  renderPageImageTable("home-table-body", homeKeys);
  renderPageImageTable("about-section-1-body", aboutSection1);
  renderPageImageTable("about-section-2-body", aboutSection2);
  renderPageImageTable("about-section-3-body", aboutSection3);
  renderPageImageTable("about-section-4-body", aboutSection4);
  renderPageImageTable("contact-hero-table-body", contactHeroKeys);
  renderPageImageTable("contact-facility-table-body", contactFacilityKeys);
  renderPageImageTable("internship-hero-table-body", internshipHeroKeys);
  renderPageImageTable(
    "internship-services-table-body",
    internshipServicesKeys,
  );
  renderPageImageTable("internship-gallery-table-body", internshipGalleryKeys);
}

function renderPageImageTable(tbodyId, keys) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (keys.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="admin-empty">No images.</td></tr>';
    return;
  }
  tbody.innerHTML = keys
    .map((key) => {
      const img = pageImages[key] || PAGE_IMAGE_DEFAULTS[key];
      const thumb = img
        ? `<img src="${img}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;" />`
        : `<div style="width:48px;height:48px;background:#f1f5f9;border-radius:6px;display:grid;place-items:center;color:#cbd5e1;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
      return `<tr>
        <td>${thumb}</td>
        <td>${PAGE_IMAGE_DEFS[key]}</td>
        <td><button class="admin-edit-btn" onclick="window.adminAPI.editPageImage('${key}')">Edit</button></td>
      </tr>`;
    })
    .join("");
}

function editPageImage(key) {
  editingPageKey = key;
  document.getElementById("page-image-key").value = key;
  document.getElementById("page-image-label").value =
    PAGE_IMAGE_DEFS[key] || key;
  const current = pageImages[key] || PAGE_IMAGE_DEFAULTS[key];
  const imgEl = document.getElementById("page-image-current-img");
  const wrap = document.getElementById("page-image-current-img-wrap");
  if (current) {
    imgEl.src = current;
    wrap.style.display = "block";
  } else {
    imgEl.src = "";
    wrap.style.display = "none";
  }
  document.getElementById("page-image-file").value = "";
  document.getElementById("page-image-modal").style.display = "flex";
}

function closePageImage() {
  document.getElementById("page-image-modal").style.display = "none";
  editingPageKey = null;
}

function previewPageImageFile(input) {
  const file = input.files[0];
  if (!file) return;
  const imgEl = document.getElementById("page-image-current-img");
  const wrap = document.getElementById("page-image-current-img-wrap");
  const reader = new FileReader();
  reader.onload = (e) => {
    imgEl.src = e.target.result;
    wrap.style.display = "block";
  };
  reader.readAsDataURL(file);
}

function previewGalleryFile(input) {
  const file = input.files[0];
  if (!file) return;
  const imgEl = document.getElementById("gallery-current-img");
  const wrap = document.getElementById("gallery-current-img-wrap");
  const reader = new FileReader();
  reader.onload = (e) => {
    imgEl.src = e.target.result;
    wrap.style.display = "block";
  };
  reader.readAsDataURL(file);
}

function previewCoverflowFile(input) {
  const file = input.files[0];
  if (!file) return;
  const imgEl = document.getElementById("coverflow-current-img");
  const wrap = document.getElementById("coverflow-current-img-wrap");
  const reader = new FileReader();
  reader.onload = (e) => {
    imgEl.src = e.target.result;
    wrap.style.display = "block";
  };
  reader.readAsDataURL(file);
}

function previewCampaignFile(input) {
  const file = input.files[0];
  if (!file) return;
  const imgEl = document.getElementById("campaign-current-img");
  const wrap = document.getElementById("campaign-current-img-wrap");
  const reader = new FileReader();
  reader.onload = (e) => {
    imgEl.src = e.target.result;
    wrap.style.display = "block";
  };
  reader.readAsDataURL(file);
}

async function savePageImage() {
  if (!editingPageKey) return;
  const file = document.getElementById("page-image-file").files[0];
  if (!file) {
    alert("Please select an image file.");
    return;
  }
  try {
    // Delete old image from R2 before uploading new one
    const oldUrl = pageImages[editingPageKey] || "";
    await deleteOldImage(oldUrl);
    const blob = await compressImage(file, 1600, 0.82);
    const path = `page-images/${editingPageKey}.webp`;
    const url = await uploadImage(blob, path);
    // Always cache-bust so browser fetches fresh image
    const finalUrl = cacheBustUrl(url);
    pageImages[editingPageKey] = finalUrl;
    await setDoc(
      doc(db, "pageImages", "images"),
      { [editingPageKey]: finalUrl },
      { merge: true },
    );
    renderPageImageTables();
    closePageImage();
    alert("Image updated successfully.");
  } catch (err) {
    alert("Failed to save image: " + err.message);
  }
}

// ==========================================
// COVERFLOW SLIDES CRUD
// ==========================================

async function loadCoverflowItems() {
  try {
    const snap = await getDocs(
      query(collection(db, "coverflowSlides"), orderBy("order", "asc")),
    );
    coverflowItems = [];
    snap.forEach((d) => coverflowItems.push({ id: d.id, ...d.data() }));
    renderCoverflowTable();
  } catch (err) {
    console.error("Error loading coverflow:", err);
    coverflowItems = [];
    renderCoverflowTable();
  }
}

function renderCoverflowTable() {
  const tbody = document.getElementById("coverflow-table-body");
  if (!tbody) return;
  if (coverflowItems.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="admin-empty">No cover flow slides.</td></tr>';
    return;
  }
  tbody.innerHTML = coverflowItems
    .map(
      (item) => `
    <tr>
      <td><img src="${item.imageUrl || ""}" alt="" class="admin-thumb" onerror="this.style.opacity=0"></td>
      <td>${escapeHtml(item.title || "")}</td>
      <td class="admin-actions">
        <button class="btn-edit" onclick="window.adminAPI.editCoverflow('${item.id}')">Edit</button>
        <button class="btn-delete" onclick="window.adminAPI.deleteCoverflow('${item.id}')">Delete</button>
      </td>
    </tr>`,
    )
    .join("");
}

function openCoverflowForm(id) {
  editingId = id;
  const item = id ? coverflowItems.find((c) => c.id === id) : null;
  document.getElementById("coverflow-form-title").textContent = id
    ? "Edit First Gallery Slide"
    : "Add First Gallery Slide";
  document.getElementById("coverflow-id").value = id || "";
  document.getElementById("coverflow-title").value = item?.title || "";
  document.getElementById("coverflow-desc").value = item?.desc || "";
  const origUrl = item?.imageUrl || "";
  document.getElementById("coverflow-current-img").dataset.originalUrl =
    origUrl;
  document.getElementById("coverflow-current-img").src = origUrl;
  document.getElementById("coverflow-current-img-wrap").style.display = origUrl
    ? "block"
    : "none";
  document.getElementById("coverflow-file").value = "";
  document.getElementById("coverflow-modal").style.display = "flex";
}

function closeCoverflowForm() {
  document.getElementById("coverflow-modal").style.display = "none";
  editingId = null;
}

async function saveCoverflowItem() {
  const title = document.getElementById("coverflow-title").value.trim();
  if (!title) {
    alert("Title is required.");
    return;
  }
  const desc = document.getElementById("coverflow-desc").value.trim();
  const file = document.getElementById("coverflow-file").files[0];
  let imageUrl =
    document.getElementById("coverflow-current-img").dataset.originalUrl || "";
  if (file) {
    // Delete old image from R2 before uploading new one
    await deleteOldImage(imageUrl);
    const compressed = await compressImage(file, 1200, 0.82);
    const uploadedUrl = await uploadImage(
      compressed,
      "coverflow/" + makeWebpFilename(title),
    );
    imageUrl = uploadedUrl;
  }
  // Always cache-bust so browser fetches fresh image
  imageUrl = cacheBustUrl(imageUrl);
  if (!imageUrl) {
    alert("An image is required.");
    return;
  }
  const data = {
    title,
    desc,
    imageUrl,
    order: editingId
      ? (coverflowItems.find((c) => c.id === editingId)?.order ?? Date.now())
      : Date.now(),
    updatedAt: Date.now(),
  };
  try {
    if (editingId) {
      await updateDoc(doc(db, "coverflowSlides", editingId), data);
    } else {
      await addDoc(collection(db, "coverflowSlides"), data);
    }
    closeCoverflowForm();
    await loadCoverflowItems();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

async function deleteCoverflowItem(id) {
  if (!confirm("Delete this cover flow slide?")) return;
  try {
    await deleteDoc(doc(db, "coverflowSlides", id));
    await loadCoverflowItems();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

// ==========================================
// FACILITIES CRUD (Therapies & Rehabilitation)
// Card metadata (title, desc, badge, icon) → Firestore facilities collection
// Card images → shared page images system (pageImages/images document)
// ==========================================

// Static fallback cards (from about.html) — used when Firestore is empty
// and to auto-seed Firestore on first admin login
const DEFAULT_FACILITIES = [
  {
    title: "Speech Therapy",
    description:
      "Articulative voicing and verbal articulation training for improved communication.",
    badge: "Therapy",
    icon: "🗣",
    pageImageKey: "about_facility_speech",
  },
  {
    title: "Occupational Therapy",
    description:
      "Everyday living training and fine sensory motor skill development.",
    badge: "Therapy",
    icon: "🧠",
    pageImageKey: "about_facility_occupational",
  },
  {
    title: "Water Therapy",
    description:
      "Hydrotherapy pools for muscle relaxation and physical coordination.",
    badge: "Therapy",
    icon: "💧",
    pageImageKey: "about_facility_water",
  },
  {
    title: "Physiotherapy",
    description:
      "Mobility training, gait rehabilitation, and motor scaling exercises.",
    badge: "Therapy",
    icon: "🏃",
    pageImageKey: "about_facility_physiotherapy",
  },
  {
    title: "Art & Craft",
    description:
      "Enhancing visual creativity, painting, and hand-eye alignment.",
    badge: "Creative",
    icon: "🎨",
    pageImageKey: "about_facility_art_craft",
  },
  {
    title: "Dance & Music",
    description:
      "Rhythm-motor coordination, singing, and movement integration.",
    badge: "Creative",
    icon: "🎵",
    pageImageKey: "about_facility_dance_music",
  },
  {
    title: "Smart Classroom",
    description: "Interactive screen boards and adaptive children lessons.",
    badge: "Education",
    icon: "🏫",
    pageImageKey: "about_facility_smart_classroom",
  },
  {
    title: "Computer Lab",
    description:
      "Keyboard lessons, visual puzzles, and digital skills training.",
    badge: "Education",
    icon: "💻",
    pageImageKey: "about_facility_computer_lab",
  },
  {
    title: "Library",
    description: "Accessible story sheets, picture sheets, and auditory aids.",
    badge: "Education",
    icon: "📚",
    pageImageKey: "about_facility_library",
  },
  {
    title: "Sports",
    description:
      "Indoor adaptive games, track runs, and team coordination play.",
    badge: "Recreation",
    icon: "⚽",
    pageImageKey: "about_facility_sports",
  },
  {
    title: "Parent Awareness",
    description: "Behavior integration seminars and home care methodologies.",
    badge: "Support",
    icon: "👨‍👩‍👧",
    pageImageKey: "about_facility_parent_awareness",
  },
  {
    title: "Vocational Training",
    description:
      "Hand-crafting, packaging, and commercial self-reliance skills.",
    badge: "Skills",
    icon: "🎓",
    pageImageKey: "about_facility_vocational",
  },
  {
    title: "Doctor Chamber",
    description:
      "Regular diagnostic visits, pediatric consulting, and health records.",
    badge: "Medical",
    icon: "🩺",
    pageImageKey: "about_facility_doctor",
  },
  {
    title: "Audiology",
    description: "Auditory mapping diagnostics and sound aid fittings.",
    badge: "Medical",
    icon: "👂",
    pageImageKey: "about_facility_audiology",
  },
  {
    title: "Sensory Therapy",
    description: "Tactile play integration, balance checks, and color therapy.",
    badge: "Therapy",
    icon: "🧩",
    pageImageKey: "about_facility_sensory",
  },
];

async function loadFacilityItems() {
  try {
    const snap = await getDocs(
      query(collection(db, "facilities"), orderBy("order", "asc")),
    );
    facilityItems = [];
    snap.forEach((d) => facilityItems.push({ id: d.id, ...d.data() }));

    // Migration: if old docs don't have pageImageKey, delete all and re-seed
    const needsMigration =
      facilityItems.length > 0 && !facilityItems[0].pageImageKey;
    if (needsMigration && currentUser) {
      for (const item of facilityItems) {
        await deleteDoc(doc(db, "facilities", item.id));
      }
      facilityItems = [];
    }

    // Auto-seed Firestore with existing website cards on first load
    if (facilityItems.length === 0 && currentUser) {
      for (let i = 0; i < DEFAULT_FACILITIES.length; i++) {
        const f = DEFAULT_FACILITIES[i];
        await addDoc(collection(db, "facilities"), {
          title: f.title,
          description: f.description,
          badge: f.badge,
          icon: f.icon,
          pageImageKey: f.pageImageKey,
          order: i,
          updatedAt: Date.now(),
        });
      }
      const snap2 = await getDocs(
        query(collection(db, "facilities"), orderBy("order", "asc")),
      );
      facilityItems = [];
      snap2.forEach((d) => facilityItems.push({ id: d.id, ...d.data() }));
    }

    renderFacilityTable();
  } catch (err) {
    console.error("Error loading facilities:", err);
    facilityItems = [];
    renderFacilityTable();
  }
}

function renderFacilityTable() {
  const tbody = document.getElementById("facility-table-body");
  if (!tbody) return;
  if (facilityItems.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="admin-empty">No facility cards. Click "Add New" to create one.</td></tr>';
    return;
  }
  tbody.innerHTML = facilityItems
    .map((item) => {
      // Get image from page images system (shared)
      const imgKey = item.pageImageKey || "";
      const imgSrc = pageImages[imgKey] || "";
      return `
    <tr>
      <td><img src="${imgSrc.replace(/ /g, "%20")}" alt="" class="admin-thumb" onerror="this.style.opacity=0"></td>
      <td>${escapeHtml(item.title || "")}</td>
      <td>${escapeHtml(item.badge || "")}</td>
      <td>${escapeHtml(item.icon || "")}</td>
      <td class="admin-actions">
        <button class="btn-edit" onclick="window.adminAPI.editFacility('${item.id}')">Edit</button>
        <button class="btn-delete" onclick="window.adminAPI.deleteFacility('${item.id}')">Delete</button>
      </td>
    </tr>`;
    })
    .join("");
}

function openFacilityForm(id) {
  editingId = id;
  const item = id ? facilityItems.find((f) => f.id === id) : null;
  document.getElementById("facility-form-title").textContent = id
    ? "Edit Facility Card"
    : "Add Facility Card";
  document.getElementById("facility-id").value = id || "";
  document.getElementById("facility-title").value = item?.title || "";
  document.getElementById("facility-description").value =
    item?.description || "";
  document.getElementById("facility-badge").value = item?.badge || "Therapy";
  document.getElementById("facility-icon").value = item?.icon || "";

  // Show current image from page images system
  const imgKey = item?.pageImageKey || "";
  const imgSrc = pageImages[imgKey] || "";
  document.getElementById("facility-current-img").dataset.pageImageKey = imgKey;
  document.getElementById("facility-current-img").src = imgSrc.replace(
    / /g,
    "%20",
  );
  document.getElementById("facility-current-img-wrap").style.display = imgSrc
    ? "block"
    : "none";
  document.getElementById("facility-file").value = "";
  document.getElementById("facility-modal").style.display = "flex";
}

function closeFacilityForm() {
  document.getElementById("facility-modal").style.display = "none";
  editingId = null;
}

function previewFacilityFile(input) {
  const file = input.files[0];
  if (!file) return;
  const imgEl = document.getElementById("facility-current-img");
  const wrap = document.getElementById("facility-current-img-wrap");
  const reader = new FileReader();
  reader.onload = (e) => {
    imgEl.src = e.target.result;
    wrap.style.display = "block";
  };
  reader.readAsDataURL(file);
}

// Generate a pageImageKey from title (e.g. "Speech Therapy" → "about_facility_speech_therapy")
function makeFacilityPageImageKey(title) {
  return (
    "about_facility_" +
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
  );
}

async function saveFacilityItem() {
  const title = document.getElementById("facility-title").value.trim();
  if (!title) {
    alert("Title is required.");
    return;
  }
  const description = document
    .getElementById("facility-description")
    .value.trim();
  const badge =
    document.getElementById("facility-badge").value.trim() || "Therapy";
  const icon = document.getElementById("facility-icon").value.trim();
  const file = document.getElementById("facility-file").files[0];

  // Determine pageImageKey: keep existing or generate new from title
  const existingItem = editingId
    ? facilityItems.find((f) => f.id === editingId)
    : null;
  const pageImageKey =
    existingItem?.pageImageKey || makeFacilityPageImageKey(title);

  // If a new image was uploaded, save it to the shared page images system
  if (file) {
    try {
      const oldUrl = pageImages[pageImageKey] || "";
      await deleteOldImage(oldUrl);
      const blob = await compressImage(file, 1600, 0.82);
      const path = `page-images/${pageImageKey}.webp`;
      const url = await uploadImage(blob, path);
      const finalUrl = cacheBustUrl(url);
      pageImages[pageImageKey] = finalUrl;
      await setDoc(
        doc(db, "pageImages", "images"),
        { [pageImageKey]: finalUrl },
        { merge: true },
      );
    } catch (err) {
      alert("Image upload failed: " + err.message);
      return;
    }
  }

  // Save card metadata to Firestore facilities collection
  const data = {
    title,
    description,
    badge,
    icon,
    pageImageKey,
    order: existingItem ? (existingItem.order ?? Date.now()) : Date.now(),
    updatedAt: Date.now(),
  };
  try {
    if (editingId) {
      await updateDoc(doc(db, "facilities", editingId), data);
    } else {
      await addDoc(collection(db, "facilities"), data);
    }
    closeFacilityForm();
    await loadFacilityItems();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

async function deleteFacilityItem(id) {
  if (
    !confirm(
      "Delete this facility card? The image will remain in the page images system.",
    )
  )
    return;
  try {
    await deleteDoc(doc(db, "facilities", id));
    await loadFacilityItems();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}
