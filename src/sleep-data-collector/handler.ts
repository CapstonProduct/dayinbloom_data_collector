import { Sequelize } from 'sequelize';
import { Handler } from 'aws-lambda';
import { FitbitSleepData, Users } from './models';
import { getAccessToken, getEligibleUsers } from './utils/authentication';
import { DateTime } from 'luxon';
import { collectData } from './utils/collect-data';
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
  const SleepDataModel = FitbitSleepData.initModel(sequelize);

  const today = DateTime.now().setZone('Asia/Seoul').startOf('day');

  const { count, users } = await getEligibleUsers(UserModel);
  console.log(`데이터 수집이 가능한 유저는 총 ${count} 명 입니다.`);

  const results = await Promise.all(
    users.map(async user => {
      const { encodedId } = user;
      const { userId, accessToken } = await getAccessToken(user);
      if (!accessToken) {
        return { success: false, userId, encodedId };
      }

      const { success, data } = await collectData(accessToken, today);
      if (!success) {
        return { success: false, userId, encodedId };
      }

      try {
        await Promise.all(
          data.map(async sleep => {
            const [result, created] = await SleepDataModel.findOrCreate({
              where: {
                startTime: new Date(sleep.startTime),
                endTime: new Date(sleep.endTime),
              },
              defaults: {
                user_id: userId,
                ...sleep,
                created_at: new Date(),
              },
            });

            if (created) {
              console.log(
                `유저 ${encodedId} 의 새로운 수면 데이터를 수집했습니다`,
              );
            } else {
              console.log(
                `유저 ${encodedId} 의 수면 데이터를 수집했으나 이미 수집한 데이터입니다`,
              );
            }

            if (created && result.isMainSleep) {
              console.log(
                `새로운 주 수면이 감지되었습니다: ${result.startTime} - ${result.endTime}`,
              );
              const ebClient = new EventBridgeClient({
                region: 'ap-northeast-2',
              });
              const command = new PutEventsCommand({
                Entries: [
                  // 주수면 감지 트리거 1: 평균 계산
                  {
                    EventBusName: 'dayinbloom-event-bus',
                    Source: 'dayinbloom-sleep-data-collector',
                    DetailType: 'Main Sleep Detected',
                    Detail: JSON.stringify({
                      fitbit_user_id: encodedId,
                      date: today.toFormat('yyyy-MM-dd'),
                    }),
                  },
                  // TODO 인트라데이 데이터 날짜 보정 이벤트 넣기
                ],
              });
              const { FailedEntryCount, Entries } =
                await ebClient.send(command);

              if (FailedEntryCount && FailedEntryCount > 0) {
                console.error(
                  `주수면 감지됨 트리거를 발생시키는데 실패했습니다:`,
                );
                if (Entries) {
                  console.error(Entries[0].ErrorMessage);
                }
              }
            }
          }),
        );
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
