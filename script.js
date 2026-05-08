const hero = document.getElementById("hero");
const letters = document.querySelectorAll(".split-letter");
const phaseText = document.getElementById("phase-text");
const phaseMain = document.getElementById("phase-main");
const phaseCollage = document.getElementById("phase-collage");
const collageImgs = document.querySelectorAll(".collage-group");
const navLinks = document.querySelectorAll(".yt-nav-links a");
const navList = document.querySelector(".yt-nav-links");

const TOTAL_LETTERS = letters.length;

function getProgress() {
  if (!hero) return 0;
  const heroTop = hero.getBoundingClientRect().top + window.scrollY - 100;
  const heroHeight = hero.offsetHeight - window.innerHeight;
  const scrolled = window.scrollY - heroTop;
  return Math.max(0, Math.min(1, scrolled / heroHeight));
}

function onScroll() {
  if (!hero) return;
  const p = getProgress();

  if (p < 0.35) {
    if (phaseText) phaseText.style.opacity = "1";
    if (phaseMain) phaseMain.classList.remove("visible", "faded");
    if (phaseCollage) phaseCollage.classList.remove("visible");

    const letterProgress = p / 0.35;
    const currentIndex = Math.min(
      Math.floor(letterProgress * TOTAL_LETTERS),
      TOTAL_LETTERS - 1,
    );
    letters.forEach((l, i) =>
      l.classList.toggle("visible", i === currentIndex),
    );
  } else if (p < 0.6) {
    if (phaseText) phaseText.style.opacity = "0";
    letters.forEach((l) => l.classList.remove("visible"));
    if (phaseMain) {
      phaseMain.classList.add("visible");
      phaseMain.classList.remove("faded");
    }
    if (phaseCollage) phaseCollage.classList.remove("visible");
  } else {
    if (phaseText) phaseText.style.opacity = "0";
    if (phaseMain) phaseMain.classList.add("visible", "faded");
    if (phaseCollage) phaseCollage.classList.add("visible");

    const collageProgress = (p - 0.6) / 0.4;
    const total = collageImgs.length;
    const currentImg = Math.min(Math.floor(collageProgress * total), total - 1);
    collageImgs.forEach((img, i) =>
      img.classList.toggle("show", i === currentImg),
    );
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// 네비 클릭 → 슬라이딩
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = link.dataset.target;
    if (target) {
      const section = document.getElementById(target);
      if (section)
        window.scrollTo({ top: section.offsetTop - 100, behavior: "smooth" });
    }
    navLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
  });
});

// 네비 드래그
let isDown = false;
let startX;
let scrollLeft;

navList.addEventListener("mousedown", (e) => {
  isDown = true;
  navList.style.cursor = "grabbing";
  startX = e.pageX - navList.offsetLeft;
  scrollLeft = navList.scrollLeft;
});

navList.addEventListener("mouseleave", () => {
  isDown = false;
  navList.style.cursor = "grab";
});
navList.addEventListener("mouseup", () => {
  isDown = false;
  navList.style.cursor = "grab";
});

navList.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - navList.offsetLeft;
  navList.scrollLeft = scrollLeft - (x - startX) * 1.5;
});

// ── 캐러셀 무한루프 ──
const track = document.getElementById("carousel-track");
const originalCards = Array.from(document.querySelectorAll(".carousel-card"));

if (track && originalCards.length) {
  const total = originalCards.length;

  // 앞뒤로 카드 복제
  originalCards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.classList.add("clone");
    track.appendChild(clone);
  });
  originalCards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.classList.add("clone");
    track.insertBefore(clone, track.firstChild);
  });

  const allCards = Array.from(track.querySelectorAll(".carousel-card"));
  let currentIndex = total; // 복제 뒤 실제 첫 카드
  let dragStartX = null;
  let isDragging = false;
  let isTransitioning = false;

  function updateCarousel(animated = true) {
    const cardWidth = allCards[0].offsetWidth + 24;
    const centerOffset = (window.innerWidth - allCards[0].offsetWidth) / 2;
    const offset = centerOffset - currentIndex * cardWidth;
    track.style.transition = animated
      ? "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      : "none";
    track.style.transform = `translateX(${offset}px)`;
    allCards.forEach((c, i) =>
      c.classList.toggle("active", i === currentIndex),
    );
  }

  function move(dir) {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex += dir;
    updateCarousel(true);

    setTimeout(() => {
      // 루프 점프
      if (currentIndex >= total * 2) {
        currentIndex = total;
        updateCarousel(false);
      } else if (currentIndex < total) {
        currentIndex = total * 2 - 1;
        updateCarousel(false);
      }
      isTransitioning = false;
    }, 520);
  }

  allCards.forEach((card, i) => {
    card.addEventListener("click", (e) => {
      if (isDragging) return;
      if (i !== currentIndex) {
        e.preventDefault();
        e.stopPropagation();
        const diff = i - currentIndex;
        move(diff);
      }
    });
  });

  // 드래그
  track.addEventListener("mousedown", (e) => {
    dragStartX = e.clientX;
    isDragging = false;
    track.style.transition = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (dragStartX === null) return;
    if (Math.abs(e.clientX - dragStartX) > 5) isDragging = true;
  });

  window.addEventListener("mouseup", (e) => {
    if (dragStartX === null) return;
    const diff = dragStartX - e.clientX;
    if (Math.abs(diff) > 50) move(diff > 0 ? 1 : -1);
    dragStartX = null;
    setTimeout(() => {
      isDragging = false;
    }, 0);
  });

  // 휠
  const carouselWrap = document.querySelector(".carousel-wrap");
  if (carouselWrap) {
    let wheelTimer = null;
    carouselWrap.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        if (wheelTimer) return;
        move(e.deltaY > 0 ? 1 : -1);
        wheelTimer = setTimeout(() => {
          wheelTimer = null;
        }, 600);
      },
      { passive: false },
    );
  }

  window.addEventListener("resize", () => updateCarousel(false));
  setTimeout(() => updateCarousel(false), 100);
}

