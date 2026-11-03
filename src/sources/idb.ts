// 很小的 IndexedDB 包裝：存「整理到一半的進度」。
// 用 IndexedDB 而不是 localStorage，因為它能存資料夾的 handle，下次打開可以直接接續。
const DB_NAME = 'photo-select'
const STORE = 'kv'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}

export const idbGet = <T>(key: string) => run<T | undefined>('readonly', (s) => s.get(key))
export const idbSet = (key: string, value: unknown) => run('readwrite', (s) => s.put(value, key))
export const idbDelete = (key: string) => run('readwrite', (s) => s.delete(key))
