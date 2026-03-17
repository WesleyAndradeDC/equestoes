import React, { useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
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
import ETutory from "./ETutory";
import Flashcards from "./Flashcards";

const PAGES = {
    Home,
    Questions,
    Notebooks,
    Ranking,
    CreateQuestion,
    Admin,
    Stats,
    ReviewQuestion,
    ETutory,
    Flashcards,
};

function _getCurrentPage(pathname) {
    const cleanPath = pathname.endsWith('/') && pathname !== '/'
        ? pathname.slice(0, -1)
        : pathname;

    let urlLastPart = cleanPath.split('/').pop();

    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(
        page => page.toLowerCase() === urlLastPart.toLowerCase()
    );

    return pageName || 'Home';
}

function ProtectedPageRoute({ children, pageName }) {
    return (
        <ProtectedRoute>
            <Layout currentPageName={pageName}>
                {children}
            </Layout>
        </ProtectedRoute>
    );
}

function PagesContent() {
    const location = useLocation();
    const currentPage = useMemo(() => _getCurrentPage(location.pathname), [location.pathname]);

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/404" element={<NotFound />} />

            {/* Protected routes */}
            <Route path="/" element={
                <ProtectedPageRoute pageName={currentPage}><Home /></ProtectedPageRoute>
            } />
            <Route path="/home" element={
                <ProtectedPageRoute pageName="Home"><Home /></ProtectedPageRoute>
            } />
            <Route path="/questions" element={
                <ProtectedPageRoute pageName="Questions"><Questions /></ProtectedPageRoute>
            } />
            <Route path="/notebooks" element={
                <ProtectedPageRoute pageName="Notebooks"><Notebooks /></ProtectedPageRoute>
            } />
            <Route path="/ranking" element={
                <ProtectedPageRoute pageName="Ranking"><Ranking /></ProtectedPageRoute>
            } />
            <Route path="/createquestion" element={
                <ProtectedPageRoute pageName="CreateQuestion"><CreateQuestion /></ProtectedPageRoute>
            } />
            <Route path="/admin" element={
                <ProtectedPageRoute pageName="Admin"><Admin /></ProtectedPageRoute>
            } />
            <Route path="/stats" element={
                <ProtectedPageRoute pageName="Stats"><Stats /></ProtectedPageRoute>
            } />
            <Route path="/reviewquestion" element={
                <ProtectedPageRoute pageName="ReviewQuestion"><ReviewQuestion /></ProtectedPageRoute>
            } />
            <Route path="/etutory" element={
                <ProtectedPageRoute pageName="ETutory"><ETutory /></ProtectedPageRoute>
            } />
            <Route path="/flashcards" element={
                <ProtectedPageRoute pageName="Flashcards"><Flashcards /></ProtectedPageRoute>
            } />

            {/* Legacy redirects */}
            <Route path="/Home" element={<Navigate to="/home" replace />} />
            <Route path="/Questions" element={<Navigate to="/questions" replace />} />
            <Route path="/Notebooks" element={<Navigate to="/notebooks" replace />} />
            <Route path="/Ranking" element={<Navigate to="/ranking" replace />} />
            <Route path="/CreateQuestion" element={<Navigate to="/createquestion" replace />} />
            <Route path="/Admin" element={<Navigate to="/admin" replace />} />
            <Route path="/Stats" element={<Navigate to="/stats" replace />} />
            <Route path="/ReviewQuestion" element={<Navigate to="/reviewquestion" replace />} />
            <Route path="/TutorGramatique" element={<Navigate to="/etutory" replace />} />
            <Route path="/tutorgramatique" element={<Navigate to="/etutory" replace />} />
            <Route path="/ETutory" element={<Navigate to="/etutory" replace />} />
            <Route path="/Flashcards" element={<Navigate to="/flashcards" replace />} />

            {/* 404 */}
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
