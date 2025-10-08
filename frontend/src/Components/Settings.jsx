
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';

const Settings = () => {
    const { token } = useContext(AuthContext);
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
                setProfile({
                    username: data.user.username || '',
                    displayName: data.user.displayName || '',
                    email: data.user.email || '',
                    avatar: data.user.avatar || '',
                    wins: data.user.wins || 0,
                    losses: data.user.losses || 0,
                    winRate: data.user.winRate || 0
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

        /*
        try {
            const res = await fetch('http://localhost:3000/api/friends/request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: friendUsername })
            });
            if (res.ok) {
                alert('Friend request sent!');
                setFriendUsername('');
                loadFriends();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to send friend request');
            }
        } catch (err) {
            alert('Connection error: ' + err.message);
        }*/
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-900 text-white">

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto space-y-10 w-full">

                {/* Profile Section */}
                <section>
                    <h2 className="text-3xl font-bold text-green-400 mb-6">My Profile</h2>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col md:flex-row gap-8 shadow">
                        
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
                                Change Avatar
                            </button>
                            <button 
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg mt-4 transition"
                            >
                                Change Password
                            </button>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Username:</label>
                                <span className="text-lg font-semibold">{profile.username}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Display Name:</label>
                                <input 
                                    type="text" 
                                    value={profile.displayName}
                                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                    placeholder="Enter display name" 
                                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email:</label>
                                <input 
                                    type="email" 
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    placeholder="Enter email" 
                                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                            </div>
                            <button 
                                onClick={updateProfile}
                                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition"
                            >
                                Update Profile
                            </button>
                        </div>
                    </div>
                </section>

                {/* Game Statistics */}
                <section>
                    <h2 className="text-2xl font-bold text-green-400 mb-6">Game Statistics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-800 border border-gray-700 rounded-lg text-center p-6 shadow">
                            <h3 className="text-3xl font-bold text-green-400">{profile.wins}</h3>
                            <p className="text-gray-300">Wins</p>
                        </div>
                        <div className="bg-gray-800 border border-gray-700 rounded-lg text-center p-6 shadow">
                            <h3 className="text-3xl font-bold text-red-400">{profile.losses}</h3>
                            <p className="text-gray-300">Losses</p>
                        </div>
                        <div className="bg-gray-800 border border-gray-700 rounded-lg text-center p-6 shadow">
                            <h3 className="text-3xl font-bold text-blue-400">{profile.winRate}%</h3>
                            <p className="text-gray-300">Win Rate</p>
                        </div>
                    </div>
                </section>

                {/* Friends + Match History */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Friends */}
                    <div>
                        <h2 className="text-2xl font-bold text-green-400 mb-4">Friends</h2>
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow">
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="text" 
                                    value={friendUsername}
                                    onChange={(e) => setFriendUsername(e.target.value)}
                                    placeholder="Enter username" 
                                    className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                                <button 
                                    onClick={sendFriendRequest}
                                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 rounded-lg transition"
                                >
                                    Add Friend
                                </button>
                            </div>
                            <div className="space-y-2">
                                {friends.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">No friends yet</p>
                                ) : (
                                    friends.map((friend, index) => (
                                        <div key={index} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                            <span>{friend.username}</span>
                                            <span className={`text-sm ${friend.online ? 'text-green-400' : 'text-gray-400'}`}>
                                                {friend.online ? '🟢 Online' : '⚫ Offline'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Match History */}
                    <div>
                        <h2 className="text-2xl font-bold text-green-400 mb-4">Match History</h2>
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow max-h-96 overflow-y-auto">
                            <div className="space-y-3">
                                {matchHistory.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">No matches yet</p>
                                ) : (
                                    matchHistory.map((match, index) => (
                                        <div key={index} className="bg-gray-700 p-3 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold">
                                                    {match.player1} vs {match.player2}
                                                </span>
                                                <span className={`font-bold ${match.won ? 'text-green-400' : 'text-red-400'}`}>
                                                    {match.won ? 'WIN' : 'LOSS'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Score: {match.score} • {match.date}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </section>
            </div>
        </div>
    );
};

export default Settings;
