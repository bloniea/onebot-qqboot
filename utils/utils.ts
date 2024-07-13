import template from "art-template"
import fs from "fs"
import path from "path"
import puppeteer, { LaunchOptions } from "puppeteer"

interface ObtsMap {
  text: {
    text: string
  }
  face: {
    id: number
  }
  image: {
    file: string
  }
  record: {
    file: string
  }
  video: {
    file: string
  }
  at: {
    qq: number
  }
  share: {
    url: string
    title: string
    content?: string
    image?: string
  }
  reply: {
    id: number
  }
}
export const send = <T extends keyof ObtsMap>(
  type: T,
  obts: ObtsMap[T]
): string => {
  if (type === "text" && "text" in obts) {
    return obts.text
  }
  return `[CQ:${type},${Object.entries(obts)
    .map(([k, v]) => `${k}=${k === "file" ? "file://" : ""}${v}`)
    .join(",")}]`
}

interface ImageData {
  htmlPath: string
  outputPath: string
  // width: number
  // height: number
  element: string
}
interface Value {
  [key: string]: any
}

// 获取图片
export const getImageUrl = async (
  data: ImageData,
  values: Value
): Promise<string | null> => {
  if (
    !data.htmlPath ||
    !data.outputPath ||
    // data.width === undefined ||
    // data.height === undefined ||
    !data.element
  ) {
    console.error(
      "properties (htmlPath, outputPath, width, height) must be provided."
    )
    return null
  }
  try {
    const html = template(data.htmlPath, values)
    const _fs = fs.promises
    const tempMach = data.htmlPath.match(/^(.*)\.([^\.]+)$/)
    // console.log(tempMach)
    if (!tempMach || !tempMach[2]) {
      console.error("The filename must include an extension.")
      return null
    }
    const tempFilePath = `${tempMach[1]}.temp.${tempMach[2]}`
    // console.log(tempFilePath)
    await _fs.writeFile(tempFilePath, html)

    const browser = await puppeteer.launch({ headless: "new" as any })
    const page = await browser.newPage()
    await page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 1
    })
    const tempFilePathUrl = `file://${tempFilePath}`
    await page.goto(tempFilePathUrl, {
      waitUntil: "networkidle0"
      // waitUntil: "domcontentloaded",
    })
    // 获取 div 的大小和位置
    const selector = data.element
    const clip = await page.$eval(selector, (element: Element) => {
      const { width, height, top: y, left: x } = element.getBoundingClientRect()
      return { width, height, x, y }
    })

    // 根据 div 的大小和位置截图
    const outputUrl = path.join(process.cwd(), `/output/${data.outputPath}`)
    // 检查目录是否存在，如果不存在则创建
    const outputDir = path.dirname(outputUrl)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    await page.screenshot({ path: outputUrl, clip })

    await browser.close()
    return outputUrl
  } catch (error) {
    console.error("错误:", error)
    return null
  }
}
