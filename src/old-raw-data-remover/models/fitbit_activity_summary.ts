import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface FitbitActivitySummaryAttributes {
  id: number;
  user_id: number;
  date: Date;
  averageDailySteps?: number;
  rhr?: number;
  total_steps?: number;
  total_distance?: number;
  total_calories_out?: number;
  total_activity_calories?: number;
  caloriesBMR?: number;
  marginalCalories?: number;
  sedentary_minutes?: number;
  lightly_active_minutes?: number;
  fairly_active_minutes?: number;
  very_active_minutes?: number;
  out_of_range_minutes?: number;
  fat_burn_minutes?: number;
  cardio_minutes?: number;
  peak_minutes?: number;
  out_of_range_calories?: number;
  fat_burn_calories?: number;
  cardio_calories?: number;
  peak_calories?: number;
  created_at?: Date;
}

export type FitbitActivitySummaryPk = 'id';
export type FitbitActivitySummaryId =
  FitbitActivitySummary[FitbitActivitySummaryPk];
export type FitbitActivitySummaryOptionalAttributes =
  | 'id'
  | 'averageDailySteps'
  | 'rhr'
  | 'total_steps'
  | 'total_distance'
  | 'total_calories_out'
  | 'total_activity_calories'
  | 'caloriesBMR'
  | 'marginalCalories'
  | 'sedentary_minutes'
  | 'lightly_active_minutes'
  | 'fairly_active_minutes'
  | 'very_active_minutes'
  | 'out_of_range_minutes'
  | 'fat_burn_minutes'
  | 'cardio_minutes'
  | 'peak_minutes'
  | 'out_of_range_calories'
  | 'fat_burn_calories'
  | 'cardio_calories'
  | 'peak_calories'
  | 'created_at';
export type FitbitActivitySummaryCreationAttributes = Optional<
  FitbitActivitySummaryAttributes,
  FitbitActivitySummaryOptionalAttributes
>;

export class FitbitActivitySummary
  extends Model<
    FitbitActivitySummaryAttributes,
    FitbitActivitySummaryCreationAttributes
  >
  implements FitbitActivitySummaryAttributes
{
  id!: number;
  user_id!: number;
  date!: Date;
  averageDailySteps?: number;
  rhr?: number;
  total_steps?: number;
  total_distance?: number;
  total_calories_out?: number;
  total_activity_calories?: number;
  caloriesBMR?: number;
  marginalCalories?: number;
  sedentary_minutes?: number;
  lightly_active_minutes?: number;
  fairly_active_minutes?: number;
  very_active_minutes?: number;
  out_of_range_minutes?: number;
  fat_burn_minutes?: number;
  cardio_minutes?: number;
  peak_minutes?: number;
  out_of_range_calories?: number;
  fat_burn_calories?: number;
  cardio_calories?: number;
  peak_calories?: number;
  created_at?: Date;

  static initModel(
    sequelize: Sequelize.Sequelize,
  ): typeof FitbitActivitySummary {
    return FitbitActivitySummary.init(
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
        averageDailySteps: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        rhr: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        total_steps: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_distance: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        total_calories_out: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        total_activity_calories: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        caloriesBMR: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        marginalCalories: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        sedentary_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        lightly_active_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        fairly_active_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        very_active_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        out_of_range_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        fat_burn_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        cardio_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        peak_minutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        out_of_range_calories: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        fat_burn_calories: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        cardio_calories: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        peak_calories: {
          type: DataTypes.INTEGER,
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
        tableName: 'fitbit_activity_summary',
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
