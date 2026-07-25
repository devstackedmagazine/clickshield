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
import { homeOutline, settingsOutline, timeOutline } from 'ionicons/icons';
import Home from './pages/Home';
import Scan from './pages/Scan';
import Result from './pages/Result';
import History from './pages/History';
import Settings from './pages/Settings';
import Welcome from './pages/Onboarding/Welcome';
import Permissions from './pages/Onboarding/Permissions';
import SplashScreen from './pages/SplashScreen';

function Tabs() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tabs/home" component={Home} />
        <Route exact path="/tabs/history" component={History} />
        <Route exact path="/tabs/settings" component={Settings} />
        <Route exact path="/tabs">
          <Redirect to="/tabs/home" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/tabs/home">
          <IonIcon icon={homeOutline} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>
        <IonTabButton tab="history" href="/tabs/history">
          <IonIcon icon={timeOutline} />
          <IonLabel>History</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/tabs/settings">
          <IonIcon icon={settingsOutline} />
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
          <Route exact path="/scan" component={Scan} />
          <Route exact path="/result" component={Result} />
          <Route exact path="/onboarding" component={Welcome} />
          <Route exact path="/onboarding/permissions" component={Permissions} />
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
