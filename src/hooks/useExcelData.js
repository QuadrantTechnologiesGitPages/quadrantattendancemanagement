import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  readExcelFile, 
  exportToExcel, 
  autoSaveToLocal, 
  loadFromLocal,
  validateExcelFile 
} from '../services/excelService';
import {
  updateEmployeeAttendance,
  calculateSummaries,
  createEmployee,
  validateEmployee
} from '../services/attendanceService';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Custom hook for managing Excel data and attendance operations
 */
export const useExcelData = (initialMonth = 'Jan', initialYear = 2024) => {
  // State management
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  
  // Refs for auto-save
  const autoSaveTimerRef = useRef(null);
  const previousDataRef = useRef(null);
  
  /**
   * Load Excel file
   */
  const loadExcelFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate file first
      await validateExcelFile(file);
      
      // Read and parse file
      const data = await readExcelFile(file);
      
      // Update state
      setEmployees(data);
      previousDataRef.current = JSON.stringify(data);
      setHasUnsavedChanges(false);
      setError(null);
      
      // Save to local storage
      autoSaveToLocal(data, STORAGE_KEYS.ATTENDANCE_DATA);
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error loading Excel file:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Save data to Excel file
   */
  const saveToExcel = useCallback(async (filename) => {
    setLoading(true);
    setError(null);
    
    try {
      const defaultFilename = filename || `attendance_${currentMonth}_${currentYear}.xlsx`;
      await exportToExcel(employees, defaultFilename, currentMonth, currentYear);
      
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      previousDataRef.current = JSON.stringify(employees);
      
      // Update local storage
      autoSaveToLocal(employees, STORAGE_KEYS.ATTENDANCE_DATA);
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error saving to Excel:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [employees, currentMonth, currentYear]);
  
  /**
   * Update attendance for a specific employee and day
   */
  const updateAttendance = useCallback((employeeId, day, code) => {
    setEmployees(prevEmployees => {
      const updatedEmployees = prevEmployees.map(emp => {
        if (emp.empId === employeeId) {
          const updatedAttendance = { ...emp.attendance };
          
          if (code && code !== '') {
            updatedAttendance[day] = code;
          } else {
            delete updatedAttendance[day];
          }
          
          // Update monthly data if it exists
          const updatedEmp = {
            ...emp,
            attendance: updatedAttendance,
            summaries: calculateSummaries(updatedAttendance, currentMonth, currentYear)
          };
          
          // Store in monthly data
          if (!updatedEmp.monthlyData) {
            updatedEmp.monthlyData = {};
          }
          if (!updatedEmp.monthlyData[currentMonth]) {
            updatedEmp.monthlyData[currentMonth] = {
              attendance: {},
              summaries: {}
            };
          }
          updatedEmp.monthlyData[currentMonth].attendance = updatedAttendance;
          updatedEmp.monthlyData[currentMonth].summaries = updatedEmp.summaries;
          
          return updatedEmp;
        }
        return emp;
      });
      
      setHasUnsavedChanges(true);
      return updatedEmployees;
    });
  }, [currentMonth, currentYear]);
  
  /**
   * Bulk update attendance for multiple employees
   */
  const bulkUpdateAttendance = useCallback((updates) => {
    setEmployees(prevEmployees => {
      const updatedEmployees = prevEmployees.map(emp => {
        if (updates[emp.empId]) {
          const updatedAttendance = { ...emp.attendance, ...updates[emp.empId] };
          return {
            ...emp,
            attendance: updatedAttendance,
            summaries: calculateSummaries(updatedAttendance, currentMonth, currentYear)
          };
        }
        return emp;
      });
      
      setHasUnsavedChanges(true);
      return updatedEmployees;
    });
  }, [currentMonth, currentYear]);
  
  /**
   * Add new employee
   */
  const addEmployee = useCallback((employeeData) => {
    const validation = validateEmployee(employeeData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    setEmployees(prevEmployees => {
      const newEmployee = createEmployee({
        ...employeeData,
        slNo: prevEmployees.length + 1,
        month: currentMonth,
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
      });
      
      const updatedEmployees = [...prevEmployees, newEmployee];
      setHasUnsavedChanges(true);
      
      // Auto-save to local storage
      autoSaveToLocal(updatedEmployees, STORAGE_KEYS.ATTENDANCE_DATA);
      
      return updatedEmployees;
    });
  }, [currentMonth]);
  
  /**
   * Update employee details
   */
  const updateEmployee = useCallback((employeeId, updates) => {
    setEmployees(prevEmployees => {
      const updatedEmployees = prevEmployees.map(emp => {
        if (emp.empId === employeeId) {
          const updatedEmployee = { ...emp, ...updates };
          
          // Validate if name or ID changed
          if (updates.empId || updates.employeeName) {
            const validation = validateEmployee(updatedEmployee);
            if (!validation.isValid) {
              throw new Error(validation.errors.join(', '));
            }
          }
          
          // Recalculate summaries if attendance changed
          if (updates.attendance) {
            updatedEmployee.summaries = calculateSummaries(
              updatedEmployee.attendance,
              currentMonth,
              currentYear
            );
          }
          
          return updatedEmployee;
        }
        return emp;
      });
      
      setHasUnsavedChanges(true);
      return updatedEmployees;
    });
  }, [currentMonth, currentYear]);
  
  /**
   * Delete employee
   */
  const deleteEmployee = useCallback((employeeId) => {
    setEmployees(prevEmployees => {
      const updatedEmployees = prevEmployees
        .filter(emp => emp.empId !== employeeId)
        .map((emp, index) => ({ ...emp, slNo: index + 1 })); // Reorder serial numbers
      
      setHasUnsavedChanges(true);
      return updatedEmployees;
    });
  }, []);
  
  /**
   * Delete multiple employees
   */
  const deleteMultipleEmployees = useCallback((employeeIds) => {
    setEmployees(prevEmployees => {
      const updatedEmployees = prevEmployees
        .filter(emp => !employeeIds.includes(emp.empId))
        .map((emp, index) => ({ ...emp, slNo: index + 1 }));
      
      setHasUnsavedChanges(true);
      setSelectedEmployees([]);
      return updatedEmployees;
    });
  }, []);
  
  /**
   * Change month/year and load appropriate data
   */
  const changeMonthYear = useCallback((month, year) => {
    setCurrentMonth(month);
    setCurrentYear(year);
    
    // Update employees with data for the selected month
    setEmployees(prevEmployees => {
      const updatedEmployees = prevEmployees.map(emp => {
        // Check if employee has data for this month
        if (emp.monthlyData && emp.monthlyData[month]) {
          return {
            ...emp,
            month: month,
            attendance: emp.monthlyData[month].attendance || {},
            summaries: emp.monthlyData[month].summaries || calculateSummaries(emp.monthlyData[month].attendance || {}, month, year)
          };
        } else {
          // No data for this month, return empty attendance
          return {
            ...emp,
            month: month,
            attendance: {},
            summaries: calculateSummaries({}, month, year)
          };
        }
      });
      
      setHasUnsavedChanges(true);
      return updatedEmployees;
    });
    
    // Save to local storage
    localStorage.setItem(STORAGE_KEYS.CURRENT_MONTH, month);
    localStorage.setItem(STORAGE_KEYS.CURRENT_YEAR, year.toString());
  }, []);
  
  /**
   * Auto-save functionality
   */
  const triggerAutoSave = useCallback(() => {
    if (hasUnsavedChanges && employees.length > 0) {
      autoSaveToLocal(employees, STORAGE_KEYS.ATTENDANCE_DATA);
      console.log('Auto-saved to local storage');
    }
  }, [hasUnsavedChanges, employees]);
  
  /**
   * Load from local storage
   */
  const loadFromLocalStorage = useCallback(() => {
    const saved = loadFromLocal(STORAGE_KEYS.ATTENDANCE_DATA);
    if (saved && saved.employees) {
      setEmployees(saved.employees);
      previousDataRef.current = JSON.stringify(saved.employees);
      setLastSaved(new Date(saved.timestamp));
      setHasUnsavedChanges(false);
      return true;
    }
    return false;
  }, []);
  
  /**
   * Clear all data
   */
  const clearAllData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setEmployees([]);
      setHasUnsavedChanges(false);
      setSelectedEmployees([]);
      localStorage.removeItem(STORAGE_KEYS.ATTENDANCE_DATA);
      localStorage.removeItem(STORAGE_KEYS.LAST_SAVED);
    }
  }, []);
  
  /**
   * Select/deselect employees for bulk operations
   */
  const toggleEmployeeSelection = useCallback((employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      }
      return [...prev, employeeId];
    });
  }, []);
  
  /**
   * Select all employees
   */
  const selectAllEmployees = useCallback(() => {
    setSelectedEmployees(employees.map(emp => emp.empId));
  }, [employees]);
  
  /**
   * Deselect all employees
   */
  const deselectAllEmployees = useCallback(() => {
    setSelectedEmployees([]);
  }, []);
  
  /**
   * Get employee by ID
   */
  const getEmployeeById = useCallback((employeeId) => {
    return employees.find(emp => emp.empId === employeeId);
  }, [employees]);
  
  /**
   * Check for unsaved changes before unload
   */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  
  /**
   * Auto-save timer
   */
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    if (hasUnsavedChanges) {
      autoSaveTimerRef.current = setTimeout(() => {
        triggerAutoSave();
      }, 30000); // Auto-save every 30 seconds
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, triggerAutoSave]);
  
  /**
   * Load saved month/year from local storage
   */
  useEffect(() => {
    const savedMonth = localStorage.getItem(STORAGE_KEYS.CURRENT_MONTH);
    const savedYear = localStorage.getItem(STORAGE_KEYS.CURRENT_YEAR);
    
    if (savedMonth) setCurrentMonth(savedMonth);
    if (savedYear) setCurrentYear(parseInt(savedYear));
  }, []);
  
  return {
    // Data
    employees,
    currentMonth,
    currentYear,
    selectedEmployees,
    
    // Status
    loading,
    error,
    hasUnsavedChanges,
    lastSaved,
    
    // File operations
    loadExcelFile,
    saveToExcel,
    loadFromLocalStorage,
    clearAllData,
    
    // Employee operations
    addEmployee,
    updateEmployee,
    deleteEmployee,
    deleteMultipleEmployees,
    getEmployeeById,
    
    // Attendance operations
    updateAttendance,
    bulkUpdateAttendance,
    
    // Selection operations
    toggleEmployeeSelection,
    selectAllEmployees,
    deselectAllEmployees,
    
    // Month/Year operations
    changeMonthYear,
    
    // Utility
    setError
  };
};