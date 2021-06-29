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
import { Config, Room } from './type.d.ts';
import { deal, getUrlWithParams } from './mod.ts';

const path = './data.json';
const json = await Deno.readTextFile('./config.json');
const config: Config = JSON.parse(json);
const urlWithParams = getUrlWithParams(config.search);
const results: Room[] = [];

deal({
  urlWithParams,
  page: 1,
  results,
  targetConfig: config.targetConfig,
  targetValue: config.targetValue,
}, async () => {
  const sorted = results.sort((a, b) => (a.score || 1) - (b.score || 1));
  await Deno.writeTextFile(path, JSON.stringify(sorted, null, 2));
  console.warn(`所有请求结束, 共计${results.length}项, 请查看“${path}”文件`);
});
