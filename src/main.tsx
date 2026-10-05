import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ReviewPage } from './review/ReviewPage.tsx'

/** Hidden route for reviewing the question bank (not linked from the game). */
const isReview = window.location.pathname.replace(/\/+$/, '') === '/review' || window.location.hash === '#/review'

createRoot(document.getElementById('root')!).render(<StrictMode>{isReview ? <ReviewPage /> : <App />}</StrictMode>)
