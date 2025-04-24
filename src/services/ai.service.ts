import {OpenAI} from "openai"
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
})

export const extractSubscriptionDetails = async (text: string) => {
  const prompt = `
  You are an AI assistant tasked with extracting subscription details from text. For each entry, extract the following information with correct format told:

  1. **Service Name**: The name of the service or subscription.
  2. **Amount**: The billing amount (e.g., $20.99). The data type should be string.
  3. **Last Renewal Date**: The date when the service was last billed or renewed. The date format should be in **month/day/year**.
  4. **Frequency**: Determine the frequency of the subscription:
    - If the same service name appears every month, label it as "monthly."
    - If the service appears less frequently, label it as "yearly."
    - For other patterns (e.g., every 3 months), label the frequency accordingly.
  5. **category**: Determine the category of the service according to your knowledge. Value should be either Productivity or Entertainment.

  ### Rules:
  - Only include unique service entries:
    - Do not include services with the same name more than once in the same month.
    - To determine the frequency, analyze all occurrences of the same service name and calculate how often they appear across the data.
    - If no explicit renewal date is mentioned, infer the "Last Renewal Date" from the context or use the email timestamp.
    - Respond with only the JSON array containing the extracted details.
    - Do not include any comments, explanations, or extra text in your response. Only provide the JSON array.
    - Ensure the JSON is valid and parsable.

  ### Output Format:
  [
    {
      "service": "<name>",
      "amount": "<amount>",
      "lastRenewalDate": "<date>",
      "frequency": "<frequency>",
      "category":"<category>"
    }
  ]

  Most important rules:- 
  1. Only provide the JSON response. Do not include any extra text.
  2. Always remember , The date format should always be in the format, month/day/year.
  3. Frequency values should always be either monthly or yearly


  `;
  const response = await client.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: text },
    ],
  })
  return JSON.parse(response.choices[0].message.content!)
}