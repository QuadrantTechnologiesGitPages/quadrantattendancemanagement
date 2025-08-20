import React, { useRef, useState } from 'react';
import MonthSelector from '../MonthSelector';
import { calculateMonthlyStatistics } from '../../utils/calculations';
import './Toolbar.css';

/**
 * Toolbar Component - Top toolbar with actions and statistics
 */
const Toolbar = ({
  currentMonth,
  currentYear,
  employees,
  selectedCount,
  hasUnsavedChanges,
  lastSaved,
  onMonthYearChange,
  onLoadFile,
  onSaveFile,
  onAddEmployee,
  onDeleteSelected,
  onSelectAll,
  onDeselectAll,
  onMarkWeekends,
  onMarkHolidays,
  onExportReport,
  onRefresh
}) => {
  const fileInputRef = useRef(null);
  const [showStats, setShowStats] = useState(false);
  
  // Calculate statistics
  const stats = calculateMonthlyStatistics(employees);
  
  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      onLoadFile(file);
      e.target.value = ''; // Reset input
    }
  };
  
  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return 'Not saved';
    const now = new Date();
    const saved = new Date(lastSaved);
    const diffMs = now - saved;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return saved.toLocaleDateString();
  };
  
  return (
    <div className="toolbar">
      {/* Top Row - Main Actions */}
      <div className="toolbar-row toolbar-main">
        <div className="toolbar-section">
          {/* Logo/Title */}
          <div className="toolbar-brand">
            <span className="brand-icon">📊</span>
            <span className="brand-text">Attendance Manager</span>
          </div>
        </div>
        
        <div className="toolbar-section">
          {/* Month Selector */}
          <MonthSelector
            currentMonth={currentMonth}
            currentYear={currentYear}
            onMonthYearChange={onMonthYearChange}
          />
        </div>
        
        <div className="toolbar-section toolbar-actions">
          {/* File Operations */}
          <div className="action-group">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <button
              className="toolbar-btn btn-outline"
              onClick={() => fileInputRef.current?.click()}
              title="Load Excel file"
            >
              <span className="btn-icon">📁</span>
              <span className="btn-text">Load</span>
            </button>
            
            <button
              className="toolbar-btn btn-primary"
              onClick={onSaveFile}
              title="Save to Excel"
            >
              <span className="btn-icon">💾</span>
              <span className="btn-text">Save</span>
              {hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
            </button>
          </div>
          
          {/* Employee Operations */}
          <div className="action-group">
            <button
              className="toolbar-btn btn-success"
              onClick={onAddEmployee}
              title="Add new employee"
            >
              <span className="btn-icon">➕</span>
              <span className="btn-text">Add Employee</span>
            </button>
            
            {selectedCount > 0 && (
              <button
                className="toolbar-btn btn-danger"
                onClick={onDeleteSelected}
                title={`Delete ${selectedCount} selected`}
              >
                <span className="btn-icon">🗑️</span>
                <span className="btn-text">Delete ({selectedCount})</span>
              </button>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="action-group">
            <button
              className="toolbar-btn btn-outline"
              onClick={onRefresh}
              title="Refresh data"
            >
              <span className="btn-icon">🔄</span>
            </button>
            
            <button
              className="toolbar-btn btn-outline"
              onClick={() => setShowStats(!showStats)}
              title="Toggle statistics"
            >
              <span className="btn-icon">📈</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Second Row - Bulk Actions & Status */}
      <div className="toolbar-row toolbar-secondary">
        <div className="toolbar-section">
          {/* Selection Actions */}
          <div className="selection-actions">
            {selectedCount > 0 ? (
              <>
                <span className="selection-count">{selectedCount} selected</span>
                <button
                  className="toolbar-link"
                  onClick={onDeselectAll}
                >
                  Clear selection
                </button>
              </>
            ) : (
              <button
                className="toolbar-link"
                onClick={onSelectAll}
                disabled={employees.length === 0}
              >
                Select all ({employees.length})
              </button>
            )}
          </div>
          
          {/* Bulk Actions */}
          <div className="bulk-actions">
            <button
              className="toolbar-btn-sm"
              onClick={onMarkWeekends}
              title="Mark all weekends as Sunday"
            >
              Mark Weekends
            </button>
            <button
              className="toolbar-btn-sm"
              onClick={onMarkHolidays}
              title="Mark all holidays"
            >
              Mark Holidays
            </button>
            <button
              className="toolbar-btn-sm"
              onClick={onExportReport}
              title="Export attendance report"
            >
              Export Report
            </button>
          </div>
        </div>
        
        <div className="toolbar-section">
          {/* Save Status */}
          <div className="save-status">
            {hasUnsavedChanges ? (
              <span className="status-unsaved">
                <span className="status-icon">⚠️</span>
                Unsaved changes
              </span>
            ) : (
              <span className="status-saved">
                <span className="status-icon">✓</span>
                All changes saved
              </span>
            )}
            <span className="last-saved">
              Last saved: {formatLastSaved()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Statistics Panel */}
      {showStats && (
        <div className="toolbar-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{employees.length}</div>
              <div className="stat-label">Total Employees</div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-value">{stats.presentToday}</div>
              <div className="stat-label">Present Today</div>
            </div>
            <div className="stat-card stat-danger">
              <div className="stat-value">{stats.absentToday}</div>
              <div className="stat-label">Absent Today</div>
            </div>
            <div className="stat-card stat-info">
              <div className="stat-value">{stats.onLeaveToday}</div>
              <div className="stat-label">On Leave</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.averageAttendance || 0}%</div>
              <div className="stat-label">Avg Attendance</div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-value">{stats.perfectAttendanceCount}</div>
              <div className="stat-label">Perfect Attendance</div>
            </div>
            <div className="stat-card stat-warning">
              <div className="stat-value">{stats.criticalAttendanceCount}</div>
              <div className="stat-label">Below 75%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;