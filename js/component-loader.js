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
    const targets = document.querySelectorAll('[data-component]');
    const promises = Array.from(targets).map(target => this.loadComponent(target));
    return Promise.all(promises);
  }

  /**
   * Fetch template and inject into the target element.
   * @param {HTMLElement} element 
   */
  async loadComponent(element) {
    const name = element.getAttribute('data-component');
    if (!name) return;

    // Use relative path matching current domain location (handles subdirectory deploys)
    const basePath = window.location.pathname.includes('/pages/') ? '../' : './';
    const templateUrl = `${basePath}components/${name}.html?t=${Date.now()}`;

    try {
      const response = await fetch(templateUrl, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to fetch component template at: ${templateUrl}`);
      }
      
      const htmlText = await response.text();
      
      // Inject and preserve attributes of the outer target container
      element.innerHTML = htmlText;
      
      // Clean up target indicator to prevent double load and run callback
      element.removeAttribute('data-component');
      element.setAttribute('data-component-loaded', name);

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
