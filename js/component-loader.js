/**
 * ==========================================================================
 * LIGHTWEIGHT COMPONENT LOADER
 * Fetches and instantiates raw HTML templates from components/ directory.
 * Supports lifecycle callbacks for interactive components.
 * ==========================================================================
 */

class ComponentLoader {
  constructor() {
    this.registry = new Map();
  }

  /**
   * Register an initialization function for a specific component.
   * @param {string} name - Name of the component (e.g., 'navbar', 'donation-card')
   * @param {Function} initCallback - Function to execute after DOM injection
   */
  register(name, initCallback) {
    this.registry.set(name, initCallback);
  }

  /**
   * Scan DOM for [data-component] elements and render them.
   * Returns a promise that resolves when all components have loaded.
   */
  async loadAll() {
    if (window.location.protocol === "file:") {
      this.showFileProtocolWarning();
    }
    const targets = document.querySelectorAll("[data-component]");
    const promises = Array.from(targets).map((target) =>
      this.loadComponent(target),
    );
    return Promise.all(promises);
  }

  /**
   * Display a helpful warning banner when opening pages directly via file://
   */
  showFileProtocolWarning() {
    if (document.getElementById("file-protocol-warning-banner")) return;

    const banner = document.createElement("div");
    banner.id = "file-protocol-warning-banner";

    // Find current page path to link correctly
    const currentFile =
      window.location.pathname.split("/").pop() || "index.html";
    const isPagesSubdir = window.location.pathname.includes("/pages/");
    const serverUrl = `http://localhost:8002/${isPagesSubdir ? "pages/" + currentFile : currentFile}`;

    banner.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      color: #f8fafc;
      padding: 16px 20px;
      border-radius: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      z-index: 999999;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.15);
      max-width: 90vw;
      width: 520px;
      line-height: 1.6;
    `;

    banner.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; font-weight:800; color:#ef4444; margin-bottom: 6px;">
        ⚠️ Browser Security Restriction (CORS)
      </div>
      <p style="margin:0 0 10px; color:#cbd5e1;">
        Local templates (Navbar, Footer) cannot load directly when opening html files via <code>file://</code> due to browser security policies.
      </p>
      <p style="margin:0 0 10px; color:#cbd5e1; font-weight:700;">
        Please open via the local server:
        <a href="${serverUrl}" target="_blank" style="color:#60a5fa; text-decoration:underline; font-family: monospace;">${serverUrl}</a>
      </p>
      <div style="font-size:11px; color:#94a3b8; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px; margin-top:8px;">
        To launch the server, run <code>./run_website.sh</code> in your terminal.
      </div>
    `;
    document.body.appendChild(banner);
  }

  /**
   * Fetch template and inject into the target element.
   * @param {HTMLElement} element
   */
  async loadComponent(element) {
    const name = element.getAttribute("data-component");
    if (!name) return;

    // Use relative path matching current domain location (handles subdirectory deploys)
    const basePath = window.location.pathname.includes("/pages/")
      ? "../"
      : "./";
    const templateUrl = `${basePath}components/${name}.html`;

    try {
      const response = await fetch(templateUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch component template at: ${templateUrl}`,
        );
      }

      const htmlText = await response.text();

      // Inject and preserve attributes of the outer target container
      element.innerHTML = htmlText;

      // Clean up target indicator to prevent double load and run callback
      element.removeAttribute("data-component");
      element.setAttribute("data-component-loaded", name);

      // Execute initialization callback if registered
      if (this.registry.has(name)) {
        const initFn = this.registry.get(name);
        initFn(element);
      }
    } catch (error) {
      console.error(`[ComponentLoader] Error loading [${name}]:`, error);
      element.innerHTML = `<div style="padding:10px; border:1px dashed var(--accent); color:var(--accent); font-size:12px;">Error loading component: ${name}</div>`;
    }
  }
}

// Instantiate global component loader instance
window.ComponentLoaderInstance = new ComponentLoader();
