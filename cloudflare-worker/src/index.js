/**
 * Cloudflare Worker — R2 Image Upload + Serving
 *
 * Two endpoints:
 * 1. POST /upload  — Admin uploads images (requires Firebase auth token)
 *    Body: { "path": "gallery/image.jpg", "content": "<base64>" }
 *    Response: { "success": true, "url": "https://pahelakadm-uploader.../img/..." }
 *
 * 2. GET /img/{path} — Public image serving (no auth needed, edge cached)
 *    Fetches image from R2 bucket, returns with 1-year cache headers
 *
 * The GitHub token is no longer needed — R2 is Cloudflare's own storage.
 * No external API calls, no rate limits, native Worker integration.
 */

// Firebase project config (for verifying auth tokens)
const FIREBASE_PROJECT_ID = "phela-kadam";

// Allowed admin email
const ADMIN_EMAIL = "pahelakadamweb@gmail.com";

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const url = new URL(request.url);

    // Health check endpoint (GET)
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ status: "ok", storage: "R2" });
    }

    // Image serving endpoint (GET /img/{path})
    if (url.pathname.startsWith("/img/") && request.method === "GET") {
      return await serveImage(request, env, url.pathname);
    }

    // Upload endpoint (POST /upload)
    if (url.pathname === "/upload" && request.method === "POST") {
      return await uploadImage(request, env);
    }

    // Delete endpoint (POST or DELETE /delete) — removes old image from R2
    if (
      url.pathname === "/delete" &&
      (request.method === "DELETE" || request.method === "POST")
    ) {
      return await deleteImage(request, env);
    }

    return json({ error: "Not found" }, 404);
  },
};

// ==========================================
// IMAGE SERVING (public, edge cached)
// ==========================================

async function serveImage(request, env, pathname) {
  // Extract the image path from the URL: /img/gallery/foo.jpg → gallery/foo.jpg
  const imagePath = pathname.replace(/^\/img\//, "");
  if (!imagePath) {
    return json({ error: "Image path required" }, 400);
  }

  // Fetch from R2 bucket (native binding — no HTTP call needed)
  const object = await env.IMAGES_BUCKET.get(imagePath);

  if (!object) {
    return json({ error: "Image not found", path: imagePath }, 404);
  }

  // Determine content type from file extension
  const contentType = getContentType(imagePath);

  // Build the response — no browser caching, always revalidate via ETag.
  // This ensures the browser always checks with the Worker for updates.
  // If the image hasn't changed (same ETag), Worker returns tiny 304.
  // If the image changed (new upload), Worker returns the new image.
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("X-Content-Type-Options", "nosniff");
  if (object.httpEtag) {
    headers.set("ETag", object.httpEtag);
  }

  // If browser sent If-None-Match and it matches, return 304 (cached)
  const ifNoneMatch = request.headers.get("If-None-Match");
  if (ifNoneMatch && object.httpEtag && ifNoneMatch === object.httpEtag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(object.body, {
    status: 200,
    headers,
  });
}

// ==========================================
// IMAGE UPLOAD (admin only, requires Firebase auth)
// ==========================================

async function uploadImage(request, env) {
  try {
    // Verify Firebase auth token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing auth token" }, 401);
    }

    const idToken = authHeader.replace("Bearer ", "");
    const userEmail = await verifyFirebaseToken(idToken);

    if (userEmail !== ADMIN_EMAIL) {
      return json({ error: "Unauthorized: admin access required" }, 403);
    }

    // Parse request body
    const body = await request.json();
    const { path, content, contentType: customContentType } = body;

    if (!path || !content) {
      return json(
        { error: "Missing 'path' or 'content' in request body" },
        400,
      );
    }

    // Decode base64 content to binary
    const binaryContent = atob(content);
    const bytes = new Uint8Array(binaryContent.length);
    for (let i = 0; i < binaryContent.length; i++) {
      bytes[i] = binaryContent.charCodeAt(i);
    }

    // Determine content type
    const ct = customContentType || getContentType(path);

    // Upload to R2 bucket (native binding — no HTTP call needed)
    await env.IMAGES_BUCKET.put(path, bytes, {
      httpMetadata: {
        contentType: ct,
        cacheControl: "no-store, no-cache, must-revalidate",
      },
    });

    // Build the CDN URL — points to this Worker's /img/ endpoint
    const cdnUrl = `https://pahelakadm-uploader.pahelakadam.workers.dev/img/${path}`;

    return json({
      success: true,
      url: cdnUrl,
      path: path,
    });
  } catch (err) {
    return json({ error: "Internal error", message: err.message }, 500);
  }
}

// ==========================================
// IMAGE DELETE (admin only, requires Firebase auth)
// Removes an old image from R2 when replaced by a new upload.
// ==========================================

async function deleteImage(request, env) {
  try {
    // Verify Firebase auth token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing auth token" }, 401);
    }

    const idToken = authHeader.replace("Bearer ", "");
    const userEmail = await verifyFirebaseToken(idToken);

    if (userEmail !== ADMIN_EMAIL) {
      return json({ error: "Unauthorized: admin access required" }, 403);
    }

    // Parse request body
    const body = await request.json();
    const { path } = body;

    if (!path) {
      return json({ error: "Missing 'path' in request body" }, 400);
    }

    // Delete from R2 bucket
    await env.IMAGES_BUCKET.delete(path);

    return json({ success: true, deleted: path });
  } catch (err) {
    return json({ error: "Internal error", message: err.message }, 500);
  }
}

// ==========================================
// HELPERS
// ==========================================

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function getContentType(path) {
  const ext = path.split(".").pop().toLowerCase();
  const types = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    avif: "image/avif",
    ico: "image/x-icon",
    bmp: "image/bmp",
  };
  return types[ext] || "application/octet-stream";
}

async function verifyFirebaseToken(idToken) {
  const [headerB64, payloadB64] = idToken.split(".");
  const payload = JSON.parse(atob(payloadB64));

  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error("Invalid token issuer");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("Token expired");
  }

  return payload.email || null;
}
