// backend/routes/superAdminDashboardRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // singular
const controller = require("../controllers/superAdminDashboardController"); // nome correto do controller

// ================================
// ROTAS DO DASHBOARD SUPER ADMIN
// ================================

// 1️⃣ Gauge - Dados de Uso do Sistema
router.get("/uso", authMiddleware, controller.usoSistema);

// Futuro: outras rotas do dashboard
// router.get("/downloads", authMiddleware, controller.downloads);
// router.get("/usuarios-ativos", authMiddleware, controller.usuariosAtivos);
// router.get("/receita-servico", authMiddleware, controller.receitaPorServico);
// router.get("/receita-mensal-barras", authMiddleware, controller.receitaMensalBarras);
// router.get("/receita-mensal-linha", authMiddleware, controller.receitaMensalLinha);

module.exports = router;
