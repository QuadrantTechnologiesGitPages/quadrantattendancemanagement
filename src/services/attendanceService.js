import { 
  getDaysInMonth,
  DEFAULT_EMPLOYEE,
  VALIDATION 
} from '../utils/constants';

/**
 * Calculate all summary totals for an employee
 * @param {Object} attendance - Attendance object with day-code mapping
 * @param {String} month - Current month
 * @param {Number} year - Current year
 * @returns {Object} Summary totals
 */
export const calculateSummaries = (attendance, month, year) => {
  const summaries = {
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
  };
  
  const daysInMonth = getDaysInMonth(month, year);
  const sundays = getSundaysInMonth(month, year);
  const holidays = getHolidaysInMonth(month, year);
  
  // First pass: Count basic attendance codes
  for (let day = 1; day <= daysInMonth; day++) {
    const code = attendance[day];
    if (!code) continue;
    
    const upperCode = code.toUpperCase();
    
    switch (upperCode) {
      case 'P':
        summaries.totalPresent++;
        break;
      case 'A':
        summaries.totalAbsent++;
        break;
      case 'O':
        summaries.totalOff++;
        break;
      case 'S':
        summaries.totalSundays++;
        break;
      case 'H':
        summaries.totalHolidays++;
        break;
      case 'N':
        summaries.totalNightShift++;
        break;
      case 'L':
        summaries.totalOnLeave++;
        break;
      case 'WFH':
        summaries.totalPresent++;
        break;
      case 'HD':
        summaries.totalPresent += 0.5;
        break;
      default:
        // Unknown code - ignore
        break;
    }
  }
  
  // Second pass: Calculate Holy Day Working and Off Day Working
  for (let day = 1; day <= daysInMonth; day++) {
    const code = attendance[day];
    if (!code) continue;
    
    const upperCode = code.toUpperCase();
    
    // Holy Day Working: Working on Sundays or Holidays
    if ((sundays.includes(day) || holidays.includes(day)) && 
        (upperCode === 'P' || upperCode === 'N' || upperCode === 'WFH')) {
      summaries.totalHolyDayWorking++;
    }
    
    // Off Day Working: Check if previous day was Off and current day is working
    if (day > 1) {
      const prevDayCode = attendance[day - 1]?.toUpperCase();
      if (prevDayCode === 'O' && (upperCode === 'P' || upperCode === 'N' || upperCode === 'WFH')) {
        summaries.totalOffDayWorking++;
      }
    }
  }
  
  // Calculate Total Working Days using Excel formula:
  // =Total Present + Total Off + Total Sundays + Total Holidays + Total Night Shift + (Total Holy Day Working * 2) + (Total Off Day Working * 0.5)
  summaries.totalWorkingDays = Math.floor(
    summaries.totalPresent + 
    summaries.totalOff + 
    summaries.totalSundays + 
    summaries.totalHolidays + 
    summaries.totalNightShift + 
    (summaries.totalHolyDayWorking * 2) + 
    (summaries.totalOffDayWorking * 0.5)
  );
  
  // Round Present for display
  summaries.totalPresent = Math.floor(summaries.totalPresent);
  
  return summaries;
};

/**
 * Get all Sundays in a month
 * @param {String} month - Month name
 * @param {Number} year - Year
 * @returns {Array} Array of day numbers that are Sundays
 */
export const getSundaysInMonth = (month, year) => {
  const sundays = [];
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
  const daysInMonth = getDaysInMonth(month, year);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    if (date.getDay() === 0) { // 0 = Sunday
      sundays.push(day);
    }
  }
  
  return sundays;
};

/**
 * Get holidays in a month (customize based on your organization)
 * @param {String} month - Month name
 * @param {Number} year - Year
 * @returns {Array} Array of day numbers that are holidays
 */
export const getHolidaysInMonth = (month, year) => {
  // Define your organization's holidays here
  const holidays = {
    'Jan': [1, 26], // New Year, Republic Day
    'Feb': [],
    'Mar': [21], // Holi
    'Apr': [14], // Ambedkar Jayanti
    'May': [1], // May Day
    'Jun': [],
    'Jul': [],
    'Aug': [15], // Independence Day
    'Sep': [],
    'Oct': [2, 24], // Gandhi Jayanti, Dussehra
    'Nov': [12], // Diwali
    'Dec': [25] // Christmas
  };
  
  return holidays[month] || [];
};

