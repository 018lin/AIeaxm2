export type StudentRow = {
  id: string
  name: string
  destroy: number
  redo: number
  wrongTotal: number
  answerTotal: number
  progress: { destroyPct: number; redoPct: number; wrongPct: number }
}
