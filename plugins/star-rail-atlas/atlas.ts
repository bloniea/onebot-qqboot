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
import { fileURLToPath } from "url"
import path, { dirname, join } from "path"
import fs from "fs"
import { Config } from "./config"
import { othernameData, pathJson, starRailPath } from "./read.js"
import { MessageData } from "../../ws/server.js"
import { getImageUrl, send } from "../../utils/utils.js"
import redis from "../../utils/redis.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import {
  getMHYuserInfoApi,
  getMhyRolesApi,
  getSRinfoApi,
  getSrTiLiApi
} from "./srApi/srApi.js"
import { UidData } from "./srApi/types"
import { convertSecondsToTime } from "./utils"
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

// 图鉴数据接口
interface AtlasData {
  urlJson: starRailPath
  objJson: { [x: string]: string }
}
/**
 * // 获取图片路径数据
 * @param {Config} config 配置信息
 * @returns {Promise<AtlasData | null>} 返回图鉴数据
 */
const getAtlasData = async (config: Config): Promise<AtlasData | null> => {
  const urlJson = await pathJson(config) // 图鉴路径
  if (!urlJson) return null
  const objJson = {
    ...urlJson.role,
    ...urlJson.relic,
    ...urlJson.lightcone,
    ...urlJson.enemy
  }
  return { urlJson, objJson }
}

/**
 * 根据给定数据和角色名称获取角色id。
 * @param {string} keyword 角色名称。
 * @param {Config} config 配置对象。
 * @returns {Promise<string>} 返回角色id。
 */
// 根据别名获取对象属性名
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
export const manageSrUid = async (content: string, message: MessageData) => {
  const str = "uid"
  if (content === str) {
    const url = path.join(
      process.cwd(),
      `/output/uid/uid_${message.user_id}.jpeg`
    )
    if (url && fs.existsSync(url)) {
      return message.sendMessage(
        send("image", { file: url }),
        message.message_type
      )
    } else {
      setSrUid(message)
    }
  } else {
    content = content.slice(str.length)
    const index = Number(content)
    if (isNaN(index)) return
    return message.sendMessage("暂时不支持", message.message_type)
  }
}
// // 设置返回uid图片
const setSrUid = async (message: MessageData) => {
  const userId = message.user_id
  const cks = await redis.get(`mhy_ck_${userId}`)
  if (!cks) {
    return message.sendMessage(
      "请先绑定ck,请私聊发送 *绑定ck{cooike} ",
      message.message_type
    )
  }

  let uidsArr: CKdata[] = JSON.parse(cks)
  let uids: string | null = ""

  for (const itemCk of uidsArr) {
    if (itemCk.active) {
      const mid = itemCk.uid
      uids = await redis.get(`sr_uid_${userId}_${mid}`)
      if (!uids) {
        await setSaveUid(message)
        uids = await redis.get(`sr_uid_${userId}_${mid}`)
        if (!uids) {
          return message.sendMessage(
            "当前账号没有绑定星穹铁道游戏",
            message.message_type
          )
        }
      }
      const uidsArr: UidData[] = JSON.parse(uids)
      const options = {
        htmlPath: path.join(__dirname, "html/uid/uid.html"),
        outputPath: `uid/uid_${userId}.jpeg`,
        element: "#container"
      }
      const url = await getImageUrl(options, { uids: uidsArr })
      if (!url) {
        return message.sendMessage("网络超时,重试一下吧", message.message_type)
      }
      return message.sendMessage(
        send("image", { file: url }),
        message.message_type
      )
    }
  }
}
// // 获取mihoyo ck
export const getMhyCk = async (content: string, message: MessageData) => {
  if (content === "ck") {
    const userId = message.user_id
    if (
      fs.existsSync(path.join(process.cwd(), `/output/ck/ck_${userId}.jpeg`))
    ) {
      const url = path.join(process.cwd(), `/output/ck/ck_${userId}.jpeg`)
      return message.sendMessage(
        send("image", { file: url }),
        message.message_type
      )
    }
    const cks = await redis.get(`mhy_ck_${userId}`)
    if (!cks) {
      return message.sendMessage(
        "请先绑定ck,请私聊发送 /绑定ck{cooike}",
        message.message_type
      )
    }
    const cksArr: CKdata[] = JSON.parse(cks)
    const options = {
      htmlPath: path.join(__dirname, "html/ck/ck-list.html"),
      outputPath: `ck/ck_${userId}.jpeg`,
      element: "#container"
    }
    const url = await getImageUrl(options, { cks: cksArr })
    if (!url) return
    return message.sendMessage(
      send("image", { file: url }),
      message.message_type
    )
  } else {
    let contentVal = content.slice(3)
    if (!contentVal) return
    let contentNum = Number(contentVal)
    if (isNaN(contentNum)) return
    // 待写
  }
}

