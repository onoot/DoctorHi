// src/components/layout/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  Fab,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import TransactionsSection from '../../sections/TransactionsSection';
import UnitsSection from '../../sections/UnitsSection'; 
import UsersSection from '../../sections/UsersSection';
import UsersArchiveSection from '../../sections/UsersArchiveSection';
import TransactionModal from '../../modals/TransactionModal';
import CreateTransactionModal from '../../modals/CreateTransactionModal';
import AddUserModal from '../../modals/AddUserModal';
import UserModal from '../../modals/UserModal';
import { UserModalProvider } from '../../context/UserModalContext';
import UploadFileModal from '../../modals/UploadFileModal';
import AddPaymentModal from '../../modals/AddPaymentModal';
import UnitModal from '../../modals/UnitModal';
import { UnitProvider } from '../../context/UnitContext';

// Styled components
const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default
}));

const ContentWrapper = styled(Box)(({ theme, sidebarOpen }) => ({
  flexGrow: 1,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: sidebarOpen ? 0 : -280,
  width: sidebarOpen ? `calc(100% - 280px)` : '100%',
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    width: '100%'
  }
}));

const ContentArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2)
  }
}));

const MobileMenuButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  left: theme.spacing(3),
  zIndex: 1200,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  boxShadow: theme.shadows[4],
  [theme.breakpoints.up('md')]: {
    display: 'none'
  }
}));

const MobileDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    boxSizing: 'border-box',
  }
}));

const Overlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: alpha(theme.palette.common.black, 0.5),
  zIndex: 1100,
  [theme.breakpoints.up('md')]: {
    display: 'none'
  }
}));

const AdminLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeSection, setActiveSection] = useState('transactions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Состояния для модальных окон
  const [viewTransactionId, setViewTransactionId] = useState(null);
  const [viewTransactionData, setViewTransactionData] = useState(null);
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [viewUserId, setViewUserId] = useState(null);
  const [uploadModal, setUploadModal] = useState({ isOpen: false, transactionId: null, category: '' });
  const [addPaymentModal, setAddPaymentModal] = useState({ isOpen: false, transactionId: null });

  // Синхронизация URL → состояние
  useEffect(() => {
    const hash = location.hash.replace('#', '') || 'transactions';
    if (['transactions', 'units', 'users', 'users-archive'].includes(hash)) {
      setActiveSection(hash);
    }
  }, [location.hash]);

  // Синхронизация сайдбара с размером экрана
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  // Обработчик выбора секции (из Sidebar)
  const handleSectionSelect = (section) => {
    setActiveSection(section);
    navigate(`#${section}`);
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  // Обработчики для мобильного меню
  const handleMobileMenuToggle = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileSidebarOpen(false);
  };

  // Функции открытия модалок
  const openCreateTransactionModal = () => setIsCreateTransactionOpen(true);
  const openAddUserModal = () => setIsAddUserOpen(true);
  const openUserModal = (id) => setViewUserId(id);
  const openTransactionModal = (payload) => {
    if (!payload) {
      setViewTransactionId(null);
      setViewTransactionData(null);
      return;
    }
    if (typeof payload === 'object') {
      setViewTransactionId(payload.id || null);
      setViewTransactionData(payload);
    } else {
      setViewTransactionId(payload);
      setViewTransactionData(null);
    }
  };
  const openUploadFileModal = (transactionId, category) => setUploadModal({ isOpen: true, transactionId, category });
  const openAddPaymentModal = (transactionId) => setAddPaymentModal({ isOpen: true, transactionId });

  // Units modal
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitMode, setUnitMode] = useState('add');
  // Reload keys to propagate refreshes
  const [unitsReloadKey, setUnitsReloadKey] = useState(0);
  const [transactionsReloadKey, setTransactionsReloadKey] = useState(0);
  const [usersReloadKey, setUsersReloadKey] = useState(0);

  const openAddUnitModal = () => {
    setEditingUnitId(null);
    setUnitMode('add');
    setIsUnitModalOpen(true);
    setSelectedUnit(null);
  };

  const openEditUnitModal = (unit) => {
    if (unit) {
      setEditingUnitId(unit.id || unit.id);
      setSelectedUnit(unit);
    }
    setUnitMode('edit');
    setIsUnitModalOpen(true);
  };

  const openViewUnitModal = (unit) => {
    if (unit) {
      setEditingUnitId(unit.id || unit.id);
      setSelectedUnit(unit);
    }
    setUnitMode('view');
    setIsUnitModalOpen(true);
  };

  return (
    <UserModalProvider>
      <MainContainer>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar 
            active={activeSection} 
            onSelect={handleSectionSelect} 
            isOpen={isSidebarOpen}
          />
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <MobileDrawer
            anchor="left"
            open={mobileSidebarOpen}
            onClose={handleMobileMenuClose}
          >
            <Sidebar 
              active={activeSection} 
              onSelect={handleSectionSelect} 
              isOpen={true}
              onClose={handleMobileMenuClose}
            />
          </MobileDrawer>
        )}

        {/* Mobile overlay */}
        {isMobile && mobileSidebarOpen && (
          <Overlay onClick={handleMobileMenuClose} />
        )}

        {/* Main Content */}
        <ContentWrapper sidebarOpen={!isMobile && isSidebarOpen}>
          <ContentArea>
            {activeSection === 'transactions' && (
              <TransactionsSection
                onOpenCreateTransaction={openCreateTransactionModal}
                onOpenViewTransaction={openTransactionModal}
                onOpenUploadFile={openUploadFileModal}
                onOpenAddPayment={openAddPaymentModal}
                reloadKey={transactionsReloadKey}
              />
            )}
            {activeSection === 'units' && (
              <UnitsSection 
                onOpenAddUnit={openAddUnitModal} 
                onEditUnit={openEditUnitModal} 
                onOpenViewUnit={openViewUnitModal} 
                reloadKey={unitsReloadKey} 
              /> 
            )}
            {activeSection === 'users' && (
              <UsersSection
                onOpenAddUser={openAddUserModal}
                onOpenViewUser={openUserModal}
                reloadKey={usersReloadKey}
              />
            )}
            {activeSection === 'users-archive' && (
              <UsersArchiveSection
                onOpenViewUser={openUserModal}
                onOpenAddUser={openAddUserModal}
                reloadKey={usersReloadKey}
              />
            )}
          </ContentArea>
        </ContentWrapper>

        {/* Mobile menu button */}
        {isMobile && !mobileSidebarOpen && (
          <MobileMenuButton
            size="medium"
            onClick={handleMobileMenuToggle}
            aria-label="Open menu"
          >
            <MenuIcon />
          </MobileMenuButton>
        )}

        {/* Модальные окна */}
        <TransactionModal
          isOpen={!!viewTransactionId}
          onClose={() => {
            setViewTransactionId(null);
            setViewTransactionData(null);
          }}
          transactionId={viewTransactionId}
          initialTransaction={viewTransactionData}
          onOpenUploadFile={openUploadFileModal}
          onOpenAddPayment={openAddPaymentModal}
          onUpdated={() => setTransactionsReloadKey(k => k + 1)}
        />
        <CreateTransactionModal
          isOpen={isCreateTransactionOpen}
          onClose={() => setIsCreateTransactionOpen(false)}
          onCreated={() => {
            setIsCreateTransactionOpen(false);
            setTransactionsReloadKey(k => k + 1);
          }}
        />
        <AddUserModal
          isOpen={isAddUserOpen}
          onClose={() => setIsAddUserOpen(false)}
          onCreated={() => {
            setIsAddUserOpen(false);
            setUsersReloadKey(k => k + 1);
          }}
        />
        <UserModal
          isOpen={!!viewUserId}
          onClose={() => setViewUserId(null)}
          userId={viewUserId}
          onUpdated={() => setUsersReloadKey(k => k + 1)}
        />
        <UploadFileModal
          isOpen={uploadModal.isOpen}
          onClose={() => setUploadModal({ isOpen: false, transactionId: null, category: '' })}
          transactionId={uploadModal.transactionId}
          category={uploadModal.category}
        />
        <AddPaymentModal
          isOpen={addPaymentModal.isOpen}
          onClose={() => setAddPaymentModal({ isOpen: false, transactionId: null })}
          transactionId={addPaymentModal.transactionId}
          onAdded={() => {
            setAddPaymentModal({ isOpen: false });
            setTransactionsReloadKey(k => k + 1);
          }}
        />
        <UnitProvider value={{ selectedUnit, setSelectedUnit, mode: unitMode, setMode: setUnitMode }}>
          <UnitModal
            isOpen={isUnitModalOpen}
            onClose={() => setIsUnitModalOpen(false)}
            unitId={editingUnitId}
            mode={unitMode}
            onSaved={() => {
              setIsUnitModalOpen(false);
              setUnitsReloadKey(k => k + 1);
            }}
          />
        </UnitProvider>
      </MainContainer>
    </UserModalProvider>
  );
};

export default AdminLayout;