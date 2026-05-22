import React from 'react'
import ReactDom from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import AppContextProvider from './context/AppContext.jsx'

ReactDom.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppContextProvider>
      
      <App />

    </AppContextProvider>

  </BrowserRouter>


)