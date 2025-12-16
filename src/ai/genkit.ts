import {genkit} from 'genkit';

export const ai = genkit({
  // By removing the googleAI() plugin from here, we prevent Genkit from
  // trying to read the API key from the environment variables by default.
  // Instead, the API key provided by the user in the UI will be used
  // to dynamically configure the plugin for each individual API call in the flows.
});
