import { getDaysInMonth } from './constants';

/**
 * Calculate attendance percentage
 * @param {Number} present - Days present
 * @param {Number} total - Total working days
 * @returns {Number} Percentage with 2 decimal places
 */
export const calculateAttendancePercentage = (present, total) => {
  if (!total || total === 0) return 0;
  return Number(((present / total) * 100).toFixed(2));
};

/**
 * Calculate overtime hours based on night shifts
 * @param {Number} nightShifts - Number of night shifts
 * @param {Number} hoursPerShift - Extra hours per night shift (default 2)
 * @returns {Number} Total overtime hours
 */
export const calculateOvertimeHours = (nightShifts, hoursPerShift = 2) => {
  return nightShifts * hoursPerShift;
};

/**
 * Calculate salary deduction based on absences
 * @param {Number} absent - Days absent
 * @param {Number} dailySalary - Daily salary rate
 * @returns {Number} Total deduction
 */
export const calculateSalaryDeduction = (absent, dailySalary) => {
  return absent * dailySalary;
};

/**
 * Calculate bonus for perfect attendance
 * @param {Object} summaries - Employee summaries
 * @param {Number} bonusAmount - Bonus amount for perfect attendance
 * @returns {Number} Bonus amount
 */
export const calculateAttendanceBonus = (summaries, bonusAmount = 1000) => {
  const { totalAbsent, totalOnLeave } = summaries;
  if (totalAbsent === 0 && totalOnLeave === 0) {
    return bonusAmount;
  }
  return 0;
};

/**
 * Calculate leave balance
 * @param {Number} totalLeaveAllowed - Total leaves allowed
 * @param {Number} leavesTaken - Leaves already taken
 * @returns {Number} Remaining leave balance
 */
export const calculateLeaveBalance = (totalLeaveAllowed = 21, leavesTaken = 0) => {
  return Math.max(0, totalLeaveAllowed - leavesTaken);
};

/**
 * Get attendance summary for a date range
 * @param {Object} attendance - Attendance object
 * @param {Number} startDay - Start day
 * @param {Number} endDay - End day
 * @returns {Object} Summary for the range
 */
export const getDateRangeSummary = (attendance, startDay, endDay) => {
  const summary = {
    present: 0,
    absent: 0,
    leave: 0,
    off: 0,
    holiday: 0,
    sunday: 0,
    nightShift: 0,
    total: 0
  };
  
  for (let day = startDay; day <= endDay; day++) {
    const code = attendance[day];
    if (!code) continue;
    
    summary.total++;
    
    switch (code.toUpperCase()) {
      case 'P':
      case 'WFH':
        summary.present++;
        break;
      case 'A':
        summary.absent++;
        break;
      case 'L':
        summary.leave++;
        break;
      case 'O':
        summary.off++;
        break;
      case 'H':
        summary.holiday++;
        break;
      case 'S':
        summary.sunday++;
        break;
      case 'N':
        summary.nightShift++;
        summary.present++; // Night shift also counts as present
        break;
    }
  }
  
  return summary;
};

/**
 * Calculate weekly summary
 * @param {Object} attendance - Attendance object
 * @param {Number} weekNumber - Week number (1-5)
 * @returns {Object} Weekly summary
 */
export const getWeeklySummary = (attendance, weekNumber) => {
  const startDay = (weekNumber - 1) * 7 + 1;
  const endDay = Math.min(weekNumber * 7, 31);
  return getDateRangeSummary(attendance, startDay, endDay);
};

/**
 * Calculate monthly statistics for all employees
 * @param {Array} employees - Array of employee objects
 * @returns {Object} Monthly statistics
 */
export const calculateMonthlyStatistics = (employees) => {
  if (!employees || employees.length === 0) {
    return {
      totalStrength: 0,
      presentToday: 0,
      absentToday: 0,
      onLeaveToday: 0,
      averageAttendance: 0,
      perfectAttendanceCount: 0,
      criticalAttendanceCount: 0 // < 75% attendance
    };
  }
  
  const stats = {
    totalStrength: employees.length,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    averageAttendance: 0,
    perfectAttendanceCount: 0,
    criticalAttendanceCount: 0
  };
  
  let totalAttendancePercentage = 0;
  const today = new Date().getDate();
  
  employees.forEach(employee => {
    // Check today's attendance
    const todayCode = employee.attendance[today];
    if (todayCode) {
      switch (todayCode.toUpperCase()) {
        case 'P':
        case 'WFH':
        case 'N':
          stats.presentToday++;
          break;
        case 'A':
          stats.absentToday++;
          break;
        case 'L':
          stats.onLeaveToday++;
          break;
      }
    }
    
    // Calculate attendance percentage
    const totalWorkingDays = employee.summaries.totalWorkingDays || 22;
    const attendancePercentage = calculateAttendancePercentage(
      employee.summaries.totalPresent,
      totalWorkingDays
    );
    
    totalAttendancePercentage += attendancePercentage;
    
    // Check for perfect attendance
    if (employee.summaries.totalAbsent === 0 && employee.summaries.totalOnLeave === 0) {
      stats.perfectAttendanceCount++;
    }
    
    // Check for critical attendance
    if (attendancePercentage < 75) {
      stats.criticalAttendanceCount++;
    }
  });
  
  stats.averageAttendance = Number((totalAttendancePercentage / employees.length).toFixed(2));
  
  return stats;
};

/**
 * Generate attendance trend for an employee
 * @param {Object} attendance - Attendance object
 * @param {String} month - Month
 * @param {Number} year - Year
 * @returns {Array} Array of daily attendance data
 */
