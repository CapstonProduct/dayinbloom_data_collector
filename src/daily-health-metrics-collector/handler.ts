import axios from 'axios';
import { EventBridgeHandler } from 'aws-lambda';
import { Sequelize } from 'sequelize';
import { FitbitHealthMetrics, Users } from './models';
import { isTokenExpired } from './utils/authentication';
import { DateTime } from 'luxon';

interface CollectHealthMetricsDetail {
  fitbit_user_id: string;
}

export const handler: EventBridgeHandler<
  'Collect Health Metrics of a User Once Per Day',
  CollectHealthMetricsDetail,
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
  const FitbitHealthMetricsModel = FitbitHealthMetrics.initModel(sequelize);

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

    const today: string = DateTime.now()
      .setZone('Asia/Seoul')
      .toFormat('yyyy-MM-dd');

    // 건강 지표 데이터 수집
    const { data: healthData } = await axios.get(
      `https://api.fitbit.com/1/user/-/health/metrics/date/${today}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    await FitbitHealthMetricsModel.create({
      user_id: user.id,
      date: new Date(today),
      daily_hrv: healthData.daily_hrv,
      sleep_hrv: healthData.sleep_hrv,
      breathing_rate: healthData.breathing_rate,
      skin_temperature: healthData.skin_temperature,
      stress_score: healthData.stress_score,
      hrv_contribution: healthData.components?.hrv_contribution,
      rhr_contribution: healthData.components?.rhr_contribution,
      sleep_contribution: healthData.components?.sleep_contribution,
      created_at: new Date(),
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: '데이터가 성공적으로 수집되었습니다.',
        fitbit_user_id,
      }),
    };
  } catch (error) {
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
