import Router from 'preact-router';
import { useAuth } from './lib/auth.jsx';
import { Layout } from './components/Layout.jsx';
import { Login } from './views/Login.jsx';
import { Dashboard } from './views/Dashboard.jsx';
import { Pipeline } from './views/Pipeline.jsx';
import { ContactList } from './views/ContactList.jsx';
import { ContactDetail } from './views/ContactDetail.jsx';
import { ContactForm } from './views/ContactForm.jsx';
import { CompanyList } from './views/CompanyList.jsx';
import { CompanyDetail } from './views/CompanyDetail.jsx';
import { DealDetail } from './views/DealDetail.jsx';
import { DealForm } from './views/DealForm.jsx';
import { Settings } from './views/Settings.jsx';

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div class="loading-center" style="min-height: 100vh">
        <div class="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Router>
        <Dashboard path="/crm/" />
        <Pipeline path="/crm/pipeline" />
        <ContactList path="/crm/contacts" />
        <ContactForm path="/crm/contacts/new" />
        <ContactDetail path="/crm/contacts/:id" />
        <CompanyList path="/crm/companies" />
        <CompanyDetail path="/crm/companies/:id" />
        <DealForm path="/crm/deals/new" />
        <DealDetail path="/crm/deals/:id" />
        <Settings path="/crm/settings" />
        <Dashboard default />
      </Router>
    </Layout>
  );
}
