import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  EXCEL_COLUMNS, 
  normalizeAttendanceCode,
  getDaysInMonth,
  SUMMARY_COLUMNS 
} from '../utils/constants';

/**
 * Read Excel file and convert to JSON format
 * @param {File} file - Excel file to read
 * @returns {Promise<Array>} Array of employee attendance data
 */
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: null,
          blankrows: false 
        });
        
        // Parse the data
        const employees = parseExcelData(jsonData);
        resolve(employees);
      } catch (error) {
        reject(new Error('Failed to read Excel file: ' + error.message));
      }
    };
    
    reader.onerror = (error) => {
      reject(new Error('File reading failed: ' + error.message));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse Excel data into structured format
 * @param {Array} data - Raw Excel data
 * @returns {Array} Structured employee data
 */
const parseExcelData = (data) => {
  if (!data || data.length < 3) {
    return [];
  }
  
  const employeeMap = new Map();
  let consecutiveEmptyRows = 0;
  
  // Start from row 3 (index 2)
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    
    // Check if row is empty
    if (!row || (!row[1] && !row[2]) || (row[1] === '' && row[2] === '')) {
      consecutiveEmptyRows++;
      if (consecutiveEmptyRows >= 5) {
        break;
      }
      continue;
    }
    
    consecutiveEmptyRows = 0;
    
    // Skip if no valid employee ID
    if (!row[1] || row[1].toString().trim() === '') {
      continue;
    }
    
    const empId = row[1].toString().trim();
    const employeeName = row[2] || '';
    const month = row[3] || 'Jan';
    
    // Create or get employee
    if (!employeeMap.has(empId)) {
      employeeMap.set(empId, {
        empId: empId,
        employeeName: employeeName,
        monthlyData: {}
      });
    }
    
    const employee = employeeMap.get(empId);
    
    // Initialize month data
    if (!employee.monthlyData[month]) {
      employee.monthlyData[month] = {
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
    }
    
    // Parse attendance for days 1-31
    for (let day = 1; day <= 31; day++) {
      const dayValue = row[day + 3];
      if (dayValue !== null && dayValue !== undefined && dayValue !== '') {
        employee.monthlyData[month].attendance[day] = normalizeAttendanceCode(dayValue);
      }
    }
    
    // Parse summary columns
    if (row[35] !== undefined) {
      employee.monthlyData[month].summaries = {
        totalPresent: parseInt(row[35]) || 0,
        totalOff: parseInt(row[36]) || 0,
        totalSundays: parseInt(row[37]) || 0,
        totalHolidays: parseInt(row[38]) || 0,
        totalNightShift: parseInt(row[39]) || 0,
        totalHolyDayWorking: parseInt(row[40]) || 0,
        totalOffDayWorking: parseInt(row[41]) || 0,
        totalAbsent: parseInt(row[42]) || 0,
        totalOnLeave: parseInt(row[43]) || 0,
        totalWorkingDays: parseInt(row[44]) || 0
      };
    }
  }
  
  // Convert Map to array
  const employees = [];
  let slNo = 1;
  
  for (const [empId, empData] of employeeMap) {
    employees.push({
      slNo: slNo++,
      empId: empData.empId,
      employeeName: empData.employeeName,
      month: 'Jan',
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
      },
      monthlyData: empData.monthlyData
    });
  }
  
  console.log(`Parsed ${employees.length} unique employees from Excel`);
  return employees;
};

/**
 * Convert employee data to Excel format and save
 * @param {Array} employees - Employee data to export
 * @param {String} filename - Output filename
 * @param {String} month - Current month
 * @param {Number} year - Current year
 */
export const exportToExcel = (employees, filename = 'attendance.xlsx', month = 'Jan', year = 2024) => {
  try {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const excelData = prepareExcelData(employees, month, year);
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 5 },   // Sl#
      { wch: 10 },  // Emp ID
      { wch: 25 },  // Employee Name
      { wch: 8 },   // Month
      ...Array(31).fill({ wch: 4 }), // Days 1-31
      { wch: 12 },  // Total Present
      { wch: 10 },  // Total Off
      { wch: 14 },  // Total Sunday's
      { wch: 14 },  // Total Holidays
      { wch: 15 },  // Total Night Shift
      { wch: 20 },  // Total Holy Day Working
      { wch: 20 },  // Total Off Day Working
      { wch: 12 },  // Total Absent
      { wch: 14 },  // Total On Leave
      { wch: 25 }   // Total Working Days
    ];
    ws['!cols'] = colWidths;
    
    // Apply styles to header row
    applyExcelStyles(ws, employees.length + 2);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Save file
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
    
    return true;
  } catch (error) {
    console.error('Export to Excel failed:', error);
    throw new Error('Failed to export to Excel: ' + error.message);
  }
};

