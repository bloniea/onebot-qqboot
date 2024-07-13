export const config = {
  altasPath: "star-rail-atlas",
  githubUrl: "https://github.com/Nwflower/star-rail-atlas.git",
  giteeUrl: "https://gitee.com/Nwflower/star-rail-atlas.git",
  defaultUrl: "https://gitee.com/Nwflower/star-rail-atlas.git"
}

export interface Config {
  altasPath: string
  githubUrl: string
  giteeUrl: string
  defaultUrl: string
}

export const ds1Salt = {
  K2: "t0qEgfub6cvueAPgR5m9aQWWVciEer7v",
  lk2: "EJncUPGnOHajenjLhBOsdpwEMZmiCmQX"
}
export const ds2Salt = {
  "4X": "xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs",
  "6X": "t0qEgfub6cvueAPgR5m9aQWWVciEer7v",
  PROD: "JwYDpKvLj6MrMqqYU6jTKF17KNO2PXoS"
}
export const mhy = {
  bbsApi: "https://bbs-api.miyoushe.com",
  api: "https://api-takumi.miyoushe.com",
  api2: "https://api-takumi-record.mihoyo.com",
  hk4eSdk: "https://hk4e-sdk.mihoyo.com"
}
export const maxRetries = 10
