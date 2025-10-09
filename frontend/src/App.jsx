import { useState } from 'react'
import { BrowserRouter, Routes, Router, Navigate, Link, Route, useNavigate} from 'react-router-dom'
import { AuthContextProvider, AuthContext } from './Context/AuthContext'

import { FaBell, FaSearch } from 'react-icons/fa'

import ProtectorOfThings from './middleWare/middleWare'
import Game from './Components/Game'
import Index from './Components/Index'
import Logout  from './Components/Logout'
import Profile from './Components/Profile'
import Settings from './Components/Settings'

import FriendRequest from './Components/FriendsRequest'


import Login from './Components/Login'

import './index.css'

const Components = () => {

  const navigate = useNavigate()
  const [inputSearch, setInputSearch] = useState('');
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="min-h-screen bg-gray-900">
        <div className='flex'>
          <nav className='flex flex-col top-0 left-0 w-28 min-h-screen bg-gray-800 text-white'>
            <button className='w-28 h-16 flex justify-center items-center text-3xl border-[1] border-white hover:bg-gray-900' onClick={() => navigate('/index')}>42</button>
            <button className='w-28 h-16 hover:bg-gray-900' onClick={() => navigate('/index/game')}>game</button>
            <button className='w-28 h-16 hover:bg-gray-900' onClick={() => navigate('/index/profile')}>porfile</button>
            <button className='w-28 h-16 hover:bg-gray-900' onClick={() => navigate('/index/friendRequest')}>Friends Request </button>
            <button className='w-28 h-16 hover:bg-gray-900' onClick={() => navigate('/index/settings')}>settings</button>
            <button className='w-28 h-16 hover:bg-gray-900' onClick={() => navigate('/index/logout')}>logout</button>
          </nav>

          <div className='flex-1 min-w-0'>
            <div className='bg-gray-800 h-16 flex items-center justify-between px-4 md:px-8 gap-4'>
              <div className='flex flex-1 max-w-md'>
                <FaSearch className='bg-white/95 w-7 h-8 px-2 rounded-l-md flex justify-center items-center'/>
                <input value={inputSearch} onChange={(e) => setInputSearch(e.target.value)} placeholder='search...' className='flex-1 h-8 p-2 text-xs rounded-r-md focus:outline-none focus:border-transparent'/>
              </div>
              <button className='relative flex-shrink-0'>
                  <FaBell size={28} className=''/>
                  {
                    count > 0 &&  (<span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {count}
                </span>)
                  }
              </button>
              
            </div>
            <div className='mt-6 text-white px-4'>
              <Routes>
                <Route index element={<Index/>}/>
                <Route path='profile' element={<Profile/>}/>
                <Route path='friendRequest' element={<FriendRequest/>} />
                <Route path='game' element={<Game/>}/>
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
          <Components/>
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
