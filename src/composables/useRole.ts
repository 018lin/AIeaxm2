import { useLocalStorage } from '@vueuse/core'

export default function useRole() {
  const role = useLocalStorage<'teacher' | 'student' | 'admin'>('role', 'teacher')
  return { role }
}