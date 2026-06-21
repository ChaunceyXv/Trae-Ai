(function () {
  const STORAGE_KEY = "milky_shortcuts";
  const LONG_PRESS_DURATION = 500;

  const DEFAULT_SHORTCUTS = [
    { name: "Google", url: "https://www.google.com", color: "#4285f4", letter: "G" },
    { name: "YouTube", url: "https://www.youtube.com", color: "#ff0000", letter: "Y" },
    { name: "GitHub", url: "https://github.com", color: "#333333", letter: "GH" },
    { name: "Twitter", url: "https://twitter.com", color: "#1da1f2", letter: "X" },
    { name: "知乎", url: "https://www.zhihu.com", color: "#0066ff", letter: "知" },
    { name: "微博", url: "https://weibo.com", color: "#e6162d", letter: "微" },
    { name: "B站", url: "https://www.bilibili.com", color: "#00a1d6", letter: "B" },
    { name: "豆瓣", url: "https://www.douban.com", color: "#2e963d", letter: "豆" },
  ];

  const QUOTES = [
    "每一个不曾起舞的日子，都是对生命的辜负。",
    "生活明朗，万物可爱。",
    "把时间用在进步上，而不是抱怨上。",
    "愿你成为自己的太阳，无需凭借谁的光。",
    "世界以痛吻我，要我报之以歌。",
    "你若盛开，清风自来。",
    "岁月极美，在于它必然的流逝。",
    "星光不问赶路人，时光不负有心人。",
  ];

  const ENGINE_LIST = [
    { id: "bing", name: "Bing", icon: "B", color: "#00809d", url: "https://www.bing.com/search?q=" },
    { id: "baidu", name: "Baidu", icon: "B", color: "#4285f4", url: "https://www.baidu.com/s?wd=" },
    { id: "google", name: "Google", icon: "G", color: "#e60012", url: "https://www.google.com/search?q=" },
    { id: "duckduckgo", name: "DuckDuckGo", icon: "D", color: "#de5833", url: "https://duckduckgo.com/?q=" },
  ];

  const SEARCH_ENGINES = ENGINE_LIST.reduce((acc, e) => {
    acc[e.id] = e.url;
    return acc;
  }, {});

  let currentEngine = localStorage.getItem("milky_engine") || "bing";
  let editMode = false;

  // 拖拽状态
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartIndex = -1;
  let dragOverIndex = -1;
  let dragging = false;
  let dragStartRect = null;
  let dragCurrentTargetIndex = -1;
  let dragCardRects = [];
  let dragGridRect = null;
  let dragCanceled = false;
  const DRAG_THRESHOLD = 6;

  // 长按状态
  let longPressTimer = null;
  let longPressTriggered = false;
  let shortcuts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));

  function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const full = clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
    const num = parseInt(full, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function darken(hex, amount) {
    const clean = hex.replace("#", "");
    const full = clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
    const num = parseInt(full, 16);
    let r = Math.max(0, (num >> 16) & 255);
    let g = Math.max(0, (num >> 8) & 255);
    let b = Math.max(0, num & 255);
    r = Math.max(0, Math.round(r - r * amount));
    g = Math.max(0, Math.round(g - g * amount));
    b = Math.max(0, Math.round(b - b * amount));
    return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
  }

  function applyBrandColor(hex) {
    const root = document.documentElement;
    root.style.setProperty("--brand-color", hex);
    root.style.setProperty("--brand-color-hover", darken(hex, 0.22));
    root.style.setProperty("--brand-color-soft", hexToRgba(hex, 0.14));
    root.style.setProperty("--brand-color-ring", hexToRgba(hex, 0.18));
  }

  function pad(n) {
    return n < 10 ? "0" + n : n;
  }

  function updateTime() {
    const now = new Date();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    document.getElementById("time").textContent = `${hours}:${minutes}`;

    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekday = weekdays[now.getDay()];
    document.getElementById("date").textContent = `${year}年${month}月${day}日 ${weekday}`;
  }

  function updateGreeting() {
    const hour = new Date().getHours();
    let greeting;
    if (hour >= 5 && hour < 12) greeting = "早安，开启美好的一天";
    else if (hour >= 12 && hour < 14) greeting = "午安，稍作休息";
    else if (hour >= 14 && hour < 18) greeting = "下午好，继续加油";
    else if (hour >= 18 && hour < 22) greeting = "晚安，辛苦了";
    else greeting = "夜深了，注意休息";
    document.getElementById("greeting").textContent = greeting;
  }

  function saveShortcuts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  }

  function deleteShortcut(index) {
    shortcuts.splice(index, 1);
    saveShortcuts();
    renderShortcuts();
  }

  function setEditMode(on) {
    editMode = on;
    const grid = document.getElementById("shortcutsGrid");
    if (on) {
      grid.classList.add("edit-mode");
    } else {
      grid.classList.remove("edit-mode");
    }
  }

  function clearLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function clearDragState() {
    dragging = false;
    dragCanceled = false;
    dragStartIndex = -1;
    dragOverIndex = -1;
    dragCurrentTargetIndex = -1;
    dragStartRect = null;
    dragGridRect = null;
    const recordedRects = dragCardRects;
    dragCardRects = [];
    (recordedRects.length ? recordedRects : document.querySelectorAll(".shortcut-item")).forEach((item) => {
      const el = item && item.el ? item.el : item;
      el.classList.remove("dragging");
      el.classList.remove("drag-target");
      el.classList.remove("pressed");
      el.classList.remove("dragging-active");
      el.style.transform = "";
      el.style.transition = "";
      el.style.visibility = "";
      el.style.zIndex = "";
    });
  }

  function moveShortcut(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const temp = shortcuts[fromIndex];
    shortcuts[fromIndex] = shortcuts[toIndex];
    shortcuts[toIndex] = temp;
    saveShortcuts();
  }

  function renderShortcuts() {
    const grid = document.getElementById("shortcutsGrid");
    grid.innerHTML = "";
    shortcuts.forEach((item, index) => {
      const a = document.createElement("a");
      a.className = "shortcut-item";
      a.href = item.url;
      a.title = item.name;
      a.dataset.index = index;
      a.innerHTML = `
        <span class="shortcut-delete" data-delete="${index}" title="删除">×</span>
        <div class="shortcut-icon" style="background:${item.color}">${item.letter}</div>
        <div class="shortcut-name">${item.name}</div>
      `;

      // Delete button
      a.querySelector(".shortcut-delete").addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        deleteShortcut(index);
      });

      // Pointer events: long press + drag + click
      a.addEventListener("pointerdown", (ev) => {
        // 左键或触摸才响应
        if (ev.pointerType === "mouse" && ev.button !== 0) return;
        // 如果点在删除按钮上，不启动拖拽
        if (ev.target.closest(".shortcut-delete")) return;

        dragStartX = ev.clientX;
        dragStartY = ev.clientY;
        dragStartIndex = index;
        dragging = false;
        dragCanceled = false;
        longPressTriggered = false;
        dragStartRect = a.getBoundingClientRect();
        dragCurrentTargetIndex = -1;
        dragOverIndex = -1;

        // 记录所有卡片的原始位置（拖拽过程中不重新计算）
        dragCardRects = [];
        document.querySelectorAll(".shortcut-item").forEach((el) => {
          const idx = parseInt(el.dataset.index);
          dragCardRects[idx] = { el, rect: el.getBoundingClientRect() };
        });

        // 记录快捷方式卡片的边界
        const shortcutsCard = document.getElementById("shortcutsGrid").closest(".shortcuts-card");
        dragGridRect = shortcutsCard ? shortcutsCard.getBoundingClientRect() : null;

        a.classList.add("pressed");
        a.setPointerCapture(ev.pointerId);

        longPressTimer = setTimeout(() => {
          longPressTriggered = true;
          setEditMode(true);
          a.classList.remove("pressed");
          a.classList.add("wobble");
          setTimeout(() => a.classList.remove("wobble"), 400);
        }, LONG_PRESS_DURATION);
      });

      a.addEventListener("pointermove", (ev) => {
        if (dragStartIndex < 0) return;

        const dx = ev.clientX - dragStartX;
        const dy = ev.clientY - dragStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 一旦移动超过阈值，取消长按
        if (dist > DRAG_THRESHOLD) {
          clearLongPress();
        }

        if (!editMode) return;

        if (!dragging && dist > DRAG_THRESHOLD) {
          dragging = true;
          a.classList.add("dragging");
          a.classList.add("dragging-active");
          a.classList.remove("pressed");
          a.style.zIndex = "100";
          a.style.transition = "none";
          dragOverIndex = dragStartIndex;
        }

        if (dragging) {
          // 检查是否越界快捷方式卡片
          let outOfGrid = false;
          if (dragGridRect) {
            outOfGrid =
              ev.clientX < dragGridRect.left ||
              ev.clientX > dragGridRect.right ||
              ev.clientY < dragGridRect.top ||
              ev.clientY > dragGridRect.bottom;
          }

          // 越界则取消：动画弹回原位，后续不再跟随手
          if (outOfGrid && !dragCanceled) {
            dragCanceled = true;
            a.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
            a.style.transform = "";
            // 目标卡片也回原位
            if (dragCurrentTargetIndex >= 0 && dragCardRects[dragCurrentTargetIndex]) {
              const t = dragCardRects[dragCurrentTargetIndex].el;
              t.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
              t.style.transform = "";
              t.classList.remove("drag-target");
            }
            dragCurrentTargetIndex = -1;
            dragOverIndex = dragStartIndex;
          }

          // 取消后不再跟随手
          if (!dragCanceled) {
            // 1. 跟手跟随
            a.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;

            // 2. 通过原始记录的 rects 判断指针落在哪个卡片上（稳定，不闪烁）
            let targetIndex = -1;
            for (let i = 0; i < dragCardRects.length; i++) {
              const item = dragCardRects[i];
              if (!item || item.el === a) continue;
              const r = item.rect;
              if (
                ev.clientX >= r.left &&
                ev.clientX <= r.right &&
                ev.clientY >= r.top &&
                ev.clientY <= r.bottom
              ) {
                targetIndex = i;
                break;
              }
            }

            // 3. 目标变化时：旧目标回归原位，新目标滑到被拖卡片的原始位置
            if (targetIndex !== dragCurrentTargetIndex) {
              // 旧目标回归原位
              if (dragCurrentTargetIndex >= 0 && dragCardRects[dragCurrentTargetIndex]) {
                const oldTarget = dragCardRects[dragCurrentTargetIndex].el;
                oldTarget.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
                oldTarget.style.transform = "";
                oldTarget.classList.remove("drag-target");
              }

              // 新目标滑到被拖卡片原始位置
              if (targetIndex >= 0 && dragCardRects[targetIndex]) {
                const newTarget = dragCardRects[targetIndex].el;
                const offsetX = dragStartRect.left - dragCardRects[targetIndex].rect.left;
                const offsetY = dragStartRect.top - dragCardRects[targetIndex].rect.top;
                newTarget.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
                newTarget.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(0.95)`;
                newTarget.classList.add("drag-target");
                dragOverIndex = targetIndex;
              }
              // 当指针不在任何卡片上时，dragOverIndex 重置为起始索引（不交换）
              if (targetIndex < 0) {
                dragOverIndex = dragStartIndex;
              }
              dragCurrentTargetIndex = targetIndex;
            }
          }
        }
      });

      function endDrag(ev) {
        clearLongPress();

        if (dragging) {
          const fromIndex = dragStartIndex;
          const toIndex = dragOverIndex;

          // 先清除目标卡片的让位样式
          document.querySelectorAll(".shortcut-item").forEach((el) => {
            if (el !== a) {
              el.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
              el.style.transform = "";
              el.classList.remove("drag-target");
            }
          });

          // 被拖卡片回归原位（取消时）或直接完成交换
          if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
            // 松手完成交换
            a.style.transition = "none";
            a.style.transform = "";
            a.style.zIndex = "";
            clearDragState();
            try { a.releasePointerCapture(ev.pointerId); } catch (e) {}

            moveShortcut(fromIndex, toIndex);
            renderShortcuts();
          } else {
            // 没有有效目标：被拖卡片动画回原位
            a.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
            a.style.transform = "";
            a.style.zIndex = "";
            clearDragState();
            try { a.releasePointerCapture(ev.pointerId); } catch (e) {}
          }
          return;
        }

        a.style.transform = "";
        a.style.zIndex = "";
        clearDragState();
        try { a.releasePointerCapture(ev.pointerId); } catch (e) {}

        if (longPressTriggered) {
          longPressTriggered = false;
          return;
        }
      }

      a.addEventListener("pointerup", endDrag);
      a.addEventListener("pointercancel", (ev) => {
        clearLongPress();
        // 所有卡片回归原位
        document.querySelectorAll(".shortcut-item").forEach((el) => {
          el.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
          el.style.transform = "";
        });
        a.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
        a.style.transform = "";
        a.style.zIndex = "";
        clearDragState();
      });
      a.addEventListener("lostpointercapture", () => {
        clearLongPress();
        document.querySelectorAll(".shortcut-item").forEach((el) => {
          el.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
          el.style.transform = "";
        });
        a.style.transform = "";
        a.style.zIndex = "";
        clearDragState();
      });

      // click：在编辑模式并且不是拖拽之后，阻止跳转
      a.addEventListener("click", (ev) => {
        if (editMode) {
          ev.preventDefault();
          return;
        }
      });

      grid.appendChild(a);
    });

    if (editMode) {
      grid.classList.add("edit-mode");
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const input = document.getElementById("searchInput");
    const query = input.value.trim();
    if (!query) return;
    if (/^https?:\/\//i.test(query)) {
      window.location.href = query;
    } else if (/^[\w-]+(\.[\w-]+)+/.test(query) && !query.includes(" ")) {
      window.location.href = "https://" + query;
    } else {
      window.location.href = SEARCH_ENGINES[currentEngine] + encodeURIComponent(query);
    }
  }

  function renderEngineMenu() {
    const menu = document.getElementById("engineMenu");
    menu.innerHTML = "";
    ENGINE_LIST.forEach((e) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.dataset.engine = e.id;
      if (e.id === currentEngine) li.classList.add("active");
      li.innerHTML = `<span class="engine-icon" style="background:${e.color}">${e.icon}</span><span class="engine-label">${e.name}</span>`;
      li.addEventListener("click", (ev) => {
        ev.stopPropagation();
        selectEngine(e.id);
        closeEngineMenu();
        document.getElementById("searchInput").focus();
      });
      menu.appendChild(li);
    });
  }

  function updateEngineTrigger() {
    const engine = ENGINE_LIST.find((e) => e.id === currentEngine);
    const iconEl = document.getElementById("engineIcon");
    iconEl.textContent = engine.icon;
    document.getElementById("engineLogo").textContent = engine.name;
    applyBrandColor(engine.color);
  }

  function selectEngine(id) {
    currentEngine = id;
    localStorage.setItem("milky_engine", id);
    updateEngineTrigger();
    renderEngineMenu();
  }

  function toggleEngineMenu() {
    const wrapper = document.getElementById("engineSelect");
    const trigger = document.getElementById("engineTrigger");
    const isOpen = wrapper.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  }

  function closeEngineMenu() {
    const wrapper = document.getElementById("engineSelect");
    const trigger = document.getElementById("engineTrigger");
    wrapper.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  }

  function bindEngines() {
    renderEngineMenu();
    updateEngineTrigger();
    const trigger = document.getElementById("engineTrigger");
    trigger.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleEngineMenu();
    });
    document.addEventListener("click", (ev) => {
      if (!document.getElementById("engineSelect").contains(ev.target)) {
        closeEngineMenu();
      }
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closeEngineMenu();
    });
  }

  let scrollTimer = null;
  function showRandomQuote() {
    if (scrollTimer) {
      clearTimeout(scrollTimer);
      scrollTimer = null;
    }
    const bar = document.querySelector(".bottom-bar");
    const el = document.getElementById("quote");
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    bar.classList.remove("scrolling");
    el.classList.remove("quote-text");
    el.style.transition = "none";
    el.style.transform = "translateX(0)";
    el.textContent = quote;
    if (bar.scrollWidth > bar.clientWidth + 2) {
      bar.classList.add("scrolling");
      el.classList.add("quote-text");
      setTimeout(() => {
        startScroll(bar, el);
      }, 1500);
    }
  }

  function startScroll(bar, el) {
    const distance = bar.scrollWidth - bar.clientWidth;
    const duration = Math.max(6000, distance * 25);
    let phase = 0;
    function tick() {
      if (phase === 0) {
        el.style.transition = `transform ${duration}ms linear`;
        el.style.transform = `translateX(-${distance}px)`;
        phase = 1;
        scrollTimer = setTimeout(tick, duration);
      } else {
        el.style.transition = "none";
        el.style.transform = "translateX(0)";
        phase = 0;
        scrollTimer = setTimeout(tick, 1200);
      }
    }
    tick();
  }

  function init() {
    updateTime();
    setInterval(updateTime, 1000 * 30);
    updateGreeting();
    renderShortcuts();
    bindEngines();
    showRandomQuote();
    document.getElementById("searchForm").addEventListener("submit", handleSearch);

    document.addEventListener("contextmenu", (ev) => ev.preventDefault());
    document.addEventListener("gesturestart", (ev) => ev.preventDefault());
    document.addEventListener("gesturechange", (ev) => ev.preventDefault());
    document.addEventListener("gestureend", (ev) => ev.preventDefault());

    let lastTouch = 0;
    document.addEventListener("touchend", (ev) => {
      const now = Date.now();
      if (now - lastTouch <= 300) ev.preventDefault();
      lastTouch = now;
    }, { passive: false });

    // 点击快捷方式卡片之外的空白处退出编辑模式
    document.addEventListener("click", (ev) => {
      if (!editMode) return;
      const grid = document.getElementById("shortcutsGrid");
      const isOnShortcutItem = ev.target.closest && ev.target.closest(".shortcut-item");
      const isOnDelete = ev.target.closest && ev.target.closest(".shortcut-delete");
      if (!isOnShortcutItem && !isOnDelete) {
        setEditMode(false);
      }
    });

    // ── 底部抽屉拖拽 ──
    const drawer = document.getElementById("drawer");
    const bottomBar = document.querySelector(".bottom-bar");
    const CLOSE_THRESHOLD = 60;
    let drawerDragging = false;
    let drawerDragStartY = 0;
    let drawerOpen = false;

    function openDrawer() {
      drawer.classList.add("open");
      drawerOpen = true;
    }
    function closeDrawer() {
      drawer.classList.remove("open");
      drawerOpen = false;
    }

    // 底部指示条（抽屉把手）：向上拖拽打开抽屉
    bottomBar.addEventListener("pointerdown", (e) => {
      if (drawerOpen) return;
      drawerDragging = true;
      drawerDragStartY = e.clientY;
    });

    // 抽屉内容区域：向下拖拽关闭
    drawer.addEventListener("pointerdown", (e) => {
      if (!drawerOpen) return;
      drawerDragging = true;
      drawerDragStartY = e.clientY;
    });

    document.addEventListener("pointermove", (e) => {
      if (!drawerDragging) return;
      if (drawerOpen) {
        const delta = e.clientY - drawerDragStartY;
        if (delta > CLOSE_THRESHOLD) {
          drawerDragging = false;
          closeDrawer();
        }
      } else {
        const delta = drawerDragStartY - e.clientY;
        if (delta > CLOSE_THRESHOLD) {
          drawerDragging = false;
          openDrawer();
        }
      }
    });

    document.addEventListener("pointerup", () => {
      drawerDragging = false;
    });

    // 点击抽屉内容区域（不是指示条）空白处关闭
    document.addEventListener("click", (e) => {
      if (!drawerOpen) return;
      if (bottomBar.contains(e.target)) return;
      if (drawer.contains(e.target)) {
        closeDrawer();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
