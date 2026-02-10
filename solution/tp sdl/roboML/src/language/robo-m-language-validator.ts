import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { RoboMLanguageAstType, Person } from './generated/ast.js';
import type { RoboMLanguageServices } from './robo-m-language-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: RoboMLanguageServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.RoboMLanguageValidator;
    const checks: ValidationChecks<RoboMLanguageAstType> = {
        Person: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class RoboMLanguageValidator {

    checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
        if (person.name) {
            const firstChar = person.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
            }
        }
    }

}
