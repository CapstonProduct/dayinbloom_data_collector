import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { Users, UsersId } from './users';

export interface FitbitAverageAttributes {
  id: number;
  user_id: number;
  recorded_at: string;
  period_type: '1D' | '7D' | '30D' | '90D' | '180D' | '365D';
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
  | 'avg_activity_score'
  | 'avg_metrics_score'
  | 'updated_at'
  | 'created_at';
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
  period_type!: '1D' | '7D' | '30D' | '90D' | '180D' | '365D';
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
  avg_activity_score?: number;
  avg_metrics_score?: number;
  avg_sleep_score!: number;
  avg_total_score?: number;
  updated_at?: Date;
  created_at?: Date;

  // FitbitAverage belongsTo Users via user_id
  user!: Users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<Users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<Users, UsersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<Users>;

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
          type: DataTypes.ENUM('1D', '7D', '30D', '90D', '180D', '365D'),
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
      },
      {
        sequelize,
        tableName: 'fitbit_average',
        timestamps: true,
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

  getAverageAttributes: () => Omit<
    FitbitAverageAttributes,
    | 'id'
    | 'user_id'
    | 'period_type'
    | 'recorded_at'
    | 'created_at'
    | 'updated_at'
  > = () => {
    return {
      avg_steps: this.avg_steps,
      avg_calories_total: this.avg_calories_total,
      avg_distance_km: this.avg_distance_km,
      avg_heart_rate: this.avg_heart_rate,
      avg_resting_heart_rate: this.avg_resting_heart_rate,
      avg_activity_duration: this.avg_activity_duration,
      avg_sedentary_minutes: this.avg_sedentary_minutes,
      avg_lightly_active_minutes: this.avg_lightly_active_minutes,
      avg_fairly_active_minutes: this.avg_fairly_active_minutes,
      avg_very_active_minutes: this.avg_very_active_minutes,
      avg_total_sleep_hours: this.avg_total_sleep_hours,
      avg_deep_sleep_hours: this.avg_deep_sleep_hours,
      avg_light_sleep_hours: this.avg_light_sleep_hours,
      avg_rem_sleep_hours: this.avg_rem_sleep_hours,
      avg_awake_hours: this.avg_awake_hours,
      avg_sleep_heart_rate: this.avg_sleep_heart_rate,
      avg_hrv: this.avg_hrv,
      avg_rhr: this.avg_rhr,
      avg_respiratory_rate: this.avg_respiratory_rate,
      avg_skin_temperature: this.avg_skin_temperature,
      avg_stress_score: this.avg_stress_score,
      avg_total_score: this.avg_total_score,
      avg_sleep_score: this.avg_sleep_score,
      avg_activity_score: this.avg_activity_score,
      avg_metrics_score: this.avg_metrics_score,
    };
  };
}
