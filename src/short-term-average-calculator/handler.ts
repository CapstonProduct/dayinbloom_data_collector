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

interface CalculateShortTermAverageDetail {
  fitbit_user_id: string;
  date: string;
}

export const handler: EventBridgeHandler<
  "Calculate Short Term Average of User's Activity Data",
  CalculateShortTermAverageDetail,
  any
> = async event => {
  const { fitbit_user_id, date } = event.detail;
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const User = _Users.initModel(sequelize);
  const FitbitAverage = _FitbitAverage.initModel(sequelize);
  const FitbitActivitySummary = _FitbitActivitySummary.initModel(sequelize);
  const FitbitSleepData = _FitbitSleepData.initModel(sequelize);
  const FitbitHealthMetrics = _FitbitHealthMetrics.initModel(sequelize);

  try {
    // 유저 정보 조회
    const user = await User.findOne({
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
    const userId = user.id;

    const today = DateTime.now().setZone('UTC+9').startOf('day');
    const todayStr = today.toFormat('yyyy-MM-dd');
    const yesterdayStr = today.minus({ days: 1 }).toFormat('yyyy-MM-dd');

    // 오늘 평균 계산을 위한 raw data(activities, sleep, metrics) 조회
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
          [Op.gte]: new Date(today.minus({ days: 30 }).valueOf()),
          [Op.lte]: new Date(today.minus({ days: 2 }).valueOf()),
        },
      },
      order: [['recorded_at', 'DESC']],
      limit: 30,
    });
    // 7일치 평균은 7일 이전의 평균인것임
    const weeklyAveragesQueryResult = monthlyAveragesQueryResult.filter(
      ({ recorded_at }) =>
        new Date(recorded_at) >= new Date(today.minus({ days: 7 }).valueOf()),
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: '누적 평균 계산이 성공적으로 완료되었습니다.',
        fitbit_user_id,
        date: todayStr,
        period_types: '1D, 7D, 30D',
      }),
    };
  } catch (error) {
    await sequelize.close();
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: '데이터 평균 계산 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
