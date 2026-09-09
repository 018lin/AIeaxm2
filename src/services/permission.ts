import { computed, ref } from 'vue'
import { requestPost } from '@/api'

export interface Permission {
  id: string
  code: string
  name: string
  resource: string
  action: string
  description?: string
}

export interface Role {
  id: string
  code: string
  name: string
  permissions: Permission[]
  description?: string
}

export interface UserRole {
  userId: string
  roleId: string
  role: Role
  assignedAt: string
}

export interface PermissionCheckResult {
  hasPermission: boolean
  missingPermissions: string[]
  message?: string
}

export interface MenuPermission {
  menuId: string
  requiredPermissions: string[]
  requiredRoles?: string[]
}

class PermissionService {
  private currentUserRoles = ref<UserRole[]>([])
  private allPermissions = ref<Permission[]>([])
  private allRoles = ref<Role[]>([])
  private menuPermissions = ref<MenuPermission[]>([])
  private permissionCache = ref<Map<string, boolean>>(new Map())

  // 获取当前用户权限
  get currentPermissions(): Permission[] {
    const permissions = new Set<Permission>()
    this.currentUserRoles.value.forEach(userRole => {
      userRole.role.permissions.forEach(permission => {
        permissions.add(permission)
      })
    })
    return Array.from(permissions)
  }

  // 获取当前用户权限代码列表
  get currentPermissionCodes(): string[] {
    return this.currentPermissions.map(p => p.code)
  }

  // 获取当前用户角色代码列表
  get currentRoleCodes(): string[] {
    return this.currentUserRoles.value.map(ur => ur.role.code)
  }

  // 检查是否有特定权限
  hasPermission(permissionCode: string): boolean {
    const cacheKey = `perm_${permissionCode}`
    if (this.permissionCache.value.has(cacheKey)) {
      return this.permissionCache.value.get(cacheKey)!
    }

    const has = this.currentPermissionCodes.includes(permissionCode)
    this.permissionCache.value.set(cacheKey, has)
    return has
  }

  // 检查是否有多个权限
  hasPermissions(permissionCodes: string[]): PermissionCheckResult {
    const missingPermissions: string[] = []

    permissionCodes.forEach(code => {
      if (!this.hasPermission(code)) {
        missingPermissions.push(code)
      }
    })

    return {
      hasPermission: missingPermissions.length === 0,
      missingPermissions,
      message: missingPermissions.length > 0 ? `缺少权限: ${missingPermissions.join(', ')}` : undefined,
    }
  }

  // 检查是否有特定角色
  hasRole(roleCode: string): boolean {
    const cacheKey = `role_${roleCode}`
    if (this.permissionCache.value.has(cacheKey)) {
      return this.permissionCache.value.get(cacheKey)!
    }

    const has = this.currentRoleCodes.includes(roleCode)
    this.permissionCache.value.set(cacheKey, has)
    return has
  }

  // 检查是否有多个角色中的任意一个
  hasAnyRole(roleCodes: string[]): boolean {
    return roleCodes.some(roleCode => this.hasRole(roleCode))
  }

  // 检查是否有多个角色中的所有角色
  hasAllRoles(roleCodes: string[]): boolean {
    return roleCodes.every(roleCode => this.hasRole(roleCode))
  }

  // 检查菜单权限
  canAccessMenu(menuId: string): boolean {
    const menuPerm = this.menuPermissions.value.find(mp => mp.menuId === menuId)
    if (!menuPerm) {
      return true // 默认允许访问未配置的菜单
    }

    // 检查权限要求
    if (menuPerm.requiredPermissions && menuPerm.requiredPermissions.length > 0) {
      const permissionCheck = this.hasPermissions(menuPerm.requiredPermissions)
      if (!permissionCheck.hasPermission) {
        return false
      }
    }

    // 检查角色要求
    if (menuPerm.requiredRoles && menuPerm.requiredRoles.length > 0) {
      return this.hasAnyRole(menuPerm.requiredRoles)
    }

    return true
  }

  // 检查资源操作权限
  canPerformAction(resource: string, action: string): boolean {
    const permissionCode = `${resource}:${action}`
    return this.hasPermission(permissionCode)
  }

