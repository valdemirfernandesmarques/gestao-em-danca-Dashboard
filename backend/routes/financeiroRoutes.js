const express = require('express');
const router = express.Router();

const financeiroController = require('../controllers/financeiroController');
const authMiddleware = require('../middleware/authMiddleware');

// 🔐 Todas as rotas do financeiro exigem autenticação
router.use(authMiddleware);

// ===============================
// CAIXA / SALDO ATUAL
// ===============================
router.get('/caixa', financeiroController.caixa);

// ===============================
// FLUXO DE CAIXA
// ===============================
router.get('/fluxo', financeiroController.fluxoCaixa);

// ===============================
// RECEITAS
// ===============================
router.get('/receitas', financeiroController.receitas);

// ===============================
// DESPESAS
// ===============================
router.get('/despesas', financeiroController.despesas);

// ===============================
// LUCRO
// ===============================
router.get('/lucro', financeiroController.lucro);

module.exports = router;
