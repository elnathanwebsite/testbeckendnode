// File: beckend.js

// 1. Muat variabel dari .env
require('dotenv').config();

// 2. Impor semua library
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 3. Inisialisasi Aplikasi
const app = express();
// Ambil PORT dari file .env, jika tidak ada, pakai 3000
const PORT = process.env.PORT || 3000; 

// 4. Konfigurasi Supabase (Data diambil dari .env)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 5. Middleware
app.use(cors()); // Izinkan permintaan dari domain lain
app.use(express.json()); // Izinkan server membaca data JSON dari body

// Sajikan file statis (HTML, CSS, JS) dari folder 'public'
// Pastikan index.html Anda ada di dalam folder 'public'
app.use(express.static('public')); 

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'WarkopKM9 API is running',
        timestamp: new Date().toISOString()
    });
});

// Get cafe settings
app.get('/api/settings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) throw error;
        res.json({ success: true, data: data });

    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
});

// Update cafe settings
app.put('/api/settings', async (req, res) => {
    try {
        const settings = req.body;
        
        const { data, error } = await supabase
            .from('settings')
            .update(settings)
            .eq('id', 1)
            .select();

        if (error) throw error;
        res.json({ success: true, data: data[0], message: 'Settings updated successfully' });

    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
});

// Get all menu items (dengan filter & search)
app.get('/api/menu', async (req, res) => {
    try {
        const { category, search } = req.query;
        
        let query = supabase
            .from('menu')
            .select('*')
            .order('name');

        // Filter by category
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        // Search by name or description
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data: data, count: data.length });

    } catch (error) {
        console.error('Error fetching menu:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch menu items' });
    }
});

// Get menu item by ID
app.get('/api/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('menu')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, error: 'Menu item not found' });
        }
        res.json({ success: true, data: data });

    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch menu item' });
    }
});

// Create new menu item
app.post('/api/menu', async (req, res) => {
    try {
        const menuItem = req.body;

        const { data, error } = await supabase
            .from('menu')
            .insert([menuItem])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data: data[0], message: 'Menu item created successfully' });

    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ success: false, error: 'Failed to create menu item' });
    }
});

// Update menu item
app.put('/api/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const menuItem = req.body;

        const { data, error } = await supabase
            .from('menu')
            .update(menuItem)
            .eq('id', id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, error: 'Menu item not found' });
        }
        res.json({ success: true, data: data[0], message: 'Menu item updated successfully' });

    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ success: false, error: 'Failed to update menu item' });
    }
});

// Delete menu item
app.delete('/api/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('menu')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Menu item deleted successfully' });

    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ success: false, error: 'Failed to delete menu item' });
    }
});

// Get all orders (dengan filter)
app.get('/api/orders', async (req, res) => {
    try {
        const { status, customer_phone } = req.query;
        
        let query = supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        // Filter by status
        if (status) {
            query = query.eq('status', status);
        }

        // Filter by customer phone
        if (customer_phone) {
            query = query.eq('customer_phone', customer_phone);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data: data, count: data.length });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        res.json({ success: true, data: data });

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
});

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const order = req.body;

        const { data, error } = await supabase
            .from('orders')
            .insert([order])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data: data[0], message: 'Order created successfully' });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('orders')
            .update({ 
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        res.json({ success: true, data: data[0], message: 'Order status updated successfully' });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, error: 'Failed to update order status' });
    }
});

// Update order (General)
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = req.body;

        const { data, error } = await supabase
            .from('orders')
            .update(order)
            .eq('id', id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        res.json({ success: true, data: data[0], message: 'Order updated successfully' });

    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, error: 'Failed to update order' });
    }
});

// Get gallery items
app.get('/api/gallery', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data, count: data.length });

    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch gallery items' });
    }
});

// Add gallery item
app.post('/api/gallery', async (req, res) => {
    try {
        const galleryItem = req.body;

        const { data, error } = await supabase
            .from('gallery')
            .insert([galleryItem])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data: data[0], message: 'Gallery item added successfully' });

    } catch (error) {
        console.error('Error adding gallery item:', error);
        res.status(500).json({ success: false, error: 'Failed to add gallery item' });
    }
});

// Delete gallery item
app.delete('/api/gallery/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('gallery')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Gallery item deleted successfully' });

    } catch (error) {
        console.error('Error deleting gallery item:', error);
        res.status(500).json({ success: false, error: 'Failed to delete gallery item' });
    }
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
    try {
        const contactData = req.body;

        const { data, error } = await supabase
            .from('contacts')
            .insert([contactData])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data: data[0], message: 'Contact message submitted successfully' });

    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ success: false, error: 'Failed to submit contact form' });
    }
});

// Get contact messages
app.get('/api/contact', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data, count: data.length });

    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch contact messages' });
    }
});

// Get order statistics
app.get('/api/statistics', async (req, res) => {
    try {
        // Get total orders count
        const { count: totalOrders, error: countError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // Get orders by status
        const { data: statusData, error: statusError } = await supabase
            .from('orders')
            .select('status');

        if (statusError) throw statusError;

        // Count orders by status
        const statusCount = {};
        statusData.forEach(order => {
            statusCount[order.status] = (statusCount[order.status] || 0) + 1;
        });

        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: todayOrders, error: todayError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        if (todayError) throw todayError;

        res.json({
            success: true,
            data: {
                total_orders: totalOrders,
                today_orders: todayOrders,
                orders_by_status: statusCount
            }
        });

    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
    }
});

// Search across all tables
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ success: false, error: 'Search query is required' });
        }

        // Search menu items
        const { data: menuItems, error: menuError } = await supabase
            .from('menu')
            .select('*')
            .or(`name.ilike.%${q}%,description.ilike.%${q}%`);

        if (menuError) throw menuError;

        // Search orders by customer name or phone
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,menu_item_name.ilike.%${q}%`);

        if (ordersError) throw ordersError;

        res.json({
            success: true,
            data: {
                menu_items: menuItems,
                orders: orders
            },
            counts: {
                menu_items: menuItems.length,
                orders: orders.length
            }
        });

    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ success: false, error: 'Failed to perform search' });
    }
});

// ==================== ERROR HANDLING ====================

// Error handling middleware (Paling bawah, sebelum 404)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        error: 'Something went wrong!',
        message: err.message 
    });
});

// 404 handler (Paling bawah)
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Endpoint not found' 
    });
});

// ==================== START SERVER ====================

// Ini adalah satu-satunya app.listen
app.listen(PORT, () => {
    console.log(`🚀 WarkopKM9 API Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📱 Website frontend (diasumsikan) berjalan di port 8000`); 
});