import { fileURLToPath, pathToFileURL } from "url"
import path, { dirname } from "path"
import * as glob from "glob"
import type { IWebSocketClient } from "../ws/server"
export const loadAndCallPlugin = async (
  ws: IWebSocketClient
): Promise<void> => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  let pattern: string
  if (process.env.NODE_ENV === "production") {
    pattern = path.join(__dirname, "../plugins/**/index.js")
  } else {
    pattern = path.join(__dirname, "../plugins/**/index.ts")
  }

  // 使用 glob.sync() 来同步地获取文件列表
  const files = glob.sync(pattern)

  for (const file of files) {
    try {
      // 动态导入模块
      const indexModule = await import(pathToFileURL(file).toString())
      // 确保 `index` 方法存在并是函数
      if (indexModule && typeof indexModule.apply === "function") {
        indexModule.apply(ws)
      } else {
        console.error(`Failed to load index method from ${file}`)
      }
    } catch (error) {
      console.error(`Error loading plugin from ${file}:`, error)
    }
  }
}
