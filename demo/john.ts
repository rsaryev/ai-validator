import { Configuration, OpenAIApi } from 'openai';
import { z } from 'zod';
import { AiValidator } from 'ai-validator';
import dotenv from 'dotenv';

dotenv.config();
const configuration = new Configuration({ apiKey: process.env.API_KEY });
const openai = new OpenAIApi(configuration);

async function main() {
  const schema = z.object({
    name: z.string().describe('Name of the person'),
    age: z.number().describe('Age of the person'),
  });
  const validator = AiValidator.input`My name is ${'John'}. I am ${30} years old. ${schema}`;
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: validator.prompt() }],
  });

  const parsed = validator.parse(completion.data.choices[0].message?.content);
  console.log(parsed); // { name: 'John', age: 30 }
}

main();
