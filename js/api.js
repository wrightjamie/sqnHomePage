/**
 * Generic wrapper for API fetch requests.
 * Automatically unpacks the {success: true, data: ...} PHP wrapper.
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
        throw new Error(data.error || data.message || 'API Request Failed');
    }
    
    // If our PHP backend wrapped the response in {success: true, data: ...}, unwrap it
    // If not (e.g. legacy endpoint), return the raw data payload.
    return data.data !== undefined ? data.data : data;
}
