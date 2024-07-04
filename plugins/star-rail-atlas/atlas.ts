// import { hsrIconUrl } from "../../config"
// import { client } from "@/client/openapi"
// import { starRailPath } from "./api/types"

// import redis from "@/utils/redis"
// import {
//   clearAllspace,
//   clearAt,
//   convertSecondsToTime,
//   ds1,
//   getImageUrl,
// } from "@/utils/util"
// import { pathJson, othernameData, readJsonOrYamlFile } from "./atlas"
// import { CKdata, MessageData } from "@/types"
// import { setSaveUid } from "./privateSrMessage"
// import { UidData } from "./api/types"
// import { getQRCodeApi, getSrTiLiApi } from "./api/mhySrApi"
// import QRCode from "qrcode"
import { exec } from "child_process"
import { promisify } from "util"
import { fileURLToPath } from "url"
import path, { dirname, join } from "path"
import fs from "fs"
import { Config } from "."
import { Command, Session, h } from "koishi"
import { error } from "console"
import { othernameData, pathJson, starRailPath } from "./read"
import { stringify } from "querystring"
import { pathToFileURL } from "url"
import { resolve } from "path"
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

// // 主要监听频道关于sr游戏所有信息
// export const watchSrChannelMessage = async (data: MessageData) => {
//   let content = clearAt(data.content)
//   if (!content) return
//   console.info(data.author.username + ": " + content)
//   if (typeof content !== "string") return
//   content = clearAllspace(content)
//   if (!content.startsWith("/")) return

//   // /星穹希儿攻略
//   if (content.startsWith("/星穹") && content.endsWith("攻略")) {
//     content = content.slice(3, -2)
//     console.log(content)
//     return await starRailAtlasStrategy(content, data)
//   }

//   if (content.startsWith("/ck")) {
//     return await getMhyCk(content, data)
//   }

//   if (content.startsWith("/星穹uid")) {
//     return await manageSrUid(content, data)
//   }

//   if (content === "/星穹体力") {
//     return await getTiLi(data)
//   }

//   if (content === "/星穹跃迁记录") {
//     return await getJumpRecord(data)
//   }
//   if (content === "/星穹图鉴更新") {
//     return await updateStarRailAtlas(data)
//   }
//   if (content.startsWith("/星穹")) {
//     content = content.slice(3)
//     return await starRailAtlasData(content, data)
//   }
// }

// 获取sr攻略
const starRailAtlasStrategy = async (content: string) => {
  //   const jsonAtlas = await getAtlasData()
  //   const starRailNameId = await getStarRailName(content)
  //   if (!starRailNameId || typeof starRailNameId !== "string") {
  //     return await client.postMessage(data.channel_id, {
  //       content: "没有该角色或该角色未实装",
  //       msg_id: data.id.toString(),
  //     })
  //   }
  //   if (!jsonAtlas) return
  //   if (starRailNameId in jsonAtlas.urlJson["guide for role"]) {
  //     const imageUrl = jsonAtlas.urlJson["guide for role"][starRailNameId]
  //     // 机器人回复
  //     await client.postMessageFile(
  //       data.channel_id,
  //       join(__dirname, "./star-rail-atlas" + imageUrl),
  //       data.id.toString()
  //     )
  //   } else {
  //     return await client.postMessage(data.channel_id, {
  //       content: "没有该角色或该角色未实装",
  //       msg_id: data.id.toString(),
  //     })
  //   }
}
// 获取sr装备属性
// const starRailAtlasData = async (content: string, data: MessageData) => {
//   const jsonAtlas = await getAtlasData()
//   if (!jsonAtlas) return
//   const starRailNameId = await getStarRailName(content)
//   if (
//     !(starRailNameId || typeof starRailNameId === "string") ||
//     !(starRailNameId in jsonAtlas.objJson)
//   )
//     return

//   const imageUrl = jsonAtlas.objJson[starRailNameId]
//   // 机器人回复
//   return await client.postMessageFile(
//     data.channel_id,
//     join(__dirname, "./star-rail-atlas" + imageUrl),
//     data.id.toString()
//   )
// }
interface AtlasData {
  urlJson: starRailPath
  objJson: { [x: string]: string }
}
// 获取图片路径数据
const getAtlasData = async (config: Config): Promise<AtlasData | null> => {
  const urlJson = await pathJson(config) // 图鉴路径
  if (!urlJson) return null
  const objJson = {
    ...urlJson.role,
    ...urlJson.relic,
    ...urlJson.lightcone,
    ...urlJson.enemy,
  }
  return { urlJson, objJson }
}

