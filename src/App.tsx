import { Route, Routes } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import NewInspection from '@/pages/NewInspection';
import Results from '@/pages/Results';
import HistoryPage from '@/pages/History';
import Dataset from '@/pages/Dataset';
import ModelInfo from '@/pages/ModelInfo';
import SettingsPage from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="inspect" element={<NewInspection />} />
        <Route path="inspections/:id" element={<Results />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="dataset" element={<Dataset />} />
        <Route path="model" element={<ModelInfo />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