// // 获取体力信息
export const getTiLi = async (message: MessageData) => {
  const userId = message.user_id
  const ck = await redis.get(`mhy_ck_${userId}`)
  if (!ck) {
    return message.sendMessage(
      "请先绑定ck,私聊发送 *绑定ck{cooike}",
      message.message_type
    )
  }
  const ckArr = JSON.parse(ck)
  let ckActive = ckArr.find((item: CKdata) => item.active === 1)
  if (!ckActive) ckActive = ckArr[0]
  if (!ckActive) return console.error("不存在ck")
  const uidStr = await redis.get(`sr_uid_${userId}_${ckActive.uid}`)
  if (!uidStr) return console.error("不存在uid")
  const uidArr = JSON.parse(uidStr)
  let uidActive = uidArr.find((item: UidData) => item.active)
  if (!uidActive) uidActive = uidArr[0]
  if (!uidActive) return console.error("不存在uid")
  const tiLiRes = await getSrTiLiApi(ckActive.ck, Number(uidActive.uid))

  if (!tiLiRes || tiLiRes.retcode !== 0) return console.error("不存在体力信息")
  const url = path.join(__dirname, "html/tiLi/tiLi.html")
  const options = {
    htmlPath: url,
    outputPath: `tiLi/tiLi_${userId}.jpeg`,
    element: "#container"
  }

  const urlData = await getImageUrl(options, {
    data: {
      ...tiLiRes.data,
      username: uidActive.username,
      uid: uidActive.uid,
      stamina_recover_time_v: convertSecondsToTime(
        tiLiRes.data.stamina_recover_time
      )
    }
  })
  if (!urlData) return console.error("不存在urlData")
  return message.sendMessage(
    send("image", { file: urlData }),
    message.message_type
  )
}

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

/**
 * 更新图鉴
 * @param {string} content 消息内容
 * @param {Config} config 配置数据
 * @param {MessageData} message 会话对象
 * @returns {void} 返回发送消息
 */
