import { HfInference } from "@huggingface/inference";

export const extractSubscriptionDetails = async (text: string) => {
  const client = new HfInference(process.env.HUGGING_API_KEY)
  const prompt = `
  You are an AI assistant tasked with extracting subscription details from text. For each entry, extract the following information:

  1. **Service Name**: The name of the service or subscription.
  2. **Amount**: The billing amount (e.g., $20.99).
  3. **Last Renewal Date**: The date when the service was last billed or renewed. The date format should be in month/day/year.
  4. **Frequency**: Determine the frequency of the subscription:
    - If the same service name appears every month, label it as "monthly."
    - If the service appears less frequently, label it as "yearly."
    - For other patterns (e.g., every 3 months), label the frequency accordingly.

  ### Rules:
  - Only include unique service entries:
    - Do not include services with the same name more than once in the same month.
    - To determine the frequency, analyze all occurrences of the same service name and calculate how often they appear across the data.
  - If no explicit renewal date is mentioned, infer the "Last Renewal Date" from the context or use the email timestamp.

  ### Output Format:
  [
    {
      "service": "<name>",
      "amount": "<amount>",
      "lastRenewalDate": "<date>",
      "frequency": "<frequency>"
    }
  ]

  Only provide the JSON response. Do not include any extra text.
  `;
  const response = await client.chatCompletion({
    model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: text },
    ],
    temperature: 0.5,
    max_tokens: 5000,
  })
  return JSON.parse(response.choices[0].message.content!)
}