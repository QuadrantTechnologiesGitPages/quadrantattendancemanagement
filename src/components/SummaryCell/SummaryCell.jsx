import React from 'react';
import { calculateAttendancePercentage } from '../../utils/calculations';
import './SummaryCell.css';

/**
 * SummaryCell Component - Display summary statistics with visual indicators
 */
const SummaryCell = ({ 
  value, 
  type, 
  label,
  totalDays,
  isHighlighted = false,
  showPercentage = false,
  threshold = null
}) => {
  // Get cell variant based on type
  const getCellVariant = () => {
    switch (type) {
      case 'totalPresent':
        return 'success';
      case 'totalAbsent':
        return 'danger';
      case 'totalOnLeave':
        return 'info';
      case 'totalOff':
      case 'totalSundays':
        return 'neutral';
      case 'totalHolidays':
        return 'primary';
      case 'totalNightShift':
        return 'purple';
      case 'totalHolyDayWorking':
      case 'totalOffDayWorking':
        return 'warning';
      case 'totalWorkingDays':
        return 'default';
      default:
        return 'default';
    }
  };
  
  // Calculate percentage if needed
  const getPercentage = () => {
    if (!showPercentage || !totalDays || totalDays === 0) return null;
    return calculateAttendancePercentage(value, totalDays);
  };
  
  // Check if value meets threshold
  const meetsThreshold = () => {
    if (!threshold) return true;
    if (threshold.type === 'min') return value >= threshold.value;
    if (threshold.type === 'max') return value <= threshold.value;
    return true;
  };
  
  // Get indicator color based on value
  const getIndicatorClass = () => {
    if (!meetsThreshold()) return 'indicator-warning';
    
    if (type === 'totalPresent') {
      const percentage = getPercentage();
      if (percentage >= 95) return 'indicator-excellent';
      if (percentage >= 80) return 'indicator-good';
      if (percentage >= 75) return 'indicator-average';
      return 'indicator-poor';
    }
    
    if (type === 'totalAbsent') {
      if (value === 0) return 'indicator-excellent';
      if (value <= 2) return 'indicator-good';
      if (value <= 5) return 'indicator-average';
      return 'indicator-poor';
    }
    
    return '';
  };
  
  const variant = getCellVariant();
  const percentage = getPercentage();
  const indicatorClass = getIndicatorClass();
  
  return (
    <div 
      className={`summary-cell summary-cell-${variant} ${isHighlighted ? 'is-highlighted' : ''} ${indicatorClass}`}
      title={label || type}
    >
      <div className="summary-value">
        {value || 0}
      </div>
      
      {percentage !== null && (
        <div className="summary-percentage">
          {percentage}%
        </div>
      )}
      
      {/* Visual indicator bar */}
      {showPercentage && percentage !== null && (
        <div className="summary-bar">
          <div 
            className="summary-bar-fill"
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      )}
      
      {/* Threshold indicator */}
      {!meetsThreshold() && (
        <div className="threshold-indicator" title={`Below threshold of ${threshold.value}`}>
          ⚠
        </div>
      )}
    </div>
  );
};

export default SummaryCell;