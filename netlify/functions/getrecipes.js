// netlify/functions/getrecipes.js
exports.handler = async (event, context) => {
    const API_KEY = process.env.NETLIFY_ENV_GOOGLE_SHEETS_API_KEY;
    const SHEET_ID = "1iFMNwxAiURSFHR3w622PfIJh4FxSWQSrVjNsKZj29J0";
    const SHEET_NAME = "listedesrecettes";
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.values),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Échec de la requête API Google Sheets" }),
      };
    }
  };