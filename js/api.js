/**
 * api.js
 *
 * Generic wrapper for API fetch requests (`apiFetch`).
 * Automatically parses JSON, unpacks the standard `{success: true, data: ...}` PHP wrapper,
 * and intercepts errors to display them via the Global Toast Notification System.
 */
async function apiFetch(endpoint, method = 'GET', bodyObj = null) {
    const options = { method, credentials: 'include' };
    if (bodyObj) {
        if (bodyObj instanceof FormData) {
            options.body = bodyObj;
        } else {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(bodyObj);
        }
    }
    
    const res = await fetch(endpoint, options);
    
    // Attempt to parse JSON. Some endpoints might not return JSON on failure.
    let data;
    try {
        data = await res.json();
    } catch (e) {
        throw new Error("Server returned non-JSON response.");
    }
    
    // Check if HTTP status is bad, or if the API returned success: false
    if (!res.ok || data.success === false) {
        const errorMsg = data.error || data.message || 'API Request Failed';

        // Use Toast system if available, but don't crash if it's not
        if (typeof Toast !== 'undefined') {
            Toast.show(errorMsg, 'error');
        }

        throw new Error(errorMsg);
    }
    
    // If our PHP backend wrapped the response in {success: true, data: ...}, unwrap it
    // If not (e.g. legacy endpoint), return the raw data payload.
    return data.data !== undefined ? data.data : data;
}
