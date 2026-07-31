/**
 * ==========================================================================
 * SCROLL REVEALS, HERO COUNTERS & SLIDESHOW CYCLES
 * ==========================================================================
 */

/**
 * Initializes IntersectionObserver on all target reveal elements
 */
function initializeScrollReveal() {
  const revealElements = document.querySelectorAll(
    ".reveal, .reveal-left, .reveal-right, .reveal-scale",
  );

  if (revealElements.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  setupStaggerChildren();

  revealElements.forEach((element) => {
    observer.observe(element);
  });
}

/**
 * Automatically sets CSS stagger-indexes for list children
 */
function setupStaggerChildren() {
  const parents = document.querySelectorAll(".stagger-parent");
  parents.forEach((parent) => {
    const children = parent.children;
    Array.from(children).forEach((child, index) => {
      if (
        child.classList.contains("reveal") ||
        child.classList.contains("reveal-left") ||
        child.classList.contains("reveal-right") ||
        child.classList.contains("reveal-scale")
      ) {
        child.style.setProperty("--stagger-index", index);
      }
    });
  });
}

/**
 * Handle transparent-to-glass header transformations on scroll
 */
function initializeHeaderScrollEffect() {
  const header = document.querySelector(".header-wrapper");
  if (!header) return;

  let isScrolled = false;
  let ticking = false;

  const onScroll = () => {
    const scrolled = window.scrollY > 50;
    if (scrolled !== isScrolled) {
      isScrolled = scrolled;
      if (isScrolled) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
}

/**
 * Statistics Count-Up Engine
 */
function initializeCounters() {
  const counters = document.querySelectorAll(".counter");
  if (counters.length === 0) return;

  const observerOptions = {
    threshold: 0.2,
  };

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const countTo = parseInt(target.getAttribute("data-target"), 10) || 0;

        // Skip count-up if prefers-reduced-motion is active
        const prefersReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (prefersReduced) {
          target.textContent = countTo;
        } else {
          animateValue(target, 0, countTo, 1800); // 1.8 seconds duration
        }
        observer.unobserve(target);
      }
    });
  }, observerOptions);

  counters.forEach((counter) => counterObserver.observe(counter));
}

/**
 * Smooth requestAnimationFrame timer interpolation for numbers
 */
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(
      progress * (end - start) + start,
    ).toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

/**
 * Slow Fading Slideshow Controller (Cycles slides every 9 seconds)
 */
function startHeroSlideshow() {
  const slideshow = document.querySelector(".slideshow-container");
  if (!slideshow) return;

  const slides = slideshow.querySelectorAll(".slideshow-slide");
  if (slides.length <= 1) return;

  let currentIndex = 0;

  setInterval(() => {
    // Fade out current slide
    slides[currentIndex].classList.remove("is-active");

    // Calculate next slide
    currentIndex = (currentIndex + 1) % slides.length;

    // Fade in next slide
    slides[currentIndex].classList.add("is-active");
  }, 9000);
}

/**
 * Animate progress bar widths once they enter the viewport
 */
function initializeProgressBars() {
  const progressFills = document.querySelectorAll(".progress-fill");
  if (progressFills.length === 0) return;

  const observerOptions = {
    threshold: 0.1,
  };

  const progressObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        const percent = parseInt(fill.getAttribute("data-percent"), 10) || 0;
        fill.style.width = percent + "%";
        observer.unobserve(fill);
      }
    });
  }, observerOptions);

  progressFills.forEach((fill) => progressObserver.observe(fill));
}

// Export initialization functions globally
window.ScrollRevealEngine = {
  init: () => {
    initializeScrollReveal();
    initializeHeaderScrollEffect();
    initializeCounters();
    initializeProgressBars();
    startHeroSlideshow();
  },
  refresh: () => {
    initializeScrollReveal();
    initializeCounters();
    initializeProgressBars();
  },
};
