import { Routes, Route } from "react-router-dom";
import EmployeeCompStatement from "./pages/EmployeeCompStatement";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Multi-Factor Compensation Tool</h1>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4">
        <Routes>
          <Route path="/" element={<EmployeeCompStatement />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      <footer className="bg-muted p-4 mt-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Multi-Factor Compensation Tool
        </div>
      </footer>
    </div>
  );
}

export default App;
