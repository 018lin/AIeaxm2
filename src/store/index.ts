import { createStore } from 'vuex'

export interface RootState {
  // 可以在这里定义根状态
}

const store = createStore<RootState>({
  modules: {},
})

export default store
