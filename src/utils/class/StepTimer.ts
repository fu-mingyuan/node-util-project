export class StepTimer {
  private steps: Record<string, number> = {};
  private lastTime = performance.now();

  mark(step: string) {
    const now = performance.now();
    this.steps[step] = now - this.lastTime;
    this.lastTime = now;
  }

  print() {
    console.log("🌟 每个步骤耗时：");
    for (const [step, time] of Object.entries(this.steps)) {
      console.log(`⏱️ ${step}: ${(time / 1000).toFixed(2)} 秒`);
    }
  }
}
