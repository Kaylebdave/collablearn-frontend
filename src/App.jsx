import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useConnectivityStore from './stores/useConnectivityStore'
import useAuthStore from './stores/useAuthStore'
import useSyncStore from './stores/useSyncStore'
import api from './api/axios'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Splash from './components/Splash'

import Home from './pages/home'
import Courses from './pages/courses'
import CourseDetail from './pages/CourseDetail'
import Discussions from './pages/discussions'
import DiscussionDetail from './pages/DiscussionDetail'
import Groups from './pages/groups'
import GroupDetail from './pages/GroupDetail'
import Profile from './pages/profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyOtp from './pages/VerifyOtp'
import Welcome from './pages/Welcome'
import SyncQueue from './pages/SyncQueue'
import ConflictResolution from './pages/ConflictResolution'

import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const { isOnline, setOnline, setOffline } = useConnectivityStore()
  const { isAuthenticated, justSignedUp, checkAuth } = useAuthStore()
  const syncNow = useSyncStore((state) => state.syncNow)
  const restoreQueuedItems = useSyncStore((state) => state.restoreQueuedItems)
  const location = useLocation()

  const hideLayout =
    ['/login', '/signup', '/verify-otp', '/welcome'].includes(location.pathname) || justSignedUp

  useEffect(() => {
    void api.get('/health').catch(() => undefined)
  }, [])

  useEffect(() => {
    checkAuth()
    restoreQueuedItems()

    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2500)

    const handleOnline = () => {
      setOnline()
      syncNow()
    }

    const handleOffline = () => setOffline()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (navigator.onLine) {
      setOnline()
      syncNow()
    } else {
      setOffline()
    }

    return () => {
      clearTimeout(timer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkAuth, restoreQueuedItems, setOffline, setOnline, syncNow])

  useEffect(() => {
    if (isOnline && isAuthenticated) syncNow()
  }, [isOnline, isAuthenticated, syncNow])

  if (showSplash) {
    return <Splash />
  }

  // Force Welcome screen after signup
  if (isAuthenticated && justSignedUp) {
    return <Welcome />
  }

  return (
    <div className="app">
      {!isOnline && !hideLayout && (
        <div className="offline-banner">
          You are offline. Changes will sync when you are back online.
        </div>
      )}

      {isAuthenticated && !hideLayout && <Header />}

      <main className={!hideLayout && isAuthenticated ? 'main-content' : ''}>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/" /> : <Signup />}
          />
          <Route
            path="/verify-otp"
            element={isAuthenticated ? <Navigate to="/welcome" /> : <VerifyOtp />}
          />
          <Route
            path="/welcome"
            element={isAuthenticated ? <Welcome /> : <Navigate to="/login" />}
          />
          <Route
            path="/"
            element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
          />
          <Route
            path="/courses"
            element={isAuthenticated ? <Courses /> : <Navigate to="/login" />}
          />
          <Route
            path="/courses/:id"
            element={isAuthenticated ? <CourseDetail /> : <Navigate to="/login" />}
          />
          <Route
            path="/discussions"
            element={isAuthenticated ? <Discussions /> : <Navigate to="/login" />}
          />
          <Route
            path="/discussions/:id"
            element={isAuthenticated ? <DiscussionDetail /> : <Navigate to="/login" />}
          />
          <Route
            path="/groups"
            element={isAuthenticated ? <Groups /> : <Navigate to="/login" />}
          />
          <Route
            path="/groups/:id"
            element={isAuthenticated ? <GroupDetail /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/sync"
            element={isAuthenticated ? <SyncQueue /> : <Navigate to="/login" />}
          />
          <Route
            path="/conflicts"
            element={isAuthenticated ? <ConflictResolution /> : <Navigate to="/login" />}
          />
        </Routes>
      </main>

      {isAuthenticated && !hideLayout && <BottomNav />}
    </div>
  )
}

export default App
