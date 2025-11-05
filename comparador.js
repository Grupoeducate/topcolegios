document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('comparatorSearchInput');
    const suggestionBox = document.getElementById('suggestion-box');
    const selectedTagsContainer = document.getElementById('selected-schools-tags');
    const comparisonContainer = document.getElementById('comparison-table-container');

    let schoolData = [];
    let selectedSchools = new Map();

    fetch('results.json')
        .then(response => {
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            return response.json();
        })
        .then(data => {
            schoolData = data;
            console.log('Datos cargados para el comparador.');
        });

    const getPuntajeGlobalLevelClass = (score) => {
        if (score >= 350) return 'level-avanzado';
        if (score >= 270) return 'level-satisfactorio';
        if (score >= 192) return 'level-minimo';
        return 'level-insuficiente';
    };

    const getAreaLevelClass = (area, score) => {
        const ranges = {
            'LC': { min: 36, sat: 51, avan: 66 },
            'MAT': { min: 36, sat: 51, avan: 71 },
            'SC': { min: 41, sat: 56, avan: 71 },
            'NAT': { min: 41, sat: 56, avan: 71 },
            'ING': { min: 37, sat: 58, avan: 71 }
        };
        const numScore = parseInt(score, 10);
        if (!ranges[area] || isNaN(numScore)) return 'level-insuficiente';
        if (numScore >= ranges[area].avan) return 'level-avanzado';
        if (numScore >= ranges[area].sat) return 'level-satisfactorio';
        if (numScore >= ranges[area].min) return 'level-minimo';
        return 'level-insuficiente';
    };

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        suggestionBox.innerHTML = '';
        suggestionBox.style.display = 'none';
        if (query.length < 3) return;

        const suggestions = schoolData.filter(s => 
            s['INSTITUCIÓN'] && s['INSTITUCIÓN'].toLowerCase().includes(query)
        ).slice(0, 5);

        if (suggestions.length > 0) {
            suggestions.forEach(school => {
                const div = document.createElement('div');
                div.textContent = `${school['INSTITUCIÓN']} (${school['MUNICIPIO']})`;
                div.className = 'suggestion-item';
                div.addEventListener('click', () => addSchoolToComparison(school));
                suggestionBox.appendChild(div);
            });
            suggestionBox.style.display = 'block';
        }
    });

    const addSchoolToComparison = (school) => {
        const schoolId = school['PTO.'];
        if (!selectedSchools.has(schoolId)) {
            selectedSchools.set(schoolId, school);
            renderUI();
        }
        searchInput.value = '';
        suggestionBox.style.display = 'none';
    };

    const removeSchoolFromComparison = (schoolId) => {
        selectedSchools.delete(schoolId);
        renderUI();
    };

    function renderUI() {
        renderTags();
        renderComparisonTable();
    }
    
    function renderTags() {
        selectedTagsContainer.innerHTML = '';
        selectedSchools.forEach(school => {
            const schoolId = school['PTO.'];
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `<span>${school['INSTITUCIÓN']}</span><span class="remove-tag" data-id="${schoolId}"> &times;</span>`;
            tag.querySelector('.remove-tag').addEventListener('click', () => removeSchoolFromComparison(schoolId));
            selectedTagsContainer.appendChild(tag);
        });
    }

    function renderComparisonTable() {
        if (selectedSchools.size === 0) {
            comparisonContainer.innerHTML = '<p>Añade colegios desde la barra de búsqueda para empezar a comparar.</p>';
            return;
        }

        const areas = [
            { key: 'PUNT. GLOBAL', name: 'Puntaje Global', max: 500 },
            { key: 'LC', name: 'Lectura Crítica', max: 100 },
            { key: 'MAT', name: 'Matemáticas', max: 100 },
            { key: 'SC', name: 'Sociales y Ciudadanas', max: 100 },
            { key: 'NAT', name: 'Ciencias Naturales', max: 100 },
            { key: 'ING', name: 'Inglés', max: 100 }
        ];

        let tableHTML = '<table class="comparison-table"><thead><tr><th>Área de Conocimiento</th>';
        selectedSchools.forEach(school => {
            tableHTML += `<th>${school['INSTITUCIÓN']}<br><small>${school['MUNICIPIO']}</small></th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        areas.forEach(area => {
            tableHTML += `<tr><td><strong>${area.name}</strong></td>`;
            selectedSchools.forEach(school => {
                const score = school[area.key] || 0;
                const numScore = parseInt(score, 10) || 0;
                const levelClass = area.key === 'PUNT. GLOBAL' ? getPuntajeGlobalLevelClass(numScore) : getAreaLevelClass(area.key, numScore);
                const barWidth = (numScore / area.max) * 100;
                tableHTML += `
                    <td>
                        <div class="score-bar-container">
                            <div class="score-bar ${levelClass}" style="width: ${barWidth}%;"></div>
                            <span class="score-bar-text">${numScore}</span>
                        </div>
                    </td>`;
            });
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        comparisonContainer.innerHTML = tableHTML;
    }
    
    renderUI();
});
