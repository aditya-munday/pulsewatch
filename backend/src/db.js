// ==============================================================================
// Database & Models (db.js) - Super Simple All-in-One
// ==============================================================================
// Instead of splitting models across multiple files, everything is kept here
// so students can easily see the whole database structure in one place.
// ==============================================================================

import { Sequelize, DataTypes } from 'sequelize';
import 'dotenv/config';

// 1. Connect to PostgreSQL
export const sequelize = new Sequelize(
  process.env.DB_NAME || 'pulsewatch_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false // Keep terminal clean
  }
);

// 2. User Model (stores registered accounts)
export const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false }
});

// 3. Monitor Model (stores websites being monitored)
export const Monitor = sequelize.define('Monitor', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'PENDING' }, // UP, DOWN, PENDING
  lastResponseTime: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// 4. Heartbeat Model (historical ping logs for graphs)
export const Heartbeat = sequelize.define('Heartbeat', {
  monitorId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  responseTime: { type: DataTypes.INTEGER, defaultValue: 0 },
  checkedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

// 5. Relationships (Associations)
// User has many Monitors
User.hasMany(Monitor, { foreignKey: 'userId', onDelete: 'CASCADE' });
Monitor.belongsTo(User, { foreignKey: 'userId' });

// Monitor has many Heartbeats
Monitor.hasMany(Heartbeat, { foreignKey: 'monitorId', onDelete: 'CASCADE' });
Heartbeat.belongsTo(Monitor, { foreignKey: 'monitorId' });

// 6. Connect & sync helper
export async function connectDB() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // Automatically creates tables
    console.log('✅ PostgreSQL connected & tables synced');
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
  }
}
