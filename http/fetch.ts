interface FetchOpts extends RequestInit {
  timeout?: number
  headers?: {
    [key: string]: string
  }
  retry?: number
  prefix?: string
}
/**
 * 对fetch的封装
 */
class Bfetch {
  private timeout: number
  private retry: number
  private controller: AbortController

  /**
   * @fetchOpts 请求参数
   *  */
  public fetchOpts: FetchOpts
  constructor() {
    // 默认请求超时时间
    this.timeout = 30000
    // 默认失败重试次数
    this.retry = 3
    // 请求参数对象
    this.fetchOpts = {}
    // 控制fetch请求api
    this.controller = new AbortController()
  }
  /**
   *
   * @param url 请求url
   * @param opts 请求参数
   * @param count 重试次数,不需要写
   * @returns 返回跟fetch一样的响应
   */
  async create(
    url: string,
    opts: FetchOpts = {},
    count: number = 0
  ): Promise<Response> {
    // 判断url参数类型是否正确
    if (typeof url !== "string" || !url.trim()) {
      throw new Error("Invalid URL")
    }
    // 判断opts参数类型是否正确
    if (typeof opts !== "object") {
      throw new Error("Invalid options")
    }
    url = this.fetchOpts.prefix ? this.fetchOpts.prefix + url : url
    // 没有传递method则为get请求
    const methods = {
      method: !opts?.method ? "GET" : opts.method
    }
    // 获取超时时间
    const timeouted = opts.timeout ? opts.timeout : this.timeout
    let timeoutId: number | null = null
    let signal: null | AbortSignal = null

    if (timeouted > 0) {
      signal = this.controller.signal
      timeoutId = setTimeout(() => {
        this.controller.abort()
      }, timeouted) as unknown as number
    }
    // 获取重试次数
    this.retry = opts.retry ? opts.retry : this.retry

    // 删除多余的属性
    const updatedOpts = opts
    delete updatedOpts.retry
    delete updatedOpts.timeout

    // 获取fetchOpts.headers,
    const fetchOptsHeaders = this.deletePropertyAndReturn(
      this.fetchOpts,
      "headers"
    )
    const obtHeaders = this.deletePropertyAndReturn(opts, "headers")
    const options = {
      headers: {
        ...fetchOptsHeaders,
        ...obtHeaders
      },
      ...this.fetchOpts,
      ...updatedOpts,
      ...methods,
      signal: signal
    }
    try {
      const res = await fetch(url, options)
      if (timeoutId !== null) clearTimeout(timeoutId)
      return res
    } catch (err: any) {
      if (err && err.name === "AbortError") {
        count++
        if (count >= this.retry) {
          throw new TimeoutError("Request timeout")
        } else {
          return await this.create(url, opts, count)
        }
      } else {
        throw err
      }
    }
  }
  /**
   * get 请求
   * @param url 请求url
   * @returns 返回跟fetch一样的响应
   */
  async get(url: string) {
    return await this.create(url)
  }
  /**
   * post 请求
   * @param url 请求url
   * @param data 请求body
   * @param opts 请求参数
   * @returns 返回跟fetch一样的响应
   */
  async post(url: string, data: { [key: string]: any }, opts?: FetchOpts) {
    return await this.create(url, {
      ...opts,
      method: "POST",
      body: JSON.stringify(data)
    })
  }
  /**
   * delete 请求
   * @param url 请求url
   * @returns 返回跟fetch一样的响应
   */
  async delete(url: string) {
    return await this.create(url, { method: "DELETE" })
  }
  /**
   * put 请求
   * @param url 请求url
   * @param data 请求body
   * @param opts 请求参数
   * @returns 返回跟fetch一样的响应
   */
  async put(url: string, data: { [key: string]: any }, opts?: FetchOpts) {
    return await this.create(url, {
      ...opts,
      method: "PUT",
      body: JSON.stringify(data)
    })
  }
  deletePropertyAndReturn = <T, K extends keyof T>(
    obj: T,
    prop: K
  ): T[K] | undefined => {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      const value = obj[prop] // 获取属性值
      delete obj[prop] // 删除属性
      return value // 返回被删除的属性值
    }
    return undefined // 如果属性不存在，返回undefined
  }
}

// 定义一个自定义的超时错误类型
class TimeoutError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = "TimeoutError"
  }
}

export const httpReq = new Bfetch()
export default Bfetch
