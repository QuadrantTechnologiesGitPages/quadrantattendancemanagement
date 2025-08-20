// Attendance status codes with their meanings and colors
export const ATTENDANCE_CODES = {
  P: {
    label: 'Present',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    value: 'P'
  },
  A: {
    label: 'Absent',
    color: '#F44336',
    bgColor: '#FFEBEE',
    value: 'A'
  },
  O: {
    label: 'Off',
    color: '#9E9E9E',
    bgColor: '#F5F5F5',
    value: 'O'
  },
  S: {
    label: 'Sunday',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    value: 'S'
  },
  H: {
    label: 'Holiday',
    color: '#2196F3',
    bgColor: '#E3F2FD',
    value: 'H'
  },
  N: {
    label: 'Night Shift',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    value: 'N'
  },
  L: {
    label: 'Leave',
    color: '#00BCD4',
    bgColor: '#E0F7FA',
    value: 'L'
  },
  HD: {
    label: 'Half Day',
    color: '#FFC107',
    bgColor: '#FFF8E1',
    value: 'HD'
  },
  WFH: {
    label: 'Work From Home',
    color: '#607D8B',
    bgColor: '#ECEFF1',
    value: 'WFH'
  }
};

// Convert 'a' to 'A' for consistency (from your Excel)
export const normalizeAttendanceCode = (code) => {
  if (!code) return '';
  const upperCode = code.toString().toUpperCase();
  // Map lowercase 'a' to 'A' for Absent
  return upperCode === 'A' ? 'A' : ATTENDANCE_CODES[upperCode] ? upperCode : '';
};

// Months for dropdown
export const MONTHS = [
  { value: 'Jan', label: 'January', days: 31 },
  { value: 'Feb', label: 'February', days: 28 }, // Will handle leap year dynamically
  { value: 'Mar', label: 'March', days: 31 },
  { value: 'Apr', label: 'April', days: 30 },
  { value: 'May', label: 'May', days: 31 },
  { value: 'Jun', label: 'June', days: 30 },
  { value: 'Jul', label: 'July', days: 31 },
  { value: 'Aug', label: 'August', days: 31 },
  { value: 'Sep', label: 'September', days: 30 },
  { value: 'Oct', label: 'October', days: 31 },
  { value: 'Nov', label: 'November', days: 30 },
  { value: 'Dec', label: 'December', days: 31 }
];

// Get days in month considering leap year
export const getDaysInMonth = (month, year) => {
  const monthIndex = MONTHS.findIndex(m => m.value === month);
  if (monthIndex === 1) { // February
    // Check for leap year
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 29 : 28;
  }
  return MONTHS[monthIndex]?.days || 31;
};

// Column headers for the Excel sheet
export const EXCEL_COLUMNS = {
  SL_NO: 'Sl#',
  EMP_ID: 'Emp ID',
  EMP_NAME: 'Employee Name',
  MONTH: 'Month',
  // Days 1-31 are dynamic
  TOTAL_PRESENT: 'Total Present',
  TOTAL_OFF: 'Total Off',
  TOTAL_SUNDAYS: "Total Sunday's",
  TOTAL_HOLIDAYS: 'Total Holidays',
  TOTAL_NIGHT_SHIFT: 'Total Night Shift',
  TOTAL_HOLY_DAY_WORKING: 'Total Holy Day Working',
  TOTAL_OFF_DAY_WORKING: 'Total Off Day Working',
  TOTAL_ABSENT: 'Total Absent',
  TOTAL_ON_LEAVE: 'Total On Leave',
  TOTAL_WORKING_DAYS: 'Total Working Days in this Month'
};

// Summary column keys for calculations
export const SUMMARY_COLUMNS = [
  { key: 'totalPresent', label: 'Total Present', codes: ['P', 'WFH'] },
  { key: 'totalOff', label: 'Total Off', codes: ['O'] },
  { key: 'totalSundays', label: "Total Sunday's", codes: ['S'] },
  { key: 'totalHolidays', label: 'Total Holidays', codes: ['H'] },
  { key: 'totalNightShift', label: 'Total Night Shift', codes: ['N'] },
  { key: 'totalHolyDayWorking', label: 'Total Holy Day Working', codes: [] }, // Special calculation
  { key: 'totalOffDayWorking', label: 'Total Off Day Working', codes: [] }, // Special calculation
  { key: 'totalAbsent', label: 'Total Absent', codes: ['A'] },
  { key: 'totalOnLeave', label: 'Total On Leave', codes: ['L'] },
  { key: 'totalWorkingDays', label: 'Total Working Days', codes: [] } // Special calculation
];

// Default employee structure
export const DEFAULT_EMPLOYEE = {
  slNo: 0,
  empId: '',
  employeeName: '',
  month: 'Jan',
  attendance: {}, // { 1: 'P', 2: 'A', ... }
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

// File constants
export const FILE_TYPES = {
  EXCEL: '.xlsx',
  CSV: '.csv'
};

// Local storage keys
export const STORAGE_KEYS = {
  ATTENDANCE_DATA: 'attendance_data',
  LAST_SAVED: 'last_saved',
  CURRENT_MONTH: 'current_month',
  CURRENT_YEAR: 'current_year'
};

// Table configuration
export const TABLE_CONFIG = {
  STICKY_COLUMNS: 4, // Sl#, Emp ID, Name, Month
  ROW_HEIGHT: 40,
  CELL_WIDTH: 40,
  HEADER_HEIGHT: 50,
  EMPLOYEE_NAME_WIDTH: 200,
  EMP_ID_WIDTH: 100,
  SUMMARY_CELL_WIDTH: 80
};

// Validation rules
export const VALIDATION = {
  EMP_ID_PATTERN: /^[A-Z]{2,3}-\d{3,5}$/,
  EMP_ID_EXAMPLE: 'QR-417',
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 50
};