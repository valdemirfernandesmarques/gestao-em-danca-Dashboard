<template>
  <div class="container">
    <!-- Cabeçalho -->
    <header class="header">
      <h1><i class="fas fa-chart-line"></i> Relatório Financeiro Completo</h1>
    </header>

    <!-- Filtros de Data -->
    <div class="filters-card">
      <div class="filters">
        <label>Período:</label>
        <input type="date" v-model="filters.start" />
        <span>até</span>
        <input type="date" v-model="filters.end" />
        <button @click="applyFilters" class="btn btn-primary">
          <i class="fas fa-filter"></i> Filtrar
        </button>
        <button @click="resetFilters" class="btn btn-secondary">
          <i class="fas fa-undo"></i> Resetar
        </button>
      </div>
    </div>

    <!-- Feedback de carregamento -->
    <div v-if="loading" class="loading">Carregando relatório...</div>

    <!-- Resumo Financeiro -->
    <div v-else class="summary card">
      <button class="summary-item receita" @click="filterByType('Receita')">
        Receita Total<br><strong>{{ formatCurrency(totalReceita) }}</strong>
      </button>
      <button class="summary-item despesa" @click="filterByType('Despesa')">
        Despesa Total<br><strong>{{ formatCurrency(totalDespesa) }}</strong>
      </button>
      <button class="summary-item saldo" @click="resetFilters">
        Saldo Final<br><strong>{{ formatCurrency(saldoFinal) }}</strong>
      </button>
      <button class="btn-export btn-success" @click="exportPDF">
        <i class="fas fa-file-pdf"></i> Exportar PDF
      </button>
    </div>

    <!-- Tabela de Movimentações -->
    <div v-if="!loading" class="report-table card">
      <h2>Movimentações</h2>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Aluno/Funcionário/Produto</th>
              <th>Valor (R$)</th>
              <th>Saldo Parcial (R$)</th>
              <th>Nota Fiscal</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(entry, index) in filteredEntries"
              :key="index"
              :class="entry.type==='Receita' ? 'row-receita' : 'row-despesa'"
            >
              <td>{{ formatDate(entry.date) }}</td>
              <td>{{ entry.type }}</td>
              <td>{{ entry.description }}</td>
              <td>{{ entry.entity }}</td>
              <td :class="{'credit': entry.type==='Receita', 'debit': entry.type==='Despesa'}">
                {{ formatCurrency(entry.value) }}
              </td>
              <td>{{ formatCurrency(calculatePartialBalance(index)) }}</td>
              <td>
                <button @click="emitirNotaFiscal(entry)" class="btn btn-nf">
                  <i class="fas fa-file-invoice"></i> NF
                </button>
              </td>
            </tr>
            <tr v-if="filteredEntries.length === 0">
              <td colspan="7" class="empty">Nenhuma movimentação encontrada</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nota Fiscal -->
    <div v-if="showNFModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Emitir Nota Fiscal</h3>
          <span class="close-modal" @click="showNFModal=false">&times;</span>
        </div>
        <div class="modal-body">
          <label>Tipo:</label>
          <select v-model="nf.tipo">
            <option value="PF">Pessoa Física (CPF)</option>
            <option value="PJ">Pessoa Jurídica (CNPJ)</option>
          </select>
          <label v-if="nf.tipo==='PF'">CPF:</label>
          <input v-if="nf.tipo==='PF'" type="text" v-model="nf.cpf" placeholder="000.000.000-00"/>
          <label v-if="nf.tipo==='PJ'">CNPJ:</label>
          <input v-if="nf.tipo==='PJ'" type="text" v-model="nf.cnpj" placeholder="00.000.000/0000-00"/>
          <label>Descrição:</label>
          <input type="text" v-model="nf.description"/>
          <label>Valor:</label>
          <input type="number" v-model="nf.value" step="0.01"/>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showNFModal=false">Cancelar</button>
          <button class="btn btn-primary" @click="gerarNF()">Emitir Nota Fiscal</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import api from '../api/api.js'; // ajuste conforme caminho

