export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { problem, imageBase64 } = req.body;

  const prompt = `You are an expert math tutor. Solve the following math problem step by step.

For each step:
- Start with "Step 1:", "Step 2:", etc.
- State what you are doing in that step in plain English
- If a formula is used, write it clearly on its own line starting with "Formula:"
- Show the calculation clearly
- Explain why you are doing this step

At the end, clearly state the final answer.

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