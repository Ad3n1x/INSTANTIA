const MODEL_ENDPOINT = process.env.INSTANTIA_MODEL_API_URL;
const MODEL_KEY = process.env.INSTANTIA_MODEL_API_KEY;
const MODEL_NAME = process.env.INSTANTIA_MODEL_NAME;

const SYSTEM_PROMPT = `You are INSTANTIA's request planner. Turn a user's software/task request into a cautious implementation plan. Never claim a tool was built or run. Return only JSON with keys: summary (string), category (one of productivity, documents, data, web-app, automation, developer-tool, research, other), steps (array of 3-6 short strings), requiredInputs (array of strings), risks (array of strings), verification (array of strings), needsExternalService (boolean). Do not provide instructions that facilitate harm, illegal access, credential theft, malware, surveillance, or unsafe activity. If the task requires code execution, recommend isolated, short-lived cloud workers; never suggest executing generated code inside the API process.`;

function parseJson(text) {
  const cleaned = text.trim().replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\s*\x60\x60\x60$/, '');
  return JSON.parse(cleaned);
}

export async function planRequest(prompt) {
  if (MODEL_ENDPOINT && MODEL_KEY && MODEL_NAME) {
    const response = await fetch(MODEL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MODEL_KEY}` },
      body: JSON.stringify({
        model: MODEL_NAME,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(25000)
    });
    if (!response.ok) throw new Error(`Planning provider returned HTTP ${response.status}`);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('Planning provider returned no plan.');
    const plan = parseJson(content);
    return normalizePlan(plan, true);
  }

  return normalizePlan({
    summary: `Plan a solution for: ${prompt.slice(0, 220)}`,
    category: inferCategory(prompt),
    steps: [
      'Clarify the expected outcome and any required inputs.',
      'Check for a verified INSTANTIA capability or reusable component.',
      'Design the smallest implementation that meets the request.',
      'Build and test it in an isolated cloud environment before use.',
      'Present the result and ask whether to keep or dispose of the tool.'
    ],
    requiredInputs: ['Any files, examples, or external accounts required by the request'],
    risks: ['Custom generation is not connected until an AI planning provider is configured.'],
    verification: ['Automated tests', 'Input validation and security review', 'End-to-end smoke test'],
    needsExternalService: false
  }, false);
}

function inferCategory(prompt) {
  const p = prompt.toLowerCase();
  if (/pdf|document|image|file|convert/.test(p)) return 'documents';
  if (/csv|data|spreadsheet|chart|report/.test(p)) return 'data';
  if (/website|web app|dashboard|landing page|frontend/.test(p)) return 'web-app';
  if (/automate|workflow|schedule|trigger/.test(p)) return 'automation';
  if (/code|api|debug|program|developer|script/.test(p)) return 'developer-tool';
  if (/research|compare|investigate|summar/.test(p)) return 'research';
  if (/task|plan|organize|write|email|calendar/.test(p)) return 'productivity';
  return 'other';
}

function normalizePlan(plan, providerBacked) {
  const categories = new Set(['productivity', 'documents', 'data', 'web-app', 'automation', 'developer-tool', 'research', 'other']);
  return {
    summary: String(plan.summary || 'Plan created.').slice(0, 500),
    category: categories.has(plan.category) ? plan.category : 'other',
    steps: Array.isArray(plan.steps) ? plan.steps.slice(0, 8).map(x => String(x).slice(0, 240)) : [],
    requiredInputs: Array.isArray(plan.requiredInputs) ? plan.requiredInputs.slice(0, 8).map(x => String(x).slice(0, 180)) : [],
    risks: Array.isArray(plan.risks) ? plan.risks.slice(0, 8).map(x => String(x).slice(0, 220)) : [],
    verification: Array.isArray(plan.verification) ? plan.verification.slice(0, 8).map(x => String(x).slice(0, 180)) : [],
    needsExternalService: Boolean(plan.needsExternalService),
    providerBacked,
    executionStatus: 'plan-only',
    message: providerBacked
      ? 'A request plan was generated. Execution is not automatic yet; the build-and-test worker pipeline still needs to be connected.'
      : 'A preliminary plan was created. Configure an AI planning provider for request-specific planning; this is not a completed tool.'
  };
}
