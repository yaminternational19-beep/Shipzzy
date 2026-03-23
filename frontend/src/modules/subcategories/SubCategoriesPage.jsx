import React, { useState, useEffect } from 'react';
import { Plus, ListTree } from 'lucide-react';
import SubCategoryStats from './components/SubCategoryStats';
import SubCategoryList from './components/SubCategoryList';
import SubCategoryForm from './components/SubCategoryForm';
import Toast from '../../components/common/Toast/Toast';
import { getSubCategoriesApi, createSubCategoryApi, updateSubCategoryApi, deleteSubCategoryApi, toggleSubCategoryStatusApi } from '../../api/subcategory.api';
import { getCategoriesApi } from '../../api/categories.api';
import './SubCategories.css';

const SubCategoriesPage = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [subCategories, setSubCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const fetchSubCategories = async (params = {}) => {
        setLoading(true);
        try {
            const response = await getSubCategoriesApi(params);
            if (response.data.success) {
                setSubCategories(response.data.data.records || []);
                setStats(response.data.data.stats || null);
                setPagination(response.data.data.pagination || null);
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to fetch sub-categories', 'error');
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
            console.error("Failed to load categories for select dropdown", error);
        }
    }

    useEffect(() => {
        fetchSubCategories();
        fetchCategoriesForDropdown();
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
            const response = await toggleSubCategoryStatusApi(item.id, nextStatus);
            if (response.data.success) {
                showToast(response.data.message, 'success');
                fetchSubCategories();
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to toggle status', 'error');
        }
    };

    const handleDelete = async (item) => {
        if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
            try {
                const response = await deleteSubCategoryApi(item.id);
                if (response.data.success) {
                    showToast(response.data.message, 'success');
                    fetchSubCategories();
                }
            } catch (error) {
                showToast(error.response?.data?.message || 'Failed to delete sub-category', 'error');
            }
        }
    };

    const handleSave = async (data) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('categoryId', data.categoryId);
            formData.append('description', data.description || '');
            formData.append('status', data.status);

            if (data.imageFile) {
                formData.append('image', data.imageFile);
            }

            let response;
            if (editingItem) {
                response = await updateSubCategoryApi(editingItem.id, formData);
            } else {
                response = await createSubCategoryApi(formData);
            }

            if (response.data.success) {
                showToast(response.data.message, 'success');
                setShowForm(false);
                setEditingItem(null);
                fetchSubCategories();
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save sub-category', 'error');
            throw error;
        }
    };

    return (
        <div className="vendor-subcategories-container">
            <div className="vendor-subcategories-header">
                <div>
                    <h1 className="vendor-sc-title">
                        <ListTree size={28} color="var(--primary-color)" />
                        Sub Category Management
                    </h1>
                    <p className="vendor-sc-subtitle">
                        Manage product sub-categories and their parent categories
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { setEditingItem(null); setShowForm(true); }}
                >
                    <Plus size={18} /> Add New Sub Category
                </button>
            </div>

            <SubCategoryStats statsData={stats} />

            <div className="vendor-sc-table-wrapper">
                <SubCategoryList
                    subcategories={subCategories}
                    parentCategories={categories}
                    pagination={pagination}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onRefresh={fetchSubCategories}
                    showToast={showToast}
                />
            </div>

            {showForm && (
                <SubCategoryForm
                    initialData={editingItem}
                    categories={categories}
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

export default SubCategoriesPage;
