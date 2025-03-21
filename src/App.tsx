import { Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoadingSkeleton from "./components/common/LoadingSkeleton";
import SimplePage from "./SimplePage";

/**
 * Main application component
 * Handles routing for the application using a simplified approach
 * that avoids conflicts between React Router and Next.js App Router
 */

const App = () => {
  useEffect(() => {
    console.log("App mounted");
  }, []);
  return (
    <Suspense fallback={<LoadingSkeleton height="100vh" />}>
      <Routes>
        <Route path="/" element={<SimplePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
