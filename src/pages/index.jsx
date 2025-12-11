import Layout from "./Layout.jsx";
import Login from "./Login.jsx";
import NotFound from "./NotFound.jsx";
import ProtectedRoute from "@/components/ProtectedRoute";

import Home from "./Home";

import Questions from "./Questions";

import Notebooks from "./Notebooks";

import Ranking from "./Ranking";

import CreateQuestion from "./CreateQuestion";

import Admin from "./Admin";

import Stats from "./Stats";

import ReviewQuestion from "./ReviewQuestion";

import TutorGramatique from "./TutorGramatique";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Questions: Questions,
    
    Notebooks: Notebooks,
    
    Ranking: Ranking,
    
    CreateQuestion: CreateQuestion,
    
    Admin: Admin,
    
    Stats: Stats,
    
    ReviewQuestion: ReviewQuestion,
    
    TutorGramatique: TutorGramatique,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/404" element={<NotFound />} />
            
            {/* Protected routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Home />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/Home" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Home />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/Questions" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Questions />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/Notebooks" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Notebooks />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/Ranking" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Ranking />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/CreateQuestion" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <CreateQuestion />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/Admin" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Admin />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/Stats" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Stats />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/ReviewQuestion" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <ReviewQuestion />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/TutorGramatique" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <TutorGramatique />
                    </Layout>
                </ProtectedRoute>
            } />
            
            {/* 404 - Not Found */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}