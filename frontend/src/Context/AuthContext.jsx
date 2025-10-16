import { createContext, useState, useEffect, useRef } from "react";

export const AuthContext = createContext();

export function AuthContextProvider({children}) {


    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);
    const [lan, setLan] = useState('en')
    const language = {
        // English
        en: {
            Game: 'game',
            Profile: 'profile',
            FriendRequest: 'Friend Request',
            Settings: 'settings',
            Logout: 'logout',
            Searcher: 'Search players, matches...',
            Notifications: 'Notifications',
            NotyClearAll: 'Clear all',
            NotyNoNewNotications: 'No new notifications',
            NotyYoureCaughtUp: "You're all caught up!",
            NotyViewAllNotications: 'View all notifications →',
            
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


            //Matches

            matchesROOMSRUNNING: 'ROOMS RUNNING',
            matchesNoActiveRooms: 'No Active Rooms',
            matchesNoActiveRoomsMsg: 'There are currently no game rooms running. Be the first to create one!',
            matchesNoActiveRoomsAdvice: 'Start a new game to see it appear here'
        },
        // Portuguese
        pt: {
            Game: 'jogo',
            Profile: 'perfil',
            FriendRequest: 'Solicitação de Amizade',
            Settings: 'configurações',
            Logout: 'sair',
            
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
        },
        // French
        fr: {
            Game: 'jeu',
            Profile: 'profil',
            FriendRequest: 'Demande d\'ami',
            Settings: 'paramètres',
            Logout: 'déconnexion',
            
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
        },
        // German
        de: {
            Game: 'Spiel',
            Profile: 'Profil',
            FriendRequest: 'Freundschaftsanfrage',
            Settings: 'Einstellungen',
            Logout: 'Abmelden',
            
            // Profile Section
            profileWelcome: 'Mein Profil',
            changeAvatar: 'Avatar ändern',
            changePassword: 'Passwort ändern',
            profileUsername: 'Benutzername:',
            profileDisplayName: 'Anzeigename',
            profilePHDisplayName: 'Anzeigenamen eingeben',
            profileEmail: 'E-Mail:',
            profilePHEmail: 'E-Mail eingeben',
            updateProfile: 'Profil aktualisieren',
            profileGameStatistics: 'Spielstatistiken',
            profileWins: 'Siege',
            profileLosses: 'Niederlagen',
            profileWinRate: 'Siegesquote',
            profileFriends: 'Freunde',
            profilePHenterUsername: 'Benutzernamen eingeben',
            profileAddFriend: 'Freund hinzufügen',
            profileNoFriendsYet: 'Noch keine Freunde',
            profileIsOnline: 'Online',
            profileIsOffline: 'Offline',
            profileMatchHistory: 'Spielverlauf',
            profileNoMatchesYet: 'Noch keine Spiele',
            profileWinMatch: 'SIEG',
            profileLossMatch: 'NIEDERLAGE',
            profileScore: 'Punktzahl',

            // FriendRequest Section
            frAcceptFriend: 'Akzeptieren',
            frDeclineFriend: 'Ablehnen',
            frNoFriendRequest: 'Keine Freundschaftsanfragen',
            frNoFriendRequestMsg: 'Sie haben im Moment keine Freundschaftsanfragen.',
        },
        // Japanese
        ja: {
            Game: 'ゲーム',
            Profile: 'プロフィール',
            FriendRequest: '友達リクエスト',
            Settings: '設定',
            Logout: 'ログアウト',
            
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
        },
        // Chinese (Simplified)
        zh: {
            Game: '游戏',
            Profile: '个人资料',
            FriendRequest: '好友请求',
            Settings: '设置',
            Logout: '退出',
            
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
        },
        // Spanish
        es: {
            Game: 'juego',
            Profile: 'perfil',
            FriendRequest: 'Solicitud de Amistad',
            Settings: 'configuración',
            Logout: 'cerrar sesión',
            
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
        },
    };

    const socketRef = useRef(null);

    // Check authentication
    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                setUser(null);
                setLoading(false);
                console.log("You are not allow!")
                return ;
            }
            try {
                const res = await fetch('/api/auth/me', {
                    headers: {'Authorization': `Bearer ${token}`}
                })
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user)
                } else {
                    console.log("token is invalid");
                }

            } catch {
                console.log("token is invalid");
            } finally {
                setLoading(false)
            }

        }
        checkAuth();
    }, [token])

    return (
        <AuthContext.Provider value={{
            user, 
            setUser, 
            token, 
            setToken, 
            loading, 
            setLoading,
            language,
            lan,
            setLan
        }}>
            {children}
        </AuthContext.Provider>
    )
}
