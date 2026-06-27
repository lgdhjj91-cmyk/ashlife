import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, get, update } from 'firebase/database';
const OrderContext = createContext();

export const useOrders = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState({
    mae_qr_url: '',
    tng_qr_url: '',
    delivery_fee: 8,
    delivery_note_en: 'RM5–8 depending on area, exact amount confirmed via WhatsApp',
    delivery_note_zh: '运费 RM5-8 视地区而定，确切金额通过 WhatsApp 确认',
  });
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Subscribe to orders (real-time)
  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(
      ordersRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const ordersArray = Object.entries(data).map(([key, value]) => ({
            ...value,
            orderId: key,
          }));
          ordersArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(ordersArray);
        } else {
          setOrders([]);
        }
        setLoadingOrders(false);
      },
      (error) => {
        console.error('Orders subscription error:', error);
        setLoadingOrders(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to payment settings (real-time)
  useEffect(() => {
    const settingsRef = ref(database, 'settings/payment');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPaymentSettings((prev) => ({ ...prev, ...data }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Generate order ID: ASH-YYYYMMDD-XXXX (Random suffix)
  const generateOrderId = useCallback(async () => {
    const now = new Date();
    const dateStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    return `ASH-${dateStr}-${randomSuffix}`;
  }, []);

  // Compress image to base64 to store in Realtime DB directly
  const compressImageToBase64 = useCallback((file, maxWidth = 800) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scaleSize = maxWidth / img.width;
          let width = img.width;
          let height = img.height;
          
          if (scaleSize < 1) {
            width = maxWidth;
            height = img.height * scaleSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.6 quality to keep it under DB limits
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }, []);

  // Create a new order
  const createOrder = useCallback(
    async (orderData, screenshotFile) => {
      try {
        const orderItems = orderData.items || [];
        
        // 1. Fetch latest product details from DB for all items in the order
        const productSnapshots = {};
        for (const item of orderItems) {
          if (!productSnapshots[item.productId]) {
            const productRef = ref(database, `products/${item.productId}`);
            const snap = await get(productRef);
            if (!snap.exists()) {
              throw new Error(`Product not found: ${item.name}`);
            }
            productSnapshots[item.productId] = snap.val();
          }
        }
        
        // 2. Validate stock sufficiency
        const insufficientItems = [];
        for (const item of orderItems) {
          const productVal = productSnapshots[item.productId];
          if (item.variantId) {
            const variants = productVal.variants || [];
            const variantList = Array.isArray(variants) ? variants : Object.values(variants);
            const variantObj = variantList.find(v => {
              const vId = v.id || (v.name || v.name_zh || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
              return vId === item.variantId;
            });
            const stock = variantObj ? (Number(variantObj.stock) || 0) : 0;
            if (stock < item.quantity) {
              insufficientItems.push({
                name: item.name,
                variantName: item.variantName || item.variantName_zh,
                available: stock
              });
            }
          } else {
            const stock = Number(productVal.stock) || 0;
            if (stock < item.quantity) {
              insufficientItems.push({
                name: item.name,
                available: stock
              });
            }
          }
        }
        
        if (insufficientItems.length > 0) {
          const details = insufficientItems.map(i => 
            `${i.name}${i.variantName ? ` (${i.variantName})` : ''}: only ${i.available} available`
          ).join(', ');
          return { 
            success: false, 
            error: `Some items do not have enough stock: ${details}` 
          };
        }
        
        // 3. Deduct stock and save products
        const updates = {};
        for (const item of orderItems) {
          const productVal = productSnapshots[item.productId];
          if (item.variantId) {
            const variants = productVal.variants || [];
            // We need to preserve the exact structure (array vs object) when updating.
            if (Array.isArray(variants)) {
              productVal.variants = variants.map(v => {
                const vId = v.id || (v.name || v.name_zh || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                if (vId === item.variantId) {
                  return { ...v, stock: Math.max(0, (Number(v.stock) || 0) - item.quantity) };
                }
                return v;
              });
            } else {
              Object.keys(variants).forEach(key => {
                const v = variants[key];
                const vId = v.id || (v.name || v.name_zh || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                if (vId === item.variantId) {
                  variants[key] = { ...v, stock: Math.max(0, (Number(v.stock) || 0) - item.quantity) };
                }
              });
            }
          } else {
            productVal.stock = Math.max(0, (Number(productVal.stock) || 0) - item.quantity);
          }
          updates[`products/${item.productId}`] = productVal;
        }
        
        const orderId = await generateOrderId();
        
        // Convert payment screenshot to base64 if provided
        let screenshotBase64 = '';
        if (screenshotFile) {
          screenshotBase64 = await compressImageToBase64(screenshotFile);
        }
        
        updates[`orders/${orderId}`] = {
          ...orderData,
          orderId,
          paymentScreenshot: screenshotBase64,
          status: 'pending_verification',
          createdAt: new Date().toISOString(),
        };
        
        // Apply all database updates atomically!
        const dbRef = ref(database);
        await update(dbRef, updates);
        
        return { success: true, orderId };
      } catch (error) {
        console.error('Failed to create order:', error);
        return { success: false, error: error.message };
      }
    },
    [generateOrderId, compressImageToBase64]
  );

  // Update order status (admin)
  const updateOrderStatus = useCallback(async (orderId, status, adminNotes = '') => {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      const snapshot = await get(orderRef);
      if (!snapshot.exists()) throw new Error('Order not found');

      const current = snapshot.val();
      await set(orderRef, {
        ...current,
        status,
        ...(adminNotes && { adminNotes }),
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to update order status:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Upload QR code image (admin)
  const uploadQRCode = useCallback(
    async (file, type) => {
      try {
        // Use base64 for QR codes too
        const base64Url = await compressImageToBase64(file, 600);

        // Save the base64 URL to payment settings
        const settingsRef = ref(database, 'settings/payment');
        const snapshot = await get(settingsRef);
        const current = snapshot.val() || {};
        await set(settingsRef, { ...current, [`${type}_qr_url`]: base64Url });

        return { success: true, url: base64Url };
      } catch (error) {
        console.error('Failed to upload QR code:', error);
        return { success: false, error: error.message };
      }
    },
    [compressImageToBase64]
  );

  // Update payment settings (admin)
  const updatePaymentSettings = useCallback(async (data) => {
    try {
      const settingsRef = ref(database, 'settings/payment');
      const snapshot = await get(settingsRef);
      const current = snapshot.val() || {};
      await set(settingsRef, { ...current, ...data });
      return { success: true };
    } catch (error) {
      console.error('Failed to update payment settings:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return (
    <OrderContext.Provider
      value={{
        orders,
        loadingOrders,
        paymentSettings,
        createOrder,
        updateOrderStatus,
        uploadQRCode,
        updatePaymentSettings,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
