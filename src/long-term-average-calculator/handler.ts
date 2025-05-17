import { EventBridgeHandler } from 'aws-lambda';
import { Sequelize, Op } from 'sequelize';
import {
  FitbitAverage as _FitbitAverage,
  FitbitAverageHistory as _FitbitAverageHistory,
  Users as _Users,
} from './models';
import { DateTime } from 'luxon';
import calculateRangedAverage from './utils/ranged-average';

interface CalculateLongTermAverageDetail {
  fitbit_user_id: string;
  monthStartDate: number;
}

export const handler: EventBridgeHandler<
  "Calculate Long Term Average of User's Activity Data",
  CalculateLongTermAverageDetail,
  any
> = async event => {
  // JSON 파싱하여 필요한 정보 추출
  // EventBridge 이벤트에는 body 가 없는 대신 detail 이라는 요소가 있읍니다.
  const { fitbit_user_id, monthStartDate } = event.detail;

  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const User = _Users.initModel(sequelize);
  const FitbitAverage = _FitbitAverage.initModel(sequelize);
  const FitbitAverageHistory = _FitbitAverageHistory.initModel(sequelize);

  try {
    // 유저 정보 조회
    const user = await User.findOne({
      where: { encodedId: fitbit_user_id },
      attributes: ['id', 'encodedId', 'access_token', 'access_token_expires'],
    });
    if (!user) {
      await sequelize.close();
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
    const thisMonth = today.startOf('month');
    const todayStr = today.toFormat('yyyy-MM-dd');
    const thisMonthStr = thisMonth.toFormat('yyyy-MM-dd');

    console.log(
      `장기평균 계산 시작: ${thisMonthStr}의 30D, 90D, 180D, 360D 평균을 테이블에 반영`,
    );

    /**
     * 06/01 일에,
      지난달 평균(30D) -> 05/30 의 30D 평균을 쿼리해서 인서트
      세달치 평균(90D) -> 30D 세개 가져옴
      여섯달치 평균(180D) -> 30D 여섯개 가져옴
      열두달치 평균(360D) -> 30D * 12 가져옴
     */

    // 이번달의 30D 평균을 단기 평균 테이블에서 가져옴
    const thisMonthMonthlyAverage = await FitbitAverage.findOne({
      where: {
        user_id: userId,
        recorded_at: thisMonthStr,
        period_type: '30D',
      },
    });
    if (!thisMonthMonthlyAverage) {
      throw new Error('이번달의 30D 평균을 찾을 수 없습니다.');
    }

    // 열두달치 장기 평균 가져오기
    const twelveMonthsAveragesQueryResult = await FitbitAverageHistory.findAll({
      where: {
        user_id: userId,
        period_type: '30D',
        recorded_at: {
          [Op.gte]: new Date(thisMonth.minus({ months: 12 }).valueOf()),
          [Op.lte]: new Date(thisMonth.minus({ months: 1 }).valueOf()),
        },
      },
      order: [['recorded_at', 'DESC']],
      limit: 12,
    });
    // 세달치 평균
    const threeMonthsAveragesQueryResult =
      twelveMonthsAveragesQueryResult.filter(
        ({ recorded_at }) =>
          new Date(recorded_at) >=
          new Date(thisMonth.minus({ months: 3 }).valueOf()),
      );
    // 여섯달치 평균
    const sixMonthsAveragesQueryResult = twelveMonthsAveragesQueryResult.filter(
      ({ recorded_at }) =>
        new Date(recorded_at) >=
        new Date(thisMonth.minus({ months: 6 }).valueOf()),
    );

    // 장기 평균 계산
    const threeMonthsAverage = calculateRangedAverage(
      threeMonthsAveragesQueryResult,
      thisMonthMonthlyAverage,
    );
    const sixMonthsAverage = calculateRangedAverage(
      sixMonthsAveragesQueryResult,
      thisMonthMonthlyAverage,
    );
    const twelveMonthsAverage = calculateRangedAverage(
      twelveMonthsAveragesQueryResult,
      thisMonthMonthlyAverage,
    );

    // 데이터 반영
    const transaction = await sequelize.transaction();
    try {
      await transaction.commit();
      await FitbitAverageHistory.create({
        ...thisMonthMonthlyAverage.getAverageAttributes(),
        user_id: userId,
        recorded_at: thisMonthStr,
        period_type: '30D',
        created_at: new Date(),
        updated_at: new Date(),
      });
      await FitbitAverageHistory.create({
        ...threeMonthsAverage,
        user_id: userId,
        recorded_at: thisMonthStr,
        period_type: '90D',
        created_at: new Date(),
        updated_at: new Date(),
      });
      await FitbitAverageHistory.create({
        ...sixMonthsAverage,
        user_id: userId,
        recorded_at: thisMonthStr,
        period_type: '180D',
        created_at: new Date(),
        updated_at: new Date(),
      });
      await FitbitAverageHistory.create({
        ...twelveMonthsAverage,
        user_id: userId,
        recorded_at: thisMonthStr,
        period_type: '360D',
        created_at: new Date(),
        updated_at: new Date(),
      });
    } catch (error) {
      await transaction.rollback();
      throw new Error('장기 평균 데이터 반영 중 오류가 발생했습니다.');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: '장기평균 계산이 성공적으로 완료되었습니다.',
        fitbit_user_id,
        date: todayStr,
        period_types: '30D, 90D, 180D, 360D',
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: '장기평균 계산 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  } finally {
    await sequelize.close();
  }
};
