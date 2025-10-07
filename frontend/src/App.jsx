import { useState } from 'react'
import { BrowserRouter, Routes, Router, Navigate, Link, Route, useNavigate} from 'react-router-dom'
import { AuthContextProvider, AuthContext } from './Context/AuthContext'

import Game from './Components/Game'
import Index from './Components/Index'
import Logout  from './Components/Logout'
import Profile from './Components/Profile'
import Settings from './Components/Settings'

import Login from './Components/Login'

import './index.css'

const Components = () => {

  const navigate = useNavigate()

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-indigo-500 to-purple-600">
        <div className='flex'>
          <nav className='flex flex-col top-0 left-0 w-24 min-h-screen bg-slate-700'>
            <button className='w-24 h-14 flex justify-center items-center text-lg border-[1] border-white' onClick={() => navigate('/index')}>42</button>
            <button className='w-24 h-14' onClick={() => navigate('/index/game')}>game</button>
            <button className='w-24 h-14' onClick={() => navigate('/index/profile')}>porfile</button>
            <button className='w-24 h-14' onClick={() => navigate('/index/settings')}>settings</button>
            <button className='w-24 h-14' onClick={() => navigate('/index/logout')}>logout</button>
          </nav>

          <div className='w-full'>
            <div className='top-0 left-14 bg-white/80 h-14 flex items-center '>
              <div className='px-10 flex'>
                <div className=' bg-white h-6 rounded-l-md'>🔍</div>
                <input placeholder='search...' className='w-64 h-6 flex items-center justify-center p-2 text-xs rounded-r-md focus:outline-none focus:ring-0 focus:border-transparent'></input>
              </div>
            </div>
            <div className='top-24 left-14 h-5/6 m-5 mt-12'>
              <Routes>
                <Route index element={<Index/>}/>
                <Route path='profile' element={<Profile/>}/>
                <Route path='game' element={<Game/>}/>
                <Route path='settings' element={<Settings/>}/>
                <Route path='logout' element={<Logout/>}/>
              </Routes>
            </div>
          </div>


        </div>
      </div>
    
      {/*Components*/}
    </>
  )
}

function MainComponent() {
  return (
    <Routes>
      <Route path='/login' element={<Login/>}/>
      <Route path='/index/*' element={
        <Components/>
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
