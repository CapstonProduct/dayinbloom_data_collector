import { EventBridgeHandler } from 'aws-lambda';
import { Op, Sequelize } from 'sequelize';
import {
  FitbitActivityData as _FitbitActivityData,
  FitbitActivitySummary as _FitbitActivitySummary,
  FitbitHealthMetrics as _FitbitHealthMetrics,
  FitbitSleepData as _FitbitSleepData,
} from './models';
import { DateTime } from 'luxon';

export const handler: EventBridgeHandler<
  'Remove Old Raw Data',
  any,
  any
> = async (event, context) => {
  // 삭제주기: 8일
  // 삭제대상: fitbit_activity_data, fitbit_activity_summary, fitbit_health_metrics, fitbit_sleep_data

  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: false,
  });

  const FitbitActivityData = _FitbitActivityData.initModel(sequelize);
  const FitbitActivitySummary = _FitbitActivitySummary.initModel(sequelize);
  const FitbitHealthMetrics = _FitbitHealthMetrics.initModel(sequelize);
  const FitbitSleepData = _FitbitSleepData.initModel(sequelize);

  const today = DateTime.now().setZone('UTC+9').startOf('day');
  const eightDaysAgo = today.minus({ days: 8 });

  const transaction = await sequelize.transaction();
  try {
    await FitbitActivityData.destroy({
      where: {
        created_at: {
          [Op.lt]: eightDaysAgo.valueOf(),
        },
      },
      transaction,
    });
    await FitbitActivitySummary.destroy({
      where: {
        created_at: {
          [Op.lt]: eightDaysAgo.valueOf(),
        },
      },
      transaction,
    });
    await FitbitHealthMetrics.destroy({
      where: {
        created_at: {
          [Op.lt]: eightDaysAgo.valueOf(),
        },
      },
      transaction,
    });
    await FitbitSleepData.destroy({
      where: {
        created_at: {
          [Op.lt]: eightDaysAgo.valueOf(),
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
