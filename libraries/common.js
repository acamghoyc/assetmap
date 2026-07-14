//#region Helper Functions

// Safely get a string value (returns null if element doesn't exist or is empty)
const parseStringForPA = (str) => {
    if (!str) { return null; }
    const value = str.trim();
    return value === "" ? null : value;
};

// Safely get a string value (returns null if element doesn't exist or is empty)
const parseStringElement = (id) => {
    const element = document.getElementById(id);
    var value = null;
    if (!element) {
        value = sessionStorage.getItem(id);
    } else {
        value = element.value.trim();
    }
    if (!value) { return null; }
    sessionStorage.setItem(id, value);
    return value === "" ? null : value;
};

// Safely get an integer (returns null if element doesn't exist, is empty, or is NaN)
const parseNumberElement = (id) => {
    const element = document.getElementById(id);
    var value = null;
    if (!element) {
        value = sessionStorage.getItem(id);
    } else {
        value = element.value.trim();
    }
    if (!value) { return null; }
    value = parseInt(value, 10);
    sessionStorage.setItem(id, value);
    return isNaN(value) ? null : value;
};

// Safely get a checkbox status (returns null if element doesn't exist)
const parseCheckboxElement = (id) => {
    const element = document.getElementById(id);
    if (!element) return null; // Returns null if checkbox isn't on the page
    sessionStorage.setItem(id, element.checked);
    return element.checked; // Returns true or false
};

// Safely get services as an array (returns null if element doesn't exist or is empty)
// Change 'null' to '[]' when empty
const parseServicesElement = (id) => {
    const servicesStrElement = document.getElementById("ServicesStr");
    var checkedElements;
    if (servicesStrElement && servicesStrElement.value.trim() !== "") {
        checkedElements = servicesStrElement.value
            .split(/\s*;\s*/)      // Split by semicolon and clean whitespace
            .filter(Boolean);      // Remove empty trailing items
    } else {
        //checkedElements = Array.from(document.querySelectorAll('input[name="services"]:checked'))
        checkedElements = Array.from(document.querySelectorAll(`input[name="${id}"]:checked`));
    }
    if (checkedElements.length === 0) return [];
    const elements = checkedElements.map(el => el.value ? el.value.trim() : '').filter(val => val !== "");
    const values = elements.flat();
    const ServicesStr = values.join(';');
    sessionStorage.setItem("ServicesStr", ServicesStr);
    return values === "" ? [] : values; // Return empty array instead of null
};

//#endregion Helper Functions

//#region Loading Notice
let noticeTimer = null;
function showLoadingNotice(title = 'Loading map data', subtitle = 'Fetching locations and services…') {
    if (!loadingNotice) return;
    const titleEl = loadingNotice.querySelector('.loading-title');
    const subtitleEl = loadingNotice.querySelector('.loading-subtitle');

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    loadingNotice.classList.remove('is-hidden');
}

// Declare a variable outside the function to keep track of the active timer
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
        noticeTimer = null; // CRUCIAL: Reset state so future hideLoadingNotice() calls work!
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
    // GUARD: If a timed notice (like "No Matches Found") is active, don't clear it!
    if (noticeTimer !== null) {
        console.log("Hiding skipped: Respecting active timed notice.");
        return;
    }
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

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org');
        const ip = await response.text();
        console.log("User's IP Address:", ip);
        return ip;
    } catch (error) {
        //console.error("Error fetching IP:", error);
        return "0.0.0.0";
    }
}

//#region Construct JSON Payload to send to PowerAutomate/Sharepoint
function constructReferralJSONPayload(referralLink = null, referralTarget = null) {

    if (referralTarget == null) {
        referralTarget = parseStringElement('ReferralOrganization')
    }

    const payload = {
        FirstName: parseStringElement('FirstName'),
        LastName: parseStringElement('LastName'),
        EmailAddress: parseStringElement('EmailAddress'),
        Age: parseNumberElement('Age'),
        PhoneNumber: parseStringElement('PhoneNumber'),
        SMS: parseCheckboxElement('SMS'), // Safe even if the checkbox is removed from HTML
        ZipCode: parseNumberElement('ZipCode'),
        Population: parseStringElement('Population'),
        //Population: parseCheckboxElement('Population'),
        //Population: parsePopulation('population'),
        Services: parseServicesElement('services'),
        ReferralOrganization: parseStringForPA(referralTarget),
        ReferralLink: parseStringForPA(referralLink),
        ReferralDate: new Date().toISOString(),
        IPAddress: typeof userIP !== 'undefined' ? userIP : null // Safe check for preloaded IP
    };

    console.log("Constructed Payload:", payload);

    return payload
}

async function sendReferralJSONPayload(payload) {
    const powerAutomateUrl = "https://default2a7c91df0c894007989227997db3b4.52.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/17/workflows/c961adb64d384b3dbd83b32c37b5ebd5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=D259nng9AwP3ATJwgCZ849xPcd5wvChUfOkJ_NkN_Bs";

    // 2. Send the data to your Power Automate flow webhook
    try {
        const response = await fetch(powerAutomateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("Successfully submitted payload to SharePoint!");
            //messageEl.className = "success";
            //document.getElementById('userForm').reset(); // Clear form fields
        } else {
            console.error("Server error, failed to submit. Status:", response.status);
            //console.error("Server error, failed to submit.", error);
            //messageEl.textContent = "Server error, failed to submit.";
            //messageEl.className = "error";
        }
    } catch (error) {
        console.error('Submission Error:', error);
        //messageEl.textContent = "Network error. Check your Power Automate URL.";
        //messageEl.className = "error";
    }
}

async function handleExternalLinkClick(event, linkElement, referralTarget = null) {
    // 1. Stop the browser from instantly navigating away
    event.preventDefault();

    console.log("Link clicked! Intercepting data first...");

    //const payload = constructReferralJSONPayload();
    //sendReferralJSONPayload(payload);
    const referralLink = linkElement.href;

    try {
        const payload = constructReferralJSONPayload(referralLink, referralTarget);
        sendReferralJSONPayload(payload);
        console.log("Data recorded successfully.");
    } catch (error) {
        // Even if the tracking server fails, we still want the user to reach their destination
        console.error("Tracking failed, proceeding to link anyway:", error);
    } finally {
        // 4. Send the user to the destination site they clicked on
        window.location.href = linkElement;
    }
}

//#endregion Construct JSON Payload to send to PowerAutomate/Sharepoint