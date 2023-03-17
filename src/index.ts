import { REGEX_P } from './constant'; // 正则 // 根据特定的格式，匹配输入的日期时间字符串，提取其中的年、月、日、时、分、秒和毫秒等信息
import U from './utils'; // 各种转换的函数代码
import * as C from './constant'; // 把所有常量引入 放在一个对象C里面

type DateType = string | number | Date | null | undefined;

interface ConfigType {
  date?: DateType;
  utc?: boolean;
  args?: IArguments;
  format?: string;
}

const isLunar = (d: unknown): d is Lunar => d instanceof Lunar; // 返回 true 或 false 判断是否是 class lunar 的实例对象
// eslint-disable-next-line func-names
const lunar = function (date?: DateType, c?: ConfigType): Lunar {
  // 这个函数是引入到index.html使用时的启动函数 参数是date(DateType类型) 和 c(ConfigType类型)
  // 如果是Lunar的实力对象 就直返回date.clone()函数 clone一个lunar 再走一遍这个函数 代入date=$d 目: 在对象赋值的时候 引用地址不同 完全生成两个不影响的变量
  if (isLunar(date)) {
    return date.clone();
  }
  // c是一个配置对象, 用来配置这个工具的 // 具体用处还在开发中 大概目的就是用来更精确的返回使用者想要的数据样式
  const cfg: ConfigType = typeof c === 'object' ? c : {};
  // 把date加入到配置对象里
  cfg.date = date;
  // eslint-disable-next-line prefer-rest-params
  cfg.args = arguments;
  // 返回一个 Lunar实例
  return new Lunar(cfg);
};

// 将输入的日期时间字符串或日期时间对象转换成日期对象的函数，同时支持本地时间和 UTC 时间
// 这里代入date  utc?: true 返回UTC时间的日期对象, 否则返回本地时间的日期对象
const parseDate = (date: DateType, utc?: boolean): Date => {
  if (date === null) return new Date(NaN); // Invalid Date
  if (U.u(date)) return new Date(); // 如果是 undefined 就返回当前日期
  if (date instanceof Date) return new Date(date); // 如果是日期对象 就返回 代入的日期对象
  if (typeof date === 'string' && !/Z$/i.test(date)) {
    const e = date.match(REGEX_P);
    if (e) {
      const y = Number(e[1]);
      const M = Number(e[2]) - 1 || 0;
      const d = Number(e[3]) || 1;
      const h = Number(e[4]) || 0;
      const m = Number(e[5]) || 0;
      const s = Number(e[6]) || 0;
      const ms = Number((e[7] || '0').substring(0, 3));
      if (utc) { 
        // 如果utc传了true 就返回一个UTC格式的时间对象
        return new Date(Date.UTC(y, m, M, h, m, s, ms));
      }
      // 没有UTC就显示正常的时间对象
      return new Date(y, M, d, h, m, s, ms);
    }
  }
  return new Date(date);
};

const wrapper = (date: DateType) => lunar(date); // 返回了一个全新地址的lunar对象

class Lunar {
  [key: string]: any;

  // cfg是个配置对象 这里是启动
  constructor(cfg: ConfigType) {
    this.parse(cfg);
  }

  parse(cfg: ConfigType) {
    // 对象里的函数 把data代入到 parseDate函数 目的是处理 date 把他们变成 Mon Mar 13 2023 17:10:46 GMT+0800 (中国标准时间)
    this.$d = parseDate(cfg.date);
    // 启动函数
    this.init();
  }

  init() {
    const { ly, lm, ld, cy, cm, cd, cw, gzy, gzm, gzd, zod, isl, st } =
      U.solar2lunar(this.$d); // 从公历转农历中 解构出所需要的数值
    // $xx 是给内部使用的
    this.$ly = ly; // 农历年
    this.$lm = lm; // 农历月
    this.$ld = ld; // 农历日
    this.$cy = cy; // 中文的农历年
    this.$cm = cm; // 中文的农历月
    this.$cd = cd; // 中文的农历日
    this.$cw = cw; // 中文的农历周
    this.$gzy = gzy; // 干支年
    this.$gzm = gzm; // 干支月
    this.$gzd = gzd; // 干支日
    this.$zod = zod; // 生肖
    this.$isl = isl; // 有没有润月
    this.$st = st; // 节气
  }

  // 格式化 年月日
  format(): string {
    return this.$ly + this.$cm + this.$cd;
  }

  // 为用户clone一个新地址
  clone() {
    return wrapper(this.$d);
  }

  // 获取特定所需的函数执行ly lm...
  get(unit: string) {
    return this[U.p(unit)]();
  }

  // 将时间的小时数转换为中文数字，并添加 '时' 后缀，以便后续处理使用。
  lunarTime(h?: number, u?: string): string {
    const i = h || this.$d.getHours();
    return C.ZHI[U.t(i)] + (u || '时');
  }

  // 根据输入的小时数 获取对应的生肖名称, 以便后续处理使用
  timeShengXiao(h?: number): string {
    const i = h || this.$d.getHours();
    return C.ZODIAC[U.t(i)];
  }

  // 将输入的日期转换为对应的节气名称，以便后续处理使用。如果没有输入日期，则默认使用当前日期来获取对应的节气名称。
  sTerm(date?: DateType): string {
    const d = parseDate(date) || this.$d;
    return U.sTermInfo(d.getFullYear(), d.getMonth(), d.getDate());
  }
}
// Lunar构造函数创建的每个对象都可以访问Lunar.prototype对象中定义的属性和方法
const proto = Lunar.prototype;
lunar.prototype = proto;
[
  ['$ly', C.LY],
  ['$lm', C.LM],
  ['$ld', C.LD],
  ['$cy', C.CY],
  ['$cm', C.CM],
  ['$cd', C.CD],
  ['$cw', C.CW],
  ['$gzy', C.GZY],
  ['$gzm', C.GZM],
  ['$gzd', C.GZD],
  ['$zod', C.ZOD],
  ['$isl', C.ISL],
].forEach(([prop, name]) => {
  // eslint-disable-next-line func-names
  proto[name] = function () {
    return this[prop];
  };
});

lunar.extend = (plugin: any, option: any) => {
  if (!plugin.$i) {
    plugin(option, Lunar, lunar);
    plugin.$i = true;
  }
  return lunar;
};

export default lunar;
