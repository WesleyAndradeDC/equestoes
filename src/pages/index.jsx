import Layout from "./Layout.jsx";

import Home from "./Home";

import Questions from "./Questions";

import Notebooks from "./Notebooks";

import Ranking from "./Ranking";

import CreateQuestion from "./CreateQuestion";

import Admin from "./Admin";

import Stats from "./Stats";

import ReviewQuestion from "./ReviewQuestion";

import TutorGramatique from "./TutorGramatique";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Questions" element={<Questions />} />
                
                <Route path="/Notebooks" element={<Notebooks />} />
                
                <Route path="/Ranking" element={<Ranking />} />
                
                <Route path="/CreateQuestion" element={<CreateQuestion />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Stats" element={<Stats />} />
                
                <Route path="/ReviewQuestion" element={<ReviewQuestion />} />
                
                <Route path="/TutorGramatique" element={<TutorGramatique />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}