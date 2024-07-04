import { Context, Schema, Session } from "koishi"
import { pathJson } from "./read"
import fs from "fs"
import { roleStrategy, updateAtlas } from "./atlas"
import { altasPath, giteeUrl, githubUrl } from "./config"
import path from "path"
export const name = "star-rail-atlas"

export interface Config {
  "atlas path": string
  github: string
  gitee: string
  defaultUrl: "github" | "gitee"
}

export const Config: Schema<Config> = Schema.object({
  "atlas path": Schema.path()
    .description("图鉴存储库的路径")
    .default(altasPath),
  github: Schema.string().description("github地址").default(githubUrl),
  gitee: Schema.string().description("github地址").default(giteeUrl),
  defaultUrl: Schema.union(["github", "gitee"])
    .description("默认图鉴库地址")
    .default("gitee"),
})

export function apply(ctx: Context) {
  ctx.on("message", async (session: Session) => {
    // 频道消息和频道私聊得到的id都是private:0，先过滤掉
    const channgeId = session.channelId
    const match = channgeId.match(/\d+/)
    if (match) {
      const number = parseInt(match[0], 10)
      if (number === 0) return
    }

    let content = session.content
    const config: Config = ctx.config
    if (!content.startsWith("*")) return
    content = content.slice(1)
    content = content.trim()

    if (content.startsWith("更新图鉴")) {
      return await updateAtlas(content, config, session)
    }
    // 判断图鉴是否存在
    const currentDir = __dirname
    const dirRoot = path.resolve(currentDir, "..")
    if (!fs.existsSync(`${dirRoot}/${config["atlas path"]}`)) {
      return session.send("图鉴库不存在，请先下载图鉴库并配置路径!")
    }
    // 获取攻略图鉴
    if (content.endsWith("攻略")) {
      content = content.slice(0, -2)
      return roleStrategy(content, session, config)
    }
  })
}
