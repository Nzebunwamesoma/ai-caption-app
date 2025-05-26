const apiKey = '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'; // ← Replace this with your real OpenAI key

async function generateCaption() {
  const content = document.getElementById("postContent").value.trim();
  const tone = document.getElementById("tone").value;
  const output = document.getElementById("output");

  if (!content) {
    output.textContent = "Please describe your post.";
    return;
  }

  output.textContent = "Generating... Please wait.";

  try {
    const prompt = `Write an engaging Instagram caption in a ${tone} tone for this post: "${content}". Also suggest 5 relevant hashtags.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || "No reply from AI.";
    output.textContent = aiReply;

  } catch (error) {
    console.error(error);
    output.textContent = "❌ Error generating caption.";
  }
}