// /**
//  * 根据给定数据和角色名称获取角色id。
//  * @param {string} keyword 角色名称。
//  */
// // 根据别名获取对象属性名
const getStarRailName = async (
  keyword: string,
  config: Config
): Promise<string> => {
  const othernameJson = await othernameData(config) // 别名图鉴路径
  for (const item in othernameJson) {
    const result = othernameJson[item].find((list: string) => list === keyword)
    if (result) {
      return item
    }
  }
  return ""
}
// // 管理sruid
// const manageSrUid = async (content: string, data: MessageData) => {
//   const str = "/星穹uid"
//   if (content === str) {
//     const url = path.join(
//       process.cwd(),
//       `/output/uid/uid_${data.author.id}.jpeg`
//     )
//     if (url && fs.existsSync(url)) {
//       return await client.postMessageFile(
//         data.channel_id,
//         url,
//         data.id.toString()
//       )
//     } else {
//       setSrUid(data)
//     }
//   } else {
//     content = content.slice(str.length)
//     const index = Number(content)
//     if (isNaN(index)) return
//     return await client.postMessage(data.channel_id, {
//       msg_id: data.id.toString(),
//       content: "欸嘿嘿,没有做!",
//     })
//   }
// }
// // 设置返回uid图片
// const setSrUid = async (data: MessageData) => {
//   const userId = data.author.id
//   const cks = await redis.get(`mhy_ck_${userId}`)
//   if (!cks) {
//     return await client.postMessage(data.channel_id, {
//       content: "请先绑定ck,请私聊发送 /绑定ck{cooike} ",
//       msg_id: data.id.toString(),
//     })
//   }

//   let uidsArr: CKdata[] = JSON.parse(cks)
//   let uids: string | null = ""

//   for (const itemCk of uidsArr) {
//     if (itemCk.active) {
//       const mid = itemCk.uid
//       uids = await redis.get(`sr_uid_${userId}_${mid}`)
//       if (!uids) {
//         await setSaveUid(data)
//         uids = await redis.get(`sr_uid_${userId}_${mid}`)
//         if (!uids) {
//           return await client.postMessage(data.channel_id, {
//             msg_id: data.id.toString(),
//             content: "当前账号没有绑定星穹铁道游戏",
//           })
//         }
//       }
//       const uidsArr: UidData[] = JSON.parse(uids)
//       const options = {
//         htmlPath: path.join(__dirname, "html/uid/uid.html"),
//         outputPath: `uid/uid_${userId}.jpeg`,
//         element: "#container",
//       }
//       const url = await getImageUrl(options, { uids: uidsArr })
//       if (!url) {
//         return client.postMessage(data.guild_id, {
//           msg_id: data.id.toString(),
//           content: "网络超时,重试一下吧",
//         })
//       }
//       return client.postMessageFile(data.channel_id, url, data.id.toString())
//     }
//   }
// }
// // 获取mihoyo ck
// const getMhyCk = async (content: string, data: MessageData) => {
//   if (content === "/ck") {
//     const userId = data.author.id
//     if (
//       fs.existsSync(path.join(process.cwd(), `/output/ck/ck_${userId}.jpeg`))
//     ) {
//       return await client.postMessageFile(
//         data.channel_id,
//         path.join(process.cwd(), `/output/ck/ck_${userId}.jpeg`),
//         data.id.toString()
//       )
//     }
//     const cks = await redis.get(`mhy_ck_${userId}`)
//     if (!cks) {
//       return await client.postMessage(data.channel_id, {
//         content: "请先绑定ck,请私聊发送 /绑定ck{cooike}",
//         msg_id: data.id.toString(),
//       })
//     }
//     const cksArr: CKdata[] = JSON.parse(cks)
//     const options = {
//       htmlPath: path.join(__dirname, "html/ck/ck-list.html"),
//       outputPath: `ck/ck_${userId}.jpeg`,
//       element: "#container",
//     }
//     const url = await getImageUrl(options, { cks: cksArr })
//     if (!url) return
//     return await client.postMessageFile(
//       data.channel_id,
//       url,
//       data.id.toString()
//     )
//   }
// }

// // 获取体力信息
// const getTiLi = async (data: MessageData) => {
//   console.log("3322")
//   const userId = data.author.id
//   const ck = await redis.get(`mhy_ck_${userId}`)
//   if (!ck) {
//     return await client.postMessage(data.channel_id, {
//       content: "请先绑定ck,私聊发送 /绑定ck{cooike}",
//       msg_id: data.id.toString(),
//     })
//   }
//   const ckArr = JSON.parse(ck)
//   let ckActive = ckArr.find((item: CKdata) => item.active === 1)
//   if (!ckActive) ckActive = ckArr[0]
//   if (!ckActive) return console.error("不存在ck")
//   const uidStr = await redis.get(`sr_uid_${userId}_${ckActive.uid}`)
//   if (!uidStr) return console.error("不存在uid")
//   const uidArr = JSON.parse(uidStr)
//   let uidActive = uidArr.find((item: UidData) => item.active)
//   if (!uidActive) uidActive = uidArr[0]
//   if (!uidActive) return console.error("不存在uid")
//   const tiLiRes = await getSrTiLiApi(ckActive.ck, Number(uidActive.uid))

