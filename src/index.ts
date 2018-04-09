import { Stats } from "fast-stats";

const DEFAULT_TIMEOUT_MS = 100;
const NS_PER_SEC = 1e9;
const NS_PER_MILLI = 1e6;

function range(count: number, valueFactory: (idx: number) => number = v => v) {
  return Array.from(Array(count), (value, idx) => valueFactory(idx));
}

export default class EventLoopMonitor {
  private startTime: [number, number] = [0, 0];
  private stats: Stats = new Stats({
    buckets: [
      // Every 0.001ms up to 0.999ms
      ...range(1000, v => v / 1000 * NS_PER_MILLI),
      // Then every ms up to 1000ms
      ...range(1000, v => (v + 1) * NS_PER_MILLI)
    ],
    store_data: false
  });
  private immediateId: any = null;
  private timeoutId: NodeJS.Timer | null = null;
  private renderIntervalId: any = null;
  private timeoutMs: number = 0;
  private fastLoopNs = NS_PER_MILLI;
  private fastLoopCount = 0;
  private statMaxLength: { [column: string]: number } = {};

  constructor(
    options: {
      timeoutMs?: number;
    } = {}
  ) {
    this.timeoutMs = options.hasOwnProperty("timeoutMs")
      ? options.timeoutMs!
      : DEFAULT_TIMEOUT_MS;
  }

  public getStatsString(): string {
    return (
      `fast=${this.fastLoopCount} ` +
      `slow=${this.stats.length} ` +
      `${this.statNsToString("mean", this.stats.amean())} ` +
      `${this.statNsToString("p95", this.stats.percentile(95))} ` +
      `${this.statNsToString("p99", this.stats.percentile(99))} ` +
      `${this.statNsToString("upper", this.stats.percentile(100))} `
    );
  }

  public start() {
    if (this.immediateId) {
      throw new Error("EventLoopMonitor is already running");
    }
    this.startTime = process.hrtime();
    this.timeoutMs = 0;
    this.immediateId = setImmediate(() => this.cycle());
  }

  public stop() {
    if (!this.immediateId && !this.timeoutId) {
      throw new Error("EventLoopMonitor was not running");
    }
    if (this.immediateId) {
      clearImmediate(this.immediateId);
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private cycle() {
    const now = process.hrtime();
    const takenNs =
      (now[0] - this.startTime[0]) * NS_PER_SEC + now[1] - this.startTime[1];
    const loopNs = takenNs - this.timeoutMs * NS_PER_MILLI;

    if (loopNs < this.fastLoopNs) {
      this.fastLoopCount++;
    } else {
      this.stats.push(loopNs);
    }

    this.immediateId = null;
    this.timeoutId = null;

    this.startTime = now;
    this.timeoutMs = 0; // Math.floor(100 + Math.random() * 900);

    if (this.timeoutMs > 0) {
      this.timeoutId = setTimeout(() => {
        this.immediateId = setImmediate(() => this.cycle());
      }, this.timeoutMs);
    } else {
      this.immediateId = setImmediate(() => this.cycle());
    }
  }

  private statNsToString(stat: string, ns: number) {
    if (isNaN(ns)) {
      return `${stat}=-`;
    }
    const value = (ns / NS_PER_MILLI).toFixed(3);
    this.statMaxLength[stat] = Math.max(
      value.length,
      this.statMaxLength[stat] || 0
    );
    return `${stat}=${value.padStart(this.statMaxLength[stat])}ms`;
  }
}
