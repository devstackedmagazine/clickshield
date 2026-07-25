import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

function Result() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Result</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p>Result screen placeholder</p>
      </IonContent>
    </IonPage>
  );
}

export default Result;
