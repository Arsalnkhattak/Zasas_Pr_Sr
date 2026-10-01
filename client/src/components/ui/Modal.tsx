/**
 * Modal — wraps the native HTML <dialog> element.
 *
 * WHY <dialog>?
 *   The native <dialog> element gives us:
 *   - Built-in focus trapping (keyboard focus stays inside while open)
 *   - Esc key to close out of the box
 *   - Proper ARIA role="dialog" semantics for screen readers
 *   - Backdrop via the CSS ::backdrop pseudo-element
 *   No need for a heavy 3rd-party modal library.
 */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** If true, clicking the backdrop does NOT close the modal */
  persistent?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  persistent = false,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      // showModal() creates a top-layer modal with built-in backdrop
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Allow Esc key to call our onClose handler
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault(); // prevent default close so we can control state
      if (!persistent) onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose, persistent]);

  // Light-dismiss: click outside the dialog box
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (!persistent && e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={clsx(
        'w-full rounded-2xl border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm',
        'open:flex open:flex-col',
        sizeClasses[size]
      )}
      style={{ margin: 'auto' }}
    >
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </dialog>
  );
};
