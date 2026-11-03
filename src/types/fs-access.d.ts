// TypeScript 內建型別還沒有的 File System Access API（Chrome / Edge 才有）。

type FsPermissionMode = 'read' | 'readwrite'

interface FileSystemHandle {
  queryPermission(options?: { mode?: FsPermissionMode }): Promise<PermissionState>
  requestPermission(options?: { mode?: FsPermissionMode }): Promise<PermissionState>
}

interface DirectoryPickerOptions {
  /** 同一個 id 會記住上次打開的位置 */
  id?: string
  mode?: FsPermissionMode
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
}

interface Window {
  showDirectoryPicker?(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>
}
