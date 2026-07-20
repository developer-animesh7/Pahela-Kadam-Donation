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
    setDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
    deleteObject,
    getDownloadURL,
    ref as storageRef,
    uploadBytesResumable,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { auth, db, provider, storage } from "../js/firebase-config.js";

// Whitelisted admin emails
const ADMIN_EMAILS = ["admin@pahelakadam.edu.in"];

let currentUser = null;
let activeTab = "gallery";
let galleryItems = [];
let campaignItems = [];
let pageImages = {};
let coverflowItems = [];
let editingId = null;
let editingPageKey = null;

const PAGE_IMAGE_DEFS = {
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
    loadPageImages(),
    loadCoverflowItems(),
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
  document.getElementById("gallery-category").value = item?.category || "cafe";
  document.getElementById("gallery-date").value = item?.date || "";
  document.getElementById("gallery-description").value =
    item?.description || "";
  document.getElementById("gallery-current-img").src = item?.imageUrl || "";
  document.getElementById("gallery-current-img-wrap").style.display =
    item?.imageUrl ? "block" : "none";
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
  let imageUrl = document.getElementById("gallery-current-img").src || "";

  if (file) {
    const compressed = await compressImage(file, 1200, 0.85);
    imageUrl = await uploadImage(
      compressed,
      "gallery/" + Date.now() + "-" + file.name,
    );
  }

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
  const item = galleryItems.find((g) => g.id === id);
  try {
    if (item?.imageUrl) {
      const oldRef = storageRef(storage, extractStoragePath(item.imageUrl));
      await deleteObject(oldRef).catch(() => {});
    }
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
  document.getElementById("campaign-current-img").src = item?.imageUrl || "";
  document.getElementById("campaign-current-img-wrap").style.display =
    item?.imageUrl ? "block" : "none";
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
  let imageUrl = document.getElementById("campaign-current-img").src || "";

  if (file) {
    const compressed = await compressImage(file, 1200, 0.85);
    imageUrl = await uploadImage(
      compressed,
      "campaigns/" + Date.now() + "-" + file.name,
    );
  }

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
  const item = campaignItems.find((c) => c.id === id);
  try {
    if (item?.imageUrl) {
      const oldRef = storageRef(storage, extractStoragePath(item.imageUrl));
      await deleteObject(oldRef).catch(() => {});
    }
    await deleteDoc(doc(db, "campaigns", id));
    await loadCampaignItems();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

// ==========================================
// IMAGE COMPRESSION (Canvas API)
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
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error("Compression failed")),
          "image/jpeg",
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

async function uploadImage(blob, path) {
  const ref = storageRef(storage, path);
  const metadata = {
    contentType: "image/jpeg",
    cacheControl: "public, max-age=31536000",
  };
  const uploadTask = uploadBytesResumable(ref, blob, metadata);
  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        const bar = document.getElementById("upload-progress");
        if (bar) {
          bar.style.width = pct + "%";
          bar.textContent = pct + "%";
        }
      },
      reject,
      async () => {
        const url = await getDownloadURL(ref);
        const bar = document.getElementById("upload-progress");
        if (bar) {
          bar.style.width = "0%";
          bar.textContent = "";
        }
        resolve(url);
      },
    );
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

function extractStoragePath(url) {
  const match = decodeURIComponent(url).match(/\/o\/(.+)\?/);
  return match ? match[1] : "";
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
  importGalleryJSON,
  importCampaignsJSON,
  editPageImage,
  savePageImage,
  closePageImage,
  openCoverflowAdd: () => openCoverflowForm(null),
  editCoverflow: (id) => openCoverflowForm(id),
  deleteCoverflow: (id) => deleteCoverflowItem(id),
  saveCoverflow: saveCoverflowItem,
  closeCoverflow: closeCoverflowForm,
};

// ==========================================
// PAGE IMAGES (Contact & Internship)
// ==========================================

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
  const contactKeys = Object.keys(PAGE_IMAGE_DEFS).filter((k) =>
    k.startsWith("contact_"),
  );
  const internshipKeys = Object.keys(PAGE_IMAGE_DEFS).filter((k) =>
    k.startsWith("internship_"),
  );
  renderPageImageTable("contact-table-body", contactKeys);
  renderPageImageTable("internship-table-body", internshipKeys);
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
      const img = pageImages[key];
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
  const current = pageImages[key];
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

async function savePageImage() {
  if (!editingPageKey) return;
  const file = document.getElementById("page-image-file").files[0];
  if (!file) {
    alert("Please select an image file.");
    return;
  }
  try {
    const blob = await compressImage(file, 1600, 0.85);
    const path = `page-images/${editingPageKey}.jpg`;
    const url = await uploadImage(blob, path);
    pageImages[editingPageKey] = url;
    await setDoc(
      doc(db, "pageImages", "images"),
      { [editingPageKey]: url },
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
    ? "Edit Cover Flow Slide"
    : "Add Cover Flow Slide";
  document.getElementById("coverflow-id").value = id || "";
  document.getElementById("coverflow-title").value = item?.title || "";
  document.getElementById("coverflow-desc").value = item?.desc || "";
  document.getElementById("coverflow-current-img").src = item?.imageUrl || "";
  document.getElementById("coverflow-current-img-wrap").style.display =
    item?.imageUrl ? "block" : "none";
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
  let imageUrl = document.getElementById("coverflow-current-img").src || "";
  if (file) {
    const compressed = await compressImage(file, 1200, 0.85);
    imageUrl = await uploadImage(
      compressed,
      "coverflow/" + Date.now() + "-" + file.name,
    );
  }
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
  const item = coverflowItems.find((c) => c.id === id);
  try {
    if (item?.imageUrl) {
      const oldRef = storageRef(storage, extractStoragePath(item.imageUrl));
      await deleteObject(oldRef).catch(() => {});
    }
    await deleteDoc(doc(db, "coverflowSlides", id));
    await loadCoverflowItems();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}
