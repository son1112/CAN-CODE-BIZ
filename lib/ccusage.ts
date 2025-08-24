import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CCUsageSession {
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  lastActivity: string;
  modelsUsed: string[];
  projectPath: string;
}

export interface CCUsageData {
  sessions: CCUsageSession[];
  totals: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    totalCost: number;
    totalTokens: number;
  };
}

/**
 * Fetch ccusage data for session metrics
 */
export async function fetchCCUsageData(): Promise<CCUsageData | null> {
  try {
    const { stdout } = await execAsync('npx ccusage session --json');
    const data = JSON.parse(stdout) as CCUsageData;
    return data;
  } catch (error) {
    console.warn('Failed to fetch ccusage data:', error);
    return null;
  }
}

/**
 * Fetch daily ccusage data
 */
export async function fetchDailyCCUsageData(): Promise<{
  daily: Array<{
    date: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    totalCost: number;
    modelsUsed: string[];
  }>;
} | null> {
  try {
    const { stdout } = await execAsync('npx ccusage daily --json');
    const data = JSON.parse(stdout);
    return data;
  } catch (error) {
    console.warn('Failed to fetch daily ccusage data:', error);
    return null;
  }
}

/**
 * Get ccusage data for the current project/session
 */
export async function getCurrentProjectUsage(): Promise<{
  projectTokens: number;
  dailyInputTokens: number;
  dailyOutputTokens: number;
  dailyTotalTokens: number;
  recentSessions: number;
  dailyModels?: string[];
  projectModels?: string[];
} | null> {
  try {
    const [sessionData, dailyData] = await Promise.all([
      fetchCCUsageData(),
      fetchDailyCCUsageData()
    ]);

    if (!sessionData) return null;

    // Find sessions related to the current project (rubber-ducky-live)
    const currentProjectSessions = sessionData.sessions.filter(session =>
      session.sessionId.includes('rubber-ducky-live') ||
      session.projectPath.includes('rubber-ducky-live')
    );

    const projectTokens = currentProjectSessions.reduce((sum, session) => sum + session.totalTokens, 0);

    // Get unique models used in project
    const projectModels = Array.from(new Set(
      currentProjectSessions.flatMap(session => session.modelsUsed)
    ));

    // Get today's actual daily token usage from daily data
    const today = new Date().toISOString().split('T')[0];
    let dailyInputTokens = 0;
    let dailyOutputTokens = 0;
    let dailyTotalTokens = 0;
    let dailyModels: string[] = [];

    if (dailyData && dailyData.daily) {
      const todayData = dailyData.daily.find(day => day.date === today);
      if (todayData) {
        dailyInputTokens = todayData.inputTokens || 0;
        dailyOutputTokens = todayData.outputTokens || 0;
        dailyTotalTokens = todayData.totalTokens || 0;
        dailyModels = todayData.modelsUsed || [];
      }
    }

    // Count recent sessions (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const recentSessions = sessionData.sessions.filter(session =>
      session.lastActivity >= weekAgoStr
    ).length;

    return {
      projectTokens,
      dailyInputTokens,
      dailyOutputTokens,
      dailyTotalTokens,
      recentSessions,
      dailyModels,
      projectModels
    };
  } catch (error) {
    console.warn('Failed to get current project usage:', error);
    return null;
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) return '<$0.01';
  if (cost < 1) return `$${cost.toFixed(2)}`;
  if (cost < 100) return `$${cost.toFixed(2)}`;
  return `$${Math.round(cost)}`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  if (tokens < 1000000000) return `${(tokens / 1000000).toFixed(1)}M`;
  return `${(tokens / 1000000000).toFixed(1)}B`;
}