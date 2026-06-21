/**
 * 事件总线 - 模块间通信核心
 * 支持事件订阅、发布、取消订阅
 */
class EventBus {
  constructor() {
    this._events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名
   * @param {Function} handler - 回调函数
   * @returns {Function} 取消订阅函数
   */
  on(event, handler) {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * 取消订阅
   */
  off(event, handler) {
    const handlers = this._events.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 发布事件（触发一次所有订阅者）
   */
  emit(event, payload) {
    const handlers = this._events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`[EventBus] Error in handler for "${event}":`, e);
        }
      });
    }
  }

  /**
   * 清除所有事件订阅
   */
  clear() {
    this._events.clear();
  }
}

export default EventBus;