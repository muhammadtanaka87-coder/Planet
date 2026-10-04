/**
 * server.js - Backend lokal untuk Anita My World
 * Jalankan: npm install && npm start
 * Server: http://localhost:5000
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 5000;

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// === Static folders ===
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '.')));

// === Ensure folders exist ===
const folders = [
    'uploads/images',
    'uploads/audios',
    'data'
];
folders.forEach(f => {
    const full = path.join(__dirname, f);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// === JSON DB helper ===
function readDB(name) {
    const file = path.join(__dirname, 'data', `${name}.json`);
    if (!fs.existsSync(file)) return [];
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return [];
    }
}

function writeDB(name, data) {
    const file = path.join(__dirname, 'data', `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// === Multer storage ===
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isAudio = file.mimetype.startsWith('audio/');
        cb(null, path.join(__dirname, isAudio ? 'uploads/audios' : 'uploads/images'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

// === Health check ===
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running', timestamp: Date.now() });
});

// === Upload Image (R2 replacement) ===
app.post('/api/r2/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const url = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
        res.json({
            success: true,
            data: { url, filename: req.file.filename }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// === Upload Audio ===
app.post('/api/r2/upload-audio', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No audio uploaded' });
        }
        const url = `${req.protocol}://${req.get('host')}/uploads/audios/${req.file.filename}`;
        res.json({
            success: true,
            data: { url, filename: req.file.filename }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// === Galaxy Configs ===
app.post('/api/galaxy-configs', (req, res) => {
    try {
        const { config, isSave } = req.body;
        const configs = readDB('galaxy-configs');
        const id = uuidv4();
        const entry = {
            id,
            config,
            isSave: !!isSave,
            createdAt: new Date().toISOString()
        };
        configs.push(entry);
        writeDB('galaxy-configs', configs);
        res.json({ success: true, galaxyId: id, message: 'Config saved' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/galaxy-configs/:id', (req, res) => {
    try {
        const configs = readDB('galaxy-configs');
        const entry = configs.find(c => c.id === req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Config not found' });
        }
        res.json({ success: true, config: entry.config });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// === Products ===
app.post('/api/products', (req, res) => {
    try {
        const product = req.body;
        const products = readDB('products');
        const id = uuidv4();
        const entry = { id, ...product, createdAt: new Date().toISOString() };
        products.push(entry);
        writeDB('products', products);
        res.json({ success: true, productId: id, message: 'Product created' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// === Vouchers ===
app.get('/api/vouchers/:uid', (req, res) => {
    try {
        const vouchers = readDB('vouchers');
        const userVouchers = vouchers.filter(v => v.uid === req.params.uid);
        res.json({ success: true, vouchers: userVouchers });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/vouchers/apply', (req, res) => {
    try {
        const { uid, code } = req.body;
        const vouchers = readDB('vouchers');
        const voucher = vouchers.find(v => v.uid === uid && v.code === code);
        if (!voucher) {
            return res.json({ success: false, message: 'Voucher not found' });
        }
        res.json({ success: true, voucher });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// === Payment (Mock) ===
app.post('/api/payment/create', (req, res) => {
    try {
        const { amount, orderCode, paymentMethod } = req.body;
        // Mock payment - langsung return checkout URL dummy
        const mockCheckout = `${req.protocol}://${req.get('host')}/mock-payment?orderCode=${orderCode}&amount=${amount}`;
        res.json({
            code: '00',
            success: true,
            data: {
                checkoutUrl: mockCheckout,
                orderCode,
                amount
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// === Mock Payment Page ===
app.get('/mock-payment', (req, res) => {
    const { orderCode, amount } = req.query;
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Mock Payment</title>
        <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; background: #111; color: #fff; }
            button { padding: 15px 40px; font-size: 18px; background: #4ecdc4; color: #fff; border: none; border-radius: 10px; cursor: pointer; margin: 10px; }
            button:hover { background: #3bb3aa; }
        </style>
        </head>
        <body>
            <h1>💳 Mock Payment</h1>
            <p>Order Code: <strong>${orderCode}</strong></p>
            <p>Amount: <strong>${amount} VNĐ</strong></p>
            <button onclick="paySuccess()">✅ Bayar Sukses</button>
            <button onclick="payCancel()">❌ Bayar Gagal</button>
            <script>
                function paySuccess() {
                    if (window.opener) {
                        window.opener.postMessage({ type: 'PAYMENT_SUCCESS', orderCode: '${orderCode}' }, '*');
                    }
                    alert('Pembayaran sukses!');
                    window.close();
                }
                function payCancel() {
                    alert('Pembayaran dibatalkan');
                    window.close();
                }
            </script>
        </body>
        </html>
    `);
});

// === Socket.IO ===
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('join-order', (orderCode) => {
        socket.join(`order-${orderCode}`);
        console.log(`📦 Socket joined order: ${orderCode}`);
    });

    socket.on('leave-order', (orderCode) => {
        socket.leave(`order-${orderCode}`);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// === Start server ===
httpServer.listen(PORT, () => {
    console.log('');
    console.log('🚀 ============================================');
    console.log(`🚀 Backend server running at:`);
    console.log(`🚀 http://localhost:${PORT}`);
    console.log('🚀 ============================================');
    console.log('');
});
