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
  let currentIndex = total;
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

      // 패널이 열려있으면 현재 active 카드 내용으로 자동 업데이트
      const panel = document.getElementById("shorts-panel");
      if (panel && !panel.classList.contains("hidden")) {
        const activeCard = allShorts[shortsIndex];
        if (activeCard) updatePanel(activeCard);
      }
    }, 520);
  }

  // ── 패널 내용 채우기 함수 ──
  function updatePanel(card) {
    const title = card.dataset.title || "—";
    const period = card.dataset.period || "—";
    const tools = card.dataset.tools || "—";
    const desc = card.dataset.desc || "—";
    const link = card.dataset.link || "#";
    const colors = card.dataset.colors || "";
    const fonts = card.dataset.fonts || "";
    const goal = card.dataset.goal || "";
    const problem = card.dataset.problem || "";
    const solve = card.dataset.solve || "";
    const retro = card.dataset.retro || "";

    const toolIconMap = {
      Photoshop:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-original.svg",
      Illustrator:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/illustrator/illustrator-original.svg",
      Figma:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
      HTML: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
      CSS: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
      JavaScript:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
    };

    const panelProject = document.getElementById("panel-project");
    const panelPeriod = document.getElementById("panel-period-val");
    const panelToolsBox = document.getElementById("panel-tools-icons");
    const panelDesc = document.getElementById("panel-desc");
    const panelLink = document.getElementById("panel-link");
    const panelGoal = document.getElementById("panel-goal");
    const panelGoalWrap = document.getElementById("panel-goal-wrap");
    const panelProblem = document.getElementById("panel-problem");
    const panelProblemWrap = document.getElementById("panel-problem-wrap");
    const panelSolve = document.getElementById("panel-solve");
    const panelSolveWrap = document.getElementById("panel-solve-wrap");
    const panelRetro = document.getElementById("panel-retro");
    const panelRetroWrap = document.getElementById("panel-retro-wrap");
    const panelColors = document.getElementById("panel-colors");
    const panelFonts = document.getElementById("panel-fonts");
    const panelDesignWrap = document.getElementById("panel-design-wrap");

    if (panelProject) panelProject.textContent = title;
    if (panelPeriod) panelPeriod.textContent = period;
    if (panelDesc) panelDesc.textContent = desc;
    if (panelLink) panelLink.href = link;

    if (panelGoal) panelGoal.textContent = goal;
    if (panelGoalWrap) panelGoalWrap.style.display = goal ? "block" : "none";
    if (panelProblem) panelProblem.textContent = problem;
    if (panelProblemWrap)
      panelProblemWrap.style.display = problem ? "block" : "none";
    if (panelSolve) panelSolve.textContent = solve;
    if (panelSolveWrap) panelSolveWrap.style.display = solve ? "block" : "none";
    if (panelRetro) panelRetro.textContent = retro;
    if (panelRetroWrap) panelRetroWrap.style.display = retro ? "block" : "none";

    // 컬러 칩
    if (panelColors) {
      panelColors.innerHTML = "";
      if (colors) {
        colors.split(",").forEach((hex) => {
          const wrap = document.createElement("div");
          wrap.style.cssText =
            "display:flex;flex-direction:column;align-items:center;gap:5px;";
          const chip = document.createElement("div");
          chip.style.cssText = `width:52px;height:32px;border-radius:6px;background:${hex.trim()};border:1px solid rgba(255,255,255,0.15);box-shadow:0 2px 6px rgba(0,0,0,0.3);`;
          const label = document.createElement("span");
          label.style.cssText =
            "font-size:9px;color:#888;font-family:monospace;letter-spacing:0.02em;";
          label.textContent = hex.trim();
          wrap.appendChild(chip);
          wrap.appendChild(label);
          panelColors.appendChild(wrap);
        });
      }
    }
    if (panelFonts) panelFonts.textContent = fonts ? `폰트: ${fonts}` : "";
    if (panelDesignWrap)
      panelDesignWrap.style.display = colors || fonts ? "block" : "none";

    // 툴 아이콘
    if (panelToolsBox) {
      panelToolsBox.innerHTML = "";
      tools
        .split("·")
        .map((t) => t.trim())
        .forEach((tool) => {
          const src = toolIconMap[tool];
          if (src) {
            const img = document.createElement("img");
            img.src = src;
            img.alt = tool;
            img.title = tool;
            img.style.cssText =
              "width:28px;height:28px;background:#fff;border-radius:6px;padding:2px;";
            panelToolsBox.appendChild(img);
          }
        });
    }
  }

  // ── 클릭 — 패널에 데이터 채우기 ──
  allShorts.forEach((card, i) => {
    card.addEventListener("click", (e) => {
      if (shortsIsDragging) return;
      if (i !== shortsIndex) {
        e.preventDefault();
        e.stopPropagation();
        moveShorts(i - shortsIndex);
      } else {
        updatePanel(card);
        const panel = document.getElementById("shorts-panel");
        if (panel) panel.classList.remove("hidden");
      }
    });
  });

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

