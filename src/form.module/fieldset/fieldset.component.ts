import { Component, ContentChild, TemplateRef } from "@angular/core"

@Component({
    selector: ".nz-fieldset",
    templateUrl: "./fieldset.component.pug"
})
export class FieldsetComponent {
    @ContentChild("legend", { static: true, read: TemplateRef }) public readonly legend: TemplateRef<any>
}
