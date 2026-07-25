import { IonApp, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/react'

function App() {
  return (
    <IonApp>
      <IonHeader>
        <IonToolbar>
          <IonTitle>ClickShield</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Welcome to ClickShield</h1>
        <p>Your Ionic React app is ready.</p>
      </IonContent>
    </IonApp>
  )
}

export default App
