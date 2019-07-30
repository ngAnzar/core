import { Component, HostBinding } from "@angular/core"

import { Model, Field } from "../../../data.module"
import { INPUT_MODEL, InputComponent } from "../abstract"


export class FileModel extends Model {
    @Field({ primary: true }) public id: string
    @Field() public title: string
    @Field() public size: number
}


@Component({
    selector: ".nz-file-input",
    templateUrl: "./file.component.pug",
    providers: INPUT_MODEL
})
export class FileInputComponent extends InputComponent<FileModel[]> {
    @HostBinding("attr.tabindex") public tabIndexAttr = -1

    public _renderValue(value: FileModel[]) {

    }

    public onFileChange(event: Event) {
        console.log(event)
    }
}
