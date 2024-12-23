import { HfInference } from "@huggingface/inference";

export const extractSubscriptionDetails = async (text: string) => {
  const client = new HfInference(process.env.HUGGING_API_KEY)
  const prompt = `
    You are an AI assistant tasked with extracting subscription details from text. 
    For each entry, extract:
    - Service Name
    - Amount
    - Renewal Date
    - Frequency (monthly, yearly, etc.)
    Return only valid subscription entries. Format as:
    [{"service": "<name>", "amount": "<amount>", "renewalDate": "<date>", "frequency": "<frequency>"}]
  `;
  const response = await client.chatCompletion({
    model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: text },
    ],
    temperature: 0.5,
    max_tokens: 5000,
  });
  return JSON.parse(response.choices[0].message.content!);
};
