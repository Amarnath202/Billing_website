import React from 'react';
import { hasPermission, isAdmin, getUserRole } from '../utils/roleUtils';

/**
 * Component that conditionally renders content based on user permissions
 */
const RoleBasedAccess = ({ 
  children, 
  permission, 
  role, 
  fallback = null,
  showFallback = false 
}) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Check permission-based access
  if (permission) {
    const hasAccess = Array.isArray(permission)
      ? permission.some(perm => hasPermission(user, perm))
      : hasPermission(user, permission);
    
    if (!hasAccess) {
      return showFallback ? (
        fallback || (
          <div className="access-denied-inline">
            <span>⚠️ Insufficient permissions</span>
          </div>
        )
      ) : null;
    }
  }
  
  // Check role-based access
  if (role) {
    const userRole = getUserRole(user);
    const hasRoleAccess = Array.isArray(role)
      ? role.includes(userRole)
      : userRole === role;
    
    if (!hasRoleAccess) {
      return showFallback ? (
        fallback || (
          <div className="access-denied-inline">
            <span>⚠️ Role access denied</span>
          </div>
        )
      ) : null;
    }
  }
  
  return children;
};

/**
 * Admin-only content wrapper
 */
export const AdminOnly = ({ children, fallback, showFallback = false }) => {
  return (
    <RoleBasedAccess 
      role="Admin" 
      fallback={fallback} 
      showFallback={showFallback}
    >
      {children}
    </RoleBasedAccess>
  );
};

/**
 * User role indicator component
 */
export const RoleIndicator = ({ className = "" }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = getUserRole(user);
  const isAdminUser = isAdmin(user);
  
  return (
    <span className={`role-indicator ${isAdminUser ? 'admin' : 'user'} ${className}`}>
      {isAdminUser ? '🔑' : '👤'} {role}
    </span>
  );
};

/**
 * Permission-based button component
 */
export const PermissionButton = ({ 
  permission, 
  role,
  children, 
  onClick, 
  className = "",
  disabled = false,
  ...props 
}) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Check permission
  let hasAccess = true;
  if (permission) {
    hasAccess = Array.isArray(permission)
      ? permission.some(perm => hasPermission(user, perm))
      : hasPermission(user, permission);
  }
  
  // Check role
  if (role && hasAccess) {
    const userRole = getUserRole(user);
    hasAccess = Array.isArray(role)
      ? role.includes(userRole)
      : userRole === role;
  }
  
  if (!hasAccess) {
    return null;
  }
  
  return (
    <button 
      onClick={onClick}
      className={`permission-button ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Admin panel component
 */
export const AdminPanel = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <AdminOnly 
      showFallback={true}
      fallback={
        <div className="access-denied-panel">
          <h3>🔒 Admin Access Required</h3>
          <p>This panel is only accessible to administrators.</p>
          <p>Your current role: <strong>{getUserRole(user)}</strong></p>
        </div>
      }
    >
      <div className="admin-panel">
        <h2>🔑 Admin Control Panel</h2>
        <div className="admin-stats">
          <div className="stat-card">
            <h3>User Management</h3>
            <p>Manage system users and their roles</p>
            <PermissionButton 
              permission="view_users"
              className="btn btn-primary"
            >
              Manage Users
            </PermissionButton>
          </div>
          
          <div className="stat-card">
            <h3>System Settings</h3>
            <p>Configure system-wide settings</p>
            <PermissionButton 
              permission="manage_settings"
              className="btn btn-secondary"
            >
              System Settings
            </PermissionButton>
          </div>
          
          <div className="stat-card">
            <h3>Reports & Analytics</h3>
            <p>View detailed system reports</p>
            <PermissionButton 
              permission="view_reports"
              className="btn btn-info"
            >
              View Reports
            </PermissionButton>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
};

export default RoleBasedAccess;
