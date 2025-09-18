// gestao-problemas.js

document.addEventListener('DOMContentLoaded', () => {

    /* --- Referências aos elementos do DOM --- */
    const navButtons = document.querySelectorAll('.nav-btn');
    const toolPanels = document.querySelectorAll('.tool-panel');

    // Seção Análise do Problema (Ishikawa)
    const problemaIshikawaInput = document.getElementById('problema-ishikawa');
    const ishikawaFactors = document.querySelectorAll('.factor-input');
    const saveIshikawaBtn = document.getElementById('save-ishikawa');
    const ishikawaStatus = document.getElementById('ishikawa-status');

    // Seção Plano de Ação (5W2H)
    const planoProblemaInput = document.getElementById('plano-problema');
    const save5w2hBtn = document.getElementById('save-5w2h');
    const planoStatus = document.getElementById('plano-status');
    const w2hInputs = {
        what: document.getElementById('5w2h-what'),
        why: document.getElementById('5w2h-why'),
        where: document.getElementById('5w2h-where'),
        who: document.getElementById('5w2h-who'),
        when: document.getElementById('5w2h-when'),
        how: document.getElementById('5w2h-how'),
        how_much: document.getElementById('5w2h-how-much')
    };

    // Seção Relatórios (Pareto)
    const paretoInputsContainer = document.getElementById('pareto-inputs-container');
    const addParetoItemBtn = document.getElementById('add-pareto-item');
    const generateParetoBtn = document.getElementById('generate-pareto');
    const paretoCanvas = document.getElementById('pareto-chart');
    const paretoOutput = document.getElementById('pareto-output');
    let paretoChart = null;

    /* --- Lógica de Navegação entre Seções --- */
    function showPanel(target) {
        navButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${target}"]`).classList.add('active');

        toolPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(target).classList.add('active');
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            showPanel(btn.dataset.tool);
        });
    });

    /* --- Lógica para o Diagrama de Ishikawa (Análise da Causa-Raiz) --- */
    saveIshikawaBtn.addEventListener('click', () => {
        const analise = {
            problema: problemaIshikawaInput.value,
            causas: {}
        };
        ishikawaFactors.forEach(factor => {
            analise.causas[factor.dataset.factor] = factor.value.split('\n').filter(line => line.trim() !== '');
        });
        
        localStorage.setItem('ishikawa-analise', JSON.stringify(analise));
        ishikawaStatus.textContent = 'Análise de causa-raiz salva com sucesso!';
        
        // Sincroniza o campo de problema do 5W2H
        planoProblemaInput.value = analise.problema;
    });

    /* --- Lógica para o Plano de Ação (5W2H) --- */
    save5w2hBtn.addEventListener('click', () => {
        const plano = {
            problema: planoProblemaInput.value,
            what: w2hInputs.what.value,
            why: w2hInputs.why.value,
            where: w2hInputs.where.value,
            who: w2hInputs.who.value,
            when: w2hInputs.when.value,
            how: w2hInputs.how.value,
            how_much: w2hInputs.how_much.value
        };

        let planosExistentes = JSON.parse(localStorage.getItem('planos-5w2h')) || [];
        planosExistentes.push(plano);
        localStorage.setItem('planos-5w2h', JSON.stringify(planosExistentes));
        
        planoStatus.textContent = 'Plano de ação salvo com sucesso!';
    });

    /* --- Lógica para os Relatórios (Pareto) --- */
    function addParetoItem() {
        const newItem = document.createElement('div');
        newItem.classList.add('pareto-item');
        newItem.innerHTML = `
            <input type="text" class="problema" placeholder="Problema">
            <input type="number" class="frequencia" placeholder="Frequência" min="1">
            <button class="remove-item">X</button>
        `;
        paretoInputsContainer.appendChild(newItem);
        
        newItem.querySelector('.remove-item').addEventListener('click', () => {
            newItem.remove();
        });
    }

    addParetoItemBtn.addEventListener('click', addParetoItem);

    generateParetoBtn.addEventListener('click', () => {
        const inputs = Array.from(paretoInputsContainer.children);
        const data = inputs.map(item => ({
            problema: item.querySelector('.problema').value,
            frequencia: parseInt(item.querySelector('.frequencia').value) || 0
        })).filter(item => item.problema && item.frequencia > 0);

        if (data.length === 0) {
            paretoOutput.textContent = 'Adicione problemas e frequências para gerar a análise.';
            return;
        }

        data.sort((a, b) => b.frequencia - a.frequencia);
        const totalFrequencia = data.reduce((sum, item) => sum + item.frequencia, 0);
        
        let cumulativeFrequencia = 0;
        const processedData = data.map(item => {
            cumulativeFrequencia += item.frequencia;
            return {
                ...item,
                porcentagemAcumulada: (cumulativeFrequencia / totalFrequencia) * 100
            };
        });

        // Gerar Gráfico
        const labels = processedData.map(item => item.problema);
        const frequencies = processedData.map(item => item.frequencia);
        const cumulativePercentages = processedData.map(item => item.porcentagemAcumulada);

        if (paretoChart) {
            paretoChart.destroy();
        }

        paretoChart = new Chart(paretoCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Frequência', data: frequencies, backgroundColor: 'rgba(0, 123, 255, 0.7)', yAxisID: 'y' },
                    { label: 'Porcentagem Acumulada', data: cumulativePercentages, type: 'line', borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: false, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { title: { display: true, text: 'Frequência' } },
                    y1: {
                        type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Porcentagem Acumulada (%)' },
                        max: 100, ticks: { callback: (value) => value + '%' }
                    }
                }
            }
        });

        // Análise de Pareto (Regra 80/20)
        let analysisText = 'Análise de Problemas:\n\n';
        const eightyPercentPoint = processedData.find(item => item.porcentagemAcumulada >= 80);
        
        if (eightyPercentPoint) {
            const index = processedData.indexOf(eightyPercentPoint);
            const keyProblems = processedData.slice(0, index + 1).map(p => p.problema).join(', ');
            analysisText += `Os ${index + 1} problemas mais frequentes (${keyProblems}) representam ${eightyPercentPoint.porcentagemAcumulada.toFixed(2)}% do total. Concentrar a solução nesses problemas gerará o maior impacto.`;
        } else {
            analysisText += 'A regra 80/20 pode não se aplicar diretamente a este conjunto de dados. Foque nos problemas de maior frequência para obter as maiores melhorias.';
        }
        paretoOutput.textContent = analysisText;
    });

    // Adiciona o primeiro item de Pareto na inicialização
    addParetoItem();
});