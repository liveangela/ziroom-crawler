import {
  Room,
  Config,
  Transit,
  TargetValue,
  Location,
  SearchConfig,
  DealOption,
  ResponseStruct,
  ResponseData,
  MapApiLocationResponse,
  MapApiTransitResponse,
} from './type.d.ts';

export function sleep(timespan = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timespan));
}

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

// 通过百度接口获取经纬度
export async function getLocation(address: string): Promise<number[] | null> {
  if (!address) return null;
  const ak = '';
  const params = {
    ak,
    address,
    output: 'json',
    city: '上海市',
  };
  const paramsStr = Object.entries(params).map(e => `${e[0]}=${e[1]}`).join('&');
  const url = `http://api.map.baidu.com/geocoding/v3/?${paramsStr}`;
  const res: Response = await fetch(url);
  const resStruct: MapApiLocationResponse = await res.json();
  if (resStruct.status === 0) {
    const { lng, lat } = resStruct.result.location;
    return [lng, lat];
  }
  return null;
}

export async function getTransit(from: number[], to: number[]): Promise<Transit | null> {
  if (!from || !to) return null;
  const ak = '';
  const origin = `${from[1]},${from[0]}`;
  const destination = `${to[1]},${to[0]}`;
  const tactics_incity = 4; // 按耗时由小到大排序
  const params = { origin, destination, ak, tactics_incity };
  const paramsStr = Object.entries(params).map(e => `${e[0]}=${e[1]}`).join('&');
  const url = `https://api.map.baidu.com/direction/v2/transit?${paramsStr}`;
  const res: Response = await fetch(url);
  const resStruct: MapApiTransitResponse = await res.json();
  if (resStruct.status === 0) {
    const { taxi, routes } = resStruct.result;
    const car = {
      distance: taxi && taxi.distance,
      duration: taxi && taxi.duration,
    };
    const metro = {
      distance: routes && routes[0] && routes[0].distance,
      duration: routes && routes[0] && routes[0].duration,
    };
    return {
      car,
      metro,
    };
  }
  return null;
}

// 原始数据处理成需要计算的值
export async function calcTarget(room: Room, locationMap: Location): Promise<TargetValue> {
  const { desc, price, location: loc, resblock_name } = room;
  const [areaStr, floorStr] = desc.split(' | ');
  const area = parseFloat(areaStr);
  const [currentFloorStr, maxFloorStr] = floorStr.split('/');
  const currentFloor = parseInt(currentFloorStr, 10);
  const maxFloor = parseInt(maxFloorStr, 10);
  const floor = currentFloor / maxFloor;
  const isTopFloor = currentFloor === maxFloor
  const isBottomFloor = currentFloor < 2;
  const needElevator = maxFloor > 7;
  const distanceFromStation = loc
    .map(e => e ? parseInt((e.name.match(/\d+/) || ['5000'])[0], 10) : 5000)
    .reduce((a, b) => a > b ? b : a, Infinity);
  const locationObj = locationMap[resblock_name];
  let location = locationObj && locationObj.location;
  if (!location) {
    await sleep();
    location = await getLocation(resblock_name);
    Object.assign(locationMap, {
      [resblock_name]: {
        location,
        to: {}
      },
    });
  }
  return {
    price,
    floor,
    area,
    isBottomFloor,
    isTopFloor,
    needElevator,
    distanceFromStation,
    location,
  };
}

export async function calcScore(room: Room, config: Config, locationMap: Location): Promise<Room> {
  const { targetConfig, targetValue } = config;
  const { resblock_name } = room;
  const target = await calcTarget(room, locationMap);
  const targetValueKeys = Object.keys(targetValue);
  let sum = 0;

  for (let i = 0, len = targetValueKeys.length; i < len; i++) {
    const key = targetValueKeys[i];
    const value = targetValue[key];
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
        if ('location' === key && value) {
          const toName = value.join(',');
          const locationToObj = locationMap[resblock_name].to;
          let transit = locationToObj[toName];
          if (!transit) {
            await sleep();
            transit = await getTransit(currentValue as number[], value);
            console.debug('transit:', transit);
            Object.assign(locationToObj, {
              [toName]: transit,
            });
          }
          const distance = transit && transit.metro.distance || 10000;
          score = distance / (divider || 1) * (factor || 1);
        }
        break;
      default:;
    }
    target[key] = score;
    sum += score;
  }

  return { ...room, target, score: sum };
}

export function deal(option: DealOption, cb: (done: boolean) => void) {
  const { urlWithParams, page, results, location } = option;
  const timespan = randInt(6000, 30000);
  console.log(`准备请求第${page}页数据，等待${timespan}ms...`);
  setTimeout(async () => {
    const data: ResponseData | null = await query(urlWithParams, page);
    if (data) {
      const { pages, rooms } = data;
      for (let i = 0, len = rooms.length; i < len; i++) {
        const room = await calcScore(rooms[i], option, location);
        results.push(room);
      }
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
