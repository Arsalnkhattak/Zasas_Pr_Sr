/**
 * Toast Notification System
 *
 * Uses React Context + useReducer for centralized toast state management.
 * Toasts auto-dismiss after a configurable duration.
 */
import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

type Action = { type: 'ADD'; toast: Toast } | { type: 'REMOVE'; id: string };

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast];
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

const icons: Record<ToastType, React.FC<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyles: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, dispatch] = useReducer(reducer, []);
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const remove = useCallback((id: string) => {
    clearTimeout(timerRef.current[id]);
    delete timerRef.current[id];
    dispatch({ type: 'REMOVE', id });
  }, []);

  const add = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = Math.random().toString(36).slice(2);
      dispatch({ type: 'ADD', toast: { id, type, message, duration } });
      timerRef.current[id] = setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const toast = {
    success: (msg: string, d?: number) => add('success', msg, d),
    error: (msg: string, d?: number) => add('error', msg, d),
    warning: (msg: string, d?: number) => add('warning', msg, d),
    info: (msg: string, d?: number) => add('info', msg, d),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      {/* Toast container — fixed to top-right */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              className={clsx(
                'pointer-events-auto flex w-80 items-start gap-3 rounded-xl border p-4 shadow-lg transition-all',
                styles[t.type]
              )}
            >
              <Icon className={clsx('mt-0.5 h-4 w-4 shrink-0', iconStyles[t.type])} />
              <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.toast;
};
