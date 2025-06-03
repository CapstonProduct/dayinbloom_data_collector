import { Sequelize } from 'sequelize';
import { Handler } from 'aws-lambda';
import { Users, FitbitDevice, FitbitActivityData } from './models';
import { getEligibleUsers, getAccessToken } from './utils/authentication';
import { collectData, collectDeviceData } from './utils/collect-data';
import { DateTime } from 'luxon';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';

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
  const DeviceModel = FitbitDevice.initModel(sequelize);
  const FitbitActivityDataModel = FitbitActivityData.initModel(sequelize);

  const { count, users } = await getEligibleUsers(UserModel);
  console.log(`데이터 수집이 가능한 유저는 총 ${count} 명 입니다.`);

  const results = await Promise.all(
    users.map(async user => {
      const { encodedId } = user;
      const { userId, accessToken } = await getAccessToken(user);
      if (!encodedId || !accessToken) {
        console.error(`유저 ${userId}의 액세스 토큰이 존재하지 않습니다.`);
        return { success: false, userId, encodedId };
      }

      // 기기 데이터 수집
      const { success: deviceSuccess, data: deviceData } =
        await collectDeviceData(encodedId, accessToken);
      if (!deviceSuccess) {
        console.error(
          `유저 ${userId}의 기기 데이터를 수집하는 데 실패했습니다.`,
        );
        return { success: false, userId, encodedId };
      }

      console.log(
        `유저 ${userId}의 기기 데이터: ${JSON.stringify(deviceData)}`,
      );

      let lastSyncTimeDevice = DateTime.fromMillis(0, { zone: 'Asia/Seoul' });

      try {
        await Promise.all(
          deviceData.map(
            async ({ id, deviceVersion, batteryLevel, lastSyncTime }) => {
              const syncTime = DateTime.fromISO(lastSyncTime, {
                zone: 'Asia/Seoul',
              });

              const [device, created] = await DeviceModel.findOrCreate({
                where: {
                  user_id: userId,
                  device_id: parseInt(id),
                },
                defaults: {
                  user_id: userId,
                  device_id: parseInt(id),
                  device_version: deviceVersion,
                  // battery: device.battery,
                  battery_level: batteryLevel.toString(),
                  last_sync_time: syncTime.toJSDate(),
                },
              });

              if (!created) {
                await device.update({
                  device_version: deviceVersion,
                  battery_level: batteryLevel.toString(),
                  last_sync_time: syncTime.toJSDate(),
                });
              }
              if (syncTime > lastSyncTimeDevice) {
                lastSyncTimeDevice = syncTime;
              }
            },
          ),
        );
      } catch (error) {
        console.error(
          `유저 ${userId}의 기기 데이터를 저장하는 데 실패했습니다.`,
        );
        return { success: false, userId, encodedId };
      }

      const { success, data } = await collectData(
        encodedId,
        accessToken,
        lastSyncTimeDevice,
      );
      if (!success) {
        console.log(`유저 ${userId}의 데이터를 수집하는 데 실패했습니다.`);
        return { success: false, userId, encodedId };
      }

      try {
        console.log(lastSyncTimeDevice.toISO());
        await FitbitActivityDataModel.create({
          user_id: userId,
          date: new Date(lastSyncTimeDevice.valueOf()),
          steps: data.steps_sum,
          distance_km: data.distance_sum,
          calories_total: data.calories_sum,
          heart_rate: data.heartrate_avg,
        });

        const ebClient = new EventBridgeClient({ region: 'ap-northeast-2' });
        const command = new PutEventsCommand({
          Entries: [
            {
              EventBusName: 'dayinbloom-event-bus',
              Source: 'dayinbloom-intraday-data-collector',
              DetailType: 'Detect Anomalies',
              Detail: JSON.stringify({ fitbitUserId: encodedId }),
            },
          ],
        });
        const { FailedEntryCount, Entries } = await ebClient.send(command);
        if (FailedEntryCount && FailedEntryCount > 0) {
          console.error('이상 징후 감지 트리거를 발생시키는데 실패했습니다');
          if (Entries) {
            console.error(Entries[0].ErrorMessage);
          }
          return { success: false, userId, encodedId };
        }

        console.log('이상 징후 감지 트리거를 발생시켰습니다');
        return { success: true, userId, encodedId };
      } catch (error) {
        console.log(`유저 ${userId}의 데이터를 저장하는 데 실패했습니다.`);
        console.error(error instanceof Error ? error.message : String(error));
        return { success: false, userId, encodedId };
      }
    }),
  );

  await sequelize.close();

  console.log(JSON.stringify(results));
  return results;
};