//   if (!tiLiRes || tiLiRes.retcode !== 0) return console.error("不存在体力信息")
//   const url = path.join(__dirname, "html/tiLi/tiLi.html")
//   const options = {
//     htmlPath: url,
//     outputPath: `tiLi/tiLi_${userId}.jpeg`,
//     element: "#container",
//   }

//   const urlData = await getImageUrl(options, {
//     data: {
//       ...tiLiRes.data,
//       username: uidActive.username,
//       uid: uidActive.uid,
//       stamina_recover_time_v: convertSecondsToTime(
//         tiLiRes.data.stamina_recover_time
//       ),
//     },
//   })
//   if (!urlData) return console.error("不存在urlData")
//   return await client.postMessageFile(
//     data.channel_id,
//     urlData,
//     data.id.toString()
//   )
// }

// const getJumpRecord = async (data: MessageData) => {
//   console.log("星穹跃迁记录")

//   // try {
//   //   const resQRCode = await getQRCodeApi()
//   //   if (!resQRCode || resQRCode.retcode !== 0) {
//   //     return console.error(resQRCode?.message)
//   //   }
//   //   console.log(resQRCode.data.url)
//   //   const base64 = await QRCode.toDataURL(resQRCode.data.url)
//   //   const base64Data = base64.replace(/^data:image\/png;base64,/, "")
//   //   const binaryData = Buffer.from(base64Data, "base64")
//   //   fs.writeFile(
//   //     path.join(process.cwd(), `/output/qrcode.png`),
//   //     binaryData,
//   //     async (err) => {
//   //       if (err) {
//   //         console.error("文件保存失败:", err)
//   //       } else {
//   //         console.log("文件保存成功!")
//   //         return await client.postMessageFile(
//   //           data.channel_id,
//   //           path.join(process.cwd(), `/output/qrcode.png`),
//   //           data.id.toString()
//   //         )
//   //       }
//   //     }
//   //   )
//   // } catch (err) {
//   //   console.error(err, "二维码生成失败")
//   // }
//   // const jsonData = <JumpRecord>await readJsonOrYamlFile("./1.json")
//   // // console.log(jsonData.list)
//   // if (!jsonData) return
//   // const jumpRecordData11 = jsonData.list.filter(
//   //   (item) => Number(item.gacha_type) === 11
//   // )
//   // const jumpRecordData12 = jsonData.list.filter(
//   //   (item) => Number(item.gacha_type) === 12
//   // )
//   // const jumpRecordData1 = jsonData.list.filter(
//   //   (item) => Number(item.gacha_type) === 1
//   // )

//   // console.log(jumpRecordData11[jumpRecordData11.length - 1])
//   // await redis.set(
//   //   `sr_jump_record_${data.author.id}_113941976_11_1`,
//   //   JSON.stringify(jumpRecordData11)
//   // )
//   // await redis.set(
//   //   `sr_jump_record_${data.author.id}_113941976_12_1`,
//   //   JSON.stringify(jumpRecordData12)
//   // )
//   // await redis.set(
//   //   `sr_jump_record_${data.author.id}_113941976_1_1`,
//   //   JSON.stringify(jumpRecordData1)
//   // )

//   // const index = j1.findIndex(
//   //   (item) =>
//   //     Number(item.id) ===
//   //     Number(jumpRecordData12[jumpRecordData12.length - 1].id)
//   // )
//   // const newRecord = j1.slice(0, index)
// }

// const updateStarRailAtlas = async (data: MessageData) => {
//   const execAsync = promisify(exec)
//   const targetDir = path.join(
//     process.cwd(),
//     `/src/plugins/starRail/star-rail-atlas/`
//   ) // 将 'your-target-folder' 替换为实际的文件夹名称
//   await client.postMessage(data.channel_id, {
//     content: "正在更新,请稍后",
//     msg_id: data.id.toString(),
//   })
//   try {
//     // 进入目标文件夹并执行 git pull 命令
//     const { stdout, stderr } = await execAsync(`cd ${targetDir} && git pull`)

