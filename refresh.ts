/**
 * 重新计算一遍得分
 *
 * 执行
 * deno run --allow-read --allow-write refresh.ts
 */
import { Config, Room } from './type.d.ts';
import { calcScore } from './mod.ts';

const path = './data.json';
const json = await Deno.readTextFile('./config.json');
const config: Config = JSON.parse(json);
const dataJson = await Deno.readTextFile(path);
const data: Room[] = JSON.parse(dataJson);

data.forEach(e => calcScore(e, config));
data.sort((a, b) => (a.score || 1) - (b.score || 1));
await Deno.writeTextFile(path, JSON.stringify(data, null, 2));
console.warn(`重算结束, 共计${data.length}项, 请查看“${path}”文件`);
