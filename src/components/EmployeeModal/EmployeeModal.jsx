 
import React, { useState, useEffect } from 'react';
import { validateEmployee } from '../../services/attendanceService';
import { VALIDATION } from '../../utils/constants';
import './EmployeeModal.css';

/**
 * EmployeeModal Component - Add/Edit employee modal
 */
const EmployeeModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  employee = null,
  existingEmployeeIds = []
}) => {
  const [formData, setFormData] = useState({
    empId: '',
    employeeName: '',
    department: '',
    designation: '',
    joiningDate: '',
    email: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const isEditMode = !!employee;
  
  // Initialize form data when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        empId: employee.empId || '',
        employeeName: employee.employeeName || '',
        department: employee.department || '',
        designation: employee.designation || '',
        joiningDate: employee.joiningDate || '',
        email: employee.email || '',
        phone: employee.phone || ''
      });
    } else {
      // Reset form for new employee
      setFormData({
        empId: '',
        employeeName: '',
        department: '',
        designation: '',
        joiningDate: '',
        email: '',
        phone: ''
      });
    }
    setErrors({});
    setTouched({});
  }, [employee]);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle blur to mark field as touched
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    validateField(name, formData[name]);
  };
  
  // Validate single field
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'empId':
        if (!value) {
          error = 'Employee ID is required';
        } else if (!VALIDATION.EMP_ID_PATTERN.test(value)) {
          error = `Format: ${VALIDATION.EMP_ID_EXAMPLE}`;
        } else if (!isEditMode && existingEmployeeIds.includes(value)) {
          error = 'Employee ID already exists';
        }
        break;
        
      case 'employeeName':
        if (!value) {
          error = 'Employee name is required';
        } else if (value.length < VALIDATION.MIN_NAME_LENGTH) {
          error = `Minimum ${VALIDATION.MIN_NAME_LENGTH} characters`;
        } else if (value.length > VALIDATION.MAX_NAME_LENGTH) {
          error = `Maximum ${VALIDATION.MAX_NAME_LENGTH} characters`;
        }
        break;
        
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Invalid email format';
        }
        break;
        
      case 'phone':
        if (value && !/^\d{10}$/.test(value.replace(/[- ]/g, ''))) {
          error = 'Phone must be 10 digits';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return !error;
  };
  
  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Validate required fields
    if (!formData.empId) {
      newErrors.empId = 'Employee ID is required';
      isValid = false;
    } else if (!VALIDATION.EMP_ID_PATTERN.test(formData.empId)) {
      newErrors.empId = `Format: ${VALIDATION.EMP_ID_EXAMPLE}`;
      isValid = false;
    } else if (!isEditMode && existingEmployeeIds.includes(formData.empId)) {
      newErrors.empId = 'Employee ID already exists';
      isValid = false;
    }
    
    if (!formData.employeeName) {
      newErrors.employeeName = 'Employee name is required';
      isValid = false;
    } else if (formData.employeeName.length < VALIDATION.MIN_NAME_LENGTH) {
      newErrors.employeeName = `Minimum ${VALIDATION.MIN_NAME_LENGTH} characters`;
      isValid = false;
    }
    
    // Validate optional fields
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/[- ]/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
      handleClose();
    }
  };
  
  // Handle modal close
  const handleClose = () => {
    setFormData({
      empId: '',
      employeeName: '',
      department: '',
      designation: '',
      joiningDate: '',
      email: '',
      phone: ''
    });
    setErrors({});
    setTouched({});
    onClose();
  };
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditMode ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button 
            className="modal-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="empId" className="form-label required">
                Employee ID
              </label>
              <input
                type="text"
                id="empId"
                name="empId"
                value={formData.empId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.empId && touched.empId ? 'error' : ''}`}
                placeholder="e.g., QR-417"
                disabled={isEditMode}
                autoFocus={!isEditMode}
              />
              {errors.empId && touched.empId && (
                <span className="form-error">{errors.empId}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="employeeName" className="form-label required">
                Employee Name
              </label>
              <input
                type="text"
                id="employeeName"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.employeeName && touched.employeeName ? 'error' : ''}`}
                placeholder="Full name"
                autoFocus={isEditMode}
              />
              {errors.employeeName && touched.employeeName && (
                <span className="form-error">{errors.employeeName}</span>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="department" className="form-label">
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Engineering"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="designation" className="form-label">
                Designation
              </label>
              <input
                type="text"
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Software Engineer"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="joiningDate" className="form-label">
                Joining Date
              </label>
              <input
                type="date"
                id="joiningDate"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.phone && touched.phone ? 'error' : ''}`}
                placeholder="10-digit number"
              />
              {errors.phone && touched.phone && (
                <span className="form-error">{errors.phone}</span>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group form-group-full">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.email && touched.email ? 'error' : ''}`}
                placeholder="employee@company.com"
              />
              {errors.email && touched.email && (
                <span className="form-error">{errors.email}</span>
              )}
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              {isEditMode ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;