import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { pdfjs} from 'react-pdf'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min?worker';
import App from './App.jsx'

// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