export const generateAttendanceTrend = (attendance, month, year) => {
  const daysInMonth = getDaysInMonth(month, year);
  const trend = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const code = attendance[day] || '';
    trend.push({
      day,
      code,
      isPresent: ['P', 'WFH', 'N'].includes(code.toUpperCase()),
      isAbsent: code.toUpperCase() === 'A',
      isLeave: code.toUpperCase() === 'L',
      isWeekend: code.toUpperCase() === 'S',
      isHoliday: code.toUpperCase() === 'H'
    });
  }
  
  return trend;
};

/**
 * Calculate consecutive absences
 * @param {Object} attendance - Attendance object
 * @returns {Object} Consecutive absence information
 */
export const calculateConsecutiveAbsences = (attendance) => {
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  let totalInstances = 0;
  const instances = [];
  
  const days = Object.keys(attendance).map(Number).sort((a, b) => a - b);
  
  days.forEach((day, index) => {
    if (attendance[day]?.toUpperCase() === 'A') {
      currentConsecutive++;
      
      if (index === days.length - 1 || attendance[days[index + 1]]?.toUpperCase() !== 'A') {
        // End of consecutive absences
        if (currentConsecutive > 0) {
          instances.push({
            start: day - currentConsecutive + 1,
            end: day,
            count: currentConsecutive
          });
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
          totalInstances++;
          currentConsecutive = 0;
        }
      }
    } else {
      currentConsecutive = 0;
    }
  });
  
  return {
    maxConsecutive,
    totalInstances,
    instances
  };
};

/**
 * Calculate pattern analysis (e.g., Monday/Friday absences)
 * @param {Object} attendance - Attendance object
 * @param {String} month - Month
 * @param {Number} year - Year
 * @returns {Object} Pattern analysis
 */
export const analyzeAttendancePatterns = (attendance, month, year) => {
  const patterns = {
    mondayAbsences: 0,
    fridayAbsences: 0,
    afterHolidayAbsences: 0,
    beforeHolidayAbsences: 0
  };
  
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
  const daysInMonth = getDaysInMonth(month, year);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const dayOfWeek = date.getDay();
    const code = attendance[day]?.toUpperCase();
    
    if (code === 'A') {
      // Check for Monday (1) or Friday (5) absences
      if (dayOfWeek === 1) patterns.mondayAbsences++;
      if (dayOfWeek === 5) patterns.fridayAbsences++;
      
      // Check for absences before/after holidays
      const prevCode = attendance[day - 1]?.toUpperCase();
      const nextCode = attendance[day + 1]?.toUpperCase();
      
      if (prevCode === 'H' || prevCode === 'S') {
        patterns.afterHolidayAbsences++;
      }
      if (nextCode === 'H' || nextCode === 'S') {
        patterns.beforeHolidayAbsences++;
      }
    }
  }
  
  return patterns;
};

/**
 * Generate attendance report text
 * @param {Object} employee - Employee object
 * @param {String} month - Month
 * @param {Number} year - Year
 * @returns {String} Report text
 */
export const generateAttendanceReport = (employee, month, year) => {
  const { summaries } = employee;
  const attendancePercentage = calculateAttendancePercentage(
    summaries.totalPresent,
    summaries.totalWorkingDays
  );
  
  const consecutiveAbsences = calculateConsecutiveAbsences(employee.attendance);
  const patterns = analyzeAttendancePatterns(employee.attendance, month, year);
  
  let report = `Attendance Report for ${employee.employeeName} (${employee.empId})\n`;
  report += `Month: ${month} ${year}\n`;
  report += `─────────────────────────────────────\n\n`;
  
  report += `Summary:\n`;
  report += `• Total Present: ${summaries.totalPresent} days\n`;
  report += `• Total Absent: ${summaries.totalAbsent} days\n`;
  report += `• Total Leave: ${summaries.totalOnLeave} days\n`;
  report += `• Attendance Percentage: ${attendancePercentage}%\n\n`;
  
  if (summaries.totalNightShift > 0) {
    report += `• Night Shifts: ${summaries.totalNightShift} days\n`;
  }
  if (summaries.totalHolyDayWorking > 0) {
    report += `• Holiday Working: ${summaries.totalHolyDayWorking} days\n`;
  }
  
  if (consecutiveAbsences.maxConsecutive > 0) {
    report += `\nAbsence Patterns:\n`;
    report += `• Maximum Consecutive Absences: ${consecutiveAbsences.maxConsecutive} days\n`;
    
    if (patterns.mondayAbsences > 0 || patterns.fridayAbsences > 0) {
      report += `• Monday Absences: ${patterns.mondayAbsences}\n`;
      report += `• Friday Absences: ${patterns.fridayAbsences}\n`;
    }
  }
  
  if (attendancePercentage >= 95) {
    report += `\n✓ Excellent Attendance Record`;
  } else if (attendancePercentage < 75) {
    report += `\n⚠ Attendance Below Required Threshold`;
  }
  
  return report;
};

/**
 * Compare two months' attendance
 * @param {Object} currentMonth - Current month summaries
 * @param {Object} previousMonth - Previous month summaries
 * @returns {Object} Comparison data
 */
export const compareMonthlyAttendance = (currentMonth, previousMonth) => {
  return {
    presentDiff: currentMonth.totalPresent - previousMonth.totalPresent,
    absentDiff: currentMonth.totalAbsent - previousMonth.totalAbsent,
    leaveDiff: currentMonth.totalOnLeave - previousMonth.totalOnLeave,
    improvementPercentage: calculateAttendancePercentage(
      currentMonth.totalPresent - previousMonth.totalPresent,
      currentMonth.totalWorkingDays
    )
  };
};