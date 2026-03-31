import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-sans-sc/600.css'
import '@fontsource/noto-sans-sc/700.css'
import VChart from '@visactor/vchart'
import arcoDesignLight from '@visactor/vchart-theme/public/arcoDesignLight.json'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { createApp } from 'vue'
import App from './App.vue'
import './base.css'
import './palette.css'
import router from './router'
import store from './store'
import './style.css'

// import i18n from './i18n'
// import { vPermission } from './composables/usePermission'
// import permissionPlugin from './directives/permission'
// import useMockService from './composables/useMockService'

// 配置 Day.js 以支持 Ant Design Vue 的日期组件
// import dayjs from 'dayjs'
// import 'dayjs/locale/zh-cn'
// import weekday from 'dayjs/plugin/weekday'
// import localeData from 'dayjs/plugin/localeData'

// 使用中文本地化
// dayjs.locale('zh-cn')
// // 注册必要的插件
// dayjs.extend(weekday)
// dayjs.extend(localeData)

const app = createApp(App)

// 注册全局指令通过插件，避免重复注册

app.use(router)
app.use(store)
app.use(Antd)
// app.use(i18n)
// app.use(permissionPlugin)
app.mount('#app')

// 初始化 VChart 主题为 Arco Design 风格
// 主题 JSON 的 type 字段与类型定义不完全一致，进行宽松断言以避免类型报错
VChart.ThemeManager.registerTheme('arcoDesignLight', arcoDesignLight as any)
VChart.ThemeManager.setCurrentTheme('arcoDesignLight')

// try {
//   const { initMockService } = useMockService()
//   initMockService()
// } catch (e) {
//   console.warn('[mock] 初始化失败', e)
// }
