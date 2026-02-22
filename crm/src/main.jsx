import { render } from 'preact';
import { AuthProvider } from './lib/auth.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { App } from './app.jsx';
import './styles/global.css';

render(
  <AuthProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </AuthProvider>,
  document.getElementById('app')
);
