import React, { useState, useEffect } from 'react';
import { Plus, Award } from 'lucide-react';
import BrandStats from './components/BrandStats';
import BrandList from './components/BrandList';
import BrandForm from './components/BrandForm';
import Toast from '../../components/common/Toast/Toast';
import { getBrandsApi, createBrandApi, updateBrandApi, toggleBrandStatusApi, deleteBrandApi } from '../../api/brands.api';
import { getCategoriesApi } from '../../api/categories.api';
import { getSubCategoriesApi } from '../../api/subcategory.api';
import './Brands.css';

const BrandsPage = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const fetchBrands = async (params = {}) => {
        setLoading(true);
        try {
            const response = await getBrandsApi(params);
            if (response.data.success) {
                setBrands(response.data.data.records || []);
                setStats(response.data.data.stats || null);
                setPagination(response.data.data.pagination || null);
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to fetch brands', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoriesForDropdown = async () => {
        try {
            const response = await getCategoriesApi({ limit: 100 });
            if (response.data.success) {
                setCategories(response.data.data.records || []);
            }
        } catch (error) {
            console.error('Failed to load categories for dropdown', error);
        }
    };

    const fetchSubCategoriesForDropdown = async () => {
        try {
            const response = await getSubCategoriesApi({ limit: 200 });
            if (response.data.success) {
                setSubCategories(response.data.data.records || []);
            }
        } catch (error) {
            console.error('Failed to load sub-categories for dropdown', error);
        }
    };

    useEffect(() => {
        fetchBrands();
        fetchCategoriesForDropdown();
        fetchSubCategoriesForDropdown();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const handleToggleStatus = async (item) => {
        try {
            const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
            const response = await toggleBrandStatusApi(item.id, nextStatus);
            if (response.data.success) {
                showToast(response.data.message, 'success');
                fetchBrands();
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to toggle status', 'error');
        }
    };

    const handleDelete = async (item) => {
        if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
            try {
                const response = await deleteBrandApi(item.id);
                if (response.data.success) {
                    showToast(response.data.message, 'success');
                    fetchBrands();
                }
            } catch (error) {
                showToast(error.response?.data?.message || 'Failed to delete brand', 'error');
            }
        }
    };

    const handleSave = async (data) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('categoryId', data.categoryId);
            formData.append('subCategoryId', data.subCategoryId || '');
            formData.append('description', data.description || '');
            formData.append('status', data.status);
            if (data.imageFile) {
                formData.append('image', data.imageFile);
            }

            let response;
            if (editingItem) {
                response = await updateBrandApi(editingItem.id, formData);
            } else {
                response = await createBrandApi(formData);
            }

            if (response.data.success) {
                showToast(response.data.message, 'success');
                setShowForm(false);
                setEditingItem(null);
                fetchBrands();
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save brand', 'error');
            throw error;
        }
    };

    return (
        <div className="vendor-brands-container">
            <div className="vendor-brands-header">
                <div>
                    <h1 className="vendor-brand-title">
                        <Award size={28} color="var(--primary-color)" />
                        Brand Management
                    </h1>
                    <p className="vendor-brand-subtitle">
                        Manage product brands and their associated categories/sub-categories
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { setEditingItem(null); setShowForm(true); }}
                >
                    <Plus size={18} /> Add New Brand
                </button>
            </div>

            <BrandStats statsData={stats} />

            <div className="vendor-brand-table-wrapper">
                <BrandList
                    brands={brands}
                    categories={categories}
                    subCategories={subCategories}
                    pagination={pagination}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onRefresh={fetchBrands}
                    showToast={showToast}
                />
            </div>

            {showForm && (
                <BrandForm
                    initialData={editingItem}
                    categories={categories}
                    subCategories={subCategories}
                    onCancel={() => { setShowForm(false); setEditingItem(null); }}
                    onSave={handleSave}
                />
            )}

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default BrandsPage;
