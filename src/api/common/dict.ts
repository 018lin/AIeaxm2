type RawDictRecord = Record<string, any>

interface NormalizedDictResponse {
  dictType?: string
  dictTypeList?: {
    id?: number
    label?: string
    value?: string
    dictValue?: string
    dictType?: string
  }[]
}

const asArray = (value: unknown): RawDictRecord[] => (Array.isArray(value) ? (value as RawDictRecord[]) : [])

const asString = (value: unknown) => {
  if (value === undefined || value === null) return undefined
  return String(value)
}

const normalizeDictItem = (item: RawDictRecord, dictType?: string) => {
  const value = asString(item.dictValue ?? item.value ?? item.dictCode ?? item.code ?? item.id)
  const label = asString(item.label ?? item.dictLabel ?? item.name ?? item.dictName ?? item.text ?? value)

  return {
    id: typeof item.id === 'number' ? item.id : undefined,
    label: label || '',
    value,
    dictValue: value,
    dictType: asString(item.dictType ?? dictType),
  }
}

const normalizeDictGroup = (dictType: string, items: unknown) => ({
  dictType,
  dictTypeList: asArray(items)
    .map(item => normalizeDictItem(item, dictType))
    .filter(item => item.label && item.dictValue),
})

export const normalizeDictList = (raw: unknown, requestedTypes: string[] = []): NormalizedDictResponse[] => {
  const data = (raw as any)?.data ?? raw
  const listLike = (data as any)?.list ?? (data as any)?.records

  if (Array.isArray(listLike)) return normalizeDictList(listLike, requestedTypes)

  if (Array.isArray(data)) {
    if (data.some(item => Array.isArray((item as RawDictRecord)?.dictTypeList))) {
      return data
        .map(item => {
          const dictType = asString((item as RawDictRecord).dictType)
          return dictType ? normalizeDictGroup(dictType, (item as RawDictRecord).dictTypeList) : undefined
        })
        .filter((item): item is NormalizedDictResponse => Boolean(item))
    }

    const grouped = new Map<string, RawDictRecord[]>()
    data.forEach(item => {
      const dictType = asString((item as RawDictRecord).dictType) || (requestedTypes.length === 1 ? requestedTypes[0] : '')
      if (!dictType) return
      grouped.set(dictType, [...(grouped.get(dictType) || []), item as RawDictRecord])
    })

    return [...grouped.entries()].map(([dictType, items]) => normalizeDictGroup(dictType, items))
  }

  if (data && typeof data === 'object') {
    const record = data as RawDictRecord
    if (Array.isArray(record.dictTypeList) && record.dictType) {
      return [normalizeDictGroup(String(record.dictType), record.dictTypeList)]
    }

    const keys = requestedTypes.length ? requestedTypes : Object.keys(record)
    return keys
      .filter(key => Array.isArray(record[key]))
      .map(key => normalizeDictGroup(key, record[key]))
  }

  return []
}
