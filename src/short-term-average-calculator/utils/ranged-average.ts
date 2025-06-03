import { AverageResult } from './daily-average';
import { FitbitAverage as _FitbitAverage } from '../models';

/**
 * 일주일(7D) 평균 계산
 * @param oldAverages 예전 평균들: 7일치의 경우 2일전~7일전, 30일치의 경우 2일전~30일전
 * @param newData 어제 평균
 */
export function calculateRangedAverage(
  oldAverages: AverageResult[],
  newData: AverageResult,
): AverageResult {
  const dataCount = oldAverages.length + 1; // 새 데이터 하나 추가되니까
  const averageTotal: AverageResult = oldAverages.reduce(
    (accumulator, item) => {
      return {
        // activity data
        avg_steps: (accumulator.avg_steps || 0) + (item.avg_steps || 0),
        avg_calories_total:
          (accumulator.avg_calories_total || 0) +
          (item.avg_calories_total || 0),
        avg_distance_km:
          (accumulator.avg_distance_km || 0) + (item.avg_distance_km || 0),
        avg_heart_rate:
          (accumulator.avg_heart_rate || 0) + (item.avg_heart_rate || 0),
        avg_resting_heart_rate:
          (accumulator.avg_resting_heart_rate || 0) +
          (item.avg_resting_heart_rate || 0),
        avg_sedentary_minutes:
          (accumulator.avg_sedentary_minutes || 0) +
          (item.avg_sedentary_minutes || 0),
        avg_lightly_active_minutes:
          (accumulator.avg_lightly_active_minutes || 0) +
          (item.avg_lightly_active_minutes || 0),
        avg_fairly_active_minutes:
          (accumulator.avg_fairly_active_minutes || 0) +
          (item.avg_fairly_active_minutes || 0),
        avg_very_active_minutes:
          (accumulator.avg_very_active_minutes || 0) +
          (item.avg_very_active_minutes || 0),
        avg_activity_duration:
          (accumulator.avg_activity_duration || 0) +
          (item.avg_activity_duration || 0),
        // sleep data
        avg_total_sleep_hours:
          (accumulator.avg_total_sleep_hours || 0) +
          (item.avg_total_sleep_hours || 0),
        avg_deep_sleep_hours:
          (accumulator.avg_deep_sleep_hours || 0) +
          (item.avg_deep_sleep_hours || 0),
        avg_light_sleep_hours:
          (accumulator.avg_light_sleep_hours || 0) +
          (item.avg_light_sleep_hours || 0),
        avg_rem_sleep_hours:
          (accumulator.avg_rem_sleep_hours || 0) +
          (item.avg_rem_sleep_hours || 0),
        avg_awake_hours:
          (accumulator.avg_awake_hours || 0) + (item.avg_awake_hours || 0),
        // health metrics
        avg_sleep_heart_rate:
          (accumulator.avg_sleep_heart_rate || 0) +
          (item.avg_sleep_heart_rate || 0),
        avg_hrv: (accumulator.avg_hrv || 0) + (item.avg_hrv || 0),
        avg_rhr: (accumulator.avg_rhr || 0) + (item.avg_rhr || 0),
        avg_respiratory_rate:
          (accumulator.avg_respiratory_rate || 0) +
          (item.avg_respiratory_rate || 0),
        avg_skin_temperature:
          (accumulator.avg_skin_temperature || 0) +
          (item.avg_skin_temperature || 0),
        avg_stress_score:
          (accumulator.avg_stress_score || 0) + (item.avg_stress_score || 0),
        // scores
        avg_activity_score:
          (accumulator.avg_activity_score || 0) +
          (item.avg_activity_score || 0),
        avg_sleep_score:
          (accumulator.avg_sleep_score || 0) + (item.avg_sleep_score || 0),
        avg_metrics_score:
          (accumulator.avg_metrics_score || 0) + (item.avg_metrics_score || 0),
        avg_total_score:
          (accumulator.avg_total_score || 0) + (item.avg_total_score || 0),
      };
    },
    newData,
  );
  for (const [key, value] of Object.entries(averageTotal)) {
    // console.log(`${key}: ${value}`);
    averageTotal[key as keyof AverageResult] = value / dataCount;
  }
  return averageTotal;
}
