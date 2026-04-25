import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div *ngFor="let n of service.notifications()" 
           class="notification-card" 
           [ngClass]="n.type"
           (click)="service.remove(n.id)">
        
        <div class="glow-effect"></div>
        
        <div class="icon-container">
          <div class="icon-bg"></div>
          <svg *ngIf="n.type === 'success'" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          <svg *ngIf="n.type === 'error'" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          <svg *ngIf="n.type === 'warning'" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <svg *ngIf="n.type === 'info'" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>

        <div class="content">
          <div class="title">{{ getTitle(n) }}</div>
          <div class="message">{{ n.message }}</div>
        </div>

        <button class="close-btn">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div class="progress-track">
          <div class="progress-fill"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 32px;
      right: 32px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 16px;
      pointer-events: none;
      perspective: 1000px;
    }

    .notification-card {
      pointer-events: auto;
      width: 380px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 24px;
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 18px;
      box-shadow: 
        0 4px 6px -1px rgba(0, 0, 0, 0.05),
        0 20px 40px -15px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      animation: slideInPremium 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .notification-card:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 
        0 10px 15px -3px rgba(0, 0, 0, 0.05),
        0 30px 60px -20px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.95);
    }

    .glow-effect {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 0% 0%, rgba(255,255,255,0.4) 0%, transparent 60%);
      pointer-events: none;
    }

    .icon-container {
      position: relative;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-bg {
      position: absolute;
      inset: 0;
      border-radius: 16px;
      opacity: 0.15;
      transition: all 0.3s ease;
    }

    .icon {
      width: 24px;
      height: 24px;
      z-index: 1;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }

    .content {
      flex: 1;
      padding-top: 2px;
    }

    .title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
      display: block;
    }

    .message {
      font-size: 14px;
      font-weight: 600;
      color: #4b5563;
      line-height: 1.5;
    }

    .close-btn {
      opacity: 0.3;
      transition: all 0.2s ease;
      background: rgba(0,0,0,0.05);
      border: none;
      padding: 6px;
      border-radius: 10px;
      color: #1f2937;
      margin-top: -4px;
      margin-right: -4px;
    }

    .notification-card:hover .close-btn {
      opacity: 0.8;
      background: rgba(0,0,0,0.1);
    }

    /* Type Specifics */
    .success .icon-bg { background: #10b981; }
    .success .icon { color: #10b981; }
    .success .title { color: #059669; }
    .success { border-left: 6px solid #10b981; }

    .error .icon-bg { background: #ef4444; }
    .error .icon { color: #ef4444; }
    .error .title { color: #dc2626; }
    .error { border-left: 6px solid #ef4444; }

    .warning .icon-bg { background: #f59e0b; }
    .warning .icon { color: #f59e0b; }
    .warning .title { color: #d97706; }
    .warning { border-left: 6px solid #f59e0b; }

    .info .icon-bg { background: #3b82f6; }
    .info .icon { color: #3b82f6; }
    .info .title { color: #2563eb; }
    .info { border-left: 6px solid #3b82f6; }

    /* Progress Bar */
    .progress-track {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      width: 100%;
      background: rgba(0,0,0,0.02);
    }

    .progress-fill {
      height: 100%;
      width: 100%;
      transform-origin: left;
      animation: progressLinear 5s linear forwards;
    }

    .success .progress-fill { background: linear-gradient(90deg, #10b981, #34d399); }
    .error .progress-fill { background: linear-gradient(90deg, #ef4444, #f87171); }
    .warning .progress-fill { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .info .progress-fill { background: linear-gradient(90deg, #3b82f6, #60a5fa); }

    @keyframes slideInPremium {
      from { 
        opacity: 0; 
        transform: translateX(40px) scale(0.9) rotateY(-10deg); 
      }
      to { 
        opacity: 1; 
        transform: translateX(0) scale(1) rotateY(0); 
      }
    }

    @keyframes progressLinear {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
  `]
})
export class NotificationComponent {
  service = inject(NotificationService);

  getTitle(notification: Notification): string {
    if (notification.type === 'error') {
      if (notification.message.includes('permiso') || notification.message.includes('autorizado')) {
        return 'Acceso Denegado';
      }
      return 'Error del Sistema';
    }
    
    switch (notification.type) {
      case 'success': return 'Éxito';
      case 'warning': return 'Atención';
      case 'info': return 'Información';
      default: return 'Notificación';
    }
  }
}
