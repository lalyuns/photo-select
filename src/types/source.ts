// 照片從哪裡來、歸檔到哪裡去的「約定」。
// 畫面元件只依賴這個檔案，不直接呼叫 Chrome 的檔案 API。

/** 一張照片的基本資訊（掃描資料夾時就拿得到，不用讀整個檔案） */
export interface PhotoEntry {
  /** 這一批照片裡唯一的識別碼 */
  id: string
  /** 檔名，例如 IMG_2381.jpg */
  name: string
  /** 檔案大小（bytes） */
  size: number
  /** 最後修改時間（毫秒時間戳） */
  lastModified: number
}

/** 掃描結果：可以整理的照片 + 被跳過的檔案統計 */
export interface ScanResult {
  /** 已排序、只含 JPEG / PNG */
  photos: PhotoEntry[]
  /** 不支援的格式與張數，例如 { heic: 412, raw: 800 } */
  unsupported: Record<string, number>
}

/** 照片來源：示範相冊，或使用者選的資料夾 */
export interface PhotoSource {
  /** 顯示在左上角的名稱，例如「這週的手機照片」 */
  readonly label: string
  /** 掃描並列出可以整理的照片 */
  scan(): Promise<ScanResult>
  /** 取得某張照片的檔案內容，用來顯示或複製 */
  getFile(id: string): Promise<File>
}

/** 歸檔目的地：使用者選的儲存位置 */
export interface ArchiveTarget {
  /**
   * 把一張照片複製進某個分類資料夾；資料夾不存在就建立。
   * 同名檔不覆蓋，自動改名（IMG_2381.jpg → IMG_2381 2.jpg）。
   * 回傳實際存下的檔名；失敗時丟出錯誤。
   */
  copy(file: File, folderName: string): Promise<string>
}
