// backend/controllers/superAdminDashboardController.js
const { User, Escola, Matricula, Mensalidade } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

// ================================
// Gauge - Dados de Uso do Sistema
// ================================
exports.usoSistema = async (req, res) => {
  try {
    if (req.user.perfil !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const totalEscolas = await Escola.count();

    // Consideramos escolas com pelo menos 1 matrícula ativa
    const escolasAtivas = await Matricula.count({
      distinct: true,
      col: "escolaId",
      where: { status: "ATIVA" },
    });

    const percentualUso = totalEscolas
      ? Math.round((escolasAtivas / totalEscolas) * 100)
      : 0;

    res.json({
      totalEscolas,
      escolasAtivas,
      percentualUso,
      mensagem: "Dados de uso do sistema carregados com sucesso",
    });
  } catch (err) {
    console.error("Erro ao carregar dados de uso:", err);
    res.status(500).json({ error: "Erro ao carregar dados de uso", details: err.message });
  }
};

// ================================
// Total de Downloads do App
// ================================
exports.downloads = async (req, res) => {
  try {
    if (req.user.perfil !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Supondo que cada matrícula ativa representa um "download"
    const totalDownloads = await Matricula.count({ where: { status: "ATIVA" } });

    res.json({
      totalDownloads,
      mensagem: "Total de downloads carregado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao carregar downloads:", err);
    res.status(500).json({ error: "Erro ao carregar downloads", details: err.message });
  }
};

// ================================
// Usuários Ativos (Escolas Ativas)
// ================================
exports.usuariosAtivos = async (req, res) => {
  try {
    if (req.user.perfil !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const escolasAtivas = await Matricula.count({
      distinct: true,
      col: "escolaId",
      where: { status: "ATIVA" },
    });

    res.json({
      escolasAtivas,
      mensagem: "Número de usuários ativos carregado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao carregar usuários ativos:", err);
    res.status(500).json({ error: "Erro ao carregar usuários ativos", details: err.message });
  }
};

// ================================
// Receita Mensal por Serviço
// ================================
exports.receitaPorServico = async (req, res) => {
  try {
    if (req.user.perfil !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const mensalidades = await Mensalidade.findAll({
      attributes: [
        "formaPagamento",
        [fn("SUM", col("valor")), "total"]
      ],
      where: {
        status: "PAGA",
        dataVencimento: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] }
      },
      group: ["formaPagamento"]
    });

    // Monta objeto com as formas de pagamento
    const receitas = {
      Pix: 0,
      Cartao: 0,
      Boleto: 0,
      Debito: 0,
    };

    mensalidades.forEach(m => {
      receitas[m.formaPagamento] = parseFloat(m.get("total")) || 0;
    });

    res.json({
      receitas,
      mensagem: "Receita mensal por serviço carregada com sucesso"
    });
  } catch (err) {
    console.error("Erro ao carregar receita por serviço:", err);
    res.status(500).json({ error: "Erro ao carregar receita por serviço", details: err.message });
  }
};

// ================================
// Receita Total por Mês (Barras e Linha)
// ================================
exports.receitaTotalMensal = async (req, res) => {
  try {
    if (req.user.perfil !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Últimos 12 meses
    const meses = [];
    const receitasBarras = [];
    const receitasLinha = [];
    const hoje = new Date();

    for (let i = 11; i >= 0; i--) {
      const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const primeiroDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
      const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);

      meses.push(mes.toLocaleString("pt-BR", { month: "short", year: "numeric" }));

      const totalMes = await Mensalidade.sum("valor", {
        where: {
          status: "PAGA",
          dataVencimento: { [Op.between]: [primeiroDia, ultimoDia] }
        }
      });

      receitasBarras.push(totalMes || 0);
      receitasLinha.push(totalMes || 0);
    }

    res.json({
      meses,
      receitasBarras,
      receitasLinha,
      mensagem: "Receita total mensal carregada com sucesso"
    });
  } catch (err) {
    console.error("Erro ao carregar receita total mensal:", err);
    res.status(500).json({ error: "Erro ao carregar receita total mensal", details: err.message });
  }
};
