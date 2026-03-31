export type GroupKey = 'correct' | 'wrong' | 'half' | 'unsubmitted'

export type StudentCard = { id: string; name: string; img?: string }

export default function useTeacherHomeworkGroups(opts?: { previewCount?: number }) {
  const groupPreviewCount = Number.isFinite(opts?.previewCount as number) ? Number(opts?.previewCount) : 8

  const normalizeStudents = (raw: unknown, fallbackImg: string, prefix: string): StudentCard[] => {
    if (!Array.isArray(raw)) return []

    return raw
      .map((item, idx) => {
        if (typeof item === 'string') {
          return { id: `${prefix}${idx + 1}`, name: item, img: fallbackImg }
        }

        if (item && typeof item === 'object') {
          const anyItem = item as any
          const nested = anyItem?.name && typeof anyItem.name === 'object' ? anyItem.name : null

          const id =
            (typeof anyItem.id === 'string' && anyItem.id) ||
            (nested && typeof nested.id === 'string' ? nested.id : '') ||
            `${prefix}${idx + 1}`

          const name =
            (typeof anyItem.name === 'string' && anyItem.name) ||
            (nested && typeof nested.name === 'string' ? nested.name : '') ||
            ''

          const img =
            (typeof anyItem.img === 'string' && anyItem.img) ||
            (nested && typeof nested.img === 'string' ? nested.img : '') ||
            fallbackImg

          return name ? { id, name, img } : null
        }

        return null
      })
      .filter((v): v is NonNullable<typeof v> => Boolean(v)) as StudentCard[]
  }

  const groupPrefix = (group: GroupKey) => {
    if (group === 'correct') return 'c_'
    if (group === 'wrong') return 'w_'
    if (group === 'half') return 'h_'
    return 'u_'
  }

  const groupStudents = (q: any, group: GroupKey) => {
    return normalizeStudents(q?.groups?.[group], q?.stemImg || '', groupPrefix(group))
  }

  const groupPreview = (q: any, group: GroupKey) => groupStudents(q, group).slice(0, groupPreviewCount)
  const groupCount = (q: any, group: GroupKey) => groupStudents(q, group).length

  return { groupPreviewCount, normalizeStudents, groupStudents, groupPreview, groupCount }
}
