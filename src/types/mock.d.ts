// 声明：mock 模块的简易类型占位，便于 TS 识别
declare module '../../config/mock/dashboard.js' {
  export const dashboardData: any;
  export default dashboardData;
}

declare module '../../config/mock/student.js' {
  export const studentData: any;
}

declare module '../../config/mock/assignment.js' {
  export const assignmentData: any;
  export default assignmentData;
}

declare module '../../config/mock/questionBank.js' {
  export const questionList: any[];
  export const questionFilterOptions: any;
}