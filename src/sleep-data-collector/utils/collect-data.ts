import axios, { AxiosError } from 'axios';
import { DateTime } from 'luxon';
import { FitbitSleepDataAttributes } from '../models/fitbit_sleep_data';

interface RawSleepData {
  dateOfSleep: string;
  duration: number;
  efficiency: number;
  endTime: string;
  infoCode: number;
  isMainSleep: boolean;
  levels: {
    data: {
      dateTime: string;
      level: string;
      seconds: number;
    }[];
    shortData: {
      dateTime: string;
      level: string;
      seconds: number;
    }[];
    summary: {
      deep: {
        count: number;
        minutes: number;
        thirtyDayAvgMinutes: number;
      };
      light: {
        count: number;
        minutes: number;
        thirtyDayAvgMinutes: number;
      };
      rem: {
        count: number;
        minutes: number;
        thirtyDayAvgMinutes: number;
      };
      wake: {
        count: number;
        minutes: number;
        thirtyDayAvgMinutes: number;
      };
    };
  };
  logId: number;
  logType: string;
  minutesAfterWakeup: number;
  minutesAsleep: number;
  minutesAwake: number;
  minutesToFallAsleep: number;
  startTime: string;
  timeInBed: number;
  type: string;
}

interface ApiResponse {
  sleep: RawSleepData[];
}

type SleepData = Omit<
  FitbitSleepDataAttributes,
  'id' | 'user_id' | 'created_at'
>;

interface CollectDataResult<T> {
  success: boolean;
  data: T[];
}

export async function collectData(
  accessToken: string,
  date: DateTime,
): Promise<CollectDataResult<SleepData>> {
  try {
    const url = `https://api.fitbit.com/1.2/user/-/sleep/date/${date.toFormat('yyyy-MM-dd')}.json`;
    console.log(url);

    const { data } = await axios.get<ApiResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (data.sleep && data.sleep.length > 0) {
      const sleepData: SleepData[] = data.sleep.map(sleep => {
        console.log(JSON.stringify(sleep, null, 2));

        const dateOfSleep = sleep.isMainSleep ? date.minus({ days: 1 }) : date;
        return {
          date: dateOfSleep.toFormat('yyyy-MM-dd'),
          startTime: DateTime.fromISO(sleep.startTime).toJSDate(),
          endTime: DateTime.fromISO(sleep.endTime).toJSDate(),
          total_sleep_minutes: sleep.minutesAsleep,
          deep_sleep_hours: sleep.levels?.summary?.deep?.minutes / 60 || 0,
          light_sleep_hours: sleep.levels?.summary?.light?.minutes / 60 || 0,
          rem_sleep_hours: sleep.levels?.summary?.rem?.minutes / 60 || 0,
          minutesAwake: sleep.minutesAwake,
          awakeningsCount: 0, // FIXME drop column
          awakeCount: sleep.levels?.summary?.wake?.count || 0,
          awakeDuration: sleep.levels?.summary?.wake?.minutes || 0,
          restlessCount: 0, // FIXME drop column
          restlessDuration: 0, // FIXME drop column
          logId: sleep.logId,
          timeinBed: sleep.timeInBed,
          minutesAsleep: sleep.minutesAsleep,
          efficiency: sleep.efficiency,
          duration: sleep.duration,
          quality: sleep.efficiency,
          isMainSleep: sleep.isMainSleep,
        };
      });
      return { success: true, data: sleepData };
    } else {
      return { success: false, data: [] };
    }
  } catch (error) {
    console.error(
      error instanceof AxiosError ? error.response?.data : String(error),
    );
    return { success: false, data: [] };
  }
}
