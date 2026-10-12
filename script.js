/*
  ملف JavaScript الخاص بالتفاعلات البسيطة في الموقع.
  لو هتغيّر الكلام أو الألوان، غالبًا هتحتاج index.html أو style.css بدل الملف ده.
  أهم أماكن التعديل هنا: EMAIL و LINKEDIN_URL في آخر الملف.
*/

// نختار زر القائمة، حاوية روابط التنقل، وروابط الأقسام نفسها من HTML.
const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelector("#navLinks");
const navItems = document.querySelectorAll(".nav-link");

// عند الضغط على زر الثلاث شرط: نفتح القائمة لو مقفولة، أو نقفلها لو مفتوحة.
menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  // نفس الحالة تتحكم في شكل زر القائمة (يتحول من ☰ إلى × عبر CSS).
  menuToggle.classList.toggle("open", isOpen);

  // تحديث معلومات الوصول؛ بتوضح لقارئ الشاشة هل القائمة مفتوحة أم لا.
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu"
  );
});

// تنقل ناعم بين الأقسام + إغلاق قائمة الموبايل بعد الاختيار.
// تقدر تغيّر مدة الحركة من SCROLL_DURATION بالمللي ثانية.
const SCROLL_DURATION_MIN = 1600;
const SCROLL_DURATION_MAX = 2300;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function closeMobileMenu() {
  if (!navLinks || !menuToggle) return;
  navLinks.classList.remove("open");
  menuToggle.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
}

function smoothScrollTo(target) {
  const header = document.querySelector(".site-header");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
  const startY = window.scrollY;
  const distance = targetTop - startY;

  if (prefersReducedMotion || Math.abs(distance) < 4) {
    window.scrollTo(0, targetTop);
    return;
  }

  // المسافة القصيرة تاخد وقت أقل، والطويلة وقت أطول عشان الوصول مايبقاش فجأة.
  const distanceRatio = Math.min(Math.abs(distance) / 1800, 1);
  const duration = SCROLL_DURATION_MIN +
    (SCROLL_DURATION_MAX - SCROLL_DURATION_MIN) * distanceRatio;

  let startTime = null;
  let animationFrame = null;

  // لو المستخدم بدأ يسحب بإيده أو بعجلة الماوس، نسيب التحكم له فورًا.
  const stopOnUserInput = () => {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    window.removeEventListener("wheel", stopOnUserInput);
    window.removeEventListener("touchstart", stopOnUserInput);
    window.removeEventListener("keydown", stopOnUserInput);
  };
  window.addEventListener("wheel", stopOnUserInput, { passive: true, once: true });
  window.addEventListener("touchstart", stopOnUserInput, { passive: true, once: true });
  window.addEventListener("keydown", stopOnUserInput, { once: true });

  // Ease-in-out cubic: الحركة تبدأ بهدوء، تزيد في المنتصف، وتهدى قبل الوصول.
  function animateScroll(now) {
    if (startTime === null) startTime = now;
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, startY + distance * eased);
    if (progress < 1) animationFrame = requestAnimationFrame(animateScroll);
    else {
      window.removeEventListener("wheel", stopOnUserInput);
      window.removeEventListener("touchstart", stopOnUserInput);
      window.removeEventListener("keydown", stopOnUserInput);
    }
  }

  animationFrame = requestAnimationFrame(animateScroll);
}

// أي رابط داخلي مثل #about أو #projects يستخدم نفس الحركة الناعمة.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;
    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    closeMobileMenu();
    smoothScrollTo(target);
    history.replaceState(null, "", hash);
  });
});

// يكتب السنة الحالية تلقائيًا في أسفل الموقع بدل تحديثها يدويًا كل سنة.
const yearElement = document.querySelector("#year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// تأثير ظهور العناصر تدريجيًا عند وصولها للشاشة أثناء التمرير.
// IntersectionObserver يراقب العناصر التي تحمل class="reveal" في HTML.
const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // نضيف visible؛ وCSS يتولى الحركة والشكل النهائي.
          entry.target.classList.add("visible");
          // نوقف مراقبة العنصر بعد ظهوره لتجنب عمل غير ضروري.
          currentObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 } // يبدأ التأثير عندما يظهر جزء من العنصر في الشاشة.
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  // حل احتياطي للمتصفحات التي لا تدعم IntersectionObserver.
  revealItems.forEach((item) => item.classList.add("visible"));
}

// تمييز رابط القسم الذي يراه المستخدم حاليًا في شريط التنقل.
// لو أضفت قسمًا جديدًا، أضف له رابط nav-link و id مطابقًا في HTML.
const pageSections = document.querySelectorAll("main section[id]");
if ("IntersectionObserver" in window && pageSections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navItems.forEach((link) => {
          const pointsToThisSection = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", pointsToThisSection);
        });
      });
    },
    { rootMargin: "-35% 0px -55% 0px" }
  );
  pageSections.forEach((section) => sectionObserver.observe(section));
}

// روابط المشاريع حاليًا تجريبية؛ نمنعها من إعطاء انطباع أن لها صفحة حقيقية.
// بعد تجهيز مشروعك، استبدل الرابط في HTML برابط المشروع واحذف data-placeholder-link.
document.querySelectorAll("[data-placeholder-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    alert("Add your real project URL here after you finish building it.");
  });
});

// ==================== تعديل بيانات التواصل من هنا ====================
// اكتب بريدك الحقيقي بين علامتي التنصيص بدل YOUR_EMAIL@example.com.
const EMAIL = "YOUR_EMAIL@example.com";

// ضع رابط صفحة LinkedIn الشخصية كاملة، مثل: https://www.linkedin.com/in/your-username/
const LINKEDIN_URL = "https://www.linkedin.com/";

// نربط الأزرار بالبيانات المكتوبة بالأعلى.
const emailLink = document.querySelector("#emailLink");
const linkedinLink = document.querySelector("#linkedinLink");

if (emailLink) {
  emailLink.href = `mailto:${EMAIL}`; // يفتح تطبيق البريد برسالة جديدة.
}

if (linkedinLink) {
  linkedinLink.href = LINKEDIN_URL; // يفتح صفحة LinkedIn التي وضعت رابطها.
}


// تأثير ضوء ناعم يتبع المؤشر فوق بطاقات المشاريع والمهارات والنبذة.
// يشتغل بالماوس فقط، ولا يضيف حركة مزعجة على الموبايل.
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion) {
  document.querySelectorAll(".project-card, .skill-card, .fact-card, .panel").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--pointer-x");
      card.style.removeProperty("--pointer-y");
    });
  });
}
