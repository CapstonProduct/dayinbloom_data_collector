import axios, { AxiosError } from 'axios';
import calculateScores from './scores';
import { FitbitHealthMetricsAttributes } from '../models/fitbit_health_metrics';

type HealthMetrics = Omit<
  FitbitHealthMetricsAttributes,
  'id' | 'user_id' | 'date' | 'created_at'
>;

interface CollectDataResult {
  success: boolean;
  data: HealthMetrics;
}

export async function collectData(
  accessToken: string,
  date: string,
): Promise<CollectDataResult> {
  try {
    const [
      hrvResponse,
      breathingRateResponse,
      tempResponse,
      heartRateResponse,
      sleepResponse,
    ] = await Promise.all([
      axios.get(`https://api.fitbit.com/1/user/-/hrv/date/${date}.json`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      axios.get(`https://api.fitbit.com/1/user/-/br/date/${date}.json`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      axios.get(`https://api.fitbit.com/1/user/-/temp/skin/date/${date}.json`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      axios.get(
        `https://api.fitbit.com/1/user/-/activities/heart/date/${date}.json`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
      axios.get(`https://api.fitbit.com/1/user/-/sleep/date/${date}.json`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    ]);

    const dailyHrv = hrvResponse.data?.hrv?.[0]?.value?.dailyRmssd || 0;
    const restingHeartRate =
      heartRateResponse.data?.['activities-heart']?.[0]?.value
        ?.restingHeartRate || 0;
    const deepSleepMinutes =
      sleepResponse.data?.sleep?.[0]?.levels?.summary?.deep?.minutes || 0;

    const {
      stress_score,
      hrv_contribution,
      rhr_contribution,
      sleep_contribution,
    } = calculateScores(dailyHrv, restingHeartRate, deepSleepMinutes);

    return {
      success: true,
      data: {
        daily_hrv: dailyHrv,
        sleep_hrv: hrvResponse.data?.hrv?.[0]?.value?.nightlyRmssd || 0,
        breathing_rate:
          breathingRateResponse.data?.br?.[0]?.value?.breathingRate || 0,
        skin_temperature:
          tempResponse.data?.tempSkin?.[0]?.value?.nightlyRelative || 0,
        stress_score: stress_score,
        hrv_contribution: hrv_contribution,
        rhr_contribution: rhr_contribution,
        sleep_contribution: sleep_contribution,
      },
    };
  } catch (error) {
    console.error(
      error instanceof AxiosError ? error.response?.data : String(error),
    );
    return {
      success: false,
      data: {} as HealthMetrics,
    };
  }
}
