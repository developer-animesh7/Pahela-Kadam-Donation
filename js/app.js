// Disable browser's native automatic history scroll restoration
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// Single efficient scroll reset handler
function resetScroll() {
  window.scrollTo(0, 0);
}

// Reset scroll on page load and back-forward cache restores
window.addEventListener("pageshow", () => {
  resetScroll();
  requestAnimationFrame(resetScroll);
});

window.addEventListener("load", () => {
  resetScroll();
  requestAnimationFrame(resetScroll);
});

// Global Image Error Fallback Handler (enables clean programmatic SVG placeholders, preventing inline parsing syntax errors)
document.addEventListener(
  "error",
  (event) => {
    if (event.target && event.target.tagName === "IMG") {
      const img = event.target;
      if (img.dataset.fallbackTriggered) return;
      img.dataset.fallbackTriggered = "true";

      const altText = img.getAttribute("alt") || "Pahela Kadam Program";
      img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="100%" height="100%" fill="%23eff6ff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="600" fill="%232563eb">${encodeURIComponent(altText)}</text></svg>`;
    }
  },
  true,
);

document.addEventListener("DOMContentLoaded", async () => {
  // Explicitly reset scroll position to top
  resetScroll();

  // 1. Register Reusable Interactive Components before loading
  registerNavbarComponent();
  registerDonationCardComponent();

  // 2. Execute dynamic HTML template compilation
  if (window.ComponentLoaderInstance) {
    await window.ComponentLoaderInstance.loadAll();
  }

  // Reset scroll to top again after async layout height changes
  resetScroll();
  requestAnimationFrame(resetScroll);

  // 3. Initialize static header components
  initializeStaticNavbar();

  // 4. Initialize premium Donate button micro-animations
  initializeDonateButtonAnimation();

  // 4b. Initialize graceful mobile hero image fade-up on scroll intersection
  initializeMobileHeroImageAnimation();

  // 5. Fire scroll reveals and entrance animation handlers
  if (window.ScrollRevealEngine) {
    window.ScrollRevealEngine.init();
  }

  // 6. Trigger page-level staggered entrance sequence
  setTimeout(() => {
    document.body.classList.add("entrance-ready");
  }, 100);
});

/**
 * Premium Donate Button Interactive Micro-animations
 * Handles custom ripple clicks and floating heart symbols on hover
 */
function initializeDonateButtonAnimation() {
  const premiumBtn = document.querySelector(".premium-donate-btn");
  if (premiumBtn) {
    // Spawn floating heart particles slowly on hover (deliberate, non-distracting pace)
    let heartTimer = null;
    premiumBtn.addEventListener("mouseenter", () => {
      // Spawn first heart instantly on hover
      spawnHeart(premiumBtn);
      // Periodically spawn subsequent hearts every 600ms
      heartTimer = setInterval(() => {
        spawnHeart(premiumBtn);
      }, 600);
    });

    premiumBtn.addEventListener("mouseleave", () => {
      if (heartTimer) {
        clearInterval(heartTimer);
        heartTimer = null;
      }
    });
  }

  // Register ripple click effects on all premium buttons
  const rippleBtns = document.querySelectorAll(
    ".premium-donate-btn, .pulse-donate",
  );
  rippleBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Avoid creating multiple rapid ripples blocking main UI thread
      const existingRipple = btn.querySelector(".ripple-effect");
      if (existingRipple) existingRipple.remove();

      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement("span");
      ripple.className = "ripple-effect";
      ripple.style.width =
        ripple.style.height = `${Math.max(rect.width, rect.height) * 2}px`;
      ripple.style.left = `${x - Math.max(rect.width, rect.height)}px`;
      ripple.style.top = `${y - Math.max(rect.width, rect.height)}px`;
      btn.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });

  // Synchronized single floating heart particle loop for header CTAs (Instagram-like Pop)
  const headerBtns = document.querySelectorAll(".pulse-donate");
  headerBtns.forEach((btn) => {
    if (btn.dataset.heartLoopRunning) return;
    btn.dataset.heartLoopRunning = "true";

    // Run every 4.5 seconds for a non-distracting premium cue
    setInterval(() => {
      const svg = btn.querySelector("svg");
      if (!svg) return;

      // 1. Temporarily hide the original white heart icon outline
      btn.classList.add("heart-pop-active");

      // 2. Spawn the single red pop heart particle
      const particle = document.createElement("span");
      particle.className = "header-floating-heart";
      particle.innerHTML = "❤️";

      const btnRect = btn.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      // Position centered over the SVG icon location
      const leftOffset = svgRect.left - btnRect.left + svgRect.width / 2;
      const topOffset = svgRect.top - btnRect.top;

      particle.style.left = `${leftOffset}px`;
      particle.style.top = `${topOffset}px`;
      btn.appendChild(particle);

      // 3. Wait 650ms (animation duration) to clean up particle and restore white icon
      setTimeout(() => {
        particle.remove();
        btn.classList.remove("heart-pop-active");
      }, 650);
    }, 4500);
  });
}

