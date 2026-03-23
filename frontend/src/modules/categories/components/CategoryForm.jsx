import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

const CategoryForm = ({ initialData, onCancel, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'Active'
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                status: initialData.status || 'Active'
            });
            if (initialData.icon) {
                setImagePreview(initialData.icon);
            }
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave({ ...formData, image: imageFile });
        } catch (error) {
            console.error('Error saving category:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="vendor-cat-modal-overlay">
            <div className="vendor-cat-modal-card">
                {/* Header */}
                <div className="vendor-cat-modal-header">
                    <h3>{initialData ? 'Edit Category' : 'Add New Category'}</h3>
                    <button className="icon-btn-sm" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="vendor-cat-modal-body">

                        {/* Category Name */}
                        <div className="vendor-cat-form-group">
                            <label className="vendor-cat-label">Category Name</label>
                            <input
                                type="text"
                                className="vendor-cat-input"
                                placeholder="e.g. Spices & Herbs"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="vendor-cat-form-group">
                            <label className="vendor-cat-label">Description</label>
                            <textarea
                                className="vendor-cat-input"
                                rows="3"
                                placeholder="Short description of the category..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Category Icon / Image Upload */}
                        <div className="vendor-cat-form-group">
                            <label className="vendor-cat-label">Category Icon / Image</label>
                            <div className="vendor-cat-upload-zone">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="vendor-cat-upload-preview"
                                    />
                                ) : (
                                    <div className="vendor-cat-upload-icon-wrapper">
                                        <Upload size={22} color="var(--primary-color)" />
                                    </div>
                                )}
                                <span className="vendor-cat-upload-text">
                                    {imagePreview ? 'Click to change image' : 'Click to upload image'}
                                </span>
                                <span className="vendor-cat-upload-hint">SVG, PNG, JPG (max 2MB)</span>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="vendor-cat-form-group">
                            <label className="vendor-cat-label">Status</label>
                            <div className="vendor-cat-status-group">
                                <label className="vendor-cat-status-option">
                                    <input
                                        type="radio"
                                        name="catStatus"
                                        value="Active"
                                        checked={formData.status === 'Active'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    />
                                    Active
                                </label>
                                <label className="vendor-cat-status-option">
                                    <input
                                        type="radio"
                                        name="catStatus"
                                        value="Inactive"
                                        checked={formData.status === 'Inactive'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    />
                                    Inactive
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="vendor-cat-modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Category')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryForm;
