/**
 * 错题组卷-获取规则
 */
// 响应体
export interface getRulesResponse {
  classId?: string // 班级ID
  createTime?: string // 创建时间
  creator?: string // 创建人
  deleted?: number // 逻辑删除：0=未删，1=已删
  errorRate?: string // 共性错题率
  id?: number // 主键ID
  numbers?: string // 最大题量
  pageNo?: number // 页码，从 1 开始
  pageSize?: number // 每页条数，最大值为 200
  period?: string // 生成周期
  tenantId?: string // 租户ID
  updater?: string // 更新人
  updateTime?: string // 更新时间
  version?: number // 版本号
}