function spawnHeart(parent) {
  const heart = document.createElement("span");
  heart.className = "floating-heart";
  heart.innerHTML = "❤️";
  // Random horizontal distribution inside button
  heart.style.left = `${Math.random() * 70 + 15}%`;
  parent.appendChild(heart);

  // Auto clean up after animation ends
  setTimeout(() => {
    heart.remove();
  }, 1800);
}

/**
 * Registry callback: Navbar menu triggers & responsive focus locks
 */
function registerNavbarComponent() {
  if (!window.ComponentLoaderInstance) return;

  window.ComponentLoaderInstance.register("navbar", (navbarElement) => {
    navbarElement.dataset.navbarInitialized = "true";
    const burgerBtn = navbarElement.querySelector(".nav-burger");
    const menuEl = navbarElement.querySelector(".nav-menu");

    if (!burgerBtn || !menuEl) return;

    // Highlight current page link based on browser URL
    const path = window.location.pathname;
    const links = navbarElement.querySelectorAll(".nav-link");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (
        href &&
        (path.endsWith(href) ||
          (path === "/" && href.includes("landing.html")) ||
          (path.endsWith("/") && href.includes("landing.html")))
      ) {
        link.classList.add("is-current-page");
      }
    });
    burgerBtn.addEventListener("click", () => {
      const isExpanded = burgerBtn.getAttribute("aria-expanded") === "true";
      burgerBtn.setAttribute("aria-expanded", !isExpanded);
      burgerBtn.classList.toggle("is-active");
      menuEl.classList.toggle("is-active");
      navbarElement.classList.toggle("menu-open");
      document.documentElement.classList.toggle("html-menu-open", !isExpanded);

      // Prevent scrolling behind mobile nav overlay
      document.body.style.overflow = !isExpanded ? "hidden" : "";
    });

    // Close menu when close button inside overlay is clicked
    const closeBtn = menuEl.querySelector(".nav-menu-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        burgerBtn.setAttribute("aria-expanded", "false");
        burgerBtn.classList.remove("is-active");
        menuEl.classList.remove("is-active");
        navbarElement.classList.remove("menu-open");
        document.documentElement.classList.remove("html-menu-open");
        document.body.style.overflow = "";
      });
    }

    // Close menu when links are clicked (useful for anchors on same page)
    const navLinks = menuEl.querySelectorAll("a");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        burgerBtn.setAttribute("aria-expanded", "false");
        burgerBtn.classList.remove("is-active");
        menuEl.classList.remove("is-active");
        navbarElement.classList.remove("menu-open");
        document.documentElement.classList.remove("html-menu-open");
        document.body.style.overflow = "";
      });
    });
  });
}

/**
 * Registry callback: Donation card state manager.
 * Translates contributions directly to emotional real-world impact sentences.
 */
