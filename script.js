const API_URL = "https://script.google.com/macros/s/AKfycbxuwa0ufXZzvq1X2_79Mn3WhyeSrhrgWqNl7cwNj3Co4TuJtBLwSy0uhOzkAOWoWag/exec";

document.addEventListener('DOMContentLoaded', () => {
    const pendingList = document.getElementById('pendingList');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const approveSelectedBtn = document.getElementById('approveSelectedBtn');
    const rejectSelectedBtn = document.getElementById('rejectSelectedBtn');

    let pendingNades = [];

    async function loadPendingNades() {
        if (!pendingList) return;
        
        pendingList.innerHTML = '<p class="status-msg">Carregando vídeos pendentes...</p>';
        resetSelectionState();

        try {
            const response = await fetch(`${API_URL}?action=pendentes`);
            pendingNades = await response.json();

            if (!Array.isArray(pendingNades) || pendingNades.length === 0) {
                pendingList.innerHTML = '<p class="status-msg success">Nenhum vídeo pendente para aprovação!</p>';
                return;
            }

            pendingList.innerHTML = '';

            pendingNades.forEach((nade, index) => {
                const card = document.createElement('div');
                card.className = 'pending-card';

                const sideClass = nade.side === 'TR' ? 'badge-tr' : 'badge-ct';

                card.innerHTML = `
                    <div class="pending-card-header">
                        <div class="card-header-left">
                            <input type="checkbox" class="card-select-checkbox" data-index="${index}">
                            <span class="pending-card-title">${nade.title}</span>
                        </div>
                        <div class="card-tags">
                            <span class="badge badge-map">${nade.map}</span>
                            <span class="badge ${sideClass}">${nade.side}</span>
                            <span class="badge badge-type">${nade.type}</span>
                        </div>
                    </div>
                    <div class="video-container">
                        <iframe 
                            src="${nade.embedUrl}" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            referrerpolicy="strict-origin-when-cross-origin" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <div class="card-actions">
                        <button class="approve-btn single-approve">Aprovar</button>
                        <button class="reject-btn single-reject">Recusar</button>
                    </div>
                `;

                const checkbox = card.querySelector('.card-select-checkbox');
                const singleApprove = card.querySelector('.single-approve');
                const singleReject = card.querySelector('.single-reject');

                checkbox.addEventListener('change', updateSelectionUI);
                singleApprove.addEventListener('click', () => processBatch([nade], 'approveBatch'));
                singleReject.addEventListener('click', () => {
                    if (confirm(`Deseja recusar "${nade.title}"?`)) {
                        processBatch([nade], 'rejectBatch');
                    }
                });

                pendingList.appendChild(card);
            });

        } catch (error) {
            console.error('Erro ao carregar lista de pendentes:', error);
            pendingList.innerHTML = '<p class="status-msg error">Erro ao carregar a lista de pendentes.</p>';
        }
    }

    function getSelectedNades() {
        const checkboxes = document.querySelectorAll('.card-select-checkbox:checked');
        return Array.from(checkboxes).map(cb => pendingNades[cb.getAttribute('data-index')]);
    }

    function updateSelectionUI() {
        const selectedNades = getSelectedNades();
        const totalCards = document.querySelectorAll('.card-select-checkbox').length;
        const selectedCount = selectedNades.length;

        approveSelectedBtn.disabled = selectedCount === 0;
        rejectSelectedBtn.disabled = selectedCount === 0;

        approveSelectedBtn.textContent = `Aprovar Selecionados (${selectedCount})`;
        rejectSelectedBtn.textContent = `Recusar Selecionados (${selectedCount})`;

        if (selectAllCheckbox) {
            selectAllCheckbox.checked = totalCards > 0 && selectedCount === totalCards;
        }
    }

    function resetSelectionState() {
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        if (approveSelectedBtn) {
            approveSelectedBtn.disabled = true;
            approveSelectedBtn.textContent = 'Aprovar Selecionados (0)';
        }
        if (rejectSelectedBtn) {
            rejectSelectedBtn.disabled = true;
            rejectSelectedBtn.textContent = 'Recusar Selecionados (0)';
        }
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.card-select-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateSelectionUI();
        });
    }

    async function processBatch(items, actionType) {
        if (!items || items.length === 0) return;

        approveSelectedBtn.disabled = true;
        rejectSelectedBtn.disabled = true;

        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: actionType,
                    items: items
                })
            });

            setTimeout(() => {
                loadPendingNades();
            }, 1500);

        } catch (error) {
            console.error('Erro ao processar lote:', error);
            alert('Falha ao processar a requisição em lote.');
            updateSelectionUI();
        }
    }

    if (approveSelectedBtn) {
        approveSelectedBtn.addEventListener('click', () => {
            const selected = getSelectedNades();
            processBatch(selected, 'approveBatch');
        });
    }

    if (rejectSelectedBtn) {
        rejectSelectedBtn.addEventListener('click', () => {
            const selected = getSelectedNades();
            if (confirm(`Deseja realmente recusar e excluir os ${selected.length} vídeos selecionados?`)) {
                processBatch(selected, 'rejectBatch');
            }
        });
    }

    loadPendingNades();
});
