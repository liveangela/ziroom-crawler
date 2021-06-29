import { Config, Room, TargetValue, SearchConfig, DealOption, ResponseStruct, ResponseData } from './type.d.ts';

export function randInt(a: number, b: number): number {
  const c = b - a + 1;
  const num = Math.random() * c + a;
  return Math.floor(num);
}

export function getUrlWithParams(config: SearchConfig): string {
  const url = 'https://sh.ziroom.com/map/room/list';
  const { min_lat, max_lat, min_lng, max_lng } = config;
  const clat = parseFloat(((min_lat + max_lat) / 2).toFixed(5));
  const clng = parseFloat(((min_lng + max_lng) / 2).toFixed(5));
  const obj = Object.assign({}, config, { clat, clng });
  const paramStr = Object.entries(obj).map(e => `${e[0]}=${e[1]}`).join('&');
  return url + '?' + paramStr;
}

export async function query(urlWithParams: string, p: number): Promise<ResponseData | null> {
  const res: Response = await fetch(urlWithParams + '&p=' + p);
  const resStruct: ResponseStruct = await res.json();
  const { code, data, message } = resStruct;
  if (code !== 200) {
    console.error(message);
    return null; // 外部检测到后进行重试
  }
  return data;
}

// 原始数据处理成需要计算的值
export function calcTarget(room: Room): TargetValue {
  const { desc, price, location } = room;
  const [areaStr, floorStr] = desc.split(' | ');
  const area = parseFloat(areaStr);
  const [currentFloorStr, maxFloorStr] = floorStr.split('/');
  const currentFloor = parseInt(currentFloorStr, 10);
  const maxFloor = parseInt(maxFloorStr, 10);
  const floor = currentFloor / maxFloor;
  const isTopFloor = currentFloor === maxFloor
  const isBottomFloor = currentFloor < 2;
  const needElevator = maxFloor > 7;
  const distanceFromStation = location
    .map(e => e ? parseInt((e.name.match(/\d+/) || ['5000'])[0], 10) : 5000)
    .reduce((a, b) => a > b ? b : a, Infinity);
  return {
    price,
    floor,
    area,
    isBottomFloor,
    isTopFloor,
    needElevator,
    distanceFromStation,
    position: [0, 0], // TODO：百度api查询小区经纬度
  };
}

export function calcScore(room: Room, option: Config) {
  const target = calcTarget(room);
  const { targetConfig, targetValue } = option;
  let sum = 0;
  Object.entries(targetValue).forEach(entry => {
    const key = entry[0];
    const value = entry[1];
    const currentValue = target[key];
    const { factor, divider } = targetConfig[key] || {};
    let score = 1;
    switch (typeof value) {
      case 'number':
        const diff = Math.abs(currentValue as number - value);
        score = diff / (divider || 1) * (factor || 1);
        break;
      case 'boolean':
        score = value === currentValue ? 0 : 1;
        break;
      case 'object':
        const distance = 0;
        score = distance / (divider || 1) * (factor || 1);
        break;
      default:;
    }
    target[key] = score;
    sum += score;
  });
  Object.assign(room, { target, score: sum });
}

export function deal(option: DealOption, cb: (done: boolean) => void) {
  const { urlWithParams, page, results } = option;
  const timespan = randInt(6000, 30000);
  console.log(`准备请求第${page}页数据，等待${timespan}ms...`);
  setTimeout(async () => {
    const data: ResponseData | null = await query(urlWithParams, page);
    if (data) {
      const { pages, rooms } = data;
      rooms.forEach(e => calcScore(e, option));
      results.push(...rooms);
      option.page += 1;
      if (page > pages) {
        cb(true);
      } else {
        deal(option, cb);
        cb(false); // 每次也存储
      }
    } else {
      console.log(`第${page}页数据请求失败，重试`);
      deal(option, cb);
    }
  }, timespan);
}
