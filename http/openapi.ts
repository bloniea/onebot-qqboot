import { httpReq as openapi } from "./fetch"
// api 接口
interface PublicApi {
  send_msg: {
    message_type: string
    user_id?: number
    group_id?: number
    message: string
    auto_escape?: boolean
  }
  send_like: {
    user_id: number
    times?: number
  }
}
interface Res<T> {
  status: string
  retcode: number
  data: T
  message: string
  wording: string
}

openapi.fetchOpts = {
  headers: {
    // Host: "127.0.0.1:3000",
    "Content-Type": "application/json"
  },
  prefix: "http://127.0.0.1:3000/"
}

const request = async <T extends keyof PublicApi>(
  event: T,
  options: PublicApi[T]
): Promise<Response> => {
  return await openapi.post(event, options)
}
interface SendMsg {
  message_id: number
}
// 发送消息
export const sendMessageApi = async (
  type: string,
  opts: PublicApi["send_msg"]
): Promise<Res<SendMsg> | null> => {
  let res = null
  if (type === "private") {
    res = await request("send_msg", {
      ...opts
    })
  } else if (type === "group") {
    res = await request("send_msg", {
      ...opts
    })
  }
  if (!res) {
    console.error("指支持群聊和私聊")
    return null
  }
  const jsonRes: Res<SendMsg> = await res.json()
  return jsonRes
}

// 点赞
export const sendLikeApi = async (user_id: number, times = 1) => {
  const res = await request("send_like", { user_id, times })
  const jsonRes: Res<null> = await res.json()
  return jsonRes
}
