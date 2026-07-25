import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonActionSheet,
  IonAlert,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonPage,
  IonSearchbar,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { addOutline, banOutline, chevronBack, ellipsisVertical } from 'ionicons/icons';
import AddWebsiteModal from '../../components/ParentMode/AddWebsiteModal';
import { getGuardianBlocklist, saveGuardianBlocklist } from '../../types/guardian';
import type { BlockedEntry } from '../../types/guardian';
import './ManageBlocklist.css';

const FILTER_PILLS = ['All Sites', 'Recently Added', 'Social Media', 'Gaming', 'Other'] as const;
type FilterPill = (typeof FILTER_PILLS)[number];

const MOCK_BLOCKLIST: BlockedEntry[] = [
  { id: 1, domain: 'facebook.com', addedAt: 'Oct 24', category: 'Social Media', note: 'Blocked by Parent' },
  { id: 2, domain: 'tiktok.com', addedAt: 'Oct 22', category: 'Social Media', note: 'Blocked by Parent' },
  { id: 3, domain: 'roblox.com', addedAt: 'Oct 20', category: 'Gaming', note: 'Blocked by Parent' },
];

function ManageBlocklist() {
  const history = useHistory();

  const [blocklist, setBlocklist] = useState<BlockedEntry[]>(() => {
    const stored = getGuardianBlocklist();
    return stored.length > 0 ? stored : MOCK_BLOCKLIST;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterPill>('All Sites');
  const [actionSheetEntry, setActionSheetEntry] = useState<BlockedEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<BlockedEntry | null>(null);
  const [removingEntry, setRemovingEntry] = useState<BlockedEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useIonViewWillEnter(() => {
    const stored = getGuardianBlocklist();
    setBlocklist(stored.length > 0 ? stored : MOCK_BLOCKLIST);
  });

  const persistBlocklist = (entries: BlockedEntry[]) => {
    setBlocklist(entries);
    saveGuardianBlocklist(entries);
  };

  const filteredBlocklist = useMemo(() => {
    let entries = blocklist;

    if (activeFilter === 'Recently Added') {
      entries = [...entries].slice(-3);
    } else if (activeFilter !== 'All Sites') {
      entries = entries.filter((entry) => entry.category === activeFilter);
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      entries = entries.filter((entry) => entry.domain.toLowerCase().includes(term));
    }

    return entries;
  }, [blocklist, activeFilter, searchTerm]);

  const handleWebsiteAdded = (entry: BlockedEntry) => {
    setBlocklist((prev) => [...prev, entry]);
  };

  const handleRemoveConfirm = () => {
    if (!removingEntry) return;
    persistBlocklist(blocklist.filter((entry) => entry.id !== removingEntry.id));
    setRemovingEntry(null);
  };

  const handleEditSave = (newNote: string) => {
    if (!editingEntry) return;
    persistBlocklist(
      blocklist.map((entry) =>
        entry.id === editingEntry.id ? { ...entry, note: newNote.trim() || entry.note } : entry,
      ),
    );
    setEditingEntry(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="blocklist-header-dark">
          <button
            slot="start"
            className="blocklist-back-button"
            onClick={() => history.push('/parent-mode')}
          >
            <IonIcon icon={chevronBack} />
          </button>
          <span className="blocklist-header-title">Blocklist</span>
        </IonToolbar>
      </IonHeader>
      <IonContent className="blocklist-content">
        <IonSearchbar
          className="blocklist-searchbar"
          placeholder="Search domains..."
          value={searchTerm}
          onIonInput={(e) => setSearchTerm(e.detail.value ?? '')}
        />

        <div className="blocklist-filter-pills">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill}
              className={`blocklist-filter-pill ${pill === activeFilter ? 'active' : ''}`}
              onClick={() => setActiveFilter(pill)}
            >
              {pill}
            </button>
          ))}
        </div>

        {filteredBlocklist.length > 0 ? (
          <div className="blocklist-list">
            {filteredBlocklist.map((entry) => (
              <div className="blocklist-entry-card" key={entry.id}>
                <div className="blocklist-favicon">
                  <span>{entry.domain.charAt(0)}</span>
                </div>
                <div className="blocklist-entry-content">
                  <p className="blocklist-entry-domain">{entry.domain}</p>
                  <p className="blocklist-entry-meta">Added on {entry.addedAt}</p>
                  <p className="blocklist-entry-meta">{entry.note || 'Blocked by Parent'}</p>
                </div>
                <div className="blocklist-entry-right">
                  <span className="blocklist-badge">BLOCKED</span>
                  <button
                    className="blocklist-menu-button"
                    onClick={() => setActionSheetEntry(entry)}
                  >
                    <IonIcon icon={ellipsisVertical} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="blocklist-empty-state">
            <IonIcon icon={banOutline} />
            <p className="blocklist-empty-title">No blocked sites</p>
            <p className="blocklist-empty-subtitle">Add websites using the button below.</p>
          </div>
        )}
      </IonContent>

      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <div className="blocklist-fab-row">
          <button className="blocklist-fab-label" onClick={() => setShowAddModal(true)}>
            + Add Website
          </button>
          <IonFabButton color="primary" onClick={() => setShowAddModal(true)}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </div>
      </IonFab>

      <IonActionSheet
        isOpen={actionSheetEntry !== null}
        onDidDismiss={() => setActionSheetEntry(null)}
        header={actionSheetEntry?.domain}
        buttons={[
          {
            text: 'Edit Label',
            handler: () => {
              setEditingEntry(actionSheetEntry);
            },
          },
          {
            text: 'Remove',
            role: 'destructive',
            handler: () => {
              setRemovingEntry(actionSheetEntry);
            },
          },
          { text: 'Cancel', role: 'cancel' },
        ]}
      />

      <IonAlert
        isOpen={editingEntry !== null}
        onDidDismiss={() => setEditingEntry(null)}
        header="Edit Label"
        inputs={[
          {
            name: 'note',
            type: 'text',
            placeholder: 'Label',
            value: editingEntry?.note ?? '',
          },
        ]}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Save',
            handler: (data: { note: string }) => handleEditSave(data.note),
          },
        ]}
      />

      <IonAlert
        isOpen={removingEntry !== null}
        onDidDismiss={() => setRemovingEntry(null)}
        header="Remove site?"
        message={`Remove ${removingEntry?.domain ?? ''} from blocklist?`}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Remove', role: 'destructive', handler: handleRemoveConfirm },
        ]}
      />

      <AddWebsiteModal
        isOpen={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        onAdded={handleWebsiteAdded}
      />
    </IonPage>
  );
}

export default ManageBlocklist;
