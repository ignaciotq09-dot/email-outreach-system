export interface ContactSequenceState {
  campaignId: number;
  contactId: number;
  sequenceId: number;
  currentStepNumber: number;
  lastStepSentAt: Date;
  initialEmailId: number;
}
