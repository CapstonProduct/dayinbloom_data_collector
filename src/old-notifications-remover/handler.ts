import { Handler } from 'aws-lambda';
import { Op, Sequelize } from 'sequelize';
import initNotificationModel from './models/notifications';
import { DateTime } from 'luxon';

export const handler: Handler = async event => {
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    logging: false,
  });
  const Notification = initNotificationModel(sequelize);

  const today = DateTime.now().setZone('Asia/Seoul').startOf('day');
  const retentionDays = today.minus({ days: 7 });

  try {
    await Notification.destroy({
      where: {
        createdAt: {
          [Op.lt]: retentionDays.valueOf(),
        },
      },
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }
};
