import { sendLikeApi } from "http/openapi"
import { IWebSocketClient, MessageData } from "ws/server"

export async function apply(ws: IWebSocketClient) {
  ws.on("message-all", (message: MessageData) => {
    let content = message.content
    if (!content.startsWith("*")) return
    content = content.slice(1)
    if (content === "赞我") {
      return sendLike(message)
    }
  })
}

const sendLike = async (message: MessageData) => {
  const res = await sendLikeApi(message.user_id, 10)
  console.log(res)
  if (res.retcode === 0) {
    return message.sendMessage("已赞", message.message_type)
  } else {
    return message.sendMessage(res.message, message.message_type)
  }
}
