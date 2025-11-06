document.addEventListener('DOMContentLoaded', () => {
    // ============== SELECCIÓN DE ELEMENTOS DEL DOM ==============
    const departamentoSelect = document.getElementById('departamentoSelect');
    const municipioSelect = document.getElementById('municipioSelect');
    const filterButton = document.getElementById('filterButton');
    const nameSearchInput = document.getElementById('nameSearchInput');
    const suggestionBox = document.getElementById('suggestion-box');
    const resultsContainer = document.getElementById('results-container');
    const alertContainer = document.getElementById('alert-container');
    
    let schoolData = [];

    // ============== CARGA DE DATOS Y POBLACIÓN DE FILTROS ==============
    fetch('results.json')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar `results.json`');
            return response.json();
        })
        .then(data => {
            schoolData = data;
            populateFilters();
            console.log('Datos de colegios cargados y filtros poblados.');
        })
        .catch(error => {
            console.error(error);
            showAlert('Error crítico al cargar los datos de los colegios.');
        });

    function populateFilters() {
        const departamentos = [...new Set(schoolData.map(s => s['DEPARTAMENTO']))].sort();
        
        departamentos.forEach(dep => {
            if (dep) { // Evitar departamentos nulos o vacíos
                const option = document.createElement('option');
                option.value = dep;
                option.textContent = dep;
                departamentoSelect.appendChild(option);
            }
        });

        departamentoSelect.addEventListener('change', () => {
            const selectedDep = departamentoSelect.value;
            municipioSelect.innerHTML = '<option value="">Selecciona un Municipio</option>';
            
            if (selectedDep) {
                const municipios = [...new Set(schoolData
                    .filter(s => s['DEPARTAMENTO'] === selectedDep)
                    .map(s => s['MUNICIPIO']))].sort();
                
                municipios.forEach(mun => {
                    if (mun) { // Evitar municipios nulos o vacíos
                        const option = document.createElement('option');
                        option.value = mun;
                        option.textContent = mun;
                        municipioSelect.appendChild(option);
                    }
                });
                municipioSelect.disabled = false;
            } else {
                municipioSelect.disabled = true;
            }
        });
    }

    // ============== LÓGICA DE BÚSQUEDA Y VISUALIZACIÓN ==============

    // Búsqueda por ubicación (filtros)
    filterButton.addEventListener('click', () => {
        clearAlert(); // Limpiar alertas anteriores
        const dep = departamentoSelect.value;
        const mun = municipioSelect.value;

        if (!dep) {
            showAlert('Por favor revisa los criterios de búsqueda: debes seleccionar al menos un departamento.');
            return;
        }
        
        let filteredData = schoolData.filter(s => s['DEPARTAMENTO'] === dep);
        if (mun) {
            filteredData = filteredData.filter(s => s['MUNICIPIO'] === mun);
        }
        displayResults(filteredData);
    });

    // Búsqueda por nombre (autocompletado)
    nameSearchInput.addEventListener('input', () => {
        clearAlert(); // Limpiar alertas al empezar a escribir
        const query = nameSearchInput.value.toLowerCase().trim();
        suggestionBox.innerHTML = '';
        if (query.length < 3) {
            suggestionBox.style.display = 'none';
            return;
        }

        const suggestions = schoolData.filter(s => 
            (s['INSTITUCIÓN'] && s['INSTITUCIÓN'].toLowerCase().includes(query)) ||
            (s['DANE'] && s['DANE'].toString().includes(query))
        ).slice(0, 10);

        if (suggestions.length > 0) {
            suggestions.forEach(school => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = `${school['INSTITUCIÓN']} (${school['MUNICIPIO']})`;
                div.addEventListener('click', () => {
                    nameSearchInput.value = '';
                    suggestionBox.style.display = 'none';
                    displayResults([school]); // Muestra solo el colegio seleccionado
                });
                suggestionBox.appendChild(div);
            });
            suggestionBox.style.display = 'block';
        } else {
            suggestionBox.style.display = 'none';
        }
    });

    // Ocultar sugerencias si se hace clic fuera
    document.addEventListener('click', (e) => {
        if (suggestionBox && !suggestionBox.contains(e.target) && e.target !== nameSearchInput) {
            suggestionBox.style.display = 'none';
        }
    });

    // Funciones de alerta
    function showAlert(message) {
        alertContainer.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    }
    function clearAlert() {
        alertContainer.innerHTML = '';
    }

    // --- Funciones de renderizado que deben estar al final ---
    
    function getPuntajeGlobalLevelClass(score) {
        if (score >= 350) return 'level-avanzado';
        if (score >= 270) return 'level-satisfactorio';
        if (score >= 192) return 'level-minimo';
        return 'level-insuficiente';
    }

           function displayResults(dataToDisplay) {
        resultsContainer.innerHTML = '';
        if (!dataToDisplay || dataToDisplay.length === 0) {
            resultsContainer.innerHTML = '<p>No se encontraron resultados para los criterios seleccionados.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'results-table';

        // 1. AJUSTE: Cambiamos el encabezado para mostrar las dos nuevas columnas de ranking.
        table.innerHTML = `
            <thead>
                <tr>
                    <th class="rank-col">Pto. Nal.</th>
                    <th class="rank-col">Pto. Cal.</th>
                    <th>Institución</th>
                    <th>Municipio</th>
                    <th>Puntaje Global</th>
                    <th>Sector</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement('tbody');
        dataToDisplay.forEach(school => {
            const row = document.createElement('tr');
            
            // 2. AJUSTE: Leemos las nuevas propiedades del JSON para los puestos.
            const ptoNal = school['PTO. NAL.'] || 'N/A';
            const ptoCal = school['PTO. CAL.'] || 'N/A';
            
            const puntaje = parseInt(school['PUNT. GLOBAL'], 10) || 0;
            const institucion = school['INSTITUCIÓN'] || 'N/A';
            const municipio = school['MUNICIPIO'] || 'N/A';
            // Ajustamos el nombre de la clave para el sector si también cambió.
            const sector = school['SECTOR'] || school['NAT.'] || 'N/A';
            
            const lc = school['LC'] || 'N/A';
            const mat = school['MAT'] || 'N/A';
            const sc = school['SC'] || 'N/A';
            const nat = school['NAT'] || 'N/A';
            const ing = school['ING'] || 'N/A';
            
            const levelClass = getPuntajeGlobalLevelClass(puntaje);
            const barWidth = (puntaje / 500) * 100;
            
            // 3. AJUSTE: Construimos la fila con las dos nuevas celdas de ranking al principio.
            row.innerHTML = `
                <td class="rank-col"><strong>#${ptoNal}</strong></td>
                <td class="rank-col"><strong>#${ptoCal}</strong></td>
                <td>
                    <strong>${institucion}</strong>
                    <div class="area-scores">
                        <span>LC: ${lc}</span>
                        <span>MAT: ${mat}</span>
                        <span>SC: ${sc}</span>
                        <span>NAT: ${nat}</span>
                        <span>ING: ${ing}</span>
                    </div>
                </td>
                <td>${municipio}</td>
                <td>
                    <div class="score-bar-container">
                        <div class="score-bar ${levelClass}" style="width: ${barWidth}%;"></div>
                        <span class="score-bar-text">${puntaje}</span>
                    </div>
                </td>
                <td>${sector}</td>
            `;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        resultsContainer.appendChild(table);
    }


});


