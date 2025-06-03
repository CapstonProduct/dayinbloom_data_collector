import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface FitbitSleepDataAttributes {
  id: number;
  user_id: number;
  date: string;
  startTime: Date;
  endTime: Date;
  total_sleep_minutes: number;
  deep_sleep_hours: number;
  light_sleep_hours: number;
  rem_sleep_hours: number;
  minutesAwake: number;
  awakeningsCount?: number;
  awakeCount: number;
  awakeDuration?: number;
  restlessCount: number;
  restlessDuration?: number;
  logId?: number;
  timeinBed?: number;
  minutesAsleep?: number;
  efficiency: number;
  duration: number;
  quality: number;
  isMainSleep: number;
  created_at?: Date;
}

export type FitbitSleepDataPk = 'id';
export type FitbitSleepDataId = FitbitSleepData[FitbitSleepDataPk];
export type FitbitSleepDataOptionalAttributes =
  | 'id'
  | 'awakeningsCount'
  | 'awakeDuration'
  | 'restlessDuration'
  | 'logId'
  | 'timeinBed'
  | 'minutesAsleep'
  | 'created_at';
export type FitbitSleepDataCreationAttributes = Optional<
  FitbitSleepDataAttributes,
  FitbitSleepDataOptionalAttributes
>;

export class FitbitSleepData
  extends Model<FitbitSleepDataAttributes, FitbitSleepDataCreationAttributes>
  implements FitbitSleepDataAttributes
{
  id!: number;
  user_id!: number;
  date!: string;
  startTime!: Date;
  endTime!: Date;
  total_sleep_minutes!: number;
  deep_sleep_hours!: number;
  light_sleep_hours!: number;
  rem_sleep_hours!: number;
  minutesAwake!: number;
  awakeningsCount?: number;
  awakeCount!: number;
  awakeDuration?: number;
  restlessCount!: number;
  restlessDuration?: number;
  logId?: number;
  timeinBed?: number;
  minutesAsleep?: number;
  efficiency!: number;
  duration!: number;
  quality!: number;
  isMainSleep!: number;
  created_at?: Date;

  static initModel(sequelize: Sequelize.Sequelize): typeof FitbitSleepData {
    return FitbitSleepData.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        startTime: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        endTime: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        total_sleep_minutes: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        deep_sleep_hours: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        light_sleep_hours: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        rem_sleep_hours: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        minutesAwake: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        awakeningsCount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        awakeCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        awakeDuration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        restlessCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        restlessDuration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        logId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        timeinBed: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        minutesAsleep: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        efficiency: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        duration: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        quality: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        isMainSleep: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        sequelize,
        tableName: 'fitbit_sleep_data',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id' }],
          },
          {
            name: 'idx_user_time',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'startTime' }],
          },
        ],
      },
    );
  }
}