// ── 상세페이지 패널 ──
function openShorts(index) {
  const panel = document.getElementById("shorts-panel");
  if (panel) panel.classList.remove("hidden");
}

function closeShorts() {
  const panel = document.getElementById("shorts-panel");
  if (panel) panel.classList.add("hidden");
}

// ── 숏츠 캐러셀 무한루프 ──
const shortsList = document.getElementById("shorts-list");
const originalShorts = Array.from(document.querySelectorAll(".shorts-card"));

if (shortsList && originalShorts.length) {
  const total = originalShorts.length;

  // 앞뒤 복제
  originalShorts.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.classList.add("clone");
    shortsList.appendChild(clone);
  });
  originalShorts.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.classList.add("clone");
    shortsList.insertBefore(clone, shortsList.firstChild);
  });

  const allShorts = Array.from(shortsList.querySelectorAll(".shorts-card"));
  let shortsIndex = total;
  let shortsTransitioning = false;
  let shortsDragStart = null;
  let shortsIsDragging = false;

  function updateShorts(animated = true) {
    const cardWidth = 446 + 24;
    const centerOffset = (window.innerWidth - 446) / 2;
    const offset = centerOffset - shortsIndex * cardWidth;
    shortsList.style.transition = animated
      ? "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      : "none";
    shortsList.style.transform = `translateX(${offset}px)`;
    allShorts.forEach((c, i) =>
      c.classList.toggle("active", i === shortsIndex),
    );
  }

  function moveShorts(dir) {
    if (shortsTransitioning) return;
    shortsTransitioning = true;
    shortsIndex += dir;
    updateShorts(true);

    setTimeout(() => {
      if (shortsIndex >= total * 2) {
        shortsIndex = total;
        updateShorts(false);
      } else if (shortsIndex < total) {
        shortsIndex = total * 2 - 1;
        updateShorts(false);
      }
      shortsTransitioning = false;
    }, 520);
  }

  // 클릭
  allShorts.forEach((card, i) => {
    card.addEventListener("click", (e) => {
      if (shortsIsDragging) return;
      if (i !== shortsIndex) {
        e.preventDefault();
        e.stopPropagation();
        moveShorts(i - shortsIndex);
      } else {
        const panel = document.getElementById("shorts-panel");
        if (panel) {
          panel.classList.remove("hidden");
          console.log("panel opened");
        }
      }
    });
  });

  // 드래그
  shortsList.addEventListener("mousedown", (e) => {
    shortsDragStart = e.clientX;
    shortsIsDragging = false;
    shortsList.style.transition = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (shortsDragStart === null) return;
    if (Math.abs(e.clientX - shortsDragStart) > 5) shortsIsDragging = true;
  });

  window.addEventListener("mouseup", (e) => {
    if (shortsDragStart === null) return;
    const diff = shortsDragStart - e.clientX;
    if (Math.abs(diff) > 50) moveShorts(diff > 0 ? 1 : -1);
    shortsDragStart = null;
    setTimeout(() => {
      shortsIsDragging = false;
    }, 0);
  });

  // 휠 — 끝에 도달하면 페이지 스크롤
  const detailSticky = document.getElementById("detail-sticky");
  if (detailSticky) {
    let shortsWheelTimer = null;
    detailSticky.addEventListener(
      "wheel",
      (e) => {
        const atStart = shortsIndex <= total;
        const atEnd = shortsIndex >= total * 2 - 1;
        if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
        e.preventDefault();
        if (shortsWheelTimer) return;
        moveShorts(e.deltaY > 0 ? 1 : -1);
        shortsWheelTimer = setTimeout(() => {
          shortsWheelTimer = null;
        }, 600);
      },
      { passive: false },
    );
  }

  window.addEventListener("resize", () => updateShorts(false));
  setTimeout(() => updateShorts(false), 100);
}

// ── 원형 텍스트 SNS 섹션에서만 보이기 ──
const snsSection = document.getElementById("section-sns");
const circleWrap = document.getElementById("sns-circle-wrap");

if (snsSection && circleWrap) {
  window.addEventListener(
    "scroll",
    () => {
      const rect = snsSection.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        circleWrap.classList.add("visible");
      } else {
        circleWrap.classList.remove("visible");
      }
    },
    { passive: true },
  );
}

// ── 스크롤 위치에 따라 네비 자동 활성화 ──
const sections = [
  { id: "hero", target: "hero" },
  { id: "section-profile", target: "section-profile" },
  { id: "section-service", target: "section-service" },
  { id: "section-detail", target: "section-detail" },
  { id: "section-sns", target: "section-sns" },
  { id: "section-brand", target: "section-brand" },
];

function updateActiveNav() {
  let current = "hero";
  sections.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= 150) current = id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.target === current);
  });
}

window.addEventListener("scroll", updateActiveNav, { passive: true });
updateActiveNav();
