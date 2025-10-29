import type { Socket } from 'socket.io-client';

export interface User {
  id: number;
  username: string;
  displayName?: string | null;
  email?: string | null;
  avatar?: string;
  wins?: number;
  losses?: number;
  isOnline?: boolean;
  lastSeen?: string | Date;
  provider?: string;
  providerId?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  sessions?: number;
}

export interface LanguageContent {
  Game: string;
  Profile: string;
  FriendRequest: string;
  Settings: string;
  Logout: string;
  Searcher: string;
  
  // Notifications
  Notifications: string;
  NotyClearAll: string;
  NotyNoNewNotications: string;
  NotyYoureCaughtUp: string;
  NotyViewAllNotications: string;
  NotyHasSendYouAFriendRequest: string;
  secondsAgo: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  weeksAgo: string;
  
  grettings: string;
  welcome: string;
  
  // Profile Section
  profileWelcome: string;
  changeAvatar: string;
  changePassword: string;
  profileUsername: string;
  profileDisplayName: string;
  profilePHDisplayName: string;
  profileEmail: string;
  profilePHEmail: string;
  updateProfile: string;
  profileGameStatistics: string;
  profileWins: string;
  profileLosses: string;
  profileWinRate: string;
  profileFriends: string;
  profilePHenterUsername: string;
  profileAddFriend: string;
  profileNoFriendsYet: string;
  profileIsOnline: string;
  profileIsOffline: string;
  profileMatchHistory: string;
  profileNoMatchesYet: string;
  profileWinMatch: string;
  profileLossMatch: string;
  profileScore: string;
  
  // FriendRequest Section
  frAcceptFriend: string;
  frDeclineFriend: string;
  frNoFriendRequest: string;
  frNoFriendRequestMsg: string;
  frWantsToBeYourFriend: string;
  
  // Matches
  matchesROOMSRUNNING: string;
  matchesNoActiveRooms: string;
  matchesNoActiveRoomsMsg: string;
  matchesNoActiveRoomsAdvice?: string;
  matchesAVAILABLE?: string;
  matchesROOMFULL?: string;
  matchesCannotJoin?: string;
  CannotJoin?: string; // AÑADIDO: también está en el código
  matchesWaiting: string;
  matchesPlayer1: string;
  matchesClickToJoin: string;
  gameWaitingForOpponen?: string; // AÑADIDO: también está en el código
  
  // Game
  gamePongGame: string;
  gameOponent?: string; // typo en original
  gameOpponent: string;
  gameStartGame: string;
  gameRoomName: string;
  gameEnterRoomName: string;
  gameSelectDifficulty: string;
  gameEasy: string;
  gameMedium: string;
  gameHard: string;
  gameWaitingForOpponent: string;
  gameGetReadyToPlay: string;
  gameCreateNewRoom: string;
  gameWaiting: string;
  
  // Settings
  setSelectLanguage: string;
  setCurrentLanguage: string;
}

export interface AuthContextType {
  user?: User | null;
  setUser?: (user: User | null) => void;
  token?: string | null;
  setToken?: (token: string | null) => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  language?: Record<string, LanguageContent>;
  lan?: string;
  setLan?: (lan: string) => void;
  login?: (token: string) => void;
  logout?: () => void;
  setLanguage?: (lan: string) => void;
}

// 🔥 INTERFAZ CORREGIDA - ComponentContextType
export interface NotificationItem {
  id: number;
  user: string;
  msg: string;
  time: number;
  type: 'friendRequest' | 'gameInvite' | 'system';
  status: boolean;
}
export interface ComponentContextType {
  // Notifications
  notifications?: number;
  setNotifications?: (notifications: number | ((prev: number) => number)) => void;
  notificationsList?: NotificationItem[];
  setNotificationsList?: (list: NotificationItem[] | ((prev: NotificationItem[]) => NotificationItem[])) => void;
  
  // Socket
  socket?: Socket | null;
  
  // Game Rooms
  roomsRunning?: GameRoom[];
  setRoomsRunning?: (rooms: GameRoom[]) => void;
  roomIamIn?: string;
  setRoomIamIn?: (room: string) => void;
  
  // Game State
  isAiEnabled?: boolean;
  setIsAiEnabled?: (enabled: boolean) => void;
  waitingForOpponent?: boolean;
  setWaitingForOpponent?: (waiting: boolean) => void;
}

export interface Friend {
  id?: number;
  username: string;
  displayName?: string;
  isOnline?: boolean;
  status?: string;
  avatar?: string; // AÑADIDO: usado en Profile
}

export interface Match {
  id?: number;
  winner?: string;
  loser?: string;
  date?: string;
  score?: string;
  result?: string;
  opponent?: string;
  // AÑADIDOS: campos usados en Profile
  winnerId?: number;
  Player1?: { username: string };
  Player2?: { username: string };
  player1Score?: number;
  player2Score?: number;
  duration?: number;
  startGameTime?: string;
}

export interface GameRoom {
  roomId: string;
  players: Array<{
    id?: string;
    username?: string;
    isPlayer1: boolean;
    userId?: number;
  }>;
  gameState?: any;
  startTime?: number;
  aiEnabled?: boolean;
  status?: string;
}