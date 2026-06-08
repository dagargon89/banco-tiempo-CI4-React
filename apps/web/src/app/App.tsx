import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex min-h-screen items-center justify-center">
            <h1 className="font-display text-3xl font-bold text-accent">
              Banco de Tiempo · Participa Juárez
            </h1>
          </div>
        }
      />
    </Routes>
  );
}
