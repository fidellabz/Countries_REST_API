document.addEventListener('DOMContentLoaded', () => {
    const countriesContainer = document.getElementById('countries-container');
    const regionSelect = document.getElementById('region-select');
    const searchBox = document.getElementById('search-box');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const countryDetailsModal = document.getElementById('country-details-modal');
    const countryDetails = document.getElementById('country-details');
    const closeModal = document.getElementById('close-modal');

    const showLoading = () => {
        countriesContainer.innerHTML = '<p>Loading...</p>';
    };

    const showError = (error) => {
        countriesContainer.innerHTML = `<p>Error loading data: ${error.message}</p>`;
    };

    const fetchDataWithRetry = async (url, retries = 3, delay = 1000) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return await response.json();
            } catch (error) {
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw error;
                }
            }
        }
    };

    const loadRegions = async () => {
        showLoading();
        try {
            const countries = await fetchDataWithRetry('https://restcountries.com/v3.1/all');
            const regions = [...new Set(countries.map(country => country.region))].filter(Boolean);
            regions.forEach(region => {
                const option = document.createElement('option');
                option.value = region;
                option.textContent = region;
                regionSelect.appendChild(option);
            });
            loadCountries(); // Load countries after loading regions
            populateSearchOptions(countries);
        } catch (error) {
            showError(error);
        }
    };

    const loadCountries = async (region = '') => {
        showLoading();
        try {
            let url = 'https://restcountries.com/v3.1/all';
            if (region) {
                url = `https://restcountries.com/v3.1/region/${region}`;
            }
            const countries = await fetchDataWithRetry(url);
            displayCountries(countries);
        } catch (error) {
            showError(error);
        }
    };

    const displayCountries = (countries) => {
        countriesContainer.innerHTML = '';
        countries.forEach(country => {
            const countryCard = document.createElement('div');
            countryCard.classList.add('country-card');
            countryCard.innerHTML = `
                <img src="${country.flags.svg}" alt="Flag of ${country.name.common}" class="country-flag">
                <h3>${country.name.common}</h3>
                <p>${country.region}</p>
            `;
            countryCard.addEventListener('click', () => displayCountryDetails(country));
            countriesContainer.appendChild(countryCard);
        });
    };

    const displayCountryDetails = (country) => {
        countryDetails.innerHTML = `
            <h2>${country.name.common}</h2>
            <p><strong>Capital:</strong> ${country.capital ? country.capital[0] : 'N/A'}</p>
            <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
            <p><strong>Region:</strong> ${country.region}</p>
            <p><strong>Subregion:</strong> ${country.subregion}</p>
            <p><strong>Currency:</strong> ${country.currencies ? Object.values(country.currencies)[0].name : 'N/A'}</p>
            <p><strong>Languages:</strong> ${country.languages ? Object.values(country.languages).join(', ') : 'N/A'}</p>
        `;
        countryDetailsModal.style.display = 'block';
    };

    const populateSearchOptions = (countries) => {
        const datalist = document.createElement('datalist');
        datalist.id = 'countries-datalist';
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.name.common;
            datalist.appendChild(option);
        });
        searchBox.setAttribute('list', 'countries-datalist');
        document.body.appendChild(datalist);
    };

    regionSelect.addEventListener('change', () => {
        loadCountries(regionSelect.value);
    });

    searchBox.addEventListener('input', async () => {
        const query = searchBox.value.trim().toLowerCase();
        const datalist = document.getElementById('countries-datalist');
        datalist.innerHTML = ''; // Clear existing options
        
        try {
            const countries = await fetchDataWithRetry('https://restcountries.com/v3.1/all');
            const filteredCountries = countries.filter(country =>
                country.name.common.toLowerCase().includes(query)
            );
            
            // Sort filtered countries alphabetically
            filteredCountries.sort((a, b) => {
                const nameA = a.name.common.toLowerCase();
                const nameB = b.name.common.toLowerCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
            
            // Populate datalist with options
            filteredCountries.forEach(country => {
                const option = document.createElement('option');
                option.value = country.name.common;
                datalist.appendChild(option);
            });
            
            // Display filtered countries
            displayCountries(filteredCountries);
        } catch (error) {
            showError(error);
        }
    });
    

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    closeModal.addEventListener('click', () => {
        countryDetailsModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === countryDetailsModal) {
            countryDetailsModal.style.display = 'none';
        }
    });

    loadRegions();
});
