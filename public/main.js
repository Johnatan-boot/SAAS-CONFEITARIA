async function loadSalesReport() {
  const res = await fetch('/api/reports/sales');
  const reports = await res.json();
  const div = document.getElementById('dashboard-reports');
  div.innerHTML = reports.map(r => `
    <p>Status: ${r.status} - Total Pedidos: ${r.total_orders} - Valor Total: R$ ${r.total_value}</p>
  `).join('');
}

loadSalesReport();
