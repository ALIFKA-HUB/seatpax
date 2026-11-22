'use client';
import { useEffect, useId, useRef, useState } from 'react';

export type AdminSelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

function IconCaretDown() {
  return (
    <svg width={14} height={14} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="m216.49 104.49-80 80a12 12 0 0 1-17 0l-80-80a12 12 0 0 1 17-17L128 159l71.51-71.52a12 12 0 0 1 17 17Z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width={15} height={15} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="m232.49 80.49-128 128a12 12 0 0 1-17 0l-56-56a12 12 0 1 1 17-17L96 183 215.51 63.51a12 12 0 0 1 17 17Z" />
    </svg>
  );
}

export default function AdminSelect({
  id,
  name,
  value,
  defaultValue,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  ariaLabel,
  className,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: readonly AdminSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const isControlled = value !== undefined;
  const fallbackDefault = defaultValue ?? (placeholder !== undefined ? '' : options[0]?.value ?? '');
  const [internalValue, setInternalValue] = useState(fallbackDefault);
  const currentValue = isControlled ? value : internalValue;

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nativeRef = useRef<HTMLSelectElement>(null);
  const listboxId = useId();

  const selected = options.find(opt => opt.value === currentValue);
  const displayLabel = selected?.label ?? placeholder ?? 'Pilih opsi';
  const isPlaceholder = !selected;

  useEffect(() => {
    const form = nativeRef.current?.form;
    if (!form || isControlled) return;
    const handleReset = () => {
      setInternalValue(fallbackDefault);
    };
    form.addEventListener('reset', handleReset);
    return () => form.removeEventListener('reset', handleReset);
  }, [fallbackDefault, isControlled]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function selectValue(nextValue: string) {
    if (!isControlled) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  }

  function moveSelection(delta: number) {
    const enabled = options.filter(o => !o.disabled);
    if (!enabled.length) return;
    const idx = Math.max(0, enabled.findIndex(o => o.value === currentValue));
    const next = enabled[(idx + delta + enabled.length) % enabled.length];
    if (!isControlled) setInternalValue(next.value);
    onChange?.(next.value);
  }

  return (
    <div
      ref={wrapperRef}
      className={className ? `admin-select ${className}` : 'admin-select'}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="admin-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!open) setOpen(true);
            else moveSelection(1);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) setOpen(true);
            else moveSelection(-1);
          }
        }}
      >
        <span className={isPlaceholder ? 'admin-select-value is-placeholder' : 'admin-select-value'}>
          {displayLabel}
        </span>
        <span className="admin-select-caret" aria-hidden="true">
          <IconCaretDown />
        </span>
      </button>

      <select
        ref={nativeRef}
        className="admin-select-native"
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        required={required}
        disabled={disabled}
        value={currentValue}
        onChange={event => {
          const next = event.target.value;
          if (!isControlled) setInternalValue(next);
          onChange?.(next);
        }}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {open && (
        <ul id={listboxId} role="listbox" className="admin-select-menu">
          {options.map(opt => {
            const isSelected = opt.value === currentValue;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  className="admin-select-option"
                  onClick={() => {
                    selectValue(opt.value);
                    triggerRef.current?.focus();
                  }}
                >
                  <span className="admin-select-option-text">
                    <strong>{opt.label}</strong>
                    {opt.description && <span>{opt.description}</span>}
                  </span>
                  {isSelected && (
                    <span className="admin-select-check" aria-hidden="true">
                      <IconCheck />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
