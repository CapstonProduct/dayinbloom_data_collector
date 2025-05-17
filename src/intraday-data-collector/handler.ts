import axios from 'axios';
import { Sequelize } from 'sequelize';
// import { DeviceData, IntradayData, FitbitToken } from './db/models';
import { EventBridgeHandler } from 'aws-lambda';
import { Users, FitbitDevice, FitbitActivityData } from './models';
import { isTokenExpired } from './utils/authentication';

interface CollectIntradayDataDetail {
  fitbit_user_id: string;
}

interface IntradayDatasetItem {
  time: string;
  value: number;
}

interface IntradayData {
  date: string;
  summary: {
    date: string;
    steps_sum: any;
    distance_sum: any;
    calories_sum: any;
    heartrate_avg: number;
  };
  last_sync_time: string;
  time_range: {
    start: string;
    end: string;
  };
}

export const handler: EventBridgeHandler<
  "Collect last 15 minutes of User's data",
  CollectIntradayDataDetail,
  any
> = async event => {
  const { fitbit_user_id } = event.detail;

  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const UserModel = Users.initModel(sequelize);
  const DeviceModel = FitbitDevice.initModel(sequelize);
  const FitbitActivityDataModel = FitbitActivityData.initModel(sequelize);

  try {
    // DB에서 토큰 정보 조회
    const user = await UserModel.findOne({
      where: { encodedId: fitbit_user_id },
      attributes: ['id', 'encodedId', 'access_token', 'access_token_expires'],
    });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: '사용자 정보를 찾을 수 없습니다.',
          fitbit_user_id,
        }),
      };
    }

    let accessToken: string;
    const { access_token, access_token_expires } = user;
    if (!access_token || isTokenExpired(access_token_expires)) {
      try {
        const { data } = await axios.post(
          'https://dayinbloom.shop/auth/oauth/token',
          {
            userId: fitbit_user_id,
          },
        );
        accessToken = data.accessToken;
      } catch (error) {
        console.error(error);
        return;
      }
    } else {
      accessToken = access_token;
    }

    // 기기 데이터 수집
    const deviceResponse = await axios.get(
      'https://api.fitbit.com/1/user/-/devices.json',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // 마지막 동기화 시간 찾기
    let lastSyncTimeDevice = new Date(0);
    for (const device of deviceResponse.data) {
      const deviceSyncTime = new Date(device.lastSyncTime);
      if (deviceSyncTime > lastSyncTimeDevice) {
        lastSyncTimeDevice = deviceSyncTime;
      }
    }

    // 15분 전 시간 계산
    const fifteenMinutesBeforeSync = new Date(
      lastSyncTimeDevice.getTime() - 15 * 60 * 1000,
    );

    // 기기 데이터 저장
    for (const device of deviceResponse.data) {
      await DeviceModel.create({
        user_id: user.id,
        device_id: device.id,
        device_version: device.deviceVersion,
        // battery: device.battery,
        battery_level: device.batteryLevel,
        last_sync_time: device.lastSyncTime,
      });
    }

    // Intraday 데이터 수집 (15분 단위)
    const startTime = fifteenMinutesBeforeSync.toTimeString().split(' ')[0];
    const endTime = lastSyncTimeDevice.toTimeString().split(' ')[0];
    const date = lastSyncTimeDevice.toISOString().split('T')[0];

    // 심박수 데이터
    const heartRateResponse = await axios.get(
      `https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d/15min/time/${startTime}/${endTime}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // 걸음 수 데이터
    const stepsResponse = await axios.get(
      `https://api.fitbit.com/1/user/-/activities/steps/date/${date}/1d/15min/time/${startTime}/${endTime}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // 거리 데이터
    const distanceResponse = await axios.get(
      `https://api.fitbit.com/1/user/-/activities/distance/date/${date}/1d/15min/time/${startTime}/${endTime}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // 칼로리 데이터
    const caloriesResponse = await axios.get(
      `https://api.fitbit.com/1/user/-/activities/calories/date/${date}/1d/15min/time/${startTime}/${endTime}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // 일케하면 [{time: hh:mm, value: 44}] 일케나옴 애초에이거였음
    const processedHeartRate =
      heartRateResponse.data['activities-heart-intraday'].dataset;
    const processedSteps =
      stepsResponse.data['activities-steps-intraday'].dataset;
    const processedDistance =
      distanceResponse.data['activities-distance-intraday'].dataset;
    const processedCalories =
      caloriesResponse.data['activities-calories-intraday'].dataset;

    // 모든 데이터를 시간별로 정렬
    const timeMap = new Map();

    processedSteps.forEach((item: IntradayDatasetItem) => {
      if (!timeMap.has(item.time)) {
        timeMap.set(item.time, {});
      }
      timeMap.get(item.time).steps = item.value;
    });

    processedDistance.forEach((item: IntradayDatasetItem) => {
      if (!timeMap.has(item.time)) {
        timeMap.set(item.time, {});
      }
      timeMap.get(item.time).distance = item.value;
    });

    processedCalories.forEach((item: IntradayDatasetItem) => {
      if (!timeMap.has(item.time)) {
        timeMap.set(item.time, {});
      }
      timeMap.get(item.time).calories = item.value;
    });

    processedHeartRate.forEach((item: IntradayDatasetItem) => {
      if (!timeMap.has(item.time)) {
        timeMap.set(item.time, {});
      }
      timeMap.get(item.time).heartRate = item.value;
    });

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
      date: date,
      steps_sum,
      distance_sum, // 미터 단위 그대로 사용
      calories_sum,
      heartrate_avg,
    };

    // 날짜만 추출 (YYYY-MM-DD 형식)
    const dateOnly = date.split('T')[0];

    // 한국 시간대로 날짜 설정
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstDateString = kstNow.toISOString().split('T')[0];

    // FIXME date는 '주수면 기준' 으로 수집 일자보다 하루 이전이여야 할 수 있음:
    // 가장 최근 수면 데이터 (fitbit_sleep_data.endTime < last_sync_time ORDER BY endTime LIMIT 1)
    // 의 isMainSleep = 0 일 경우,
    const result: IntradayData = {
      date: dateOnly, // 날짜만 사용
      summary,
      last_sync_time: new Date(
        lastSyncTimeDevice.getTime() + 9 * 60 * 60 * 1000,
      )
        .toISOString()
        .replace('Z', '+09:00'), // UTC를 KST로 변환
      time_range: {
        start: new Date(fifteenMinutesBeforeSync.getTime() + 9 * 60 * 60 * 1000)
          .toISOString()
          .replace('Z', '+09:00'),
        end: new Date(lastSyncTimeDevice.getTime() + 9 * 60 * 60 * 1000)
          .toISOString()
          .replace('Z', '+09:00'),
      },
    };

    // RDS에 저장
    const newActivityData = await FitbitActivityDataModel.create({
      user_id: user.id,
      date: new Date(date),
      steps: summary.steps_sum,
      distance_km: summary.distance_sum,
      calories_total: summary.calories_sum,
      heart_rate: summary.heartrate_avg,
    });

    await sequelize.close();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: '15분 단위 데이터가 성공적으로 수집되었습니다.',
        fitbit_user_id,
        time_range: result.time_range,
        raw_data: newActivityData,
      }),
    };
  } catch (error) {
    await sequelize.close();
    console.error('Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: '데이터 수집 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
