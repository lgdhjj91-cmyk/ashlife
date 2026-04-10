import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { LogOut, Plus, Edit2, Trash2 } from 'lucide-react';
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
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();

  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Stationery',
    image: '',
    images: ''
  });

  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin');
    }
  }, [navigate]);

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
      description: '',
      price: '',
      category: 'Stationery',
      image: '',
      images: ''
    });
    setIsEditing(false);
    setCurrentProductId(null);
  };

  const handleEditClick = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      images: product.images ? product.images.join(', ') : ''
    });
    setIsEditing(true);
    setCurrentProductId(product.id);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct(id);
      if (isEditing && currentProductId === id) {
        resetForm();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const priceNum = parseFloat(formData.price) || 0;
    const imagesArray = formData.images
      .split(',')
      .map(url => url.trim())
      .filter(url => url);

    const productPayload = {
      name: formData.name,
      description: formData.description,
      price: priceNum,
      category: formData.category,
      image: formData.image,
      images: imagesArray.length > 0 ? imagesArray : undefined
    };

    if (isEditing) {
      updateProduct(currentProductId, productPayload);
    } else {
      addProduct(productPayload);
    }

    resetForm();
  };

  return (
    <div className="page container animate-fade-in admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
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
                    <td>{product.name}</td>
                    <td>RM {product.price.toFixed(2)}</td>
                    <td>{product.category}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => handleEditClick(product)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(product.id)}>
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
              <label>Product Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleInputChange} />
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
              <label>Description</label>
              <textarea required name="description" value={formData.description} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Main Image URL</label>
              <input required type="url" name="image" value={formData.image} onChange={handleInputChange} />
              <span className="form-hint">e.g., https://placehold.co/400x400/ffe4e1/ff69b4</span>
            </div>

            <div className="form-group">
              <label>Additional Images URLs</label>
              <textarea name="images" value={formData.images} onChange={handleInputChange} placeholder="Comma-separated image URLs" />
              <span className="form-hint">For the image gallery. Separate with commas.</span>
            </div>

            <div className="admin-actions mt-4">
              <button type="submit" className="btn btn-primary w-full">
                {isEditing ? 'Save Changes' : <><Plus size={18} /> Add Product</>}
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
