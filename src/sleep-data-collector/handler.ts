import axios from 'axios';
import { Sequelize } from 'sequelize';
import { EventBridgeHandler } from 'aws-lambda';
import { FitbitSleepData, Users } from './models';
import getAccessToken from './utils/authentication';
import { DateTime } from 'luxon';

interface CollectSleepDataDetail {
  fitbit_user_id: string;
}

export const handler: EventBridgeHandler<
  'Collect Sleep Data',
  CollectSleepDataDetail,
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
  const SleepDataModel = FitbitSleepData.initModel(sequelize);

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
      console.error('사용자 정보를 찾을 수 없습니다.');
      await sequelize.close();
      return;
    } else {
      console.log(
        `유저 ${fitbit_user_id} 의 정보를 찾았습니다: ${JSON.stringify(user.toJSON())}`,
      );
    }

    const { userId, accessToken } = await getAccessToken(user.toJSON());
    if (!accessToken) {
      console.error(
        `유저 ${fitbit_user_id} 의 액세스 토큰을 찾을 수 없어서 데이터를 불러오지 못합니다.`,
      );
      await sequelize.close();
      return;
    }

    // 수면 데이터 수집
    const today = DateTime.now().setZone('Asia/Seoul').startOf('day');
    const yesterday = today.minus({ days: 1 });

    console.log(
      `오늘 날짜: ${today.toFormat('yyyy-MM-dd')} 의 유저 ${fitbit_user_id} 의 수면 데이터를 수집합니다.`,
    );
    const sleepResponse = await axios.get(
      `https://api.fitbit.com/1/user/-/sleep/date/${today.toFormat('yyyy-MM-dd')}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    console.log(
      `오늘 날짜: ${today} 의 유저 ${fitbit_user_id} 의 수면 데이터를 수집했습니다.`,
    );
    if (sleepResponse.data.sleep && sleepResponse.data.sleep.length > 0) {
      // 모든 수면 데이터 저장
      for (const sleep of sleepResponse.data.sleep) {
        const dateOfSleep = sleep.isMainSleep ? yesterday : today;
        const [result, created] = await SleepDataModel.findOrCreate({
          where: {
            startTime: sleep.startTime,
            endTime: sleep.endTime,
          },
          defaults: {
            user_id: userId,
            date: dateOfSleep.toFormat('yyyy-MM-dd'),
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
          },
        });

        if (created && result.isMainSleep) {
          // TODO 주수면 감지 트리거 발생
        }
      }

      console.log(
        `오늘 날짜: ${today} 의 유저 ${fitbit_user_id} 의 모든 수면 데이터를 데이터베이스에 생성하였습니다.`,
      );
      return {
        fitbit_user_id,
        sleep_date: today,
        sleep_count: sleepResponse.data.sleep.length,
      };
    } else {
      return {
        message: '해당 날짜의 수면 데이터가 없습니다.',
        fitbit_user_id,
        sleep_date: today,
      };
    }
  } catch (error) {
    await sequelize.close();
    console.error(error);
    return;
  }
};
