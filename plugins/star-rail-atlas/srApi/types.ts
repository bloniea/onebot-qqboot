// mihoyo账号信息
export interface MHYuserInfo {
  user_info: {
    nickname: string
    uid: string
    avatar_url: string
  }
}
// star rail 游戏基本信息
export interface MhySrInfo {
  avatar_list: {
    id: string
    icon: string
    name: string
  }[]
  cur_head_icon_url: string
}

// mihoyo接口返回的数据格式
export interface MHYres<T> {
  retcode: number
  message: string
  data: T
}
// mihoyo账号绑定的游戏数据
export interface Roleslist {
  list: {
    game_biz: string
    region: string
    game_uid: string
    is_chosen: boolean
    level: number
    nickname: string
  }[]
}

// star rail 游戏uid数据
export interface UidData {
  uid: string
  active: boolean
  avatar_url: string
  username: string
  level: number
}

export interface TiLiData {
  current_train_score: number
  max_train_score: number
  current_rogue_score: number
  max_rogue_score: number
  weekly_cocoon_cnt: number
  weekly_cocoon_limit: number
  current_reserve_stamina: number
  rogue_tourn_weekly_cur: number
  rogue_tourn_weekly_max: number
  current_stamina: number
  max_stamina: number
  stamina_recover_time: number
}

export interface starRailOthername {
  role: { [key: string]: Array<string> }
  "guide for role": { [key: string]: Array<string> }
  relic: { [key: string]: Array<string> }
  enemy: { [key: string]: Array<string> }
  lightcone: { [key: string]: Array<string> }
}
export interface starRailPath {
  role: { [key: string]: string }
  "guide for role": { [key: string]: string }
  relic: { [key: string]: string }
  enemy: { [key: string]: string }
  lightcone: { [key: string]: string }
}

export interface QRCodeData {
  url: string
}
