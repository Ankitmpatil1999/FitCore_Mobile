import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  icon: PrefixIcon,
  className = '',
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) =>
    typeof opt === 'object' ? opt.value === value : opt === value
  );

  const getLabel = (opt) => {
    if (!opt) return placeholder;
    return typeof opt === 'object' ? opt.label || opt.value : opt;
  };

  const getValue = (opt) => {
    if (!opt) return '';
    return typeof opt === 'object' ? opt.value : opt;
  };

  const getIcon = (opt) => {
    if (typeof opt === 'object' && opt.icon) return opt.icon;
    return null;
  };

  const handleSelect = (opt) => {
    const val = getValue(opt);
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`custom-select-container ${className} ${isOpen ? 'open' : ''}`}
      style={style}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="select-trigger-left">
          {PrefixIcon && <span className="select-prefix-icon"><PrefixIcon size={14} color="#64748b" /></span>}
          {selectedOption && getIcon(selectedOption) && (
            <span className="select-opt-icon">{getIcon(selectedOption)}</span>
          )}
          <span className="select-trigger-label">
            {selectedOption ? getLabel(selectedOption) : placeholder}
          </span>
        </div>
        <span className={`select-chevron-icon ${isOpen ? 'chevron-up' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <div className="custom-select-menu" role="listbox">
          {options.map((opt, idx) => {
            const optVal = getValue(opt);
            const optLbl = getLabel(opt);
            const optIcon = getIcon(opt);
            const isSelected = optVal === value;

            return (
              <div
                key={optVal || idx}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(opt)}
                role="option"
                aria-selected={isSelected}
              >
                <div className="option-content-left">
                  {optIcon && <span className="option-icon-elem">{optIcon}</span>}
                  <span className="option-label-txt">{optLbl}</span>
                </div>
                {isSelected && (
                  <span className="option-check-mark">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
