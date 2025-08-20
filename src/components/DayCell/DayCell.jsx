import React, { useState, useEffect, useRef } from 'react';
import { ATTENDANCE_CODES } from '../../utils/constants';
import './DayCell.css';

/**
 * DayCell Component - Individual attendance cell with dropdown
 */
const DayCell = ({ 
  day, 
  value, 
  onChange, 
  disabled = false,
  isWeekend = false,
  isHoliday = false,
  isToday = false,
  employeeId,
  employeeName
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const cellRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Get attendance code info
  const getCodeInfo = (code) => {
    if (!code) return null;
    return ATTENDANCE_CODES[code.toUpperCase()] || null;
  };
  
  const codeInfo = getCodeInfo(value);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cellRef.current && !cellRef.current.contains(event.target)) {
        if (showDropdown) {
          setShowDropdown(false);
          setIsEditing(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);
  
  // Handle cell click
  const handleCellClick = () => {
    if (disabled) return;
    setIsEditing(true);
    setShowDropdown(true);
    setTempValue(value || '');
  };
  
  // Handle keyboard input
  const handleKeyPress = (e) => {
    if (disabled) return;
    
    const key = e.key.toUpperCase();
    
    // Check if it's a valid attendance code
    if (ATTENDANCE_CODES[key]) {
      e.preventDefault();
      onChange(day, key);
      setShowDropdown(false);
      setIsEditing(false);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onChange(day, '');
      setShowDropdown(false);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setIsEditing(false);
    } else if (e.key === 'Enter' && isEditing) {
      setShowDropdown(!showDropdown);
    }
  };
  
  // Handle dropdown selection
  const handleDropdownSelect = (code) => {
    onChange(day, code);
    setShowDropdown(false);
    setIsEditing(false);
  };
  
  // Handle clear
  const handleClear = () => {
    onChange(day, '');
    setShowDropdown(false);
    setIsEditing(false);
  };
  
  // Determine cell classes
  const getCellClasses = () => {
    const classes = ['day-cell'];
    
    if (codeInfo) {
      classes.push(`status-${value.toLowerCase()}`);
    }
    
    if (isWeekend) classes.push('is-weekend');
    if (isHoliday) classes.push('is-holiday');
    if (isToday) classes.push('is-today');
    if (disabled) classes.push('is-disabled');
    if (isEditing) classes.push('is-editing');
    
    return classes.join(' ');
  };
  
  // Get cell style based on attendance code
  const getCellStyle = () => {
    if (codeInfo) {
      return {
        backgroundColor: codeInfo.bgColor,
        color: codeInfo.color,
        borderColor: codeInfo.color
      };
    }
    return {};
  };
  
  return (
    <div 
      ref={cellRef}
      className={getCellClasses()}
      style={getCellStyle()}
      onClick={handleCellClick}
      onKeyDown={handleKeyPress}
      tabIndex={disabled ? -1 : 0}
      role="gridcell"
      aria-label={`Day ${day} attendance for ${employeeName}`}
      title={codeInfo ? codeInfo.label : 'Click to set attendance'}
    >
      {/* Cell Value */}
      <div className="cell-value">
        {value ? value.toUpperCase() : ''}
      </div>
      
      {/* Today Indicator */}
      {isToday && <div className="today-indicator" />}
      
      {/* Dropdown Menu */}
      {showDropdown && !disabled && (
        <div ref={dropdownRef} className="attendance-dropdown">
          <div className="dropdown-header">
            Select Attendance
            <button 
              className="dropdown-close"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                setIsEditing(false);
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          
          <div className="dropdown-options">
            {Object.entries(ATTENDANCE_CODES).map(([code, info]) => (
              <div
                key={code}
                className={`dropdown-option ${value === code ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDropdownSelect(code);
                }}
                style={{
                  '--option-color': info.color,
                  '--option-bg': info.bgColor
                }}
              >
                <span className="option-code">{code}</span>
                <span className="option-label">{info.label}</span>
              </div>
            ))}
            
            {value && (
              <div 
                className="dropdown-option clear-option"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <span className="option-code">×</span>
                <span className="option-label">Clear</span>
              </div>
            )}
          </div>
          
          <div className="dropdown-footer">
            <div className="dropdown-hint">
              Press key for quick entry: P, A, L, O, S, H, N
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayCell;