const { LancamentoFinanceiro } = require('../models');
const { Op } = require('sequelize');

// 🔒 Bloqueio absoluto para SUPER_ADMIN
const validarAcessoFinanceiro = (req) => {
  if (req.user.perfil !== 'ADMIN_ESCOLA') {
    throw new Error('Acesso negado ao módulo financeiro');
  }
};

// ===============================
// CAIXA / SALDO ATUAL
// ===============================
exports.caixa = async (req, res) => {
  try {
    validarAcessoFinanceiro(req);

    const escolaId = req.user.escolaId;

    const entradas = await LancamentoFinanceiro.sum('valor', {
      where: { escolaId, tipo: 'ENTRADA' }
    });

    const saidas = await LancamentoFinanceiro.sum('valor', {
      where: { escolaId, tipo: 'SAIDA' }
    });

    const saldo = (entradas || 0) - (saidas || 0);

    res.json({
      entradas: entradas || 0,
      saidas: saidas || 0,
      saldo
    });
  } catch (error) {
    res.status(403).json({
      error: error.message
    });
  }
};

// ===============================
// FLUXO DE CAIXA
// ===============================
exports.fluxoCaixa = async (req, res) => {
  try {
    validarAcessoFinanceiro(req);

    const escolaId = req.user.escolaId;
    const { dataInicio, dataFim } = req.query;

    const where = { escolaId };

    if (dataInicio && dataFim) {
      where.data = {
        [Op.between]: [dataInicio, dataFim]
      };
    }

    const lancamentos = await LancamentoFinanceiro.findAll({
      where,
      order: [['data', 'ASC']]
    });

    res.json(lancamentos);
  } catch (error) {
    res.status(403).json({
      error: error.message
    });
  }
};

// ===============================
// RECEITAS
// ===============================
exports.receitas = async (req, res) => {
  try {
    validarAcessoFinanceiro(req);

    const escolaId = req.user.escolaId;

    const receitas = await LancamentoFinanceiro.findAll({
      where: {
        escolaId,
        tipo: 'ENTRADA'
      },
      order: [['data', 'DESC']]
    });

    res.json(receitas);
  } catch (error) {
    res.status(403).json({
      error: error.message
    });
  }
};

// ===============================
// DESPESAS
// ===============================
exports.despesas = async (req, res) => {
  try {
    validarAcessoFinanceiro(req);

    const escolaId = req.user.escolaId;

    const despesas = await LancamentoFinanceiro.findAll({
      where: {
        escolaId,
        tipo: 'SAIDA'
      },
      order: [['data', 'DESC']]
    });

    res.json(despesas);
  } catch (error) {
    res.status(403).json({
      error: error.message
    });
  }
};

// ===============================
// LUCRO
// ===============================
exports.lucro = async (req, res) => {
  try {
    validarAcessoFinanceiro(req);

    const escolaId = req.user.escolaId;

    const entradas = await LancamentoFinanceiro.sum('valor', {
      where: { escolaId, tipo: 'ENTRADA' }
    });

    const saidas = await LancamentoFinanceiro.sum('valor', {
      where: { escolaId, tipo: 'SAIDA' }
    });

    const lucro = (entradas || 0) - (saidas || 0);

    res.json({
      lucro
    });
  } catch (error) {
    res.status(403).json({
      error: error.message
    });
  }
};
