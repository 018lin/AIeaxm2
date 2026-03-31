import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { permissionService, PERMISSIONS, ROLES } from '@/services/permission'
import type { Permission, PermissionCheckResult } from '@/services/permission'

/**
 * 权限验证组合式函数
 * 提供完整的权限验证功能，支持权限、角色、资源操作和菜单访问检查
 */
export function usePermission() {
  // 计算属性
  const currentPermissions: ComputedRef<Permission[]> = computed(() => {
    return permissionService.currentPermissions
  })

  const currentRoles: ComputedRef<string[]> = computed(() => {
    return permissionService.currentRoleCodes
  })

  const hasPermission = (permissionCode: string): boolean => {
    return permissionService.hasPermission(permissionCode)
  }

  const hasPermissions = (permissionCodes: string[]): PermissionCheckResult => {
    return permissionService.hasPermissions(permissionCodes)
  }

  const hasRole = (roleCode: string): boolean => {
    return permissionService.hasRole(roleCode)
  }

  const hasAnyRole = (roleCodes: string[]): boolean => {
    return permissionService.hasAnyRole(roleCodes)
  }

  const hasAllRoles = (roleCodes: string[]): boolean => {
    return permissionService.hasAllRoles(roleCodes)
  }

  const canAccessMenu = (menuId: string): boolean => {
    return permissionService.canAccessMenu(menuId)
  }

  const canPerformAction = (resource: string, action: string): boolean => {
    return permissionService.canPerformAction(resource, action)
  }

  const canPerformActions = (actions: Array<{ resource: string; action: string }>): PermissionCheckResult => {
    return permissionService.canPerformActions(actions)
  }

  const getUserPermissionSummary = () => {
    return permissionService.getUserPermissionSummary()
  }

  const validateWithBackend = async (userId: string, permissionCode: string): Promise<boolean> => {
    return permissionService.validateWithBackend(userId, permissionCode)
  }

  const syncPermissionsToBackend = async (): Promise<boolean> => {
    return permissionService.syncPermissionsToBackend()
  }

  return {
    // 计算属性
    currentPermissions,
    currentRoles,
    
    // 权限检查方法
    hasPermission,
    hasPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccessMenu,
    canPerformAction,
    canPerformActions,
    getUserPermissionSummary,
    validateWithBackend,
    syncPermissionsToBackend,
    
    // 服务实例
    permissionService,
    
    // 常量
    PERMISSIONS,
    ROLES
  }
}

export default usePermission

/**
 * 角色权限检查函数
 * 用于路由守卫中的权限检查
 */
export function checkRolePermission(role: string, permission: string): boolean {
  // 管理员拥有所有权限
  if (role === 'admin') {
    return true
  }
  
  // 根据角色检查特定权限
  switch (role) {
    case 'teacher':
      return hasTeacherPermission(permission)
    case 'student':
      return hasStudentPermission(permission)
    default:
      return false
  }
}

/**
 * 检查教师权限
 */
function hasTeacherPermission(permission: string): boolean {
  const teacherPermissions = [
    PERMISSIONS.QUESTION_VIEW,
    PERMISSIONS.QUESTION_CREATE,
    PERMISSIONS.QUESTION_EDIT,
    PERMISSIONS.ASSIGNMENT_VIEW,
    PERMISSIONS.ASSIGNMENT_CREATE,
    PERMISSIONS.ASSIGNMENT_EDIT,
    PERMISSIONS.ASSIGNMENT_PUBLISH,
    PERMISSIONS.ASSIGNMENT_GRADE,
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.OCR_SCAN,
    PERMISSIONS.OCR_EDIT,
    // 班级相关
    PERMISSIONS.CLASS_VIEW,
    PERMISSIONS.CLASS_CREATE,
    PERMISSIONS.CLASS_EDIT,
    PERMISSIONS.CLASS_DELETE,
    PERMISSIONS.CLASS_STUDENT_ADD,
    PERMISSIONS.CLASS_STUDENT_REMOVE,
    PERMISSIONS.CLASS_STUDENT_IMPORT,
    PERMISSIONS.CLASS_STUDENT_EXPORT,
    PERMISSIONS.CLASS_PAPER_CREATE,
    PERMISSIONS.CLASS_ASSIGNMENT_CREATE,
    PERMISSIONS.CLASS_ANALYTICS_VIEW,
    PERMISSIONS.CLASS_ANALYTICS_EXPORT
  ]
  
  return teacherPermissions.includes(permission)
}

/**
 * 检查学生权限
 */
function hasStudentPermission(permission: string): boolean {
  const studentPermissions = [
    PERMISSIONS.ASSIGNMENT_VIEW,
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.REPORT_VIEW
  ]
  
  return studentPermissions.includes(permission)
}

/**
 * 权限指令
 * 用于在模板中控制元素的显示/隐藏/禁用状态
 */
export const vPermission = {
  mounted(el: HTMLElement, binding: any) {
    const { value } = binding
    let hasPermission = false
    
    if (typeof value === 'string') {
      hasPermission = permissionService.hasPermission(value)
    } else if (value && typeof value === 'object') {
      const { permission, role, resource, action } = value
      
      if (permission) {
        if (typeof permission === 'string') {
          hasPermission = permissionService.hasPermission(permission)
        } else if (Array.isArray(permission)) {
          hasPermission = permissionService.hasPermissions(permission).hasPermission
        }
      } else if (role) {
        if (typeof role === 'string') {
          hasPermission = permissionService.hasRole(role)
        } else if (Array.isArray(role)) {
          hasPermission = permissionService.hasAnyRole(role)
        }
      } else if (resource && action) {
        hasPermission = permissionService.canPerformAction(resource, action)
      }
    }
    
    if (!hasPermission) {
      el.style.display = 'none'
    }
  },
  updated(el: HTMLElement, binding: any) {
    const { value } = binding
    let hasPermission = false
    
    if (typeof value === 'string') {
      hasPermission = permissionService.hasPermission(value)
    } else if (value && typeof value === 'object') {
      const { permission, role, resource, action } = value
      
      if (permission) {
        if (typeof permission === 'string') {
          hasPermission = permissionService.hasPermission(permission)
        } else if (Array.isArray(permission)) {
          hasPermission = permissionService.hasPermissions(permission).hasPermission
        }
      } else if (role) {
        if (typeof role === 'string') {
          hasPermission = permissionService.hasRole(role)
        } else if (Array.isArray(role)) {
          hasPermission = permissionService.hasAnyRole(role)
        }
      } else if (resource && action) {
        hasPermission = permissionService.canPerformAction(resource, action)
      }
    }
    
    if (!hasPermission) {
      el.style.display = 'none'
    } else {
      el.style.display = ''
    }
  }
}

/**
 * 菜单权限检查组合式函数
 * 用于动态菜单的权限过滤
 */
export function useMenuPermission() {
  const filterMenuByPermission = (menuItems: any[]): any[] => {
    return menuItems.filter(menuItem => {
      // 检查菜单权限
      if (menuItem.permission && !permissionService.hasPermission(menuItem.permission)) {
        return false
      }
      
      // 检查菜单访问权限
      if (menuItem.path && !permissionService.canAccessMenu(menuItem.path)) {
        return false
      }
      
      // 递归检查子菜单
      if (menuItem.children && menuItem.children.length > 0) {
        menuItem.children = filterMenuByPermission(menuItem.children)
        return menuItem.children.length > 0
      }
      
      return true
    })
  }
  
  const getAccessibleMenus = (allMenus: any[]): any[] => {
    return filterMenuByPermission(allMenus)
  }
  
  return {
    filterMenuByPermission,
    getAccessibleMenus
  }
}