//     if (stderr) {
//       console.error(`stderr: ${stderr}`)
//       return await client.postMessage(data.channel_id, {
//         content: "图鉴更新失败,请重试",
//         msg_id: data.id.toString(),
//       })
//     }

//     console.log(`stdout: ${stdout}`)
//     return await client.postMessage(data.channel_id, {
//       content: "图鉴更新成功",
//       msg_id: data.id.toString(),
//     })
//   } catch (error) {
//     console.error(`执行错误: ${error}`)
//     return await client.postMessage(data.channel_id, {
//       content: "图鉴更新失败,请重试",
//       msg_id: data.id.toString(),
//     })
//   }
// }
/**
 *
 * @param {string} content
 * @param config
 * @param session
 * @returns
 */
// export const updateAtlasBasedOnContent = async (
//   content: string,
//   config: Config,
//   session: Session
// ) => {
//   const urlMap = {
//     更新图鉴: config[config.defaultUrl],
//     更新图鉴gitee: config.gitee,
//     更新图鉴github: config.github,
//   }

//   // 获取当前文件所在目录（即 subdir 的路径）
//   const currentDir = __dirname
//   // 计算 subdir 的根目录
//   const dirRoot = path.resolve(currentDir, "..")
//   const url = urlMap[content]
//   const pathUrl = `${dirRoot}/${config["atlas path"]}`
//   if (url) {
//     return await updateAtlas(pathUrl, url, dirRoot, content, session)
//   }
// }

/**
 *
 * @param {string} content 消息内容
 * @param {Config} config 配置数据
 * @param {Session} session 会话对象
 * @returns 返回发送消息
 */
export const updateAtlas = async (
  content: string,
  config: Config,
  session: Session
) => {
  const currentDir = __dirname
  const dirRoot = path.resolve(currentDir, "..")
  const pathUrl = `${dirRoot}/${config["atlas path"]}`
  const urlMap = {
    更新图鉴: config[config.defaultUrl],
    更新图鉴gitee: config.gitee,
    更新图鉴github: config.github,
  }
  // 仓库地址
  const url = urlMap[content]
  if (!url) return

  try {
    session.send("正在更新图鉴。。。")
    // 检查目录是否存在
    console.log(pathUrl)
    if (!fs.existsSync(pathUrl)) {
      // 如果目录不存在，克隆仓库
      exec(`cd ${dirRoot} && git clone ${url}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`执行git clone时出错: ${error.message}`)
          return session.send(`更新失败:${error.message}`)
        }
        console.log(`stdout: ${stdout}`)
        return session.send("更新成功")
      })
    } else {
      let gitAdd = ""
      if (content === "更新图鉴") {
        gitAdd = `git remote add origin ${url}`
      } else if (content === "更新图鉴gitee") {
        gitAdd = `git remote add origin-gitee ${config.gitee}`
      } else if (content === "更新图鉴github") {
        gitAdd = `git remote add origin-github ${config.github}`
      }
      exec(`cd ${pathUrl} && ${gitAdd}`, (error, stdout, stderr) => {
        if (error && error.message.includes("already exists")) {
          return exec(`cd ${pathUrl} && git pull`, (error, stdout, stderr) => {
            if (error) {
              console.error(`执行git pull时出错: ${error.message}`)
              return session.send(`更新失败:${error.message}`)
            }
            return session.send("更新成功")
          })
        }
        exec(`cd ${pathUrl} && git pull`, (error, stdout, stderr) => {
          if (error) {
            console.error(`执行git pull时出错: ${error.message}`)
            return session.send(`更新失败:${error.message}`)
          }
          return session.send("更新成功")
        })
      })
    }
  } catch (error) {
    console.error(error, "catch")
    return session.send(`更新失败:${error}`)
  }
}
/**
 *
 * @param {string} content 消息
 * @param {Session} session 会话对象
 * @param {Config} config 配置数据
 * @returns 返回发送的消息
 */
export const roleStrategy = async (
  content: string,
  session: Session,
  config: Config
) => {
  const jsonAtlas = await getAtlasData(config)
  if (!jsonAtlas) return
  const starRailNameId = await getStarRailName(content, config)
  console.log(starRailNameId)
  if (!starRailNameId || typeof starRailNameId !== "string") {
    return session.send("没有该角色或该角色未实装")
  }

  if (starRailNameId in jsonAtlas.urlJson["guide for role"]) {
    const imageUrl = `../${config["atlas path"]}/${jsonAtlas.urlJson["guide for role"][starRailNameId]}`
    const messageContent = h.image(
      pathToFileURL(resolve(__dirname, imageUrl)).href
    )
    session.send(messageContent)
    // console.log(session)
  } else {
    return session.send("没有该角色或该角色未实装")
  }
}
