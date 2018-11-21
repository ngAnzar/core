import { Injectable, Inject, Injector } from "@angular/core"
import { Observable, Observer, of } from "rxjs"

import { DataSource, Model, ID, Field, Filter, Sorter, Range } from "../data.module"
import { GOOGLE_API_KEY } from "./api-key"
import { ScriptService } from "../services/script.service"
import { IAutocompleteModel, Match } from "../select.module"


@Injectable()
export class LocationService {
    public constructor(
        @Inject(Injector) protected injector: Injector,
        @Inject(ScriptService) protected scripts: ScriptService,
        @Inject(GOOGLE_API_KEY) protected apiKey: string) {

    }

    public getLocationSource(): Observable<LocationDataSource> {
        return Observable.create((observer: Observer<LocationDataSource>) => {
            const s = this.scripts.load(`https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`)
                .subscribe(script => {
                    try {
                        const service = this.injector.get(LocationDataSource)
                        observer.next(service)
                    } catch (e) {
                        observer.error(e)
                    }
                })

            return () => {
                s.unsubscribe()
            }
        })
    }
}


export class Location extends Model implements IAutocompleteModel {
    @Field({ name: "matched_substrings", listOf: Match }) public matches: Match[]
    @Field({ name: "description" }) public label: string
}


export class LocationDataSource<T extends Location = Location> extends DataSource<T> {
    public readonly async = true
    public readonly model: any = Location

    public get service(): google.maps.places.AutocompleteService {
        if (!this._service) {
            this._service = new google.maps.places.AutocompleteService()
        }
        return this._service
    }
    protected _service: google.maps.places.AutocompleteService

    protected _search(f?: Filter<T>, s?: Sorter<T>, r?: Range): Observable<T[]> {
        if (!f || !f.label) {
            return of([])
        }

        let query = {} as google.maps.places.AutocompletionRequest
        if (typeof f.label !== "string") {
            return Observable.throw(new Error("Invalid type of filter"))
        } else {
            query.input = f.label
        }

        return Observable.create((observer: Observer<T[]>) => {
            this.service.getPlacePredictions(query, (result, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    observer.next(result as any)
                } else {
                    observer.error(new Error(`Google maps search returned with this status: ${status}`))
                }
            })
        })
    }

    protected _get(id: ID): Observable<T> {
        return Observable.create((observer: Observer<T>) => {
        })
        throw new Error("not implements")
    }

    protected _save(model: T): Observable<T> {
        throw new Error("not implements")
    }

    protected _delete(id: ID): Observable<boolean> {
        throw new Error("not implements")
    }

    public getPosition(id: ID): Observable<number> {
        throw new Error("not implements")
    }
}
