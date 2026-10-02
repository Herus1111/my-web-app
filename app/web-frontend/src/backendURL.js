const getDefaultApiBase = () => {
    if (typeof window !== 'undefined') {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isLocal ? 'http://localhost:8080/growdent' : 'https://growdent-backend-production.up.railway.app/growdent';
    }

    return 'https://growdent-backend-production.up.railway.app/growdent';
};

const backendURL = () => {
    const apiUrl = process.env.REACT_APP_API_URL || getDefaultApiBase();
    return apiUrl.replace(/\/$/, '');
};

export default backendURL;