import { Pipe, PipeTransform } from "@angular/core"


@Pipe({ name: "nl2br" })
export class Nl2BrPipe implements PipeTransform {
    transform(value: string, args: string[]): any {
        if (!value) {
            return value
        }
        return `${value}`.replace(/\r?\n/g, "$1<br/>$2")
    }
}
