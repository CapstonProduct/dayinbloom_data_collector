import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface FitbitHealthMetricsAttributes {
  id: number;
  user_id: number;
  date: Date;
  daily_hrv?: number;
  sleep_hrv?: number;
  breathing_rate?: number;
  skin_temperature?: number;
  stress_score?: number;
  hrv_contribution?: number;
  rhr_contribution?: number;
  sleep_contribution?: number;
  created_at?: Date;
}

export type FitbitHealthMetricsPk = 'id';
export type FitbitHealthMetricsId = FitbitHealthMetrics[FitbitHealthMetricsPk];
export type FitbitHealthMetricsOptionalAttributes =
  | 'id'
  | 'daily_hrv'
  | 'sleep_hrv'
  | 'breathing_rate'
  | 'skin_temperature'
  | 'stress_score'
  | 'hrv_contribution'
  | 'rhr_contribution'
  | 'sleep_contribution'
  | 'created_at';
export type FitbitHealthMetricsCreationAttributes = Optional<
  FitbitHealthMetricsAttributes,
  FitbitHealthMetricsOptionalAttributes
>;

export class FitbitHealthMetrics
  extends Model<
    FitbitHealthMetricsAttributes,
    FitbitHealthMetricsCreationAttributes
  >
  implements FitbitHealthMetricsAttributes
{
  id!: number;
  user_id!: number;
  date!: Date;
  daily_hrv?: number;
  sleep_hrv?: number;
  breathing_rate?: number;
  skin_temperature?: number;
  stress_score?: number;
  hrv_contribution?: number;
  rhr_contribution?: number;
  sleep_contribution?: number;
  created_at?: Date;

  static initModel(sequelize: Sequelize.Sequelize): typeof FitbitHealthMetrics {
    return FitbitHealthMetrics.init(
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
          type: DataTypes.DATE,
          allowNull: false,
        },
        daily_hrv: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        sleep_hrv: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        breathing_rate: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        skin_temperature: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        stress_score: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        hrv_contribution: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        rhr_contribution: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        sleep_contribution: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        sequelize,
        tableName: 'fitbit_health_metrics',
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
            fields: [{ name: 'user_id' }, { name: 'date' }],
          },
        ],
      },
    );
  }
}
