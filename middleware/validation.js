const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors with enhanced error messages
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => {
      let enhancedMessage = error.msg;
      
      // Enhance error messages based on field and type
      switch (error.path) {
        case 'name':
          if (error.type === 'field') {
            enhancedMessage = 'Name is required. Please enter your full name.';
          } else if (error.type === 'string.min' || error.type === 'string.max') {
            enhancedMessage = 'Name must be between 2 and 100 characters long.';
          } else if (error.type === 'string.pattern.base') {
            enhancedMessage = 'Name can only contain letters, spaces, hyphens, and apostrophes. Special characters and numbers are not allowed.';
          }
          break;
          
        case 'email':
          if (error.type === 'field') {
            enhancedMessage = 'Email address is required. Please enter a valid email address.';
          } else if (error.type === 'string.email') {
            enhancedMessage = 'Please enter a valid email address (e.g., user@example.com).';
          } else if (error.type === 'string.max') {
            enhancedMessage = 'Email address is too long. Please use a shorter email address.';
          }
          break;
          
        case 'username':
          if (error.type === 'field') {
            enhancedMessage = 'Username is required. Please choose a unique username.';
          } else if (error.type === 'string.min' || error.type === 'string.max') {
            enhancedMessage = 'Username must be between 3 and 30 characters long.';
          } else if (error.type === 'string.pattern.base') {
            enhancedMessage = 'Username can only contain letters, numbers, dots, underscores, and hyphens. No spaces or special characters allowed.';
          }
          break;
          
        case 'password':
          if (error.type === 'field') {
            enhancedMessage = 'Password is required. Please enter a secure password.';
          } else if (error.type === 'string.min') {
            enhancedMessage = 'Password must be at least 6 characters long.';
          } else if (error.type === 'string.pattern.base') {
            enhancedMessage = 'Password must contain at least one lowercase letter, one uppercase letter, and one number.';
          }
          break;
          
        case 'role':
          if (error.type === 'field') {
            enhancedMessage = 'Role is required. Please select a role for this user.';
          } else if (error.type === 'string.min' || error.type === 'string.max') {
            enhancedMessage = 'Role must be between 2 and 50 characters long.';
          }
          break;
          
        case 'permissions':
          if (error.type === 'array') {
            enhancedMessage = 'Permissions must be provided as a list.';
          } else if (error.type === 'any.custom') {
            enhancedMessage = error.msg; // Already enhanced in custom validator
          }
          break;
          
        case 'status':
          if (error.type === 'any.only') {
            enhancedMessage = 'Status must be one of: active, inactive, or suspended.';
          }
          break;
          
        case 'currentPassword':
          if (error.type === 'field') {
            enhancedMessage = 'Current password is required to verify your identity.';
          }
          break;
          
        case 'newPassword':
          if (error.type === 'field') {
            enhancedMessage = 'New password is required. Please enter your new password.';
          } else if (error.type === 'string.min') {
            enhancedMessage = 'New password must be at least 6 characters long.';
          } else if (error.type === 'string.pattern.base') {
            enhancedMessage = 'New password must contain at least one lowercase letter, one uppercase letter, and one number.';
          }
          break;
          
        case 'confirmPassword':
          if (error.type === 'field') {
            enhancedMessage = 'Please confirm your new password by entering it again.';
          } else if (error.type === 'any.custom') {
            enhancedMessage = 'Password confirmation does not match your new password. Please make sure both passwords are identical.';
          }
          break;
          
        case 'identifier':
          if (error.type === 'field') {
            enhancedMessage = 'Please enter your email address or username to log in.';
          }
          break;
          
        default:
          // For other fields, keep the original message
          enhancedMessage = error.msg;
      }
      
      return {
        field: error.path,
        message: enhancedMessage,
        value: error.value,
        type: error.type
      };
    });

    return res.status(400).json({
      status: 'error',
      message: 'Please fix the following errors:',
      errors: formattedErrors
    });
  }
  
  next();
};

// User validation rules with enhanced error messages
const validateUserCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email cannot exceed 255 characters'),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role must be between 2 and 50 characters'),

  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array')
    .custom((permissions) => {
      const validPermissions = [
        'books', 'courses', 'magazines', 'training', 'users', 'analytics', 'settings',
        'authors', 'categories', 'reviews', 'enrollments', 'contact-messages',
        'training-books', 'training-requests', 'training-followup-requests',
        'calendar', 'user-management'
      ];
      
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}. Valid permissions are: ${validPermissions.join(', ')}`);
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended'),

  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email cannot exceed 255 characters'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens'),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('role')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role must be between 2 and 50 characters'),

  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array')
    .custom((permissions) => {
      const validPermissions = [
        'books', 'courses', 'magazines', 'training', 'users', 'analytics', 'settings',
        'authors', 'categories', 'reviews', 'enrollments', 'contact-messages',
        'training-books', 'training-requests', 'training-followup-requests',
        'calendar', 'user-management'
      ];
      
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}. Valid permissions are: ${validPermissions.join(', ')}`);
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended'),

  handleValidationErrors
];

