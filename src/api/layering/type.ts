/**
 * 策略分页列表
 */
// 请求体
export interface StrategyListRequest {
  classId: string // 班级ID
  gradeId: string // 年级ID
  pageNo: number // 页码，从 1 开始
  pageSize: number // 每页条数，最大值为 200
  type: string //  手动分配manual \ 自动分配auto
}
// 返回体
export interface StrategyListResponse {
  list?: StrategyListItem[] // 分层策略配置列表
  total?: number // 数据总量
  totalPage?: number // 总页数
}
// 分层策略配置项
export interface StrategyListItem {
  classId?: string // 班级ID
  createTime?: string // 创建时间
  creator?: string // 创建人
  deleted?: number // 逻辑删除：0=未删，1=已删
  effectiveEnd?: string // 策略失效日期
  effectiveStart?: string // 策略生效日期
  gradeId?: string // 年级ID
  id?: number // 主键ID
  isActive?: number // 是否启用：0=否，1=是
  strategyId?: string // 策略ID
  strategyName?: string // 策略名称
  studentGroupVOS?: GroupItem[] // 分层对象列表
  subjectId?: string // 学科ID
  tenantId?: string // 租户ID
  type?: string // 手动分配manual \ 自动分配auto
  updater?: string // 更新人
  updateTime?: string // 更新时间
  version?: number // 版本号
}
// 分层
export interface GroupItem {
  createTime?: string // 创建时间
  creator?: string // 创建人
  deleted?: number // 逻辑删除：0=未删，1=已删
  description?: string // 分组描述
  groupId?: string // 分组唯一ID
  groupName?: string // 分组名称
  id?: number // 主键ID
  maxRate?: number // 正确率闭口
  minRate?: number // 正确率开口
  mistakeRate?: number // 共性错题率
  strategyId?: string // 分组策略配置ID
  tenantId?: string // 租户ID
  updater?: string // 更新人
  updateTime?: string // 更新时间
  version?: number // 版本号
  studentDetailList?: any[] // 学生列表
  groupCode?: string // 分层编码：基础层base \ 提高层improve \ 拓展层expand
}
