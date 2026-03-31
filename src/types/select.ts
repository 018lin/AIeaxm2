// 下拉选项通用结构
export type Option = { label: string; value: string }

// 班级分页查询参数（/api/v1/class/page）
export type ClassPageQuery = {
  classId?: string
  className?: string
  gradeId?: string
  pageNo?: number
  pageSize?: number
  [property: string]: any
}

// 班级实体
export type ClassVO = {
  classId?: string
  className?: string
  id?: number
  [property: string]: any
}

// 通用分页返回
export type PageResult<T> = {
  list?: T[]
  total?: number
  totalPage?: number
  [property: string]: any
}

// 班级分页返回
export type PageResultClassVO = PageResult<ClassVO>
