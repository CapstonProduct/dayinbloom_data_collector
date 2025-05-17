import { EventBridgeHandler } from 'aws-lambda';
import { FitbitAverage as _FitbitAverage } from './models/fitbit_average';
import { Op, Sequelize } from 'sequelize';
import { DateTime } from 'luxon';

export const handler: EventBridgeHandler<
  'Remove Old Average Data',
  any,
  any
> = async (event, context) => {
  // 삭제주기: 32일
  // 삭제대상: fitbit_averages

  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const FitbitAverage = _FitbitAverage.initModel(sequelize);

  const today = DateTime.now().setZone('UTC+9').startOf('day');
  const deletePoint = today.minus({ days: 32 });

  const transaction = await sequelize.transaction();
  try {
    await FitbitAverage.destroy({
      where: {
        created_at: {
          [Op.lt]: deletePoint.valueOf(),
        },
      },
      transaction,
    });
    transaction.commit();
  } catch (error) {
    transaction.rollback();
    console.error('Error:', error);
  }

  await sequelize.close();
};
