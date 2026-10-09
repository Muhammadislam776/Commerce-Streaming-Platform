export interface ModerationResult {
  isSafe: boolean;
  toxicityScore: number;
  reason?: string;
  sanitizedContent: string;
}

export class ChatModerationPipeline {
  private bannedKeywords: RegExp[];

  constructor() {
    this.bannedKeywords = [
      /\b(scam|fake|hate|fraud|counterfeit|ponzi)\b/i,
      /\b(https?:\/\/[^\s]+)\b/i, // External phishing links
      /(.)\1{6,}/, // Excessive repeating characters spam
    ];
  }

  /**
   * Sub-50ms fast-path moderation check before broadcasting to WebSocket clients
   */
  public async inspectMessage(content: string): Promise<ModerationResult> {
    // 1. Fast regex heuristics (0ms)
    for (const pattern of this.bannedKeywords) {
      if (pattern.test(content)) {
        return {
          isSafe: false,
          toxicityScore: 0.95,
          reason: 'Automated filter triggered: spam or prohibited language',
          sanitizedContent: '[Message removed by moderator]',
        };
      }
    }

    // 2. Length check
    if (content.length > 300) {
      return {
        isSafe: false,
        toxicityScore: 0.8,
        reason: 'Message exceeds 300 characters limit',
        sanitizedContent: content.substring(0, 300) + '...',
      };
    }

    // 3. In production: call fast toxicity classifier or Perspective API
    // Returns clean message with low toxicity score
    return {
      isSafe: true,
      toxicityScore: 0.05,
      sanitizedContent: content.trim(),
    };
  }
}
