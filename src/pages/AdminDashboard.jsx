import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useOrders } from '../context/OrderContext';
import { useSiteContent } from '../context/SiteContentContext';
import { resolveAssetUrl } from '../utils/assets';
import { getProductPriceRange, normalizeVariants } from '../utils/productVariants';
import {
  LogOut,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Package,
  Settings,
  ShoppingBag,
  Upload,
  Eye,
  X,
  Clock,
  Truck,
  Store,
  Sparkles,
} from 'lucide-react';
import './Admin.css';

const STATUS_OPTIONS = ['pending_verification', 'confirmed', 'rejected', 'completed'];

const STATUS_META = {
  pending_verification: { label: 'Pending', emoji: '🟡', cls: 'status-pending' },
  confirmed: { label: 'Confirmed', emoji: '🟢', cls: 'status-confirmed' },
  rejected: { label: 'Rejected', emoji: '🔴', cls: 'status-rejected' },
  completed: { label: 'Completed', emoji: '✅', cls: 'status-completed' },
};

const createEmptyVariant = () => ({
  id: '',
  name: '',
  name_zh: '',
  image: '',
  images: '',
});

const createEmptyCategory = () => ({
  id: `category-${Date.now()}`,
  en: '',
  zh: '',
  description_en: '',
  description_zh: '',
  showInRange: false,
  icon: 'sparkles',
});

