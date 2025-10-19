import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
 const location = useLocation();
 const navigate = useNavigate();

 useEffect(() => {
 console.error("404 Error: User attempted to access non-existent route:", location.pathname);
 }, [location.pathname]);

 return (
 <div className="flex min-h-screen items-center justify-center bg-slate-950">
 <div className="text-center space-y-6 p-8">
 <div className="flex justify-center">
 <div className="relative">
 <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-50"></div>
 <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center">
 <AlertCircle className="w-12 h-12 text-white" />
 </div>
 </div>
 </div>
 <div className="space-y-2">
 <h1 className="text-6xl font-bold text-white">404</h1>
 <p className="text-2xl text-slate-400">Oops! Page not found</p>
 <p className="text-slate-500">The page you're looking for doesn't exist or has been moved.</p>
 </div>
 <Button
 onClick={() => navigate('/')}
 className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/50"
 >
 <Home className="mr-2 h-5 w-5" />
 Return to Home
 </Button>
 </div>
 </div>
 );
};

export default NotFound;
