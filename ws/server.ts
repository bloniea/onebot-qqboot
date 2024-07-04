import WebSocket from "ws"
type SendMessage = string | string[]
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
  send: (message: SendMessage) => void
}
export interface ParsedMessage {
  content: string
  cqContent: string[]
}
export interface IWebSocketClient {
  on(event: EventMessage, callback: (message: MessageData) => void): void
}
type EventMessage = "message-private" | "message-group" | "message-all"
interface Callback {
  // [key: string]: ((message: MessageData) => void) | null
  "message-private": ((message: MessageData) => void) | null
  "message-group": ((message: MessageData) => void) | null
  "message-all": ((message: MessageData) => void) | null
}
class WebSocketClient implements IWebSocketClient {
  private ws: WebSocket.Server

  private callback: Callback = {
    "message-private": null,
    "message-group": null,
    "message-all": null
  }
  constructor() {
    this.ws = this.startService()
  }
  private startService() {
    const ws = new WebSocket.Server({ port: 8080, path: "/onebot" })
    console.info("ws:localhost:8080/onebot")
    ws.on("connection", (ws) => {
      ws.on("message", (message: string) => {
        this.onMessage(message, ws)
      })
      ws.on("error", (err: Error) => {
        throw new Error(`${err.message}`)
      })
      ws.on("close", (code: number, reason: Buffer) => {
        throw new Error(
          `WebSocket closed with code ${code} and reason: ${reason.toString()}`
        )
      })
    })
    return ws
  }
  private onMessage(message: string, ws: WebSocket): void {
    let messageRes: MessageData = JSON.parse(message)
    const ParsedMessage = this.parseMessage(messageRes.raw_message)
    messageRes.content = ParsedMessage.content
    messageRes.cqContent = ParsedMessage.cqContent
    messageRes.send = (message: SendMessage) => {
      this.send(message, messageRes, ws)
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
  private onEvent(messageRes: MessageData) {
    if (messageRes.post_type === "meta_event") return
    if (messageRes.user_id === 0) return
    // 私聊

    if (messageRes.message_type === "private") {
      const cb = this.callback["message-private"]
      cb && cb(messageRes)
    }
    // 群聊
    if (messageRes.message_type === "group") {
      const cb = this.callback["message-group"]
      cb && cb(messageRes)
    }
    // 私聊和群聊
    if (
      messageRes.message_type === "private" ||
      messageRes.message_type === "group"
    ) {
      {
        const cb = this.callback["message-all"]
        cb && cb(messageRes)
      }
    }
  }
  private send(message: SendMessage, messageRes: MessageData, ws: WebSocket) {
    // console.log(messageRes)
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
  on(event: EventMessage, callback: (message: MessageData) => void) {
    this.callback[event] = callback
  }
}

export const ws = new WebSocketClient()
