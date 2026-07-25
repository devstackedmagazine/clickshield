import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

function Settings() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p>Settings screen placeholder</p>
      </IonContent>
    </IonPage>
  );
}

export default Settings;
