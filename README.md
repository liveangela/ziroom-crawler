# 自如爬虫

## 设计

最近需要租房，自如的网站和app对搜索特别不友好：
  - 不支持过滤底层和顶层的楼层
  - 不支持过滤面积
  - app经常会不小心退出了地图
  - 需要经常性地手动搜索

需求有以下几点
  - 距离上班地点11个地铁站左右（30分钟），靠近地铁站为佳
  - 中高层为佳（安静、蚊虫少、有日照）
  - 朝南为佳
  - 住户越少越好（省心）
  - 周围生活配套成熟为佳（外卖和买菜方便）
  - 有阳台为佳（吸氧，室内不闭塞）
  - 2500元/月左右为佳

基于deno写一个爬虫，以自如的web站点为目标，有以下特点：
  - 可配置参数，以cli、json文件或者之后写web配置都行
  - 6～30s随机间隔请求，一般100～200页数据，大约在30～60min完成
  - 每半天爬取一次，如早11点，晚6点，最好压在集中上新的时段
  - 结果保存在数据库或者json文件中

如何得到想要的结果
1. 第一种思路是打分，然后看排名
2. 第二种是机器学习，机器辅助决策

## 用法
- main.ts     主入口（包括断点续传）
- mod.ts      各类方法
- refresh.ts  重新打分

```shell
// 开始爬取
deno run --allow-read --allow-write --allow-net main.ts


// 断点续传，先更改config.json中的source字段，例如
"source": {
  "page": 66,
  "path": "./data_2021-07-05 10:57:16.json"
}
// 再次执行上面的开始爬取命令，会另存为新的结果文件


// 重新打分
deno run --allow-read --allow-write --allow-net refresh.ts
```

## 待改进

- [ ] 打分算法还不够理想，忽视了无电梯的房子，且排名考前的并不一定是最好的，仍需调参
- [ ] 同名小区会导致定位不正确，从而打分错误，应考虑地铁站这条线索

## 问题
- vscode在写Deno全局命名空间时，报“Cannot find Deno”的错误
  - 需要安装Deno插件，然后在 Ctol + Shift + p调出的命令中，输入deno；init初始化一下配置
  - 可以参考[这里](https://github.com/denoland/vscode_deno/issues/66)

- 计算房子到目标地址的距离和路线耗时，都需要对每项进行异步请求，如何与请求房屋信息的流程平顺结合？
  - 简单粗暴的办法就是将请求放在其中，内存需要缓存，也许要持久化，这种方式一开始会很慢，后续随着重复使用率越来越高，处理会越来越快（尝试跑一下便知，而且百度的接口无需考虑请求间隔）
  - 百度接口还是会有并发量不足的问题

- 循环中await失效的问题
  - 需要注意forEach和map这类函数式循环中，异步机制会和预想的不一致，如map会返回promise[]
  - for循环中await行为正常