function registerDonationCardComponent() {
  if (!window.ComponentLoaderInstance) return;

  // Impact Mapping Dictionary: Direct inspiration messaging
  const impactDirectory = [
    {
      threshold: 0,
      text: "Every contribution provides vital nutrition and care support.",
    },
    {
      threshold: 15,
      text: "Sponsors wholesome, specialized breakfast for a child for 1 week.",
    },
    {
      threshold: 30,
      text: "Provides 1 complete physical therapy and sensory motor session.",
    },
    {
      threshold: 50,
      text: "Supplies tailored learning tools and classroom aid for 1 child for a month.",
    },
    {
      threshold: 100,
      text: "Covers 3 full occupational & speech therapy sessions for a special child.",
    },
    {
      threshold: 250,
      text: "Sponsors physical therapy, learning aid, and home-transit for a child for 1 month.",
    },
    {
      threshold: 500,
      text: "Provides complete therapeutic, nutritional, and educational support for 2 children for a month.",
    },
  ];

  window.ComponentLoaderInstance.register("donation-card", (cardElement) => {
    const presetBtns = cardElement.querySelectorAll(".preset-btn");
    const customInput = cardElement.querySelector(".custom-donation-input");
    const impactTextEl = cardElement.querySelector(".donation-impact-text");
    const typeBtns = cardElement.querySelectorAll(".donation-toggle-btn");
    const submitBtn = cardElement.querySelector(".btn-submit-donation");

    if (!impactTextEl) return;

    // Helper: matches input amount to impact milestone sentence
    const updateImpactMessage = (amount) => {
      const parsed = parseFloat(amount) || 0;
      let matchedText = impactDirectory[0].text;

      // Find the highest threshold satisfied by the donation
      for (let i = impactDirectory.length - 1; i >= 0; i--) {
        if (parsed >= impactDirectory[i].threshold) {
          matchedText = impactDirectory[i].text;
          break;
        }
      }

      // Update text in UI with high-performance fade
      impactTextEl.style.opacity = 0;
      setTimeout(() => {
        impactTextEl.textContent = matchedText;
        impactTextEl.style.opacity = 1;
      }, 100);
    };

    // Toggle Monthly vs One-time
    typeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        typeBtns.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        // Update CTA label to reflect interval subscription
        if (submitBtn) {
          const type = btn.getAttribute("data-type");
          submitBtn.textContent =
            type === "monthly" ? "Start Monthly Sponsorship" : "Donate Now";
        }
      });
    });

    // Preset Selection
    presetBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        presetBtns.forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");

        const value = btn.getAttribute("data-value");
        if (customInput) {
          customInput.value = value;
        }
        updateImpactMessage(value);
      });
    });

    // Custom Input modifications
    if (customInput) {
      customInput.addEventListener("input", () => {
        const val = customInput.value;

        // Deselect presets if custom input doesn't match presets
        let matchedPreset = false;
        presetBtns.forEach((btn) => {
          if (btn.getAttribute("data-value") === val) {
            btn.classList.add("is-selected");
            matchedPreset = true;
          } else {
            btn.classList.remove("is-selected");
          }
        });

        updateImpactMessage(val);
      });
    }

    // Initialize with default selected button
    const selectedPreset = cardElement.querySelector(".preset-btn.is-selected");
    if (selectedPreset) {
      updateImpactMessage(selectedPreset.getAttribute("data-value"));
    }
  });
}

/**
 * Initialize triggers on statically pre-included navbar to avoid flash latency
 */
function initializeStaticNavbar() {
  const navbarElement = document.querySelector(".header-wrapper");
  if (!navbarElement) return;

  if (
    navbarElement.dataset.navbarInitialized === "true" ||
    navbarElement.getAttribute("data-component-loaded") === "navbar"
  ) {
    return;
  }
  navbarElement.dataset.navbarInitialized = "true";

  const burgerBtn = navbarElement.querySelector(".nav-burger");
  const menuEl = navbarElement.querySelector(".nav-menu");

  if (!burgerBtn || !menuEl) return;

  // Highlight current page link based on browser URL
  const path = window.location.pathname;
  const links = navbarElement.querySelectorAll(".nav-link");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (
      href &&
      (path.endsWith(href) ||
        (path === "/" && href.includes("landing.html")) ||
        (path.endsWith("/") && href.includes("landing.html")))
    ) {
      link.classList.add("is-current-page");
    }
  });

  burgerBtn.addEventListener("click", () => {
    const isExpanded = burgerBtn.getAttribute("aria-expanded") === "true";
    burgerBtn.setAttribute("aria-expanded", !isExpanded);
    burgerBtn.classList.toggle("is-active");
    menuEl.classList.toggle("is-active");
    navbarElement.classList.toggle("menu-open");
    document.documentElement.classList.toggle("html-menu-open", !isExpanded);
    document.body.style.overflow = !isExpanded ? "hidden" : "";
  });

  const closeBtn = menuEl.querySelector(".nav-menu-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      burgerBtn.setAttribute("aria-expanded", "false");
      burgerBtn.classList.remove("is-active");
      menuEl.classList.remove("is-active");
      navbarElement.classList.remove("menu-open");
      document.documentElement.classList.remove("html-menu-open");
      document.body.style.overflow = "";
    });
  }

  const navLinks = menuEl.querySelectorAll("a");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      burgerBtn.setAttribute("aria-expanded", "false");
      burgerBtn.classList.remove("is-active");
      menuEl.classList.remove("is-active");
      navbarElement.classList.remove("menu-open");
      document.documentElement.classList.remove("html-menu-open");
      document.body.style.overflow = "";
    });
  });
}

/**
 * Graceful fade-up entrance for mobile hero image on scroll intersection
 */
function initializeMobileHeroImageAnimation() {
  const frame = document.querySelector(".mobile-hero-img-frame");
  if (!frame) return;

  if (!("IntersectionObserver" in window)) {
    frame.style.opacity = "1";
    frame.style.transform = "none";
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  observer.observe(frame);
}
