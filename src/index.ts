import { Stats } from "fast-stats";

const NS_PER_SEC = 1e9;

const NS_PER_MILLI = 1e6;

let maxLength = 0;
function fixedNsToMs(ns: number) {
  const value = (ns / NS_PER_MILLI).toFixed(3);
  maxLength = Math.max(value.length, maxLength);
  return " ".repeat(maxLength - value.length) + value;
}

export default class EventLoopMonitor {
  private startTime: [number, number] = [0, 0];
  private stats: Stats = new Stats();
  private immediateId: any = null;
  private renderIntervalId: any = null;
  private timeoutMs: number = 0;

  constructor(private name: string) {}

  public render() {
    // tslint:disable-next-line:no-console
    console.log(
      `${this.name} ` +
        `mean ${fixedNsToMs(this.stats.amean())} ` +
        `p95 ${fixedNsToMs(this.stats.percentile(95))} ` +
        `p99 ${fixedNsToMs(this.stats.percentile(99))} ` +
        `count=${this.stats.length}`
    );
  }

  public start() {
    if (this.immediateId) {
      throw new Error("EventLoopMonitor is already running");
    }
    this.startTime = process.hrtime();
    this.timeoutMs = 0;
    this.immediateId = setImmediate(() => this.cycle());
    this.renderIntervalId = setInterval(() => this.render(), 1000);
  }

  private cycle() {
    const now = process.hrtime();
    const takenNs =
      (now[0] - this.startTime[0]) * NS_PER_SEC + now[1] - this.startTime[1];
    this.stats.push(takenNs - this.timeoutMs * NS_PER_MILLI);

    this.immediateId = null;

    this.startTime = now;
    this.timeoutMs = 0; // Math.floor(100 + Math.random() * 900);

    // setTimeout(() => {
    this.immediateId = setImmediate(() => this.cycle());
    // }, this.timeoutMs);
  }
}
