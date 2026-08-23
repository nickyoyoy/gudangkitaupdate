import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNavBar from './components/BottomNavBar';
import BerandaTab from './components/BerandaTab';
import MasukTab from './components/MasukTab';
import KeluarTab from './components/KeluarTab';
import PreOrderTab from './components/PreOrderTab';
import StokTab from './components/StokTab';
import SummaryTab from './components/SummaryTab';
import LoginPage from './components/LoginPage';
import { WarehouseItem, StockMutation, PreOrder, SystemNotification, UserSession } from './types';
import { INITIAL_ITEMS, INITIAL_MUTATIONS, INITIAL_PRE_ORDERS } from './data/initialData';
import NotificationModal from './components/NotificationModal';
import { LogOut, User, ShieldAlert, X, Trash2 } from 'lucide-react';
import { onSnapshot, collection } from 'firebase/firestore';
import {
  db,
  initializeFirestoreIfEmpty,
  saveItemToCloud,
  deleteItemFromCloud,
  saveMutationToCloud,
  deleteMutationFromCloud,
  batchDeleteMutationsFromCloud,
  savePreOrderToCloud,
  deletePreOrderFromCloud,
  saveNotificationToCloud,
  deleteNotificationFromCloud,
  resetCloudDatabase,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('gudang_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isResetSuccessOpen, setIsResetSuccessOpen] = useState<boolean>(false);
  const [mutationToDelete, setMutationToDelete] = useState<StockMutation | null>(null);
  const [isReset, setIsReset] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gudang_is_reset') === 'true';
    } catch {
      return false;
    }
  });

  // Core mutable persistent stocks & movements states
  const [items, setItems] = useState<WarehouseItem[]>(() => {
    try {
      const saved = localStorage.getItem('gudang_items');
      if (!saved) return INITIAL_ITEMS;
      const parsed = JSON.parse(saved) as WarehouseItem[];
      const hasObsolete = parsed.some(item => 
        ['Papan Kayu Mahoni', 'Semen Portland', 'Baut Baja 12mm', 'Cat Tembok Putih'].includes(item.name)
      );
      if (hasObsolete) {
        localStorage.removeItem('gudang_items');
        localStorage.removeItem('gudang_mutations');
        localStorage.removeItem('gudang_preorders');
        return INITIAL_ITEMS;
      }
      // Ensure any missing initial items (e.g. NFC Card, Privillage Card, Resi Thermal) are included
      const existingNames = new Set(parsed.map(i => i.name.toLowerCase()));
      const missingInitial = INITIAL_ITEMS.filter(init => !existingNames.has(init.name.toLowerCase()));
      if (missingInitial.length > 0) {
        const merged = [...parsed, ...missingInitial];
        localStorage.setItem('gudang_items', JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return INITIAL_ITEMS;
    }
  });

  const [mutations, setMutations] = useState<StockMutation[]>(() => {
    try {
      const saved = localStorage.getItem('gudang_mutations');
      return saved ? JSON.parse(saved) : INITIAL_MUTATIONS;
    } catch {
      return INITIAL_MUTATIONS;
    }
  });

  const [preOrders, setPreOrders] = useState<PreOrder[]>(() => {
    try {
      const saved = localStorage.getItem('gudang_preorders');
      return saved ? JSON.parse(saved) : INITIAL_PRE_ORDERS;
    } catch {
      return INITIAL_PRE_ORDERS;
    }
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    try {
      const saved = localStorage.getItem('gudang_notifications');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback below
    }
    return [
      {
        id: 'n1',
        title: '⚠️ Peringatan Stok Kritis',
        message: 'Stok Box 10 ML kritis! Hanya sisa 2 Pcs di Rak A-02.',
        type: 'warning',
        time: '08:12',
        isRead: false,
        linkToTab: 'stok',
      },
      {
        id: 'n2',
        title: '⚠️ Peringatan Stok Kritis',
        message: 'Stok Cat Tembok Putih kritis! Hanya sisa 2 Pcs di Rak D-02.',
        type: 'warning',
        time: '08:30',
        isRead: false,
        linkToTab: 'stok',
      },
      {
        id: 'n3',
        title: '📦 Pengiriman PO Diterima',
        message: 'Sebagian pre-order PO-2023-0941 (Box 35 ML) sejumlah 200 Pcs telah tiba di gudang.',
        type: 'success',
        time: '09:12',
        isRead: true,
        linkToTab: 'preorder',
      }
    ];
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    let isMounted = true;
    let unsubscribes: (() => void)[] = [];

    async function initFirebaseSync() {
      try {
        // Initial population if empty (migration of localStorage data to Firestore cloud)
        try {
          await initializeFirestoreIfEmpty(items, mutations, preOrders, notifications);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'items');
        }

        if (!isMounted) return;

        // Set up real-time listeners for all 4 collections with proper error callbacks
        const unsubItems = onSnapshot(
          collection(db, 'items'),
          (snapshot) => {
            const cloudItems: WarehouseItem[] = [];
            snapshot.forEach((doc) => {
              cloudItems.push(doc.data() as WarehouseItem);
            });
            if (cloudItems.length > 0) {
              cloudItems.sort((a, b) => a.id.localeCompare(b.id));
              setItems(cloudItems);
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'items');
          }
        );
        unsubscribes.push(unsubItems);

        const unsubMutations = onSnapshot(
          collection(db, 'mutations'),
          (snapshot) => {
            const cloudMutations: StockMutation[] = [];
            snapshot.forEach((doc) => {
              cloudMutations.push(doc.data() as StockMutation);
            });
            cloudMutations.sort((a, b) => b.id.localeCompare(a.id));
            setMutations(cloudMutations);
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'mutations');
          }
        );
        unsubscribes.push(unsubMutations);

        const unsubPreorders = onSnapshot(
          collection(db, 'preorders'),
          (snapshot) => {
            const cloudPreorders: PreOrder[] = [];
            snapshot.forEach((doc) => {
              cloudPreorders.push(doc.data() as PreOrder);
            });
            cloudPreorders.sort((a, b) => b.id.localeCompare(a.id));
            setPreOrders(cloudPreorders);
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'preorders');
          }
        );
        unsubscribes.push(unsubPreorders);

        const unsubNotifications = onSnapshot(
          collection(db, 'notifications'),
          (snapshot) => {
            const cloudNotifications: SystemNotification[] = [];
            snapshot.forEach((doc) => {
              cloudNotifications.push(doc.data() as SystemNotification);
            });
            cloudNotifications.sort((a, b) => b.id.localeCompare(a.id));
            setNotifications(cloudNotifications);
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'notifications');
          }
        );
        unsubscribes.push(unsubNotifications);

        setCloudStatus('connected');
      } catch (err) {
        console.error('Firebase sync initialization error:', err);
        setCloudStatus('error');
      }
    }

    initFirebaseSync();

    return () => {
      isMounted = false;
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  // Persist states to standard client-side storage whenever they update
  useEffect(() => {
    localStorage.setItem('gudang_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('gudang_mutations', JSON.stringify(mutations));
  }, [mutations]);

  useEffect(() => {
    localStorage.setItem('gudang_preorders', JSON.stringify(preOrders));
  }, [preOrders]);

  useEffect(() => {
    localStorage.setItem('gudang_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gudang_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gudang_currentUser');
    }
  }, [currentUser]);

  // Session Inactivity Timeout (Auto Logout after 5 minutes of inactivity or window close)
  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem('gudang_lastActiveTime');
      return;
    }

    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in ms

    // 1. Initial mounting check (for cross-session / page refreshes / returning after closing tab)
    const checkInitialSession = () => {
      const lastActive = localStorage.getItem('gudang_lastActiveTime');
      if (lastActive) {
        const timeElapsed = Date.now() - Number(lastActive);
        if (timeElapsed > INACTIVITY_TIMEOUT) {
          setCurrentUser(null);
          localStorage.removeItem('gudang_currentUser');
          localStorage.removeItem('gudang_lastActiveTime');
          return true; // Session expired
        }
      }
      // Session is valid, reset the timestamp to current time
      localStorage.setItem('gudang_lastActiveTime', Date.now().toString());
      return false; // Session still active
    };

    const isExpired = checkInitialSession();
    if (isExpired) return;

    // 2. Real-time reset handler for user interaction
    const resetTimer = () => {
      localStorage.setItem('gudang_lastActiveTime', Date.now().toString());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // 3. Periodic passive interval check (runs in background every 5 seconds)
    const interval = setInterval(() => {
      const lastActive = localStorage.getItem('gudang_lastActiveTime');
      if (lastActive) {
        const timeElapsed = Date.now() - Number(lastActive);
        if (timeElapsed > INACTIVITY_TIMEOUT) {
          setCurrentUser(null);
          localStorage.removeItem('gudang_currentUser');
          localStorage.removeItem('gudang_lastActiveTime');
        }
      }
    }, 5000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(interval);
    };
  }, [currentUser]);

  // Core handler: create a stock mutation & correspondingly update item stock quant
  const handleAddMutation = (newMut: Omit<StockMutation, 'id' | 'time' | 'date'>) => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    // Format timestamp string "HH:MM"
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    // Format date string "YYYY-MM-DD"
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    // Append standard mutation log entry
    const mutationLogItem: StockMutation = {
      ...newMut,
      id: `mut-${Date.now()}`,
      time: timeStr,
      date: dateStr,
    };

    setMutations((prev) => [mutationLogItem, ...prev]);
    saveMutationToCloud(mutationLogItem);

    // Synchronize item quantities correspondingly
    setItems((prevItems) =>
      prevItems.map((itm) => {
        if (itm.id === newMut.itemId) {
          const delta = newMut.type === 'masuk' ? newMut.quantity : -newMut.quantity;
          const updatedStock = Math.max(0, itm.stock + delta);

          // Real-time stock alerts trigger automatically
          if (updatedStock <= 15 && itm.stock > 15) {
            const timeStrHour = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
            const newNotif: SystemNotification = {
              id: `notif-stock-${Date.now()}-${itm.id}`,
              title: '⚠️ Peringatan Stok Rendah',
              message: `Stok ${itm.name} telah menyusut ke ${updatedStock} Pcs di Rak ${itm.rack}.`,
              type: 'warning',
              time: timeStrHour,
              isRead: false,
              linkToTab: 'stok',
            };
            setNotifications((prevNotifs) => [newNotif, ...prevNotifs]);
            saveNotificationToCloud(newNotif);
          }

          const updatedItem = {
            ...itm,
            stock: updatedStock,
          };
          saveItemToCloud(updatedItem);
          return updatedItem;
        }
        return itm;
      })
    );
  };

  // Pre-Order creator action callback
  const handleAddPreOrder = (newPo: PreOrder) => {
    setPreOrders((prev) => [newPo, ...prev]);
    savePreOrderToCloud(newPo);

    // Add success notification in real time
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStrHour = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
    const newNotif: SystemNotification = {
      id: `notif-po-${Date.now()}`,
      title: '📦 Pre Order Baru Terdaftar',
      message: `Pre-Order ${newPo.poCode} untuk ${newPo.itemName} (${newPo.totalQty} Pcs) telah diverifikasi.`,
      type: 'info',
      time: timeStrHour,
      isRead: false,
      linkToTab: 'preorder',
    };
    setNotifications((prevNotifs) => [newNotif, ...prevNotifs]);
    saveNotificationToCloud(newNotif);
  };

  // Pre-Order incoming shipment receptor callback
  const handleReceivePreOrderItems = (poId: string, qty: number, pic: string) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    setPreOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          const updatedReceived = po.receivedQty + qty;
          const isComplete = updatedReceived >= po.totalQty;

          // Append receiving histories block
          const updatedHistory = [
            ...po.receivingHistory,
            { id: `rh-${Date.now()}`, date: dateStr, qty },
          ];

          // Trigger real-time success notification
          const timeStrHour = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
          const newNotif: SystemNotification = {
            id: `notif-receive-${Date.now()}`,
            title: isComplete ? '✅ Pre Order Selesai' : '📦 Penerimaan Pre Order Parsial',
            message: `${qty} Pcs untuk ${po.itemName} (${po.poCode}) telah diterima oleh ${pic || 'Admin Gudang'}.`,
            type: 'success',
            time: timeStrHour,
            isRead: false,
            linkToTab: 'preorder',
          };
          setNotifications((prevNotifs) => [newNotif, ...prevNotifs]);
          saveNotificationToCloud(newNotif);

          const updatedPo = {
            ...po,
            receivedQty: updatedReceived,
            status: isComplete ? 'Complete' as const : 'Partial' as const,
            receivingHistory: updatedHistory,
          };
          savePreOrderToCloud(updatedPo);

          return updatedPo;
        }
        return po;
      })
    );

    // Automatically trigger onAddMutation to increase inventory stock log & physical count!
    const targetPo = preOrders.find((p) => p.id === poId);
    if (targetPo) {
      handleAddMutation({
        itemId: targetPo.itemId,
        itemName: targetPo.itemName,
        type: 'masuk',
        quantity: qty,
        pic: pic || 'Admin Penerimaan',
      });
    }
  };

  // Handler to delete/cancel a mutation and automatically reverse its impact on physical stock
  const handleDeleteMutation = (mutationId: string) => {
    const targetMut = mutations.find((m) => m.id === mutationId);
    if (!targetMut) return;
    setMutationToDelete(targetMut);
  };

  const executeDeleteMutation = (mutationId: string) => {
    const targetMut = mutations.find((m) => m.id === mutationId);
    if (!targetMut) return;

    setMutations((prev) => prev.filter((m) => m.id !== mutationId));
    deleteMutationFromCloud(mutationId);

    // Reverse the stock impact
    setItems((prevItems) =>
      prevItems.map((itm) => {
        if (itm.id === targetMut.itemId) {
          const delta = targetMut.type === 'masuk' ? -targetMut.quantity : targetMut.quantity;
          const updatedStock = Math.max(0, itm.stock + delta);
          const updatedItem = {
            ...itm,
            stock: updatedStock,
          };
          saveItemToCloud(updatedItem);
          return updatedItem;
        }
        return itm;
      })
    );

    // Create system notification for backtracking trace
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStrHour = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
    const newNotif: SystemNotification = {
      id: `notif-del-mut-${Date.now()}`,
      title: '🗑️ Mutasi Barang Dibatalkan',
      message: `Aktivitas mutasi ${targetMut.itemName} sejumlah ${targetMut.quantity} Pcs telah dihapus. Stok fisik telah dikembalikan.`,
      type: 'warning',
      time: timeStrHour,
      isRead: false,
      linkToTab: 'home',
    };
    setNotifications((prevNotifs) => [newNotif, ...prevNotifs]);
    saveNotificationToCloud(newNotif);
    setMutationToDelete(null);
  };

  // Bulk delete history records without changing physical stock (Option A: pure log cleanup)
  const handleBulkDeleteMutations = (mutationIds: string[]) => {
    if (!mutationIds || mutationIds.length === 0) return;

    setMutations((prev) => prev.filter((m) => !mutationIds.includes(m.id)));
    batchDeleteMutationsFromCloud(mutationIds);

    // Create system notification for cleanup record
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStrHour = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
    const newNotif: SystemNotification = {
      id: `notif-bulk-del-${Date.now()}`,
      title: '🧹 Riwayat Mutasi Dibersihkan',
      message: `${mutationIds.length} catatan riwayat mutasi telah dihapus untuk mengoptimalkan performa. Stok fisik tetap aman.`,
      type: 'info',
      time: timeStrHour,
      isRead: false,
      linkToTab: 'summary',
    };
    setNotifications((prevNotifs) => [newNotif, ...prevNotifs]);
    saveNotificationToCloud(newNotif);
  };

  // Handler to delete a pre-order completely
  const handleDeletePreOrder = (poId: string) => {
    const targetPo = preOrders.find((p) => p.id === poId);
    if (!targetPo) return;

    setPreOrders((prev) => prev.filter((p) => p.id !== poId));
    deletePreOrderFromCloud(poId);

    // Create system notification for the deleted Pre-Order
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStrHour = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
    const newNotif: SystemNotification = {
      id: `notif-del-po-${Date.now()}`,
      title: '🗑️ Pre-Order Dihapus',
      message: `Pre-Order ${targetPo.poCode} untuk ${targetPo.itemName} (${targetPo.totalQty} Pcs) telah dihapus dari sistem.`,
      type: 'warning',
      time: timeStrHour,
      isRead: false,
      linkToTab: 'preorder',
    };
    setNotifications((prevNotifs) => [newNotif, ...prevNotifs]);
    saveNotificationToCloud(newNotif);
  };

  // In-line edits directly from Stok scanner or coordinates
  const handleUpdateItemStock = (itemId: string, newStock: number) => {
    setItems((prev) =>
      prev.map((itm) => {
        if (itm.id === itemId) {
          const updated = { ...itm, stock: newStock };
          saveItemToCloud(updated);
          return updated;
        }
        return itm;
      })
    );
  };

  const handleUpdateItemRack = (itemId: string, newRack: string) => {
    setItems((prev) =>
      prev.map((itm) => {
        if (itm.id === itemId) {
          const updated = { ...itm, rack: newRack };
          saveItemToCloud(updated);
          return updated;
        }
        return itm;
      })
    );
  };

  const handleBackToHome = () => {
    setActiveTab('home');
  };

  const handleProfileToast = () => {
    setIsProfileOpen(true);
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const executeLogout = () => {
    setCurrentUser(null);
    setIsLogoutConfirmOpen(false);
    setActiveTab('home');
  };

  const handleResetAllData = () => {
    setIsProfileOpen(false);
    setIsResetConfirmOpen(true);
  };

  const executeResetAllData = () => {
    const resetItems = items.map((itm) => ({ ...itm, stock: 0 }));
    setItems(resetItems);
    setMutations([]);
    setPreOrders([]);
    setNotifications([]);
    setIsReset(true);
    
    localStorage.setItem('gudang_items', JSON.stringify(resetItems));
    localStorage.setItem('gudang_mutations', JSON.stringify([]));
    localStorage.setItem('gudang_preorders', JSON.stringify([]));
    localStorage.setItem('gudang_notifications', JSON.stringify([]));
    localStorage.setItem('gudang_is_reset', 'true');

    // Reset cloud database as well
    resetCloudDatabase(resetItems, [], [], []);
    
    setIsResetConfirmOpen(false);
    setIsResetSuccessOpen(true);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => {
        const updated = { ...n, isRead: true };
        saveNotificationToCloud(updated);
        return updated;
      })
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    deleteNotificationFromCloud(notificationId);
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notificationId) {
          const updated = { ...n, isRead: true };
          saveNotificationToCloud(updated);
          return updated;
        }
        return n;
      })
    );
  };

  const handleClearReadNotifications = () => {
    notifications.forEach((n) => {
      if (n.isRead) {
        deleteNotificationFromCloud(n.id);
      }
    });
    setNotifications((prev) => prev.filter((n) => !n.isRead));
  };

  const hasUnreadAlerts = notifications.some((n) => !n.isRead);

  if (!currentUser) {
    return <LoginPage onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased" id="dashboard-app">
      {/* Dynamic Header Component */}
      <Header
        activeTab={activeTab}
        onBackToHome={handleBackToHome}
        onOpenProfile={handleProfileToast}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        hasUnreadNotifications={hasUnreadAlerts}
        currentUser={currentUser}
        onLogout={handleLogout}
        cloudStatus={cloudStatus}
      />

      {/* Main Panel Frame Layout */}
      <main className="flex-grow pt-20 pb-32 px-4 max-w-lg mx-auto w-full" id="main-content">
        {activeTab === 'home' && (
          <BerandaTab
            items={items}
            mutations={mutations}
            onNavigate={setActiveTab}
            onDeleteMutation={handleDeleteMutation}
            currentUser={currentUser}
            isReset={isReset}
          />
        )}

        {activeTab === 'masuk' && (
          <MasukTab
            items={items}
            mutations={mutations}
            onAddMutation={handleAddMutation}
            onDeleteMutation={handleDeleteMutation}
            onDeleteMutations={handleBulkDeleteMutations}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'keluar' && (
          <KeluarTab
            items={items}
            mutations={mutations}
            onAddMutation={handleAddMutation}
            onDeleteMutation={handleDeleteMutation}
            onDeleteMutations={handleBulkDeleteMutations}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'preorder' && (
          <PreOrderTab
            items={items}
            preOrders={preOrders}
            onAddPreOrder={handleAddPreOrder}
            onReceiveItems={handleReceivePreOrderItems}
            onDeletePreOrder={handleDeletePreOrder}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'stok' && (
          <StokTab
            items={items}
            mutations={mutations}
            onUpdateItemStock={handleUpdateItemStock}
            onUpdateItemRack={handleUpdateItemRack}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryTab
            items={items}
            mutations={mutations}
            onDeleteMutation={handleDeleteMutation}
            onDeleteMutations={handleBulkDeleteMutations}
            isReset={isReset}
          />
        )}
      </main>

      {/* Dynamic bottom tabs */}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Interactive notifications drawer */}
      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNavigate={setActiveTab}
        onDeleteNotification={handleDeleteNotification}
        onMarkAsRead={handleMarkAsRead}
        onClearReadNotifications={handleClearReadNotifications}
      />

      {/* Custom Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-xl animate-in zoom-in-95 duration-200 text-slate-800 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100/50 mb-3.5">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mb-1.5">
                Keluar Aplikasi
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-sans">
                Apakah Anda yakin ingin keluar dari aplikasi GudangKita? Sesi Anda akan diakhiri.
              </p>
              
              <div className="grid grid-cols-2 gap-3 w-full font-sans">
                <button
                  type="button"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors focus:outline-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeLogout}
                  className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors focus:outline-none shadow-md shadow-rose-500/10"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Profile Modal */}
      {isProfileOpen && currentUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-xl animate-in zoom-in-95 duration-200 text-slate-800 border border-slate-100 relative">
            <button
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/20 shadow-inner mb-3 flex items-center justify-center bg-blue-100 text-blue-600 text-xl font-bold font-sans">
                {currentUser.avatarUrl && currentUser.username !== 'office' && currentUser.username !== 'gudang' ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>
                    {currentUser.username === 'office' ? 'O' : currentUser.username === 'gudang' ? 'G' : currentUser.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <h3 className="font-display text-base font-bold text-slate-900">
                {currentUser.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">@{currentUser.username}</p>

              {/* Badges / Details */}
              <div className="mt-4 space-y-2 w-full text-left font-sans text-xs border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Hak Akses:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                    currentUser.role === 'admin' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {currentUser.role === 'admin' ? 'Administrator' : 'Staf Gudang'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Status Akun:</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>Aktif</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Sistem:</span>
                  <span className="text-slate-700 font-medium">GudangKita v1.2</span>
                </div>
              </div>

              {/* Reset Data Button */}
              <button
                type="button"
                onClick={handleResetAllData}
                className="w-full mt-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Kosongkan Semua Data
              </button>

              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="w-full mt-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors focus:outline-none"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Reset All Data Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95 duration-200 text-slate-800 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100/50 mb-3.5 animate-bounce">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mb-2">
                Kosongkan Semua Data?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-sans">
                Apakah Anda yakin ingin mengosongkan semua data? Tindakan ini bersifat permanen dan akan melakukan hal berikut:
              </p>
              
              <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-left font-sans text-xs text-slate-600 space-y-2.5 mb-6">
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Mengatur semua stok barang menjadi <strong>0 Pcs</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Menghapus semua riwayat transaksi masuk &amp; keluar (Summary).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Menghapus semua data dan riwayat Pre Order.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Menghapus semua sistem notifikasi.</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full font-sans">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors focus:outline-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeResetAllData}
                  className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors focus:outline-none shadow-md shadow-rose-500/10"
                >
                  Ya, Kosongkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Reset Success Modal */}
      {isResetSuccessOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-xl animate-in zoom-in-95 duration-200 text-slate-800 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100/50 mb-3.5">
                <X className="w-6 h-6 rotate-45" /> {/* Custom beautifully rotated plus or we can just import other icons if needed, but X rotated is a nice cross/check alternative or we can just use the Check icon since it is in our types/other files, but actually we have custom check rendering or we can just use a success indicator */}
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mb-1.5">
                Data Berhasil Dikosongkan
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-sans">
                Stok semua barang kini diatur ke 0, dan riwayat serta pre-order telah dibersihkan sepenuhnya untuk penggunaan baru Anda!
              </p>
              
              <button
                type="button"
                onClick={() => setIsResetSuccessOpen(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors focus:outline-none shadow-md shadow-blue-500/10"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Mutation Confirmation Modal */}
      {mutationToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95 duration-200 text-slate-800 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100/50 mb-3.5">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mb-2">
                Batalkan Transaksi?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-sans">
                Apakah Anda yakin ingin menghapus aktivitas mutasi ini? Tindakan ini akan mengembalikan stok fisik secara otomatis.
              </p>
              
              <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left font-sans text-xs text-slate-600 space-y-2 mb-6">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Nama Barang:</span>
                  <span className="font-semibold text-slate-850 text-right max-w-[160px] truncate">{mutationToDelete.itemName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Tipe Mutasi:</span>
                  <span className={`font-bold uppercase ${mutationToDelete.type === 'masuk' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {mutationToDelete.type === 'masuk' ? 'Masuk' : 'Keluar'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jumlah:</span>
                  <span className="font-bold text-slate-900">{mutationToDelete.quantity} Pcs</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full font-sans">
                <button
                  type="button"
                  onClick={() => setMutationToDelete(null)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors focus:outline-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteMutation(mutationToDelete.id)}
                  className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors focus:outline-none shadow-md shadow-rose-500/10"
                >
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
