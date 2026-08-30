type EventCallback = (data: unknown) => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data: unknown) {
    try {
      this.listeners.get(event)?.forEach((cb) => {
        try {
          cb(data);
        } catch {
          // ignore closed listeners
        }
      });
      this.listeners.get("*")?.forEach((cb) => {
        try {
          cb({ event, data });
        } catch {
          // ignore closed listeners
        }
      });
    } catch {
      // never let live updates break admin/user actions
    }
  }
}

export const appEvents = new EventEmitter();

export function broadcastConfigUpdate(data: Record<string, unknown>) {
  appEvents.emit("config_update", data);
}

export function broadcastNotification(userId: string, notification: unknown) {
  appEvents.emit(`notification:${userId}`, notification);
}
