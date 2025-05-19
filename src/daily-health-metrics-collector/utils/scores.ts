export default function calculateScores(
  hrv: number,
  rhr: number,
  deepSleepMinutes: number,
) {
  // 기준값 설정
  const BASE_HRV = 40.0; // 평균 HRV (RMSSD)
  const BASE_RHR = 65.0; // 평균 안정시 심박수
  const BASE_DEEP_SLEEP = 90; // 분 단위 깊은 수면 시간

  // 각 요소별 점수 계산 (0~33점씩 배분)
  const hrvScore = Math.min(Math.max((hrv / BASE_HRV) * 33, 0), 33); // 높을수록 좋음
  const rhrScore = Math.min(Math.max((BASE_RHR / rhr) * 33, 0), 33); // 낮을수록 좋음
  const sleepScore = Math.min(
    Math.max((deepSleepMinutes / BASE_DEEP_SLEEP) * 33, 0),
    33,
  );

  const totalScore = hrvScore + rhrScore + sleepScore;
  const stressScore = Math.round(100 - totalScore); // 낮을수록 스트레스 적음

  return {
    stress_score: stressScore,
    hrv_contribution: Math.round(hrvScore),
    rhr_contribution: Math.round(rhrScore),
    sleep_contribution: Math.round(sleepScore),
  };
}
