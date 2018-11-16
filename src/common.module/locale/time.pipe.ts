import { Pipe, PipeTransform } from "@angular/core"
import { format } from "date-fns"


@Pipe({
    name: "nzTime"
})
export class TimePipe implements PipeTransform {
    public transform(value: Date): string {
        return format(value, "HH:mm")
    }
}
