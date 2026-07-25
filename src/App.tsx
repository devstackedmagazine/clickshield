import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  book,
  bookOutline,
  home,
  homeOutline,
  qrCode,
  qrCodeOutline,
  settings,
  settingsOutline,
  time,
  timeOutline,
} from 'ionicons/icons';
import Home from './pages/Home';
import Scan from './pages/Scan';
import Result from './pages/Result';
import History from './pages/History';
import Learn from './pages/Learn';
import Settings from './pages/Settings';
import Welcome from './pages/Onboarding/Welcome';
import Permissions from './pages/Onboarding/Permissions';
import LanguageSelect from './pages/Onboarding/LanguageSelect';
import SplashScreen from './pages/SplashScreen';
import './App.css';

interface TabIconProps {
  outline: string;
  filled: string;
}

function TabIcon({ outline, filled }: TabIconProps) {
  return (
    <>
      <IonIcon className="tab-icon-outline" icon={outline} />
      <IonIcon className="tab-icon-filled" icon={filled} />
    </>
  );
}

function Tabs() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tabs/home" component={Home} />
        <Route exact path="/tabs/scan" component={Scan} />
        <Route exact path="/tabs/history" component={History} />
        <Route exact path="/tabs/learn" component={Learn} />
        <Route exact path="/tabs/settings" component={Settings} />
        <Route exact path="/tabs">
          <Redirect to="/tabs/home" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/tabs/home">
          <TabIcon outline={homeOutline} filled={home} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>
        <IonTabButton tab="scan" href="/tabs/scan">
          <TabIcon outline={qrCodeOutline} filled={qrCode} />
          <IonLabel>Scan</IonLabel>
        </IonTabButton>
        <IonTabButton tab="history" href="/tabs/history">
          <TabIcon outline={timeOutline} filled={time} />
          <IonLabel>History</IonLabel>
        </IonTabButton>
        <IonTabButton tab="learn" href="/tabs/learn">
          <TabIcon outline={bookOutline} filled={book} />
          <IonLabel>Learn</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/tabs/settings">
          <TabIcon outline={settingsOutline} filled={settings} />
          <IonLabel>Settings</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/result" component={Result} />
          <Route exact path="/onboarding" component={Welcome} />
          <Route exact path="/onboarding/permissions" component={Permissions} />
          <Route exact path="/onboarding/language" component={LanguageSelect} />
          <Route exact path="/splash" component={SplashScreen} />
          <Route path="/tabs" component={Tabs} />
          <Route exact path="/">
            <Redirect to="/splash" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}

export default App;
