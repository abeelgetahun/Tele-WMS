# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented for the Telecom Warehouse Management System (Tele-WMS). The system enforces strict role-based permissions with warehouse-scoped access control.

## Role Definitions

### 1. ADMIN (System Administrator)

- **Scope**: Global
- **Description**: Full system access with user and warehouse management capabilities
- **Permissions**:
  - Users: Create, Read, Update, Delete
  - Warehouses: Create, Read, Update, Delete
  - Inventory: Create, Read, Update, Delete
  - Transfers: Create, Read, Update, Delete, Approve
  - Audits: Create, Read, Update, Delete
  - Reports: Create, Read, Update, Delete
  - Settings: Read, Update
  - Dashboard: Read
  - Categories: Create, Read, Update, Delete

### 2. WAREHOUSE_MANAGER

- **Scope**: Warehouse-scoped
- **Description**: Manages assigned warehouse operations and staff
- **Permissions**:
  - Users: Read (warehouse-scoped)
  - Warehouses: Read, Update (warehouse-scoped)
  - Inventory: Create, Read, Update, Delete (warehouse-scoped)
  - Transfers: Create, Read, Update, Approve (warehouse-scoped)
  - Audits: Create, Read, Update (warehouse-scoped)
  - Reports: Create, Read (warehouse-scoped)
  - Dashboard: Read (warehouse-scoped)
  - Categories: Read (global)

### 3. INVENTORY_CLERK

- **Scope**: Warehouse-scoped
- **Description**: Handles daily warehouse tasks and inventory management
- **Permissions**:
  - Inventory: Create, Read, Update (warehouse-scoped)
  - Transfers: Create, Read (warehouse-scoped)
  - Audits: Read (warehouse-scoped)
  - Reports: Read (warehouse-scoped)
  - Dashboard: Read (warehouse-scoped)
  - Categories: Read (global)

### 4. TECHNICIAN

- **Scope**: Global (read-only)
- **Description**: Provides technical support and equipment maintenance
- **Permissions**:
  - Inventory: Read (global)
  - Transfers: Read (global)
  - Reports: Read (global)
  - Dashboard: Read (global)
  - Categories: Read (global)

### 5. AUDITOR

- **Scope**: Global (read-only for most resources)
- **Description**: Performs audits and generates compliance reports
- **Permissions**:
  - Audits: Create, Read, Update, Delete (global)
  - Inventory: Read (global)
  - Warehouses: Read (global)
  - Reports: Create, Read (global)
  - Dashboard: Read (global)
  - Categories: Read (global)

## Permission Scopes

### Global Scope

- Users with global scope can access all resources across all warehouses
- Applies to: ADMIN, TECHNICIAN, AUDITOR

### Warehouse Scope

- Users with warehouse scope can only access resources within their assigned warehouse
- Applies to: WAREHOUSE_MANAGER, INVENTORY_CLERK

### Own Scope

- Users can only access their own resources (future implementation)
- Currently not implemented but framework is in place

## Implementation Components

### 1. Permission System (`lib/permissions.ts`)

- Defines role permissions with scope-based access control
- Provides utility functions for permission checking
- Handles warehouse-scoped access validation

### 2. Authorization Middleware (`lib/middleware.ts`)

- Enhanced authentication with role-based authorization
- Warehouse-scoped access control
- Convenience functions for common authorization patterns

### 3. RBAC Utilities (`lib/rbac-utils.ts`)

- Helper functions for permission management
- Role hierarchy management
- Warehouse access validation
- Resource access level determination

### 4. Protected Route Component (`components/layout/protected-route.tsx`)

- Client-side route protection
- Warehouse-scoped access control
- Detailed error messages for access denied scenarios

### 5. Sidebar Navigation (`components/layout/sidebar.tsx`)

- Role-based navigation menu
- Warehouse information display
- Dynamic route generation based on permissions

## API Route Protection

All API routes are protected with appropriate authorization middleware:

### User Management

```typescript
// Only admins can create users, managers can create clerks/technicians for their warehouse
export const POST = withUserManagement(
  async (request: AuthenticatedRequest) => {
    // Role assignment restrictions
    // Warehouse assignment validation
  }
);
```

### Inventory Management

```typescript
// Warehouse-scoped access for inventory operations
export const POST = withInventoryManagement(
  async (request: AuthenticatedRequest) => {
    // Warehouse assignment validation
    // Auto-assignment to user's warehouse
  }
);
```

### Transfer Management