/**
 * Validate employee data
 * @param {Object} employee - Employee object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateEmployee = (employee) => {
  const errors = [];
  
  // Validate Employee ID
  if (!employee.empId) {
    errors.push('Employee ID is required');
  } else if (!VALIDATION.EMP_ID_PATTERN.test(employee.empId)) {
    errors.push(`Employee ID must be in format like ${VALIDATION.EMP_ID_EXAMPLE}`);
  }
  
  // Validate Employee Name
  if (!employee.employeeName) {
    errors.push('Employee name is required');
  } else if (employee.employeeName.length < VALIDATION.MIN_NAME_LENGTH) {
    errors.push(`Employee name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`);
  } else if (employee.employeeName.length > VALIDATION.MAX_NAME_LENGTH) {
    errors.push(`Employee name must not exceed ${VALIDATION.MAX_NAME_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a new employee object
 * @param {Object} data - Employee data
 * @returns {Object} New employee object
 */
export const createEmployee = (data = {}) => {
  const employee = {
    slNo: data.slNo || 1,
    empId: data.empId || '',
    employeeName: data.employeeName || '',
    month: data.month || 'Jan',
    department: data.department || '',
    designation: data.designation || '',
    joiningDate: data.joiningDate || '',
    email: data.email || '',
    phone: data.phone || '',
    attendance: data.attendance || {},
    summaries: data.summaries || {
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
  
  return employee;
};

/**
 * Update employee attendance for a specific day
 * @param {Object} employee - Employee object
 * @param {Number} day - Day of month
 * @param {String} code - Attendance code
 * @param {String} month - Current month
 * @param {Number} year - Current year
 * @returns {Object} Updated employee object
 */
export const updateEmployeeAttendance = (employee, day, code, month, year) => {
  const updatedEmployee = { ...employee };
  
  // Update attendance
  if (code && code !== '') {
    updatedEmployee.attendance[day] = code.toUpperCase();
  } else {
    delete updatedEmployee.attendance[day];
  }
  
  // Recalculate summaries
  updatedEmployee.summaries = calculateSummaries(
    updatedEmployee.attendance, 
    month, 
    year
  );
  
  return updatedEmployee;
};

/**
 * Bulk update attendance for multiple days
 * @param {Object} employee - Employee object
 * @param {Object} updates - Object with day-code mappings
 * @param {String} month - Current month
 * @param {Number} year - Current year
 * @returns {Object} Updated employee object
 */
export const bulkUpdateAttendance = (employee, updates, month, year) => {
  const updatedEmployee = { ...employee };
  
  // Apply all updates
  Object.entries(updates).forEach(([day, code]) => {
    if (code && code !== '') {
      updatedEmployee.attendance[parseInt(day)] = code.toUpperCase();
    } else {
      delete updatedEmployee.attendance[parseInt(day)];
    }
  });
  
  // Recalculate summaries
  updatedEmployee.summaries = calculateSummaries(
    updatedEmployee.attendance, 
    month, 
    year
  );
  
  return updatedEmployee;
};

/**
 * Mark weekends automatically
 * @param {Object} employee - Employee object
 * @param {String} month - Current month
 * @param {Number} year - Current year
 * @param {String} code - Code to mark (default 'S' for Sunday)
 * @returns {Object} Updated employee object
 */
export const markWeekends = (employee, month, year, code = 'S') => {
  const updatedEmployee = { ...employee };
  const sundays = getSundaysInMonth(month, year);
  
  sundays.forEach(day => {
    if (!updatedEmployee.attendance[day]) {
      updatedEmployee.attendance[day] = code;
    }
  });
  
  // Recalculate summaries
  updatedEmployee.summaries = calculateSummaries(
    updatedEmployee.attendance, 
    month, 
    year
  );
  
  return updatedEmployee;
};

/**
 * Mark holidays automatically
 * @param {Object} employee - Employee object
 * @param {String} month - Current month
 * @param {Number} year - Current year
 * @param {String} code - Code to mark (default 'H' for Holiday)
 * @returns {Object} Updated employee object
 */
export const markHolidays = (employee, month, year, code = 'H') => {
  const updatedEmployee = { ...employee };
  const holidays = getHolidaysInMonth(month, year);
  
  holidays.forEach(day => {
    if (!updatedEmployee.attendance[day]) {
      updatedEmployee.attendance[day] = code;
    }
  });
  
  // Recalculate summaries
  updatedEmployee.summaries = calculateSummaries(
    updatedEmployee.attendance, 
    month, 
    year
  );
  
  return updatedEmployee;
};

/**
 * Clear all attendance for an employee
 * @param {Object} employee - Employee object
 * @returns {Object} Updated employee object
 */
export const clearAttendance = (employee) => {
  return {
    ...employee,
    attendance: {},
    summaries: { ...DEFAULT_EMPLOYEE.summaries }
  };
};

/**
 * Get attendance statistics for multiple employees
 * @param {Array} employees - Array of employee objects
 * @returns {Object} Statistics object
 */
export const getAttendanceStatistics = (employees) => {
  const stats = {
    totalEmployees: employees.length,
    averagePresent: 0,
    averageAbsent: 0,
    averageLeave: 0,
    perfectAttendance: 0,
    highAbsenteeism: 0 // > 5 days absent
  };
  
  if (employees.length === 0) return stats;
  
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLeave = 0;
  
  employees.forEach(employee => {
    const summaries = employee.summaries;
    totalPresent += summaries.totalPresent || 0;
    totalAbsent += summaries.totalAbsent || 0;
    totalLeave += summaries.totalOnLeave || 0;
    
    // Check for perfect attendance
    if (summaries.totalAbsent === 0 && summaries.totalOnLeave === 0) {
      stats.perfectAttendance++;
    }
    
    // Check for high absenteeism
    if (summaries.totalAbsent > 5) {
      stats.highAbsenteeism++;
    }
  });
  
  stats.averagePresent = Math.round(totalPresent / employees.length);
  stats.averageAbsent = Math.round(totalAbsent / employees.length);
  stats.averageLeave = Math.round(totalLeave / employees.length);
  
  return stats;
};

/**
 * Filter employees based on criteria
 * @param {Array} employees - Array of employee objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered employees
 */
export const filterEmployees = (employees, filters = {}) => {
  return employees.filter(employee => {
    // Filter by name
    if (filters.name && !employee.employeeName.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }
    
    // Filter by employee ID
    if (filters.empId && !employee.empId.toLowerCase().includes(filters.empId.toLowerCase())) {
      return false;
    }
    
    // Filter by attendance status
    if (filters.status === 'perfect' && employee.summaries.totalAbsent > 0) {
      return false;
    }
    
    if (filters.status === 'absent' && employee.summaries.totalAbsent === 0) {
      return false;
    }
    
    // Filter by minimum attendance
    if (filters.minPresent && employee.summaries.totalPresent < filters.minPresent) {
      return false;
    }
    
    return true;
  });
};

/**
 * Sort employees by various criteria
 * @param {Array} employees - Array of employee objects
 * @param {String} sortBy - Sort field
 * @param {String} order - 'asc' or 'desc'
 * @returns {Array} Sorted employees
 */
export const sortEmployees = (employees, sortBy = 'slNo', order = 'asc') => {
  const sorted = [...employees].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'slNo':
        aVal = a.slNo;
        bVal = b.slNo;
        break;
      case 'empId':
        aVal = a.empId;
        bVal = b.empId;
        break;
      case 'name':
        aVal = a.employeeName;
        bVal = b.employeeName;
        break;
      case 'present':
        aVal = a.summaries.totalPresent;
        bVal = b.summaries.totalPresent;
        break;
      case 'absent':
        aVal = a.summaries.totalAbsent;
        bVal = b.summaries.totalAbsent;
        break;
      default:
        aVal = a.slNo;
        bVal = b.slNo;
    }
    
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
  
  return sorted;
};