export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { profile } = req.body;
  if (!profile) {
    return res.status(400).json({ error: 'Missing profile' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const prompt = `You are an Ontario small business grant specialist with deep knowledge of all 2025-2026 provincial and federal funding programs available to Ontario businesses.

Based on the following business profile, identify every grant, tax credit, loan program, and funding initiative this business likely qualifies for.

BUSINESS PROFILE:
${profile}

For each program provide:
- Program name and administering body
- Maximum amount available
- What it covers / eligible expenses
- Key eligibility criteria this business meets
- Application deadline or intake period if known
- Where to apply (URL or office)

Structure your response as follows:
1. Start with a 2-sentence summary of the top opportunity for this specific business
2. List programs in order of value (highest dollar amount first)
3. End with a "Quick wins" section — programs with the easiest or fastest application process
4. Add a note about any SR&ED or HST credits that may apply

Be specific to Ontario. Include programs from: Ontario Ministry of Economic Development, FedDev Ontario, BDC, EDC, IRAP (NRC), ISED, CRA tax credits, and relevant municipal programs for their city. If the owner background qualifies them for diversity grants, include those specifically.

Be thorough — the goal is to find every dollar this business may be leaving on the table.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Anthropic API error');
    }

    const report = data.content.map(b => b.text || '').join('');
    return res.status(200).json({ report });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
