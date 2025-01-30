exports.handler = async function () {
    const SHEET_ID = "1iFMNwxAiURSFHR3w622PfIJh4FxSWQSrVjNsKZj29J0";
    const SHEET_NAME = "listedesrecettes";
    const API_KEY = process.env.NETLIFY_ENV_GOOGLE_SHEETS_API_KEY;

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erreur lors de la récupération des recettes." })
        };
    }
};
