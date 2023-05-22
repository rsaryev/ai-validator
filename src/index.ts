import { ZodSchema, ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { throwNoZodSchemaProvided } from './error';

export class AiValidator<T extends ZodType> {
  private readonly values: (string | number | T)[];
  private readonly schema: T;

  constructor(private readonly strings: TemplateStringsArray, ...values: (string | number | T)[]) {
    this.values = values ?? [];
    this.schema = this.getZodSchema();
  }

  public prompt(): string {
    const promptAnswer = this.getPromptAnswer(this.schema);
    const valuesWithPrompt = this.values.map((v) => (this.isZodSchema(v) ? promptAnswer : v));
    return `${this.strings.map((s) => `${s}${valuesWithPrompt.shift() ?? ''}`).join('')}`.trim();
  }

  public parse(output: string): ReturnType<T['parse']> {
    const json = this.removeJsonCodeBlock(output);
    return this.schema.parse(JSON.parse(json));
  }

  public static input<T extends ZodType>(
    strings: TemplateStringsArray,
    ...values: (string | number | T)[]
  ): AiValidator<T> {
    return new AiValidator(strings, ...values);
  }

  private isZodSchema(value: any): value is T {
    return (
      value instanceof ZodSchema || value instanceof ZodType || Object.prototype.hasOwnProperty.call(value, 'parse')
    );
  }

  private getZodSchema(): T {
    const zodSchema = this.values.find((v: any) => this.isZodSchema(v)) as T;
    if (!zodSchema) throwNoZodSchemaProvided();
    return zodSchema;
  }

  private getPromptAnswer(zodSchema: ZodSchema): string {
    const jsonSchema = JSON.stringify(zodToJsonSchema(zodSchema));
    return `\nAnswer constraints:
- answer must not contain any explanations or other information that is not JSON.
- answer must successfully validate against the following "JSON Schema" and must be data that matches the "JSON Schema", not the schema itself.
- answer will be parsed as JSON via the JSON.parse() method.
Here is the JSON Schema:\n\`\`\`json\n${jsonSchema}\n\`\`\`\n`;
  }

  private removeJsonCodeBlock(output: string): string {
    return output.replace(/```(?:json)?\n?([\s\S]*?)```/, '$1').replace(/,\s*([\]}])/g, '$1');
  }
}
