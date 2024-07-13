import path, { dirname } from "path"
import fs from "fs"
import { IWebSocketClient, MessageData } from "ws/server"
import {
  getMhyCk,
  getTiLi,
  manageSrUid,
  roleStrategy,
  setMHYcookie,
  starRailAtlasData,
  updateAtlas
} from "./atlas"
import { fileURLToPath } from "url"
import { config } from "./config"
import { group } from "console"
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export async function apply(ws: IWebSocketClient) {
  ws.on("message-all", async (message: MessageData) => {
    let content = message.content
    if (!content) return
    if (!content.startsWith("*")) return
    content = content.slice(1)

    if (content.startsWith("更新图鉴")) {
      return updateAtlas(content, config, message)
    }
    // 判断图鉴是否存在
    const currentDir = __dirname
    const dirRoot = path.resolve(currentDir, ".")
    console.log(message.message_type)
    if (!fs.existsSync(`${dirRoot}/${config.altasPath}`)) {
      return message.sendMessage(
        "图鉴不存在，请先下载图鉴",
        message.message_type
      )
    }
    // 获取攻略图鉴
    if (content.endsWith("攻略")) {
      content = content.slice(0, -2)
      return roleStrategy(content, message, config)
    }
    // uid
    if (content.startsWith("uid")) {
      return manageSrUid(content, message)
    }

    // ck
    if (content.startsWith("ck")) {
      return getMhyCk(content, message)
    }

    // 体力
    if (content === "体力") {
      return getTiLi(message)
    }
    // 获取星铁图鉴
    return starRailAtlasData(content, message, config)
  })
  ws.on("message-private", async (message: MessageData) => {
    let content = message.content
    if (!content) return
    if (!content.startsWith("*")) return
    content = content.slice(1)
    if (content.startsWith("绑定ck")) {
      content = content.slice(3)
      setMHYcookie(content, message)
    }
  })
}
