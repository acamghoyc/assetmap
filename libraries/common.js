//#region Loading Notice

function showLoadingNotice(title = 'Loading map data', subtitle = 'Fetching locations and services…') {
    if (!loadingNotice) return;
    const titleEl = loadingNotice.querySelector('.loading-title');
    const subtitleEl = loadingNotice.querySelector('.loading-subtitle');

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    loadingNotice.classList.remove('is-hidden');
}

// Declare a variable outside the function to keep track of the active timer
let noticeTimer = null;
function showTimedNotice(title = '', subtitle = '', duration = 3000) {
    if (!loadingNotice) return;

    //Clear any existing timer so they don't overlap
    if (noticeTimer) {
        clearTimeout(noticeTimer);
    }

    const titleEl = loadingNotice.querySelector('.loading-title');
    const subtitleEl = loadingNotice.querySelector('.loading-subtitle');

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;

    //Show
    loadingNotice.classList.remove('is-hidden');

    //Set a timer to hide it after the specified duration
    noticeTimer = setTimeout(() => {
        loadingNotice.classList.add('is-hidden');
    }, duration);
}

function setLoadingNoticeMessage(title, subtitle) {
    if (!loadingNotice) return;
    const titleEl = loadingNotice.querySelector('.loading-title');
    const subtitleEl = loadingNotice.querySelector('.loading-subtitle');

    if (titleEl && title) titleEl.textContent = title;
    if (subtitleEl && subtitle) subtitleEl.textContent = subtitle;
}

function hideLoadingNotice() {
    if (!loadingNotice) return;
    loadingNotice.classList.add('is-hidden');
}

//#endregion Loading Notice

// called using funky syntax, i.e. waitForData(() => serviceDataJSN)
function waitForData(getTarget, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkInterval = setInterval(() => {
            const target = getTarget();

            if (target !== undefined && target !== null) {
                clearInterval(checkInterval);
                resolve(target);
                return;
            }

            if (Date.now() - startTime > timeoutMs) {
                clearInterval(checkInterval);
                reject(new Error("Timeout: target failed to load."));
            }
        }, 100);
    });
}

async function loadCSVData(filePath, forceUpdate = false) {
    return new Promise((resolve, reject) => {
        // Create a unique cache key based on the specific file path (e.g., "cached_zipData.csv")
        const cacheKey = `cached_${filePath}`;

        // 1. Check the session cache if a force update isn't requested
        if (!forceUpdate) {
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                console.log(`Loading ${filePath} from sessionStorage cache...`);
                return resolve(JSON.parse(cachedData));
            }
        } else {
            console.log(`Force update requested. Bypassing cache for ${filePath}...`);
        }

        // 2. Cache miss or forced update: Run Papa.parse to download the file
        console.log(`Fetching and parsing fresh file: ${filePath}`);
        Papa.parse(filePath, {
            download: true,       // Tells Papa Parse to fetch the file via HTTP
            header: true,         // Converts rows into JavaScript objects using the header row keys
            skipEmptyLines: true, // Cleanly skips blank lines at the end of the file

            complete: function (results) {
                try {
                    // 3. Cache the newly retrieved data in sessionStorage
                    sessionStorage.setItem(cacheKey, JSON.stringify(results.data));
                } catch (cacheError) {
                    // Fail silently on caching if storage limit is exceeded, so the app still runs
                    console.warn(`Failed to write ${filePath} to sessionStorage:`, cacheError);
                }

                // Return the data
                resolve(results.data);
            },

            error: function (error) {
                reject(new Error(`Failed to parse CSV file: ${error.message}`));
            }
        });
    });
}