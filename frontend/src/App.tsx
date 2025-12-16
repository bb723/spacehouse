/**
 * Main App Component
 * Combines Canvas + Sidebar for the interactive building configurator
 */

import { Toaster } from 'react-hot-toast';
import CanvasEditor from './components/CanvasEditor';
import Sidebar from './components/Sidebar';
import ElevationViewer from './components/ElevationViewer';
import { useProjectStore } from './store/projectStore';

function App() {
  const { selectedWallId } = useProjectStore();

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SpaceHouse Configurator</h1>
            <p className="text-sm text-gray-600">
              Parametric Building Design with Real-Time Code Validation
            </p>
          </div>
          <div className="flex items-center gap-4">
            {selectedWallId && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                </svg>
                <span className="text-sm font-medium text-blue-900">Elevation View Active</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">API Connected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Floor Plan + Elevation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top: Floor Plan Canvas */}
          <div className={`${selectedWallId ? 'h-1/2' : 'h-full'} p-6 overflow-auto transition-all duration-300`}>
            <CanvasEditor />
          </div>

          {/* Bottom: Wall Elevation Pane (appears when wall is selected) */}
          {selectedWallId && (
            <div className="h-1/2 border-t-2 border-gray-300 animate-fade-in">
              <ElevationViewer />
            </div>
          )}
        </div>

        {/* Right Side: Sidebar */}
        <Sidebar />
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
