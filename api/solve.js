export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { problem, imageBase64 } = req.body;

  const prompt = `You are an expert math tutor. Your job is ONLY to solve math problems.

First, check if the input is a valid math problem. If it is NOT a math problem (e.g. it's a general question, random text, or something unrelated to math), respond with exactly this format:
NOT_MATH: [friendly message explaining you can only solve math problems]

If it IS a math problem, solve it step by step using this format:
- Start each step with "Step 1:", "Step 2:", etc.
- State what you are doing in that step in plain English
- If a formula is used, write it on its own line starting with "Formula:"
- Show the calculation clearly
- Explain why you are doing this step
- End with "Final Answer:" and the result

If the problem has no solution (like an impossible equation), explain clearly why there is no solution and what that means.

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
        temperature: 0.3
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}