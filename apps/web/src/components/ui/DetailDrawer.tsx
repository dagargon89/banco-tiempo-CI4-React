import { useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/lib/useFocusTrap';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function DetailDrawer({ open, onClose, title, children, footer }: DetailDrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, onClose);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-surface shadow-lg sm:w-[480px] lg:w-[560px]"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-text-1">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-text-3 hover:bg-surface-2 hover:text-text-1"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="border-t border-border px-5 py-3">{footer}</footer>
        )}
      </div>
    </>
  );
}
