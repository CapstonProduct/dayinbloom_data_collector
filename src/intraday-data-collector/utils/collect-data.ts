import axios, { AxiosError } from 'axios';
import { DateTime } from 'luxon';

interface IntradayDatasetItem {
  time: string;
  value: number;
}

interface IntradayData {
  steps_sum: number;
  distance_sum: number;
  calories_sum: number;
  heartrate_avg: number;
}

interface DeviceApiResponse {
  battery: string;
  batteryLevel: number;
  deviceVersion: string;
  features: any[];
  id: string;
  lastSyncTime: string;
  mac: string;
  type: string;
}

interface HeartApiResponse {
  'activities-heart-intraday': {
    dataset: IntradayDatasetItem[];
    datasetInterval: number;
    datasetType: string;
  };
}

interface StepsApiResponse {
  'activities-steps-intraday': {
    dataset: IntradayDatasetItem[];
    datasetInterval: number;
    datasetType: string;
  };
}

interface DistanceApiResponse {
  'activities-distance-intraday': {
    dataset: IntradayDatasetItem[];
    datasetInterval: number;
    datasetType: string;
  };
}

interface CaloriesApiResponse {
  'activities-calories-intraday': {
    dataset: IntradayDatasetItem[];
    datasetInterval: number;
    datasetType: string;
  };
}

interface CollectDataResult<T> {
  success: boolean;
  data: T;
}

export async function collectDeviceData(
  fitbitUserId: string,
  accessToken: string,
): Promise<CollectDataResult<DeviceApiResponse[]>> {
  try {
    const url = `https://api.fitbit.com/1/user/${fitbitUserId}/devices.json`;
    console.log(url);

    const deviceResponse = await axios.get<DeviceApiResponse[]>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return { success: true, data: deviceResponse.data };
  } catch (error) {
    console.error(
      error instanceof AxiosError ? error.response?.data : String(error),
    );
    return {
      success: false,
      data: [],
    };
  }
}

export async function collectData(
  fitbitUserId: string,
  accessToken: string,
  lastSyncTime: DateTime,
): Promise<CollectDataResult<IntradayData>> {
  // 15분 전 시간 계산
  // const fifteenMinutesBeforeSync = new Date(
  //   lastSyncTime.getTime() - 15 * 60 * 1000,
  // );
  const endTime = lastSyncTime;
  const startTime = endTime.minus({ minutes: 15 });

  // Intraday 데이터 수집 (15분 단위)
  const startTimeStr = startTime.toFormat('HH:mm');
  const endTimeStr = endTime.toFormat('HH:mm');
  const dateStr = endTime.toFormat('yyyy-MM-dd');

  console.log(
    `${dateStr} 일의 ${startTime} 부터 ${endTime} 까지의 유저 ${fitbitUserId} 데이터를 수집합니다.`,
  );

  const HR_API_URL = `https://api.fitbit.com/1/user/${fitbitUserId}/activities/heart/date/${dateStr}/${dateStr}/1min/time/${startTimeStr}/${endTimeStr}.json`;
  const STEPS_API_URL = `https://api.fitbit.com/1/user/${fitbitUserId}/activities/steps/date/${dateStr}/${dateStr}/1min/time/${startTimeStr}/${endTimeStr}.json`;
  const DISTANCES_API_URL = `https://api.fitbit.com/1/user/${fitbitUserId}/activities/distance/date/${dateStr}/${dateStr}/1min/time/${startTimeStr}/${endTimeStr}.json`;
  const CALORIES_API_URL = `https://api.fitbit.com/1/user/${fitbitUserId}/activities/calories/date/${dateStr}/${dateStr}/1min/time/${startTimeStr}/${endTimeStr}.json`;

  try {
    const [
      heartRateResponse,
      stepsResponse,
      distanceResponse,
      caloriesResponse,
    ] = await Promise.all([
      axios.get<HeartApiResponse>(HR_API_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      axios.get<StepsApiResponse>(STEPS_API_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      axios.get<DistanceApiResponse>(DISTANCES_API_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      axios.get<CaloriesApiResponse>(CALORIES_API_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    ]);

    // 일케하면 [{time: hh:mm, value: 44}] 일케나옴 애초에이거였음
    const processedHeartRate =
      heartRateResponse.data['activities-heart-intraday'].dataset;
    const processedSteps =
      stepsResponse.data['activities-steps-intraday'].dataset;
    const processedDistance =
      distanceResponse.data['activities-distance-intraday'].dataset;
    const processedCalories =
      caloriesResponse.data['activities-calories-intraday'].dataset;

    if (processedHeartRate.length <= 0) {
      console.error(processedHeartRate);
      throw new Error(
        `${fitbitUserId} 의 심박수 데이터가 없거나 넘어오지 않았습니다`,
      );
    }
    if (processedSteps.length <= 0) {
      console.error(processedHeartRate);
      throw new Error(
        `${fitbitUserId} 의 걸음수 데이터가 없거나 넘어오지 않았습니다`,
      );
    }
    if (processedDistance.length <= 0) {
      console.error(processedHeartRate);
      throw new Error(`${fitbitUserId} 의 거리 데이터가 넘어오지 않았습니다`);
    }
    if (processedCalories.length <= 0) {
      console.error(processedHeartRate);
      throw new Error(
        `${fitbitUserId} 의 소모 칼로리 데이터가 넘어오지 않았습니다`,
      );
    }

    // 합계와 평균 계산
    const steps_sum = processedSteps.reduce(
      (sum: number, item: IntradayDatasetItem) => sum + item.value,
      0,
    );
    const distance_sum = processedDistance.reduce(
      (sum: number, item: IntradayDatasetItem) => sum + item.value,
      0,
    );
    const calories_sum = processedCalories.reduce(
      (sum: number, item: IntradayDatasetItem) => sum + item.value,
      0,
    );
    const heartrate_avg =
      processedHeartRate.length > 0
        ? Math.round(
            processedHeartRate.reduce(
              (sum: number, item: IntradayDatasetItem) => sum + item.value,
              0,
            ) / processedHeartRate.length,
          )
        : 0;

    // 데이터 집계 및 반환
    const summary = {
      steps_sum,
      distance_sum, // 미터 단위 그대로 사용
      calories_sum,
      heartrate_avg,
    };

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    console.error(
      error instanceof AxiosError ? error.response?.data : String(error),
    );
    return {
      success: false,
      data: {} as IntradayData,
    };
  }
}
