
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationState {
  message: string;
  type: NotificationType;
}

interface NotificationToastProps {
  notification: NotificationState;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const { message, type } = notification;

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  // Monochrome / Minimalist styling
  const styles = {
    error: 'bg-black border-red-900 text-red-400 shadow-red-900/20',
    success: 'bg-black border-zinc-700 text-white shadow-white/10',
    info: 'bg-zinc-900 border-zinc-700 text-zinc-300 shadow-black'
  };

  const Icon = type === 'error' ? AlertCircle : type === 'success' ? CheckCircle : Info;

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-lg border px-4 py-3 shadow-xl backdrop-blur-sm transition-all animate-in slide-in-from-bottom-5 fade-in duration-300 ${styles[type]}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-bold tracking-wide uppercase">{message}</span>
      <button onClick={onClose} className="ml-2 rounded-full p-1 hover:bg-white/10">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
