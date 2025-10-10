import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';

const Profile = () => {
    const { token, language, lan} = useContext(AuthContext);
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
    }, []);

    const loadProfile = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Ensure no null values for controlled inputs
                const winRate = data.user.wins + data.user.losses > 0 ? 
                Math.round((data.user.wins / (data.user.wins + losses)) * 100)
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


    return (

            <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full m-4">

                {/* Profile Section */}
                <section>
                    <h2 className="text-3xl font-bold text-pong-green mb-6">{language[lan].ProfileWelcome}</h2>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col md:flex-row gap-8 shadow">
                        
                        {/* Avatar + Actions */}
                        <div className="flex-shrink-0 flex flex-col text-center justify-center w-48">
                            <img 
                                src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.username}&size=128`} 
                                alt="Avatar" 
                                className="w-32 h-32 rounded-full mx-auto border-4 border-gray-600 object-cover"
                            />
                            <input 
                                type="file" 
                                id="avatarInput" 
                                accept="image/*" 
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            <button 
                                onClick={() => document.getElementById('avatarInput').click()} 
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg mt-4 transition"
                            >
                                {language[lan].changeAvatar}
                            </button>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{language[lan].profileUsername}</label>
                                <span className="text-lg font-semibold">{profile.username}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{language[lan].profileDisplayName}</label>
                                <input 
                                    type="text" 
                                    value={profile.displayName}
                                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                    placeholder={language[lan].profilePHDisplayName} 
                                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{language[lan].profileEmail}</label>
                                <input 
                                    type="email" 
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    placeholder={language[lan].profilePHEmail}
                                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                            </div>
                            <button 
                                onClick={updateProfile}
                                className="bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-6 rounded-lg transition"
                            >
                                {language[lan].updateProfile}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Game Statistics */}
                <section>
                    <h2 className="text-2xl font-bold text-pong-green -400 mb-6">{language[lan].profileGameStatistics}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-800 border border-gray-700 rounded-lg text-center p-6 shadow">
                            <h3 className="text-3xl font-bold text-pong-green">{profile.wins}</h3>
                            <p className="text-gray-300">{language[lan].profileWins}</p>
                        </div>
                        <div className="bg-gray-800 border border-gray-700 rounded-lg text-center p-6 shadow">
                            <h3 className="text-3xl font-bold text-red-400">{profile.losses}</h3>
                            <p className="text-gray-300">{language[lan].profileLosses}</p>
                        </div>
                        <div className="bg-gray-800 border border-gray-700 rounded-lg text-center p-6 shadow">
                            <h3 className="text-3xl font-bold text-blue-400">{profile.winRate}%</h3>
                            <p className="text-gray-300">{language[lan].profileWinRate}</p>
                        </div>
                    </div>
                </section>

                {/* Friends + Match History */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Friends */}
                    <div>
                        <h2 className="text-2xl font-bold text-pong-green mb-4">{language[lan].profileFriends}</h2>
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow">
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="text" 
                                    value={friendUsername}
                                    onChange={(e) => setFriendUsername(e.target.value)}
                                    placeholder={language[lan].profilePHenterUsername} 
                                    className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                                <button 
                                    onClick={sendFriendRequest}
                                    className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 rounded-lg transition"
                                >
                                    {language[lan].profileAddFriend}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {friends.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">{language[lan].profileNoFriendsYet}</p>
                                ) : (
                                    friends.map((friend, index) => (
                                        <div key={index} className="bg-gray-700 p-3 rounded-lg flex items-center">
                                            <img src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.username}&size=128`}
                                            className='w-10 h-10 rounded-full'
                                            />
                                            <span className='mx-5'>{friend.username}</span>
                                            <span className={`text-sm ${friend.isOnline ? 'text-green-400' : 'text-red-500'} ml-auto`}>
                                                {friend.isOnline ? `🟢 ${language[lan].profileIsOnilne}` : `⚫ ${language[lan].profileIsOffline}`}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Match History */}
                    <div>
                        <h2 className="text-2xl font-bold text-pong-green mb-4">{language[lan].MatchHistory}</h2>
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow max-h-96 overflow-y-auto">
                            <div className="space-y-3">
                                {matchHistory.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">{language[lan].profileNoMatchesYet}</p>
                                ) : (
                                    matchHistory.map((match, index) => (
                                        <div key={index} className="bg-gray-700 p-3 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold">
                                                    {match.player1} vs {match.player2}
                                                </span>
                                                <span className={`font-bold ${match.won ? 'text-green-400' : 'text-red-400'}`}>
                                                    {match.won ? `${language[lan].profileWinMatch}` : `${language[lan].profileLossMatch}`}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {language[lan].profileScore}: {match.score} • {match.date}
                                            </p>
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