import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ConfiguratorProvider } from './context/ConfiguratorContext.jsx'
import { InteriorViewProvider } from './context/InteriorViewContext.jsx'
import { BuilderProvider } from './context/BuilderContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfiguratorProvider>
      <InteriorViewProvider>
        <BuilderProvider>
          <App />
        </BuilderProvider>
      </InteriorViewProvider>
    </ConfiguratorProvider>
  </StrictMode>,
)
