import { Validator, AbstractControl, ValidationErrors } from "@angular/forms"

export class InvalidDateValidator implements Validator {
    public isValid: boolean = true

    public validate(ctrl: AbstractControl): ValidationErrors | null {
        if (this.isValid) {
            return null
        } else {
            return { invalidDatetime: true }
        }
    }
}
