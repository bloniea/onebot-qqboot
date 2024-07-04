import { IWebSocketClient, MessageData } from "../../ws/server"

export function apply(ws: IWebSocketClient) {
  ws.on("message-group", (message: MessageData) => {
    // console.log("group")
  })
}