const validateLogin = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),

  handleValidationErrors
];

const validateUserId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('sortBy')
    .optional()
    .isIn(['name', 'email', 'username', 'role', 'status', 'createdAt', 'lastLogin'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc', '1', '-1'])
    .withMessage('Sort order must be asc, desc, 1, or -1'),

  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended'),

  handleValidationErrors
];

// Author validation
const validateAuthorCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Author name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),

  body('nameAr')
    .trim()
    .notEmpty()
    .withMessage('Author Arabic name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author Arabic name must be between 2 and 100 characters'),

  body('biography')
    .trim()
    .notEmpty()
    .withMessage('Author biography is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Biography must be between 10 and 2000 characters'),

  body('biographyAr')
    .trim()
    .notEmpty()
    .withMessage('Author Arabic biography is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Arabic biography must be between 10 and 2000 characters'),

  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid avatar URL'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),

  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value'),

  handleValidationErrors
];

const validateAuthorUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),

  body('nameAr')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author Arabic name must be between 2 and 100 characters'),

  body('biography')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Biography must be between 10 and 2000 characters'),

  body('biographyAr')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Arabic biography must be between 10 and 2000 characters'),

  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid avatar URL'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),

  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value'),

  handleValidationErrors
];

const validateAuthorId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid author ID format'),

  handleValidationErrors
];

// Category validation
const validateCategoryCreation = [
  body('name_en')
    .trim()
    .notEmpty()
    .withMessage('Category name (English) is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name (English) must be between 2 and 50 characters'),

  body('name_ar')
    .trim()
    .notEmpty()
    .withMessage('Category name (Arabic) is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name (Arabic) must be between 2 and 50 characters'),

  body('description_en')
    .trim()
    .notEmpty()
    .withMessage('Category description (English) is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description (English) must be between 10 and 500 characters'),

  body('description_ar')
    .trim()
    .notEmpty()
    .withMessage('Category description (Arabic) is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description (Arabic) must be between 10 and 500 characters'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon name cannot exceed 50 characters'),

  body('color')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Color class cannot exceed 100 characters'),

  body('parentCategory')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID format'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),

  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value'),

  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),

  handleValidationErrors
];

const validateCategoryUpdate = [
  body('name_en')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name (English) must be between 2 and 50 characters'),

  body('name_ar')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name (Arabic) must be between 2 and 50 characters'),

  body('description_en')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description (English) must be between 10 and 500 characters'),

  body('description_ar')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description (Arabic) must be between 10 and 500 characters'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon name cannot exceed 50 characters'),

  body('color')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Color class cannot exceed 100 characters'),

  body('parentCategory')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID format'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),

  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value'),

  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),

  handleValidationErrors
];

const validateCategoryId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid category ID format'),

  handleValidationErrors
];

// Book validation
const validateBookCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Book title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Book title must be between 2 and 200 characters'),

  body('author')
    .isMongoId()
    .withMessage('Invalid author ID format'),

  body('category')
    .isMongoId()
    .withMessage('Invalid category ID format'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Book description is required')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),

  body('shortDescription')
    .trim()
    .notEmpty()
    .withMessage('Short description is required')
    .isLength({ min: 10, max: 300 })
    .withMessage('Short description must be between 10 and 300 characters'),

  body('coverImageUrl')
    .isURL()
    .withMessage('Please provide a valid cover image URL'),

  body('pages')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Pages must be between 1 and 10000'),

  body('language')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Language cannot exceed 50 characters'),

  body('publicationYear')
    .isInt({ min: 1000, max: new Date().getFullYear() + 10 })
    .withMessage('Publication year must be between 1000 and ' + (new Date().getFullYear() + 10)),

  body('status')
    .optional()
    .isIn(['published', 'not-published'])
    .withMessage('Status must be published or not-published'),

  body('format')
    .optional()
    .isIn(['paperback', 'hardcover'])
    .withMessage('Format must be paperback or hardcover'),

  body('ageGroup')
    .optional()
    .isIn(['children', 'young-adult', 'adult', 'all-ages'])
    .withMessage('Age group must be children, young-adult, adult, or all-ages'),

  body('titleAr')
    .trim()
    .notEmpty()
    .withMessage('Arabic title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Arabic title must be between 2 and 200 characters'),

  body('descriptionAr')
    .trim()
    .notEmpty()
    .withMessage('Arabic description is required')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Arabic description must be between 20 and 2000 characters'),

  body('shortDescriptionAr')
    .trim()
    .notEmpty()
    .withMessage('Arabic short description is required')
    .isLength({ min: 10, max: 300 })
    .withMessage('Arabic short description must be between 10 and 300 characters'),

  body('metaTitleAr')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Arabic meta title cannot exceed 60 characters'),

  body('metaDescriptionAr')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Arabic meta description cannot exceed 160 characters'),

  handleValidationErrors
];

const validateBookUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Book title must be between 2 and 200 characters'),

  body('author')
    .optional()
    .isMongoId()
    .withMessage('Invalid author ID format'),

  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID format'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),

  body('shortDescription')
    .optional()
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage('Short description must be between 10 and 300 characters'),

  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
    .withMessage('Please provide a valid ISBN'),

  body('coverImageUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid cover image URL'),

  body('pages')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Pages must be between 1 and 10000'),

  body('language')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Language cannot exceed 50 characters'),

  body('publicationYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 10 })
    .withMessage('Publication year must be between 1000 and ' + (new Date().getFullYear() + 10)),

  body('status')
    .optional()
    .isIn(['published', 'not-published'])
    .withMessage('Status must be published or not-published'),

  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value'),

  body('bestseller')
    .optional()
    .isBoolean()
    .withMessage('Bestseller must be a boolean value'),

  body('newRelease')
    .optional()
    .isBoolean()
    .withMessage('New release must be a boolean value'),

  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('format')
    .optional()
    .isIn(['paperback', 'hardcover'])
    .withMessage('Format must be paperback or hardcover'),

  body('ageGroup')
    .optional()
    .isIn(['children', 'young-adult', 'adult', 'all-ages'])
    .withMessage('Age group must be children, young-adult, adult, or all-ages'),

  body('titleAr')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Arabic title must be between 2 and 200 characters'),

  body('descriptionAr')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Arabic description must be between 20 and 2000 characters'),

  body('shortDescriptionAr')
    .optional()
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage('Arabic short description must be between 10 and 300 characters'),

  body('metaTitleAr')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Arabic meta title cannot exceed 60 characters'),

  body('metaDescriptionAr')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Arabic meta description cannot exceed 160 characters'),

  handleValidationErrors
];

const validateBookId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid book ID format'),

  handleValidationErrors
];

// Review validation
const validateReviewCreation = [
  body('book')
    .isMongoId()
    .withMessage('Invalid book ID format'),

  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('title')
    .trim()
    .notEmpty()
    .withMessage('Review title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Review title must be between 5 and 100 characters'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Review content is required')
    .isLength({ min: 20, max: 1000 })
    .withMessage('Review content must be between 20 and 1000 characters'),

  body('verifiedPurchase')
    .optional()
    .isBoolean()
    .withMessage('Verified purchase must be a boolean value'),

  handleValidationErrors
];

const validateReviewUpdate = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Review title must be between 5 and 100 characters'),

  body('content')
    .optional()
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Review content must be between 20 and 1000 characters'),

  body('verifiedPurchase')
    .optional()
    .isBoolean()
    .withMessage('Verified purchase must be a boolean value'),

  handleValidationErrors
];

const validateReviewId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid review ID format'),

  handleValidationErrors
];

// Contact Message validation
const validateContactMessageCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),

  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),

  body('type')
    .optional()
    .isIn(['general', 'book-order', 'support', 'partnership', 'feedback', 'complaint'])
    .withMessage('Type must be general, book-order, support, partnership, feedback, or complaint'),

  body('bookTitle')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Book title cannot exceed 200 characters'),

  body('bookAuthor')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Book author cannot exceed 100 characters'),

  body('book')
    .optional()
    .isMongoId()
    .withMessage('Invalid book ID format'),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),

  body('preferredContactMethod')
    .optional()
    .isIn(['email', 'phone', 'either'])
    .withMessage('Preferred contact method must be email, phone, or either'),

  body('source')
    .optional()
    .isIn(['website', 'email', 'phone', 'social-media', 'referral', 'other'])
    .withMessage('Source must be website, email, phone, social-media, referral, or other'),

  handleValidationErrors
];

const validateContactMessageUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),

  body('subject')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),

  body('message')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),

  body('type')
    .optional()
    .isIn(['general', 'book-order', 'support', 'partnership', 'feedback', 'complaint'])
    .withMessage('Type must be general, book-order, support, partnership, feedback, or complaint'),

  body('bookTitle')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Book title cannot exceed 200 characters'),

  body('bookAuthor')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Book author cannot exceed 100 characters'),

  body('book')
    .optional()
    .isMongoId()
    .withMessage('Invalid book ID format'),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),

  body('preferredContactMethod')
    .optional()
    .isIn(['email', 'phone', 'either'])
    .withMessage('Preferred contact method must be email, phone, or either'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),

  handleValidationErrors
];

const validateContactMessageId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid contact message ID format'),

  handleValidationErrors
];

module.exports = {
  validateUserCreation,
  validateUserUpdate,
  validateLogin,
  validatePasswordChange,
  validateUserId,
  validatePagination,
  validateAuthorCreation,
  validateAuthorUpdate,
  validateAuthorId,
  validateCategoryCreation,
  validateCategoryUpdate,
  validateCategoryId,
  validateBookCreation,
  validateBookUpdate,
  validateBookId,
  validateReviewCreation,
  validateReviewUpdate,
  validateReviewId,
  validateContactMessageCreation,
  validateContactMessageUpdate,
  validateContactMessageId,
  handleValidationErrors
};
