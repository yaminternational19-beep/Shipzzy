import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { LoginPage } from '../modules/login';
import { DashboardPage } from '../modules/dashboard';
import SubAdminManagement from '../modules/subadmin/SubAdminsPage';
import { VendorManagement } from '../modules/vendors';
import { CustomerManagement } from '../modules/customers';
import VendorOwnerDashboard from '../modules/dashboard/dashboards/VendorOwnerDashboard';
import CategoriesPage from '../modules/categories/CategoriesPage';
import ProductsPage from '../modules/products/ProductsPage';
import OrdersPage from '../modules/orders/OrdersPage';
import RidersPage from '../modules/riders/RidersPage';
import VehicleTypesPage from '../modules/vehicles/VehicleTypesPage';
import { SubCategoriesPage } from '../modules/subcategories';
import BrandsPage from '../modules/brands/BrandsPage';
import QuantityPage from '../modules/quantity';
import ProfilePage from '../pages/profilepage';
import NotificationsPage from '../pages/NotificationsPage';
import { TicketsPage } from '../modules/tickets';
import { RefundsPage } from '../modules/refunds';
import { SettingsPage } from '../modules/settings';

//vendor routes
import VendorProductPage from '../modules/vendor_products/VendorProductsPage';
import VendorOrdersPage from '../modules/vendor_orders/VendorOrdersPage';
import { VendorSettingsPage } from '../modules/vendor_settings';

// Simple ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles = ["ALL"] }) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole') || 'SUPER_ADMIN';

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes("ALL") && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />;
    }

    return <Layout>{children}</Layout>;
};

const GlobalRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes - Wrapped in Layout */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />

            {/* <Route path="/users" element={<Navigate to="/subadmin" replace />} /> */}
            <Route
                path="/subadmin"
                element={
                    <ProtectedRoute allowedRoles={["ALL", "SUPER_ADMIN", "ADMIN", "SUB_ADMIN"]}>
                        <SubAdminManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/vendors"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                        <VendorManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/categories"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                        <CategoriesPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/sub-categories"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                        <SubCategoriesPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/brands"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                        <BrandsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/products"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "VENDOR", "VENDOR_MANAGER"]}>
                        <ProductsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/orders"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "VENDOR", "VENDOR_MANAGER"]}>
                        <OrdersPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/vendors/:id"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                        <VendorOwnerDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/riders"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                        <RidersPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/vehicles"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                        <VehicleTypesPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/quantity"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                        <QuantityPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/customers"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"]}>
                        <CustomerManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/tickets"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"]}>
                        <TicketsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/refunds"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"]}>
                        <RefundsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings/manage-content"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"]}>
                        <SettingsPage activeTab="manage-content" />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings/announcements"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"]}>
                        <SettingsPage activeTab="announcements" />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings/help-support"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"]}>
                        <SettingsPage activeTab="help-support" />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings/faq"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"]}>
                        <SettingsPage activeTab="faq" />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings"
                element={<Navigate to="/settings/manage-content" replace />}
            />

            <Route
                path="/vendor-products"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "VENDOR_OWNER"]}>
                        <VendorProductPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/vendor-orders"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "VENDOR_OWNER"]}>
                        <VendorOrdersPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "VENDOR_OWNER"]}>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />
             <Route
                path="/notifications"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "VENDOR_OWNER"]}>
                        <NotificationsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/vendor/help-support/raise-query"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "VENDOR_OWNER"]}>
                        <VendorSettingsPage activeTab="raise-query" />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/vendor/help-support/history"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "VENDOR_OWNER"]}>
                        <VendorSettingsPage activeTab="history" />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/vendor/help-support/faq"
                element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "VENDOR_OWNER"]}>
                        <VendorSettingsPage activeTab="faq" />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/vendor/help-support"
                element={<Navigate to="/vendor/help-support/raise-query" replace />}
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default GlobalRoutes;
