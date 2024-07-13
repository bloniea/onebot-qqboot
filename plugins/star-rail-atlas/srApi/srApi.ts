import fetch, { RequestInfo, Response, RequestInit } from "node-fetch-retry"
import { ds1, ds2 } from "../utils.js"
import { maxRetries, mhy } from "../config.js"

import {
  MhySrInfo,
  MHYres,
  MHYuserInfo,
  Roleslist,
  TiLiData,
  QRCodeData
} from "./types.js"
import { config } from "dotenv"
interface ExtendedRequestInit extends RequestInit {
  retry?: number
  pause?: number
}
type Method = "GET" | "POST"
export const fetchApi = async <T>(
  url: string,
  method: Method = "GET",
  options?: RequestInit
): Promise<MHYres<T> | null> => {
  try {
    let headers = {}
    if (options && options.headers) {
      headers = options.headers
      delete options.headers
    }
    const defaultHeaders = {
      "x-rpc-client_type": "2",
      "x-rpc-app_version": "2.71.1",
      "x-rpc-sys_version": "9",
      "x-rpc-channel": "sr",
      "x-rpc-device_id": "6ff5190c-85a4-3d2d-80e9-365f23cf1da6",
      "x-rpc-device_fp": "38d7fb149f617",
      "x-rpc-h265_supported": "1",
      "x-rpc-verify_key": "bll8iq97cem8",
      "accept-encoding": "gzip",
      "user-agent": "okhttp/4.9.3",
      referer: "https://app.mihoyo.com"
    }
    const mergedHeaders = {
      ...defaultHeaders,
      ...headers
    }

    const opt: ExtendedRequestInit = {
      retry: maxRetries,
      pause: 500,
      headers: mergedHeaders,
      ...options,
      method: method
    }
    const res = await fetch(url, opt)
    if (!res.ok) {
      throw new Error(`HTTP error! status2: ${res.status}`)
    }
    return <MHYres<T>>await res.json()
  } catch (e) {
    console.error(e)
    return null
  }
}
// 根据uid获取mihoyo个人信息
export const getMHYuserInfoApi = async (
  uid: string | number,
  cookie: string
): Promise<MHYres<MHYuserInfo> | null> => {
  const ds = ds1()
  const res: MHYres<MHYuserInfo> | null = await fetchApi(
    `${mhy.bbsApi}/user/api/getUserFullInfo?uid=${uid}`,
    "GET",
    {
      headers: {
        ds: ds,
        cookie: cookie
      }
    }
  )
  return res
}

// 获取star rail 游戏首页基本信息
export const getSRinfoApi = async (
  uid: string | number,
  cookie: string
): Promise<MHYres<MhySrInfo> | null> => {
  const params = `server=prod_gf_cn&role_id=${uid}`
  const ds = ds2({ query: params })
  const url = `${mhy.api}/game_record/app/hkrpg/api/index?${params}`
  console.log(url)
  const res: MHYres<MhySrInfo> | null = await fetchApi(url, "GET", {
    headers: {
      ds: ds,
      cookie: cookie,
      "x-rpc-client_type": "5",
      host: "api-takumi-record.mihoyo.com"
    }
  })
  return <MHYres<MhySrInfo>>res
}
// 获取米游社账号绑定的游戏uid信息
export const getMhyRolesApi = async (
  ck: string
): Promise<MHYres<Roleslist> | null> => {
  const ds = ds2()
  const url = `${mhy.api}/binding/api/getUserGameRolesByCookie`
  const res: MHYres<Roleslist> | null = await fetchApi(
    url,

    "GET",
    {
      headers: {
        ds: ds,
        cookie: ck,
        "x-rpc-client_type": "5"
      }
    }
  )
  return <MHYres<Roleslist>>res
}

export const getSrTiLiApi = async (
  ck: string,
  uid: number
): Promise<MHYres<TiLiData> | null> => {
  const param = `server=prod_gf_cn&role_id=${uid}`
  const url = `${mhy.api2}/game_record/app/hkrpg/api/note?${param}`
  const ds = ds2({
    query: param
  })
  const res: MHYres<TiLiData> | null = await fetchApi(url, "GET", {
    headers: {
      ds: ds,
      cookie: ck,
      "x-rpc-client_type": "5"
    }
  })
  return <MHYres<TiLiData>>res
}

export const getQRCodeApi = async (): Promise<MHYres<QRCodeData> | null> => {
  const url = mhy.hk4eSdk + "/hk4e_cn/combo/panda/qrcode/fetch"
  const res: MHYres<QRCodeData> | null = await fetchApi(url, "POST", {
    body: JSON.stringify({
      app_id: "8",
      device: "6ff5190c-85a4-3d2d-80e9-365f23cf1da6"
    })
  })
  return res
}
