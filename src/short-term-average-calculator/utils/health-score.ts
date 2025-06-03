interface ActivitySummary {
  avg_steps: number;
  avg_calories_total: number;
  avg_distance_km: number;
  avg_heart_rate: number;
  avg_resting_heart_rate: number;
  avg_sedentary_minutes: number;
  avg_lightly_active_minutes: number;
  avg_fairly_active_minutes: number;
  avg_very_active_minutes: number;
}

interface SleepData {
  avg_total_sleep_hours: number;
  avg_deep_sleep_hours: number;
  avg_light_sleep_hours: number;
  avg_rem_sleep_hours: number;
  avg_awake_hours: number;
  quality: number;
  efficiency: number;
}

interface HealthMetrics {
  avg_sleep_heart_rate: number;
  avg_hrv: number;
  avg_rhr: number;
  avg_respiratory_rate: number;
  avg_skin_temperature: number;
  avg_stress_score: number;
}

export function calculateHealthScore(
  summary: ActivitySummary,
  sleep: SleepData,
  metrics: HealthMetrics
) {
  // 🟢 기준값 설정 (WHO/CDC 권고 기준 참고)
  const STEP_GOAL = 7000;
  const CALORIE_GOAL = 2200;
  const SLEEP_MIN = 420; // 7시간 = 420분
  const HRV_MIN = 20; // HRV 기준은 다양하지만 노년층에서 20+이면 양호
  const RHR_MAX = 70; // 안정 심박수는 60~70
  const STRESS_MAX = 30;
  const SEDENTARY_MAX = 600; // 10시간 미만

  // ① 활동 점수 (30점)
  let stepScore = Math.min(summary.avg_steps / STEP_GOAL, 1) * 10;
  let calorieScore =
    Math.min(summary.avg_calories_total / CALORIE_GOAL, 1) * 10;
  let activityScore = Math.min(summary.avg_very_active_minutes / 30, 1) * 5;
  let sedentaryScore = summary.avg_sedentary_minutes < SEDENTARY_MAX ? 5 : 0;
  let activityTotal = stepScore + calorieScore + activityScore + sedentaryScore;

  // ② 수면 점수 (30점)
  let sleepScore =
    Math.min((sleep.avg_total_sleep_hours * 60) / SLEEP_MIN, 1) * 10;
  let deepSleepScore = Math.min(sleep.avg_deep_sleep_hours / 1.5, 1) * 5;
  let qualityScore = sleep.quality;
  let efficiencyScore = Math.min(sleep.efficiency / 90, 1) * 5;
  let awakePenalty = sleep.avg_awake_hours <= 2 ? 5 : 2;
  let sleepTotal =
    sleepScore + deepSleepScore + qualityScore + efficiencyScore + awakePenalty;

  // ③ 건강지표 점수 (40점)
  let hrvScore = Math.min(metrics.avg_hrv / HRV_MIN, 1) * 10;
  let rhrScore = metrics.avg_rhr <= RHR_MAX ? 10 : 5;
  let breathScore =
    metrics.avg_respiratory_rate >= 12 && metrics.avg_respiratory_rate <= 20
      ? 5
      : 2;
  let tempScore = Math.abs(metrics.avg_skin_temperature) <= 0.3 ? 5 : 2;
  let stressScore = metrics.avg_stress_score <= STRESS_MAX ? 10 : 5;
  let healthTotal = hrvScore + rhrScore + breathScore + tempScore + stressScore;

  // 🟡 종합 점수 계산
  let totalScore = activityTotal + sleepTotal + healthTotal;
  return {
    activityScore: activityTotal,
    sleepScore: sleepTotal,
    metricsScore: healthTotal,
    totalScore: totalScore,
  };
}
