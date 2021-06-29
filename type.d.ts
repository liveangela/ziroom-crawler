export enum HouseFace {
  East = 1,
  South = 2,
  West = 3,
  North = 4,
  SouthNorth = 10,
}

// 断点续传的配置
export interface SourceConfig {
  page: number; // 起始页
  path: string; // 已有数据的文件路径
}

export interface SearchConfig {
  min_lng: number;
  max_lng: number;
  min_lat: number;
  max_lat: number;
  price: number[];
  face: HouseFace[];
}

export interface TargetConfigEach {
  factor?: number; // 影响因子
  divider?: number; // 无量纲化的除数
}

// 仅是配置情况
export interface TargetConfig {
  [name: string]: TargetConfigEach;
}

// 目标值，或者当前值
export interface TargetValue {
  [name: string]: number | number[] | boolean;
}

export interface Config {
  source: SourceConfig;
  search: SearchConfig;
  targetConfig: TargetConfig;
  targetValue: TargetValue;
}

export interface ResponseStruct {
  code: number;
  data: ResponseData;
  message: string;
}

export interface ResponseData {
  pages: number;
  rooms: Room[];
  total: number;
}

export interface Room {
  desc: string; // "11.7㎡ | 2/12层"
  detail_url: string;
  id: string;
  location: {name: string}[]; // [{name: "小区距南翔站步行约917米"}]
  name: string;
  photo: string; // url
  price: number;
  price_unit: string; // "/月"
  resblock_id: string; // 小区ID
  resblock_name: string; // 小区名称
  sale_class: string; // "release" | "sign" | "turn"
  sale_status: number; // 0
  sign_date: string; // "预计2021-07-06可入住"，么有为0
  target?: TargetValue;
  score?: number;
}

export interface DealOption extends Config {
  urlWithParams: string;
  page: number;
  results: Room[];
}
