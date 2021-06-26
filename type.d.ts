export enum HouseFace {
  East = 1,
  South = 2,
  West = 3,
  North = 4,
  SouthNorth = 10,
}

export interface Config {
  url: string;
  min_lng: number;
  max_lng: number;
  min_lat: number;
  max_lat: number;
  price: number[];
  face: HouseFace[];
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
  sale_class: string; // "release"
  sale_status: number; // 0
}
