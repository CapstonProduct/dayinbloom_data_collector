import axios from 'axios';
import { EventBridgeHandler } from 'aws-lambda';
import { Sequelize } from 'sequelize';
import { FitbitActivitySummary, Users } from './models';
import getAccessToken from './utils/authentication';
import { DateTime } from 'luxon';

interface CollectDailySummaryDetail {
  fitbit_user_id: string;
}

export const handler: EventBridgeHandler<
  'Collect Activity Summary',
  CollectDailySummaryDetail,
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
  const FitbitActivityDataModel = FitbitActivitySummary.initModel(sequelize);

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

  const today = DateTime.now().setZone('Asia/Seoul').startOf('day');
  const yesterday = today.minus({ days: 1 }).toFormat('yyyy-MM-dd');

  console.log(
    `어제: ${yesterday} 의 유저 ${fitbit_user_id} 의 일일 활동 데이터를 수집합니다.`,
  );
  const activityResponse = await axios.get(
    `https://api.fitbit.com/1/user/-/activities/date/${yesterday}.json`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  console.log(
    `어제: ${yesterday} 의 유저 ${fitbit_user_id} 의 일일 활동 데이터를 수집했습니다.`,
  );
  const summary = activityResponse.data.summary;

  console.log(
    `어제: ${yesterday} 의 유저 ${fitbit_user_id} 의 일일 활동 데이터를 데이터베이스에 생성합니다.`,
  );
  await FitbitActivityDataModel.create({
    user_id: userId,
    date: new Date(yesterday),
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

  await sequelize.close();
  console.log(
    `어제: ${yesterday} 의 유저 ${fitbit_user_id} 의 일일 활동 데이터를 데이터베이스에 생성하였습니다.`,
  );
};
