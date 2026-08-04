import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import './Layout.css'

/**
 * Main application layout component
 * Manages the structure of Header, Sidebar, Footer and main content
 * Implements responsive behavior for the sidebar
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render in the main area
 * @returns {JSX.Element} Complete application layout
 */
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    /**
     * Handles window resize to adjust sidebar visibility
     * On mobile devices (≤768px) sidebar starts closed
     * On desktop sidebar is open by default
     */
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Initialize on mount
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /**
   * Toggles sidebar state between open and closed
   */
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  /**
   * Closes sidebar on mobile devices
   * Executed when clicking a menu option
   * Has no effect on desktop
   */
  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="layout">
      <Header toggleSidebar={toggleSidebar} />
      <div className="layout-body">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className={`main-content ${!sidebarOpen ? 'main-content-expanded' : ''}`}>
          <div className="content-wrapper">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}

export default Layout
