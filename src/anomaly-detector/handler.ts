import { EventBridgeHandler } from 'aws-lambda';
import { Op, QueryTypes, Sequelize } from 'sequelize';
import { FitbitActivityData } from './models/fitbit_activity_data';
import { DateTime } from 'luxon';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { Users } from './models/users';

interface Detail {
  fitbitUserId: string;
}

export const handler: EventBridgeHandler<
  'Detect Anomalies',
  Detail,
  any
> = async event => {
  console.log('이벤트를 전송받았습니다:');
  console.log(event);

  const { fitbitUserId } = event.detail;

  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: false,
  });
  const users = Users.initModel(sequelize);
  const intradayData = FitbitActivityData.initModel(sequelize);

  const user = await users.findOne({ where: { encodedId: fitbitUserId } });
  if (!user) {
    await sequelize.close();
    console.error(`${fitbitUserId} 유저를 찾을 수 없습니다`);
    return { success: false, fitbitUserId };
  }
  const userId = user.id;

  const now = DateTime.now();
  const sixHoursAgo = now.minus({ hours: 6 });
  try {
    const data = await intradayData.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.gte]: sixHoursAgo.valueOf(),
          [Op.lte]: now.valueOf(),
        },
      },
      order: [['date', 'ASC']],
    });
    console.log(
      `${sixHoursAgo.toFormat('yyyy-MM-dd HH:mm:ss')} ~ ${now.toFormat('yyyy-MM-dd HH:mm:ss')} 사이의 유저 ${fitbitUserId} 의 인트라데이 데이터 총 ${data.length} 건을 수집했습니다`,
    );

    if (data.length <= 0) {
      const errMsg = '인트라데이 데이터가 없습니다';
      console.error(errMsg);

      await sequelize.close();
      return { success: false, fitbitUserId };
    }

    // 이상 징후 조건 확인
    const noMovement = data.every(row => row.steps <= 5);
    const abnormalHeartRate = data.some(row => {
      const calories = row.calories_total ? row.calories_total : 0;
      const isResting = row.steps <= 5 && calories <= 15;
      const isActive = !isResting;
      const hr = row.heart_rate;

      const isAbnormal =
        (isResting && (hr < 50 || hr > 120)) || (isActive && hr < 50);
      if (isAbnormal) {
        console.log(
          `휴식 중: ${isResting}, 활동 중: ${isActive}, 심박수: ${hr}`,
        );
      }
      return isAbnormal;
    });

    if (noMovement || abnormalHeartRate) {
      console.log('이상 징후가 감지되었습니다: ');
      // triggered = true;
      const triggerDetail = noMovement
        ? '최근 6시간 이상 움직임이 감지되지 않았습니다.\n낙상이나 건강 문제일 수 있습니다.'
        : '심박수 이상이 감지되었습니다.\n대처를 진행하시겠습니까?';

      await sequelize.query(
        `INSERT INTO health_analyzer (user_id, analysis_type, triggered_alert, analysis_timestamp, trigger_details)
         VALUES (:userId, 'threshold', true, :timestamp, :details)`,
        {
          replacements: {
            userId: userId,
            timestamp: now.toJSDate(),
            details: triggerDetail,
          },
          type: QueryTypes.INSERT,
        },
      );
      await sequelize.close();

      // eventbridge trigger
      const ebClient = new EventBridgeClient({ region: 'ap-northeast-2' });
      const command = new PutEventsCommand({
        Entries: [
          {
            EventBusName: 'dayinbloom-event-bus',
            Source: 'dayinbloom-amomaly-detector',
            DetailType: 'Anomaly Detected',
            Detail: JSON.stringify({
              fitbit_user_id: fitbitUserId,
              date: now.toISO(),
              detail: triggerDetail,
            }),
          },
        ],
      });
      const { FailedEntryCount, Entries } = await ebClient.send(command);
      if (FailedEntryCount && FailedEntryCount > 0) {
        console.error('이상 징후 감지됨 트리거를 발생시키는데 실패했습니다');
        if (Entries) {
          console.error(Entries[0].ErrorMessage);
        }
        return { success: false, fitbitUserId };
      }
    } else {
      console.log('이상 징후가 감지되지 않았습니다');
    }

    await sequelize.close();
    return { success: true, fitbitUserId };
  } catch (error) {
    await sequelize.close();
    console.error(error instanceof Error ? error.message : String(error));
    return { success: false, fitbitUserId };
  }
};