const createEmptyMedia = (type = 'image') => ({
  type,
  src: '',
  poster: '',
  alt: '',
});

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function MediaListEditor({ title, description, items, onChange, allowVideo = false }) {
  const updateItem = (index, field, value) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const handleFile = async (index, field, file) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    updateItem(index, field, dataUrl);
  };

  return (
    <div className="admin-content-block">
      <div className="admin-content-heading">
        <div>
          <h4>{title}</h4>
          {description && <p>{description}</p>}
        </div>
        <button type="button" className="btn btn-secondary btn-icon" onClick={() => onChange([...items, createEmptyMedia()])}>
          <Plus size={16} /> Add Image
        </button>
      </div>

      {items.length === 0 && <div className="variant-empty-state">No custom media set. Existing site media will be used.</div>}

      <div className="content-media-list">
        {items.map((item, index) => (
          <div className="content-media-row" key={`${title}-${index}`}>
            <div className="content-media-preview">
              {item.src ? (
                item.type === 'video' ? (
                  <video src={item.src} poster={item.poster} controls muted />
                ) : (
                  <img src={item.src} alt={item.alt || title} />
                )
              ) : (
                <span>No media</span>
              )}
            </div>

            <div className="content-media-fields">
              {allowVideo && (
                <div className="form-group">
                  <label>Type</label>
                  <select value={item.type || 'image'} onChange={(e) => updateItem(index, 'type', e.target.value)}>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>{item.type === 'video' ? 'Video URL or uploaded file' : 'Image URL or uploaded file'}</label>
                <input value={item.src || ''} onChange={(e) => updateItem(index, 'src', e.target.value)} />
                <input
                  type="file"
                  accept={allowVideo ? 'image/*,video/*' : 'image/*'}
                  onChange={(e) => handleFile(index, 'src', e.target.files?.[0])}
                />
              </div>
              {item.type === 'video' && (
                <div className="form-group">
                  <label>Video Poster Image URL or uploaded file</label>
                  <input value={item.poster || ''} onChange={(e) => updateItem(index, 'poster', e.target.value)} />
                  <input type="file" accept="image/*" onChange={(e) => handleFile(index, 'poster', e.target.files?.[0])} />
                </div>
              )}
              <div className="form-group">
                <label>Alt Text</label>
                <input value={item.alt || ''} onChange={(e) => updateItem(index, 'alt', e.target.value)} />
              </div>
            </div>

            <button
              type="button"
              className="action-btn delete"
              aria-label="Remove media"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const DIY_ADMIN_PRODUCTS = [
  { id: 'badge', tab: { en: 'Custom Badge' } },
  { id: 'keychain', tab: { en: 'Rectangle Keychain' } },
  { id: 'ornament', tab: { en: 'Shaking Ornament' } },
  { id: 'frame', tab: { en: 'AI Cartoon Portrait' } },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct, dbConnected } = useProducts();
  const { orders, loadingOrders, paymentSettings, updateOrderStatus, uploadQRCode, updatePaymentSettings } =
    useOrders();
  const { siteContent, updateSiteContent } = useSiteContent();

  // ---- Tab State ----
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders' | 'content' | 'settings'

  // ---- Shared ----
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // ---- Product State ----
  const [isEditing, setIsEditing] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_zh: '',
    description: '',
    description_zh: '',
    price: '',
    stock: '',
    variantPricing: 'shared',
    discountType: 'none',
    discountValue: '',
    category: 'Stationery',
    category_zh: '',
    image: '',
    images: '',
    variants: [],
  });

  // ---- Order State ----
  const [orderFilter, setOrderFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [screenshotModal, setScreenshotModal] = useState(null);

  // ---- Payment Settings State ----
  const [settingsForm, setSettingsForm] = useState({
    delivery_fee: '',
    delivery_note_en: '',
    delivery_note_zh: '',
  });
  const [maeFile, setMaeFile] = useState(null);
  const [tngFile, setTngFile] = useState(null);
  const [maePreview, setMaePreview] = useState('');
  const [tngPreview, setTngPreview] = useState('');
  const maeInputRef = useRef();
  const tngInputRef = useRef();
  const [contentForm, setContentForm] = useState(siteContent);
  const categoryOptions = contentForm.categories?.length ? contentForm.categories : siteContent.categories || [];
  const dynamicCategoryZhMap = Object.fromEntries(categoryOptions.map((category) => [category.en, category.zh || '']));

  const categoryZhMap = {
    Stationery: '文具',
    'DIY Crafts': 'DIY 手工',
    'Cute Accessories': '可爱配件',
    'Home Gadgets': '家居小物',
    'Cleaning Tools': '清洁工具',
    'Lifestyle Items': '生活用品',
    'Festival Items': '节日礼品',
  };

  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync payment settings form with context
  useEffect(() => {
    setSettingsForm({
      delivery_fee: paymentSettings.delivery_fee?.toString() || '8',
      delivery_note_en: paymentSettings.delivery_note_en || '',
      delivery_note_zh: paymentSettings.delivery_note_zh || '',
    });
    setMaePreview(paymentSettings.mae_qr_url || '');
    setTngPreview(paymentSettings.tng_qr_url || '');
  }, [paymentSettings]);

  useEffect(() => {
    setContentForm(siteContent);
  }, [siteContent]);

  const showToast = (type, message) => setToast({ type, message });

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    navigate('/admin');
  };

  // ============================================
  // PRODUCT HANDLERS
  // ============================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_zh: '',
      description: '',
      description_zh: '',
      price: '',
      stock: '',
      variantPricing: 'shared',
      discountType: 'none',
      discountValue: '',
      category: 'Stationery',
      category_zh: '',
      image: '',
      images: '',
      variants: [],
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
      stock: product.stock ?? '',
      variantPricing: product.variantPricing || 'shared',
      discountType: product.discountType || 'none',
      discountValue: product.discountValue || '',
      category: product.category || 'Stationery',
      category_zh: product.category_zh || '',
      image: product.image || '',
      images: product.images ? product.images.join(', ') : '',
      variants: normalizeVariants(product).map((variant) => ({
        id: variant.id || '',
        name: variant.name || '',
        name_zh: variant.name_zh || '',
        price: variant.price ?? '',
        stock: variant.stock ?? '',
        image: variant.image || '',
        images: variant.images ? variant.images.join(', ') : '',
      })),
    });
    setIsEditing(true);
    setCurrentProductId(product.id);
    document.querySelector('.admin-form-panel')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, createEmptyVariant()],
    }));
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, variantIndex) => variantIndex !== index),
    }));
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setSaving(true);
      const result = await deleteProduct(id);
      setSaving(false);
      if (result.success) {
        showToast('success', 'Product deleted successfully!');
        if (isEditing && currentProductId === id) resetForm();
      } else {
        showToast('error', `Failed to delete: ${result.error}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const priceNum = parseFloat(formData.price) || 0;
    const discountValueNum = parseFloat(formData.discountValue) || 0;
    const imagesArray = formData.images
      .split(/[\n,;]+/)
      .map((url) => url.trim())
      .filter((url) => url);
    const variants = formData.variants
      .map((variant, index) => {
        const variantImages = variant.images
          .split(/[\n,;]+/)
          .map((url) => url.trim())
          .filter((url) => url);
        const image = variant.image.trim() || variantImages[0] || '';
        const name = variant.name.trim();
        const nameZh = variant.name_zh.trim();
        const idSource = variant.id || name || nameZh || `variant-${index + 1}`;
        const id = idSource
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `variant-${index + 1}`;

        return {
          id,
          name,
          name_zh: nameZh,
          price: formData.variantPricing === 'individual' ? Math.max(0, parseFloat(variant.price) || 0) : null,
          stock: Math.max(0, parseInt(variant.stock) || 0),
          image,
          images: variantImages.length > 0 ? variantImages : image ? [image] : [],
        };
      })
      .filter((variant) => variant.name || variant.name_zh || variant.image || variant.images.length);

    const productPayload = {
      name: formData.name,
      name_zh: formData.name_zh || '',
      description: formData.description,
      description_zh: formData.description_zh || '',
      price: priceNum,
      stock: variants.length > 0 ? null : Math.max(0, parseInt(formData.stock) || 0),
      variantPricing: formData.variantPricing,
      discountType: formData.discountType || 'none',
      discountValue: formData.discountType !== 'none' ? discountValueNum : 0,
      category: formData.category,
      category_zh: formData.category_zh || dynamicCategoryZhMap[formData.category] || categoryZhMap[formData.category] || '',
      image: formData.image,
      images: imagesArray.length > 0 ? imagesArray : [formData.image],
      variants,
    };

    const result = isEditing
      ? await updateProduct(currentProductId, productPayload)
      : await addProduct(productPayload);

    setSaving(false);
    if (result.success) {
      showToast('success', isEditing ? 'Product updated!' : 'Product added!');
      resetForm();
    } else {
      showToast('error', `Failed to save: ${result.error}`);
    }
  };

  // ============================================
  // ORDER HANDLERS
  // ============================================
  const pendingCount = orders.filter((o) => o.status === 'pending_verification').length;

  const filteredOrders =
    orderFilter === 'all' ? orders : orders.filter((o) => o.status === orderFilter);

  const handleStatusChange = async (orderId, newStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      showToast('success', `Order ${orderId} marked as ${newStatus}`);
    } else {
      showToast('error', `Failed: ${result.error}`);
    }
  };

  // ============================================
  // PAYMENT SETTINGS HANDLERS
  // ============================================
  const handleQRFileChange = (type, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'mae') {
      setMaeFile(file);
      setMaePreview(preview);
    } else {
      setTngFile(file);
      setTngPreview(preview);
    }
  };

  const handleUploadQR = async (type) => {
    const file = type === 'mae' ? maeFile : tngFile;
    if (!file) return showToast('error', 'Please select a file first.');
    setSaving(true);
    const result = await uploadQRCode(file, type);
    setSaving(false);
    if (result.success) {
      showToast('success', `${type.toUpperCase()} QR code uploaded!`);
      if (type === 'mae') setMaeFile(null);
      else setTngFile(null);
    } else {
      showToast('error', `Upload failed: ${result.error}`);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updatePaymentSettings({
      delivery_fee: parseFloat(settingsForm.delivery_fee) || 8,
      delivery_note_en: settingsForm.delivery_note_en,
      delivery_note_zh: settingsForm.delivery_note_zh,
    });
    setSaving(false);
    if (result.success) {
      showToast('success', 'Payment settings saved!');
    } else {
      showToast('error', `Failed: ${result.error}`);
    }
  };

  // ============================================
  // SITE CONTENT HANDLERS
  // ============================================
  const updateContentField = (field, value) => {
    setContentForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateCategory = (index, field, value) => {
    updateContentField(
      'categories',
      categoryOptions.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, [field]: value } : category
      )
    );
  };

  const addCategory = () => {
    updateContentField('categories', [...categoryOptions, createEmptyCategory()]);
  };

  const removeCategory = (index) => {
    updateContentField(
      'categories',
      categoryOptions.filter((_, categoryIndex) => categoryIndex !== index)
    );
  };

  const toggleFocusProduct = (productId) => {
    const selected = contentForm.homeFocusProductIds || [];
    updateContentField(
      'homeFocusProductIds',
      selected.includes(productId) ? selected.filter((id) => id !== productId) : [...selected, productId]
    );
  };

  const updateDiyMedia = (productId, items) => {
    setContentForm((prev) => ({
      ...prev,
      diyMedia: {
        ...(prev.diyMedia || {}),
        [productId]: items,
      },
    }));
  };

  const clearDiyMedia = (productId) => {
    setContentForm((prev) => {
      const nextMedia = { ...(prev.diyMedia || {}) };
      delete nextMedia[productId];
      return { ...prev, diyMedia: nextMedia };
    });
  };

  const handleSaveSiteContent = async () => {
    setSaving(true);
    const cleanedContent = {
      ...contentForm,
      categories: (contentForm.categories || [])
        .map((category) => ({
          ...category,
          id:
            category.id ||
            category.en
              ?.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') ||
            `category-${Date.now()}`,
          en: category.en?.trim() || '',
          zh: category.zh?.trim() || '',
        }))
        .filter((category) => category.en),
      creativeRootsImages: (contentForm.creativeRootsImages || []).filter((item) => item.src),
      archiveImages: (contentForm.archiveImages || []).filter((item) => item.src),
      diyMedia: Object.fromEntries(
        Object.entries(contentForm.diyMedia || {}).map(([productId, items]) => [
          productId,
          items.filter((item) => item.type === 'frame-visual' || item.src),
        ])
      ),
    };
    const result = await updateSiteContent(cleanedContent);
    setSaving(false);
    if (result.success) {
      showToast('success', 'Site content saved!');
    } else {
      showToast('error', `Failed: ${result.error}`);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="page container animate-fade-in admin-dashboard">
      {/* Toast */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Screenshot Lightbox */}
      {screenshotModal && (
        <div className="screenshot-modal" onClick={() => setScreenshotModal(null)}>
          <div className="screenshot-modal-inner" onClick={(e) => e.stopPropagation()}>
            <button className="screenshot-modal-close" onClick={() => setScreenshotModal(null)}>
              <X size={24} />
            </button>
            <img src={screenshotModal} alt="Payment Receipt" />
          </div>
        </div>
      )}

      {/* Header */}
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

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={18} /> Products
        </button>
        <button
          className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={18} />
          Orders
          {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
        </button>
        <button
          className={`admin-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          <Sparkles size={18} /> Site Content
        </button>
        <button
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} /> Payment Settings
        </button>
      </div>

      {/* ========== PRODUCTS TAB ========== */}
      {activeTab === 'products' && (
        <div className={`admin-layout ${isEditorExpanded ? 'editor-expanded' : ''}`}>
          <div className="admin-panel admin-list-panel">
            <h3>Manage Products ({products.length})</h3>
            <div className="table-responsive">
              <table className="product-list-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Variations</th>
                    <th>Discount</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img src={product.image} alt={product.name} />
                      </td>
                      <td>
                        <div>{product.name}</div>
                        {product.name_zh && (
                          <div className="text-secondary">{product.name_zh}</div>
                        )}
                      </td>
                      <td>{(() => {
                        const range = getProductPriceRange(product);
                        return range.min === range.max
                          ? `RM ${range.min.toFixed(2)}`
                          : `RM ${range.min.toFixed(2)} – ${range.max.toFixed(2)}`;
                      })()}</td>
                      <td>{(() => {
                        const variants = normalizeVariants(product);
                        if (variants.length > 0) {
                          const total = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
                          return <span className={total <= 0 ? 'stock-pill out' : total <= 10 ? 'stock-pill low' : 'stock-pill ok'}>{total} units</span>;
                        }
                        const stock = product.stock ?? 0;
                        return <span className={stock <= 0 ? 'stock-pill out' : stock <= 10 ? 'stock-pill low' : 'stock-pill ok'}>{stock} units</span>;
                      })()}</td>
                      <td>
                        {normalizeVariants(product).length > 0 ? (
                          <span className="variant-count-pill">
                            {normalizeVariants(product).length} option{normalizeVariants(product).length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-secondary">None</span>
                        )}
                      </td>
                      <td>
                        {product.discountType && product.discountType !== 'none' && product.discountValue ? (
                          <span className="discount-pill">
                            {product.discountType === 'percentage'
                              ? `${product.discountValue}% OFF`
                              : `RM ${parseFloat(product.discountValue).toFixed(2)} OFF`}
                          </span>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn edit" onClick={() => handleEditClick(product)}>
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteClick(product.id)}
                            disabled={saving}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        No products found. Add one!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-panel admin-form-panel">
            <div className="admin-form-panel-header">
              <div>
                <h3>{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
                <span className="form-hint">
                  {isEditing ? 'Update the selected item without losing any product details.' : 'Create a product with pricing, images, and variations.'}
                </span>
              </div>
              <button
                type="button"
                className="editor-focus-btn"
                onClick={() => setIsEditorExpanded((expanded) => !expanded)}
                aria-label={isEditorExpanded ? 'Show product list and editor' : 'Expand product editor'}
                title={isEditorExpanded ? 'Show product list' : 'Focus on editor'}
              >
                {/* {isEditorExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />} */}
                <span>{isEditorExpanded ? 'Show list' : 'Focus mode'}</span>
              </button>
            </div>
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
                <span className="form-hint">This is the shared price and fallback price for the product.</span>
              </div>

              {formData.variants.length === 0 && (
                <div className="form-group">
                  <label>Stock (units)</label>
                  <input type="number" min="0" step="1" name="stock" value={formData.stock} onChange={handleInputChange} placeholder="0" />
                  <span className="form-hint">Number of units available. Leave 0 if out of stock.</span>
                </div>
              )}

              <div className="form-group discount-section">
                <label>Discount</label>
                <div className="discount-type-row">
                  {['none', 'percentage', 'amount'].map((type) => (
                    <label key={type} className={`discount-radio ${formData.discountType === type ? 'active' : ''}`}>
                      <input type="radio" name="discountType" value={type} checked={formData.discountType === type} onChange={handleInputChange} />
                      {type === 'none' ? 'No Discount' : type === 'percentage' ? '% Off' : 'RM Off'}
                    </label>
                  ))}
                </div>
                {formData.discountType !== 'none' && (
                  <div className="discount-value-row">
                    <span className="discount-prefix">{formData.discountType === 'percentage' ? '%' : 'RM'}</span>
                    <input
                      type="number" step="0.01" min="0" name="discountValue"
                      value={formData.discountValue} onChange={handleInputChange}
                      placeholder={formData.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 5.00'}
                    />
                    {formData.price && formData.discountValue && (
                      <span className="discount-preview">
                        Final: RM{' '}
                        {formData.discountType === 'percentage'
                          ? Math.max(0, parseFloat(formData.price) - parseFloat(formData.price) * parseFloat(formData.discountValue) / 100).toFixed(2)
                          : Math.max(0, parseFloat(formData.price) - parseFloat(formData.discountValue)).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
                <span className="form-hint">Customers will see the original price crossed out with the discounted price shown.</span>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange}>
                  {categoryOptions.map((cat) => <option key={cat.en} value={cat.en}>{cat.en}</option>)}
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
                {formData.image && (
                  <div className="image-preview">
                    <img src={formData.image} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} onLoad={(e) => { e.target.style.display = 'block'; }} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Additional Images URLs (comma or newline separated)</label>
                <textarea name="images" value={formData.images} onChange={handleInputChange} placeholder="Enter each image URL on a new line or separated by commas" />
                <span className="form-hint">For the image gallery. Separate with commas or newlines (enter).</span>
              </div>

              <div className="form-group variants-section">
                <div className="variants-section-header">
                  <div>
                    <label>Product Variations</label>
                    <span className="form-hint">Variations can share the product price or each have their own price and images.</span>
                  </div>
                  <button type="button" className="btn btn-secondary btn-icon" onClick={handleAddVariant}>
                    <Plus size={16} /> Add Variation
                  </button>
                </div>

                {formData.variants.length > 0 && (
                  <div className="variant-pricing-mode">
                    <span>Variation pricing</span>
                    <div className="discount-type-row">
                      {[
                        ['shared', 'Same price for all'],
                        ['individual', 'Different price each'],
                      ].map(([value, label]) => (
                        <label key={value} className={`discount-radio ${formData.variantPricing === value ? 'active' : ''}`}>
                          <input type="radio" name="variantPricing" value={value} checked={formData.variantPricing === value} onChange={handleInputChange} />
                          {label}
                        </label>
                      ))}
                    </div>
                    <span className="form-hint">The discount above applies to every variation.</span>
                  </div>
                )}

                {formData.variants.length === 0 ? (
                  <div className="variant-empty-state">No variations added. Product will behave like a single-option item.</div>
                ) : (
                  <div className="variant-editor-list">
                    {formData.variants.map((variant, index) => (
                      <div className="variant-editor-card" key={index}>
                        <div className="variant-editor-header">
                          <strong>Variation {index + 1}</strong>
                          <button
                            type="button"
                            className="action-btn delete"
                            onClick={() => handleRemoveVariant(index)}
                            aria-label="Remove variation"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="variant-field-grid">
                          <div className="form-group">
                            <label>Name (EN)</label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                              placeholder="e.g. Pink, Blue, Type A"
                            />
                          </div>
                          <div className="form-group">
                            <label>Name (中文)</label>
                            <input
                              type="text"
                              value={variant.name_zh}
                              onChange={(e) => handleVariantChange(index, 'name_zh', e.target.value)}
                              placeholder="Optional"
                            />
                          </div>
                          {formData.variantPricing === 'individual' && (
                            <div className="form-group">
                              <label>Price (RM)</label>
                              <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                value={variant.price}
                                onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                placeholder="e.g. 12.90"
                              />
                            </div>
                          )}

                          <div className="form-group">
                            <label>Stock (units)</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={variant.stock}
                              onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Main Variation Image URL</label>
                          <input
                            type="url"
                            value={variant.image}
                            onChange={(e) => handleVariantChange(index, 'image', e.target.value)}
                            placeholder="Shown when this variation is selected"
                          />
                        </div>

                        <div className="form-group">
                          <label>Variation Gallery URLs (comma or newline separated)</label>
                          <textarea
                            value={variant.images}
                            onChange={(e) => handleVariantChange(index, 'images', e.target.value)}
                            placeholder="Enter each image URL on a new line or separated by commas"
                          />
                        </div>

                        {(variant.image || variant.images) && (
                          <div className="variant-preview-row">
                            {[variant.image, ...variant.images.split(/[\n,;]+/)]
                              .map((url) => url.trim())
                              .filter(Boolean)
                              .slice(0, 4)
                              .map((url, previewIndex) => (
                                <img key={`${url}-${previewIndex}`} src={url} alt={`Variation ${index + 1} preview`} />
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-actions mt-4">
                <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                  {saving ? 'Saving...' : isEditing ? 'Save Changes' : <><Plus size={18} /> Add Product</>}
                </button>
                {isEditing && (
                  <button type="button" className="btn btn-outline w-full" onClick={resetForm}>Cancel</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== ORDERS TAB ========== */}
      {activeTab === 'orders' && (
        <div className="orders-panel">
          {/* Filter Tabs */}
          <div className="order-filter-row">
            {['all', ...STATUS_OPTIONS].map((f) => (
              <button
                key={f}
                className={`order-filter-btn ${orderFilter === f ? 'active' : ''}`}
                onClick={() => setOrderFilter(f)}
              >
                {f === 'all' ? `All (${orders.length})` : `${STATUS_META[f]?.emoji} ${STATUS_META[f]?.label} (${orders.filter((o) => o.status === f).length})`}
              </button>
            ))}
          </div>

          {loadingOrders ? (
            <div className="text-center py-4">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="orders-empty">
              <ShoppingBag size={48} />
              <p>No orders yet.</p>
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map((order) => (
                <div key={order.orderId} className="order-card">
                  <div className="order-card-header" onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}>
                    <div className="order-card-left">
                      <span className="order-id-mono">{order.orderId}</span>
                      <span className={`order-status-pill ${STATUS_META[order.status]?.cls}`}>
                        {STATUS_META[order.status]?.emoji} {STATUS_META[order.status]?.label}
                      </span>
                    </div>
                    <div className="order-card-right">
                      <div className="order-meta">
                        <span>{order.customerName}</span>
                        <span className="order-meta-sep">·</span>
                        <span>{order.deliveryMethod === 'delivery' ? <Truck size={14} /> : <Store size={14} />}</span>
                        <span>{order.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                        <span className="order-meta-sep">·</span>
                        <strong>RM {order.total?.toFixed(2)}</strong>
                      </div>
                      <div className="order-date">
                        {new Date(order.createdAt).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>

                  {expandedOrder === order.orderId && (
                    <div className="order-card-body">
                      {/* Customer Info */}
                      <div className="order-detail-grid">
                        <div className="order-detail-block">
                          <p className="order-detail-label">Customer</p>
                          <p className="order-detail-value">{order.customerName}</p>
                          <p className="order-detail-value">{order.customerPhone}</p>
                        </div>
                        <div className="order-detail-block">
                          <p className="order-detail-label">Payment</p>
                          <p className="order-detail-value">{order.paymentMethod?.toUpperCase()}</p>
                        </div>
                        <div className="order-detail-block">
                          <p className="order-detail-label">Delivery</p>
                          <p className="order-detail-value">
                            {order.deliveryMethod === 'delivery' ? `Delivery — RM ${order.deliveryFee?.toFixed(2)}` : 'Store Pickup'}
                          </p>
                          {order.address && <p className="order-detail-value address-text">{order.address}</p>}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="order-items-list">
                        <p className="order-detail-label">Items</p>
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="order-item-row">
                            <img src={resolveAssetUrl(item.image)} alt={item.name} className="order-item-thumb" />
                            <span className="order-item-name">
                              {item.name}
                              {(item.variantName || item.variantName_zh) && (
                                <span className="order-item-variant">
                                  Variation: {item.variantName || item.variantName_zh}
                                </span>
                              )}
                            </span>
                            <span className="order-item-qty">x{item.quantity}</span>
                            <span className="order-item-price">RM {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="order-total-row">
                          <span>Subtotal</span>
                          <span>RM {order.subtotal?.toFixed(2)}</span>
                        </div>
                        {order.deliveryFee > 0 && (
                          <div className="order-total-row">
                            <span>Delivery</span>
                            <span>RM {order.deliveryFee?.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="order-total-row total">
                          <strong>Total</strong>
                          <strong>RM {order.total?.toFixed(2)}</strong>
                        </div>
                      </div>

                      {/* Payment Screenshot */}
                      {order.paymentScreenshot && (
                        <div className="order-screenshot-section">
                          <p className="order-detail-label">Payment Receipt</p>
                          <button
                            className="screenshot-preview-btn"
                            onClick={() => setScreenshotModal(order.paymentScreenshot)}
                          >
                            <Eye size={16} /> View Receipt Screenshot
                          </button>
                        </div>
                      )}

                      {/* Status Actions */}
                      <div className="order-actions">
                        <p className="order-detail-label">Update Status</p>
                        <div className="order-action-btns">
                          {STATUS_OPTIONS.filter((s) => s !== order.status).map((s) => (
                            <button
                              key={s}
                              className={`btn order-action-btn status-btn-${s}`}
                              onClick={() => handleStatusChange(order.orderId, s)}
                            >
                              {STATUS_META[s].emoji} Mark as {STATUS_META[s].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== SITE CONTENT TAB ========== */}
      {activeTab === 'content' && (
        <div className="settings-panel site-content-panel">
          <div className="admin-panel">
            <div className="admin-content-heading">
              <div>
                <h3>Site Content</h3>
                <p className="settings-desc">
                  Customize homepage products, galleries, product range categories and DIY media without editing code.
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={handleSaveSiteContent} disabled={saving}>
                {saving ? 'Saving...' : <><CheckCircle size={18} /> Save Site Content</>}
              </button>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-content-heading">
              <div>
                <h3>Product Categories</h3>
                <p className="settings-desc">
                  The English name is used for product filtering. Tick "Product Range" to show a category card on the shop page.
                </p>
              </div>
              <button type="button" className="btn btn-secondary btn-icon" onClick={addCategory}>
                <Plus size={16} /> Add Category
              </button>
            </div>

            <div className="category-editor-list">
              {categoryOptions.map((category, index) => (
                <div className="category-editor-row" key={category.id || index}>
                  <div className="variant-field-grid">
                    <div className="form-group">
                      <label>Name (EN)</label>
                      <input value={category.en || ''} onChange={(e) => updateCategory(index, 'en', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Name (中文)</label>
                      <input value={category.zh || ''} onChange={(e) => updateCategory(index, 'zh', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Description (EN)</label>
                      <input
                        value={category.description_en || ''}
                        onChange={(e) => updateCategory(index, 'description_en', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Description (中文)</label>
                      <input
                        value={category.description_zh || ''}
                        onChange={(e) => updateCategory(index, 'description_zh', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Icon</label>
                      <select value={category.icon || 'sparkles'} onChange={(e) => updateCategory(index, 'icon', e.target.value)}>
                        <option value="sparkles">Sparkles</option>
                        <option value="cable">Cable</option>
                        <option value="home">Home</option>
                        <option value="paintbrush">Paintbrush</option>
                      </select>
                    </div>
                    <label className="admin-checkbox-row">
                      <input
                        type="checkbox"
                        checked={Boolean(category.showInRange)}
                        onChange={(e) => updateCategory(index, 'showInRange', e.target.checked)}
                      />
                      Product Range
                    </label>
                  </div>
                  <button type="button" className="action-btn delete" onClick={() => removeCategory(index)} aria-label="Remove category">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <h3>Current Focus Products</h3>
            <p className="settings-desc">Choose which products appear in the homepage Current focus products section.</p>
            <div className="focus-product-grid">
              {products.map((product) => (
                <label className="focus-product-option" key={product.id}>
                  <input
                    type="checkbox"
                    checked={(contentForm.homeFocusProductIds || []).includes(product.id)}
                    onChange={() => toggleFocusProduct(product.id)}
                  />
                  <img src={resolveAssetUrl(product.image)} alt={product.name} />
                  <span>
                    {product.name}
                    <small>{product.category}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <MediaListEditor
              title="Creative Shop Roots Images"
              description="These are the three images under Creative shop roots."
              items={contentForm.creativeRootsImages || []}
              onChange={(items) => updateContentField('creativeRootsImages', items)}
            />
          </div>

          <div className="admin-panel">
            <MediaListEditor
              title="Cute And Creative Corner Images"
              description="These are the large archive images in the Cute and creative corner section."
              items={contentForm.archiveImages || []}
              onChange={(items) => updateContentField('archiveImages', items)}
            />
          </div>

          <div className="admin-panel">
            <h3>DIY Custom Media</h3>
            <p className="settings-desc">
              Override images or videos for each DIY tab. Leave a tab empty to keep using the existing built-in media.
            </p>
            <div className="diy-admin-media-list">
              {DIY_ADMIN_PRODUCTS.map((product) => {
                const customItems = contentForm.diyMedia?.[product.id] || [];
                return (
                  <div className="admin-content-block" key={product.id}>
                    <div className="admin-content-heading">
                      <div>
                        <h4>{product.tab.en}</h4>
                        <p>{customItems.length ? 'Custom media is active for this DIY tab.' : 'Using existing built-in media.'}</p>
                      </div>
                      <div className="qr-upload-actions">
                        {customItems.length > 0 && (
                          <button type="button" className="btn btn-outline" onClick={() => clearDiyMedia(product.id)}>
                            Clear Override
                          </button>
                        )}
                      </div>
                    </div>
                    <MediaListEditor
                      title={`${product.tab.en} Media`}
                      items={customItems}
                      onChange={(items) => updateDiyMedia(product.id, items)}
                      allowVideo
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-panel">
            <button type="button" className="btn btn-primary" onClick={handleSaveSiteContent} disabled={saving}>
              {saving ? 'Saving...' : <><CheckCircle size={18} /> Save Site Content</>}
            </button>
          </div>
        </div>
      )}

      {/* ========== PAYMENT SETTINGS TAB ========== */}
      {activeTab === 'settings' && (
        <div className="settings-panel">
          {/* QR Code Upload */}
          <div className="admin-panel settings-section">
            <h3>Payment QR Codes</h3>
            <p className="settings-desc">Upload the QR code images for MAE and TNG eWallet. These will be shown to customers during checkout.</p>

            <div className="qr-upload-grid">
              {/* MAE QR */}
              <div className="qr-upload-card">
                <h4>MAE / Maybank QR</h4>
                {maePreview ? (
                  <img src={maePreview} alt="MAE QR Preview" className="qr-preview-img" />
                ) : (
                  <div className="qr-upload-placeholder">No QR code set</div>
                )}
                <input
                  ref={maeInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleQRFileChange('mae', e)}
                />
                <div className="qr-upload-actions">
                  <button className="btn btn-secondary" onClick={() => maeInputRef.current?.click()}>
                    <Upload size={16} /> {maePreview ? 'Change' : 'Upload'} QR
                  </button>
                  {maeFile && (
                    <button className="btn btn-primary" onClick={() => handleUploadQR('mae')} disabled={saving}>
                      {saving ? 'Uploading...' : 'Save MAE QR'}
                    </button>
                  )}
                </div>
              </div>

              {/* TNG QR */}
              <div className="qr-upload-card">
                <h4>Touch 'n Go eWallet QR</h4>
                {tngPreview ? (
                  <img src={tngPreview} alt="TNG QR Preview" className="qr-preview-img" />
                ) : (
                  <div className="qr-upload-placeholder">No QR code set</div>
                )}
                <input
                  ref={tngInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleQRFileChange('tng', e)}
                />
                <div className="qr-upload-actions">
                  <button className="btn btn-secondary" onClick={() => tngInputRef.current?.click()}>
                    <Upload size={16} /> {tngPreview ? 'Change' : 'Upload'} QR
                  </button>
                  {tngFile && (
                    <button className="btn btn-primary" onClick={() => handleUploadQR('tng')} disabled={saving}>
                      {saving ? 'Uploading...' : 'Save TNG QR'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Settings */}
          <div className="admin-panel settings-section">
            <h3>Delivery Settings</h3>
            <form onSubmit={handleSaveSettings} className="admin-form">
              <div className="form-group">
                <label>Delivery Fee (RM)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settingsForm.delivery_fee}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, delivery_fee: e.target.value }))}
                />
                <span className="form-hint">This fee is shown to customers at checkout. Current: RM {paymentSettings.delivery_fee?.toFixed(2)}</span>
              </div>
              <div className="form-group">
                <label>Delivery Note (English)</label>
                <input
                  type="text"
                  value={settingsForm.delivery_note_en}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, delivery_note_en: e.target.value }))}
                  placeholder="e.g. RM5–8 depending on area, exact amount confirmed via WhatsApp"
                />
              </div>
              <div className="form-group">
                <label>Delivery Note (中文)</label>
                <input
                  type="text"
                  value={settingsForm.delivery_note_zh}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, delivery_note_zh: e.target.value }))}
                  placeholder="运费 RM5-8 视地区而定"
                />
              </div>
              <div className="admin-actions mt-4">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : <><CheckCircle size={18} /> Save Settings</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
