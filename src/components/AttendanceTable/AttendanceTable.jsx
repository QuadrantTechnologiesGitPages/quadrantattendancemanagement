import React, { useState, useRef } from 'react';
import EmployeeRow from '../EmployeeRow';
import { getDaysInMonth, SUMMARY_COLUMNS } from '../../utils/constants';
import { getSundaysInMonth, getHolidaysInMonth } from '../../services/attendanceService';
import './AttendanceTable.css';

/**
 * AttendanceTable Component - Main table component with all employees
 */
const AttendanceTable = ({
  employees,
  currentMonth,
  currentYear,
  selectedEmployees,
  onAttendanceChange,
  onEmployeeSelect,
  onEmployeeEdit,
  onEmployeeDelete,
  onSelectAll,
  isEditable = true
}) => {
  const [sortField, setSortField] = useState('slNo');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterText, setFilterText] = useState('');
  const tableRef = useRef(null);
  
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const sundays = getSundaysInMonth(currentMonth, currentYear);
  const holidays = getHolidaysInMonth(currentMonth, currentYear);
  
  // Filter and sort employees
  const processedEmployees = React.useMemo(() => {
    let filtered = employees;
    
    // Apply filter
    if (filterText) {
      filtered = employees.filter(emp => 
        emp.employeeName.toLowerCase().includes(filterText.toLowerCase()) ||
        emp.empId.toLowerCase().includes(filterText.toLowerCase())
      );
    }
    
    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'slNo':
          aVal = a.slNo;
          bVal = b.slNo;
          break;
        case 'empId':
          aVal = a.empId;
          bVal = b.empId;
          break;
        case 'employeeName':
          aVal = a.employeeName;
          bVal = b.employeeName;
          break;
        case 'totalPresent':
          aVal = a.summaries.totalPresent;
          bVal = b.summaries.totalPresent;
          break;
        case 'totalAbsent':
          aVal = a.summaries.totalAbsent;
          bVal = b.summaries.totalAbsent;
          break;
        default:
          aVal = a[sortField];
          bVal = b[sortField];
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return sorted;
  }, [employees, filterText, sortField, sortOrder]);
  
  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };
  
  // Handle select all checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectAll(processedEmployees.map(emp => emp.empId));
    } else {
      onSelectAll([]);
    }
  };
  
  const isAllSelected = processedEmployees.length > 0 && 
    processedEmployees.every(emp => selectedEmployees.includes(emp.empId));
  
  const isPartiallySelected = processedEmployees.some(emp => 
    selectedEmployees.includes(emp.empId)) && !isAllSelected;
  
  // Get current day for highlighting
  const today = new Date().getDate();
  const currentMonthNum = new Date().getMonth();
  const currentYearNum = new Date().getFullYear();
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(currentMonth);
  const isCurrentMonth = currentMonthNum === monthIndex && currentYearNum === currentYear;
  
  // Generate day headers with weekend/holiday indicators
  const renderDayHeaders = () => {
    const headers = [];
    for (let day = 1; day <= 31; day++) {
      const isWeekend = sundays.includes(day);
      const isHoliday = holidays.includes(day);
      const isToday = isCurrentMonth && day === today;
      const isValidDay = day <= daysInMonth;
      
      headers.push(
        <th 
          key={`day-${day}`} 
          className={`header-day ${isWeekend ? 'is-weekend' : ''} ${isHoliday ? 'is-holiday' : ''} ${isToday ? 'is-today' : ''} ${!isValidDay ? 'is-invalid' : ''}`}
        >
          <div className="day-header">
            <span className="day-number">{day}</span>
            {isWeekend && <span className="day-indicator">S</span>}
            {isHoliday && <span className="day-indicator">H</span>}
          </div>
        </th>
      );
    }
    return headers;
  };
  
  return (
    <div className="attendance-table-container">
      {/* Filter Bar */}
      <div className="table-filter-bar">
        <input
          type="text"
          className="table-filter-input"
          placeholder="🔍 Search by name or ID..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <div className="table-info">
          {filterText && (
            <span className="filter-results">
              Found {processedEmployees.length} of {employees.length} employees
            </span>
          )}
        </div>
      </div>
      
      {/* Table */}
      <div className="table-wrapper" ref={tableRef}>
        <table className="attendance-table">
          <thead>
            <tr className="header-row">
              {/* Checkbox Header */}
              <th className="header-checkbox">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) {
                      input.indeterminate = isPartiallySelected;
                    }
                  }}
                  onChange={handleSelectAll}
                  aria-label="Select all employees"
                />
              </th>
              
              {/* Fixed Headers */}
              <th 
                className="header-fixed header-sl"
                onClick={() => handleSort('slNo')}
              >
                <div className="header-content sortable">
                  <span>Sl#</span>
                  <span className="sort-icon">{getSortIcon('slNo')}</span>
                </div>
              </th>
              
              <th 
                className="header-fixed header-empid"
                onClick={() => handleSort('empId')}
              >
                <div className="header-content sortable">
                  <span>Emp ID</span>
                  <span className="sort-icon">{getSortIcon('empId')}</span>
                </div>
              </th>
              
              <th 
                className="header-fixed header-empname"
                onClick={() => handleSort('employeeName')}
              >
                <div className="header-content sortable">
                  <span>Employee Name</span>
                  <span className="sort-icon">{getSortIcon('employeeName')}</span>
                </div>
              </th>
              
              <th className="header-fixed header-month">
                <div className="header-content">
                  Month
                </div>
              </th>
              
              {/* Day Headers */}
              {renderDayHeaders()}
              
              {/* Summary Headers */}
              {SUMMARY_COLUMNS.map(col => (
                <th 
                  key={col.key}
                  className="header-summary"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="header-content sortable">
                    <span className="summary-header-text">{col.label}</span>
                    <span className="sort-icon">{getSortIcon(col.key)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {processedEmployees.length > 0 ? (
              processedEmployees.map((employee, index) => (
                <EmployeeRow
                  key={`${employee.empId}-${index}`}
                  employee={employee}
                  month={currentMonth}
                  year={currentYear}
                  onAttendanceChange={onAttendanceChange}
                  onEmployeeSelect={onEmployeeSelect}
                  onEmployeeEdit={onEmployeeEdit}
                  onEmployeeDelete={onEmployeeDelete}
                  isSelected={selectedEmployees.includes(employee.empId)}
                  isEditable={isEditable}
                  showActions={true}
                />
              ))
            ) : (
              <tr className="empty-row">
                <td colSpan={46} className="empty-cell">
                  <div className="empty-state">
                    <span className="empty-icon">📋</span>
                    <h3>No employees found</h3>
                    <p>
                      {filterText 
                        ? 'Try adjusting your search criteria' 
                        : 'Load an Excel file or add employees to get started'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer */}
      {processedEmployees.length > 0 && (
        <div className="table-footer">
          <div className="footer-stats">
            <span className="stat-item">
              Total Employees: <strong>{processedEmployees.length}</strong>
            </span>
            <span className="stat-item">
              Selected: <strong>{selectedEmployees.length}</strong>
            </span>
            <span className="stat-item">
              Month: <strong>{currentMonth} {currentYear}</strong>
            </span>
            <span className="stat-item">
              Working Days: <strong>{daysInMonth - sundays.length - holidays.length}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;