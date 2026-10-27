import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { WhoopApiClient } from './whoop-api.js';
import { WhoopApiConfig } from './types.js';

export class WhoopMcpServer {
  private server: Server;
  private whoopClient: WhoopApiClient;

  constructor(config: WhoopApiConfig) {
    this.whoopClient = new WhoopApiClient(config);
    
    this.server = new Server(
      {
        name: 'whoop-mcp-server',
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // User tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // User tools
          {
            name: 'whoop-get-user-profile',
            description: 'Get basic user profile information (name, email) for the authenticated user',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'whoop-get-user-body-measurements',
            description: 'Get body measurements (height, weight, max heart rate) for the authenticated user',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'whoop-revoke-user-access',
            description: 'Revoke the access token granted by the user',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          // Cycle tools
          {
            name: 'whoop-get-cycle-by-id',
            description: 'Get the cycle for the specified ID',
            inputSchema: {
              type: 'object',
              properties: {
                cycleId: {
                  type: 'number',
                  description: 'ID of the cycle to retrieve',
                },
              },
              required: ['cycleId'],
            },
          },
          {
            name: 'whoop-get-cycle-collection',
            description: 'Get all physiological cycles for a user, paginated',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Limit on the number of cycles returned (max 25)',
                },
                start: {
                  type: 'string',
                  description: 'Return cycles that occurred after or during this time (ISO 8601)',
                },
                end: {
                  type: 'string',
                  description: 'Return cycles that intersect this time or ended before this time (ISO 8601)',
                },
                nextToken: {
                  type: 'string',
                  description: 'Next token from the previous response to get the next page',
                },
              },
              required: [],
            },
          },
          {
            name: 'whoop-get-sleep-for-cycle',
            description: 'Get sleep data for a specific cycle',
            inputSchema: {
              type: 'object',
              properties: {
                cycleId: {
                  type: 'number',
                  description: 'ID of the cycle to get sleep data for',
                },
              },
              required: ['cycleId'],
            },
          },
          // Recovery tools
          {
            name: 'whoop-get-recovery-collection',
            description: 'Get all recovery data for a user, paginated',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Limit on the number of recovery records returned (max 25)',
                },
                start: {
                  type: 'string',
                  description: 'Return recovery records that occurred after or during this time (ISO 8601)',
                },
                end: {
                  type: 'string',
                  description: 'Return recovery records that intersect this time or ended before this time (ISO 8601)',
                },
                nextToken: {
                  type: 'string',
                  description: 'Next token from the previous response to get the next page',
                },
              },
              required: [],
            },
          },
          {
            name: 'whoop-get-recovery-for-cycle',
            description: 'Get recovery data for a specific cycle',
            inputSchema: {
              type: 'object',
              properties: {
                cycleId: {
                  type: 'number',
                  description: 'ID of the cycle to get recovery data for',
                },
              },
              required: ['cycleId'],
            },
          },
          // Sleep tools
          {
            name: 'whoop-get-sleep-by-id',
            description: 'Get the sleep record for the specified ID',
            inputSchema: {
              type: 'object',
              properties: {
                sleepId: {
                  type: 'string',
                  description: 'ID of the sleep record to retrieve',
                },
              },
              required: ['sleepId'],
            },
          },
          {
            name: 'whoop-get-sleep-collection',
            description: 'Get all sleep records for a user, paginated',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Limit on the number of sleep records returned (max 25)',
                },
                start: {
                  type: 'string',
                  description: 'Return sleep records that occurred after or during this time (ISO 8601)',
                },
                end: {
                  type: 'string',
                  description: 'Return sleep records that intersect this time or ended before this time (ISO 8601)',
                },
                nextToken: {
                  type: 'string',
                  description: 'Next token from the previous response to get the next page',
                },
              },
              required: [],
            },
          },
          // Workout tools
          {
            name: 'whoop-get-workout-by-id',
            description: 'Get the workout record for the specified ID',
            inputSchema: {
              type: 'object',
              properties: {
                workoutId: {
                  type: 'string',
                  description: 'ID of the workout record to retrieve',
                },
              },
              required: ['workoutId'],
            },
          },
          {
            name: 'whoop-get-workout-collection',
            description: 'Get all workout records for a user, paginated',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Limit on the number of workout records returned (max 25)',
                },
                start: {
                  type: 'string',
                  description: 'Return workout records that occurred after or during this time (ISO 8601)',
                },
                end: {
                  type: 'string',
                  description: 'Return workout records that intersect this time or ended before this time (ISO 8601)',
                },
                nextToken: {
                  type: 'string',
                  description: 'Next token from the previous response to get the next page',
                },
              },
              required: [],
            },
          },
          // OAuth tools
          {
            name: 'whoop-get-authorization-url',
            description: 'Get the authorization URL for OAuth flow',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'whoop-get-daily-readiness',
            description:
              "Latest recovery (recovery %, HRV rmssd ms, resting HR, SpO2, skin temp), last night's sleep (hours, performance %), and 28-day average HRV and resting HR for baseline comparison. Use this each morning for training decisions.",
            inputSchema: { type: 'object', properties: {}, required: [] },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // User tools
          case 'whoop-get-user-profile': {
            const result = await this.whoopClient.getUserProfile();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'whoop-get-user-body-measurements': {
            const result = await this.whoopClient.getUserBodyMeasurements();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'whoop-revoke-user-access': {
            await this.whoopClient.revokeUserAccess();
            return {
              content: [
                {
                  type: 'text',
                  text: 'User access revoked successfully',
                },
              ],
            };
          }

          // Cycle tools
          case 'whoop-get-cycle-by-id': {
            if (!args || typeof args.cycleId !== 'number') {
              throw new Error('cycleId is required and must be a number');
            }
            const result = await this.whoopClient.getCycleById(args.cycleId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'whoop-get-cycle-collection': {
            const result = await this.whoopClient.getCycleCollection({
              limit: args?.limit as number | undefined,
              start: args?.start as string | undefined,
              end: args?.end as string | undefined,
              nextToken: args?.nextToken as string | undefined,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'whoop-get-sleep-for-cycle': {
            if (!args || typeof args.cycleId !== 'number') {
              throw new Error('cycleId is required and must be a number');
            }
            const result = await this.whoopClient.getSleepForCycle(args.cycleId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          // Recovery tools
          case 'whoop-get-recovery-collection': {
            const result = await this.whoopClient.getRecoveryCollection({
              limit: args?.limit as number | undefined,
              start: args?.start as string | undefined,
              end: args?.end as string | undefined,
              nextToken: args?.nextToken as string | undefined,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'whoop-get-recovery-for-cycle': {
            if (!args || typeof args.cycleId !== 'number') {
              throw new Error('cycleId is required and must be a number');
            }
            const result = await this.whoopClient.getRecoveryForCycle(args.cycleId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          // Sleep tools
          case 'whoop-get-sleep-by-id': {
            if (!args || typeof args.sleepId !== 'string') {
              throw new Error('sleepId is required and must be a string');
            }
            const result = await this.whoopClient.getSleepById(args.sleepId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'whoop-get-sleep-collection': {
            const result = await this.whoopClient.getSleepCollection({
              limit: args?.limit as number | undefined,
              start: args?.start as string | undefined,
              end: args?.end as string | undefined,
              nextToken: args?.nextToken as string | undefined,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          // Workout tools
          case 'whoop-get-workout-by-id': {
            if (!args || typeof args.workoutId !== 'string') {
              throw new Error('workoutId is required and must be a string');
            }
            const result = await this.whoopClient.getWorkoutById(args.workoutId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'whoop-get-workout-collection': {
            const result = await this.whoopClient.getWorkoutCollection({
              limit: args?.limit as number | undefined,
              start: args?.start as string | undefined,
              end: args?.end as string | undefined,
              nextToken: args?.nextToken as string | undefined,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          // OAuth tools
          case 'whoop-get-authorization-url': {
            const url = this.whoopClient.getAuthorizationUrl();
            return {
              content: [
                {
                  type: 'text',
                  text: `Authorization URL: ${url}`,
                },
              ],
            };
          }

          case 'whoop-get-daily-readiness': {
            const start = new Date(Date.now() - 28 * 86400_000).toISOString();
            const recs = [];
            let nextToken: string | undefined;
            for (let i = 0; i < 3; i++) {
              const page = await this.whoopClient.getRecoveryCollection({ limit: 25, start, nextToken });
              recs.push(...page.records);
              nextToken = page.next_token;
              if (!nextToken) break;
            }
            const scored = recs.filter((r) => r.score);
            const avg = (f: (r: (typeof scored)[number]) => number) =>
              scored.length ? Math.round((scored.reduce((t, r) => t + f(r), 0) / scored.length) * 10) / 10 : null;
            const sleeps = await this.whoopClient.getSleepCollection({ limit: 5 });
            const sleep = sleeps.records.find((x) => !x.nap && x.score);
            const hours = (ms: number) => Math.round((ms / 3_600_000) * 100) / 100;
            const latest = scored[0];
            const result = {
              latest_recovery: latest && {
                date: latest.created_at,
                recovery_score_pct: latest.score!.recovery_score,
                hrv_rmssd_ms: latest.score!.hrv_rmssd_milli,
                resting_heart_rate: latest.score!.resting_heart_rate,
                spo2_pct: latest.score!.spo2_percentage,
                skin_temp_c: latest.score!.skin_temp_celsius,
              },
              latest_sleep: sleep && {
                start: sleep.start,
                end: sleep.end,
                hours_in_bed_minus_awake: hours(
                  sleep.score!.stage_summary.total_in_bed_time_milli - sleep.score!.stage_summary.total_awake_time_milli
                ),
                performance_pct: sleep.score!.sleep_performance_percentage,
                efficiency_pct: sleep.score!.sleep_efficiency_percentage,
              },
              baseline_28d: {
                days_with_data: scored.length,
                avg_hrv_rmssd_ms: avg((r) => r.score!.hrv_rmssd_milli),
                avg_resting_heart_rate: avg((r) => r.score!.resting_heart_rate),
                avg_recovery_score_pct: avg((r) => r.score!.recovery_score),
              },
            };
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('WHOOP MCP Server started');
  }
}
