export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { problem, imageBase64 } = req.body;

  const prompt = `You are an expert math tutor. Your job is ONLY to solve math problems.

First check if the input is a valid math problem. If it is NOT, respond with exactly:
NOT_MATH: [friendly message saying you only solve math problems]

If it IS a math problem, respond ONLY with a valid JSON array. No explanation outside the JSON. Format:
[
  {
    "title": "Short title of what this step does",
    "explanation": "In plain English, explain what we are doing in this step and WHY before we do it",
    "lines": [
      "First line of working...",
      "Second line of working...",
      "= result"
    ],
    "formula": "Formula used in this step, or null if none",
    "is_final": false
  },
  ...
  {
    "title": "Final Answer",
    "explanation": "Summary of what we found",
    "lines": ["Final answer here"],
    "formula": null,
    "is_final": true
  }
]

Rules:
- Each step must have explanation FIRST, then lines of working
- Break every calculation into individual lines — never solve in one line
- If differentiating, show each term separately line by line
- formula field: write the actual formula used (e.g. "d/dx(xⁿ) = nxⁿ⁻¹") or null
- If no solution exists, explain why in the steps
- Return ONLY the JSON array, nothing else

Math Problem: ${problem || "Solve the problem shown in the image"}`;

  const messages = imageBase64
    ? [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: prompt }
      ]}]
    : [{ role: 'user', content: prompt }];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: imageBase64 ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 2048,
        temperature: 0.2
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}