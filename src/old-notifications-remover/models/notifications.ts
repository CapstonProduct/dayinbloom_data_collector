import { DataTypes, Sequelize } from 'sequelize';

export default function initNotificationModel(sequelize: Sequelize) {
  return sequelize.define(
    'Notifications',
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
      notification_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      triggered_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: 0,
      },
      is_push_sent: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      tableName: 'notifications',
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
