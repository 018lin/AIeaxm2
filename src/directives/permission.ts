import type { App, Directive } from 'vue'
import { permissionService } from '@/services/permission'

// 权限验证指令的绑定值接口
interface PermissionBinding {
  permission?: string | string[]
  role?: string | string[]
  resource?: string
  action?: string
  menu?: string
  mode?: 'visible' | 'disabled' | 'readonly' // 控制模式：可见性、禁用、只读
  fallback?: boolean // 当没有权限时的默认行为
}

// 权限验证结果
interface PermissionCheck {
  hasPermission: boolean
  message?: string
}

/**
 * 权限验证指令
 * 使用方法：
 * <button v-permission="'question:create'">创建题目</button>
 * <button v-permission="{ permission: ['question:create', 'question:edit'] }">管理题目</button>
 * <button v-permission="{ role: 'teacher' }">教师操作</button>
 * <button v-permission="{ resource: 'question', action: 'create' }">创建题目</button>
 * <div v-permission="{ menu: 'teacher_questions' }">题目管理</div>
 * <button v-permission="{ permission: 'question:create', mode: 'disabled' }">创建题目</button>
 */
const permissionDirective: Directive = {
  mounted(el, binding) {
    checkPermission(el, binding.value)
  },
  updated(el, binding) {
    checkPermission(el, binding.value)
  }
}

/**
 * 检查权限并控制元素
 */
function checkPermission(el: HTMLElement, bindingValue: string | PermissionBinding) {
  const permissionCheck = performPermissionCheck(bindingValue)
  
  if (typeof bindingValue === 'string') {
    // 简单权限检查
    if (!permissionCheck.hasPermission) {
      el.style.display = 'none'
    } else {
      el.style.display = ''
    }
  } else {
    // 复杂权限检查
    const mode = bindingValue.mode || 'visible'
    
    switch (mode) {
      case 'visible':
        if (!permissionCheck.hasPermission) {
          el.style.display = 'none'
        } else {
          el.style.display = ''
        }
        break
        
      case 'disabled':
        if (el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
          const element = el as HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
          element.disabled = !permissionCheck.hasPermission
          
          if (permissionCheck.hasPermission) {
            el.classList.remove('permission-disabled')
          } else {
            el.classList.add('permission-disabled')
          }
        }
        break
        
      case 'readonly':
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          const element = el as HTMLInputElement | HTMLTextAreaElement
          element.readOnly = !permissionCheck.hasPermission
          
          if (permissionCheck.hasPermission) {
            el.classList.remove('permission-readonly')
          } else {
            el.classList.add('permission-readonly')
          }
        }
        break
    }
    
    // 添加权限提示
    if (!permissionCheck.hasPermission && permissionCheck.message) {
      el.title = permissionCheck.message
    } else {
      el.title = ''
    }
  }
}

/**
 * 执行权限检查
 */
function performPermissionCheck(bindingValue: string | PermissionBinding): PermissionCheck {
  if (typeof bindingValue === 'string') {
    // 简单权限字符串检查
    const hasPermission = permissionService.hasPermission(bindingValue)
    return {
      hasPermission,
      message: hasPermission ? undefined : `缺少权限: ${bindingValue}`
    }
  }
  
  const { permission, role, resource, action, menu } = bindingValue
  
  // 权限检查
  if (permission) {
    if (typeof permission === 'string') {
      const hasPermission = permissionService.hasPermission(permission)
      return {
        hasPermission,
        message: hasPermission ? undefined : `缺少权限: ${permission}`
      }
    } else if (Array.isArray(permission)) {
      const result = permissionService.hasPermissions(permission)
      return {
        hasPermission: result.hasPermission,
        message: result.message
      }
    }
  }
  
  // 角色检查
  if (role) {
    if (typeof role === 'string') {
      const hasRole = permissionService.hasRole(role)
      return {
        hasPermission: hasRole,
        message: hasRole ? undefined : `缺少角色: ${role}`
      }
    } else if (Array.isArray(role)) {
      const hasAnyRole = permissionService.hasAnyRole(role)
      return {
        hasPermission: hasAnyRole,
        message: hasAnyRole ? undefined : `缺少角色: ${role.join(', ')}`
      }
    }
  }
  
  // 资源操作检查
  if (resource && action) {
    const canPerformAction = permissionService.canPerformAction(resource, action)
    return {
      hasPermission: canPerformAction,
      message: canPerformAction ? undefined : `不允许对 ${resource} 执行 ${action} 操作`
    }
  }
  
  // 菜单访问检查
  if (menu) {
    const canAccessMenu = permissionService.canAccessMenu(menu)
    return {
      hasPermission: canAccessMenu,
      message: canAccessMenu ? undefined : `无权访问菜单: ${menu}`
    }
  }
  
  // 默认返回无权限
  return {
    hasPermission: false,
    message: '未指定权限检查条件'
  }
}

/**
 * 权限验证组合式函数
 * 用于在Composition API中使用权限验证
 */
export function usePermissionDirective() {
  /**
   * 检查权限
   */
  const checkPermission = (bindingValue: string | PermissionBinding): boolean => {
    const result = performPermissionCheck(bindingValue)
    return result.hasPermission
  }
  
  /**
   * 检查多个权限
   */
  const checkPermissions = (permissions: string[]): boolean => {
    const result = permissionService.hasPermissions(permissions)
    return result.hasPermission
  }
  
  /**
   * 检查角色
   */
  const checkRole = (role: string | string[]): boolean => {
    if (typeof role === 'string') {
      return permissionService.hasRole(role)
    } else if (Array.isArray(role)) {
      return permissionService.hasAnyRole(role)
    }
    return false
  }
  
  /**
   * 检查资源操作权限
   */
  const checkAction = (resource: string, action: string): boolean => {
    return permissionService.canPerformAction(resource, action)
  }
  
  /**
   * 检查菜单访问权限
   */
  const checkMenu = (menuId: string): boolean => {
    return permissionService.canAccessMenu(menuId)
  }
  
  /**
   * 获取权限检查结果详情
   */
  const getPermissionCheck = (bindingValue: string | PermissionBinding): PermissionCheck => {
    return performPermissionCheck(bindingValue)
  }
  
  return {
    checkPermission,
    checkPermissions,
    checkRole,
    checkAction,
    checkMenu,
    getPermissionCheck
  }
}

/**
 * 安装权限指令插件
 */
export default {
  install(app: App) {
    // 注册全局指令
    app.directive('permission', permissionDirective)
    
    // 提供权限验证函数
    app.provide('permission', usePermissionDirective())
    
    // 添加全局属性
    app.config.globalProperties.$permission = {
      check: performPermissionCheck,
      hasPermission: permissionService.hasPermission.bind(permissionService),
      hasRole: permissionService.hasRole.bind(permissionService),
      canPerformAction: permissionService.canPerformAction.bind(permissionService),
      canAccessMenu: permissionService.canAccessMenu.bind(permissionService)
    }
  }
}