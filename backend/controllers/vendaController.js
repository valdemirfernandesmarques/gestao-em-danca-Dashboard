// backend/controllers/vendaController.js
const db = require('../models');
const sequelize = db.sequelize;

// ===============================
// CRIAR VENDA
// ===============================
exports.criarVenda = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      alunoId,
      itensVenda,
      itens,
      descontos = 0,
      metodoPagamento = 'PIX',
      escolaId: escolaIdBody,
      usuarioId,
    } = req.body;

    const itensFinal = Array.isArray(itensVenda) ? itensVenda : itens;

    if (!Array.isArray(itensFinal) || itensFinal.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Informe os itens da venda.' });
    }

    const escolaIdFinal =
      req.user.perfil === 'SUPER_ADMIN'
        ? escolaIdBody
        : req.user.escolaId;

    if (!escolaIdFinal) {
      await t.rollback();
      return res.status(400).json({ error: 'escolaId é obrigatório.' });
    }

    const produtosIds = itensFinal.map(i => i.produtoId);

    const produtos = await db.Produto.findAll({
      where: {
        id: produtosIds,
        escolaId: escolaIdFinal,
      },
      transaction: t,
    });

    if (produtos.length !== itensFinal.length) {
      await t.rollback();
      return res.status(400).json({
        error: 'Um ou mais produtos não foram encontrados nesta escola.',
      });
    }

    let totalBruto = 0;

    for (const item of itensFinal) {
      const produto = produtos.find(p => p.id === item.produtoId);

      if (!produto) {
        throw new Error('Produto não encontrado.');
      }

      const quantidade = Number(item.quantidade);
      const precoUnitario = Number(
        item.precoUnitario ?? produto.preco
      );

      if (quantidade <= 0) {
        throw new Error(`Quantidade inválida para o produto ${produto.nome}`);
      }

      if (produto.quantidade < quantidade) {
        throw new Error(`Estoque insuficiente para o produto ${produto.nome}`);
      }

      totalBruto += precoUnitario * quantidade;
    }

    const totalDescontos = Number(descontos) || 0;
    const totalLiquido = Number((totalBruto - totalDescontos).toFixed(2));

    if (totalLiquido < 0) {
      throw new Error('Total líquido não pode ser negativo.');
    }

    const venda = await db.Venda.create(
      {
        escolaId: escolaIdFinal,
        alunoId: alunoId || null,
        usuarioId: usuarioId || req.user.id,
        totalBruto,
        totalDescontos,
        totalLiquido,
        metodoPagamento,
        dataVenda: new Date(),
        status: 'Pendente',
      },
      { transaction: t }
    );

    for (const item of itensFinal) {
      const produto = produtos.find(p => p.id === item.produtoId);
      const quantidade = Number(item.quantidade);
      const precoUnitario = Number(
        item.precoUnitario ?? produto.preco
      );
      const subtotal = Number(
        (precoUnitario * quantidade).toFixed(2)
      );

      await db.VendaItem.create(
        {
          vendaId: venda.id,
          produtoId: produto.id,
          quantidade,
          precoUnitario,
          subtotal,
        },
        { transaction: t }
      );

      produto.quantidade -= quantidade;
      await produto.save({ transaction: t });
    }

    await db.Pagamento.create(
      {
        vendaId: venda.id,
        escolaId: escolaIdFinal,
        valor: totalLiquido,
        dataPagamento: new Date(),
        metodo: metodoPagamento,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      message: 'Venda registrada com sucesso',
      vendaId: venda.id,
      totalLiquido,
    });

  } catch (error) {
    await t.rollback();
    console.error('Erro ao registrar venda:', error);
    res.status(500).json({
      error: 'Erro ao registrar venda',
      details: error.message,
    });
  }
};

// ===============================
// LISTAR VENDAS
// ===============================
exports.listarVendas = async (req, res) => {
  try {
    const escolaId =
      req.user.perfil === 'SUPER_ADMIN'
        ? req.query.escolaId
        : req.user.escolaId;

    const where = {};
    if (escolaId) where.escolaId = escolaId;

    const vendas = await db.Venda.findAll({
      where,
      include: [
        {
          model: db.VendaItem,
          as: 'itens',
          include: [{ model: db.Produto, as: 'produto' }],
        },
        { model: db.User, as: 'usuario', attributes: ['id', 'nome'] },
        { model: db.Aluno, as: 'aluno', attributes: ['id', 'nome'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(vendas);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao listar vendas',
      details: error.message,
    });
  }
};
console.log('🔥 vendaController exports:', Object.keys(module.exports));