  // 批量检查资源操作权限
  canPerformActions(actions: Array<{ resource: string; action: string }>): PermissionCheckResult {
    const permissionCodes = actions.map(({ resource, action }) => `${resource}:${action}`)
    return this.hasPermissions(permissionCodes)
  }

  // 清除权限缓存
  clearCache(): void {
    this.permissionCache.value.clear()
  }

  // 设置当前用户角色
  setCurrentUserRoles(userRoles: UserRole[]): void {
    this.currentUserRoles.value = userRoles
    this.clearCache()
  }

  // 设置所有权限定义
  setAllPermissions(permissions: Permission[]): void {
    this.allPermissions.value = permissions
    this.clearCache()
  }

  // 设置所有角色定义
  setAllRoles(roles: Role[]): void {
    this.allRoles.value = roles
    this.clearCache()
  }

  // 设置菜单权限配置
  setMenuPermissions(menuPermissions: MenuPermission[]): void {
    this.menuPermissions.value = menuPermissions
    this.clearCache()
  }

  // 添加权限到当前用户
  addPermissionToCurrentUser(permission: Permission): void {
    const existingRole = this.currentUserRoles.value.find(ur => ur.role.code === 'custom')
    if (existingRole) {
      existingRole.role.permissions.push(permission)
    } else {
      const customRole: UserRole = {
        userId: 'current',
        roleId: 'custom',
        role: {
          id: 'custom',
          code: 'custom',
          name: '自定义权限',
          permissions: [permission],
        },
        assignedAt: new Date().toISOString(),
      }
      this.currentUserRoles.value.push(customRole)
    }
    this.clearCache()
  }

  // 移除当前用户的权限
  removePermissionFromCurrentUser(permissionCode: string): void {
    this.currentUserRoles.value.forEach(userRole => {
      userRole.role.permissions = userRole.role.permissions.filter(p => p.code !== permissionCode)
    })
    this.clearCache()
  }

  // 获取权限定义
  getPermissionByCode(code: string): Permission | undefined {
    return this.allPermissions.value.find(p => p.code === code)
  }

  // 获取角色定义
  getRoleByCode(code: string): Role | undefined {
    return this.allRoles.value.find(r => r.code === code)
  }

  // 获取用户的完整权限信息
  getUserPermissionSummary(): {
    roles: string[]
    permissions: string[]
    totalPermissions: number
    menuAccess: Array<{ menuId: string; accessible: boolean }>
  } {
    const menuAccess = this.menuPermissions.value.map(mp => ({
      menuId: mp.menuId,
      accessible: this.canAccessMenu(mp.menuId),
    }))

    return {
      roles: this.currentRoleCodes,
      permissions: this.currentPermissionCodes,
      totalPermissions: this.currentPermissions.length,
      menuAccess,
    }
  }

  async validateWithBackend(userId: string, permissionCode: string): Promise<boolean> {
    try {
      const res = await requestPost<{ hasPermission?: boolean }, { userId: string; permissionCode: string }>(
        '/api/v1/permission/validate',
        { userId, permissionCode }
      )
      return Boolean(res?.hasPermission)
    } catch (error) {
      console.error('后端权限验证失败:', error)
      return false
    }
  }

  // 同步权限数据到后端
  async syncPermissionsToBackend(): Promise<boolean> {
    try {
      const permissionData = {
        userRoles: this.currentUserRoles.value,
        permissions: this.allPermissions.value,
        roles: this.allRoles.value,
        menuPermissions: this.menuPermissions.value,
        timestamp: new Date().toISOString(),
      }

      const res = await requestPost<boolean, typeof permissionData>('/api/v1/permission/sync', permissionData)
      return Boolean(res)
    } catch (error) {
      console.error('权限数据同步失败:', error)
      return false
    }
  }
}

// 创建权限服务实例
export const permissionService = new PermissionService()

