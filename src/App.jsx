import React, { useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import AttendanceTable from './components/AttendanceTable';
import EmployeeModal from './components/EmployeeModal';
import { useExcelData } from './hooks/useExcelData';
import { 
  markWeekends, 
  markHolidays,
  getAttendanceStatistics 
} from './services/attendanceService';
import { generateAttendanceReport } from './utils/calculations';
import './App.css';

/**
 * Main App Component
 */
function App() {
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Get current month and year
  const currentDate = new Date();
  const currentMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  // Use custom hook for Excel data management
  const {
    employees,
    currentMonth: month,
    currentYear: year,
    selectedEmployees,
    loading,
    error,
    hasUnsavedChanges,
    lastSaved,
    loadExcelFile,
    saveToExcel,
    loadFromLocalStorage,
    clearAllData,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    deleteMultipleEmployees,
    updateAttendance,
    bulkUpdateAttendance,
    toggleEmployeeSelection,
    selectAllEmployees,
    deselectAllEmployees,
    changeMonthYear,
    setError
  } = useExcelData(currentMonth, currentYear);
  
  // Load data from local storage on mount
  useEffect(() => {
    const hasLocalData = loadFromLocalStorage();
    if (hasLocalData) {
      showNotification('Loaded data from local storage', 'success');
    }
  }, []);
  
  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Handle file load
  const handleLoadFile = async (file) => {
    try {
      await loadExcelFile(file);
      showNotification('Excel file loaded successfully', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };
  
  // Handle save
  const handleSave = async () => {
    try {
      await saveToExcel();
      showNotification('Saved to Excel successfully', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };
  
  // Handle add employee
  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowEmployeeModal(true);
  };
  
  // Handle edit employee
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEmployeeModal(true);
  };
  
  // Handle save employee (from modal)
  const handleSaveEmployee = (employeeData) => {
    try {
      if (editingEmployee) {
        updateEmployee(editingEmployee.empId, employeeData);
        showNotification('Employee updated successfully', 'success');
      } else {
        // For new employee, ensure all fields are properly set
        const newEmployeeData = {
          ...employeeData,
          slNo: employees.length + 1,
          month: month,
          attendance: {},
          summaries: {
            totalPresent: 0,
            totalOff: 0,
            totalSundays: 0,
            totalHolidays: 0,
            totalNightShift: 0,
            totalHolyDayWorking: 0,
            totalOffDayWorking: 0,
            totalAbsent: 0,
            totalOnLeave: 0,
            totalWorkingDays: 0
          }
        };
        addEmployee(newEmployeeData);
        showNotification('Employee added successfully', 'success');
      }
      setShowEmployeeModal(false);
      setEditingEmployee(null);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };
  
  // Handle delete employee
  const handleDeleteEmployee = (empId) => {
    deleteEmployee(empId);
    showNotification('Employee deleted', 'info');
  };
  
  // Handle delete selected
  const handleDeleteSelected = () => {
    if (selectedEmployees.length === 0) return;
    
    if (window.confirm(`Delete ${selectedEmployees.length} selected employees?`)) {
      deleteMultipleEmployees(selectedEmployees);
      showNotification(`Deleted ${selectedEmployees.length} employees`, 'info');
    }
  };
  
  // Handle mark weekends
  const handleMarkWeekends = () => {
    const updates = {};
    employees.forEach(emp => {
      const markedEmployee = markWeekends(emp, month, year);
      updates[emp.empId] = markedEmployee.attendance;
    });
    bulkUpdateAttendance(updates);
    showNotification('Weekends marked for all employees', 'success');
  };
  
  // Handle mark holidays
  const handleMarkHolidays = () => {
    const updates = {};
    employees.forEach(emp => {
      const markedEmployee = markHolidays(emp, month, year);
      updates[emp.empId] = markedEmployee.attendance;
    });
    bulkUpdateAttendance(updates);
    showNotification('Holidays marked for all employees', 'success');
  };
  
  // Handle export report
  const handleExportReport = () => {
    if (employees.length === 0) {
      showNotification('No data to export', 'warning');
      return;
    }
    
    // Generate text report
    let fullReport = `ATTENDANCE REPORT\n`;
    fullReport += `Month: ${month} ${year}\n`;
    fullReport += `Generated: ${new Date().toLocaleString()}\n`;
    fullReport += `${'='.repeat(50)}\n\n`;
    
    // Add statistics
    const stats = getAttendanceStatistics(employees);
    fullReport += `SUMMARY STATISTICS\n`;
    fullReport += `─────────────────\n`;
    fullReport += `Total Employees: ${stats.totalEmployees}\n`;
    fullReport += `Average Present Days: ${stats.averagePresent}\n`;
    fullReport += `Average Absent Days: ${stats.averageAbsent}\n`;
    fullReport += `Perfect Attendance: ${stats.perfectAttendance}\n`;
    fullReport += `High Absenteeism (>5 days): ${stats.highAbsenteeism}\n\n`;
    
    // Add individual reports
    fullReport += `INDIVIDUAL REPORTS\n`;
    fullReport += `─────────────────\n\n`;
    
    employees.forEach(emp => {
      fullReport += generateAttendanceReport(emp, month, year);
      fullReport += `\n${'─'.repeat(40)}\n\n`;
    });
    
    // Download report
    const blob = new Blob([fullReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${month}_${year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Report exported successfully', 'success');
  };
  
  // Handle refresh
  const handleRefresh = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Refresh anyway?')) {
        return;
      }
    }
    window.location.reload();
  };
  
  return (
    <div className="app">
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span className="notification-message">{notification.message}</span>
          <button 
            className="notification-close"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Toolbar */}
      <Toolbar
        currentMonth={month}
        currentYear={year}
        employees={employees}
        selectedCount={selectedEmployees.length}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSaved={lastSaved}
        onMonthYearChange={changeMonthYear}
        onLoadFile={handleLoadFile}
        onSaveFile={handleSave}
        onAddEmployee={handleAddEmployee}
        onDeleteSelected={handleDeleteSelected}
        onSelectAll={selectAllEmployees}
        onDeselectAll={deselectAllEmployees}
        onMarkWeekends={handleMarkWeekends}
        onMarkHolidays={handleMarkHolidays}
        onExportReport={handleExportReport}
        onRefresh={handleRefresh}
      />
      
      {/* Main Content */}
      <div className="app-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        ) : (
          <AttendanceTable
            employees={employees}
            currentMonth={month}
            currentYear={year}
            selectedEmployees={selectedEmployees}
            onAttendanceChange={updateAttendance}
            onEmployeeSelect={toggleEmployeeSelection}
            onEmployeeEdit={handleEditEmployee}
            onEmployeeDelete={handleDeleteEmployee}
            onSelectAll={selectAllEmployees}
            isEditable={true}
          />
        )}
      </div>
      
      {/* Employee Modal */}
      <EmployeeModal
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
        existingEmployeeIds={employees.map(e => e.empId)}
      />
      
      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="unsaved-warning">
          <span>⚠️ Unsaved changes</span>
          <button onClick={handleSave}>Save Now</button>
        </div>
      )}
    </div>
  );
}

export default App;