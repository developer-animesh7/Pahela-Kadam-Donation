# Pahela Kadam – Premium Donation Platform

A premium redesigned web application and fundraising platform for the **Pahela Kadam School for Special Children**, operated under the governance of the **Narayani Charitable Trust** in Dhanbad, Jharkhand.

This platform connects donors, sponsors, and supporters to active therapies, clinical camps, and educational campaigns. Designed with modern nonprofit aesthetics (Charity: Water, UNICEF, GiveIndia inspired) to optimize user trust, information accessibility, and frictionless donation flows.

---

## 🚀 Tech Stack

*   **Markup**: HTML5 (Semantic and SEO optimized structure).
*   **Styling**: Vanilla CSS3 (Custom design tokens, fluid gradients, responsive layouts, transitions).
*   **Scripting**: Vanilla JS (Dynamic component loaders,IntersectionObserver animations, count-up counters, and slide-in progress indicators).
*   **Asset Management**: Clean custom-engineered visual photographs and official high-resolution vector logos.

---

## 📂 Folder Structure

```
Pahela-Kadam-Donation/
├── assets/
│   └── images/
│       ├── campaigns/      # Campaign visual photos (Therapy, Walkers, Sensory)
│       ├── children/       # School children classroom photos
│       ├── founder/        # Mrs. Anita Agarwal portraits
│       ├── logos/          # Official brand and NSE logos
│       └── stories/        # Success story previews (Rahul, Priya)
├── css/
│   ├── animations.css      # Smooth micro-interaction transitions
│   ├── components.css      # Button, card, and component styles
│   ├── layout.css          # Navigation header, footer, and shell frames
│   ├── reset.css           # Global resets
│   ├── responsive.css      # Viewport media queries
│   ├── typography.css      # Font weights and scaling scales
│   ├── utilities.css       # Utility classes
│   └── variables.css       # Design tokens (colors, spacings, border radius)
├── js/
│   ├── app.js              # Dom listeners and navbar registry callbacks
│   ├── animations.js       # IntersectionObserver counts & progress animations
│   └── component-loader.js # Dynamic loading controllers
├── components/             # Reusable markup templates (Navbar, Footer, Hero)
├── pages/                  # Subpages (About, Campaigns, Transparency, Donate)
│   ├── about.html
│   ├── campaigns.html
│   └── landing.html        # Primary Homepage
├── index.html              # Main workspace entry point (Auto redirects to pages/landing.html)
├── run_website.bat         # Local server bootstrapper
├── .gitignore              # Ignored system and local configuration files
└── README.md               # Project documentation
```

---

## 💻 How to Run

1.  Clone the repository:
    ```bash
    git clone https://github.com/developer-animesh7/Pahela-Kadam-Donation.git
    cd Pahela-Kadam-Donation
    ```
2.  Double-click `run_website.bat` or run:
    ```bash
    python -m http.server 8000
    ```
3.  Open your browser and navigate to `http://localhost:8000`.

---

## 🌟 Project Features

1.  **Differentiated Scroll Header**: The navbar starts as a soft light green gradient on page load and transforms smoothly into a sticky glassmorphism state with subtle dropshadows upon scrolling.
2.  **Trust Integrations**: Centered National Stock Exchange Social Stock Exchange (NSE SSE) verification badge showing official registration as NGO Sr. No. 37 with a link directly verifying details.
3.  **Active Campaigns Hub**: Complete fundraising grid with detailed descriptions, custom category overlays, target goals, days left, and progress bar animations.
4.  **Premium About Us Timeline**: A chronologically structured storytelling timeline describing Mrs. Anita Agarwal's founder journey from 2 students to supporting over 150+ special kids.
5.  **Administrative Counters**: Intersection-observer statistic counters showing numbers of government support structures facilitated (UDID, Aadhaar, scholarships, insurance, etc.).
6.  **Donation Infographics**: Step-by-step breakdown illustrating how ₹500 - ₹5,000 donations directly supply tactile blocks, therapy kits, medical checkups, and vocational tools.
7.  **Impact Previews**: Inspiring real success stories demonstrating growth milestones for students like Rahul and Priya.

---

## 🤝 Contribution Guidelines

*   **Stable Footprint**: Keep files relative. Do not move folders or rename layout assets arbitrarily.
*   **CSS Standards**: Do not use utility-heavy Tailwind setups unless explicitly requested. Always utilize CSS variables from `css/variables.css` for margins, padding, and colors.
*   **Micro-interactions**: Transition timings should remain within `150ms - 250ms`. Keep page transforms and scaling subtle to maintain a premium feel.

---

## 🌿 Git Branch Strategy

*   `main`: The clean, production-ready branch. All changes are verified in browser viewports prior to merging.
*   `feature/<name>`: Topic branches for layout extensions. Keep commits focused, prefixing with `feat:`, `fix:`, or `docs:`.

---

## 🗺 Future Roadmap

1.  **Transparency Records Integration**: Expand transparency audit listings with downloadable audit reports.
2.  **Interactive Payment Gateway**: Connect checkout workflows to local test payment systems (Razorpay / UPI).
3.  **Unified Component Compilations**: Refactor navbar and footer blocks so editing a single file propagates across all pages instantly.
