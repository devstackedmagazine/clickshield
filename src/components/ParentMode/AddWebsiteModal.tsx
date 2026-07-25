import { useRef, useState } from 'react';
import { IonContent, IonInput, IonModal, IonSelect, IonSelectOption } from '@ionic/react';
import type { OverlayEventDetail } from '@ionic/core';
import { formatAddedAt, getGuardianBlocklist, saveGuardianBlocklist } from '../../types/guardian';
import type { BlockedEntry } from '../../types/guardian';
import './AddWebsiteModal.css';

const CATEGORY_OPTIONS = ['General', 'Social Media', 'Gambling', 'Adult', 'Gaming', 'Other'];

export interface AddWebsiteModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onAdded: (entry: BlockedEntry) => void;
}

function normalizeDomain(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
}

function isValidDomain(domain: string): boolean {
  return domain.includes('.') && domain.length > 2;
}

function AddWebsiteModal({ isOpen, onDismiss, onAdded }: AddWebsiteModalProps) {
  const modalRef = useRef<HTMLIonModalElement>(null);

  const [domainInput, setDomainInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('General');
  const [noteInput, setNoteInput] = useState('');
  const [domainError, setDomainError] = useState('');

  const resetFields = () => {
    setDomainInput('');
    setCategoryInput('General');
    setNoteInput('');
    setDomainError('');
  };

  const handleModalDismiss = (event: CustomEvent<OverlayEventDetail>) => {
    onDismiss();
    if (event.detail.role !== 'submit') {
      resetFields();
    }
  };

  const handleAddWebsite = () => {
    const normalized = normalizeDomain(domainInput);
    if (!isValidDomain(normalized)) {
      setDomainError('Enter a valid domain, e.g. facebook.com');
      return;
    }

    const newEntry: BlockedEntry = {
      id: Date.now(),
      domain: normalized,
      category: categoryInput,
      note: noteInput.trim(),
      addedAt: formatAddedAt(new Date()),
    };

    saveGuardianBlocklist([...getGuardianBlocklist(), newEntry]);
    onAdded(newEntry);
    resetFields();
    modalRef.current?.dismiss(null, 'submit');
  };

  return (
    <IonModal
      ref={modalRef}
      isOpen={isOpen}
      initialBreakpoint={0.5}
      breakpoints={[0, 0.5, 1]}
      onDidDismiss={handleModalDismiss}
    >
      <IonContent className="add-website-modal-content">
        <h2 className="add-website-modal-title">Block a Website</h2>

        <div className="add-website-modal-field">
          <IonInput
            label="Domain or URL"
            labelPlacement="stacked"
            placeholder="e.g. facebook.com"
            type="url"
            clearInput
            value={domainInput}
            onIonInput={(e) => {
              setDomainInput(e.detail.value ?? '');
              setDomainError('');
            }}
          />
          {domainError && <p className="add-website-modal-error">{domainError}</p>}
        </div>

        <div className="add-website-modal-field">
          <IonSelect
            label="Category (optional)"
            labelPlacement="stacked"
            interface="popover"
            value={categoryInput}
            onIonChange={(e) => setCategoryInput(e.detail.value)}
          >
            {CATEGORY_OPTIONS.map((category) => (
              <IonSelectOption key={category} value={category}>
                {category}
              </IonSelectOption>
            ))}
          </IonSelect>
        </div>

        <div className="add-website-modal-field">
          <IonInput
            label="Note (optional)"
            labelPlacement="stacked"
            placeholder="Add a note (e.g. 'social media')"
            value={noteInput}
            onIonInput={(e) => setNoteInput(e.detail.value ?? '')}
          />
        </div>

        <button className="add-website-modal-submit-button" onClick={handleAddWebsite}>
          Block Website
        </button>
      </IonContent>
    </IonModal>
  );
}

export default AddWebsiteModal;