export const updateAtlas = (
  content: string,
  config: Config,
  message: MessageData
): void => {
  const currentDir = __dirname
  const dirRoot = path.resolve(currentDir, ".")
  const pathUrl = `${dirRoot}/${config.altasPath}`
  const urlMap: { [key: string]: string } = {
    更新图鉴: config.defaultUrl,
    更新图鉴gitee: config.giteeUrl,
    更新图鉴github: config.githubUrl
  }
  // 仓库地址
  const url = urlMap[content]
  if (!url) return

  try {
    message.sendMessage("正在更新图鉴。。。", message.message_type)
    // 检查目录是否存在

    if (!fs.existsSync(pathUrl)) {
      // 如果目录不存在，克隆仓库
      exec(`cd ${dirRoot} && git clone ${url}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`执行git clone时出错: ${error.message}`)
          return message.sendMessage(
            `更新失败:${error.message}`,
            message.message_type
          )
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`)
        }
        console.log(`stdout: ${stdout}`)
        return message.sendMessage("更新成功", message.message_type)
      })
    } else {
      let gitAdd = ""
      if (content === "更新图鉴") {
        gitAdd = `git remote add origin ${url}`
      } else if (content === "更新图鉴gitee") {
        gitAdd = `git remote add origin-gitee ${config.giteeUrl}`
      } else if (content === "更新图鉴github") {
        gitAdd = `git remote add origin-github ${config.githubUrl}`
      }
      exec(`cd ${pathUrl} && ${gitAdd}`, (error, stdout, stderr) => {
        if (stderr) {
          console.error(`stderr: ${stderr}`)
        }
        if (error && error.message.includes("already exists")) {
          return exec(`cd ${pathUrl} && git pull`, (error, stdout, stderr) => {
            if (error) {
              console.error(`执行git pull时出错: ${error.message}`)
              return message.sendMessage(
                `更新失败:${error.message}`,
                message.message_type
              )
            }
            if (stderr) {
              console.error(`stderr: ${stderr}`)
            }
            return message.sendMessage("更新成功", message.message_type)
          })
        }
        exec(`cd ${pathUrl} && git pull`, (error, stdout, stderr) => {
          if (error) {
            console.error(`执行git pull时出错: ${error.message}`)
            return message.sendMessage(
              `更新失败:${error.message}`,
              message.message_type
            )
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`)
          }
          return message.sendMessage("更新成功", message.message_type)
        })
      })
    }
  } catch (error) {
    console.error(error, "catch")
    return message.sendMessage(`更新失败:${error}`, message.message_type)
  }
}
/**
 * 角色攻略
 * @param {string} content 消息
 * @param {MessageData} message 会话对象
 * @param {Config} config 配置数据
 * @returns {Promise(void)} 返回发送的消息
 */
export const roleStrategy = async (
  content: string,
  message: MessageData,
  config: Config
): Promise<void> => {
  const jsonAtlas = await getAtlasData(config)
  if (!jsonAtlas) return
  const starRailNameId = await getStarRailName(content, config)
  if (!starRailNameId || typeof starRailNameId !== "string") {
    return message.sendMessage("没有该角色或该角色未实装", message.message_type)
  }

  if (starRailNameId in jsonAtlas.urlJson["guide for role"]) {
    const imageUrl = path.join(
      __dirname,
      `./${config.altasPath}/${jsonAtlas.urlJson["guide for role"][starRailNameId]}`
    )

    return message.sendMessage(
      `${send("image", { file: `${imageUrl}` })}`,
      message.message_type
    )
  } else {
    return message.sendMessage("没有该角色或该角色未实装", message.message_type)
  }
}

/**
 *
 * @param {string} content 消息
 * @param {MessageData} message 会话对象
 * @param {Config} config 配置数据
 * @returns {Promise(void)} 返回发送的消息
 */
export const starRailAtlasData = async (
  content: string,
  message: MessageData,
  config: Config
): Promise<void> => {
  const jsonAtlas = await getAtlasData(config)
  if (!jsonAtlas) return
  const starRailNameId = await getStarRailName(content, config)
  if (
    !(starRailNameId || typeof starRailNameId === "string") ||
    !(starRailNameId in jsonAtlas.objJson)
  )
    return

  const imageUrl = path.join(
    __dirname,
    config.altasPath + "/" + jsonAtlas.objJson[starRailNameId]
  )
  // 机器人回复
  return message.sendMessage(
    `${send("image", { file: `${imageUrl}` })}`,
    message.message_type
  )
}

export interface CKdata {
  active: number
  avatar_url: string
  username: string
  uid: string
  ck: string
}

/**
 * // 保存cookie
 * @param content 消息
 * @param message 会话对象
 * @returns {Promise<void>}
 */
export const setMHYcookie = async (
  content: string,
  message: MessageData
): Promise<void> => {
  const cookie = content
  const accountId = cookie.match(/account_id=([^;]+)/)
  const ltuid = cookie.match(/ltuid=([^;]+)/)
  const ltuidV2 = cookie.match(/ltuid_v2=([^;]+)/)
  const accountIdV2 = cookie.match(/account_id_v2=([^;]+)/)

  let uid: string = ""
  if (accountId) {
    uid = accountId[1]
  } else if (ltuid) {
    uid = ltuid[1]
  } else if (ltuidV2) {
    uid = ltuidV2[1]
  } else if (accountIdV2) {
    uid = accountIdV2[1]
  }
  if (!uid) {
    return message.sendMessage("cooike 格式不正确!", message.message_type)
  }
  const issets = await redis.get(`mhy_ck_${message.user_id}`)
  let cks: CKdata[] = []
  const params = {
    htmlPath: path.join(__dirname, "html/ck/ck-list.html"),
    outputPath: `ck/${uid}.jpeg`,
    element: "#container"
  }
  if (issets) {
    cks = JSON.parse(issets)
    const uidIsset = cks.findIndex((item) => item.uid === uid)
    if (uidIsset > -1) {
      cks[uidIsset].ck = cookie
      const url = await getImageUrl(params, { cks: cks })
      if (!url) return

      await redis.set(`mhy_ck_${message.user_id}`, JSON.stringify(cks))
      await setSaveUid(message)

      return message.sendMessage(
        send("image", { file: url }),
        message.message_type
      )
    }
  }

  const res = await getMHYuserInfoApi(uid, cookie)
  if (!res) {
    return message.sendMessage("网络超时,重试一下吧", message.message_type)
  }

  const ckData = {
    active: 1,
    avatar_url: res.data.user_info.avatar_url,
    uid: uid,
    username: res.data.user_info.nickname,
    ck: cookie
  }
  cks.push(ckData)
  const url = await getImageUrl(params, { cks: cks })
  if (!url) return

  await redis.set(`mhy_ck_${message.user_id}`, JSON.stringify(cks))
  await setSaveUid(message)
  return message.sendMessage(send("image", { file: url }), message.message_type)
}

/**
 *
 * @param {MessageData}message 会话对象
 * @returns {Promise<void>}
 */
export const setSaveUid = async (message: MessageData): Promise<void> => {
  const userId = message.user_id
  const ckRes = await redis.get(`mhy_ck_${userId}`)
  let ck: CKdata[]
  if (!ckRes) {
    return message.sendMessage(
      "cooike 不存在,请私聊发送 *绑定ck{cooike} ",
      message.message_type
    )
  }
  ck = JSON.parse(ckRes)
  for (const item of ck) {
    const srInfo = await getMhyRolesApi(item.ck)
    if (!srInfo) {
      return message.sendMessage("网络超时,重试一下吧", message.message_type)
    }
    const srUids: UidData[] = []
    for (const list of srInfo.data.list) {
      if (list.game_biz === "hkrpg_cn") {
        const srRes = await getSRinfoApi(list.game_uid, item.ck)
        if (!srRes) {
          return message.sendMessage(
            "网络超时,重试一下吧",
            message.message_type
          )
        }
        const obj = {
          uid: list.game_uid,
          active: list.is_chosen,
          avatar_url: srRes.data.cur_head_icon_url,
          username: list.nickname,
          level: list.level
        }
        srUids.push(obj)
      }
    }
    await redis.set(`sr_uid_${userId}_${item.uid}`, JSON.stringify(srUids))
  }
}
