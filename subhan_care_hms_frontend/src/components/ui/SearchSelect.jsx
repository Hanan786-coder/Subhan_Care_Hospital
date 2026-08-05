import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import styles from './SearchSelect.module.css';

/**
 * SearchSelect Component
 * Allows searching, sorting, and selecting from a list of options with 1 clean input bar.
 */
const SearchSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Search & select...',
  label,
  required = false,
  disabled = false,
  getOptionLabel = (opt) => opt.label || opt.name || String(opt),
  getOptionValue = (opt) => opt.value || opt._id || opt.id || String(opt),
  getOptionSublabel = (opt) => opt.sublabel || opt.cnic || opt.specialization || opt.email || '',
  sortBy = 'label' // 'label' or 'sublabel'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = useMemo(() => {
    return options.find((opt) => String(getOptionValue(opt)) === String(value));
  }, [options, value, getOptionValue]);

  const sortedAndFilteredOptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let result = options.filter((opt) => {
      if (!term) return true;
      const mainLabel = getOptionLabel(opt).toLowerCase();
      const subLabel = getOptionSublabel(opt).toLowerCase();
      const val = String(getOptionValue(opt)).toLowerCase();
      return mainLabel.includes(term) || subLabel.includes(term) || val.includes(term);
    });

    result.sort((a, b) => {
      const labelA = getOptionLabel(a).toLowerCase();
      const labelB = getOptionLabel(b).toLowerCase();
      return labelA.localeCompare(labelB);
    });

    return result;
  }, [options, searchTerm, getOptionLabel, getOptionSublabel, getOptionValue]);

  const handleSelect = (opt) => {
    onChange(getOptionValue(opt), opt);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', null);
    setSearchTerm('');
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div
        className={`${styles.selectBox} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <Search size={16} className={styles.searchIcon} />

        <div className={styles.valueDisplay}>
          {selectedOption ? (
            <div className={styles.selectedItem}>
              <span className={styles.mainLabel}>{getOptionLabel(selectedOption)}</span>
              {getOptionSublabel(selectedOption) && (
                <span className={styles.subLabel}>({getOptionSublabel(selectedOption)})</span>
              )}
            </div>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </div>

        <div className={styles.actions}>
          {selectedOption && !disabled && (
            <button type="button" className={styles.clearBtn} onClick={handleClear} title="Clear selection">
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.chevronRotated : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          <div className={styles.searchHeader}>
            <Search size={14} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Filter by name, ID, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button type="button" className={styles.clearSearchBtn} onClick={() => setSearchTerm('')}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className={styles.optionsList}>
            {sortedAndFilteredOptions.length > 0 ? (
              sortedAndFilteredOptions.map((opt) => {
                const optVal = getOptionValue(opt);
                const isSelected = String(optVal) === String(value);

                return (
                  <div
                    key={String(optVal)}
                    className={`${styles.optionItem} ${isSelected ? styles.selectedOption : ''}`}
                    onClick={() => handleSelect(opt)}
                  >
                    <div className={styles.optionContent}>
                      <span className={styles.optMainLabel}>{getOptionLabel(opt)}</span>
                      {getOptionSublabel(opt) && (
                        <span className={styles.optSubLabel}>{getOptionSublabel(opt)}</span>
                      )}
                    </div>
                    {isSelected && <Check size={16} className={styles.checkIcon} />}
                  </div>
                );
              })
            ) : (
              <div className={styles.noOptions}>No matching records found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSelect;
