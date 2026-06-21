(function () {
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
    { id: "google", name: "Google", icon: "G", color: "#4285f4", url: "https://www.google.com/search?q=" },
    { id: "bing", name: "Bing", icon: "B", color: "#00809d", url: "https://www.bing.com/search?q=" },
    { id: "baidu", name: "百度", icon: "百", color: "#e60012", url: "https://www.baidu.com/s?wd=" },
    { id: "duckduckgo", name: "DuckDuckGo", icon: "D", color: "#de5833", url: "https://duckduckgo.com/?q=" },
  ];

  const SEARCH_ENGINES = ENGINE_LIST.reduce((acc, e) => {
    acc[e.id] = e.url;
    return acc;
  }, {});

  let currentEngine = "google";

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
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;
    r = Math.max(0, Math.round(r - r * amount));
    g = Math.max(0, Math.round(g - g * amount));
    b = Math.max(0, Math.round(b - b * amount));
    return `rgb(${r}, ${g}, ${b})`;
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

  function renderShortcuts() {
    const grid = document.getElementById("shortcutsGrid");
    grid.innerHTML = "";
    DEFAULT_SHORTCUTS.forEach((item) => {
      const a = document.createElement("a");
      a.className = "shortcut-item";
      a.href = item.url;
      a.title = item.name;
      a.innerHTML = `
        <div class="shortcut-icon" style="background:${item.color}">${item.letter}</div>
        <div class="shortcut-name">${item.name}</div>
      `;
      grid.appendChild(a);
    });
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

  function showRandomQuote() {
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    document.getElementById("quote").textContent = quote;
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
  }

  document.addEventListener("DOMContentLoaded", init);
})();
