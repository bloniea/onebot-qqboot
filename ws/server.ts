import WebSocket from "ws"
// 消息对话对象接口
export interface MessageData {
  post_type: string
  message_type: string
  user_id: number
  message: {
    type: string
    data: any
  }[]
  raw_message: string
  content: string
  cqContent: string[]
  group_id: number
  // send: (message: SendMessage) => void
  send: <T extends keyof PublicApi>(event: T, options: PublicApi[T]) => void
  sendMessage: (message: string, type: string) => void
}
export interface ParsedMessage {
  content: string
  cqContent: string[]
}
export interface IWebSocketClient {
  on<T extends keyof Callback>(
    event: T,
    callback: (message: MessageData) => void
  ): void
}
// 监听和回调接口
interface Callback {
  // [key: string]: ((message: MessageData) => void) | null
  "message-private": ((message: MessageData) => void)[]
  "message-group": ((message: MessageData) => void)[]
  "message-all": ((message: MessageData) => void)[]
}
// 点赞接口
interface Like {
  user_id: number
  times: number //赞的次数，每个好友每天最多 10 次
}

// api 接口
interface PublicApi {
  send_msg: PrivateSendMsg | GroupSendMsg
}
//QQ 号（消息类型为 private 时需要）
//群号（消息类型为 group 时需要）
interface BaseSendMsg {
  message_type: string
  message: string
  auto_escape?: boolean
}
interface PrivateSendMsg extends BaseSendMsg {
  message_type: "private"
  user_id: number
  group_id?: never // 确保 `group_id` 不会被提供
}
interface GroupSendMsg extends BaseSendMsg {
  message_type: "group"
  group_id: number
  user_id?: never // 确保 `user_id` 不会被提供
}

class WebSocketClient implements IWebSocketClient {
  private ws: WebSocket.Server | null = null
  private port: number = 8080
  private path: string = "/onebot"
  private callback: Callback = {
    "message-private": [],
    "message-group": [],
    "message-all": []
  }
  constructor() {
    this.startService()
  }
  // 开启服务
  private startService() {
    this.ws = new WebSocket.Server({ port: this.port, path: this.path })
    console.info("ws:localhost:8080/onebot")
    this.ws.on("connection", (ws) => {
      ws.on("message", (message: string) => {
        console.log(message)
        this.onMessage(message, ws)
      })
      ws.on("error", (err: Error) => {
        throw new Error(`${err.message}`)
      })
      ws.on("close", (code: number, reason: Buffer) => {
        this.restartService()
      })
    })
  }
  // 重新启动服务
  private restartService() {
    console.info(`Restarting WebSocket server on port ${this.port}${this.path}`)
    this.closeService()
    this.startService() // 重新启动服务
  }
  // 关闭现有的 WebSocket 服务器
  private async closeService() {
    if (this.ws) {
      return new Promise<void>((resolve, reject) => {
        this.ws &&
          this.ws.close((err) => {
            if (err) {
              console.error(
                `Error while closing WebSocket server: ${err.message}`
              )
              reject(err)
            } else {
              resolve()
            }
          })
      })
    }
  }
  // 消息处理
  private onMessage(message: string, ws: WebSocket): void {
    let messageRes: MessageData = JSON.parse(message)
    const ParsedMessage = this.parseMessage(messageRes.raw_message)
    messageRes.content = ParsedMessage.content
    messageRes.cqContent = ParsedMessage.cqContent
    messageRes.sendMessage = (message: string, type: string) => {
      if (type === "private") {
        this.send(
          "send_msg",
          {
            message_type: type,
            user_id: messageRes.user_id,
            message: message
          },
          ws
        )
      }
      if (type === "group") {
        this.send(
          "send_msg",
          {
            message_type: type,
            group_id: messageRes.group_id,
            message: message
          },
          ws
        )
      }
    }

    this.onEvent(messageRes)
  }

  private parseMessage(message: string): ParsedMessage {
    const cqCodeRegex = /\[CQ:[^\]]+\]/g
    const cqContent: string[] = []
    let match: RegExpExecArray | null

    // 使用正则表达式提取所有CQ码
    while ((match = cqCodeRegex.exec(message)) !== null) {
      cqContent.push(match[0])
    }

    // 移除所有CQ码后的纯文本
    const content: string = message
      ? message.replace(cqCodeRegex, "").trim()
      : ""

    return { content, cqContent }
  }
  //事件处理
  private onEvent(messageRes: MessageData) {
    if (messageRes.post_type === "meta_event") return
    if (messageRes.user_id === 0) return
    // 私聊

    if (messageRes.message_type === "private") {
      this.callback["message-private"].forEach((cb) => cb(messageRes))

      // 私聊和群聊的通用事件
      this.callback["message-all"].forEach((cb) => cb(messageRes))
    }

    // 群聊
    if (messageRes.message_type === "group") {
      this.callback["message-group"].forEach((cb) => cb(messageRes))

      // 私聊和群聊的通用事件
      this.callback["message-all"].forEach((cb) => cb(messageRes))
    }
  }
  // 发送消息
  private send<T extends keyof PublicApi>(
    event: T,
    options: PublicApi[T],
    ws: WebSocket
  ) {
    ws.send(
      JSON.stringify({
        action: event,
        params: {
          ...options
        }
      })
    )
  }
  // qq名片点赞
  private like(message: Like, messageRes: MessageData, ws: WebSocket) {
    ws.send(
      JSON.stringify({
        action: "send_msg",
        params: {
          message_type: messageRes.message_type,
          group_id: messageRes.group_id,
          user_id: messageRes.user_id,
          message: message
        }
      })
    )
  }
  on<T extends keyof Callback>(
    event: T,
    callback: (message: MessageData) => void
  ) {
    this.callback[event].push(callback)
  }
}

export const ws = new WebSocketClient()
