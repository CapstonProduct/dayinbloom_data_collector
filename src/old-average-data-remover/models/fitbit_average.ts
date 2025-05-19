import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface FitbitAverageAttributes {
  id: number;
  user_id: number;
  recorded_at: string;
  period_type: '1D' | '7D' | '30D';
  avg_steps?: number;
  avg_calories_total?: number;
  avg_distance_km?: number;
  avg_heart_rate?: number;
  avg_resting_heart_rate?: number;
  avg_activity_duration?: number;
  avg_sedentary_minutes?: number;
  avg_lightly_active_minutes?: number;
  avg_fairly_active_minutes?: number;
  avg_very_active_minutes?: number;
  avg_total_sleep_hours?: number;
  avg_deep_sleep_hours?: number;
  avg_light_sleep_hours?: number;
  avg_rem_sleep_hours?: number;
  avg_awake_hours?: number;
  avg_sleep_heart_rate?: number;
  avg_hrv?: number;
  avg_rhr?: number;
  avg_respiratory_rate?: number;
  avg_skin_temperature?: number;
  avg_stress_score?: number;
  avg_total_score?: number;
  avg_sleep_score: number;
  updated_at?: Date;
  created_at?: Date;
  avg_activity_score?: number;
  avg_metrics_score?: number;
}

export type FitbitAveragePk = 'id';
export type FitbitAverageId = FitbitAverage[FitbitAveragePk];
export type FitbitAverageOptionalAttributes =
  | 'id'
  | 'avg_steps'
  | 'avg_calories_total'
  | 'avg_distance_km'
  | 'avg_heart_rate'
  | 'avg_resting_heart_rate'
  | 'avg_activity_duration'
  | 'avg_sedentary_minutes'
  | 'avg_lightly_active_minutes'
  | 'avg_fairly_active_minutes'
  | 'avg_very_active_minutes'
  | 'avg_total_sleep_hours'
  | 'avg_deep_sleep_hours'
  | 'avg_light_sleep_hours'
  | 'avg_rem_sleep_hours'
  | 'avg_awake_hours'
  | 'avg_sleep_heart_rate'
  | 'avg_hrv'
  | 'avg_rhr'
  | 'avg_respiratory_rate'
  | 'avg_skin_temperature'
  | 'avg_stress_score'
  | 'avg_total_score'
  | 'updated_at'
  | 'created_at'
  | 'avg_activity_score'
  | 'avg_metrics_score';
export type FitbitAverageCreationAttributes = Optional<
  FitbitAverageAttributes,
  FitbitAverageOptionalAttributes
>;

export class FitbitAverage
  extends Model<FitbitAverageAttributes, FitbitAverageCreationAttributes>
  implements FitbitAverageAttributes
{
  id!: number;
  user_id!: number;
  recorded_at!: string;
  period_type!: '1D' | '7D' | '30D';
  avg_steps?: number;
  avg_calories_total?: number;
  avg_distance_km?: number;
  avg_heart_rate?: number;
  avg_resting_heart_rate?: number;
  avg_activity_duration?: number;
  avg_sedentary_minutes?: number;
  avg_lightly_active_minutes?: number;
  avg_fairly_active_minutes?: number;
  avg_very_active_minutes?: number;
  avg_total_sleep_hours?: number;
  avg_deep_sleep_hours?: number;
  avg_light_sleep_hours?: number;
  avg_rem_sleep_hours?: number;
  avg_awake_hours?: number;
  avg_sleep_heart_rate?: number;
  avg_hrv?: number;
  avg_rhr?: number;
  avg_respiratory_rate?: number;
  avg_skin_temperature?: number;
  avg_stress_score?: number;
  avg_total_score?: number;
  avg_sleep_score!: number;
  updated_at?: Date;
  created_at?: Date;
  avg_activity_score?: number;
  avg_metrics_score?: number;

  static initModel(sequelize: Sequelize.Sequelize): typeof FitbitAverage {
    return FitbitAverage.init(
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
        recorded_at: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        period_type: {
          type: DataTypes.ENUM('1D', '7D', '30D'),
          allowNull: false,
        },
        avg_steps: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        avg_calories_total: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_distance_km: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_heart_rate: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_resting_heart_rate: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        avg_activity_duration: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_sedentary_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        avg_lightly_active_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        avg_fairly_active_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        avg_very_active_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        avg_total_sleep_hours: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        avg_deep_sleep_hours: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_light_sleep_hours: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_rem_sleep_hours: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_awake_hours: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_sleep_heart_rate: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_hrv: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_rhr: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_respiratory_rate: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_skin_temperature: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_stress_score: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_total_score: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        avg_sleep_score: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        avg_activity_score: {
          type: DataTypes.FLOAT,
          allowNull: true,
          defaultValue: 0,
        },
        avg_metrics_score: {
          type: DataTypes.FLOAT,
          allowNull: true,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        tableName: 'fitbit_average',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id' }],
          },
          {
            name: 'user_id',
            unique: true,
            using: 'BTREE',
            fields: [
              { name: 'user_id' },
              { name: 'recorded_at' },
              { name: 'period_type' },
            ],
          },
        ],
      },
    );
  }
}
