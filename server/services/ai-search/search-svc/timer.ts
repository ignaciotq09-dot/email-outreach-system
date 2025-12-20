export class PerformanceTimer {
  private startTime: number;
  private marks: { label: string; elapsed: number }[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  mark(label: string): void {
    this.marks.push({ label, elapsed: Date.now() - this.startTime });
  }

  total(): number {
    return Date.now() - this.startTime;
  }

  print(prefix: string): void {
    const lines = this.marks.map((m, i) => {
      const delta = i === 0 ? m.elapsed : m.elapsed - this.marks[i - 1].elapsed;
      return `  ${m.label}: +${delta}ms (${m.elapsed}ms total)`;
    });
    console.log(`[${prefix}] Performance breakdown:\n${lines.join('\n')}`);
  }
}
