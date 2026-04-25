import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private nextId = 0;
  notifications = signal<Notification[]>([]);

  show(message: string, type: NotificationType = 'success', duration: number = 5000) {
    const id = this.nextId++;
    const notification: Notification = { id, type, message };
    
    this.notifications.update(list => [...list, notification]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string) { this.show(msg, 'error'); }
  warn(msg: string) { this.show(msg, 'warning'); }
  info(msg: string) { this.show(msg, 'info'); }

  remove(id: number) {
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  warnForm(form: any, labels: Record<string, string>) {
    const errors: string[] = [];
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control?.invalid) {
        errors.push(labels[key] || key);
      }
    });

    if (errors.length > 0) {
      this.show(`Por favor, verifique: ${errors.join(', ')}`, 'warning', 7000);
    }
  }
}
