// backend/controllers/relatorioController.js
const {
  Mensalidade,
  Matricula,
  Aluno,
  Turma
} = require('../models');

/**
 * =========================================
 * RELATÓRIO FINANCEIRO (ROTA PRINCIPAL)
 * GET /api/relatorios
 * =========================================
 */
exports.getRelatorioFinanceiro = async (req, res) => {
  try {
    // 🔒 Para teste fixo (depois troca por req.user.escolaId)
    const escolaId = 5;

    const mensalidades = await Mensalidade.findAll({
      where: { escolaId },
      include: [
        {
          model: Matricula,
          as: 'matricula',
          include: [
            { model: Aluno, as: 'aluno' },
            { model: Turma, as: 'turma' }
          ]
        }
      ],
      order: [['dataVencimento', 'ASC']]
    });

    const dados = mensalidades.map(m => ({
      id: m.id,
      date: m.dataVencimento,
      value: Number(m.valor) || 0,
      type: 'Receita',
      description: `Mensalidade - ${m.matricula?.aluno?.nome || 'Aluno não encontrado'}`,
      entity: m.matricula?.aluno?.nome || 'Aluno não encontrado',
      status: m.status
    }));

    return res.json(dados);

  } catch (error) {
    console.error('❌ Erro no relatório financeiro:', error);
    return res.status(500).json({
      message: 'Erro ao carregar dados do relatório'
    });
  }
};

/**
 * =========================================
 * RELATÓRIO DE MENSALIDADES
 * GET /api/relatorios/mensalidades
 * =========================================
 */
exports.relatorioMensalidades = async (req, res) => {
  try {
    const escolaId = 5;

    const mensalidades = await Mensalidade.findAll({
      where: { escolaId },
      include: [
        {
          model: Matricula,
          as: 'matricula',
          include: [
            { model: Aluno, as: 'aluno' },
            { model: Turma, as: 'turma' }
          ]
        }
      ],
      order: [['dataVencimento', 'ASC']]
    });

    const data = mensalidades.map(m => ({
      id: m.id,
      dataVencimento: m.dataVencimento,
      valor: Number(m.valor) || 0,
      status: m.status,
      aluno: m.matricula?.aluno?.nome || 'Aluno não encontrado',
      turma: m.matricula?.turma?.nome || 'Turma não encontrada'
    }));

    return res.json(data);

  } catch (error) {
    console.error('❌ Erro ao carregar mensalidades:', error);
    return res.status(500).json({ message: 'Erro ao carregar mensalidades' });
  }
};

/**
 * =========================================
 * ROTA DE TESTE
 * GET /api/relatorios/teste
 * =========================================
 */
exports.testeRelatorio = async (req, res) => {
  return res.json({ message: 'Rota de teste funcionando!' });
};
