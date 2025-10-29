import { start } from 'repl';
import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './backend/database.sqlite',
  logging: false
});

export const User = sequelize.define('User', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: true },
  displayName: { type: DataTypes.STRING, unique: true, allowNull: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: true },
  avatar: { type: DataTypes.STRING, defaultValue: '' },
  wins: { type: DataTypes.INTEGER, defaultValue: 0 },
  losses: { type: DataTypes.INTEGER, defaultValue: 0 },
  isOnline: { type: DataTypes.BOOLEAN, defaultValue: false },
  lastSeen: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  provider: {
    type: DataTypes.STRING, // e.g. "local", "google"
    allowNull: false,
    defaultValue: 'local',
  },
  providerId: {
    type: DataTypes.STRING, // Google "sub" value
    allowNull: true,
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sessions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
});

export const Friendship = sequelize.define('Friendship', {
	id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  status: { 
    type: DataTypes.ENUM('pending', 'accepted', 'blocked'), 
    defaultValue: 'pending' 
  },
  challenge: {
	type: DataTypes.STRING,
	defaultValue: ""
  }
});

export const Match = sequelize.define('Match', {
	id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },



  tournamentId: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  }, // null for non-tournament matches
  roundNumber: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },



  player1Id: { type: DataTypes.INTEGER, allowNull: false },
  player2Id: { type: DataTypes.INTEGER, allowNull: false },
  player1Score: { type: DataTypes.INTEGER, defaultValue: 0 },
  player2Score: { type: DataTypes.INTEGER, defaultValue: 0 },
  winnerId: { type: DataTypes.INTEGER, allowNull: true },
  duration: { type: DataTypes.INTEGER, defaultValue: 0 }, // in seconds
  startGameTime: { type: DataTypes.STRING, defaultValue: ''}, // insecond
  gameType: { type: DataTypes.STRING, defaultValue: '1v1' }
});




export const Tournament = sequelize.define('Tournament', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  description: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  status: { 
    type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'), 
    defaultValue: 'pending' 
  },
  maxParticipants: { 
    type: DataTypes.INTEGER, 
    defaultValue: 8 
  },
  currentRound: { 
    type: DataTypes.INTEGER, 
    defaultValue: 1 
  },
  tournamentType: { 
    type: DataTypes.ENUM('single-elimination', 'double-elimination', 'round-robin'), 
    defaultValue: 'single-elimination' 
  },
  startDate: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
  endDate: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
  winnerId: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },
  createdBy: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  }
});

export const TournamentParticipant = sequelize.define('TournamentParticipant', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  tournamentId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  userId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  seed: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },
  status: { 
    type: DataTypes.ENUM('registered', 'active', 'eliminated', 'withdrawn'), 
    defaultValue: 'registered' 
  },
  placement: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  }
});

// Define associations
User.belongsToMany(User, { 
  through: Friendship, 
  as: 'Friends',
  foreignKey: 'userId',
  otherKey: 'friendId'
});

// The .belongsTo association is necessary to link User information by ID.
// It enables us to easily get full User details from a related model using only the user's ID.

// Add direct associations for Friendship model
Friendship.belongsTo(User, { as: 'User', foreignKey: 'userId' });
Friendship.belongsTo(User, { as: 'Friend', foreignKey: 'friendId' });

Match.belongsTo(User, { as: 'Player1', foreignKey: 'player1Id' });
Match.belongsTo(User, { as: 'Player2', foreignKey: 'player2Id' });
Match.belongsTo(User, { as: 'Winner', foreignKey: 'winnerId' });

// Associate User with Match as both Player1 and Player2.
// These models allow us to get all matches where the user participated, either as player1 or player2.
User.hasMany(Match, { as: 'Player1Matches', foreignKey: 'player1Id' });
User.hasMany(Match, { as: 'Player2Matches', foreignKey: 'player2Id' });







//Tournament Associations
// Tournament associations
Tournament.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy' });
Tournament.belongsTo(User, { as: 'Winner', foreignKey: 'winnerId' });
Tournament.hasMany(Match, { as: 'Matches', foreignKey: 'tournamentId' });

// TournamentParticipant associations
Tournament.belongsToMany(User, { 
  through: TournamentParticipant, 
  as: 'Participants',
  foreignKey: 'tournamentId',
  otherKey: 'userId'
});


User.belongsToMany(Tournament, { 
  through: TournamentParticipant, 
  as: 'Tournaments',
  foreignKey: 'userId',
  otherKey: 'tournamentId'
});

TournamentParticipant.belongsTo(User, { as: 'User', foreignKey: 'userId' });
TournamentParticipant.belongsTo(Tournament, { as: 'Tournament', foreignKey: 'tournamentId' });

// Match-Tournament association
Match.belongsTo(Tournament, { as: 'Tournament', foreignKey: 'tournamentId' });







// Initialize database
export async function initializeDatabase() {
  await sequelize.sync({ force: true }); // This will drop and recreate tables
  console.log('✅ Database synced (tables recreated)');
}
