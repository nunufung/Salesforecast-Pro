/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dashboard from './components/Dashboard';
import { SalesProvider } from './context/SalesContext';

export default function App() {
  return (
    <div className="antialiased font-sans">
      <SalesProvider>
        <Dashboard />
      </SalesProvider>
    </div>
  );
}

