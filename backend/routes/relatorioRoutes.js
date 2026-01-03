// backend/routes/relatorioRoutes.js
const express = require('express');
const router = express.Router();

const relatorioController = require('../controllers/relatorioController');

// 🔥 ROTA PRINCIPAL (ESSA RESOLVE O 404 DO FRONT)
router.get('/', relatorioController.getRelatorioFinanceiro);

// Relatórios específicos
router.get('/mensalidades', relatorioController.relatorioMensalidades);

// Teste
router.get('/teste', relatorioController.testeRelatorio);

module.exports = router;
