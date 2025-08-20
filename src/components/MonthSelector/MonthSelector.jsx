import React, { useState, useRef, useEffect } from 'react';
import { MONTHS } from '../../utils/constants';
import './MonthSelector.css';

/**
 * MonthSelector Component - Select month and year for attendance
 */
const MonthSelector = ({ 
  currentMonth, 
  currentYear, 
  onMonthYearChange,
  minYear = 2020,
  maxYear = 2030
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const dropdownRef = useRef(null);
  
  // Get current date
  const today = new Date();
  const currentActualMonth = MONTHS[today.getMonth()].value;
  const currentActualYear = today.getFullYear();
  
  // Generate year options
  const years = Array.from(
    { length: maxYear - minYear + 1 }, 
    (_, i) => minYear + i
  );
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle month selection
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    if (onMonthYearChange) {
      onMonthYearChange(month, selectedYear);
    }
    setShowDropdown(false);
  };
  
  // Handle year change
  const handleYearChange = (year) => {
    setSelectedYear(year);
    if (onMonthYearChange) {
      onMonthYearChange(selectedMonth, year);
    }
  };
  
  // Navigate to previous month
  const handlePreviousMonth = () => {
    const currentIndex = MONTHS.findIndex(m => m.value === selectedMonth);
    if (currentIndex > 0) {
      handleMonthSelect(MONTHS[currentIndex - 1].value);
    } else if (selectedYear > minYear) {
      setSelectedYear(selectedYear - 1);
      handleMonthSelect(MONTHS[11].value);
      if (onMonthYearChange) {
        onMonthYearChange(MONTHS[11].value, selectedYear - 1);
      }
    }
  };
  
  // Navigate to next month
  const handleNextMonth = () => {
    const currentIndex = MONTHS.findIndex(m => m.value === selectedMonth);
    if (currentIndex < 11) {
      handleMonthSelect(MONTHS[currentIndex + 1].value);
    } else if (selectedYear < maxYear) {
      setSelectedYear(selectedYear + 1);
      handleMonthSelect(MONTHS[0].value);
      if (onMonthYearChange) {
        onMonthYearChange(MONTHS[0].value, selectedYear + 1);
      }
    }
  };
  
  // Go to current month
  const handleGoToToday = () => {
    setSelectedMonth(currentActualMonth);
    setSelectedYear(currentActualYear);
    if (onMonthYearChange) {
      onMonthYearChange(currentActualMonth, currentActualYear);
    }
    setShowDropdown(false);
  };
  
  // Check if it's current month
  const isCurrentMonth = selectedMonth === currentActualMonth && selectedYear === currentActualYear;
  
  // Get display text
  const getDisplayText = () => {
    const monthObj = MONTHS.find(m => m.value === selectedMonth);
    return `${monthObj?.label || selectedMonth} ${selectedYear}`;
  };
  
  return (
    <div className="month-selector" ref={dropdownRef}>
      <div className="month-selector-controls">
        {/* Previous Button */}
        <button
          className="nav-btn nav-prev"
          onClick={handlePreviousMonth}
          disabled={selectedYear === minYear && MONTHS[0].value === selectedMonth}
          aria-label="Previous month"
          title="Previous month"
        >
          ‹
        </button>
        
        {/* Current Selection */}
        <button
          className={`month-display ${isCurrentMonth ? 'is-current' : ''}`}
          onClick={() => setShowDropdown(!showDropdown)}
          aria-label="Select month and year"
        >
          <span className="month-text">{getDisplayText()}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        
        {/* Next Button */}
        <button
          className="nav-btn nav-next"
          onClick={handleNextMonth}
          disabled={selectedYear === maxYear && MONTHS[11].value === selectedMonth}
          aria-label="Next month"
          title="Next month"
        >
          ›
        </button>
        
        {/* Today Button */}
        {!isCurrentMonth && (
          <button
            className="today-btn"
            onClick={handleGoToToday}
            title="Go to current month"
            aria-label="Go to current month"
          >
            Today
          </button>
        )}
      </div>
      
      {/* Dropdown */}
      {showDropdown && (
        <div className="month-dropdown">
          <div className="dropdown-header">
            <span className="dropdown-title">Select Month & Year</span>
            <button 
              className="dropdown-close-btn"
              onClick={() => setShowDropdown(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          
          <div className="dropdown-body">
            {/* Year Selector */}
            <div className="year-selector">
              <button
                className="year-nav-btn"
                onClick={() => handleYearChange(Math.max(minYear, selectedYear - 1))}
                disabled={selectedYear === minYear}
                aria-label="Previous year"
              >
                «
              </button>
              
              <select
                className="year-select"
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              
              <button
                className="year-nav-btn"
                onClick={() => handleYearChange(Math.min(maxYear, selectedYear + 1))}
                disabled={selectedYear === maxYear}
                aria-label="Next year"
              >
                »
              </button>
            </div>
            
            {/* Month Grid */}
            <div className="month-grid">
              {MONTHS.map(month => {
                const isSelected = month.value === selectedMonth;
                const isCurrent = month.value === currentActualMonth && selectedYear === currentActualYear;
                
                return (
                  <button
                    key={month.value}
                    className={`month-option ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
                    onClick={() => handleMonthSelect(month.value)}
                    title={month.label}
                  >
                    <span className="month-abbr">{month.value}</span>
                    <span className="month-days">{month.days}d</span>
                  </button>
                );
              })}
            </div>
            
            {/* Quick Actions */}
            <div className="dropdown-footer">
              <button
                className="quick-action-btn"
                onClick={handleGoToToday}
              >
                Go to Current Month
              </button>
              
              <div className="month-info">
                {isCurrentMonth && (
                  <span className="current-indicator">● Current Month</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthSelector;