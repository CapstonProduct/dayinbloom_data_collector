import { Sequelize, Op } from 'sequelize';
import { EventBridgeHandler } from 'aws-lambda';
import {
  FitbitAverage as _FitbitAverage,
  FitbitActivitySummary as _FitbitActivitySummary,
  FitbitSleepData as _FitbitSleepData,
  FitbitHealthMetrics as _FitbitHealthMetrics,
  Users as _Users,
} from './models';
import calculateDailyAverage from './utils/daily-average';
import { DateTime } from 'luxon';
import { calculateRangedAverage } from './utils/ranged-average';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';

interface Detail {
  fitbit_user_id: string;
  date: string;
}

export const handler: EventBridgeHandler<
  'Main Sleep Detected',
  Detail,
  any
> = async event => {
  console.log(`이벤트를 전송받았습니다: `);
  console.log(event);

  const { fitbit_user_id, date } = event.detail;
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: false,
  });

  const User = _Users.initModel(sequelize);
  const FitbitAverage = _FitbitAverage.initModel(sequelize);
  const FitbitActivitySummary = _FitbitActivitySummary.initModel(sequelize);
  const FitbitSleepData = _FitbitSleepData.initModel(sequelize);
  const FitbitHealthMetrics = _FitbitHealthMetrics.initModel(sequelize);

  try {
    console.log(`유저 정보를 조회합니다: `);
    const user = await User.findOne({
      where: { encodedId: fitbit_user_id },
      attributes: ['id'],
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
      console.log(
        `유저 ${fitbit_user_id} 의 정보를 찾았습니다: ${JSON.stringify(user.toJSON())}`,
      );
    }
    const { id: userId } = user.toJSON();

    const today = DateTime.now().setZone('UTC+9').startOf('day');
    const todayStr = today.toFormat('yyyy-MM-dd');
    const yesterdayStr = today.minus({ days: 1 }).toFormat('yyyy-MM-dd');

    // 오늘 평균 계산을 위한 raw data(activities, sleep, metrics) 조회
    console.log(`오늘 날짜: ${todayStr}`);
    console.log(`어제 날짜: ${yesterdayStr} 의 데이터를 조회합니다.`);
    const [yesterdayActivityData, yesterdaySleepData, yesterdayHealthMetrics] =
      await Promise.all([
        FitbitActivitySummary.findOne({
          where: {
            user_id: userId,
            date: yesterdayStr,
          },
        }),
        FitbitSleepData.findOne({
          where: {
            user_id: userId,
            date: yesterdayStr,
            isMainSleep: true,
          },
        }),
        FitbitHealthMetrics.findOne({
          where: {
            user_id: userId,
            date: yesterdayStr,
          },
        }),
      ]);

    // 오늘의 데이터 평균 계산
    console.log(
      `어제 날짜: ${yesterdayStr} 의 데이터를 조회했습니다. 평균을 계산합니다: `,
    );
    const yesterdayAverage = calculateDailyAverage(
      yesterdayActivityData,
      yesterdaySleepData,
      yesterdayHealthMetrics,
    );

    // 최근 30일치 평균 데이터 조회
    const monthlyAveragesQueryResult = await FitbitAverage.findAll({
      where: {
        user_id: userId,
        period_type: '1D',
        recorded_at: {
          [Op.gte]: today.minus({ days: 29 }).toFormat('yyyy-MM-dd'),
          [Op.lte]: today.minus({ days: 1 }).toFormat('yyyy-MM-dd'),
        },
      },
      order: [['created_at', 'DESC']],
      limit: 30,
    });
    console.log(
      `최근 30일치 평균 데이터를 조회했습니다. 데이터 총 ${monthlyAveragesQueryResult.length} 개`,
    );

    // 7일치 평균은 7일 이전의 평균인것임
    const weeklyAveragesQueryResult = monthlyAveragesQueryResult.filter(
      ({ recorded_at }) =>
        new Date(recorded_at) >= new Date(today.minus({ days: 7 }).valueOf()),
    );
    console.log(
      `최근 7일치 평균 데이터를 조회했습니다. 데이터 총 ${weeklyAveragesQueryResult.length} 개`,
    );

    const newWeeklyAverage = calculateRangedAverage(
      weeklyAveragesQueryResult,
      yesterdayAverage,
    );
    const newMonthlyAverage = calculateRangedAverage(
      monthlyAveragesQueryResult,
      yesterdayAverage,
    );

    // 모든 저장 작업 완료 대기
    const transaction = await sequelize.transaction();
    try {
      await FitbitAverage.create(
        {
          ...yesterdayAverage,
          user_id: userId,
          period_type: '1D',
          recorded_at: today.toFormat('yyyy-MM-dd'),
        },
        { transaction },
      );
      await FitbitAverage.create(
        {
          ...newWeeklyAverage,
          user_id: userId,
          period_type: '7D',
          recorded_at: today.toFormat('yyyy-MM-dd'),
        },
        { transaction },
      );
      await FitbitAverage.create(
        {
          ...newMonthlyAverage,
          user_id: userId,
          period_type: '30D',
          recorded_at: today.toFormat('yyyy-MM-dd'),
        },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw new Error('단기 평균 데이터 반영 중 오류가 발생했습니다.');
    }

    await sequelize.close();

    const ebClient = new EventBridgeClient({ region: 'ap-northeast-2' });
    const command = new PutEventsCommand({
      Entries: [
        {
          EventBusName: 'dayinbloom-event-bus',
          Source: 'dayinbloom-short-term-average-calculator',
          DetailType: 'Report Data Ready',
          Detail: JSON.stringify({ fitbit_user_id, date: todayStr }),
        },
      ],
    });

    const { FailedEntryCount, Entries } = await ebClient.send(command);
    if (FailedEntryCount && FailedEntryCount > 0) {
      console.error(`리포트 데이터 준비됨 트리거를 발생시키는데 실패했습니다:`);
      if (Entries) {
        console.error(Entries[0].ErrorMessage);
      }
    }

    return {
      message: '누적 평균 계산이 성공적으로 완료되었습니다.',
      fitbit_user_id,
      date: todayStr,
      period_types: '1D, 7D, 30D',
    };
  } catch (error) {
    await sequelize.close();
    console.error('Error:', error);
    return {
      message: '데이터 평균 계산 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
