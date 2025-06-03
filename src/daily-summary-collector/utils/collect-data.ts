import axios, { AxiosError } from 'axios';
import { FitbitActivitySummaryAttributes } from '../models/fitbit_activity_summary';

type DailySummary = Omit<
  FitbitActivitySummaryAttributes,
  'id' | 'user_id' | 'date' | 'created_at'
>;

interface CollectDataResult {
  success: boolean;
  data: DailySummary;
}

export async function collectData(
  accessToken: string,
  date: string,
): Promise<CollectDataResult> {
  try {
    const activityResponse = await axios.get(
      `https://api.fitbit.com/1/user/-/activities/date/${date}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const summary = activityResponse.data.summary;
    return {
      success: true,
      data: {
        averageDailySteps: summary.steps,
        rhr: summary.restingHeartRate || 0,
        total_steps: summary.steps,
        total_distance: summary.distances[0]?.distance || 0,
        total_calories_out: summary.caloriesOut,
        total_activity_calories: summary.activityCalories,
        caloriesBMR: summary.caloriesBMR,
        marginalCalories: summary.marginalCalories,
        sedentary_minutes: summary.sedentaryMinutes,
        lightly_active_minutes: summary.lightlyActiveMinutes,
        fairly_active_minutes: summary.fairlyActiveMinutes,
        very_active_minutes: summary.veryActiveMinutes,
        out_of_range_minutes: summary.heartRateZones[0]?.minutes || 0,
        fat_burn_minutes: summary.heartRateZones[1]?.minutes || 0,
        cardio_minutes: summary.heartRateZones[2]?.minutes || 0,
        peak_minutes: summary.heartRateZones[3]?.minutes || 0,
        out_of_range_calories: summary.heartRateZones[0]?.caloriesOut || 0,
        fat_burn_calories: summary.heartRateZones[1]?.caloriesOut || 0,
        cardio_calories: summary.heartRateZones[2]?.caloriesOut || 0,
        peak_calories: summary.heartRateZones[3]?.caloriesOut || 0,
      },
    };
  } catch (error) {
    console.error(
      error instanceof AxiosError ? error.response?.data : String(error),
    );
    return {
      success: false,
      data: {} as DailySummary,
    };
  }
}
