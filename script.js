const API_URL = "https://script.google.com/macros/s/AKfycbxuwa0ufXZzvq1X2_79Mn3WhyeSrhrgWqNl7cwNj3Co4TuJtBLwSy0uhOzkAOWoWag/exec";

document.addEventListener('DOMContentLoaded', () => {
    const pendingList = document.getElementById('pendingList');

    async function loadPendingNades() {
        if (!pendingList) return;
        
        pendingList.innerHTML = '<p class="status-msg">Carregando vídeos pendentes...</p>';
        
        try {
            const response = await fetch(`${API_URL}?action=pendentes`);
            const pendingNades = await response.json();

            if (!Array.isArray(pendingNades) || pendingNades.length === 0) {
                pendingList.innerHTML = '<p class="status-msg success">Nenhum vídeo pendente para aprovação!</p>';
                return;
            }

            pendingList.innerHTML = '';

            pendingNades.forEach((nade) => {
                const card = document.createElement('div');
                card.className = 'pending-card';

                const sideClass = nade.side === 'TR' ? 'badge-tr' : 'badge-ct';

                card.innerHTML = `
                    <div class="pending-card-header">
                        <span class="pending-card-title">${nade.title}</span>
                        <div class="card-tags">
                            <span class="badge badge-map">${nade.map}</span>
                            <span class="badge ${sideClass}">${nade.side}</span>
                            <span class="badge badge-type">${nade.type}</span>
                        </div>
                    </div>
                    <div class="video-container">
                        <iframe src="${nade.embedUrl}" allowfullscreen></iframe>
                    </div>
                    <button class="approve-btn">Aprovar e Publicar</button>
                `;

                const approveBtn = card.querySelector('.approve-btn');
                approveBtn.addEventListener('click', () => approveNade(nade, approveBtn));

                pendingList.appendChild(card);
            });

        } catch (error) {
            console.error('Erro ao carregar lista de pendentes:', error);
            pendingList.innerHTML = '<p class="status-msg error">Erro ao carregar a lista de pendentes.</p>';
        }
    }

    async function approveNade(nade, btnElement) {
        btnElement.disabled = true;
        btnElement.textContent = 'Aprovando...';

        const payload = {
            action: 'approve',
            rowIndex: nade.rowIndex,
            title: nade.title,
            map: nade.map,
            side: nade.side,
            type: nade.type,
            embedUrl: nade.embedUrl,
            thumbnailUrl: nade.thumbnailUrl
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Aguarda a atualização na planilha e recarrega a lista
            setTimeout(() => {
                loadPendingNades();
            }, 1500);

        } catch (error) {
            console.error('Erro ao aprovar utilitário:', error);
            alert('Falha ao aprovar o vídeo.');
            btnElement.disabled = false;
            btnElement.textContent = 'Aprovar e Publicar';
        }
    }

    // Inicializa a busca de pendentes
    loadPendingNades();
});