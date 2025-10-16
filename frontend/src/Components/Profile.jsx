import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';
import { ComponentContext } from '../Context/ComponentsContext';

const Profile = () => {
    const { token, language, lan, user} = useContext(AuthContext);
    const {socket} = useContext(ComponentContext)
    const [profile, setProfile] = useState({
        username: '',
        displayName: '',
        email: '',
        avatar: '',
        wins: 0,
        losses: 0,
        winRate: 0
    });

    const [friends, setFriends] = useState([]);
    const [matchHistory, setMatchHistory] = useState([]);


    const [friendUsername, setFriendUsername] = useState('');

    useEffect(() => {
        loadProfile();
        loadFriends();
        loadMatchHistory();
    }, [token]);

    const loadProfile = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Ensure no null values for controlled inputs
                const winRate = data.user.wins + data.user.losses > 0 ? 
                Math.round((data.user.wins / (data.user.wins + data.user.losses)) * 100)
                : 0
                setProfile({
                    username: data.user.username || '',
                    displayName: data.user.displayName || '',
                    email: data.user.email || '',
                    avatar: data.user.avatar || '',
                    wins: data.user.wins || 0,
                    losses: data.user.losses || 0,
                    winRate
                });
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
        }
    };

    const loadFriends = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/user/friends', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFriends(data.friends);
            }
        } catch (err) {
            console.error('Failed to load friends:', err);
        }
    };

    const loadMatchHistory = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/user/match-history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMatchHistory(data.matches);
            }
        } catch (err) {
            console.error('Failed to load match history:', err);
        }
    };

    const updateProfile = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    displayName: profile.displayName,
                    email: profile.email
                })
            });
            if (res.ok) {
                alert("Profile was updated succesfully!")
            } else {
                alert('Failed to update profile');
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create a FileReader to convert file to Base64
        const reader = new FileReader();
        
        reader.onload = async function(event) {
            const avatar = event.target.result; // This is the Base64 string
            
            try {
                const res = await fetch('http://localhost:3000/api/user/profile', {
                    method: 'PUT',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ avatar })
                });
                
                if (res.ok) {
                    // Update the avatar immediately in UI with Base64 string
                    setProfile({ ...profile, avatar: avatar });
                    alert('Avatar updated!');
                } else {
                    alert('Failed to update avatar');
                }
            } catch (err) {
                alert('Failed to upload avatar: ' + err.message);
            }
        };
        
        // Start reading the file as Base64 - this triggers onload when done
        reader.readAsDataURL(file);
    };

    const sendFriendRequest = async () => {
        if (!friendUsername.trim()) return;

        try {
            const res = await fetch('http://localhost:3000/api/user/friend-request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ friendUsername })
            });
            if (res.ok) {
                alert('Friend request sent!');
                loadFriends();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to send friend request');
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        }
        setFriendUsername('');
    };

    useEffect( () => {
        if (!socket) return;

        const checkFriendLogOut = (data) => {
            console.log(`friend -> ${data.username} with ID: ${data.id} just left!`)
            loadFriends();
        }
        const checkFriendLogin = (data) => {
            console.log(`Friend (${data.username}) with ID: ${data.id} has connected!`)
            loadFriends();
        }

        socket.on("friendLogout", checkFriendLogOut)
        socket.on("friendConnected", checkFriendLogin)

        return () => {
            socket.off("friendLogout", checkFriendLogOut)
            socket.off("friendConnected", checkFriendLogin)
        }

    }, [socket])


    return (

            <div className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full p-6">

                {/* Profile Section */}
                <section className="mb-8">
                    <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-8 tracking-tight">{language[lan].profileWelcome}</h2>
                    <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-emerald-500/20 rounded-xl p-8 flex flex-col md:flex-row gap-8 shadow-2xl shadow-emerald-500/10 overflow-hidden">
                        
                        {/* Accent line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
                        
                        {/* Avatar + Actions */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-start">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full opacity-50 group-hover:opacity-75 blur transition duration-300"></div>
                                <img 
                                    src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.username}&size=192`} 
                                    alt="Avatar" 
                                    className="relative w-40 h-40 rounded-full border-4 border-slate-700 object-cover shadow-xl"
                                />
                            </div>
                            <input 
                                type="file" 
                                id="avatarInput" 
                                accept="image/*" 
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            <button 
                                onClick={() => document.getElementById('avatarInput').click()} 
                                className="mt-6 w-full px-6 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-medium rounded-lg transition-all duration-200 border border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20"
                            >
                                {language[lan].changeAvatar}
                            </button>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 space-y-5">
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                                <label className="block text-sm font-semibold text-emerald-400 mb-2 uppercase tracking-wide">{language[lan].profileUsername}</label>
                                <span className="text-2xl font-bold text-white">{profile.username}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">{language[lan].profileDisplayName}</label>
                                <input 
                                    type="text" 
                                    value={profile.displayName}
                                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                    placeholder={language[lan].profilePHDisplayName} 
                                    className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">{language[lan].profileEmail}</label>
                                <input 
                                    type="email" 
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    placeholder={language[lan].profilePHEmail}
                                    className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <button 
                                onClick={updateProfile}
                                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 px-8 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-95"
                            >
                                {language[lan].updateProfile}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Game Statistics */}
                <section className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="text-emerald-400">📊</span>
                        {language[lan].profileGameStatistics}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="group relative bg-gradient-to-br from-emerald-900/30 to-slate-900 border border-emerald-500/30 rounded-xl text-center p-8 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105 overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
                            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <h3 className="relative text-5xl font-black text-emerald-400 mb-2">{profile.wins}</h3>
                            <p className="relative text-sm font-semibold text-gray-300 uppercase tracking-wider">{language[lan].profileWins}</p>
                        </div>
                        <div className="group relative bg-gradient-to-br from-red-900/30 to-slate-900 border border-red-500/30 rounded-xl text-center p-8 shadow-lg hover:shadow-red-500/20 transition-all duration-300 hover:scale-105 overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-400/50 to-transparent"></div>
                            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <h3 className="relative text-5xl font-black text-red-400 mb-2">{profile.losses}</h3>
                            <p className="relative text-sm font-semibold text-gray-300 uppercase tracking-wider">{language[lan].profileLosses}</p>
                        </div>
                        <div className="group relative bg-gradient-to-br from-cyan-900/30 to-slate-900 border border-cyan-500/30 rounded-xl text-center p-8 shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 hover:scale-105 overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
                            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <h3 className="relative text-5xl font-black text-cyan-400 mb-2">{profile.winRate}%</h3>
                            <p className="relative text-sm font-semibold text-gray-300 uppercase tracking-wider">{language[lan].profileWinRate}</p>
                        </div>
                    </div>
                </section>

                {/* Friends + Match History */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Friends */}
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="text-amber-400">👥</span>
                            {language[lan].profileFriends}
                        </h2>
                        <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-amber-500/20 rounded-xl p-6 shadow-xl overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>
                            
                            <div className="flex gap-2 mb-6">
                                <input 
                                    type="text" 
                                    value={friendUsername}
                                    onChange={(e) => setFriendUsername(e.target.value)}
                                    placeholder={language[lan].profilePHenterUsername} 
                                    className="flex-1 bg-slate-900 text-white border border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder-gray-500"
                                />
                                <button 
                                    onClick={sendFriendRequest}
                                    className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold px-6 rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95"
                                >
                                    {language[lan].profileAddFriend}
                                </button>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                                {friends.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 text-lg">👻</p>
                                        <p className="text-gray-400 mt-2">{language[lan].profileNoFriendsYet}</p>
                                    </div>
                                ) : (
                                    friends.map((friend, index) => (
                                        <div key={index} className="group bg-slate-800/50 hover:bg-slate-800 p-4 rounded-lg flex items-center border border-slate-700/50 hover:border-amber-500/30 transition-all duration-200">
                                            <div className="relative">
                                                <img 
                                                    src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.username}&size=128`}
                                                    alt={friend.username}
                                                    className='w-12 h-12 rounded-full border-2 border-slate-600 group-hover:border-amber-500/50 transition-all'
                                                />
                                                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${friend.isOnline ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
                                            </div>
                                            <span className='ml-4 font-medium text-white group-hover:text-amber-400 transition-colors'>{friend.username}</span>
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ml-auto ${friend.isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'}`}>
                                                {friend.isOnline ? language[lan].profileIsOnline : language[lan].profileIsOffline}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Match History */}
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="text-cyan-400">🎯</span>
                            {language[lan].profileMatchHistory}
                        </h2>
                        <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-cyan-500/20 rounded-xl p-6 shadow-xl overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
                            
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                                {matchHistory.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 text-4xl">🏓</p>
                                        <p className="text-gray-400 mt-4">{language[lan].profileNoMatchesYet}</p>
                                    </div>
                                ) : (
                                    matchHistory.map((match, index) => (
                                        <div key={index} className={`group bg-gradient-to-r ${match.winnerId === user.id ? 'from-emerald-900/20 to-slate-900/50 border-emerald-500/30 hover:border-emerald-500/50' : 'from-red-900/20 to-slate-900/50 border-red-500/30 hover:border-red-500/50'} border rounded-lg p-4 hover:shadow-lg transition-all duration-200`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className={`text-2xl font-black`}>
                                                        {match.winnerId === user.id ? '🏆' : '💔'}
                                                    </span>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white text-sm">
                                                            {match.Player1.username} <span className="text-emerald-400 font-black">{match.player1Score}</span> : <span className="text-red-400 font-black">{match.player2Score}</span> {match.Player2.username}
                                                        </span>
                                                        <span className="text-xs text-gray-400 mt-1">
                                                            ⏱️ {match.duration}s • {new Date(match.startGameTime).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${match.winnerId === user.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                                    {match.winnerId === user.id ? language[lan].profileWinMatch : language[lan].profileLossMatch}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </section>
            </div>
    );
}

export default Profile