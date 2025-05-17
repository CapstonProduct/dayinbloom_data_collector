import axios from 'axios';
import { Sequelize } from 'sequelize';
import { EventBridgeHandler } from 'aws-lambda';
import { FitbitSleepData, Users } from './models';
import { isTokenExpired } from './utils/authentication';

interface CollectSleepDataDetail {
  fitbit_user_id: string;
}

export const handler: EventBridgeHandler<
  'Collect Sleep Data of a User, 5 times per day',
  CollectSleepDataDetail,
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
  const SleepDataModel = FitbitSleepData.initModel(sequelize);

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

    const today = new Date().toISOString().split('T')[0];

    // 수면 데이터 수집
    const sleepResponse = await axios.get(
      `https://api.fitbit.com/1/user/-/sleep/date/${today}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (sleepResponse.data.sleep && sleepResponse.data.sleep.length > 0) {
      // 모든 수면 데이터 저장
      for (const sleep of sleepResponse.data.sleep) {
        await SleepDataModel.create({
          user_id: user.id,
          date: today,
          startTime: sleep.startTime,
          endTime: sleep.endTime,
          total_sleep_minutes: sleep.minutesAsleep,
          deep_sleep_hours: sleep.stages?.deep || 0,
          light_sleep_hours: sleep.stages?.light || 0,
          rem_sleep_hours: sleep.stages?.rem || 0,
          minutesAwake: sleep.minutesAwake,
          awakeningsCount: sleep.awakeningsCount,
          awakeCount: sleep.levels?.summary?.wake?.count || 0,
          awakeDuration: sleep.levels?.summary?.wake?.minutes || 0,
          restlessCount: sleep.restlessCount,
          restlessDuration: sleep.restlessDuration,
          logId: sleep.logId,
          timeinBed: sleep.timeInBed,
          minutesAsleep: sleep.minutesAsleep,
          efficiency: sleep.efficiency,
          duration: sleep.duration,
          quality: sleep.quality,
          isMainSleep: sleep.isMainSleep,
          created_at: new Date(),
        });
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: '모든 수면 데이터가 성공적으로 수집되었습니다.',
          fitbit_user_id,
          sleep_date: today,
          sleep_count: sleepResponse.data.sleep.length,
        }),
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: '해당 날짜의 수면 데이터가 없습니다.',
          fitbit_user_id,
          sleep_date: today,
        }),
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: '수면 데이터 수집 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
