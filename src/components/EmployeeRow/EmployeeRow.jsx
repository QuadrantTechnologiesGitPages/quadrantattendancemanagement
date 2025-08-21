import React, { useState, memo, useMemo, useEffect } from 'react';
import DayCell from '../DayCell';
import SummaryCell from '../SummaryCell';
import { getDaysInMonth, SUMMARY_COLUMNS } from '../../utils/constants';
import { getHolidaysInMonth } from '../../services/attendanceService';
import './EmployeeRow.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pad2 = n => String(n).padStart(2, '0');
const makeKey = (y, mIndex, d) => `${y}-${pad2(mIndex + 1)}-${pad2(d)}`;

/**
 * EmployeeRow Component - Complete row for an employee with all attendance cells
 */
const EmployeeRow = memo(({ 
  employee,
  month,                 // 'Jan'..'Dec'
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

  const monthIndex = MONTHS.indexOf(month);
  const daysInMonth = getDaysInMonth(month, year);
  const holidays = getHolidaysInMonth(month, year);

  // Compute weekend days (Sat & Sun)
  const weekendDays = useMemo(() => {
    const s = new Set();
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, monthIndex, d).getDay(); // Sun=0 ... Sat=6
      if (dow === 0 || dow === 6) s.add(d);
    }
    return s;
  }, [year, monthIndex, daysInMonth]);

  // Current day highlighting
  const today = new Date().getDate();
  const isCurrentMonth = (new Date().getMonth() === monthIndex) && (new Date().getFullYear() === year);

  // Normalize attendance retrieval so Excel-loaded data reflects correctly
  const normalizedByDay = useMemo(() => {
    const map = {};
    const a = employee?.attendance || {};

    // Prefer byDate if present
    const hasByDate = a && typeof a === 'object' && a.byDate && typeof a.byDate === 'object';
    const hasByDay  = a && typeof a === 'object' && a.byDay && typeof a.byDay === 'object';

    for (let d = 1; d <= daysInMonth; d++) {
      let v = '';

      // 1) support top-level numeric or string keys: attendance[1] or attendance["1"]
      if (a && (a[d] !== undefined || a[String(d)] !== undefined)) {
        v = a[d] ?? a[String(d)];
      }

      // 2) support attendance.byDay[1]
      if (!v && hasByDay) {
        v = a.byDay[d] ?? a.byDay[String(d)] ?? '';
      }

      // 3) support attendance.byDate["YYYY-MM-DD"]
      if (!v && hasByDate) {
        const key = makeKey(year, monthIndex, d);
        v = a.byDate[key] ?? '';
      }

      map[d] = typeof v === 'string' ? v : '';
    }
    return map;
  }, [employee, year, monthIndex, daysInMonth]);

  // Context menu handling
  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEmployeeEdit?.(employee);
    setShowContextMenu(false);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onEmployeeDelete && window.confirm(`Delete employee ${employee.employeeName}?`)) {
      onEmployeeDelete(employee.empId);
    }
    setShowContextMenu(false);
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onEmployeeSelect?.(employee.empId);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  // Delegate to parent without mutating employee
  const handleAttendanceChange = (day, value) => {
    onAttendanceChange?.(employee.empId, day, value);
  };

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
      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
        const isInvalid = day > daysInMonth;
        const isWeekend = weekendDays.has(day);
        const isHoliday = holidays.includes(day);
        const isToday = isCurrentMonth && day === today;
        const value = normalizedByDay[day] || '';

        return (
          <td key={day} className={`row-cell row-cell-day${isInvalid ? ' is-invalid' : ''}${isWeekend ? ' is-weekend' : ''}${isToday ? ' is-today' : ''}`}>
            {!isInvalid ? (
              <DayCell
                day={day}
                value={value}
                onChange={handleAttendanceChange}
                disabled={!isEditable}
                isWeekend={isWeekend}
                isHoliday={isHoliday}
                isToday={isToday}
                employeeId={employee.empId}
                employeeName={employee.employeeName}
              />
            ) : (
              <div className="day-cell-disabled" />
            )}
          </td>
        );
      })}

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
