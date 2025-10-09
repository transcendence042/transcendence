import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';

const FriendRequest = () => {
     const [friendRequests, setFriendRequests] = useState([]);
     const {token} = useContext(AuthContext);

    const showFriendRequests = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/user/friend-getFriendRequests', {
                method: 'GET',
                headers: {'Authorization': `Bearer ${token}`}
            });
            if (res.ok) {
                const data = await res.json();
                const loggg = data.friendRequest;
                setFriendRequests(data.friendRequest);
                console.log("plot", loggg.map(f => (`username: ${f.User.username} - avatar: ${f.User.avatar}`)))
            }
        } catch (err) {
            alert(err);
        }
    }

    const respondeFriendRequest = async (requestId, action) => {
        try {
            const res = await fetch('http://localhost:3000/api/user/friend-response', {
                method: 'POST',
                headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
                body: JSON.stringify({requestId, action})
            });
            if (res.ok) {
                alert(`friend Request ${action} succesfully`);
                showFriendRequests();
            }
        } catch (err) {
            alert(`Responde friend Request failed: ${err}`)
        }
    }

    useEffect(() => {
        showFriendRequests();
    }, [])

    return (
        <>
            <div className='flex-1 mx-4 flex flex-col justify-center items-center rounded-lg'> 
                <div className='flex flex-col p-7 w-full'>
                    {friendRequests.length !== 0 ? friendRequests.map((friend, index) => (
                    <div key={index} className='flex flex-row items-center gap-6 bg-gray-800 m-2 rounded-md p-4 mx-12'>
                         <img src={friend.User.avatar || `https://ui-avatars.com/api/?name=${friend.User.username}&size=128`}
                         className='rounded-full w-20 h-20'/>
                        <h2 className='text-xl'>{friend.User.username}</h2>
                        <div className='ml-auto flex gap-2'>
                            <button onClick={() => respondeFriendRequest(friend.id, 'accept')} className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition'>
                                Accept
                            </button>
                            <button  onClick={() => respondeFriendRequest(friend.id, 'reject')} className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition'>
                                Decline
                            </button>
                        </div>
                    </div>
                    )) :
                    <div className='flex flex-col justify-center items-center bg-gray-800 rounded-md p-8'> 
                        <h1 className='text-lg font-semibold text-white/80'>No Friend Requests</h1>
                        <p>You don't have any friend requests at the moment.</p>
                    </div>
                    }
                </div>
            </div>
        </>
    )
}

export default FriendRequest