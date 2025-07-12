/**
 * Validation Middleware
 * 
 * This module provides comprehensive validation for incoming requests
 * to prevent common issues and ensure data integrity.
 */

/**
 * Validate that a value is not null or undefined
 * @param {any} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {boolean} - True if valid
 */
const isNotNullOrUndefined = (value, fieldName) => {
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} is required`);
  }
  return true;
};

/**
 * Validate that a value is a string
 * @param {any} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {boolean} - True if valid
 */
const isString = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  return true;
};

/**
 * Validate that a value is a number
 * @param {any} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {boolean} - True if valid
 */
const isNumber = (value, fieldName) => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  return true;
};

/**
 * Validate that a value is an array
 * @param {any} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {boolean} - True if valid
 */
const isArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }
  return true;
};

/**
 * Validate that a value is a valid email
 * @param {any} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {boolean} - True if valid
 */
const isEmail = (value, fieldName) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new Error(`${fieldName} must be a valid email address`);
  }
  return true;
};

/**
 * Validate that a value is within a range
 * @param {number} value - The value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - The name of the field for error messages
 * @returns {boolean} - True if valid
 */
const isInRange = (value, min, max, fieldName) => {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return true;
};

/**
 * Validate that a value has a minimum length
 * @param {string} value - The value to validate
 * @param {number} minLength - Minimum length
 * @param {string} fieldName - The name of the field for error messages
 * @returns {boolean} - True if valid
 */
const hasMinLength = (value, minLength, fieldName) => {
  if (value.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters long`);
  }
  return true;
};

/**
 * Validate that a value has a maximum length
 * @param {string} value - The value to validate
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - The name of the field for error messages
 * @returns {boolean} - True if valid
 */
const hasMaxLength = (value, maxLength, fieldName) => {
  if (value.length > maxLength) {
    throw new Error(`${fieldName} must be no more than ${maxLength} characters long`);
  }
  return true;
};

/**
 * Validate that a value is one of the allowed values
 * @param {any} value - The value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {string} fieldName - The name of the field for error messages
 * @returns {boolean} - True if valid
 */
const isOneOf = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  return true;
};

/**
 * Validate player data
 * @param {Object} data - The player data to validate
 * @returns {Object} - Validated data
 */
const validatePlayerData = (data) => {
  const errors = [];
  
  try {
    // Validate required fields
    if (data.name !== undefined) {
      isNotNullOrUndefined(data.name, 'name');
      isString(data.name, 'name');
      hasMinLength(data.name, 1, 'name');
      hasMaxLength(data.name, 255, 'name');
    }
    
    if (data.age !== undefined) {
      isNumber(data.age, 'age');
      isInRange(data.age, 8, 25, 'age');
    }
    
    if (data.email !== undefined) {
      isEmail(data.email, 'email');
    }
    
    if (data.position !== undefined) {
      if (typeof data.position === 'string') {
        hasMaxLength(data.position, 255, 'position');
      } else if (Array.isArray(data.position)) {
        isArray(data.position, 'position');
        data.position.forEach((pos, index) => {
          isString(pos, `position[${index}]`);
        });
      }
    }
    
    if (data.graduation_year !== undefined) {
      isNumber(data.graduation_year, 'graduation_year');
      const currentYear = new Date().getFullYear();
      isInRange(data.graduation_year, currentYear, currentYear + 6, 'graduation_year');
    }
    
  } catch (error) {
    errors.push(error.message);
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(', ')}`);
  }
  
  return data;
};

/**
 * Validate session data
 * @param {Object} data - The session data to validate
 * @returns {Object} - Validated data
 */
const validateSessionData = (data) => {
  const errors = [];
  
  try {
    if (data.session_type !== undefined) {
      isString(data.session_type, 'session_type');
      hasMaxLength(data.session_type, 100, 'session_type');
    }
    
    if (data.notes !== undefined) {
      isString(data.notes, 'notes');
      hasMaxLength(data.notes, 1000, 'notes');
    }
    
    if (data.session_date !== undefined) {
      const date = new Date(data.session_date);
      if (isNaN(date.getTime())) {
        throw new Error('session_date must be a valid date');
      }
    }
    
  } catch (error) {
    errors.push(error.message);
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(', ')}`);
  }
  
  return data;
};

/**
 * Validate authentication data
 * @param {Object} data - The auth data to validate
 * @returns {Object} - Validated data
 */
const validateAuthData = (data) => {
  const errors = [];
  
  try {
    if (data.email !== undefined) {
      isNotNullOrUndefined(data.email, 'email');
      isString(data.email, 'email');
      isEmail(data.email, 'email');
    }
    
    if (data.password !== undefined) {
      isNotNullOrUndefined(data.password, 'password');
      isString(data.password, 'password');
      hasMinLength(data.password, 6, 'password');
      hasMaxLength(data.password, 255, 'password');
    }
    
    if (data.name !== undefined) {
      isNotNullOrUndefined(data.name, 'name');
      isString(data.name, 'name');
      hasMinLength(data.name, 1, 'name');
      hasMaxLength(data.name, 255, 'name');
    }
    
    if (data.role !== undefined) {
      isOneOf(data.role, ['admin', 'coach', 'player'], 'role');
    }
    
  } catch (error) {
    errors.push(error.message);
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(', ')}`);
  }
  
  return data;
};

/**
 * Validate file upload
 * @param {Object} file - The file object to validate
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Object} - Validated file
 */
const validateFileUpload = (file, allowedTypes = ['text/csv'], maxSize = 10 * 1024 * 1024) => {
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
  }
  
  return file;
};

/**
 * Middleware to validate request body
 * @param {Function} validator - The validation function to use
 * @returns {Function} - Express middleware function
 */
const validateBody = (validator) => {
  return (req, res, next) => {
    try {
      req.body = validator(req.body);
      next();
    } catch (error) {
      res.status(400).json({ 
        error: 'Validation error',
        details: error.message 
      });
    }
  };
};

/**
 * Middleware to validate request parameters
 * @param {Function} validator - The validation function to use
 * @returns {Function} - Express middleware function
 */
const validateParams = (validator) => {
  return (req, res, next) => {
    try {
      req.params = validator(req.params);
      next();
    } catch (error) {
      res.status(400).json({ 
        error: 'Validation error',
        details: error.message 
      });
    }
  };
};

/**
 * Middleware to validate query parameters
 * @param {Function} validator - The validation function to use
 * @returns {Function} - Express middleware function
 */
const validateQuery = (validator) => {
  return (req, res, next) => {
    try {
      req.query = validator(req.query);
      next();
    } catch (error) {
      res.status(400).json({ 
        error: 'Validation error',
        details: error.message 
      });
    }
  };
};

/**
 * Middleware to validate file uploads
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Function} - Express middleware function
 */
const validateFile = (allowedTypes = ['text/csv'], maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    try {
      validateFileUpload(req.file, allowedTypes, maxSize);
      next();
    } catch (error) {
      res.status(400).json({ 
        error: 'File validation error',
        details: error.message 
      });
    }
  };
};

module.exports = {
  // Validation functions
  isNotNullOrUndefined,
  isString,
  isNumber,
  isArray,
  isEmail,
  isInRange,
  hasMinLength,
  hasMaxLength,
  isOneOf,
  
  // Data validators
  validatePlayerData,
  validateSessionData,
  validateAuthData,
  validateFileUpload,
  
  // Middleware
  validateBody,
  validateParams,
  validateQuery,
  validateFile
}; 