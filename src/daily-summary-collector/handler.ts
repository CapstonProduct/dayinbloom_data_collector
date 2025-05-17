import axios from 'axios';
import { EventBridgeHandler } from 'aws-lambda';
import { Sequelize } from 'sequelize';
import { FitbitActivitySummary, Users } from './models';
import { isTokenExpired } from './utils/authentication';
import { DateTime } from 'luxon';

interface CollectDailySummaryDetail {
  fitbit_user_id: string;
}

export const handler: EventBridgeHandler<
  'Collect Activity Summary Data of a User Once Per Day',
  CollectDailySummaryDetail,
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
  const FitbitActivityDataModel = FitbitActivitySummary.initModel(sequelize);

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

    // 일일 활동 요약 데이터 수집
    const activityResponse = await axios.get(
      `https://api.fitbit.com/1/user/-/activities/date/${today}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const summary = activityResponse.data.summary;
    await FitbitActivityDataModel.create({
      user_id: user.id,
      date: new Date(today),
      averageDailySteps: summary.steps,
      rhr: summary.restingHeartRate || 0,
      total_steps: summary.steps,
      total_distance: summary.distances[0]?.distance || 0,
      total_calories_out: summary.caloriesOut,
      total_activity_calories: summary.activityCalories,
      caloriesBMR: summary.caloriesBMR,
      marginalCalories: summary.marginalCalories,
      sedentary_minutes: summary.sedentaryMinutes,
      lightly_active_minutes: summary.lightlyActiveMinutes,
      fairly_active_minutes: summary.fairlyActiveMinutes,
      very_active_minutes: summary.veryActiveMinutes,
      out_of_range_minutes: summary.heartRateZones[0]?.minutes || 0,
      fat_burn_minutes: summary.heartRateZones[1]?.minutes || 0,
      cardio_minutes: summary.heartRateZones[2]?.minutes || 0,
      peak_minutes: summary.heartRateZones[3]?.minutes || 0,
      out_of_range_calories: summary.heartRateZones[0]?.caloriesOut || 0,
      fat_burn_calories: summary.heartRateZones[1]?.caloriesOut || 0,
      cardio_calories: summary.heartRateZones[2]?.caloriesOut || 0,
      peak_calories: summary.heartRateZones[3]?.caloriesOut || 0,
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
