/**
 * 第一版逻辑流程
 * 1. 任务定时启动
 * 2. 从config.json中读取配置（执行一次）
 * 3. 开使轮询，参数p初始化，
 * 4. 计算一个随机等待时间，开启setTimeout，发送请求
 * 5. 收到返回，写入内存，p++，检查自增后的p值是否超过了返回的总页数值
 * 6. 没超过，则继续重复第4步；超过，则写入文件
 * 7. 每次收到返回和再次发送的期间，可以进行大量逻辑处理
 *
 * 执行
 * deno run --allow-read --allow-write --allow-net main.ts
 */
import { Config, Room, Location } from './type.d.ts';
import { deal, getUrlWithParams } from './mod.ts';

const timeStr = new Date().toLocaleString('lt');
const path = `./data_${timeStr}.json`;
const json = await Deno.readTextFile('./config.json');
const config: Config = JSON.parse(json);
const locationJson = await Deno.readTextFile('./location.json');
const location: Location = JSON.parse(locationJson);
const urlWithParams = getUrlWithParams(config.search);
const isContinueTransfer = !!config.source.path;
const page = isContinueTransfer ? config.source.page : 1;
const results: Room[] = [];

if (isContinueTransfer) {
  const sourceJson = await Deno.readTextFile(config.source.path);
  results.push(...JSON.parse(sourceJson));
}

deal({
  urlWithParams,
  page,
  results,
  location,
  ...config,
}, async (done = true) => {
  const prefix = done ? '所有请求结束' : '存储数据';
  const sorted = results.sort((a, b) => (a.score || 1) - (b.score || 1));
  await Deno.writeTextFile(path, JSON.stringify(sorted, null, 2));
  console.warn(`${prefix}, 共计${results.length}项, 请查看“${path}”文件`);
  await Deno.writeTextFile('./location.json', JSON.stringify(location, null, 2));
});
