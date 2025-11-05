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
            console.log('Datos cargados y filtros poblados.');
        })
        .catch(error => {
            console.error(error);
            showAlert('Error crítico al cargar los datos de los colegios.');
        });

    function populateFilters() {
        // Obtenemos listas únicas de departamentos y municipios
        const departamentos = [...new Set(schoolData.map(s => s['DEPARTAMENTO']))].sort();
        
        departamentos.forEach(dep => {
            const option = document.createElement('option');
            option.value = dep;
            option.textContent = dep;
            departamentoSelect.appendChild(option);
        });

        departamentoSelect.addEventListener('change', () => {
            const selectedDep = departamentoSelect.value;
            municipioSelect.innerHTML = '<option value="">Selecciona un Municipio</option>'; // Reiniciar
            
            if (selectedDep) {
                const municipios = [...new Set(schoolData
                    .filter(s => s['DEPARTAMENTO'] === selectedDep)
                    .map(s => s['MUNICIPIO']))].sort();
                
                municipios.forEach(mun => {
                    const option = document.createElement('option');
                    option.value = mun;
                    option.textContent = mun;
                    municipioSelect.appendChild(option);
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
        const dep = departamentoSelect.value;
        const mun = municipioSelect.value;

        if (!dep) {
            showAlert('Por favor revisa los criterios de búsqueda: debes seleccionar al menos un departamento.');
            return;
        }
        
        clearAlert();
        let filteredData = schoolData.filter(s => s['DEPARTAMENTO'] === dep);
        if (mun) {
            filteredData = filteredData.filter(s => s['MUNICIPIO'] === mun);
        }
        displayResults(filteredData);
    });

    // Búsqueda por nombre (autocompletado)
    nameSearchInput.addEventListener('input', () => {
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
                div.textContent = school['INSTITUCIÓN'];
                div.addEventListener('click', () => {
                    nameSearchInput.value = school['INSTITUCIÓN'];
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
        if (!nameSearchInput.contains(e.target)) {
            suggestionBox.style.display = 'none';
        }
    });

    // (El resto de las funciones `displayResults` y `getPuntajeGlobalLevelClass` se mantienen igual que en la versión anterior)
    function displayResults(dataToDisplay) {
        // ... (código sin cambios)
    }
    function getPuntajeGlobalLevelClass(score) {
        // ... (código sin cambios)
    }

    // Funciones de alerta
    function showAlert(message) {
        alertContainer.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    }
    function clearAlert() {
        alertContainer.innerHTML = '';
    }

    // --- Pega aquí las funciones displayResults y getPuntajeGlobalLevelClass de la respuesta anterior ---
    // Por brevedad, no las repito, pero deben estar aquí para que el código funcione.
    // Aquí están de nuevo para asegurar que lo tengas todo:
    function getPuntajeGlobalLevelClass(score) {
        if (score >= 350) return 'level-avanzado';
        if (score >= 270) return 'level-satisfactorio';
        if (score >= 192) return 'level-minimo';
        return 'level-insuficiente';
    }

    function displayResults(dataToDisplay) {
        resultsContainer.innerHTML = '';
        if (dataToDisplay.length === 0) {
            resultsContainer.innerHTML = '<p>No se encontraron resultados para los criterios seleccionados.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'results-table';
        table.innerHTML = `
            <thead>
                <tr>
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
            const puntaje = parseInt(school['PUNT. GLOBAL'], 10) || 0;
            const institucion = school['INSTITUCIÓN'] || 'N/A';
            const municipio = school['MUNICIPIO'] || 'N/A';
            const sector = school['SECTOR'] || 'N/A';
            const levelClass = getPuntajeGlobalLevelClass(puntaje);
            const barWidth = (puntaje / 500) * 100;
            row.innerHTML = `
                <td>${institucion}</td>
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