export default {
  name: "Relatorio",
  data() {
    return {
      filters: { start: "", end: "" },
      entries: [],
      filteredEntries: [],
      loading: true,
      showNFModal: false,
      nf: { tipo: "PF", cpf: "", cnpj: "", description: "", value: 0 },
    };
  },
  computed: {
    totalReceita() { 
      return this.filteredEntries.filter(e => e.type === "Receita").reduce((sum, e) => sum + e.value, 0); 
    },
    totalDespesa() { 
      return this.filteredEntries.filter(e => e.type === "Despesa").reduce((sum, e) => sum + e.value, 0); 
    },
    saldoFinal() { 
      return this.totalReceita - this.totalDespesa; 
    }
  },
  methods: {
    formatCurrency(value) { return `R$ ${value.toFixed(2)}`; },
    formatDate(date) { return new Date(date).toLocaleDateString("pt-BR"); },
    calculatePartialBalance(index) {
      let balance = 0;
      for (let i = 0; i <= index; i++) {
        balance += this.filteredEntries[i].type === "Receita" ? this.filteredEntries[i].value : -this.filteredEntries[i].value;
      }
      return balance;
    },
    async loadRelatorio() {
      this.loading = true;
      try {
        const res = await api.get('/relatorios'); // rota backend real
        this.entries = res.data || [];
        this.filteredEntries = [...this.entries];
      } catch (e) {
        console.error('Erro ao carregar dados do relatório:', e);
        alert('Erro ao carregar dados do relatório');
      } finally {
        this.loading = false;
      }
    },
    applyFilters() {
      const start = this.filters.start ? new Date(this.filters.start) : null;
      const end = this.filters.end ? new Date(this.filters.end) : null;
      this.filteredEntries = this.entries.filter(entry => {
        const date = new Date(entry.date);
        if (start && date < start) return false;
        if (end && date > end) return false;
        return true;
      });
    },
    resetFilters() {
      this.filters.start = "";
      this.filters.end = "";
      this.filteredEntries = [...this.entries];
    },
    filterByType(tipo) {
      this.filteredEntries = this.entries.filter(e => e.type === tipo);
    },
    exportPDF() {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Relatório Financeiro - Escola de Dança", 14, 15);

      autoTable(doc, {
        startY: 25,
        head: [["Data","Tipo","Descrição","Entidade","Valor","Saldo Parcial"]],
        headStyles: { fillColor: [74, 21, 75], textColor: 255 },
        body: this.filteredEntries.map((e, i) => [
          this.formatDate(e.date),
          e.type,
          e.description,
          e.entity,
          this.formatCurrency(e.value),
          this.formatCurrency(this.calculatePartialBalance(i))
        ])
      });

      doc.save("relatorio_financeiro.pdf");
    },
    emitirNotaFiscal(entry) {
      this.nf.description = entry.description;
      this.nf.value = entry.value;
      this.showNFModal = true;
    },
    gerarNF() {
      const tipo = this.nf.tipo;
      const id = tipo === "PF" ? this.nf.cpf : this.nf.cnpj;
      if (!id || !this.nf.description || !this.nf.value) {
        alert("Preencha todos os campos corretamente!");
        return;
      }
      const doc = new jsPDF();
      const dataHora = new Date().toLocaleString("pt-BR");

      doc.setFontSize(20);
      doc.setTextColor(74,21,75);
      doc.text("ESCOLA DE DANÇA - NOTA FISCAL", 14, 20);
      doc.setDrawColor(74,21,75);
      doc.setLineWidth(0.5);
      doc.rect(10, 25, 190, 100);
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Data/Hora: ${dataHora}`, 14, 35);
      doc.text(`Tipo: ${tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}`, 14, 45);
      doc.text(`ID: ${id}`, 14, 55);
      doc.text(`Descrição: ${this.nf.description}`, 14, 65);
      doc.text(`Valor: R$ ${this.nf.value.toFixed(2)}`, 14, 75);
      doc.save(`nota_fiscal_${tipo}_${id}.pdf`);

      this.showNFModal = false;
      alert("Nota Fiscal emitida com sucesso!");
    }
  },
  mounted() {
    this.loadRelatorio();
  }
};
</script>

<style scoped>
.container { 
  padding: 20px; 
  background-color: #1f1f1f; 
  color: #f0f0f0;
}
.header { 
  margin-bottom: 20px; 
  color: #e0aaff; 
}
.filters-card { 
  background: #2c2c2c; 
  padding: 15px 20px; 
  border-radius: 8px; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.5); 
  margin-bottom: 20px; 
}
.filters { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.filters label { font-weight: bold; }
.filters input { 
  padding: 6px 10px; 
  border-radius: 4px; 
  border: 1px solid #555; 
  background: #333; 
  color: #fff; 
}
.filters button { 
  padding: 6px 12px; 
  border-radius: 4px; 
  cursor: pointer; 
  border: none;
}
.btn-primary { 
  background-color: #6a1b9a; 
  color: white; 
}
.btn-primary:hover { background-color: #8e24aa; }
.btn-secondary { 
  background-color: #555; 
  color: white; 
}
.btn-secondary:hover { background-color: #777; }
.summary.card { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; }
.summary-item { flex: 1; padding: 15px; border-radius: 6px; color: white; text-align: center; font-weight: bold; cursor: pointer; }
.summary-item.receita { background-color: #48bb78; }
.summary-item.despesa { background-color: #f56565; }
.summary-item.saldo { background-color: #4a90e2; }
.btn-export { padding: 10px 15px; background-color: #6a1b9a; color: #fff; border-radius: 6px; cursor: pointer; }
.btn-export:hover { background-color: #8e24aa; }
.btn-nf { padding: 8px 12px; background-color: #ff8c00; color: #fff; border-radius: 6px; cursor: pointer; }
.btn-nf:hover { background-color: #ffa500; }
.report-table.card { background: #2c2c2c; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.5); }
.table-responsive { overflow-x:auto; }
.report-table table { width: 100%; border-collapse: collapse; }
.report-table th { padding: 10px; color: white; }
.report-table td { padding: 10px; border-bottom: 1px solid #555; }
.row-receita { background-color: #2e4d2e; }
.row-despesa { background-color: #5a1f1f; }
.credit { color: #48bb78; font-weight: bold; }
.debit { color: #f56565; font-weight: bold; }
.empty { text-align: center; padding: 15px; color: #aaa; }
.modal { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index: 1000; }
.modal-content { background: #333; padding:20px; border-radius:8px; width:400px; max-width:90%; box-shadow: 0 0 15px rgba(0,0,0,0.7); color: #f0f0f0; }
.modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; }
.close-modal { cursor:pointer; font-size:20px; color: #f0f0f0; }
.modal-body input, .modal-body select { width:100%; margin-bottom:10px; padding:5px; border-radius:4px; border:1px solid #555; background: #222; color: #fff; }
.modal-footer { display:flex; justify-content:flex-end; gap:10px; }
.modal-footer .btn-secondary { background-color: #555; }
.modal-footer .btn-primary { background-color: #6a1b9a; }
.modal-footer .btn-primary:hover { background-color: #8e24aa; }
</style>
