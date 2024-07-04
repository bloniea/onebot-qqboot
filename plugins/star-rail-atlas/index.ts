import path, { dirname } from "path"
import fs from "fs"
import { IWebSocketClient, MessageData } from "../../ws/server"
import { roleStrategy, updateAtlas } from "./atlas"
import { fileURLToPath } from "url"
import { config } from "./config"
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export function apply(ws: IWebSocketClient) {
  ws.on("message-all", async (message: MessageData) => {
    let content = message.content
    if (!content) return
    if (!content.startsWith("*")) return
    content = content.slice(1)

    if (content.startsWith("更新图鉴")) {
      // return await updateAtlas(content, config, session)
    }
    // 判断图鉴是否存在
    const currentDir = __dirname
    const dirRoot = path.resolve(currentDir, ".")
    console.log(dirRoot)
    if (!fs.existsSync(`${dirRoot}/${config.altasPath}`)) {
      return message.send("图鉴库不存在，请先下载图鉴库并配置路径!")
    }
    // 获取攻略图鉴
    if (content.endsWith("攻略")) {
      // content = content.slice(0, -2)
      // return roleStrategy(content, session, config)
    }
  })
}
