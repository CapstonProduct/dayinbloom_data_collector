import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { Users, UsersId } from './users';

export interface FitbitActivityDataAttributes {
  id: number;
  user_id: number;
  date: Date;
  steps: number;
  distance_km: number;
  calories_total?: number;
  heart_rate: number;
  created_at?: Date;
}

export type FitbitActivityDataPk = 'id';
export type FitbitActivityDataId = FitbitActivityData[FitbitActivityDataPk];
export type FitbitActivityDataOptionalAttributes =
  | 'id'
  | 'calories_total'
  | 'created_at';
export type FitbitActivityDataCreationAttributes = Optional<
  FitbitActivityDataAttributes,
  FitbitActivityDataOptionalAttributes
>;

export class FitbitActivityData
  extends Model<
    FitbitActivityDataAttributes,
    FitbitActivityDataCreationAttributes
  >
  implements FitbitActivityDataAttributes
{
  declare id: number;
  declare user_id: number;
  declare date: Date;
  declare steps: number;
  declare distance_km: number;
  declare calories_total?: number;
  declare heart_rate: number;
  declare created_at?: Date;

  // FitbitActivityData belongsTo Users via user_id
  user!: Users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<Users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<Users, UsersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<Users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof FitbitActivityData {
    return FitbitActivityData.init(
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
        steps: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        distance_km: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        calories_total: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        heart_rate: {
          type: DataTypes.FLOAT,
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
        tableName: 'fitbit_activity_data',
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
