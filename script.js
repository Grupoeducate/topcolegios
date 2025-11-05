    document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resultsContainer = document.getElementById('results-container');
    
    let schoolData = [];

    fetch('results.json')
        .then(response => {
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            return response.json();
        })
        .then(data => {
            schoolData = data;
            console.log('Datos de colegios cargados exitosamente.');
        })
        .catch(error => {
            console.error('Error al cargar los datos:', error);
            resultsContainer.innerHTML = '<p style="color: red;"><strong>Error:</strong> No se pudo cargar `results.json`. Verifica que el archivo exista y tenga el nombre correcto.</p>';
        });

    function getPuntajeGlobalLevelClass(score) {
        if (score >= 350) return 'level-avanzado';
        if (score >= 270) return 'level-satisfactorio';
        if (score >= 192) return 'level-minimo';
        return 'level-insuficiente';
    }

    function displayResults(dataToDisplay) {
        resultsContainer.innerHTML = '';
        if (dataToDisplay.length === 0) {
            resultsContainer.innerHTML = '<p>No se encontraron resultados que coincidan con tu búsqueda.</p>';
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
            // Lectura correcta de las claves del JSON
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

    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            resultsContainer.innerHTML = '<p>Ingresa un término de búsqueda para ver los resultados.</p>';
            return;
        }

        const filteredData = schoolData.filter(school => {
            // Búsqueda correcta con las claves del JSON
            const institucion = school['INSTITUCIÓN'] ? school['INSTITUCIÓN'].toLowerCase() : '';
            const municipio = school['MUNICIPIO'] ? school['MUNICIPIO'].toLowerCase() : '';
            const departamento = school['DEPARTAMENTO'] ? school['DEPARTAMENTO'].toLowerCase() : '';
            
            return institucion.includes(query) || 
                   municipio.includes(query) ||
                   departamento.includes(query);
        });

        displayResults(filteredData);
    }

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') handleSearch();
    });
});
