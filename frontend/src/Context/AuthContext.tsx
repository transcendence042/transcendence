import { createContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { User, AuthContextType, LanguageContent } from "../types";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthContextProviderProps {
  children: ReactNode;
}

export function AuthContextProvider({ children }: AuthContextProviderProps): React.ReactElement {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState<boolean>(true);
    const [lan, setLan] = useState<string>(localStorage.getItem('language') || 'en');
    
    const language: Record<string, LanguageContent> = {
    // English
    en: {
        Game: 'game',
        Profile: 'profile',
        FriendRequest: 'Friend Request',
        Settings: 'settings',
        Logout: 'logout',
        Searcher: 'Search players, matches...',

        // Notifications
        Notifications: 'Notifications',
        NotyClearAll: 'Clear all',
        NotyNoNewNotications: 'No new notifications',
        NotyYoureCaughtUp: 'You’re all caught up!',
        NotyViewAllNotications: 'View all notifications →',
        NotyHasSendYouAFriendRequest: 'has sent you a friend request',
        secondsAgo: 'seconds ago',
        minutesAgo: 'minutes ago',
        hoursAgo: 'hours ago',
        daysAgo: 'days ago',
        weeksAgo: 'weeks ago',

        grettings: `Hi there ${user?.username || 'user1'}`,
        welcome: `Welcome to the time of your life!`,

        // Profile Section
        profileWelcome: 'My Profile',
        changeAvatar: 'Change Avatar',
        changePassword: 'Change Password',
        profileUsername: 'Username:',
        profileDisplayName: 'Display Name',
        profilePHDisplayName: 'Enter display name',
        profileEmail: 'Email:',
        profilePHEmail: 'Enter email',
        updateProfile: 'Update Profile',
        profileGameStatistics: 'Game Statistics',
        profileWins: 'Wins',
        profileLosses: 'Losses',
        profileWinRate: 'Win Rate',
        profileFriends: 'Friends',
        profilePHenterUsername: 'Enter Username',
        profileAddFriend: 'Add Friend',
        profileNoFriendsYet: 'No Friend Requests',
        profileIsOnline: 'Online',
        profileIsOffline: 'Offline',
        profileMatchHistory: 'Match History',
        profileNoMatchesYet: 'No matches yet',
        profileWinMatch: 'WIN',
        profileLossMatch: 'LOSS',
        profileScore: 'Score',

        // FriendRequest Section
        frAcceptFriend: 'Accept',
        frDeclineFriend: 'Decline',
        frNoFriendRequest: 'No Friend Requests',
        frNoFriendRequestMsg: "You don't have any friend requests at the moment.",
        frWantsToBeYourFriend: 'Wants to be your friend',

        // Matches
        matchesROOMSRUNNING: 'ROOMS RUNNING',
        matchesNoActiveRooms: 'No Active Rooms',
        matchesNoActiveRoomsMsg: 'There are currently no game rooms running. Be the first to create one!',
        matchesNoActiveRoomsAdvice: 'Start a new game to see it appear here',
        matchesAVAILABLE: 'AVAILABLE',
        matchesROOMFULL: 'ROOM FULL',
        matchesCannotJoin: 'Cannot join',
        matchesWaiting: 'Waiting...',
        matchesPlayer1: 'Player 1',
        matchesClickToJoin: 'Click to join',

        // Game
        gamePongGame: 'Pong Game',
        gameOponent: 'Oponent', // Added as requested
        gameOpponent: 'Opponent',
        gameStartGame: 'Start Game',
        gameRoomName: 'Room Name',
        gameEnterRoomName: 'Enter room name...',
        gameSelectDifficulty: 'Select Difficulty',
        gameEasy: 'Easy',
        gameMedium: 'Medium',
        gameHard: 'Hard',
        gameWaitingForOpponent: 'Waiting for opponent...',
        gameGetReadyToPlay: '🎮 Get ready to play!',
        gameCreateNewRoom: 'Create New Room',
        gameWaiting: 'waiting...',

        // Settings
        setSelectLanguage: 'Select Language',
        setCurrentLanguage: 'Current Language:'
    },

    // Portuguese
    pt: {
        Game: 'jogo',
        Profile: 'perfil',
        FriendRequest: 'Solicitação de Amizade',
        Settings: 'configurações',
        Logout: 'sair',
        Searcher: 'Pesquisar jogadores, partidas...',
        Notifications: 'Notificações',
        NotyClearAll: 'Limpar tudo',
        NotyNoNewNotications: 'Nenhuma notificação nova',
        NotyYoureCaughtUp: 'Você está atualizado!',
        NotyViewAllNotications: 'Ver todas as notificações →',
        NotyHasSendYouAFriendRequest: 'enviou uma solicitação de amizade',
        secondsAgo: 'segundos atrás',
        minutesAgo: 'minutos atrás',
        hoursAgo: 'horas atrás',
        daysAgo: 'dias atrás',
        weeksAgo: 'semanas atrás',

        grettings: `Olá ${user?.username || 'user1'}`,
        welcome: `Bem-vindo ao momento da sua vida!`,

        // Profile Section
        profileWelcome: 'Meu Perfil',
        changeAvatar: 'Alterar Avatar',
        changePassword: 'Alterar Senha',
        profileUsername: 'Nome de Usuário:',
        profileDisplayName: 'Nome de Exibição',
        profilePHDisplayName: 'Digite o nome de exibição',
        profileEmail: 'E-mail:',
        profilePHEmail: 'Digite o e-mail',
        updateProfile: 'Atualizar Perfil',
        profileGameStatistics: 'Estatísticas do Jogo',
        profileWins: 'Vitórias',
        profileLosses: 'Derrotas',
        profileWinRate: 'Taxa de Vitória',
        profileFriends: 'Amigos',
        profilePHenterUsername: 'Digite o Nome de Usuário',
        profileAddFriend: 'Adicionar Amigo',
        profileNoFriendsYet: 'Ainda sem amigos',
        profileIsOnline: 'Online',
        profileIsOffline: 'Offline',
        profileMatchHistory: 'Histórico de Partidas',
        profileNoMatchesYet: 'Ainda sem partidas',
        profileWinMatch: 'VITÓRIA',
        profileLossMatch: 'DERROTA',
        profileScore: 'Pontuação',

        // FriendRequest Section
        frAcceptFriend: 'Aceitar',
        frDeclineFriend: 'Recusar',
        frNoFriendRequest: 'Nenhuma Solicitação de Amizade',
        frNoFriendRequestMsg: 'Você não tem solicitações de amizade no momento.',
        frWantsToBeYourFriend: 'Quer ser seu amigo',

        // Matches
        matchesROOMSRUNNING: 'SALAS EM EXECUÇÃO',
        matchesNoActiveRooms: 'Nenhuma Sala Ativa',
        matchesNoActiveRoomsMsg: 'No momento, não há salas de jogo em execução. Seja o primeiro a criar uma!',
        matchesNoActiveRoomsAdvice: 'Inicie um novo jogo para vê-lo aparecer aqui',
        matchesAVAILABLE: 'DISPONÍVEL',
        matchesROOMFULL: 'SALA CHEIA',
        matchesCannotJoin: 'Não pode entrar',
        matchesWaiting: 'Aguardando...',
        matchesPlayer1: 'Jogador 1',
        matchesClickToJoin: 'Clique para entrar',

        // Game
        gamePongGame: 'Jogo Pong',
        gameOponent: 'Oponente', // Added (using correct Portuguese term, as "Oponent" is not a word)
        gameOpponent: 'Oponente',
        gameStartGame: 'Iniciar Jogo',
        gameRoomName: 'Nome da Sala',
        gameEnterRoomName: 'Digite o nome da sala...',
        gameSelectDifficulty: 'Selecionar Dificuldade',
        gameEasy: 'Fácil',
        gameMedium: 'Médio',
        gameHard: 'Difícil',
        gameWaitingForOpponent: 'Aguardando oponente...',
        gameGetReadyToPlay: '🎮 Prepare-se para jogar!',
        gameCreateNewRoom: 'Criar Nova Sala',
        gameWaiting: 'aguardando...',

        // Settings
        setSelectLanguage: 'Selecionar Idioma',
        setCurrentLanguage: 'Idioma Atual:'
    },

    // French
    fr: {
        Game: 'jeu',
        Profile: 'profil',
        FriendRequest: 'Demande d\'ami',
        Settings: 'paramètres',
        Logout: 'déconnexion',
        Searcher: 'Rechercher des joueurs, des matchs...',
        Notifications: 'Notifications',
        NotyClearAll: 'Tout effacer',
        NotyNoNewNotications: 'Aucune nouvelle notification',
        NotyYoureCaughtUp: 'Vous êtes à jour !',
        NotyViewAllNotications: 'Voir toutes les notifications →',
        NotyHasSendYouAFriendRequest: 'vous a envoyé une demande d\'ami',
        secondsAgo: 'secondes auparavant',
        minutesAgo: 'minutes auparavant',
        hoursAgo: 'heures auparavant',
        daysAgo: 'jours auparavant',
        weeksAgo: 'semaines auparavant',

        grettings: `Bonjour ${user?.username || 'user1'}`,
        welcome: `Bienvenue au moment de votre vie !`,

        // Profile Section
        profileWelcome: 'Mon Profil',
        changeAvatar: 'Changer d\'avatar',
        changePassword: 'Changer le mot de passe',
        profileUsername: 'Nom d\'utilisateur :',
        profileDisplayName: 'Nom d\'affichage',
        profilePHDisplayName: 'Entrez le nom d\'affichage',
        profileEmail: 'E-mail :',
        profilePHEmail: 'Entrez l\'e-mail',
        updateProfile: 'Mettre à jour le profil',
        profileGameStatistics: 'Statistiques de jeu',
        profileWins: 'Victoires',
        profileLosses: 'Défaites',
        profileWinRate: 'Taux de victoire',
        profileFriends: 'Amis',
        profilePHenterUsername: 'Entrez le nom d\'utilisateur',
        profileAddFriend: 'Ajouter un ami',
        profileNoFriendsYet: 'Aucun ami pour l\'instant',
        profileIsOnline: 'En ligne',
        profileIsOffline: 'Hors ligne',
        profileMatchHistory: 'Historique des matchs',
        profileNoMatchesYet: 'Aucun match pour l\'instant',
        profileWinMatch: 'VICTOIRE',
        profileLossMatch: 'DÉFAITE',
        profileScore: 'Score',

        // FriendRequest Section
        frAcceptFriend: 'Accepter',
        frDeclineFriend: 'Refuser',
        frNoFriendRequest: 'Aucune demande d\'ami',
        frNoFriendRequestMsg: 'Vous n\'avez aucune demande d\'ami pour le moment.',
        frWantsToBeYourFriend: 'Veut être votre ami',

        // Matches
        matchesROOMSRUNNING: 'SALLES EN COURS',
        matchesNoActiveRooms: 'Aucune salle active',
        matchesNoActiveRoomsMsg: 'Il n\'y a actuellement aucune salle de jeu en cours. Soyez le premier à en créer une !',
        matchesNoActiveRoomsAdvice: 'Démarrez une nouvelle partie pour la voir apparaître ici',
        matchesAVAILABLE: 'DISPONIBLE',
        matchesROOMFULL: 'SALLE PLEINE',
        matchesCannotJoin: 'Impossible de rejoindre',
        matchesWaiting: 'En attente...',
        matchesPlayer1: 'Joueur 1',
        matchesClickToJoin: 'Cliquez pour rejoindre',

        // Game
        gamePongGame: 'Jeu de Pong',
        gameOponent: 'Oposant', // Added (using French equivalent, acknowledging English misspelling)
        gameOpponent: 'Adversaire',
        gameStartGame: 'Démarrer le jeu',
        gameRoomName: 'Nom de la salle',
        gameEnterRoomName: 'Entrez le nom de la salle...',
        gameSelectDifficulty: 'Sélectionner la difficulté',
        gameEasy: 'Facile',
        gameMedium: 'Moyen',
        gameHard: 'Difficile',
        gameWaitingForOpponent: 'En attente d\'un adversaire...',
        gameGetReadyToPlay: '🎮 Préparez-vous à jouer !',
        gameCreateNewRoom: 'Créer une nouvelle salle',
        gameWaiting: 'en attente...',

        // Settings
        setSelectLanguage: 'Sélectionner la langue',
        setCurrentLanguage: 'Langue actuelle :'
    },

    // Japanese
    ja: {
        Game: 'ゲーム',
        Profile: 'プロフィール',
        FriendRequest: '友達リクエスト',
        Settings: '設定',
        Logout: 'ログアウト',
        Searcher: 'プレイヤー、マッチを検索...',
        Notifications: '通知',
        NotyClearAll: 'すべてクリア',
        NotyNoNewNotications: '新しい通知はありません',
        NotyYoureCaughtUp: 'すべて確認済みです！',
        NotyViewAllNotications: 'すべての通知を見る →',
        NotyHasSendYouAFriendRequest: 'が友達リクエストを送信しました',
        secondsAgo: '秒前',
        minutesAgo: '分前',
        hoursAgo: '時間前',
        daysAgo: '日前',
        weeksAgo: '週間前',

        grettings: `こんにちは ${user?.username || 'user1'}`,
        welcome: `人生最高の時間へようこそ！`,

        // Profile Section
        profileWelcome: 'マイプロフィール',
        changeAvatar: 'アバターを変更',
        changePassword: 'パスワードを変更',
        profileUsername: 'ユーザー名：',
        profileDisplayName: '表示名',
        profilePHDisplayName: '表示名を入力',
        profileEmail: 'メール：',
        profilePHEmail: 'メールを入力',
        updateProfile: 'プロフィールを更新',
        profileGameStatistics: 'ゲーム統計',
        profileWins: '勝利',
        profileLosses: '敗北',
        profileWinRate: '勝率',
        profileFriends: '友達',
        profilePHenterUsername: 'ユーザー名を入力',
        profileAddFriend: '友達を追加',
        profileNoFriendsYet: 'まだ友達がいません',
        profileIsOnline: 'オンライン',
        profileIsOffline: 'オフライン',
        profileMatchHistory: 'マッチ履歴',
        profileNoMatchesYet: 'まだマッチがありません',
        profileWinMatch: '勝利',
        profileLossMatch: '敗北',
        profileScore: 'スコア',

        // FriendRequest Section
        frAcceptFriend: '受け入れる',
        frDeclineFriend: '拒否',
        frNoFriendRequest: '友達リクエストなし',
        frNoFriendRequestMsg: '現在、友達リクエストはありません。',
        frWantsToBeYourFriend: 'あなたの友達になりたい',

        // Matches
        matchesROOMSRUNNING: '実行中のルーム',
        matchesNoActiveRooms: 'アクティブなルームなし',
        matchesNoActiveRoomsMsg: '現在、実行中のゲームルームはありません。最初に作成してください！',
        matchesNoActiveRoomsAdvice: '新しいゲームを開始してここに表示',
        matchesAVAILABLE: '利用可能',
        matchesROOMFULL: 'ルーム満員',
        matchesCannotJoin: '参加できません',
        matchesWaiting: '待機中...',
        matchesPlayer1: 'プレイヤー1',
        matchesClickToJoin: 'クリックして参加',

        // Game
        gamePongGame: 'ポンゲーム',
        gameOponent: 'オポネント', // Added (using katakana for "Oponent" to reflect English misspelling)
        gameOpponent: '対戦相手',
        gameStartGame: 'ゲーム開始',
        gameRoomName: 'ルーム名',
        gameEnterRoomName: 'ルーム名を入力...',
        gameSelectDifficulty: '難易度を選択',
        gameEasy: '簡単',
        gameMedium: '中級',
        gameHard: '難しい',
        gameWaitingForOpponent: '対戦相手を待機中...',
        gameGetReadyToPlay: '🎮 プレイの準備を！',
        gameCreateNewRoom: '新しいルームを作成',
        gameWaiting: '待機中...',

        // Settings
        setSelectLanguage: '言語を選択',
        setCurrentLanguage: '現在の言語：'
    },

    // Chinese (Simplified)
    zh: {
        Game: '游戏',
        Profile: '个人资料',
        FriendRequest: '好友请求',
        Settings: '设置',
        Logout: '退出',
        Searcher: '搜索玩家、比赛...',
        Notifications: '通知',
        NotyClearAll: '全部清除',
        NotyNoNewNotications: '没有新通知',
        NotyYoureCaughtUp: '您已全部查看！',
        NotyViewAllNotications: '查看所有通知 →',
        NotyHasSendYouAFriendRequest: '发送了好友请求',
        secondsAgo: '秒前',
        minutesAgo: '分钟前',
        hoursAgo: '小时前',
        daysAgo: '天前',
        weeksAgo: '周前',

        grettings: `你好 ${user?.username || 'user1'}`,
        welcome: `欢迎来到你生命中最美好的时光！`,

        // Profile Section
        profileWelcome: '我的个人资料',
        changeAvatar: '更改头像',
        changePassword: '更改密码',
        profileUsername: '用户名：',
        profileDisplayName: '显示名称',
        profilePHDisplayName: '输入显示名称',
        profileEmail: '电子邮件：',
        profilePHEmail: '输入电子邮件',
        updateProfile: '更新个人资料',
        profileGameStatistics: '游戏统计',
        profileWins: '胜利',
        profileLosses: '失败',
        profileWinRate: '胜率',
        profileFriends: '好友',
        profilePHenterUsername: '输入用户名',
        profileAddFriend: '添加好友',
        profileNoFriendsYet: '暂无好友',
        profileIsOnline: '在线',
        profileIsOffline: '离线',
        profileMatchHistory: '比赛历史',
        profileNoMatchesYet: '暂无比赛',
        profileWinMatch: '胜利',
        profileLossMatch: '失败',
        profileScore: '分数',

        // FriendRequest Section
        frAcceptFriend: '接受',
        frDeclineFriend: '拒绝',
        frNoFriendRequest: '无好友请求',
        frNoFriendRequestMsg: '您目前没有好友请求。',
        frWantsToBeYourFriend: '想成为您的好友',

        // Matches
        matchesROOMSRUNNING: '正在运行的房间',
        matchesNoActiveRooms: '无活跃房间',
        matchesNoActiveRoomsMsg: '目前没有正在运行的游戏房间。成为第一个创建的人吧！',
        matchesNoActiveRoomsAdvice: '开始新游戏以在此处显示',
        matchesAVAILABLE: '可加入',
        matchesROOMFULL: '房间已满',
        matchesCannotJoin: '无法加入',
        matchesWaiting: '等待中...',
        matchesPlayer1: '玩家1',
        matchesClickToJoin: '点击加入',

        // Game
        gamePongGame: '乒乓游戏',
        gameOponent: '对手', // Added (using standard term, as "Oponent" is not transliterated)
        gameOpponent: '对手',
        gameStartGame: '开始游戏',
        gameRoomName: '房间名称',
        gameEnterRoomName: '输入房间名称...',
        gameSelectDifficulty: '选择难度',
        gameEasy: '简单',
        gameMedium: '中等',
        gameHard: '困难',
        gameWaitingForOpponent: '等待对手...',
        gameGetReadyToPlay: '🎮 准备好玩吧！',
        gameCreateNewRoom: '创建新房间',
        gameWaiting: '等待中...',

        // Settings
        setSelectLanguage: '选择语言',
        setCurrentLanguage: '当前语言：'
    },

    // Spanish
    es: {
        Game: 'juego',
        Profile: 'perfil',
        FriendRequest: 'Solicitud de Amistad',
        Settings: 'configuración',
        Logout: 'cerrar sesión',
        Searcher: 'Buscar jugadores, partidas...',
        Notifications: 'Notificaciones',
        NotyClearAll: 'Borrar todo',
        NotyNoNewNotications: 'No hay notificaciones nuevas',
        NotyYoureCaughtUp: '¡Estás al día!',
        NotyViewAllNotications: 'Ver todas las notificaciones →',
        NotyHasSendYouAFriendRequest: 'te ha enviado una solicitud de amistad',
        secondsAgo: 'segundos atrás',
        minutesAgo: 'minutos atrás',
        hoursAgo: 'horas atrás',
        daysAgo: 'días atrás',
        weeksAgo: 'semanas atrás',

        grettings: `Hola ${user?.username || 'user1'}`,
        welcome: `¡Bienvenido al momento de tu vida!`,

        // Profile Section
        profileWelcome: 'Mi Perfil',
        changeAvatar: 'Cambiar Avatar',
        changePassword: 'Cambiar Contraseña',
        profileUsername: 'Nombre de Usuario:',
        profileDisplayName: 'Nombre de Visualización',
        profilePHDisplayName: 'Ingresa el nombre de visualización',
        profileEmail: 'Correo Electrónico:',
        profilePHEmail: 'Ingresa el correo electrónico',
        updateProfile: 'Actualizar Perfil',
        profileGameStatistics: 'Estadísticas del Juego',
        profileWins: 'Victorias',
        profileLosses: 'Derrotas',
        profileWinRate: 'Tasa de Victorias',
        profileFriends: 'Amigos',
        profilePHenterUsername: 'Ingresa el Nombre de Usuario',
        profileAddFriend: 'Agregar Amigo',
        profileNoFriendsYet: 'Aún no tienes amigos',
        profileIsOnline: 'En línea',
        profileIsOffline: 'Desconectado',
        profileMatchHistory: 'Historial de Partidas',
        profileNoMatchesYet: 'Aún no hay partidas',
        profileWinMatch: 'VICTORIA',
        profileLossMatch: 'DERROTA',
        profileScore: 'Puntuación',

        // FriendRequest Section
        frAcceptFriend: 'Aceptar',
        frDeclineFriend: 'Rechazar',
        frNoFriendRequest: 'No hay Solicitudes de Amistad',
        frNoFriendRequestMsg: 'No tienes solicitudes de amistad en este momento.',
        frWantsToBeYourFriend: 'Quiere ser tu amigo',

        // Matches
        matchesROOMSRUNNING: 'SALAS EN EJECUCIÓN',
        matchesNoActiveRooms: 'No hay Salas Activas',
        matchesNoActiveRoomsMsg: 'Actualmente no hay salas de juego en ejecución. ¡Sé el primero en crear una!',
        matchesNoActiveRoomsAdvice: 'Inicia un nuevo juego para verlo aparecer aquí',
        matchesAVAILABLE: 'DISPONIBLE',
        matchesROOMFULL: 'SALA LLENA',
        matchesCannotJoin: 'No se puede unir',
        matchesWaiting: 'Esperando...',
        matchesPlayer1: 'Jugador 1',
        matchesClickToJoin: 'Clic para unirte',

        // Game
        gamePongGame: 'Juego de Pong',
        gameOponent: 'Oponente', // Added (using correct Spanish term, as "Oponent" is not a word)
        gameOpponent: 'Oponente',
        gameStartGame: 'Iniciar Juego',
        gameRoomName: 'Nombre de la Sala',
        gameEnterRoomName: 'Ingresa el nombre de la sala...',
        gameSelectDifficulty: 'Seleccionar Dificultad',
        gameEasy: 'Fácil',
        gameMedium: 'Medio',
        gameHard: 'Difícil',
        gameWaitingForOpponent: 'Esperando oponente...',
        gameGetReadyToPlay: '🎮 ¡Prepárate para jugar!',
        gameCreateNewRoom: 'Crear Nueva Sala',
        gameWaiting: 'esperando...',

        // Settings
        setSelectLanguage: 'Seleccionar Idioma',
        setCurrentLanguage: 'Idioma Actual:'
    },

    // Russian
    ru: {
        Game: 'игра',
        Profile: 'профиль',
        FriendRequest: 'Запрос на дружбу',
        Settings: 'настройки',
        Logout: 'выйти',
        Searcher: 'Поиск игроков, матчей...',

        // Notifications
        Notifications: 'Уведомления',
        NotyClearAll: 'Очистить все',
        NotyNoNewNotications: 'Нет новых уведомлений',
        NotyYoureCaughtUp: 'Вы в курсе всех событий!',
        NotyViewAllNotications: 'Посмотреть все уведомления →',
        NotyHasSendYouAFriendRequest: 'отправил вам запрос на дружбу',
        secondsAgo: 'секунд назад',
        minutesAgo: 'минут назад',
        hoursAgo: 'часов назад',
        daysAgo: 'дней назад',
        weeksAgo: 'недель назад',

        grettings: `Привет ${user?.username || 'user1'}`,
        welcome: `Добро пожаловать в лучшее время вашей жизни!`,

        // Profile Section
        profileWelcome: 'Мой профиль',
        changeAvatar: 'Сменить аватар',
        changePassword: 'Сменить пароль',
        profileUsername: 'Имя пользователя:',
        profileDisplayName: 'Отображаемое имя',
        profilePHDisplayName: 'Введите отображаемое имя',
        profileEmail: 'Электронная почта:',
        profilePHEmail: 'Введите электронную почту',
        updateProfile: 'Обновить профиль',
        profileGameStatistics: 'Статистика игр',
        profileWins: 'Победы',
        profileLosses: 'Поражения',
        profileWinRate: 'Процент побед',
        profileFriends: 'Друзья',
        profilePHenterUsername: 'Введите имя пользователя',
        profileAddFriend: 'Добавить друга',
        profileNoFriendsYet: 'Пока нет друзей',
        profileIsOnline: 'В сети',
        profileIsOffline: 'Не в сети',
        profileMatchHistory: 'История матчей',
        profileNoMatchesYet: 'Пока нет матчей',
        profileWinMatch: 'ПОБЕДА',
        profileLossMatch: 'ПОРАЖЕНИЕ',
        profileScore: 'Счёт',

        // FriendRequest Section
        frAcceptFriend: 'Принять',
        frDeclineFriend: 'Отклонить',
        frNoFriendRequest: 'Нет запросов на дружбу',
        frNoFriendRequestMsg: 'На данный момент у вас нет запросов на дружбу.',
        frWantsToBeYourFriend: 'Хочет стать вашим другом',

        // Matches
        matchesROOMSRUNNING: 'АКТИВНЫЕ КОМНАТЫ',
        matchesNoActiveRooms: 'Нет активных комнат',
        matchesNoActiveRoomsMsg: 'В настоящее время нет активных игровых комнат. Станьте первым, кто создаст одну!',
        matchesNoActiveRoomsAdvice: 'Начните новую игру, чтобы она появилась здесь',
        matchesAVAILABLE: 'ДОСТУПНО',
        matchesROOMFULL: 'КОМНАТА ПОЛНА',
        matchesCannotJoin: 'Невозможно присоединиться',
        matchesWaiting: 'Ожидание...',
        matchesPlayer1: 'Игрок 1',
        matchesClickToJoin: 'Нажмите, чтобы присоединиться',

        // Game
        gamePongGame: 'Игра в пинг-понг',
        gameOponent: 'Оппонент', // Added (using Russian transliteration for "Oponent")
        gameOpponent: 'Противник',
        gameStartGame: 'Начать игру',
        gameRoomName: 'Название комнаты',
        gameEnterRoomName: 'Введите название комнаты...',
        gameSelectDifficulty: 'Выберите сложность',
        gameEasy: 'Лёгкий',
        gameMedium: 'Средний',
        gameHard: 'Сложный',
        gameWaitingForOpponent: 'Ожидание противника...',
        gameGetReadyToPlay: '🎮 Приготовьтесь к игре!',
        gameCreateNewRoom: 'Создать новую комнату',
        gameWaiting: 'ожидание...',

        // Settings
        setSelectLanguage: 'Выбрать язык',
        setCurrentLanguage: 'Текущий язык:'
    },

    // Arabic
    ar: {
        Game: 'لعبة',
        Profile: 'الملف الشخصي',
        FriendRequest: 'طلب صداقة',
        Settings: 'الإعدادات',
        Logout: 'تسجيل الخروج',
        Searcher: 'البحث عن لاعبين، مباريات...',
        Notifications: 'الإشعارات',
        NotyClearAll: 'مسح الكل',
        NotyNoNewNotications: 'لا توجد إشعارات جديدة',
        NotyYoureCaughtUp: 'أنت محدث بالكامل!',
        NotyViewAllNotications: 'عرض كل الإشعارات →',
        NotyHasSendYouAFriendRequest: 'أرسل لك طلب صداقة',
        secondsAgo: 'ثوانٍ مضت',
        minutesAgo: 'دقائق مضت',
        hoursAgo: 'ساعات مضت',
        daysAgo: 'أيام مضت',
        weeksAgo: 'أسابيع مضت',

        grettings: `مرحبًا ${user?.username || 'user1'}`,
        welcome: `مرحبًا بك في أفضل لحظات حياتك!`,

        // Profile Section
        profileWelcome: 'ملفي الشخصي',
        changeAvatar: 'تغيير الصورة الرمزية',
        changePassword: 'تغيير كلمة المرور',
        profileUsername: 'اسم المستخدم:',
        profileDisplayName: 'اسم العرض',
        profilePHDisplayName: 'أدخل اسم العرض',
        profileEmail: 'البريد الإلكتروني:',
        profilePHEmail: 'أدخل البريد الإلكتروني',
        updateProfile: 'تحديث الملف الشخصي',
        profileGameStatistics: 'إحصائيات اللعبة',
        profileWins: 'الانتصارات',
        profileLosses: 'الهزائم',
        profileWinRate: 'نسبة الفوز',
        profileFriends: 'الأصدقاء',
        profilePHenterUsername: 'أدخل اسم المستخدم',
        profileAddFriend: 'إضافة صديق',
        profileNoFriendsYet: 'لا توجد طلبات صداقة بعد',
        profileIsOnline: 'متصل',
        profileIsOffline: 'غير متصل',
        profileMatchHistory: 'تاريخ المباريات',
        profileNoMatchesYet: 'لا توجد مباريات بعد',
        profileWinMatch: 'فوز',
        profileLossMatch: 'خسارة',
        profileScore: 'النتيجة',

        // FriendRequest Section
        frAcceptFriend: 'قبول',
        frDeclineFriend: 'رفض',
        frNoFriendRequest: 'لا توجد طلبات صداقة',
        frNoFriendRequestMsg: 'ليس لديك أي طلبات صداقة في الوقت الحالي.',
        frWantsToBeYourFriend: 'يريد أن يكون صديقك',

        // Matches
        matchesROOMSRUNNING: 'الغرف الجارية',
        matchesNoActiveRooms: 'لا توجد غرف نشطة',
        matchesNoActiveRoomsMsg: 'لا توجد غرف ألعاب جارية حاليًا. كن أول من ينشئ واحدة!',
        matchesNoActiveRoomsAdvice: 'ابدأ لعبة جديدة لتظهر هنا',
        matchesAVAILABLE: 'متاح',
        matchesROOMFULL: 'الغرفة ممتلئة',
        matchesCannotJoin: 'لا يمكن الانضمام',
        matchesWaiting: 'في الانتظار...',
        matchesPlayer1: 'اللاعب 1',
        matchesClickToJoin: 'انقر للانضمام',

        // Game
        gamePongGame: 'لعبة بونغ',
        gameOponent: 'خصم', // Added (using standard Arabic term, as "Oponent" is not transliterated)
        gameOpponent: 'الخصم',
        gameStartGame: 'بدء اللعبة',
        gameRoomName: 'اسم الغرفة',
        gameEnterRoomName: 'أدخل اسم الغرفة...',
        gameSelectDifficulty: 'اختر مستوى الصعوبة',
        gameEasy: 'سهل',
        gameMedium: 'متوسط',
        gameHard: 'صعب',
        gameWaitingForOpponent: 'في انتظار الخصم...',
        gameGetReadyToPlay: '🎮 استعد للعب!',
        gameCreateNewRoom: 'إنشاء غرفة جديدة',
        gameWaiting: 'في الانتظار...',

        // Settings
        setSelectLanguage: 'اختر اللغة',
        setCurrentLanguage: 'اللغة الحالية:'
    }
}

    const socketRef = useRef<any>(null);

    // Check authentication
    useEffect(() => {
        const checkAuth = async (): Promise<void> => {
            if (!token) {
                setUser(null);
                setLoading(false);
                console.log("You are not allow!")
                return ;
            }
            
            setLoading(true); // AÑADIR: Asegurar que loading está activo cuando verificamos
            
            try {
                const res = await fetch('http://localhost:3000/api/auth/me', {
                    headers: {'Authorization': `Bearer ${token}`}
                })
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user)
                } else {
                    console.log("token is invalid");
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }

            } catch {
                console.log("token is invalid");
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false)
            }

        }
        checkAuth();
    }, [token])

    // Login function - CORREGIR PARA RESETEAR ESTADO
    const login = (newToken: string): void => {
        setLoading(true); // AÑADIR: Activar loading al hacer login
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    // Logout function - CORREGIR PARA RESETEAR ESTADO COMPLETAMENTE
    const logout = (): void => {
        setLoading(true); // AÑADIR: Activar loading al hacer logout
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        // No setear loading(false) aquí - lo hará el useEffect cuando token sea null
    };

    // Set language function
    const setLanguage = (newLan: string): void => {
        setLan(newLan);
        localStorage.setItem('language', newLan);
    };

    const contextValue: AuthContextType = {
        user, 
        setUser, 
        token, 
        setToken, 
        loading, 
        setLoading,
        language,
        lan,
        setLan,
        login,
        logout,
        setLanguage
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}