// ── SNS 카드 클릭 → 큰 커버로 전환 (부드럽게) ──
function switchSnsCard(card, imgSrc, title, sub) {
  const coverImg = document.getElementById("player-cover-img");
  const playerTitle = document.getElementById("player-title");
  const playerSub = document.getElementById("player-sub");

  // 페이드 아웃
  if (coverImg) {
    coverImg.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    coverImg.style.opacity = "0";
    coverImg.style.transform = "scale(0.97)";
  }
  if (playerTitle) {
    playerTitle.style.transition = "opacity 0.2s ease";
    playerTitle.style.opacity = "0";
  }
  if (playerSub) {
    playerSub.style.transition = "opacity 0.2s ease";
    playerSub.style.opacity = "0";
  }

  setTimeout(() => {
    // 내용 교체
    if (coverImg) coverImg.src = imgSrc;
    if (playerTitle) playerTitle.textContent = title;
    if (playerSub) playerSub.textContent = sub;

    // 페이드 인
    if (coverImg) {
      coverImg.style.opacity = "1";
      coverImg.style.transform = "scale(1)";
    }
    if (playerTitle) playerTitle.style.opacity = "1";
    if (playerSub) playerSub.style.opacity = "1";
  }, 300);

  // 선택된 카드 표시
  document
    .querySelectorAll(".sns-small-card")
    .forEach((c) => c.classList.remove("selected"));
  card.classList.add("selected");
}

// ══════════════════════════════════════
// 브랜드 디자인 섹션 — 이미지 슬라이더
// ══════════════════════════════════════

(function initBrandSlider() {
  const slider = document.getElementById("brand-feed-slider");
  const prevBtn = document.getElementById("brand-prev");
  const nextBtn = document.getElementById("brand-next");
  const dots = document.querySelectorAll(".brand-dot-item");
  const curEl = document.getElementById("brand-slide-cur");
  const totalEl = document.getElementById("brand-slide-total");

  if (!slider) return;

  const slides = slider.querySelectorAll(".brand-slide");
  const total = slides.length;
  let cur = 0;
  let startX = null;
  let isDrag = false;

  if (totalEl) totalEl.textContent = total;

  function goTo(index) {
    cur = (index + total) % total;
    slider.style.transform = `translateX(-${cur * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === cur));
    if (curEl) curEl.textContent = cur + 1;
  }

  if (prevBtn) prevBtn.addEventListener("click", () => goTo(cur - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goTo(cur + 1));

  // 터치/드래그 스와이프
  const wrap = document.getElementById("brand-feed-slider-wrap");
  if (wrap) {
    wrap.addEventListener("mousedown", (e) => {
      startX = e.clientX;
      isDrag = false;
    });
    wrap.addEventListener("mousemove", (e) => {
      if (startX !== null && Math.abs(e.clientX - startX) > 6) isDrag = true;
    });
    wrap.addEventListener("mouseup", (e) => {
      if (startX === null) return;
      const diff = startX - e.clientX;
      if (Math.abs(diff) > 40) goTo(diff > 0 ? cur + 1 : cur - 1);
      startX = null;
      setTimeout(() => {
        isDrag = false;
      }, 0);
    });
    wrap.addEventListener("mouseleave", () => {
      startX = null;
    });

    wrap.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true },
    );
    wrap.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) goTo(diff > 0 ? cur + 1 : cur - 1);
      startX = null;
    });
  }

  goTo(0);
})();

// ── 페이지 전환 애니메이션 (슬라이드 업) ──
(function initPageTransition() {
  // 오버레이 생성
  const overlay = document.createElement("div");
  overlay.id = "page-transition-overlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: #0a0a0a;
    z-index: 9999;
    transform: translateY(100%);
    transition: transform 0.55s cubic-bezier(0.76, 0, 0.24, 1);
    pointer-events: none;
  `;
  document.body.appendChild(overlay);

  // 슬라이드 업 후 이동
  function navigateTo(url) {
    overlay.style.pointerEvents = "all";
    overlay.style.transform = "translateY(0%)";
    setTimeout(() => {
      window.location.href = url;
    }, 580);
  }

  // 캐러셀 카드 onclick 가로채기
  document.querySelectorAll(".carousel-card[onclick]").forEach((card) => {
    const attr = card.getAttribute("onclick");
    const match = attr && attr.match(/location\.href\s*=\s*['"](.+?)['"]/);
    if (match) {
      const url = match[1];
      card.removeAttribute("onclick");
      card.addEventListener("click", () => {
        if (card.classList.contains("active")) navigateTo(url);
      });
    }
  });

  // 뒤로가기 버튼에도 적용
  document.querySelectorAll("a.back-btn, a[href='index.html']").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(a.href);
    });
  });
})();
