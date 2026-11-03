// 跟 Chrome 檔案存取 API 打交道的小工具：偵測支援、選資料夾、權限。

/** 這個瀏覽器能不能讀寫資料夾（Chrome / Edge 可以；Safari、Firefox、預設的 Brave 不行） */
export function supportsFolderAccess(): boolean {
  return typeof window.showDirectoryPicker === 'function'
}

/**
 * 跳出 Chrome 的資料夾選擇視窗。使用者按取消會回傳 null，不算錯誤。
 * 只能在使用者點擊按鈕的當下呼叫，否則 Chrome 會拒絕。
 */
export async function pickDirectory(
  purpose: 'source' | 'archive',
): Promise<FileSystemDirectoryHandle | null> {
  if (!window.showDirectoryPicker) throw new Error('這個瀏覽器不支援選擇資料夾，請改用 Chrome。')
  try {
    return await window.showDirectoryPicker(
      purpose === 'source'
        ? { id: 'photo-source', mode: 'read', startIn: 'pictures' }
        : { id: 'photo-archive', mode: 'readwrite', startIn: 'pictures' },
    )
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null
    throw e
  }
}

/** 確認還有權限；沒有就請使用者授權（同樣要在點擊當下呼叫） */
export async function ensurePermission(
  handle: FileSystemHandle,
  mode: FsPermissionMode,
): Promise<boolean> {
  if ((await handle.queryPermission({ mode })) === 'granted') return true
  return (await handle.requestPermission({ mode })) === 'granted'
}

/** 歸檔位置是不是在照片資料夾裡面（或就是同一個）：下次掃描會把複本也讀進來，要警告 */
export async function isSameOrInside(
  source: FileSystemDirectoryHandle,
  target: FileSystemDirectoryHandle,
): Promise<boolean> {
  if (await source.isSameEntry(target)) return true
  return (await source.resolve(target)) !== null
}
