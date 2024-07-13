import { ds1Salt, ds2Salt } from "./config"
import md5 from "md5"
type Ds2Salt = "4X" | "6X" | "PROD"
export const ds2 = (
  obt: {
    body?: { [key: string]: any }
    query?: string
  } = {},
  type: Ds2Salt = "4X"
) => {
  let salt: string
  switch (type) {
    case "4X":
      salt = ds2Salt["4X"]
    case "6X":
      salt = ds2Salt["6X"]
    case "PROD":
      salt = ds2Salt.PROD
    default:
      salt = ds2Salt["4X"]
  }

  // body和query一般来说不会同时存在
  // 可以使用内置的JSON.stringify函数将对象或数组转换为JSON字符串
  // const body = JSON.stringify({role: "123456789"})
  const body = obt.body ? JSON.stringify(obt.body) : ""
  // 需要对URL参数进行排序

  const query = obt.query ? obt.query.split("&").sort().join("&") : ""

  const t = Math.floor(Date.now() / 1000)
  let r = Math.floor(Math.random() * 100001 + 100000)
  if (r == 100000) {
    r = 642367
  }
  // const r = Math.floor(Math.random() * 100001 + 100001)

  const main = `salt=${salt}&t=${t}&r=${r}&b${body}=&q=${query}`
  // const main = `salt=${salt}&t=${t}&r=${r}&q=${query}&b=`
  const ds = md5(main)

  const final = `${t},${r},${ds}` // 最终结果
  return final
}

type Ds1Salt = "k2" | "lk2"
export const ds1 = (type: Ds1Salt = "k2") => {
  const salt = type === "lk2" ? ds1Salt.lk2 : ds1Salt.K2
  const lettersAndNumbers =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const t = Math.floor(Date.now() / 1000)
  let r = ""
  for (let i = 0; i < 6; i++) {
    r += lettersAndNumbers[Math.floor(Math.random() * lettersAndNumbers.length)]
  }

  const main = `salt=${salt}&t=${t}&r=${r}`
  const ds = md5(main)
  const final = `${t},${r},${ds}` // 最终结果
  return final
}

export const convertSecondsToTime = (seconds: number): string => {
  // 获取当前时间
  const currentDate: Date = new Date()

  // 将秒数转换为毫秒并添加到当前时间
  currentDate.setSeconds(currentDate.getSeconds() + seconds)

  // 获取年、月、日、小时、分钟和秒
  const year: number = currentDate.getFullYear()
  const month: number = currentDate.getMonth() + 1 // 月份从0开始，所以需要加1
  const day: number = currentDate.getDate()
  let hours: number | string = currentDate.getHours()
  let minutes: number | string = currentDate.getMinutes()

  // 格式化月、日、小时、分钟和秒为两位数
  const formattedMonth: string = month < 10 ? `0${month}` : `${month}`
  const formattedDay: string = day < 10 ? `0${day}` : `${day}`
  hours = hours < 10 ? `0${hours}` : `${hours}`
  minutes = minutes < 10 ? `0${minutes}` : `${minutes}`

  // 返回格式化的日期和时间
  return `${year}-${formattedMonth}-${formattedDay} ${hours}:${minutes}`
}