/**
 * Prepare data for Excel export
 * @param {Array} employees - Employee data
 * @param {String} month - Current month
 * @param {Number} year - Current year
 * @returns {Array} 2D array for Excel
 */
const prepareExcelData = (employees, month, year) => {
  const daysInMonth = getDaysInMonth(month, year);
  
  // Create header row
  const headers = [
    EXCEL_COLUMNS.SL_NO,
    EXCEL_COLUMNS.EMP_ID,
    EXCEL_COLUMNS.EMP_NAME,
    EXCEL_COLUMNS.MONTH,
    ...Array.from({ length: 31 }, (_, i) => i + 1),
    EXCEL_COLUMNS.TOTAL_PRESENT,
    EXCEL_COLUMNS.TOTAL_OFF,
    EXCEL_COLUMNS.TOTAL_SUNDAYS,
    EXCEL_COLUMNS.TOTAL_HOLIDAYS,
    EXCEL_COLUMNS.TOTAL_NIGHT_SHIFT,
    EXCEL_COLUMNS.TOTAL_HOLY_DAY_WORKING,
    EXCEL_COLUMNS.TOTAL_OFF_DAY_WORKING,
    EXCEL_COLUMNS.TOTAL_ABSENT,
    EXCEL_COLUMNS.TOTAL_ON_LEAVE,
    EXCEL_COLUMNS.TOTAL_WORKING_DAYS
  ];
  
  // Add an empty row after headers
  const data = [headers, []];
  
  // Add employee data
  employees.forEach((employee, index) => {
    const row = [
      employee.slNo || index + 1,
      employee.empId,
      employee.employeeName,
      employee.month || month
    ];
    
    // Add attendance for each day
    for (let day = 1; day <= 31; day++) {
      if (day <= daysInMonth) {
        row.push(employee.attendance[day] || '');
      } else {
        row.push('');
      }
    }
    
    // Add summary columns
    row.push(
      employee.summaries.totalPresent || 0,
      employee.summaries.totalOff || 0,
      employee.summaries.totalSundays || 0,
      employee.summaries.totalHolidays || 0,
      employee.summaries.totalNightShift || 0,
      employee.summaries.totalHolyDayWorking || 0,
      employee.summaries.totalOffDayWorking || 0,
      employee.summaries.totalAbsent || 0,
      employee.summaries.totalOnLeave || 0,
      employee.summaries.totalWorkingDays || 0
    );
    
    data.push(row);
  });
  
  return data;
};

/**
 * Apply Excel-like styles to worksheet
 * @param {Object} ws - Worksheet object
 * @param {Number} rowCount - Total number of rows
 */
const applyExcelStyles = (ws, rowCount) => {
  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Style header row
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    
    ws[cellAddress].s = {
      fill: { fgColor: { rgb: 'CCFFFF' } },
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
  }
  
  // Add autofilter
  ws['!autofilter'] = { ref: `A1:AS${rowCount}` };
  
  // Freeze panes
  ws['!freeze'] = { xSplit: 4, ySplit: 1 };
};

/**
 * Create a new Excel file with template structure
 * @param {String} month - Month for the template
 * @param {Number} year - Year for the template
 * @returns {Blob} Excel file blob
 */
export const createExcelTemplate = (month = 'Jan', year = 2024) => {
  const emptyEmployees = [
    {
      slNo: 1,
      empId: 'EMP-001',
      employeeName: 'Sample Employee',
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
    }
  ];
  
  return exportToExcel(emptyEmployees, `attendance_template_${month}_${year}.xlsx`, month, year);
};

/**
 * Validate Excel file structure
 * @param {File} file - File to validate
 * @returns {Promise<Boolean>} True if valid
 */
export const validateExcelFile = async (file) => {
  try {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      throw new Error('Please upload an Excel file (.xlsx or .xls)');
    }
    
    const employees = await readExcelFile(file);
    
    // Empty file is okay
    if (!employees || employees.length === 0) {
      console.log('Excel file is empty or contains no valid employee data');
      return true;
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Auto-save data to local storage
 * @param {Array} employees - Employee data to save
 * @param {String} key - Storage key
 */
export const autoSaveToLocal = (employees, key = 'attendance_backup') => {
  try {
    const dataStr = JSON.stringify({
      employees,
      timestamp: new Date().toISOString(),
      version: '1.0'
    });
    localStorage.setItem(key, dataStr);
    return true;
  } catch (error) {
    console.error('Auto-save failed:', error);
    return false;
  }
};

/**
 * Load data from local storage
 * @param {String} key - Storage key
 * @returns {Object|null} Saved data or null
 */
export const loadFromLocal = (key = 'attendance_backup') => {
  try {
    const dataStr = localStorage.getItem(key);
    if (!dataStr) return null;
    
    const data = JSON.parse(dataStr);
    return data;
  } catch (error) {
    console.error('Load from local storage failed:', error);
    return null;
  }
};