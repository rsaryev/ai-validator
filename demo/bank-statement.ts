import { Configuration, OpenAIApi } from 'openai';
import { z } from 'zod';
import { AiValidator } from 'ai-validator';
import * as dotenv from 'dotenv';

dotenv.config();
const configuration = new Configuration({ apiKey: process.env.API_KEY });
const openai = new OpenAIApi(configuration);

async function main() {
  const schema = z.object({
    accountNumber: z.string().describe('Account number'),
    transactions: z
      .array(
        z.object({
          type: z.enum(['debit', 'credit']).describe('Type of transaction'),
          amount: z.number().describe('Amount of transaction'),
          date: z.string().describe('Date of transaction'),
        }),
      )
      .describe('Transactions on the account'),
    balance: z.number().describe('Sum of all transactions (debit negative, credit positive)'),
  });

  const bankStatement =
    'There were three transactions on account number "123456789": a debit of $100 on May 1, 2023, a credit of $200 on May 15, 2023, and a debit of $50 on May 22, 2023.';

  const validator = AiValidator.input`${bankStatement} ${schema}`;
  const prompt = validator.prompt();

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });

  const parsed = validator.parse(completion.data.choices[0].message?.content);
  console.log(parsed);
  // {
  //   accountNumber: '123456789',
  //   transactions: [
  //     { type: 'debit', amount: 100, date: '2023-05-01' },
  //     { type: 'credit', amount: 200, date: '2023-05-15' },
  //     { type: 'debit', amount: 50, date: '2023-05-22' },
  //   ],
  //   balance: 50,
  // };
}

main();
