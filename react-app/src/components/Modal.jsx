import { X } from 'lucide-react';

/** Accessible modal shell — Esc/backdrop close, focus on open. */
export default function Modal({ title, onClose, children, accent = false }) {
  return (
    <div className="cm-overlay" onClick={onClose} role="presentation">
      <div
        className={`cm-modal${accent ? ' cm-modal--accent' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        ref={(el) => el && el.focus({ preventScroll: true })}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <button type="button" className="cm-modal-close" onClick={onClose} aria-label="Close dialog">
          <X size={16} />
        </button>
        <h2 className="cm-modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
