import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, type TabType } from './components/layout/Sidebar';
import { Overview } from './pages/Overview';
import { ForecastExplorer } from './pages/ForecastExplorer';
import { AccuracyAnalytics } from './pages/AccuracyAnalytics';
import { ForecastEvolution } from './pages/ForecastEvolution';
import { DataQuality } from './pages/DataQuality';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [cutoffTime, setCutoffTime] = useState<string>('11:00');
  const [matchingMode, setMatchingMode] = useState<string>('mapped');
  const [apiHealthy, setApiHealthy] = useState<boolean>(true);

  useEffect(() => {
    api.getHealth()
      .then(res => {
        setApiHealthy(res.status === 'HEALTHY');
      })
      .catch(() => {
        setApiHealthy(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#29332E] flex flex-col font-sans antialiased">
      <Header
        cutoffTime={cutoffTime}
        setCutoffTime={setCutoffTime}
        matchingMode={matchingMode}
        setMatchingMode={setMatchingMode}
        apiHealthy={apiHealthy}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          cutoffTime={cutoffTime}
          matchingMode={matchingMode}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#F5F5F0]">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'overview' && (
              <Overview cutoffTime={cutoffTime} matchingMode={matchingMode} />
            )}
            {currentTab === 'forecast-explorer' && (
              <ForecastExplorer cutoffTime={cutoffTime} />
            )}
            {currentTab === 'accuracy-analytics' && (
              <AccuracyAnalytics cutoffTime={cutoffTime} matchingMode={matchingMode} />
            )}
            {currentTab === 'forecast-evolution' && (
              <ForecastEvolution cutoffTime={cutoffTime} />
            )}
            {currentTab === 'data-quality' && (
              <DataQuality cutoffTime={cutoffTime} matchingMode={matchingMode} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
