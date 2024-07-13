import Redis from "ioredis"
import dotenv from "dotenv"
dotenv.config()
class RedisClient {
  private client: Redis

  constructor() {
    // this.client = new Redis({
    //   host: process.env.REDIS_HOST,
    //   port: Number(process.env.REDIS_PORT),
    //   username: "bloniea",
    //   password: "20001123ljX.",
    // })
    this.client = new Redis(
      "rediss://default:b3496e2a4cc849f19bc583c061d1f5a8@one-grizzly-41575.upstash.io:41575"
    )
  }

  async set(
    key: string,
    value: string,
    time?: number,
    expiryMode?: "EX" | "PX"
  ): Promise<string> {
    if (expiryMode !== undefined && time !== undefined) {
      if (expiryMode === "EX") {
        return this.client.set(key, value, expiryMode, time)
      } else {
        return this.client.set(key, value, expiryMode, time)
      }
    } else {
      return this.client.set(key, value)
    }
  }

  get(key: string) {
    return this.client.get(key)
  }
  async getTtl(key: string) {
    return await this.client.ttl(key)
  }
}

export default new RedisClient()
