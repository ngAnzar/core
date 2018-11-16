// import { Directive, Input, ElementRef, Inject, OnDestroy } from "@angular/core"
// import { Subscription } from "rxjs"


// import { InputComponent } from "../components/input/input.component"


// @Directive({
//     selector: "label, .nz-label",
//     host: {
//         "class": "nz-label",
//         "[attr.for]": "inputId"
//     }
// })
// export class LabelDirective {
//     @Input("for") public inputId: string

//     public set input(val: InputComponent<any>) {
//         if (this._input !== val) {
//             this._input = val

//             if (val) {
//                 this.inputId = val.id
//             }
//         }
//     }

//     public get input(): InputComponent<any> {
//         return this._input
//     }

//     protected _input: InputComponent<any>

//     public constructor(@Inject(ElementRef) protected el: ElementRef<HTMLLabelElement>) {

//     }
// }


import { Directive } from "@angular/core"


@Directive({ selector: "label" })
export class LabelDirective { }
