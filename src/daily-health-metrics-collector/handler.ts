import { Handler } from 'aws-lambda';
import { Sequelize } from 'sequelize';
import { FitbitHealthMetrics, Users } from './models';
import { getAccessToken, getEligibleUsers } from './utils/authentication';
import { DateTime } from 'luxon';
import { collectData } from './utils/collect-data';

export const handler: Handler = async event => {
  console.log(`이벤트를 전송받았습니다: `);
  console.log(event);

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

  const { count, users } = await getEligibleUsers(UserModel);
  console.log(`데이터 수집이 가능한 유저는 총 ${count} 명 입니다.`);

  const today = DateTime.now().setZone('Asia/Seoul').startOf('day');
  const yesterday = today.minus({ days: 1 }).toFormat('yyyy-MM-dd');

  const results = await Promise.all(
    users.map(async user => {
      const { encodedId } = user;
      const { userId, accessToken } = await getAccessToken(user);
      if (!accessToken) {
        return { success: false, userId, encodedId };
      }

      const { success, data } = await collectData(accessToken, yesterday);
      if (!success) {
        return { success: false, userId, encodedId };
      }

      try {
        await FitbitHealthMetricsModel.create({
          user_id: userId,
          date: new Date(yesterday),
          ...data,
          created_at: new Date(),
        });
        return { success: true, userId, encodedId };
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return { success: false, userId, encodedId };
      }
    }),
  );

  await sequelize.close();

  console.log(JSON.stringify(results));
  return results;
};
