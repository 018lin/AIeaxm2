import { TEACHER_MENU_ITEMS } from '@/router/menu'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

export type MenuItem = {
  label: string
  path: string
  icon?: string
  permission?: string
  children?: MenuItem[]
  demoOnly?: boolean
}

export default function useMenu() {
  const roles = useLocalStorage<string[]>('roles', [])

  const filterDemoOnlyMenus = (items: MenuItem[]) => {
    const isDemo = roles.value.includes('demo')
    const walk = (list: MenuItem[]): MenuItem[] => {
      return list
        .filter(it => (isDemo ? true : !it.demoOnly))
        .map(it => ({
          ...it,
          children: Array.isArray(it.children) ? walk(it.children) : it.children,
        }))
    }
    return walk(items)
  }

  const getRoleMenu = () => {
    return filterDemoOnlyMenus(TEACHER_MENU_ITEMS as unknown as MenuItem[])
  }

  const menu = computed(() => getRoleMenu())

  return {
    menu,
  }
}
