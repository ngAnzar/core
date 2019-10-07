import { Observable } from "rxjs"


export abstract class ExlistSwitchHandler<T> {
    public abstract canSwitch(from: T | null, to: T | null): Observable<boolean>
}
