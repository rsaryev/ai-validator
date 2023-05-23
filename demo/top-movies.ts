import { Configuration, OpenAIApi } from 'openai';
import { z } from 'zod';
import { AiValidator } from 'ai-validator';
import dotenv from 'dotenv';

dotenv.config();
const configuration = new Configuration({ apiKey: process.env.API_KEY });
const openai = new OpenAIApi(configuration);

async function main() {
  const schema = z.array(
    z.object({
      name: z.string().describe('Name of the movie'),
      year: z.number().describe('Year of the movie'),
      rank: z.number().describe('Rank of the movie'),
    }),
  );
  const validator = AiValidator.input`Top 5 movies: ${schema}`;
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: validator.prompt() }],
  });

  const parsed = validator.parse(completion.data.choices[0].message?.content);
  console.log(parsed);
  // [
  //     { name: 'Inception', year: 2010, rank: 1 },
  //     { name: 'The Dark Knight', year: 2008, rank: 2 },
  //     { name: 'Pulp Fiction', year: 1994, rank: 3 },
  //     { name: 'The Godfather', year: 1972, rank: 4 },
  //     { name: 'Fight Club', year: 1999, rank: 5 }
  // ]
}

main();
