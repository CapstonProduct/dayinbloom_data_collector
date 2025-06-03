import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { FitbitAverage, FitbitAverageId } from './fitbit_average';
import type {
  FitbitAverageHistory,
  FitbitAverageHistoryId,
} from './fitbit_average_history';

export interface UsersAttributes {
  id: number;
  username: string;
  birth_date: string;
  gender: '남성' | '여성';
  address?: string;
  phone_number?: string;
  height?: number;
  weight?: number;
  BMI?: number;
  profile_image_url?: string;
  profile_image_key?: string;
  encodedId?: string;
  breakfast_time?: string;
  lunch_time?: string;
  dinner_time?: string;
  kakao_user_id?: string;
  role: 'senior' | 'guardian' | 'doctor';
  login_provider: 'fitbit' | 'kakao';
  is_profile_complete?: number;
  last_login?: Date;
  refresh_token?: string;
  access_token?: string;
  guardian_code?: string;
  doctor_code?: string;
  status?: 'active' | 'deleted' | 'inactive';
  deleted_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  access_token_expires?: Date;
}

export type UsersPk = 'id';
export type UsersId = Users[UsersPk];
export type UsersOptionalAttributes =
  | 'id'
  | 'address'
  | 'phone_number'
  | 'height'
  | 'weight'
  | 'BMI'
  | 'profile_image_url'
  | 'profile_image_key'
  | 'encodedId'
  | 'breakfast_time'
  | 'lunch_time'
  | 'dinner_time'
  | 'kakao_user_id'
  | 'is_profile_complete'
  | 'last_login'
  | 'refresh_token'
  | 'access_token'
  | 'guardian_code'
  | 'doctor_code'
  | 'status'
  | 'deleted_at'
  | 'created_at'
  | 'updated_at'
  | 'access_token_expires';
export type UsersCreationAttributes = Optional<
  UsersAttributes,
  UsersOptionalAttributes
>;

export class Users
  extends Model<UsersAttributes, UsersCreationAttributes>
  implements UsersAttributes
{
  declare id: number;
  declare username: string;
  declare birth_date: string;
  declare gender: '남성' | '여성';
  declare address?: string;
  declare phone_number?: string;
  declare height?: number;
  declare weight?: number;
  declare BMI?: number;
  declare profile_image_url?: string;
  declare profile_image_key?: string;
  declare encodedId?: string;
  declare breakfast_time?: string;
  declare lunch_time?: string;
  declare dinner_time?: string;
  declare kakao_user_id?: string;
  declare role: 'senior' | 'guardian' | 'doctor';
  declare login_provider: 'fitbit' | 'kakao';
  declare is_profile_complete?: number;
  declare last_login?: Date;
  declare refresh_token?: string;
  declare access_token?: string;
  declare guardian_code?: string;
  declare doctor_code?: string;
  declare status?: 'active' | 'deleted' | 'inactive';
  declare deleted_at?: Date;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare access_token_expires?: Date;

  // Users hasMany FitbitAverage via user_id
  fitbit_averages!: FitbitAverage[];
  getFitbit_averages!: Sequelize.HasManyGetAssociationsMixin<FitbitAverage>;
  setFitbit_averages!: Sequelize.HasManySetAssociationsMixin<
    FitbitAverage,
    FitbitAverageId
  >;
  addFitbit_average!: Sequelize.HasManyAddAssociationMixin<
    FitbitAverage,
    FitbitAverageId
  >;
  addFitbit_averages!: Sequelize.HasManyAddAssociationsMixin<
    FitbitAverage,
    FitbitAverageId
  >;
  createFitbit_average!: Sequelize.HasManyCreateAssociationMixin<FitbitAverage>;
  removeFitbit_average!: Sequelize.HasManyRemoveAssociationMixin<
    FitbitAverage,
    FitbitAverageId
  >;
  removeFitbit_averages!: Sequelize.HasManyRemoveAssociationsMixin<
    FitbitAverage,
    FitbitAverageId
  >;
  hasFitbit_average!: Sequelize.HasManyHasAssociationMixin<
    FitbitAverage,
    FitbitAverageId
  >;
  hasFitbit_averages!: Sequelize.HasManyHasAssociationsMixin<
    FitbitAverage,
    FitbitAverageId
  >;
  countFitbit_averages!: Sequelize.HasManyCountAssociationsMixin;
  // Users hasMany FitbitAverageHistory via user_id
  fitbit_average_histories!: FitbitAverageHistory[];
  getFitbit_average_histories!: Sequelize.HasManyGetAssociationsMixin<FitbitAverageHistory>;
  setFitbit_average_histories!: Sequelize.HasManySetAssociationsMixin<
    FitbitAverageHistory,
    FitbitAverageHistoryId
  >;
  addFitbit_average_history!: Sequelize.HasManyAddAssociationMixin<
    FitbitAverageHistory,
    FitbitAverageHistoryId
  >;
  addFitbit_average_histories!: Sequelize.HasManyAddAssociationsMixin<
    FitbitAverageHistory,
    FitbitAverageHistoryId
  >;
  createFitbit_average_history!: Sequelize.HasManyCreateAssociationMixin<FitbitAverageHistory>;
  removeFitbit_average_history!: Sequelize.HasManyRemoveAssociationMixin<
    FitbitAverageHistory,
    FitbitAverageHistoryId
  >;
  removeFitbit_average_histories!: Sequelize.HasManyRemoveAssociationsMixin<
    FitbitAverageHistory,
    FitbitAverageHistoryId
  >;
  hasFitbit_average_history!: Sequelize.HasManyHasAssociationMixin<
    FitbitAverageHistory,
    FitbitAverageHistoryId
  >;
  hasFitbit_average_histories!: Sequelize.HasManyHasAssociationsMixin<
    FitbitAverageHistory,
    FitbitAverageHistoryId
  >;
  countFitbit_average_histories!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof Users {
    return Users.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true,
        },
        username: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
        birth_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        gender: {
          type: DataTypes.ENUM('남성', '여성'),
          allowNull: false,
        },
        address: {
          type: DataTypes.STRING(127),
          allowNull: true,
        },
        phone_number: {
          type: DataTypes.STRING(15),
          allowNull: true,
        },
        height: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        weight: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        BMI: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        profile_image_url: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        profile_image_key: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        encodedId: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        breakfast_time: {
          type: DataTypes.TIME,
          allowNull: true,
        },
        lunch_time: {
          type: DataTypes.TIME,
          allowNull: true,
        },
        dinner_time: {
          type: DataTypes.TIME,
          allowNull: true,
        },
        kakao_user_id: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        role: {
          type: DataTypes.ENUM('senior', 'guardian', 'doctor'),
          allowNull: false,
        },
        login_provider: {
          type: DataTypes.ENUM('fitbit', 'kakao'),
          allowNull: false,
        },
        is_profile_complete: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: 0,
        },
        last_login: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        refresh_token: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        access_token: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        guardian_code: {
          type: DataTypes.STRING(18),
          allowNull: true,
          unique: 'guardian_code',
        },
        doctor_code: {
          type: DataTypes.STRING(18),
          allowNull: true,
          unique: 'doctor_code',
        },
        status: {
          type: DataTypes.ENUM('active', 'deleted', 'inactive'),
          allowNull: true,
          defaultValue: 'active',
        },
        deleted_at: {
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
        access_token_expires: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id' }],
          },
          {
            name: 'guardian_code',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'guardian_code' }],
          },
          {
            name: 'doctor_code',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'doctor_code' }],
          },
        ],
      },
    );
  }
}
