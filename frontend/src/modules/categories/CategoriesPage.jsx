import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CategoryStats from './components/CategoryStats';
import CategoryList from './components/CategoryList';
import CategoryForm from './components/CategoryForm';
import Toast from '../../components/common/Toast/Toast';
import { getCategoriesApi, createCategoryApi, updateCategoryApi, toggleCategoryStatusApi, deleteCategoryApi } from '../../api/categories.api';
import './Categories.css';

const CategoriesPage = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const fetchCategories = async (params = {}) => {
        setLoading(true);
        try {
            const response = await getCategoriesApi(params);
            if (response.data.success) {
                setCategories(response.data.data.records);
                setStats(response.data.data.stats);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to fetch categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    useState(() => {
        fetchCategories();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setShowForm(true);
    };

    const handleToggleStatus = async (category) => {
        try {
            const nextStatus = category.status === 'Active' ? 'Inactive' : 'Active';
            const response = await toggleCategoryStatusApi(category.id, nextStatus);
            if (response.data.success) {
                showToast(response.data.message, 'success');
                fetchCategories();
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to toggle status', 'error');
        }
    };

    const handleDeleteCategory = async (category) => {
        if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
            try {
                const response = await deleteCategoryApi(category.id);
                if (response.data.success) {
                    showToast(response.data.message, 'success');
                    fetchCategories();
                }
            } catch (error) {
                showToast(error.response?.data?.message || 'Failed to delete category', 'error');
            }
        }
    };

    const handleSaveCategory = async (data) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('description', data.description || '');
            formData.append('status', data.status);
            if (data.image) {
                formData.append('image', data.image);
            }

            let response;
            if (editingCategory) {
                response = await updateCategoryApi(editingCategory.id, formData);
            } else {
                response = await createCategoryApi(formData);
            }

            if (response.data.success) {
                showToast(response.data.message, 'success');
                setShowForm(false);
                setEditingCategory(null);
                fetchCategories();
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save category', 'error');
            throw error;
        }
    };

    return (
        <div className="vendor-categories-container">
            <div className="vendor-categories-header">
                <div>
                    <h1 className="vendor-category-title">Category Management</h1>
                    <p className="vendor-category-subtitle">
                        Organize products into hierarchical categories
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { setEditingCategory(null); setShowForm(true); }}
                >
                    <Plus size={18} /> Add New Category
                </button>
            </div>

            <CategoryStats statsData={stats} />

            <div className="vendor-category-table-wrapper">
                <CategoryList
                    categories={categories}
                    pagination={pagination}
                    loading={loading}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                    onToggleStatus={handleToggleStatus}
                    onRefresh={fetchCategories}
                    showToast={showToast}
                />
            </div>

            {showForm && (
                <CategoryForm
                    initialData={editingCategory}
                    onCancel={() => { setShowForm(false); setEditingCategory(null); }}
                    onSave={handleSaveCategory}
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

export default CategoriesPage;
