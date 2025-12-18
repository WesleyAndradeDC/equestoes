import React, { useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Layout from "./Layout.jsx";
import Login from "./Login.jsx";
import NotFound from "./NotFound.jsx";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy load pages for better performance
import Home from "./Home";
import Questions from "./Questions";
import Notebooks from "./Notebooks";
import Ranking from "./Ranking";
import CreateQuestion from "./CreateQuestion";
import Admin from "./Admin";
import Stats from "./Stats";
import ReviewQuestion from "./ReviewQuestion";
import TutorGramatique from "./TutorGramatique";

const PAGES = {
    Home,
    Questions,
    Notebooks,
    Ranking,
    CreateQuestion,
    Admin,
    Stats,
    ReviewQuestion,
    TutorGramatique,
};

function _getCurrentPage(pathname) {
    // Remove trailing slash
    const cleanPath = pathname.endsWith('/') && pathname !== '/' 
        ? pathname.slice(0, -1) 
        : pathname;
    
    // Get last part of URL
    let urlLastPart = cleanPath.split('/').pop();
    
    // Remove query params
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    // Match page name case-insensitively
    const pageName = Object.keys(PAGES).find(
        page => page.toLowerCase() === urlLastPart.toLowerCase()
    );
    
    return pageName || 'Home';
}

// Wrapper for protected routes with Layout
function ProtectedPageRoute({ children, pageName }) {
    return (
        <ProtectedRoute>
            <Layout currentPageName={pageName}>
                {children}
            </Layout>
        </ProtectedRoute>
    );
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = useMemo(() => _getCurrentPage(location.pathname), [location.pathname]);
    
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/404" element={<NotFound />} />
            
            {/* Protected routes */}
            <Route 
                path="/" 
                element={
                    <ProtectedPageRoute pageName={currentPage}>
                        <Home />
                    </ProtectedPageRoute>
                } 
            />
            
            <Route 
                path="/home" 
                element={
                    <ProtectedPageRoute pageName="Home">
                        <Home />
                    </ProtectedPageRoute>
                } 
            />
            
            <Route 
                path="/questions" 
                element={
                    <ProtectedPageRoute pageName="Questions">
                        <Questions />
                    </ProtectedPageRoute>
                } 
            />
            
            <Route 
                path="/notebooks" 
                element={
                    <ProtectedPageRoute pageName="Notebooks">
                        <Notebooks />
                    </ProtectedPageRoute>
                } 
            />
            
            <Route 
                path="/ranking" 
                element={
                    <ProtectedPageRoute pageName="Ranking">
                        <Ranking />
                    </ProtectedPageRoute>
                } 
            />
            
            <Route 
                path="/createquestion" 
                element={
                    <ProtectedPageRoute pageName="CreateQuestion">
                        <CreateQuestion />
                    </ProtectedPageRoute>
                } 
            />
            
            <Route 
                path="/admin" 
                element={
                    <ProtectedPageRoute pageName="Admin">
                        <Admin />
                    </ProtectedPageRoute>
                } 
            />
            
            <Route 
                path="/stats" 
                element={
                    <ProtectedPageRoute pageName="Stats">
                        <Stats />
                    </ProtectedPageRoute>
                } 
            />
            
            <Route 
                path="/reviewquestion" 
                element={
                    <ProtectedPageRoute pageName="ReviewQuestion">
                        <ReviewQuestion />
                    </ProtectedPageRoute>
                } 
            />
            
            <Route 
                path="/tutorgramatique" 
                element={
                    <ProtectedPageRoute pageName="TutorGramatique">
                        <TutorGramatique />
                    </ProtectedPageRoute>
                } 
            />
            
            {/* Legacy routes with capital letters - redirect to lowercase */}
            <Route path="/Home" element={<Navigate to="/home" replace />} />
            <Route path="/Questions" element={<Navigate to="/questions" replace />} />
            <Route path="/Notebooks" element={<Navigate to="/notebooks" replace />} />
            <Route path="/Ranking" element={<Navigate to="/ranking" replace />} />
            <Route path="/CreateQuestion" element={<Navigate to="/createquestion" replace />} />
            <Route path="/Admin" element={<Navigate to="/admin" replace />} />
            <Route path="/Stats" element={<Navigate to="/stats" replace />} />
            <Route path="/ReviewQuestion" element={<Navigate to="/reviewquestion" replace />} />
            <Route path="/TutorGramatique" element={<Navigate to="/tutorgramatique" replace />} />
            
            {/* 404 - Not Found - Must be last */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <PagesContent />
        </Router>
    );
}