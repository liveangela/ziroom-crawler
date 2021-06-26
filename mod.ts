import { Config, Room, ResponseStruct, ResponseData } from './type.d.ts';

export function randInt(a: number, b: number): number {
  const c = b - a + 1;
  const num = Math.random() * c + a;
  return Math.floor(num);
}

export function getUrlWithParams(config: Config): string {
  const { url, min_lat, max_lat, min_lng, max_lng } = config;
  const params: string[] = [];
  const clat = parseFloat(((min_lat + max_lat) / 2).toFixed(5));
  const clng = parseFloat(((min_lng + max_lng) / 2).toFixed(5));
  const obj = Object.assign({}, config, { clat, clng });
  Object.entries(obj).forEach(e => {
    if (e[0] !== 'url') {
      params.push(`${e[0]}=${e[1]}`);
    }
  });
  return url + '?' + params.join('&');
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

export function deal(url: string, paramsJson: string, roomsGlobal: Room[], p: number) {
  setTimeout(async () => {
    const res: Response = await fetch(url, {
      method: 'GET',

      body: paramsJson,
    });
    const resStruct: ResponseStruct = await res.json();
    const { code, data, message } = resStruct;
    if (code !== 200) {
      console.error(message);
      return; // TODO: 改为重试
    }
    const { pages, rooms } = data;
    roomsGlobal.push(...rooms);

    // p += 1;
    // if (p < pages) {
    //   deal(url, paramsJson, roomsGlobal, p);
    // } else {
    //   console.log('all query done, saving files...');
    // }
    console.warn(roomsGlobal);
  }, randInt(6000, 30000));
}
