import { AiValidator } from './index';
import { z } from 'zod';
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

jest.setTimeout(10000);
describe('AiValidator', () => {
  describe('prompt', () => {
    it('should return a prompt with JSON schema', () => {
      const schema = z.object({
        name: z.string().describe('Name of the person'),
        age: z.number().describe('Age of the person'),
      });
      const validator = AiValidator.input`My name is ${'John'}. I am ${30} years old. ${schema}`;

      expect(validator.prompt()).toMatchInlineSnapshot(`
        "My name is John. I am 30 years old. 
        Answer constraints:
        - answer must not contain any explanations or other information that is not JSON.
        - answer must successfully validate against the following "JSON Schema" and must be data that matches the "JSON Schema", not the schema itself.
        - answer will be parsed as JSON via the JSON.parse() method.
        Here is the JSON Schema:
        \`\`\`json
        {"type":"object","properties":{"name":{"type":"string","description":"Name of the person"},"age":{"type":"number","description":"Age of the person"}},"required":["name","age"],"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}
        \`\`\`"
      `);
    });
  });

  describe('parse', () => {
    it('should parse valid JSON input', () => {
      const schema = z.object({
        name: z.string().describe('Name of the person'),
        age: z.number().describe('Age of the person'),
      });
      const validator = AiValidator.input`My name is ${'John'}. I am ${30} years old. ${schema}`;

      const input = `{
        "name": "John",
        "age": 30
      }`;

      expect(validator.parse(input)).toEqual({
        name: 'John',
        age: 30,
      });
    });

    it('should throw an error for invalid JSON input', () => {
      const schema = z.object({
        name: z.string().describe('Name of the person'),
        age: z.number().describe('Age of the person'),
      });
      const validator = AiValidator.input`My name is ${'John'}. I am ${30} years old. ${schema}`;

      const input = `{
        "name": "John",
        "age": "30"
      }`;

      expect(() => validator.parse(input)).toThrow();
    });
  });

  describe('integration', () => {
    it('should work with OpenAI', async () => {
      const schema = z.object({
        name: z.string().describe('Name of the person'),
        age: z.number().describe('Age of the person'),
      });
      const validator = AiValidator.input`My name is ${'John'}. I am ${30} years old. ${schema}`;

      const configuration = new Configuration({ apiKey: process.env.API_KEY });
      const openai = new OpenAIApi(configuration);
      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: validator.prompt() }],
      });
      const parsed = validator.parse(completion.data.choices[0].message?.content);
      expect(parsed).toEqual({
        name: 'John',
        age: 30,
      });
    });
  });
});
