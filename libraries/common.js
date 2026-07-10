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

// be called using funky syntax, i.e. waitForData(() => serviceDataJSN)
function waitForData(getTarget, timeoutMs = 20000) {
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