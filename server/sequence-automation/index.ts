import { processSequences } from "./processing";
import { enrollCampaignInSequence, getSequenceMetrics } from "./enrollment";

export class SequenceAutomationService {
  private static isRunning = false;
  private static checkInterval: NodeJS.Timeout | null = null;

  static start(intervalMs: number = 60000) {
    if (this.isRunning) {
      console.log('[SequenceAutomation] Already running');
      return;
    }

    console.log(`[SequenceAutomation] Starting with interval: ${intervalMs}ms`);
    this.isRunning = true;

    processSequences();

    this.checkInterval = setInterval(() => {
      processSequences();
    }, intervalMs);

    console.log('[SequenceAutomation] Sequence automation started');
  }

  static stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('[SequenceAutomation] Sequence automation stopped');
  }

  static processSequences = processSequences;
  static enrollCampaignInSequence = enrollCampaignInSequence;
  static getSequenceMetrics = getSequenceMetrics;

  static getStatus() {
    return {
      running: this.isRunning,
    };
  }
}
