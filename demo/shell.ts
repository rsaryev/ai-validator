import { Configuration, OpenAIApi } from 'openai';
import { z } from 'zod';
import { AiValidator } from 'ai-validator';
import * as dotenv from 'dotenv';

dotenv.config();
const configuration = new Configuration({ apiKey: process.env.API_KEY });
const openai = new OpenAIApi(configuration);

async function shell() {
  const schema = z.array(
    z.object({
      description: z.string().describe('Description of the command'),
      shellCommand: z.string().describe('Shell command to run'),
      isDangerous: z.boolean().describe('Whether the command is dangerous'),
    }),
  );

  const validator = AiValidator.input`Write a command to install node.js 18.16.0 and print the version.
  ${schema}
  The current working directory is ${process.cwd()}
  The current operating system is ${process.platform}
  `;
  const prompt = validator.prompt();

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });

  const parsed = validator.parse(completion.data.choices[0].message?.content);
  console.log(parsed);
  // [  {
  //     description: 'Install node.js 18.16.0',
  //     shellCommand: 'nvm install 18.16.0 && nvm use 18.16.0',
  //     isDangerous: false
  //   },
  //   {
  //     description: 'Print node.js version',
  //     shellCommand: 'node --version',
  //     isDangerous: false
  //   }
  // ]
}

shell();
