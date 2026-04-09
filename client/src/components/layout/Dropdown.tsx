'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: React.ReactNode;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  className?: string;
}

export default function Dropdown({ items, trigger, position = 'bottom-right', className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  const positionClasses: Record<string, string> = {
    'bottom-left': 'top-full left-0 mt-1',
    'bottom-right': 'top-full right-0 mt-1',
    'top-left': 'bottom-full left-0 mb-1',
    'top-right': 'bottom-full right-0 mb-1',
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-1.5 hover:bg-hover rounded-full transition-colors shrink-0 outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {trigger || (
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-secondary">
            <path d="M12,16.5c0.83,0,1.5,0.67,1.5,1.5s-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5S11.17,16.5,12,16.5z M10.5,12 c0,0.83,0.67,1.5,1.5,1.5s1.5-0.67,1.5-1.5s-0.67-1.5-1.5-1.5S10.5,11.17,10.5,12z M10.5,4.5C10.5,5.33,11.17,6,12,6 s1.5-0.67,1.5-1.5S12.83,3,12,3S10.5,3.67,10.5,4.5z" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Invisible backdrop for mobile */}
          <div className="fixed inset-0 z-[998]" onClick={close} />

          <div
            ref={menuRef}
            className={`absolute z-[999] ${positionClasses[position]} min-w-[200px] py-2
              bg-card/95 dark:bg-[#282828] backdrop-blur-xl rounded-xl
              border border-border-light/20 dark:border-white/10
              shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]
              animate-scale-in origin-top-right`}
            role="menu"
          >
            {items.map((item) => {
              if (item.divider) {
                return <div key={item.id} className="my-1.5 mx-3 border-t border-border-light/20 dark:border-white/10" />;
              }
              return (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.onClick?.();
                    close();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors
                    ${item.danger
                      ? 'text-red-500 hover:bg-red-500/10'
                      : 'text-primary hover:bg-hover dark:hover:bg-white/10'
                    }`}
                  role="menuitem"
                >
                  {item.icon && <span className="w-5 h-5 flex items-center justify-center opacity-80">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
