import { Directive, Input } from "@angular/core"


@Directive({
    selector: ".az-ripple"
})
export class Ripple {
    @Input() variant: string = "default"
    @Input() unbounded: boolean = false
    @Input() centered: boolean = false
    @Input() radius: number = 0


}
