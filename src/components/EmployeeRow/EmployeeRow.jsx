import React, { useState, memo } from 'react';
import DayCell from '../DayCell';
import SummaryCell from '../SummaryCell';
import { getDaysInMonth, SUMMARY_COLUMNS } from '../../utils/constants';
import { getSundaysInMonth, getHolidaysInMonth } from '../../services/attendanceService';
import './EmployeeRow.css';

/**
 * EmployeeRow Component - Complete row for an employee with all attendance cells
 */
const EmployeeRow = memo(({ 
  employee,
  month,
  year,
  onAttendanceChange,
  onEmployeeSelect,
  onEmployeeEdit,
  onEmployeeDelete,
  isSelected = false,
  isEditable = true,
  showActions = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  
  const daysInMonth = getDaysInMonth(month, year);
  const sundays = getSundaysInMonth(month, year);
  const holidays = getHolidaysInMonth(month, year);
  const today = new Date().getDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
  
  // Check if it's current month
  const isCurrentMonth = currentMonth === monthIndex && currentYear === year;
  
  // Handle attendance change
  const handleAttendanceChange = (day, value) => {
    if (onAttendanceChange) {
      onAttendanceChange(employee.empId, day, value);
    }
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onEmployeeSelect) {
      onEmployeeSelect(employee.empId);
    }
  };
  
  // Handle context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowContextMenu(true);
  };
  
  // Handle edit click
  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEmployeeEdit) {
      onEmployeeEdit(employee);
    }
    setShowContextMenu(false);
  };
  
  // Handle delete click
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onEmployeeDelete && window.confirm(`Delete employee ${employee.employeeName}?`)) {
      onEmployeeDelete(employee.empId);
    }
    setShowContextMenu(false);
  };
  
  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);
  
  return (
    <tr 
      className={`employee-row ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Checkbox Column */}
      {showActions && (
        <td className="row-checkbox-cell">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            aria-label={`Select ${employee.employeeName}`}
            className="row-checkbox"
          />
        </td>
      )}
      
      {/* Serial Number */}
      <td className="row-cell row-cell-sl">
        <span className="cell-content">{employee.slNo}</span>
      </td>
      
      {/* Employee ID */}
      <td className="row-cell row-cell-empid">
        <span className="cell-content emp-id">{employee.empId}</span>
      </td>
      
      {/* Employee Name */}
      <td className="row-cell row-cell-empname">
        <div className="employee-name-cell">
          <span className="cell-content emp-name">{employee.employeeName}</span>
          {isHovered && showActions && (
            <div className="row-actions">
              <button 
                className="action-btn action-edit"
                onClick={handleEditClick}
                title="Edit Employee"
                aria-label="Edit"
              >
                ✏️
              </button>
              <button 
                className="action-btn action-delete"
                onClick={handleDeleteClick}
                title="Delete Employee"
                aria-label="Delete"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </td>
      
      {/* Month - BEFORE the day cells */}
      <td className="row-cell row-cell-month">
        <span className="cell-content">{month}</span>
      </td>
      
      {/* Day Attendance Cells 1-31 */}
      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
        <td key={day} className="row-cell row-cell-day">
          {day <= daysInMonth ? (
            <DayCell
              day={day}
              value={employee.attendance[day]}
              onChange={handleAttendanceChange}
              disabled={!isEditable}
              isWeekend={sundays.includes(day)}
              isHoliday={holidays.includes(day)}
              isToday={isCurrentMonth && day === today}
              employeeId={employee.empId}
              employeeName={employee.employeeName}
            />
          ) : (
            <div className="day-cell-disabled" />
          )}
        </td>
      ))}
      
      {/* Summary Columns */}
      {SUMMARY_COLUMNS.map(col => (
        <td key={col.key} className="row-cell row-cell-summary">
          <SummaryCell
            value={employee.summaries[col.key]}
            type={col.key}
            label={col.label}
            totalDays={employee.summaries.totalWorkingDays}
            showPercentage={col.key === 'totalPresent'}
            threshold={col.key === 'totalPresent' ? { type: 'min', value: 15 } : null}
          />
        </td>
      ))}
      
      {/* Context Menu */}
      {showContextMenu && (
        <div className="context-menu" style={{ top: isHovered ? '40px' : '0' }}>
          <button onClick={handleEditClick} className="context-menu-item">
            <span className="menu-icon">✏️</span>
            Edit Employee
          </button>
          <button onClick={handleDeleteClick} className="context-menu-item context-menu-danger">
            <span className="menu-icon">🗑️</span>
            Delete Employee
          </button>
          <div className="context-menu-divider" />
          <button 
            onClick={() => {
              navigator.clipboard.writeText(employee.empId);
              setShowContextMenu(false);
            }} 
            className="context-menu-item"
          >
            <span className="menu-icon">📋</span>
            Copy Employee ID
          </button>
        </div>
      )}
    </tr>
  );
});

EmployeeRow.displayName = 'EmployeeRow';

export default EmployeeRow;