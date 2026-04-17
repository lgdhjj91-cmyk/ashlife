import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { LogOut, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import './Admin.css';

const categories = [
  'Stationery',
  'DIY Crafts',
  'Cute Accessories',
  'Home Gadgets',
  'Cleaning Tools',
  'Lifestyle Items',
  'Festival Items'
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct, dbConnected } = useProducts();

  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  const [formData, setFormData] = useState({
    name: '',
    name_zh: '',
    description: '',
    description_zh: '',
    price: '',
    category: 'Stationery',
    category_zh: '',
    image: '',
    images: ''
  });

  // Category ZH mapping
  const categoryZhMap = {
    'Stationery': '文具',
    'DIY Crafts': 'DIY 手工',
    'Cute Accessories': '可爱配件',
    'Home Gadgets': '家居小物',
    'Cleaning Tools': '清洁工具',
    'Lifestyle Items': '生活用品',
    'Festival Items': '节日礼品'
  };

  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin');
    }
  }, [navigate]);

  // Auto-clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    navigate('/admin');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_zh: '',
      description: '',
      description_zh: '',
      price: '',
      category: 'Stationery',
      category_zh: '',
      image: '',
      images: ''
    });
    setIsEditing(false);
    setCurrentProductId(null);
  };

  const handleEditClick = (product) => {
    setFormData({
      name: product.name || '',
      name_zh: product.name_zh || '',
      description: product.description || '',
      description_zh: product.description_zh || '',
      price: product.price || '',
      category: product.category || 'Stationery',
      category_zh: product.category_zh || '',
      image: product.image || '',
      images: product.images ? product.images.join(', ') : ''
    });
    setIsEditing(true);
    setCurrentProductId(product.id);
    // Scroll to form
    document.querySelector('.admin-form-panel')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setSaving(true);
      const result = await deleteProduct(id);
      setSaving(false);

      if (result.success) {
        showToast('success', 'Product deleted successfully!');
        if (isEditing && currentProductId === id) {
          resetForm();
        }
      } else {
        showToast('error', `Failed to delete: ${result.error}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const priceNum = parseFloat(formData.price) || 0;
    const imagesArray = formData.images
      .split(',')
      .map(url => url.trim())
      .filter(url => url);

    const productPayload = {
      name: formData.name,
      name_zh: formData.name_zh || '',
      description: formData.description,
      description_zh: formData.description_zh || '',
      price: priceNum,
      category: formData.category,
      category_zh: formData.category_zh || categoryZhMap[formData.category] || '',
      image: formData.image,
      images: imagesArray.length > 0 ? imagesArray : [formData.image]
    };

    let result;
    if (isEditing) {
      result = await updateProduct(currentProductId, productPayload);
    } else {
      result = await addProduct(productPayload);
    }

    setSaving(false);

    if (result.success) {
      showToast('success', isEditing ? 'Product updated successfully!' : 'Product added successfully!');
      resetForm();
    } else {
      showToast('error', `Failed to save: ${result.error}`);
    }
  };

  return (
    <div className="page container animate-fade-in admin-dashboard">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Admin Dashboard</h1>
          <span className={`db-status ${dbConnected ? 'connected' : 'disconnected'}`}>
            {dbConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            {dbConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
        <button className="btn btn-outline" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="admin-layout">
        <div className="admin-panel admin-list-panel">
          <h3>Manage Products ({products.length})</h3>
          <div className="table-responsive">
            <table className="product-list-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>
                      <img src={product.image} alt={product.name} />
                    </td>
                    <td>
                      <div>{product.name}</div>
                      {product.name_zh && <div className="text-secondary">{product.name_zh}</div>}
                    </td>
                    <td>RM {product.price.toFixed(2)}</td>
                    <td>{product.category}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => handleEditClick(product)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(product.id)} disabled={saving}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4">No products found. Add one!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel admin-form-panel">
          <h3>{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Product Name (EN)</label>
              <input required type="text" name="name" value={formData.name} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Product Name (中文)</label>
              <input type="text" name="name_zh" value={formData.name_zh} onChange={handleInputChange} placeholder="可选" />
            </div>

            <div className="form-group">
              <label>Price (RM)</label>
              <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Description (EN)</label>
              <textarea required name="description" value={formData.description} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Description (中文)</label>
              <textarea name="description_zh" value={formData.description_zh} onChange={handleInputChange} placeholder="可选" />
            </div>

            <div className="form-group">
              <label>Main Image URL</label>
              <input required type="url" name="image" value={formData.image} onChange={handleInputChange} />
              <span className="form-hint">e.g., https://placehold.co/400x400/ffe4e1/ff69b4</span>
              {/* Image Preview */}
              {formData.image && (
                <div className="image-preview">
                  <img
                    src={formData.image}
                    alt="Preview"
                    onError={(e) => { e.target.style.display = 'none'; }}
                    onLoad={(e) => { e.target.style.display = 'block'; }}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Additional Images URLs</label>
              <textarea name="images" value={formData.images} onChange={handleInputChange} placeholder="Comma-separated image URLs" />
              <span className="form-hint">For the image gallery. Separate with commas.</span>
            </div>

            <div className="admin-actions mt-4">
              <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Save Changes' : <><Plus size={18} /> Add Product</>}
              </button>
              {isEditing && (
                <button type="button" className="btn btn-outline w-full" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
