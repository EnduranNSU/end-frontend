import { defineStore } from 'pinia'

export type Training = {
  id: string
  name: string
  createdAt: number
}

export type Folder = {
  id: string
  name: string
  createdAt: number
  trainings?: Training[]
}

// Helper types to safely coerce unknown JSON from storage
type UnknownTraining = {
  id?: unknown
  name?: unknown
  createdAt?: unknown
}

type UnknownFolder = {
  id?: unknown
  name?: unknown
  createdAt?: unknown
  trainings?: unknown
}

const STORAGE_KEY = 'enduran:folders'

function genIdFallback() {
  return (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeId(v: unknown): string {
  switch (typeof v) {
    case 'string':
      return v
    case 'number':
    case 'boolean':
      return String(v)
    case 'bigint':
      return (v).toString()
    case 'object': {
      if (v instanceof Date) return String(v.getTime())
      // For any other object/array/undefined/null → generate a safe id
      return genIdFallback()
    }
    case 'undefined':
    case 'function':
    case 'symbol':
    default:
      return genIdFallback()
  }
}

function normalizeText(v: unknown, fallback: string): string {
  switch (typeof v) {
    case 'string':
      return v
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(v)
    case 'object':
    case 'undefined':
    case 'function':
    case 'symbol':
    default:
      return fallback
  }
}

function toTraining(t: UnknownTraining): Training {
  return {
    id: normalizeId(t.id),
    name: normalizeText(t.name, 'Тренировка'),
    createdAt: Number(t.createdAt ?? Date.now()),
  }
}

function ensureShape(arr: UnknownFolder[]): Folder[] {
  return arr.map((f) => ({
    id: normalizeId(f.id),
    name: normalizeText(f.name, 'Новая папка'),
    createdAt: Number(f.createdAt ?? Date.now()),
    trainings: Array.isArray(f.trainings)
      ? (f.trainings as UnknownTraining[]).map(toTraining)
      : [],
  }))
}

function load(): Folder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as unknown
    if (Array.isArray(data)) return ensureShape(data as UnknownFolder[])
    return []
  } catch (e) {
    console.warn('Failed to load folders from storage', e)
    return []
  }
}

function save(folders: Folder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders))
  } catch (e) {
    console.warn('Failed to save folders to storage', e)
  }
}

export const useFoldersStore = defineStore('folders', {
  state: () => ({
    folders: load(),
  }),
  getters: {
    count: (state) => state.folders.length,
  },
  actions: {
    refreshFromStorage() {
      this.folders = load()
    },
    addFolder(name?: string) {
      const idx = this.folders.length + 1
      const folder: Folder = {
        id: genIdFallback(),
        name: name || `Папка ${idx}`,
        createdAt: Date.now(),
        trainings: [],
      }
      this.folders.push(folder)
      save(this.folders)
      return folder
    },
    removeFolder(id: string) {
      this.folders = this.folders.filter((f) => f.id !== id)
      save(this.folders)
    },
    renameFolder(id: string, name: string) {
      const f = this.folders.find((x) => x.id === id)
      if (f) {
        f.name = name
        save(this.folders)
      }
    },
    addTraining(folderId: string, name?: string) {
      const f = this.folders.find((x) => x.id === folderId)
      if (!f) return
      if (!Array.isArray(f.trainings)) f.trainings = []
      const idx = f.trainings.length + 1
      const t: Training = {
        id: genIdFallback(),
        name: name || `Моя тренировка ${idx}`,
        createdAt: Date.now(),
      }
      f.trainings.push(t)
      save(this.folders)
      return t
    },
    removeTraining(folderId: string, trainingId: string) {
      const f = this.folders.find((x) => x.id === folderId)
      if (!f || !Array.isArray(f.trainings)) return
      f.trainings = f.trainings.filter((t) => t.id !== trainingId)
      save(this.folders)
    },
    clearAll() {
      this.folders = []
      save(this.folders)
    },
  },
})
