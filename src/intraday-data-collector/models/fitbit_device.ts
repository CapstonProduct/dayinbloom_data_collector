import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { Users, UsersId } from './users';

export interface FitbitDeviceAttributes {
  id: number;
  user_id: number;
  device_id: number;
  device_version?: string;
  battery_level?: string;
  last_sync_time?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export type FitbitDevicePk = 'id';
export type FitbitDeviceId = FitbitDevice[FitbitDevicePk];
export type FitbitDeviceOptionalAttributes =
  | 'id'
  | 'device_version'
  | 'battery_level'
  | 'last_sync_time'
  | 'created_at'
  | 'updated_at';
export type FitbitDeviceCreationAttributes = Optional<
  FitbitDeviceAttributes,
  FitbitDeviceOptionalAttributes
>;

export class FitbitDevice
  extends Model<FitbitDeviceAttributes, FitbitDeviceCreationAttributes>
  implements FitbitDeviceAttributes
{
  declare id: number;
  declare user_id: number;
  declare device_id: number;
  declare device_version?: string;
  declare battery_level?: string;
  declare last_sync_time?: Date;
  declare created_at?: Date;
  declare updated_at?: Date;

  // FitbitDevice belongsTo Users via user_id
  user!: Users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<Users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<Users, UsersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<Users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof FitbitDevice {
    return FitbitDevice.init(
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
        device_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        device_version: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        battery_level: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        last_sync_time: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        sequelize,
        tableName: 'fitbit_device',
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
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
          },
        ],
      },
    );
  }
}