```typescript
// Warehouse-scoped access for transfer operations
export const POST = withTransferManagement(
  async (request: AuthenticatedRequest) => {
    // Warehouse access validation
    // Source warehouse restrictions
  }
);
```

## Warehouse Access Control

### Warehouse-Scoped Users

- Can only access resources within their assigned warehouse
- Cannot view or modify data from other warehouses
- Auto-assigned to their warehouse for new resources

### Global Users

- Can access all warehouses
- No warehouse restrictions
- Can manage cross-warehouse operations

## Security Features

### 1. Role Hierarchy

- Users can only manage roles at or below their level
- Prevents privilege escalation
- Clear permission boundaries

### 2. Warehouse Isolation

- Warehouse-scoped users are isolated to their assigned warehouse
- Prevents cross-warehouse data access
- Maintains data integrity

### 3. Action-Based Permissions

- Granular permission control (create, read, update, delete, approve)
- Resource-specific access control
- Flexible permission assignment

### 4. Database-Level Security

- User authentication with JWT tokens
- Role and warehouse information stored in database
- Real-time permission validation

## Usage Examples

### Checking Permissions

```typescript
import { hasPermission } from "@/lib/permissions";

// Check if user can create inventory items
const canCreateInventory = hasPermission(
  user.role,
  "inventory",
  "create",
  user.warehouseId,
  targetWarehouseId
);
```

### Warehouse Access Validation

```typescript
import { canAccessWarehouse } from "@/lib/permissions";

// Check if user can access specific warehouse
const hasAccess = canAccessWarehouse(
  user.role,
  user.warehouseId,
  targetWarehouseId
);
```

### Getting User Permissions

```typescript
import { getUserPermissions } from "@/lib/rbac-utils";

// Get comprehensive user permissions
const permissions = getUserPermissions(user.role, user.warehouseId);
```

## Best Practices

### 1. Always Check Permissions

- Use authorization middleware for all API routes
- Implement client-side permission checks
- Validate warehouse access for warehouse-scoped operations

### 2. Warehouse Assignment

- Auto-assign warehouse for warehouse-scoped users
- Validate warehouse access before operations
- Prevent cross-warehouse data access

### 3. Role Management

- Follow role hierarchy for user management
- Validate role assignments based on current user's role
- Prevent privilege escalation

### 4. Error Handling

- Provide clear error messages for access denied scenarios
- Log unauthorized access attempts
- Implement proper fallback mechanisms

## Testing

### Permission Testing

- Test each role with different resources and actions
- Verify warehouse-scoped access restrictions
- Test cross-warehouse access prevention

### API Testing

- Test all API routes with different user roles
- Verify authorization middleware functionality
- Test warehouse access validation

### UI Testing

- Test sidebar navigation for different roles
- Verify protected route components
- Test warehouse information display

## Maintenance

### Adding New Roles

1. Define role in `ROLE_DEFINITIONS`
2. Add permissions with appropriate scopes
3. Update role hierarchy if needed
4. Test with all affected components

### Adding New Resources

1. Define resource permissions for each role
2. Update API routes with authorization middleware
3. Add client-side permission checks
4. Update navigation and UI components

### Modifying Permissions

1. Update `ROLE_DEFINITIONS`
2. Test affected API routes
3. Update client-side components
4. Verify warehouse access control

## Troubleshooting

### Common Issues

1. **Access Denied Errors**

   - Check user role and permissions
   - Verify warehouse assignment
   - Check resource and action permissions

2. **Warehouse Access Issues**

   - Verify user's warehouse assignment
   - Check warehouse-scoped role restrictions
   - Validate target warehouse access

3. **Navigation Issues**
   - Check route permissions
   - Verify role-based route generation
   - Check warehouse-scoped access

### Debug Tools

1. **Permission Checker**

   ```typescript
   console.log(
     "User permissions:",
     getUserPermissions(user.role, user.warehouseId)
   );
   ```

2. **Access Validation**

   ```typescript
   console.log(
     "Warehouse access:",
     canAccessWarehouse(user.role, user.warehouseId, targetWarehouseId)
   );
   ```

3. **Route Access**
   ```typescript
   console.log(
     "Accessible routes:",
     getAccessibleRoutes(user.role, user.warehouseId)
   );
   ```

## Conclusion

This RBAC implementation provides a robust, scalable, and secure access control system for the Tele-WMS. It enforces strict role-based permissions with warehouse-scoped access control, preventing unauthorized access and maintaining data integrity across the system.

The system is designed to be easily extensible for future roles and permissions while maintaining backward compatibility with existing functionality.
