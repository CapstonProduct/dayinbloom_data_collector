import axios from 'axios';
import { EventBridgeHandler } from 'aws-lambda';
import { Sequelize } from 'sequelize';
import { FitbitHealthMetrics, Users } from './models';
import getAccessToken from './utils/authentication';
import { DateTime } from 'luxon';
import calculateScores from './utils/scores';

interface CollectHealthMetricsDetail {
  fitbit_user_id: string;
}

export const handler: EventBridgeHandler<
  'Collect Health Metrics',
  CollectHealthMetricsDetail,
  any
> = async event => {
  console.log(`이벤트를 전송받았습니다: `);
  console.log(event);

  const { fitbit_user_id } = event.detail;

  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: false,
  });

  const UserModel = Users.initModel(sequelize);
  const FitbitHealthMetricsModel = FitbitHealthMetrics.initModel(sequelize);

  try {
    console.log(`유저 정보를 조회합니다: `);
    const user = await UserModel.findOne({
      where: { encodedId: fitbit_user_id },
      attributes: [
        'id',
        'encodedId',
        'access_token',
        'access_token_expires',
        'refresh_token',
      ],
    });
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: '사용자 정보를 찾을 수 없습니다.',
          fitbit_user_id,
        }),
      };
    } else {
      console.log(`유저 ${fitbit_user_id} 의 정보를 찾았습니다.`);
    }

    const { userId, accessToken } = await getAccessToken(user.toJSON());
    if (!accessToken) {
      console.error(
        `유저 ${fitbit_user_id} 의 액세스 토큰을 찾을 수 없어서 데이터를 불러오지 못합니다.`,
      );
      await sequelize.close();
      return;
    }

    const today = DateTime.now().setZone('Asia/Seoul').startOf('day');
    const yesterday = today.minus({ days: 1 }).toFormat('yyyy-MM-dd');

    console.log(`오늘 날짜: ${today.toFormat('yyyy-MM-dd')}`);
    console.log(
      `어제: ${yesterday} 의 유저 ${fitbit_user_id} 의 건강 지표 데이터를 수집합니다.`,
    );

    const [
      hrvResponse,
      breathingRateResponse,
      tempResponse,
      heartRateResponse,
      sleepResponse,
    ] = await Promise.all([
      axios.get(`https://api.fitbit.com/1/user/-/hrv/date/${yesterday}.json`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      axios.get(`https://api.fitbit.com/1/user/-/br/date/${yesterday}.json`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      axios.get(
        `https://api.fitbit.com/1/user/-/temp/skin/date/${yesterday}.json`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
      axios.get(
        `https://api.fitbit.com/1/user/-/activities/heart/date/${yesterday}.json`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
      axios.get(
        `https://api.fitbit.com/1/user/-/sleep/date/${yesterday}.json`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
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

    console.log(
      `어제: ${yesterday} 의 유저 ${fitbit_user_id} 의 건강 지표 데이터를 수집했습니다.`,
    );

    console.log(
      `어제: ${yesterday} 의 유저 ${fitbit_user_id} 의 건강 지표 데이터를 생성합니다.`,
    );
    await FitbitHealthMetricsModel.create({
      user_id: userId,
      date: new Date(yesterday),
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
      created_at: new Date(),
    });
    console.log(
      `어제: ${yesterday} 의 유저 ${fitbit_user_id} 의 건강 지표 데이터를 생성하였습니다.`,
    );
  } catch (error) {
    console.error('Error:', error);
  }
};
