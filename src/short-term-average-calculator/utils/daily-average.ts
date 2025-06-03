import {
  FitbitActivitySummary,
  FitbitSleepData,
  FitbitHealthMetrics,
} from '../models';
import { calculateHealthScore } from './health-score';
import { FitbitAverageAttributes } from '../models/fitbit_average';

export type AverageResult = Omit<
  FitbitAverageAttributes,
  'id' | 'user_id' | 'period_type' | 'recorded_at' | 'created_at' | 'updated_at'
>;

// 오늘의 데이터 평균 계산 함수
export default function calculateDailyAverage(
  yesterdayActivityData: FitbitActivitySummary | null,
  yesterdaySleepData: FitbitSleepData | null,
  yesterdayHealthMetrics: FitbitHealthMetrics | null,
): AverageResult {
  if (yesterdayActivityData && yesterdaySleepData && yesterdayHealthMetrics) {
    // 오늘의 데이터를 객체로 반환
    const {
      total_steps,
      total_distance,
      total_activity_calories,
      rhr,
      lightly_active_minutes,
      fairly_active_minutes,
      very_active_minutes,
      sedentary_minutes,
    } = yesterdayActivityData.toJSON();
    const {
      total_sleep_minutes,
      deep_sleep_hours,
      light_sleep_hours,
      rem_sleep_hours,
      minutesAwake,
      efficiency,
      quality,
    } = yesterdaySleepData.toJSON();
    const {
      sleep_hrv,
      breathing_rate,
      daily_hrv,
      skin_temperature,
      stress_score,
    } = yesterdayHealthMetrics.toJSON();

    const activityData = {
      avg_steps: total_steps || 0,
      avg_calories_total: total_activity_calories || 0,
      avg_distance_km: total_distance || 0,
      avg_heart_rate: rhr || 0,
      avg_resting_heart_rate: rhr || 0,
      avg_sedentary_minutes: sedentary_minutes || 0,
      avg_lightly_active_minutes: lightly_active_minutes || 0,
      avg_fairly_active_minutes: fairly_active_minutes || 0,
      avg_very_active_minutes: very_active_minutes || 0,
      avg_activity_duration:
        (sedentary_minutes || 0) +
        (lightly_active_minutes || 0) +
        (fairly_active_minutes || 0) +
        (very_active_minutes || 0),
    };
    const sleepData = {
      avg_total_sleep_hours: (total_sleep_minutes || 0) / 60,
      avg_deep_sleep_hours: deep_sleep_hours || 0,
      avg_light_sleep_hours: light_sleep_hours || 0,
      avg_rem_sleep_hours: rem_sleep_hours || 0,
      avg_awake_hours: (minutesAwake || 0) / 60,
    };
    const healthMetrics = {
      avg_sleep_heart_rate: sleep_hrv || 0,
      avg_hrv: daily_hrv || 0,
      avg_rhr: rhr || 0,
      avg_respiratory_rate: breathing_rate || 0,
      avg_skin_temperature: skin_temperature || 0,
      avg_stress_score: stress_score || 0,
    };

    const { activityScore, sleepScore, metricsScore, totalScore } =
      calculateHealthScore(
        activityData,
        { ...sleepData, quality, efficiency },
        healthMetrics,
      );

    return {
      // activity data
      ...activityData,
      // sleep data
      ...sleepData,
      // health metrics
      ...healthMetrics,
      // health score,
      avg_activity_score: activityScore,
      avg_sleep_score: sleepScore,
      avg_metrics_score: metricsScore,
      avg_total_score: totalScore,
    };
  } else {
    throw new Error('Yesterday data was not found');
  }
}
