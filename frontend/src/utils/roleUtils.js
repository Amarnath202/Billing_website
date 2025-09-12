// Role-based access control utilities

export const ROLES = {
  ADMIN: 'Admin',
  USER: 'User'
};

export const PERMISSIONS = {
  // User Management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  
  // Role Management
  VIEW_ROLES: 'view_roles',
  CREATE_ROLES: 'create_roles',
  EDIT_ROLES: 'edit_roles',
  DELETE_ROLES: 'delete_roles',
  
  // Product Management
  VIEW_PRODUCTS: 'view_products',
  CREATE_PRODUCTS: 'create_products',
  EDIT_PRODUCTS: 'edit_products',
  DELETE_PRODUCTS: 'delete_products',
  
  // Sales Management
  VIEW_SALES: 'view_sales',
  CREATE_SALES: 'create_sales',
  EDIT_SALES: 'edit_sales',
  DELETE_SALES: 'delete_sales',
  
  // Financial Management
  VIEW_REPORTS: 'view_reports',
  VIEW_EXPENSES: 'view_expenses',
  MANAGE_BILLING: 'manage_billing',
  
  // System Settings
  MANAGE_SETTINGS: 'manage_settings',
  SYSTEM_ADMIN: 'system_admin'
};

// Default permissions for each role
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.VIEW_ROLES,
    PERMISSIONS.CREATE_ROLES,
    PERMISSIONS.EDIT_ROLES,
    PERMISSIONS.DELETE_ROLES,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.EDIT_SALES,
    PERMISSIONS.DELETE_SALES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.MANAGE_BILLING,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.SYSTEM_ADMIN
  ],
  [ROLES.USER]: [
    // User has limited permissions
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_SALES
  ]
};

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with role information
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) {
    return false;
  }
  
  const userRole = user.role.name;
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  
  return rolePermissions.includes(permission);
};

/**
 * Check if user has admin role
 * @param {Object} user - User object with role information
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  return user?.role?.name === ROLES.ADMIN;
};

/**
 * Check if user has user role
 * @param {Object} user - User object with role information
 * @returns {boolean} - True if user is regular user
 */
export const isUser = (user) => {
  return user?.role?.name === ROLES.USER;
};

/**
 * Get user's role name
 * @param {Object} user - User object with role information
 * @returns {string} - Role name or 'Unknown'
 */
export const getUserRole = (user) => {
  return user?.role?.name || 'Unknown';
};

/**
 * Check if user can access a specific module
 * @param {Object} user - User object with role information
 * @param {string} module - Module name to check
 * @returns {boolean} - True if user can access module
 */
export const canAccessModule = (user, module) => {
  if (!user || !user.role || !user.role.permissions) {
    return false;
  }
  
  // Check if module is in user's role permissions
  const modulePermission = user.role.permissions.find(
    perm => perm.module === module && perm.visible === true
  );
  
  return !!modulePermission;
};

/**
 * Get list of modules user can access
 * @param {Object} user - User object with role information
 * @returns {Array} - Array of accessible module names
 */
export const getAccessibleModules = (user) => {
  if (!user || !user.role || !user.role.permissions) {
    return [];
  }
  
  return user.role.permissions
    .filter(perm => perm.visible === true)
    .map(perm => perm.module);
};

/**
 * Higher-order component for role-based access control
 * @param {React.Component} Component - Component to wrap
 * @param {string|Array} requiredPermission - Required permission(s)
 * @returns {React.Component} - Wrapped component with access control
 */
export const withRoleAccess = (Component, requiredPermission) => {
  return (props) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Check if user has required permission(s)
    const hasAccess = Array.isArray(requiredPermission)
      ? requiredPermission.some(perm => hasPermission(user, perm))
      : hasPermission(user, requiredPermission);
    
    if (!hasAccess) {
      return (
        <div className="access-denied">
          <h3>Access Denied</h3>
          <p>You don't have permission to access this feature.</p>
          <p>Required permission: {Array.isArray(requiredPermission) ? requiredPermission.join(' or ') : requiredPermission}</p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  isAdmin,
  isUser,
  getUserRole,
  canAccessModule,
  getAccessibleModules,
  withRoleAccess
};
