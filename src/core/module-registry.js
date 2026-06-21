/**
 * 模块注册器 - 管理所有模块的生命周期
 * 每个模块必须实现: name, init(container, eventBus), destroy()
 */
class ModuleRegistry {
  constructor() {
    this._modules = new Map();
  }

  /**
   * 注册模块
   * @param {Object} module - 模块实例
   */
  register(module) {
    if (!module.name) {
      throw new Error('Module must have a "name" property');
    }
    if (this._modules.has(module.name)) {
      console.warn(`[ModuleRegistry] Module "${module.name}" already registered, replacing.`);
    }
    this._modules.set(module.name, module);
  }

  /**
   * 初始化所有已注册模块
   * @param {HTMLElement} appContainer - 应用根容器
   * @param {EventBus} eventBus - 事件总线实例
   */
  async initAll(appContainer, eventBus) {
    for (const [name, module] of this._modules) {
      try {
        console.log(`[ModuleRegistry] Initializing module: ${name}`);
        await module.init(appContainer, eventBus);
      } catch (e) {
        console.error(`[ModuleRegistry] Failed to init module "${name}":`, e);
      }
    }
  }

  /**
   * 获取指定模块
   */
  get(name) {
    return this._modules.get(name);
  }

  /**
   * 销毁所有模块
   */
  async destroyAll() {
    for (const [name, module] of this._modules) {
      try {
        if (typeof module.destroy === 'function') {
          await module.destroy();
        }
      } catch (e) {
        console.error(`[ModuleRegistry] Failed to destroy module "${name}":`, e);
      }
    }
    this._modules.clear();
  }
}

export default ModuleRegistry;