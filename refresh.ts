/**
 * 重新计算一遍得分
 * 不会拉取房屋信息，会请求位置信息和路线规划
 *
 * 执行
 * deno run --allow-read --allow-write --allow-net refresh.ts
 */
import { Config, Room, Location } from './type.d.ts';
import { calcScore } from './mod.ts';

const path = './data.json';
const json = await Deno.readTextFile('./config.json');
const config: Config = JSON.parse(json);
const locationJson = await Deno.readTextFile('./location.json');
const location: Location = JSON.parse(locationJson);
const dataJson = await Deno.readTextFile(path);
const data: Room[] = JSON.parse(dataJson);
const results: Room[] = [];

for (let i = 0, len = data.length; i < len; i++) {
  const room = await calcScore(data[i], config, location);
  results.push(room);
  if (i % 20 < 1) {
    await Deno.writeTextFile('./location.json', JSON.stringify(location, null, 2));
  }
}
results.sort((a, b) => (a.score || 1) - (b.score || 1));
const newPath = `${path.substr(0, path.length - 5)}_refresh.json`;
await Deno.writeTextFile(newPath, JSON.stringify(results, null, 2));
console.warn(`重算结束, 共计${results.length}项, 请查看“${newPath}”文件`);
await Deno.writeTextFile('./location.json', JSON.stringify(location, null, 2));
