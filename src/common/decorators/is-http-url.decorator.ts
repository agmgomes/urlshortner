import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsHttpUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isHttpUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must start with "http://" or "https://"`;
        },
      },
    });
  };
}