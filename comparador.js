document.addEventListener('DOMContentLoaded', () => {
    // ============== SELECCIÓN DE ELEMENTOS DEL DOM ==============
    const colegio1Input = document.getElementById('colegio1Input');
    const suggestionBox1 = document.getElementById('suggestion-box1');
    const colegio2Input = document.getElementById('colegio2Input');
    const suggestionBox2 = document.getElementById('suggestion-box2');
    const compareButton = document.getElementById('compareButton');
    const comparisonContainer = document.getElementById('comparison-table-container');
    const alertContainer = document.getElementById('alert-container');

    let schoolData = [];
    let selectedSchool1 = null;
    let selectedSchool2 = null;

    // ============== CARGA DE DATOS ==============
    fetch('results.json')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar `results.json`');
            return response.json();
        })
        .then(data => {
            schoolData = data;
            console.log('Datos cargados para el comparador.');
        });

    // ============== LÓGICA DE BÚSQUEDA CON AUTOCOMPLETADO ==============

    // Función genérica para manejar la lógica de autocompletado
    function setupAutocomplete(inputElement, suggestionBoxElement, onSelectCallback) {
        inputElement.addEventListener('input', () => {
            const query = inputElement.value.toLowerCase().trim();
            suggestionBoxElement.innerHTML = '';
            if (query.length < 3) {
                suggestionBoxElement.style.display = 'none';
                return;
            }

            const suggestions = schoolData.filter(s => 
                s['INSTITUCIÓN'] && s['INSTITUCIÓN'].toLowerCase().includes(query)
            ).slice(0, 5);

            if (suggestions.length > 0) {
                suggestions.forEach(school => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    div.textContent = school['INSTITUCIÓN'];
                    div.addEventListener('click', () => {
                        inputElement.value = school['INSTITUCIÓN'];
                        suggestionBoxElement.style.display = 'none';
                        onSelectCallback(school);
                    });
                    suggestionBoxElement.appendChild(div);
                });
                suggestionBoxElement.style.display = 'block';
            }
        });
    }

    // Configurar autocompletado para ambos inputs
    setupAutocomplete(colegio1Input, suggestionBox1, (school) => { selectedSchool1 = school; });
    setupAutocomplete(colegio2Input, suggestionBox2, (school) => { selectedSchool2 = school; });

    // Ocultar sugerencias si se hace clic fuera
    document.addEventListener('click', (e) => {
        if (!colegio1Input.contains(e.target)) suggestionBox1.style.display = 'none';
        if (!colegio2Input.contains(e.target)) suggestionBox2.style.display = 'none';
    });

    // ============== LÓGICA DE COMPARACIÓN Y RENDERIZADO ==============
    
    compareButton.addEventListener('click', () => {
        clearAlert();
        if (!selectedSchool1 || !selectedSchool2) {
            showAlert('Por favor, selecciona dos colegios de las sugerencias para poder comparar.');
            return;
        }
        renderComparisonTable(selectedSchool1, selectedSchool2);
    });

       function renderComparisonTable(school1, school2) {
        const areas = [
            // Nuevas filas de información
            { key: 'PTO. NAL.', name: 'Puesto Nacional', isRank: true },
            { key: 'PTO. CAL.', name: 'Puesto Calendario', isRank: true },
            { key: 'CAL', name: 'Calendario', isInfo: true },
            // Filas de puntajes
            { key: 'PUNT. GLOBAL', name: 'Puntaje Global', max: 500 },
            { key: 'LC', name: 'Lectura Crítica', max: 100 },
            { key: 'MAT', name: 'Matemáticas', max: 100 },
            { key: 'SC', name: 'Sociales y Ciudadanas', max: 100 },
            { key: 'NAT', name: 'Ciencias Naturales', max: 100 },
            { key: 'ING', name: 'Inglés', max: 100 }
        ];

        let tableHTML = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th>${school1['INSTITUCIÓN']}</th>
                        <th>${school2['INSTITUCIÓN']}</th>
                    </tr>
                </thead>
                <tbody>`;

        areas.forEach(area => {
            // Añadimos una clase 'info-row' para las filas que no son de puntaje
            const rowClass = area.isRank || area.isInfo ? 'info-row' : '';
            tableHTML += `<tr class="${rowClass}"><td><strong>${area.name}</strong></td>`;
            
            [school1, school2].forEach(school => {
                const value = school[area.key] || 'N/A';
                
                // Si es un puesto, mostramos el número con #
                if (area.isRank) {
                    tableHTML += `<td>#${value}</td>`;
                } 
                // Si es información (como el Calendario), mostramos el texto
                else if (area.isInfo) {
                    tableHTML += `<td>${value}</td>`;
                }
                // Si es un puntaje, mostramos la barra de colores
                else {
                    const numScore = parseInt(value, 10) || 0;
                    const levelClass = area.key === 'PUNT. GLOBAL' ? getPuntajeGlobalLevelClass(numScore) : getAreaLevelClass(area.key, numScore);
                    const barWidth = (numScore / area.max) * 100;
                    tableHTML += `
                        <td>
                            <div class="score-bar-container">
                                <div class="score-bar ${levelClass}" style="width: ${barWidth}%;"></div>
                                <span class="score-bar-text">${numScore}</span>
                            </div>
                        </td>`;
                }
            });
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        comparisonContainer.innerHTML = tableHTML;
    }


    // --- Funciones de ayuda (niveles y alertas) ---
    function showAlert(message) {
        alertContainer.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    }
    function clearAlert() {
        alertContainer.innerHTML = '';
    }
    const getPuntajeGlobalLevelClass = (score) => {
        if (score >= 350) return 'level-avanzado';
        if (score >= 270) return 'level-satisfactorio';
        if (score >= 192) return 'level-minimo';
        return 'level-insuficiente';
    };
    const getAreaLevelClass = (area, score) => {
        const ranges = { 'LC':{m:36,s:51,a:66}, 'MAT':{m:36,s:51,a:71}, 'SC':{m:41,s:56,a:71}, 'NAT':{m:41,s:56,a:71}, 'ING':{m:37,s:58,a:71} };
        if (!ranges[area] || isNaN(score)) return 'level-insuficiente';
        if (score >= ranges[area].a) return 'level-avanzado';
        if (score >= ranges[area].s) return 'level-satisfactorio';
        if (score >= ranges[area].m) return 'level-minimo';
        return 'level-insuficiente';
    };
});

