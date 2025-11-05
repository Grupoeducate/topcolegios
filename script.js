// Se ejecuta cuando todo el contenido HTML de la página ha sido cargado.
document.addEventListener('DOMContentLoaded', () => {

    // ============== SELECCIÓN DE ELEMENTOS DEL DOM ==============
    // Obtenemos referencias a los elementos HTML con los que vamos a interactuar.
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resultsContainer = document.getElementById('results-container');
    
    // Variable para almacenar todos los datos de los colegios una vez cargados.
    let schoolData = [];

    // ============== CARGA DE DATOS ==============
    // Usamos la API fetch para cargar de forma asíncrona el archivo JSON.
    fetch('results.json')
        .then(response => {
            // Verificamos si la respuesta del servidor es exitosa.
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json(); // Convertimos la respuesta a formato JSON.
        })
        .then(data => {
            // Si la carga es exitosa, guardamos los datos en nuestra variable.
            schoolData = data;
            console.log('Datos de colegios cargados exitosamente.');
        })
        .catch(error => {
            // Si ocurre un error (ej: archivo no encontrado, JSON mal formado), lo mostramos.
            console.error('Error al cargar los datos de los colegios:', error);
            resultsContainer.innerHTML = '<p style="color: red;"><strong>Error:</strong> No se pudo cargar el archivo de datos `results.json`. Por favor, verifica que el archivo exista y esté en la misma carpeta.</p>';
        });

    // ============== LÓGICA DE NIVELES Y VISUALIZACIÓN ==============

    /**
     * Determina la clase CSS para el nivel de desempeño según el puntaje global.
     * Estos rangos están basados en la imagen proporcionada.
     * @param {number} score - El puntaje global del colegio.
     * @returns {string} - El nombre de la clase CSS ('level-avanzado', 'level-satisfactorio', etc.).
     */
    function getPuntajeGlobalLevelClass(score) {
        if (score >= 350) return 'level-avanzado';
        if (score >= 270) return 'level-satisfactorio';
        if (score >= 192) return 'level-minimo';
        return 'level-insuficiente';
    }

    /**
     * Renderiza (dibuja) la tabla de resultados en la página.
     * @param {Array} dataToDisplay - Un array de objetos, donde cada objeto es un colegio a mostrar.
     */
    function displayResults(dataToDisplay) {
        resultsContainer.innerHTML = ''; // Limpiamos cualquier resultado anterior.

        if (dataToDisplay.length === 0) {
            resultsContainer.innerHTML = '<p>No se encontraron resultados que coincidan con tu búsqueda.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'results-table';

        // Creamos el encabezado de la tabla.
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

        // Iteramos sobre cada colegio para crear su fila en la tabla.
        dataToDisplay.forEach(school => {
            const row = document.createElement('tr');
            const puntaje = school.puntajeGlobal || 0; // Usamos 0 si el puntaje no está definido.
            const levelClass = getPuntajeGlobalLevelClass(puntaje);
            const barWidth = (puntaje / 500) * 100; // Calculamos el ancho porcentual de la barra (sobre 500).

            // Creamos el HTML para la fila.
            row.innerHTML = `
                <td>${school.institucion || 'N/A'}</td>
                <td>${school.municipio || 'N/A'}</td>
                <td>
                    <div class="score-bar-container">
                        <div class="score-bar ${levelClass}" style="width: ${barWidth}%;"></div>
                        <span class="score-bar-text">${puntaje}</span>
                    </div>
                </td>
                <td>${school.sector || 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        resultsContainer.appendChild(table);
    }

    // ============== MANEJO DE EVENTOS DE BÚSQUEDA ==============

    /**
     * Función que se ejecuta para realizar la búsqueda.
     */
    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();

        // Si la búsqueda está vacía, no mostramos nada.
        if (!query) {
            resultsContainer.innerHTML = '<p>Ingresa un término de búsqueda para ver los resultados.</p>';
            return;
        }

        // Filtramos el array de datos principal.
        const filteredData = schoolData.filter(school => {
            // Comprobamos si el texto de búsqueda está incluido en el nombre, municipio o departamento.
            const institucion = school.institucion ? school.institucion.toLowerCase() : '';
            const municipio = school.municipio ? school.municipio.toLowerCase() : '';
            const departamento = school.departamento ? school.departamento.toLowerCase() : '';
            
            return institucion.includes(query) || 
                   municipio.includes(query) ||
                   departamento.includes(query);
        });

        displayResults(filteredData);
    }

    // Asignamos la función handleSearch al evento 'click' del botón.
    searchButton.addEventListener('click', handleSearch);

    // También permitimos buscar al presionar la tecla "Enter" en el campo de texto.
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
});
