import { promises as fs } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

import yaml from "js-yaml"
import { Config } from "./config"

const ___filename = fileURLToPath(import.meta.url)
const ___dirname = dirname(___filename)

// 异步函数读取 JSON 文件
// 读取文件内容，尝试解析为 JSON，如果解析失败，尝试解析为 YAML
/**
 *
 * @param {string} filePath 文件路径
 * @returns 文件json格式内容
 */
export const readJsonOrYamlFile = async <T>(
  filePath: string
): Promise<T | undefined> => {
  try {
    // 读取文件内容
    const fullPath = join(___dirname, filePath)

    const fileContents = await fs.readFile(fullPath, "utf8")

    // 尝试解析为 JSON
    try {
      const jsonData = JSON.parse(fileContents)
      return <T>jsonData
    } catch (jsonError) {
      // 如果解析 JSON 失败，尝试解析为 YAML
      try {
        const yamlData = yaml.load(fileContents)
        return <T>yamlData
      } catch (yamlError) {
        console.error("The file is neither valid JSON nor valid YAML.")
        // throw new Error("The file is neither valid JSON nor valid YAML.")
        // return undefined
      }
    }
  } catch (err) {
    console.error("Error reading or parsing JSON file:", err)
    // throw err
  }
}
export interface starRailPath {
  role: { [key: string]: string }
  "guide for role": { [key: string]: string }
  relic: { [key: string]: string }
  enemy: { [key: string]: string }
  lightcone: { [key: string]: string }
}

/**
 * 读取 path.json 文件
 * @returns {starRailPath}
 *
 */
export const pathJson = async (
  config: Config
): Promise<starRailPath | undefined> => {
  return await readJsonOrYamlFile<starRailPath>(
    "./" + config.altasPath + "/path.json"
  )
}
interface OthernameJson {
  [key: string]: string[]
}
// 读取 othername 文件夹下的所有文件
export const othernameData = async (
  config: Config
): Promise<{ [key: string]: string[] }> => {
  const filePaths = [
    { name: "enemy", path: `./${config.altasPath}/othername/enemy.yaml` },
    {
      name: "lightcone",
      path: `./${config.altasPath}/othername/lightcone.yaml`
    },
    { name: "relic", path: `./${config.altasPath}/othername/relic.yaml` },
    { name: "role", path: `./${config.altasPath}/othername/role.yaml` }
  ]
  try {
    const results = await Promise.all(
      filePaths.map(async (file) => readJsonOrYamlFile(file.path))
    )

    const mergedResult = Object.assign({}, ...results)
    return <OthernameJson>mergedResult
  } catch (err) {
    console.error("Error reading multiple files:", err)
    throw err
  }
}
