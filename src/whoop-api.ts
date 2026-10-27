import axios, { AxiosInstance } from 'axios';
import {
  WhoopApiConfig,
  WhoopUserProfile,
  WhoopBodyMeasurements,
  WhoopCycle,
  WhoopCycleCollection,
  WhoopRecovery,
  WhoopRecoveryCollection,
  WhoopSleep,
  WhoopSleepCollection,
  WhoopWorkout,
  WhoopWorkoutCollection,
  PaginationParams
} from './types.js';
import { loadTokens, saveTokens } from './token-store.js';

export class WhoopApiClient {
  private client: AxiosInstance;
  private config: WhoopApiConfig;

  constructor(config: WhoopApiConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://api.prod.whoop.com/developer/v2',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include a valid access token (refreshing it if needed)
    this.client.interceptors.request.use(async (config) => {
      const token = await this.getValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  private refreshing: Promise<string | undefined> | null = null;

  private async getValidToken(): Promise<string | undefined> {
    const stored = loadTokens();
    if (!stored) return this.config.accessToken;
    if (stored.expires_at - Date.now() > 60_000) return stored.access_token;
    if (!stored.refresh_token) return stored.access_token;
    // Refresh tokens rotate, so share one in-flight refresh between concurrent calls.
    this.refreshing ??= this.refreshToken(stored.refresh_token)
      .then((t) => t.access_token)
      .finally(() => {
        this.refreshing = null;
      });
    return this.refreshing;
  }

  private persist(t: { access_token: string; refresh_token?: string; expires_in: number }, previousRefresh?: string) {
    saveTokens({
      access_token: t.access_token,
      refresh_token: t.refresh_token ?? previousRefresh,
      expires_at: Date.now() + t.expires_in * 1000,
    });
  }

  setAccessToken(accessToken: string) {
    this.config.accessToken = accessToken;
  }

  // User endpoints
  async getUserProfile(): Promise<WhoopUserProfile> {
    const response = await this.client.get('/user/profile/basic');
    return response.data;
  }

  async getUserBodyMeasurements(): Promise<WhoopBodyMeasurements> {
    const response = await this.client.get('/user/measurement/body');
    return response.data;
  }

  async revokeUserAccess(): Promise<void> {
    await this.client.delete('/user/access');
  }

  // Cycle endpoints
  async getCycleById(cycleId: number): Promise<WhoopCycle> {
    const response = await this.client.get(`/cycle/${cycleId}`);
    return response.data;
  }

  async getCycleCollection(params?: PaginationParams): Promise<WhoopCycleCollection> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.start) queryParams.append('start', params.start);
    if (params?.end) queryParams.append('end', params.end);
    if (params?.nextToken) queryParams.append('nextToken', params.nextToken);

    const url = `/cycle${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.client.get(url);
    return response.data;
  }

  async getSleepForCycle(cycleId: number): Promise<WhoopSleep[]> {
    const response = await this.client.get(`/cycle/${cycleId}/sleep`);
    return response.data;
  }

  // Recovery endpoints
  async getRecoveryCollection(params?: PaginationParams): Promise<WhoopRecoveryCollection> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.start) queryParams.append('start', params.start);
    if (params?.end) queryParams.append('end', params.end);
    if (params?.nextToken) queryParams.append('nextToken', params.nextToken);

    const url = `/recovery${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.client.get(url);
    return response.data;
  }

  async getRecoveryForCycle(cycleId: number): Promise<WhoopRecovery[]> {
    const response = await this.client.get(`/cycle/${cycleId}/recovery`);
    return response.data;
  }

  // Sleep endpoints
  async getSleepById(sleepId: string): Promise<WhoopSleep> {
    const response = await this.client.get(`/activity/sleep/${sleepId}`);
    return response.data;
  }

  async getSleepCollection(params?: PaginationParams): Promise<WhoopSleepCollection> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.start) queryParams.append('start', params.start);
    if (params?.end) queryParams.append('end', params.end);
    if (params?.nextToken) queryParams.append('nextToken', params.nextToken);

    const url = `/activity/sleep${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.client.get(url);
    return response.data;
  }

  // Workout endpoints
  async getWorkoutById(workoutId: string): Promise<WhoopWorkout> {
    const response = await this.client.get(`/activity/workout/${workoutId}`);
    return response.data;
  }

  async getWorkoutCollection(params?: PaginationParams): Promise<WhoopWorkoutCollection> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.start) queryParams.append('start', params.start);
    if (params?.end) queryParams.append('end', params.end);
    if (params?.nextToken) queryParams.append('nextToken', params.nextToken);

    const url = `/activity/workout${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.client.get(url);
    return response.data;
  }

  // OAuth endpoints
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement offline'
    });
    
    if (state) {
      params.append('state', state);
    }
    
    return `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const formData = new URLSearchParams();
    formData.append('client_id', this.config.clientId);
    formData.append('client_secret', this.config.clientSecret);
    formData.append('code', code);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', this.config.redirectUri);

    const response = await axios.post('https://api.prod.whoop.com/oauth/oauth2/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    this.persist(response.data);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const formData = new URLSearchParams();
    formData.append('client_id', this.config.clientId);
    formData.append('client_secret', this.config.clientSecret);
    formData.append('refresh_token', refreshToken);
    formData.append('grant_type', 'refresh_token');

    const response = await axios.post('https://api.prod.whoop.com/oauth/oauth2/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    this.persist(response.data, refreshToken);
    return response.data;
  }
}
