import EventBus from './event-bus.js';
import ModuleRegistry from './module-registry.js';

/**
 * 应用主入口 - 负责初始化核心系统并启动所有模块
 */
class App {
  constructor() {
    this.eventBus = new EventBus();
    this.registry = new ModuleRegistry();
  }

  /**
   * 注册并启动应用
   * @param {Array} modules - 模块列表
   */
  async start(modules) {
    const container = document.getElementById('app');
    if (!container) {
      console.error('[App] Container #app not found');
      return;
    }

    // 注册所有模块
    modules.forEach(m => this.registry.register(m));

    // 初始化所有模块
    await this.registry.initAll(container, this.eventBus);

    // 发布启动完成事件
    this.eventBus.emit('app:ready', { modules });
  }
}

export default App;