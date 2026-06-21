/**
 * 搜索模块
 * 支持多搜索引擎切换、键盘快捷键
 */
const SEARCH_ENGINES = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
];

class SearchModule {
  constructor() {
    this.name = 'search';
    this._container = null;
    this._eventBus = null;
    this._currentEngine = SEARCH_ENGINES[0];
    this._inputEl = null;
    this._engineSelectEl = null;
    this._unsubscribe = null;
  }

  /**
   * 初始化模块
   */
  init(appContainer, eventBus) {
    this._container = document.createElement('div');
    this._container.className = 'search-module';
    this._container.innerHTML = this._render();
    appContainer.appendChild(this._container);

    this._eventBus = eventBus;
    this._inputEl = this._container.querySelector('.search-input');
    this._engineSelectEl = this._container.querySelector('.search-engine-select');

    this._bindEvents();
    console.log('[SearchModule] Initialized');
  }

  /**
   * 渲染搜索模块 HTML
   */
  _render() {
    const engineOptions = SEARCH_ENGINES
      .map(e => `<option value="${e.id}">${e.name}</option>`)
      .join('');

    return `
      <div class="search-wrapper">
        <div class="search-bar">
          <input
            type="text"
            class="search-input"
            placeholder="输入搜索内容..."
            autocomplete="off"
          />
          <select class="search-engine-select">
            ${engineOptions}
          </select>
          <button class="search-btn" title="搜索">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 绑定事件
   */
  _bindEvents() {
    const searchBtn = this._container.querySelector('.search-btn');

    // 搜索按钮点击
    searchBtn.addEventListener('click', () => this._doSearch());

    // 回车搜索
    this._inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this._doSearch();
      }
    });

    // 搜索引擎切换
    this._engineSelectEl.addEventListener('change', (e) => {
      const engine = SEARCH_ENGINES.find(eng => eng.id === e.target.value);
      if (engine) {
        this._currentEngine = engine;
        this._eventBus.emit('search:engine:changed', { engine });
      }
    });

    // 全局快捷键 Ctrl+K 聚焦搜索框
    this._unsubscribe = this._eventBus.on('app:keydown', ({ key, ctrlKey, metaKey }) => {
      if ((ctrlKey || metaKey) && key === 'k') {
        this._inputEl.focus();
        this._inputEl.select();
      }
    });
  }

  /**
   * 执行搜索
   */
  _doSearch() {
    const query = this._inputEl.value.trim();
    if (!query) return;

    const url = this._currentEngine.url + encodeURIComponent(query);
    this._eventBus.emit('search:query', { query, engine: this._currentEngine });
    window.open(url, '_self');
  }

  /**
   * 销毁模块
   */
  destroy() {
    if (this._unsubscribe) this._unsubscribe();
    if (this._container) {
      this._container.remove();
    }
  }
}

export default SearchModule;