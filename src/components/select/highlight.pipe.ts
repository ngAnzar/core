import { Pipe, PipeTransform } from "@angular/core"


@Pipe({ name: "highlight" })
export class HighlightPipe implements PipeTransform {
    transform(value: any, ...args: any[]) {
        return `<b>${value}</b>`
    }
}
