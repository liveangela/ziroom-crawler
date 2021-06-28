import { Config, DealOption, ResponseStruct, ResponseData } from './type.d.ts';

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

export function deal(option: DealOption, cb: () => void) {
  const { urlWithParams, page, results } = option;
  const timespan = randInt(6000, 30000);
  console.log(`准备请求第${page}页数据，等待${timespan}ms...`);
  setTimeout(async () => {
    const data: ResponseData | null = await query(urlWithParams, page);
    if (data) {
      const { pages, rooms } = data;
      results.push(...rooms);
      option.page += 1;
      if (page > pages) {
        cb();
      } else {
        deal(option, cb);
      }
    } else {
      console.log(`第${page}页数据请求失败，重试`);
      deal(option, cb);
    }
  }, timespan);
}
