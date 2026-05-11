'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selected: string;
  onSelect: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}

export default function Dropdown({
  options,
  selected,
  onSelect,
  placeholder,
  disabled = false,
  className = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabel = options.find(o => o.value === selected)?.label || placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        className={`w-full px-3 py-2 border rounded bg-white text-left flex items-center justify-between
          ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-300'}
        `}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-500'}>{selectedLabel}</span>
        <ChevronDown size={18} className="text-gray-400" />
      </button>

      {open && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
          {options.map(opt => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm
                  ${opt.value === selected ? 'bg-indigo-100 font-medium text-indigo-700' : 'text-gray-700'}
                `}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}