// 常用的权限代码常量
export const PERMISSIONS = {
  // 题目相关权限
  QUESTION_CREATE: 'question:create',
  QUESTION_EDIT: 'question:edit',
  QUESTION_DELETE: 'question:delete',
  QUESTION_VIEW: 'question:view',
  QUESTION_IMPORT: 'question:import',
  QUESTION_EXPORT: 'question:export',

  // 作业相关权限
  ASSIGNMENT_CREATE: 'assignment:create',
  ASSIGNMENT_EDIT: 'assignment:edit',
  ASSIGNMENT_DELETE: 'assignment:delete',
  ASSIGNMENT_VIEW: 'assignment:view',
  ASSIGNMENT_PUBLISH: 'assignment:publish',
  ASSIGNMENT_GRADE: 'assignment:grade',

  // 学生相关权限
  STUDENT_VIEW: 'student:view',
  STUDENT_EDIT: 'student:edit',
  STUDENT_IMPORT: 'student:import',
  STUDENT_EXPORT: 'student:export',

  // 报告相关权限
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',
  REPORT_ANALYZE: 'report:analyze',

  // 分层与讲评相关权限
  STRATEGY_CONFIGURE_LAYERING: 'strategy:configure_layering',
  REVIEW_GENERATE_DIGITAL_HUMAN: 'review:generate_digital_human',
  RESOURCE_VIEW_DIGITAL_HUMAN: 'resource:view_digital_human',

  // 统计与计划
  STATS_EXPORT: 'stats:export',
  SCHEDULE_TASK: 'schedule:task',

  // 题目来源查看
  QUESTION_VIEW_SOURCE: 'question:view_source',
  AFFAIRS_OVERVIEW_VIEW: 'affairs:overview:view',
  AFFAIRS_ANALYTICS_VIEW: 'affairs:analytics:view',
  AFFAIRS_RESOURCES_VIEW: 'affairs:resources:view',
  AFFAIRS_RESOURCES_UPLOAD: 'affairs:resources:upload',
  AFFAIRS_RESOURCES_REVIEW: 'affairs:resources:review',
  AFFAIRS_RESOURCES_PUBLISH: 'affairs:resources:publish',
  AFFAIRS_SCHEDULE_VIEW: 'affairs:schedule:view',
  AFFAIRS_SCHEDULE_EDIT: 'affairs:schedule:edit',
  AFFAIRS_EXAM_VIEW: 'affairs:exam:view',
  AFFAIRS_EXAM_EDIT: 'affairs:exam:edit',

  // 系统管理权限
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  PERMISSION_MANAGE: 'permission:manage',
  SYSTEM_CONFIG: 'system:config',

  // OCR相关权限
  OCR_SCAN: 'ocr:scan',
  OCR_EDIT: 'ocr:edit',
  OCR_EXPORT: 'ocr:export',
  // 班级管理权限
  CLASS_VIEW: 'class:view',
  CLASS_CREATE: 'class:create',
  CLASS_EDIT: 'class:edit',
  CLASS_DELETE: 'class:delete',
  CLASS_STUDENT_ADD: 'class:student:add',
  CLASS_STUDENT_REMOVE: 'class:student:remove',
  CLASS_STUDENT_IMPORT: 'class:student:import',
  CLASS_STUDENT_EXPORT: 'class:student:export',
  CLASS_PAPER_CREATE: 'class:paper:create',
  CLASS_ASSIGNMENT_CREATE: 'class:assignment:create',
  CLASS_ANALYTICS_VIEW: 'class:analytics:view',
  CLASS_ANALYTICS_EXPORT: 'class:analytics:export',
}

// 常用的角色代码常量
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
  GUEST: 'guest',
  EDU_AFFAIRS: 'edu_affairs',
}

// Vue组合式函数，用于在组件中使用权限
export function usePermission() {
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

  const canAccessMenu = (menuId: string): boolean => {
    return permissionService.canAccessMenu(menuId)
  }

  const canPerformAction = (resource: string, action: string): boolean => {
    return permissionService.canPerformAction(resource, action)
  }

  const getUserPermissionSummary = () => {
    return permissionService.getUserPermissionSummary()
  }

  return {
    hasPermission,
    hasPermissions,
    hasRole,
    hasAnyRole,
    canAccessMenu,
    canPerformAction,
    getUserPermissionSummary,
    currentPermissions: computed(() => permissionService.currentPermissions),
    currentRoles: computed(() => permissionService.currentRoleCodes),
    permissionService,
  }
}

export default permissionService
