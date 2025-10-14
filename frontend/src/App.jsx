import { useContext, useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Router, Navigate, Link, Route, useNavigate} from 'react-router-dom'
import { AuthContextProvider, AuthContext } from './Context/AuthContext'
import { ComponentContext, ComponentContextProvider } from './Context/ComponentsContext'

import { FaBell, FaSearch } from 'react-icons/fa'

import ProtectorOfThings from './middleWare/middleWare'
import Game from './Components/Game'
import Index from './Components/Index'
import Logout  from './Components/Logout'
import Profile from './Components/Profile'
import Settings from './Components/Settings'
import Matches  from './Components/Matches'

import FriendRequest from './Components/FriendsRequest'


import Login from './Components/Login'

import './index.css'

const Components = () => {

  const navigate = useNavigate()
  const [inputSearch, setInputSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const {language, lan} = useContext(AuthContext)
  const {notifications, setNotifications, notificationsList, setNotificationsList} = useContext(ComponentContext)

  const getTimeAgo = (diff) => {
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours =   Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 60) return (`${seconds} seconds ago`)
    else if (minutes < 60) return (`${minutes} minutes ago`)
    else if (hours < 24) return (`${hours} hours ago`)
    else if (days < 7) return (`${days} days ago`)
    else return (`${weeks} weeks ago`)

  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleNotifications = () => {
    setShowNotifications(!showNotifications);
  }

  const clearNotifications = () => {
    setNotifications(0);
    setNotificationsList([]);
    setShowNotifications(false);
  }

  const handleClickNotification = (notify) => {


    console.log("this is type-----------", notify.type)
    if (!notify.status) return ;
    if (notify.type === 'friendRequest') {
        navigate('/index/friendRequest')
    }
    setNotifications(notifications => (notifications > 0 ? notifications - 1 : 0))
    setNotificationsList(notificationsList.map((notif => {
      if (notif.id === notify.id) {
        return ({...notif, status: false});
      }
      return (notif)
    })))
  }

  const deleteNotification = (id) => {
    setNotificationsList(notificationsList.filter(noti => noti.id != id))
  }


  return (
    <>
      <div className="min-h-screen bg-gray-900">
        <div className='flex'>
          <nav className='flex flex-col top-0 left-0 w-28 min-h-screen bg-gray-800 text-white'>
            <button className='w-28 h-16 flex justify-center items-center text-3xl border-[1] border-white hover:bg-gray-900' onClick={() => navigate('/index')}>42</button>
            <button className='w-28 h-16 hover:bg-gray-900' onClick={() => navigate('/index/game')}>{language[lan].Game}</button>
            <button className='w-28 h-16 hover:bg-gray-900' onClick={() => navigate('/index/matches')}>Matches</button>
            <button className='w-28 h-16 hover:bg-gray-900' onClick={() => navigate('/index/profile')}>{language[lan].Profile}</button>
            <button className='w-28 h-16 hover:bg-gray-900' onClick={() => navigate('/index/friendRequest')}>{language[lan].FriendRequest}</button>
            <button className='w-28 h-16 hover:bg-gray-900' onClick={() => navigate('/index/settings')}>{language[lan].Settings}</button>
            <button className='w-28 h-16 hover:bg-gray-900' onClick={() => navigate('/index/logout')}>{language[lan].Logout}</button>
          </nav>

          <div className='flex-1 min-w-0 flex flex-col'>
            <div className='bg-gray-800 h-16 flex items-center justify-between px-4 md:px-8 gap-4'>
              <div className='flex flex-1 max-w-md'>
                <FaSearch className='bg-white/95 w-7 h-8 px-2 rounded-l-md flex justify-center items-center'/>
                <input value={inputSearch} onChange={(e) => setInputSearch(e.target.value)} placeholder='search...' className='flex-1 h-8 p-2 text-xs rounded-r-md focus:outline-none focus:border-transparent'/>
              </div>

              
                                                            {/* Notifications Bell with Dropdown */}
                                                            <div className='relative' ref={notificationRef}>
                                                              <button 
                                                                onClick={handleNotifications} 
                                                                className='relative flex-shrink-0 hover:text-gray-300 transition'
                                                              >
                                                                <FaBell size={32}/>
                                                                {notifications > 0 && (
                                                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                                                    {notifications}
                                                                  </span>
                                                                )}
                                                              </button>

                                                              {/* Dropdown Notification Panel */}
                                                              {showNotifications && (
                                                                <div className='absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50'>
                                                                  {/* Header */}
                                                                  <div className='flex items-center justify-between p-4 border-b  border-gray-700'>
                                                                    <h3 className='text-lg font-semibold text-white'>Notifications</h3>
                                                                    {notifications > 0 && (
                                                                      <button 
                                                                        onClick={clearNotifications}
                                                                        className='text-xs text-blue-400 hover:text-blue-300'
                                                                      >
                                                                        Mark all as read
                                                                      </button>
                                                                    )}
                                                                  </div>

                                                                  {/* Notifications List */}
                                                                  <div className='max-h-96 overflow-y-auto'>
                                                                    {notificationsList.length > 0 ? (
                                                                      notificationsList.map((notif) => (
                                                                        <div 
                                                                          key={notif.id}
                                                                          className={`relative p-4 border-b ${!notif.status && 'bg-slate-900'} border-gray-700 hover:bg-gray-700 transition cursor-pointer`}
                                                                          onClick={() => handleClickNotification(notif)}
                                                                        >
                                                                          <div className='flex items-start gap-3'>
                                                                            <div className='w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0'></div>
                                                                            <div className='flex-1'>
                                                                              <p className='text-sm text-white'>
                                                                                <span className='font-semibold text-pong-green'>{notif.user}</span>
                                                                                {' '}{notif.msg}
                                                                              </p>
                                                                              <p className='text-xs text-gray-400 mt-1'>{getTimeAgo(Date.now() - notif.time)}</p>
                                                                            </div>
                                                                          </div>
                                                                          <div className='absolute top-1 right-3'>
                                                                            <button className='text-gray-400  rounded-full w-3 h-3 flex justify-center items-center'
                                                                            onClick={() => deleteNotification(notif.id)}
                                                                            >
                                                                              x
                                                                            </button>
                                                                          </div>
                                                                        </div>
                                                                      ))
                                                                    ) : (
                                                                      <div className='p-8 text-center text-gray-400'>
                                                                        <FaBell size={48} className='mx-auto mb-3 opacity-30'/>
                                                                        <p>No new notifications</p>
                                                                      </div>
                                                                    )}
                                                                  </div>

                                                                  {/* Footer */}
                                                                  <div className='p-3 border-t border-gray-700 text-center'>
                                                                    <button className='text-sm text-blue-400 hover:text-blue-300'>
                                                                      View all notifications
                                                                    </button>
                                                                  </div>
                                                                </div>
                                                              )}
            </div>





              
            </div>
            <div className='flex-1 overflow-y-auto p-6'>
              <Routes>
                <Route index element={<Index/>}/>
                <Route path='profile' element={<Profile/>}/>
                <Route path='friendRequest' element={<FriendRequest/>} />
                <Route path='game' element={<Game/>}/>
                <Route path='matches' element={<Matches/>}/>
                <Route path='settings' element={<Settings/>}/>
                <Route path='logout' element={<Logout/>}/>
              </Routes>
            </div>
          </div>


        </div>
      </div>
    </>
  )
}

function MainComponent() {
  return (
    <Routes>
      <Route path='/login' element={<Login/>}/>
      <Route path='/index/*' element={
        <ProtectorOfThings>
          <ComponentContextProvider>
            <Components/>
          </ComponentContextProvider>
        </ProtectorOfThings>
      }
      />
      <Route path='*' element={<Navigate to={'/login/'}/>}/>
    </Routes>
  )
}

function App() {
  return (
    <AuthContextProvider>
      <BrowserRouter>
        <MainComponent/>
      </BrowserRouter>
    </AuthContextProvider>
  )
}

export default App
